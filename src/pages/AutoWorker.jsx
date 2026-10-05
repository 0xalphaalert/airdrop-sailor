import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { DYNAMIC_REGISTRY } from '../studio/registry/dynamicRegistry';

// Initialize Supabase 2 client for the publishing pipeline
const engineUrl = import.meta.env.VITE_SUPABASE_2_URL;
const engineKey = import.meta.env.VITE_SUPABASE_2_ANON_KEY;
const engineClient = createClient(engineUrl, engineKey);

export default function AutoWorker() {
  const [searchParams] = useSearchParams();
  const canvasRef = useRef(null);

  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);

  // The canvas renders from state, so React mounts the template into the DOM
  // before the capture phase reads canvasRef.outerHTML.
  const [canvasState, setCanvasState] = useState({ Component: null, data: null });

  // Phase 1: fetch + format, then hand the component to the canvas via state.
  useEffect(() => {
    const prepare = async () => {
      try {
        const templateId = searchParams.get('template_id');
        const recordId = searchParams.get('record_id');

        if (!templateId || !recordId) {
          throw new Error('Missing required parameters: template_id or record_id');
        }

        // The Edge Function passes payload.schedules as a JSON array of
        // { platform, scheduled_time } objects.
        let schedules = [];
        const rawSchedules = searchParams.get('schedules');
        if (rawSchedules) {
          try {
            const parsed = JSON.parse(rawSchedules);
            if (Array.isArray(parsed)) schedules = parsed;
          } catch {
            throw new Error('Invalid schedules parameter: expected a JSON array');
          }
        }

        setStatus('Fetching record data from Supabase 1...');

        const { data: recordData, error: fetchError } = await supabase
          .from('funding_opportunities')
          .select('*')
          .eq('id', recordId)
          .single();

        if (fetchError) throw new Error(`Failed to fetch record: ${fetchError.message}`);
        if (!recordData) throw new Error('Record not found');

        setStatus('Fetching template design...');

        const { data: designData, error: designError } = await supabase
          .from('template_designs')
          .select('*')
          .eq('template_id', templateId)
          .eq('active', true)
          .order('display_order')
          .limit(1)
          .single();

        if (designError) throw new Error(`Failed to fetch template design: ${designError.message}`);
        if (!designData) throw new Error('Template design not found');

        const Component = DYNAMIC_REGISTRY[designData.component_name];
        if (!Component) {
          throw new Error(`Component not found in registry: ${designData.component_name}`);
        }

        // Funding is read strictly from the project page funding column.
        const funding = recordData.funding;

        const formattedData = {
          raw: {
            ...recordData,
            funding,
            funding_amount: funding
          },
          investorLogos: {},
          selectedItems: [{
            id: recordData.id,
            name: recordData.project_name,
            amount: funding,
            round: recordData.round,
            logo: recordData.project_logo,
            raw: { ...recordData, funding, funding_amount: funding }
          }],
          sourceData: []
        };

        setStatus('Rendering design canvas...');
        setCanvasState({ Component, data: formattedData, recordData, templateId, recordId, schedules });
      } catch (err) {
        console.error('Ghost Worker prepare error:', err);
        setError(err.message);
        setStatus('Pipeline failed');
      }
    };

    prepare();
  }, [searchParams]);

  // Phase 2: once the canvas has the component mounted, capture and publish.
  useEffect(() => {
    if (!canvasState.Component) return;

    let cancelled = false;

    const publish = async () => {
      try {
        // Wait 2 seconds for fonts/images inside the template to settle.
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (cancelled) return;

        if (!canvasRef.current) throw new Error('Canvas element not found');

        setStatus('Capturing HTML...');

        const canvasHtml = canvasRef.current.outerHTML;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');body { margin: 0; padding: 0; background: #ffffff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style></head><body>${canvasHtml}</body></html>`;

        setStatus('Generating screenshot via Browserless...');

        const screenshotResponse = await fetch(`${engineUrl}/functions/v1/generate-screenshot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${engineKey}`,
            'apikey': engineKey
          },
          body: JSON.stringify({
            html: fullHtml,
            options: { type: 'png' },
            gotoOptions: { waitUntil: 'networkidle2' },
            viewport: { width: 1200, height: 675, deviceScaleFactor: 2 }
          })
        });

        if (!screenshotResponse.ok) {
          const errorText = await screenshotResponse.text();
          throw new Error(`Screenshot generation failed: ${errorText}`);
        }

        const blob = await screenshotResponse.blob();
        if (cancelled) return;

        setStatus('Uploading to Supabase 2 storage...');

        const fileName = `auto_worker_${canvasState.recordId}_${Date.now()}.png`;
        const { error: uploadError } = await engineClient.storage
          .from('social-media-assets')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = engineClient.storage
          .from('social-media-assets')
          .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        setStatus('Building post text...');

        const record = canvasState.recordData;
        // Funding is read strictly from the project page funding column.
        const funding = record.funding;
        // Project name comes from the footer project name field, never the username/handle.
        const projectName = record.project_name;
        const contentText = `${projectName} raised ${funding || 'an undisclosed amount'}${record.round ? ` in its ${record.round} round` : ''}.`;

        // Official slug from the projects relation / record, with a name-derived fallback.
        const projectSlug =
          record.projects?.slug ||
          record.slug ||
          (projectName
            ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            : null);

        setStatus('Queueing multi-platform schedules...');

        // Step 6: Build one row per platform from the schedules array supplied by the Edge Function.
        const schedules = Array.isArray(canvasState.schedules) ? canvasState.schedules : [];
        if (schedules.length === 0) {
          throw new Error('No schedules provided in payload.schedules');
        }

        const insertQueue = schedules.map((s) => ({
          platform: s.platform,
          content_text: contentText,
          image_url: imageUrl,
          scheduled_time: s.scheduled_time,
          status: 'scheduled',
          project_slug: projectSlug
        }));

        setStatus(`Inserting ${insertQueue.length} scheduled post(s) into social_posts...`);

        const { error: insertError } = await engineClient
          .from('social_posts')
          .insert(insertQueue);

        if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

        setStatus('Pipeline completed successfully');
        console.log('Ghost Worker Pipeline Success:', {
          recordId: canvasState.recordId,
          templateId: canvasState.templateId,
          imageUrl,
          projectSlug,
          scheduled: insertQueue.map(q => ({ platform: q.platform, scheduled_time: q.scheduled_time }))
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Ghost Worker publish error:', err);
        setError(err.message);
        setStatus('Pipeline failed');
      }
    };

    publish();

    return () => { cancelled = true; };
  }, [canvasState]);

  const { Component, data } = canvasState;
  const isDone = status === 'Pipeline completed successfully';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Off-screen design canvas — strictly white, fixed 1200x675 */}
      <div
        ref={canvasRef}
        className="absolute -left-[9999px] top-0 overflow-hidden"
        style={{ width: '1200px', height: '675px', backgroundColor: '#ffffff' }}
      >
        {Component && <Component data={data} />}
      </div>

      {/* Status panel */}
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            error ? 'bg-rose-50' : isDone ? 'bg-emerald-50' : 'bg-blue-50'
          }`}>
            {error ? (
              <span className="text-2xl font-black text-rose-500">!</span>
            ) : isDone ? (
              <span className="text-2xl font-black text-emerald-600">✓</span>
            ) : (
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 text-center mb-4 tracking-tight">
          Ghost Worker Pipeline
        </h1>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Status</p>
          <p className="text-xs font-bold text-slate-700 text-center">{status}</p>
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 rounded-xl p-4 border border-rose-200">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Error</p>
            <p className="text-xs font-medium text-rose-700 break-words">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function XActivities() {
  const [status, setStatus] = useState('processing');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const processPost = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const url =
          params.get('url') ||
          params.get('text') ||
          '';

        if (!url) {
          throw new Error('No X post URL was received.');
        }

        // If the share payload puts the URL inside the text field,
        // extract the X/Twitter URL from it.
        let xUrl = url.trim();

        const urlMatch = xUrl.match(
          /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^\s]+/i
        );

        if (urlMatch) {
          xUrl = urlMatch[0].replace(/[)\],.!?]+$/, '');
        }

        if (
          !/^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^/]+\/status\/\d+/i.test(
            xUrl
          )
        ) {
          throw new Error('The shared content does not contain a valid X post URL.');
        }

        setStatus('processing');

        const { data, error: functionError } =
          await supabase.functions.invoke('process-x-post', {
            body: {
              url: xUrl,
            },
          });

        if (functionError) {
          throw new Error(functionError.message || 'Failed to process X post.');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to process X post.');
        }

        if (cancelled) return;

        setResult(data);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;

        console.error('X post processing error:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while processing the X post.'
        );

        setStatus('error');
      }
    };

    processPost();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        {status === 'processing' && (
          <div className="text-center">
            <div className="mx-auto mb-5 w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

            <h1 className="text-2xl font-bold text-slate-900">
              Processing X Post
            </h1>

            <p className="mt-2 text-slate-500">
              Fetching the post and checking the project...
            </p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                ✓
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Research Added
              </h1>

              <p className="mt-1 text-slate-500">
                X post processed successfully.
              </p>
            </div>

            {result.matched ? (
              <>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Project Matched
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {result.project?.name || 'Unknown Project'}
                  </p>

                  <p className="text-sm text-slate-500">
                    @{result.x_handle}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    AI Summary
                  </p>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                    {result.summary}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Research Required
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  @{result.x_handle}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This X account is not currently linked to a project,
                  so the post was saved for research instead of being
                  sent to AI.
                </p>
              </div>
            )}

            {result.x_url && (
              <a
                href={result.x_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-5 text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View original X post →
              </a>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                !
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Couldn’t Process Post
              </h1>

              <p className="mt-3 text-sm leading-6 text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

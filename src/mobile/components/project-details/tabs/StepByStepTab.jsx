// src/mobile/components/project-details/tabs/StepByStepTab.jsx
import React, { useState } from 'react';
import { ChevronRight, Clock, ExternalLink, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function StepByStepTab({ project, tasks }) {
  // State to track which task is currently selected for the popup modal
  const [selectedTask, setSelectedTask] = useState(null);
  
  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days left`;
  };

  // Helper to extract the markdown content identically to desktop
  const guideContent = selectedTask?.tutorial_markdown || selectedTask?.task_article || selectedTask?.description;
  const hasGuide = guideContent && guideContent.trim().length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 relative">
      
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[12px] font-black text-slate-900 tracking-widest uppercase">Action Plan</h2>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold tracking-wide">
            {tasks?.length || 0} Steps
          </span>
        </div>

        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task, idx) => {
              const daysLeft = getDaysLeft(task.end_date) || '120 days left';
              
              return (
                <div key={task.id || idx} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  
                  {/* Timeline Line (Visual only) */}
                  <div className="flex flex-col items-center self-stretch pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1"></div>
                    <div className="w-px h-full bg-slate-100 min-h-[40px]"></div>
                  </div>

                  <div className="flex-grow min-w-0">
                    
                    {/* The Clickable Header Area (Triggers Popup) */}
                    <div 
                      onClick={() => setSelectedTask(task)}
                      className="cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step {idx + 1}</span>
                      <div className="flex justify-between items-start mt-0.5">
                        <div className="pr-4 flex-1">
                          <h3 className="text-[14px] font-bold text-slate-900 leading-tight mb-1">{task.name}</h3>
                          
                          <p className="text-[11px] font-medium text-slate-500 mb-2 line-clamp-1">
                            {task.description || 'Click to view full instructions and complete the action.'}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black tracking-wide uppercase">Easy</span>
                            <span className="text-[10px] font-bold text-slate-600">{daysLeft}</span>
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      </div>
                    </div>

                  </div>
                  
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">No tasks mapped yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ESTIMATED TIME BOX */}
      <div className="bg-white px-5 py-6">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimated Time To Complete</span>
            <span className="text-lg font-black text-slate-900">~{project?.total_time_estimate || 21} mins</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
            <Clock size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 🚀 FULL-SCREEN / BOTTOM SHEET ARTICLE MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          
          {/* Modal Container */}
          <div className="w-full sm:max-w-lg sm:w-[90vw] h-[85vh] sm:h-auto sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl sm:rounded-3xl shrink-0">
              <h3 className="font-black text-slate-900 truncate pr-4 text-lg">{selectedTask.name}</h3>
              <button 
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable Markdown Content) */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              
              {hasGuide ? (
                <div className="prose prose-slate max-w-none 
                  prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
                  prose-h1:text-2xl prose-h1:mb-5
                  prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-5
                  prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm
                  prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-900 prose-strong:font-black
                  prose-ul:list-disc prose-ul:pl-5 prose-li:text-slate-600 prose-li:marker:text-blue-500 prose-li:text-sm
                  prose-ol:list-decimal prose-ol:pl-5
                  prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none prose-code:text-[13px]
                  prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-slate-800
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:font-medium prose-blockquote:text-blue-800 prose-blockquote:not-italic prose-blockquote:shadow-sm
                  prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-slate-200 prose-img:w-full prose-img:object-cover
                  prose-hr:border-slate-100 prose-hr:my-6
                  prose-table:border-collapse prose-table:w-full prose-th:text-left prose-th:p-3 prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-td:text-sm text-slate-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{guideContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center my-4">
                  <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">No specific guide available</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">Participate directly using the official link below.</p>
                </div>
              )}
            </div>

            {/* Modal Footer (Launch Button) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0">
              <a 
                href={selectedTask.task_link || selectedTask.url || selectedTask.link || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-xl text-white text-sm font-black tracking-wide shadow-md shadow-blue-900/20"
                onClick={(e) => {
                  if (!selectedTask.task_link && !selectedTask.url && !selectedTask.link) {
                    e.preventDefault();
                    alert("No URL provided for this task.");
                  }
                }}
              >
                Launch Task <ExternalLink size={16} />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
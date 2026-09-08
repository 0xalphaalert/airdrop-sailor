import React, { useRef, forwardRef } from 'react';
import { Bold, Italic, Heading, Link as LinkIcon, List, ListOrdered, Image as ImageIcon } from 'lucide-react';

const MarkdownEditor = forwardRef(({ value = '', onChange, placeholder = 'Write your content here...' }, ref) => {
  const textareaRef = ref || useRef(null);

  const applyFormatting = (syntaxType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (syntaxType) {
      case 'bold':
        if (selectedText) {
          newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
          cursorOffset = start + selectedText.length + 4;
        } else {
          newText = value.substring(0, start) + '****' + value.substring(end);
          cursorOffset = start + 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
          cursorOffset = start + selectedText.length + 2;
        } else {
          newText = value.substring(0, start) + '**' + value.substring(end);
          cursorOffset = start + 1;
        }
        break;
      case 'heading':
        if (selectedText) {
          newText = value.substring(0, start) + `## ${selectedText}` + value.substring(end);
          cursorOffset = start + selectedText.length + 3;
        } else {
          newText = value.substring(0, start) + '## ' + value.substring(end);
          cursorOffset = start + 3;
        }
        break;
      case 'link':
        if (selectedText) {
          newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
          cursorOffset = start + selectedText.length + 7;
        } else {
          newText = value.substring(0, start) + '[text](url)' + value.substring(end);
          cursorOffset = start + 5;
        }
        break;
      case 'list':
        if (selectedText) {
          newText = value.substring(0, start) + `- ${selectedText}` + value.substring(end);
          cursorOffset = start + selectedText.length + 2;
        } else {
          newText = value.substring(0, start) + '- ' + value.substring(end);
          cursorOffset = start + 2;
        }
        break;
      case 'orderedList':
        if (selectedText) {
          newText = value.substring(0, start) + `1. ${selectedText}` + value.substring(end);
          cursorOffset = start + selectedText.length + 3;
        } else {
          newText = value.substring(0, start) + '1. ' + value.substring(end);
          cursorOffset = start + 3;
        }
        break;
      case 'image':
        newText = value.substring(0, start) + `
![alt text](image-url)
` + value.substring(end);
        cursorOffset = start + 12;
        break;
      default:
        return;
    }

    onChange(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 0);
  };

  const formatActions = [
    { type: 'bold', icon: Bold, label: 'Bold' },
    { type: 'italic', icon: Italic, label: 'Italic' },
    { type: 'heading', icon: Heading, label: 'Heading' },
    { type: 'link', icon: LinkIcon, label: 'Link' },
    { type: 'list', icon: List, label: 'Bullet List' },
    { type: 'orderedList', icon: ListOrdered, label: 'Ordered List' },
    { type: 'image', icon: ImageIcon, label: 'Image' },
  ];

  return (
    <div className="border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1 rounded-t-xl">
        {formatActions.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => applyFormatting(type)}
            className="hover:bg-slate-200 text-slate-600 rounded p-1.5 transition-colors"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[300px] p-4 resize-y focus:outline-none bg-white rounded-b-xl text-slate-700 placeholder:text-slate-400 font-mono text-sm leading-relaxed"
      />
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

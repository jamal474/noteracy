import React, { useState, useEffect, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import '../styles/tiptap.css';
import { Loader2, Check } from 'lucide-react';

const ViewNoteBody = ({ id, title: initialTitle, body: initialBody }) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [body, setBody] = useState(initialBody || '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  
  // Track previous values to only save on actual changes
  const lastSavedRef = useRef({ title: initialTitle, body: initialBody });

  useEffect(() => {
    // Reset state if we switch to a different note
    setTitle(initialTitle || '');
    setBody(initialBody || '');
    lastSavedRef.current = { title: initialTitle, body: initialBody };
    setSaveStatus('idle');
  }, [id, initialTitle, initialBody]);

  useEffect(() => {
    // Auto-save logic
    if (title === lastSavedRef.current.title && body === lastSavedRef.current.body) {
      return; // No changes
    }

    setSaveStatus('saving');

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/dashboard/item/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            title: title || 'Untitled Note', // Default if empty
            body: body || '<p></p>' 
          })
        });

        if (response.ok) {
          lastSavedRef.current = { title, body };
          setSaveStatus('saved');
          
          // Clear 'saved' text after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setSaveStatus('error');
      }
    }, 1000); // Debounce delay

    return () => clearTimeout(timer);
  }, [title, body, id]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full relative">
      {/* Auto-save Status Indicator */}
      <div className="absolute -top-6 right-0 flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
        {saveStatus === 'saving' && (
          <>
            <Loader2 size={12} className="animate-spin" />
            <span>Saving...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check size={12} className="text-green-500" />
            <span>Saved</span>
          </>
        )}
        {saveStatus === 'error' && (
          <span className="text-[var(--color-destructive)]">Error saving</span>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col mt-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full bg-transparent text-3xl font-bold border-none outline-none text-[var(--color-fg)] placeholder:text-[var(--color-muted)] mb-6 px-1"
        />

        <div className="flex-1 overflow-y-auto px-1 pb-20">
          <RichTextEditor content={body} onChange={setBody} />
        </div>
      </div>
    </div>
  );
};

export default ViewNoteBody;
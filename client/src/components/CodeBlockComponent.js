import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { ChevronDown, GripVertical } from 'lucide-react';

const LANGUAGES = [
  { value: '', label: 'auto' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
];

/** Portal-based dropdown so it never clips */
const DropdownPortal = ({ triggerRef, open, children }) => {
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, triggerRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'absolute',
        top: coords.top,
        right: coords.right,
        zIndex: 9999,
        minWidth: 150,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const CodeBlockComponent = ({ node, updateAttributes }) => {
  const { language = '' } = node.attrs;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const wrapperRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.value === (language ?? '')) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        wrapperRef.current && !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const block = (e) => e.stopPropagation();

  return (
    <NodeViewWrapper
      as="section"
      className="code-block-wrapper not-prose group/code my-5 border border-[var(--color-border)] shadow-md relative not-draggable"
      style={{ borderRadius: '0.5rem' }}
      data-type="codeBlock"
    >
      {/* Custom drag handle — uses Tiptap's native data-drag-handle */}
      <div
        className="node-drag-handle"
        contentEditable={false}
        draggable="true"
        data-drag-handle=""
      >
        <GripVertical size={14} />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[var(--color-border)]"
        style={{ borderRadius: '0.5rem 0.5rem 0 0', position: 'relative', zIndex: 2 }}
      >
        <div className="flex items-center gap-1.5" contentEditable={false}>
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>

        {/* Language picker */}
        <div
          contentEditable={false}
          onMouseDown={block}
          onPointerDown={block}
          onClick={block}
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors px-2 py-0.5 rounded-md hover:bg-white/5"
          >
            {currentLang.label}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          <DropdownPortal triggerRef={triggerRef} open={open}>
            <div
              ref={wrapperRef}
              className="max-h-48 overflow-y-auto"
              onMouseDown={block}
              onPointerDown={block}
              onClick={block}
            >
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    textAlign: 'left',
                    color: l.value === (language ?? '') ? 'var(--color-accent)' : 'var(--color-muted)',
                    background: l.value === (language ?? '') ? 'var(--color-surface-raised)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = l.value === (language ?? '') ? 'var(--color-surface-raised)' : ''; e.currentTarget.style.color = l.value === (language ?? '') ? 'var(--color-accent)' : 'var(--color-muted)'; }}
                  onClick={(e) => {
                    block(e);
                    updateAttributes({ language: l.value || null });
                    setOpen(false);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </DropdownPortal>
        </div>
      </div>

      {/* ── Code body ──────────────────────────────────────── */}
      <pre
        className="m-0 p-4 bg-[#0d0d1a] overflow-x-auto leading-relaxed"
        style={{ borderRadius: '0 0 0.5rem 0.5rem' }}
      >
        <NodeViewContent
          as="code"
          className="font-mono text-sm text-[#e2e8f0] whitespace-pre"
        />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;

import React, { useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import Dropcursor from '@tiptap/extension-dropcursor';
import CodeBlock from '@tiptap/extension-code-block';
import CodeBlockComponent from './CodeBlockComponent';
import BulletListComponent from './BulletListComponent';
import OrderedListComponent from './OrderedListComponent';
import TaskListComponent from './TaskListComponent';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, Quote, Code, CheckSquare,
} from 'lucide-react';

/* ─── Toolbar ─────────────────────────────────────────────────── */
const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const Btn = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
        isActive
          ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)]'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-fg)]'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  const Sep = () => <div className="w-px h-4 bg-[var(--color-border)] mx-1" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 mb-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] sticky top-0 z-10 shadow-sm">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()}          isActive={editor.isActive('bold')}           icon={Bold}          title="Bold (⌘B)" />
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()}        isActive={editor.isActive('italic')}         icon={Italic}        title="Italic (⌘I)" />
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}     isActive={editor.isActive('underline')}      icon={UnderlineIcon} title="Underline (⌘U)" />
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()}        isActive={editor.isActive('strike')}         icon={Strikethrough} title="Strikethrough" />
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}    isActive={editor.isActive('bulletList')}     icon={List}          title="Bullet List" />
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}   isActive={editor.isActive('orderedList')}    icon={ListOrdered}   title="Numbered List" />
      <Btn onClick={() => editor.chain().focus().toggleTaskList().run()}      isActive={editor.isActive('taskList')}       icon={CheckSquare}   title="Task List" />
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}    isActive={editor.isActive('blockquote')}     icon={Quote}         title="Blockquote" />
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}     isActive={editor.isActive('codeBlock')}      icon={Code}          title="Code Block" />
    </div>
  );
};

/* ─── Editor ──────────────────────────────────────────────────── */
const RichTextEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
      }),

      Dropcursor.configure({ color: '#FACC15', width: 3 }),

      // ─ Custom draggable NodeViews ─
      // Each has its own [data-drag-handle] element.
      // `draggable: true` tells ProseMirror to drag the whole node.
      //
      // CRITICAL: `className: 'not-draggable'` is passed to ReactNodeViewRenderer.
      // Tiptap's ReactRenderer creates an OUTER <div> that wraps our <NodeViewWrapper>.
      // That outer <div> is a direct child of .ProseMirror, so GlobalDragHandle
      // always finds it. Adding 'not-draggable' to the outer div makes the
      // plugin's `node.closest('.not-draggable')` check succeed and hide its handle.
      CodeBlock.extend({
        draggable: true,
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent, { className: 'not-draggable' });
        },
      }),

      BulletList.extend({
        draggable: true,
        addNodeView() {
          return ReactNodeViewRenderer(BulletListComponent, { className: 'not-draggable' });
        },
      }),

      OrderedList.extend({
        draggable: true,
        addNodeView() {
          return ReactNodeViewRenderer(OrderedListComponent, { className: 'not-draggable' });
        },
      }),

      TaskList.extend({
        draggable: true,
        addNodeView() {
          return ReactNodeViewRenderer(TaskListComponent, { className: 'not-draggable' });
        },
      }),

      Underline,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),

      // GlobalDragHandle handles simple blocks (p, h1-h6, blockquote).
      // Our custom NodeViews have 'not-draggable' on their outer ReactRenderer
      // wrapper, so the plugin's `.closest('.not-draggable')` check will
      // automatically hide the global handle for lists and code blocks.
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
        scrollTreshold: 100,
      }),

      Placeholder.configure({
        placeholder: 'Start writing or drag blocks...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] w-full',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col w-full h-full">
      <MenuBar editor={editor} />
      <div
        className="flex-1 cursor-text px-8"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Heading } from 'lucide-react';
import { useEffect } from 'react';

export function RichTextEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Always store HTML into the value
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Keep editor content in sync if value changes outside (but ignore if user is typing)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))}>
          <Italic size={16} />
        </button>
        <div style={{ width: '1px', backgroundColor: 'var(--border)', margin: '0 4px' }} />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive('heading', { level: 2 }))}>
          <Heading size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive('bulletList'))}>
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))}>
          <ListOrdered size={16} />
        </button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} style={btnStyle(editor.isActive('link'))}>
          <LinkIcon size={16} />
        </button>
      </div>
      <div style={{ padding: '12px', minHeight: '220px', cursor: 'text' }} onClick={() => editor.chain().focus().run()}>
        <style>{`
          .ProseMirror { outline: none; height: 100%; min-height: 200px; }
          .ProseMirror p { margin: 0 0 1em 0; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 20px; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px',
  backgroundColor: active ? 'var(--primary)' : 'transparent',
  color: active ? '#fff' : 'var(--text-muted)',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

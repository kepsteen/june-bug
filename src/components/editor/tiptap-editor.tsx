import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './editor-toolbar'
import { useTheme } from '@/hooks/use-theme'
import { useEffect } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'

interface TiptapEditorProps {
  entryId: Id<'entries'>
  initialContent: string
  onUpdate: (content: string) => void
}

export function TiptapEditor({
  entryId,
  initialContent,
  onUpdate,
}: TiptapEditorProps) {
  const { theme } = useTheme()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your entry...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onUpdate(JSON.stringify(json))
    },
  })

  // Update editor content when initialContent changes (e.g., switching entries)
  useEffect(() => {
    if (editor && initialContent) {
      try {
        const currentContent = JSON.stringify(editor.getJSON())
        if (currentContent !== initialContent) {
          editor.commands.setContent(JSON.parse(initialContent))
        }
      } catch (error) {
        console.error('Failed to parse initial content:', error)
      }
    }
  }, [editor, initialContent])

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="tiptap-wrapper border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  )
}

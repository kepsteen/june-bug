import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Code from '@tiptap/extension-code'
import { EditorBubbleMenu } from './editor-bubble-menu'
import { SlashCommand, getSuggestionItems, renderItems } from './slash-command'
import { useEffect } from 'react'

interface TiptapEditorProps {
  initialContent: string
  onUpdate: (content: string) => void
}

export function TiptapEditor({ initialContent, onUpdate }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        code: false, // Disable code from StarterKit
      }),
      Code.configure({
        HTMLAttributes: {
          class: 'inline-code',
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
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Type "/" for commands...',
        emptyEditorClass: 'is-editor-empty',
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none w-full min-h-[500px] p-4',
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
    <div className="tiptap-wrapper overflow-hidden">
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  )
}

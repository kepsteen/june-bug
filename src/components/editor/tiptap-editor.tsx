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
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

export interface TiptapEditorHandle {
  insertText: (text: string) => void
}

interface TiptapEditorProps {
  initialContent: string
  onUpdate: (content: string) => void
  onPlainTextChange?: (plainText: string) => void
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  ({ initialContent, onUpdate, onPlainTextChange }, ref) => {
    // Track editor state version to prevent stale updates from overwriting in-flight typing
    const editorVersionRef = useRef(0)
    const propVersionRef = useRef(0)

    // Track focus state to prevent content resets while user is actively typing
    const [isFocused, setIsFocused] = useState(false)

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
          class: 'prose prose-sm focus:outline-none w-full min-h-[500px] px-4 pt-1 pb-4',
        },
      },
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      onUpdate: ({ editor }) => {
        // Increment editor version when user makes changes
        // This marks the editor state as newer than any pending prop updates
        editorVersionRef.current = propVersionRef.current + 1
        const json = editor.getJSON()
        const jsonString = JSON.stringify(json)
        onUpdate(jsonString)

        // Extract and emit plain text for context-aware prompts
        if (onPlainTextChange) {
          const plainText = editor.getText()
          onPlainTextChange(plainText)
        }
      },
    })

    // Expose insertText method via ref
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (editor) {
          // Insert text at current cursor position, add line break before and after
          editor.chain().focus().insertContent(`\n\n${text}\n\n`).run()
        }
      },
    }))

    // Update editor content when initialContent changes (e.g., switching entries)
    useEffect(() => {
      // Increment prop version to track when new data arrives from parent
      propVersionRef.current++

      if (editor && initialContent) {
        try {
          const currentContent = JSON.stringify(editor.getJSON())

          // Only update editor if:
          // 1. Content is actually different
          // 2. Editor is not focused (user is not actively typing)
          // 3. Prop version is newer than last user edit (prevents stale updates)
          if (
            currentContent !== initialContent &&
            !isFocused &&
            propVersionRef.current > editorVersionRef.current
          ) {
            editor.commands.setContent(JSON.parse(initialContent))
            // Sync editor version after applying prop update
            editorVersionRef.current = propVersionRef.current
          }
        } catch (error) {
          console.error('Failed to parse initial content:', error)
        }
      }
    }, [editor, initialContent, isFocused])

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
)

TiptapEditor.displayName = 'TiptapEditor'

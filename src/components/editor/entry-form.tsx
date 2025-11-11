import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TiptapEditor } from './tiptap-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { toast } from 'sonner'
import { useEffect, useCallback, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import type { Id } from '../../../convex/_generated/dataModel'

const entryFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string(),
})

type EntryFormValues = z.infer<typeof entryFormSchema>

interface EntryFormProps {
  entryId: Id<'entries'>
  initialTitle?: string
  initialContent: string
}

export function EntryForm({
  entryId,
  initialTitle = 'Untitled',
  initialContent,
}: EntryFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const updateEntry = useConvexMutation(api.entries.updateEntry)

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      title: initialTitle,
      content: initialContent,
    },
  })

  const title = watch('title')
  const content = watch('content')

  // Debounced save function
  const debouncedSave = useDebouncedCallback(
    async (values: Partial<EntryFormValues>) => {
      setIsSaving(true)
      try {
        await updateEntry({
          id: entryId,
          ...values,
        })
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to save entry:', error)
        toast.error('Failed to save entry. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    1000, // 1 second debounce
  )

  // Auto-save on title change
  useEffect(() => {
    if (title && title !== initialTitle) {
      debouncedSave({ title })
    }
  }, [title, initialTitle, debouncedSave])

  // Auto-save on content change
  const handleContentUpdate = useCallback(
    (newContent: string) => {
      setValue('content', newContent)
      debouncedSave({ content: newContent })
    },
    [setValue, debouncedSave],
  )

  // Extract plain text from TipTap JSON for search/AI
  const extractPlainText = (jsonContent: string): string => {
    try {
      const parsed = JSON.parse(jsonContent)
      const extractText = (node: any): string => {
        if (node.type === 'text') {
          return node.text || ''
        }
        if (node.content) {
          return node.content.map(extractText).join(' ')
        }
        return ''
      }
      return extractText(parsed).trim()
    } catch {
      return ''
    }
  }

  // Update plain text whenever content changes
  useEffect(() => {
    if (content) {
      const plainText = extractPlainText(content)
      if (plainText) {
        // Save plain text separately (no need to debounce again)
        updateEntry({
          id: entryId,
          plainText,
        }).catch((error) => {
          console.error('Failed to update plain text:', error)
        })
      }
    }
  }, [content, entryId, updateEntry])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with title and save status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title" className="text-lg font-semibold">
            Entry Title
          </Label>
          <div className="text-sm text-muted-foreground">
            {isSaving && <span>Saving...</span>}
            {!isSaving && lastSaved && (
              <span>
                Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter a title for your entry"
          className="text-2xl font-bold h-12"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Editor */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Content</Label>
        <TiptapEditor
          entryId={entryId}
          initialContent={initialContent}
          onUpdate={handleContentUpdate}
        />
      </div>
    </div>
  )
}

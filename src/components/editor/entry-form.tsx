import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TiptapEditor } from './tiptap-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@tanstack/react-query'
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
  entryDate: number // Timestamp of the entry
}

// Format date as "Day, Month DDth, YYYY" (e.g., "Fri, May 5th, 2023")
function formatEntryDate(timestamp: number): string {
  const date = new Date(timestamp)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayOfWeek = dayNames[date.getDay()]
  const month = monthNames[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  return `${dayOfWeek}, ${month} ${day}${getOrdinalSuffix(day)}, ${year}`
}

export function EntryForm({
  entryId,
  initialTitle = 'Untitled',
  initialContent,
  entryDate,
}: EntryFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const { mutateAsync: updateEntry } = useMutation({
    mutationFn: useConvexMutation(api.entries.updateEntry),
  })

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
    <div className="flex flex-col gap-4 px-40 py-4 w-full">
      {/* Date Display */}
      <div className="text-2xl font-bold text-foreground mb-1">
        {formatEntryDate(entryDate)}
      </div>

      {/* Save Status */}
      <div className="text-sm text-muted-foreground mb-2">
        {isSaving && <span>Saving...</span>}
        {!isSaving && lastSaved && (
          <span>
            Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Editor */}
      <TiptapEditor
        initialContent={initialContent}
        onUpdate={handleContentUpdate}
      />
    </div>
  )
}

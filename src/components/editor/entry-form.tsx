import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TiptapEditor } from './tiptap-editor'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { toast } from 'sonner'
import { useEffect, useCallback, useState, useRef } from 'react'
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
  onDirtyChange?: (isDirty: boolean) => void // Callback when dirty state changes
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
  onDirtyChange,
}: EntryFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Track current entryId to prevent stale closures in debounced callbacks
  const entryIdRef = useRef(entryId)
  // Track initial values to prevent unnecessary saves
  const initialTitleRef = useRef(initialTitle)
  const initialContentRef = useRef(initialContent)

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
          id: entryIdRef.current,
          ...values,
        })
        setLastSaved(new Date())
        setIsDirty(false) // Mark as not dirty after successful save
      } catch (error) {
        console.error('Failed to save entry:', error)
        toast.error('Failed to save entry. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    1000, // 1 second debounce
    { maxWait: 2000 }, // Force save after 2 seconds max
  )

  // Update refs and reset state when entry changes
  useEffect(() => {
    entryIdRef.current = entryId
    initialTitleRef.current = initialTitle
    initialContentRef.current = initialContent
    setIsDirty(false)
    setLastSaved(null)
  }, [entryId, initialTitle, initialContent])

  // Auto-save on title change (only if actually different from initial)
  useEffect(() => {
    // Only save if title has changed from the initial value for this entry
    if (title && title !== initialTitleRef.current) {
      setIsDirty(true) // Mark as dirty when title changes
      debouncedSave({ title })
    }
  }, [title, debouncedSave])

  // Auto-save on content change (only if actually different from initial)
  const handleContentUpdate = useCallback(
    (newContent: string) => {
      setValue('content', newContent)
      // Only mark as dirty and save if content has actually changed
      if (newContent !== initialContentRef.current) {
        setIsDirty(true) // Mark as dirty when content changes
        debouncedSave({ content: newContent })
      }
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

  // Update plain text whenever content changes (only if different from initial)
  useEffect(() => {
    // Only update plain text if content has changed from initial value
    if (content && content !== initialContentRef.current) {
      const plainText = extractPlainText(content)
      if (plainText) {
        // Verify we're still on the same entry before saving
        const currentEntryId = entryIdRef.current
        // Save plain text separately (no need to debounce again)
        // Backend will automatically trigger AI title generation when word count >= 100
        updateEntry({
          id: currentEntryId,
          plainText,
        }).catch((error) => {
          // Only log error if we're still on the same entry
          if (entryIdRef.current === currentEntryId) {
            console.error('Failed to update plain text:', error)
          }
        })
      }
    }
  }, [content, updateEntry])

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Cancel pending saves when entryId changes or component unmounts
  useEffect(() => {
    return () => {
      // Cancel any pending debounced saves to prevent stale data from being saved
      debouncedSave.cancel()
    }
  }, [entryId, debouncedSave])

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
            Last saved{' '}
            {lastSaved.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
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

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TiptapEditor } from './tiptap-editor'
import { toast } from 'sonner'
import { useEffect, useCallback, useState, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useEntries } from '@/hooks/use-entries'
import type { JSONContent } from '@tiptap/core'

const entryFormSchema = z.object({
  content: z.string(),
})

type EntryFormValues = z.infer<typeof entryFormSchema>

interface EntryFormProps {
  entryId: string
  initialTitle?: string
  initialContent: JSONContent | string
  entryDate: number // Timestamp of the entry
  onDirtyChange?: (isDirty: boolean) => void // Callback when dirty state changes
  isAuthenticated: boolean
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
  isAuthenticated,
}: EntryFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Track current entryId to prevent stale closures in debounced callbacks
  const entryIdRef = useRef(entryId)
  // Track initial values to prevent unnecessary saves
  const initialContentRef = useRef(
    typeof initialContent === 'string'
      ? initialContent
      : JSON.stringify(initialContent),
  )

  // Use unified entry hook for updates
  const { updateEntry: updateEntryMutation } = useEntries(isAuthenticated)

  const { setValue } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      content:
        typeof initialContent === 'string'
          ? initialContent
          : JSON.stringify(initialContent),
    },
  })

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

  // Debounced save function
  const debouncedSave = useDebouncedCallback(
    async (values: Partial<EntryFormValues>) => {
      setIsSaving(true)
      try {
        // Parse JSON content and extract plain text in a single operation
        const updates: { content?: JSONContent; plainText?: string } = {}
        if (values.content) {
          try {
            updates.content = JSON.parse(values.content)
            // Extract plain text from the same content for search/AI
            // Backend will automatically trigger AI title generation when word count >= 100
            updates.plainText = extractPlainText(values.content)
          } catch {
            console.error('Failed to parse content JSON')
          }
        }

        await updateEntryMutation(entryIdRef.current, updates)
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
    const contentStr =
      typeof initialContent === 'string'
        ? initialContent
        : JSON.stringify(initialContent)
    initialContentRef.current = contentStr
    setIsDirty(false)
    setLastSaved(null)
  }, [entryId, initialContent])

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
    <div className="flex flex-col gap-2 px-40 py-4 w-full relative">
      {/* Date Display */}
      <div className="text-2xl font-bold text-foreground mb-1">
        {formatEntryDate(entryDate)}
      </div>
      <div className="text-sm text-muted-foreground mb-2 min-h-[20px] absolute top-4 right-10">
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
        initialContent={
          typeof initialContent === 'string'
            ? initialContent
            : JSON.stringify(initialContent)
        }
        onUpdate={handleContentUpdate}
      />
    </div>
  )
}

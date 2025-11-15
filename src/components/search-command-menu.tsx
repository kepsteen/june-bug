import { useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { Entry } from '@/lib/entry-utils'
import {
  formatEntryDate,
  filterEntriesBySearch,
  extractPlainTextFromContent,
} from '@/lib/entry-utils'

interface SearchCommandMenuProps {
  entries: Entry[]
  onSelectEntry: (entryId: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommandMenu({
  entries,
  onSelectEntry,
  open,
  onOpenChange,
}: SearchCommandMenuProps) {
  const [search, setSearch] = useState('')

  // Get 7 most recent entries for initial display
  const recentEntries = entries.slice(0, 7)

  // Filter entries based on search term
  const filteredEntries = search.trim()
    ? filterEntriesBySearch(entries, search)
    : recentEntries

  const handleSelect = (entryId: string) => {
    onSelectEntry(entryId)
    onOpenChange(false)
    setSearch('')
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Entries"
      description="Search through your journal entries"
    >
      <CommandInput
        placeholder="Search your entries..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No entries found.</CommandEmpty>
        <CommandGroup
          heading={search.trim() ? 'Search Results' : 'Recent Entries'}
        >
          {filteredEntries.map((entry) => {
            const displayText = entry.aiTitle || formatEntryDate(entry.entryDate)

            // Get searchable text - use plainText if available, otherwise extract from content
            let plainText = entry.plainText || ''
            if (!plainText && entry.content) {
              try {
                const content =
                  typeof entry.content === 'string'
                    ? JSON.parse(entry.content)
                    : entry.content
                plainText = extractPlainTextFromContent(content)
              } catch {
                plainText = ''
              }
            }

            // Create searchable value for cmdk filtering
            const searchableValue = `${displayText} ${plainText} ${entry.aiTitle || ''}`

            return (
              <CommandItem
                key={entry._id}
                value={searchableValue}
                onSelect={() => handleSelect(entry._id)}
                className="cursor-pointer px-3 py-2"
              >
                <span className="text-sm font-medium truncate">
                  {displayText}
                </span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

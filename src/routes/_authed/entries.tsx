import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { PanelLeft, Search, Plus } from 'lucide-react'
import { useResizableSidebar } from '@/hooks/use-resizable-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { EntryForm } from '@/components/editor/entry-form'
import { EntriesSidebar } from '@/components/sidebar/EntriesSidebar'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useConvexMutation, convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { getTodayMidnight } from '@/lib/entry-utils'
import { useEffect, useState } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authed/entries')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    sidebarWidth,
    isCollapsed,
    sidebarRef,
    startResizing,
    toggleCollapse,
  } = useResizableSidebar()

  // State for selected entry and search
  const [selectedEntryId, setSelectedEntryId] = useState<Id<'entries'> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all entries with reactive updates using convexQuery
  const { data: entries, isLoading, error } = useQuery(
    convexQuery(api.entries.getEntries, {})
  )

  // Create entry mutation
  const { mutate: createEntry } = useMutation({
    mutationFn: useConvexMutation(api.entries.createEntry),
  })

  // Create a temporary entry on mount if none exists
  useEffect(() => {
    if (!isLoading && entries && entries.length === 0) {
      createEntry({}, {
        onSuccess: (newEntryId) => {
          setSelectedEntryId(newEntryId)
        },
        onError: (error) => {
          console.error('Failed to create initial entry:', error)
        },
      })
    }
  }, [isLoading, entries, createEntry])

  // Set selected entry to most recent when entries load
  useEffect(() => {
    if (!isLoading && entries && entries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(entries[0]._id)
    }
  }, [isLoading, entries, selectedEntryId])

  // Get the currently selected entry
  const currentEntry = entries?.find(entry => entry._id === selectedEntryId) || null

  // Handle creating a new entry
  const handleNewEntry = () => {
    const todayMidnight = getTodayMidnight()
    createEntry(
      { entryDate: todayMidnight },
      {
        onSuccess: (newEntryId) => {
          setSelectedEntryId(newEntryId)
        },
        onError: (error) => {
          console.error('Failed to create entry:', error)
        },
      }
    )
  }

  // Handle selecting an entry
  const handleSelectEntry = (entryId: Id<'entries'>) => {
    setSelectedEntryId(entryId)
  }

  return (
    <div className="flex h-screen w-full relative">
      {/* Left Button Group - Show single button when open, group when collapsed */}
      {isCollapsed ? (
        <div className="absolute top-[0.5rem] left-[0.5rem] z-10 flex gap-1 bg-background rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleCollapse}
          >
            <PanelLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-[0.75rem] left-[0.75rem] z-10 h-8 w-8"
          onClick={toggleCollapse}
        >
          <PanelLeft className="h-3 w-3" />
        </Button>
      )}

      {/* Right Theme Toggle - Show in button group style when collapsed, standalone when open */}
      {isCollapsed ? (
        <div className="absolute top-[0.5rem] right-[0.5rem] z-10 flex gap-1 bg-background rounded-md p-1">
          <div className="h-8 w-8 flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      ) : (
        <div className="absolute top-[0.75rem] right-[0.75rem] z-10">
          <ThemeToggle />
        </div>
      )}

      {/* Sidebar - Resizable width on left */}
      <EntriesSidebar
        entries={entries || []}
        selectedEntryId={selectedEntryId}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sidebarRef={sidebarRef}
        isCollapsed={isCollapsed}
        sidebarWidth={sidebarWidth}
      />

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="w-1 bg-background cursor-col-resize transition-opacity duration-500"
          onMouseDown={startResizing}
        />
      )}

      {/* Main Content Area with Background */}
      <main
        className={`flex-1 overflow-hidden ${isCollapsed ? 'bg-card' : 'bg-background pt-3'}`}
      >
        <div
          className={`bg-card h-full relative overflow-y-auto ${isCollapsed ? '' : 'rounded-tl-lg shadow-sm border-l'}`}
        >
          {/* Top border that stops before the notch */}
          {!isCollapsed && (
            <div
              className="absolute top-0 left-0 right-0 h-[0.5px] bg-border transition-opacity duration-500 ease-in-out"
              style={{ right: '65px', left: '8px' }}
            />
          )}

          {/* Notch background - Only visible when sidebar is open */}
          {!isCollapsed && (
            <div className="absolute top-0 right-0 transition-opacity duration-500 ease-in-out">
              <svg
                className="absolute top-0 right-0 w-21 h-10 pointer-events-none"
                viewBox="0 0 96 48"
                preserveAspectRatio="none"
              >
                <path
                  d="M 96,0 L 0,0 C 20,0 32,9 32,24 C 32,39 44,48 64,48 L 96,48 Z"
                  className="fill-background"
                />
                <path
                  d="M 0,0 C 20,0 32,9 32,24 C 32,39 44,48 64,48 L 96,48"
                  className="stroke-border fill-none"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}
          <div className="pt-8">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading entry...</div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center p-8">
                <div className="text-destructive">
                  Failed to load entry: {error.message}
                </div>
              </div>
            )}
            {!isLoading && !error && currentEntry && (
              <EntryForm
                entryId={currentEntry._id}
                initialTitle="Untitled"
                initialContent={currentEntry.content}
                entryDate={currentEntry.entryDate}
              />
            )}
            {!isLoading && !error && !currentEntry && (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                  Creating your first entry...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

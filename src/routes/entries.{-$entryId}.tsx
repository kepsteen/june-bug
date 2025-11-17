import {
  createFileRoute,
  useNavigate,
  useBlocker,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { PanelLeft, Search, Plus } from 'lucide-react'
import { useResizableSidebar } from '@/hooks/use-resizable-sidebar'
import { useCollapsibleRightSidebar } from '@/hooks/use-collapsible-right-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { EntryForm, type EntryFormHandle } from '@/components/editor/entry-form'
import { EntriesSidebar } from '@/components/sidebar/EntriesSidebar'
import { PromptsSection } from '@/components/prompts/PromptsSection'
import { getTodayMidnight } from '@/lib/entry-utils'
import { useEffect, useState, useRef } from 'react'
import { useEntries, useEntry } from '@/hooks/use-entries'
import { useConvex } from 'convex/react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import {
  migrateLocalEntriesToDatabase,
  needsMigration,
} from '@/lib/migrate-local-entries'
import { toast } from 'sonner'
import { api } from '@/../convex/_generated/api'
import { FloatingJuneBug } from '@/components/floating-june-bug'
import { SearchCommandMenu } from '@/components/search-command-menu'
import { useSearchCommand } from '@/hooks/use-search-command'
import { useContextPrompts } from '@/hooks/use-context-prompts'
import type { Id } from '@/../convex/_generated/dataModel'

export const Route = createFileRoute('/entries/{-$entryId}')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { entryId } = Route.useParams()
  const context = Route.useRouteContext()
  const convexClient = useConvex()

  // Check if user is authenticated
  const isAuthenticated = !!context.userId

  // Get current user data (name and image from better-auth)
  const { data: currentUser } = useQuery(convexQuery(api.auth.getCurrentUser, {}))

  const {
    sidebarWidth,
    isCollapsed,
    isResizing,
    sidebarRef,
    startResizing,
    toggleCollapse,
  } = useResizableSidebar()

  const {
    isCollapsed: rightSidebarCollapsed,
    toggleCollapse: toggleRightSidebar,
  } = useCollapsibleRightSidebar()

  // Search command menu state
  const { open: searchCommandOpen, setOpen: setSearchCommandOpen } = useSearchCommand()

  // State for search and dirty tracking
  const [searchTerm, setSearchTerm] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [hasMigrated, setHasMigrated] = useState(false)

  // State for June Bug animation and AI prompts
  const [showJuneBugAnimation, setShowJuneBugAnimation] = useState(false)
  const [activePromptType, setActivePromptType] = useState('reflection')
  const [plainTextContent, setPlainTextContent] = useState('')

  // Ref to EntryForm for inserting prompts
  const entryFormRef = useRef<EntryFormHandle>(null)

  // Use unified entry hooks
  const {
    entries,
    isLoading: isLoadingEntries,
    createEntry,
  } = useEntries(isAuthenticated)

  const { entry: currentEntry, isLoading: isLoadingEntry } = useEntry(
    entryId,
    isAuthenticated
  )

  const isLoading = isLoadingEntries || isLoadingEntry

  // Context-aware prompt generation (only when authenticated and user exists)
  useContextPrompts({
    userId: context.userId as Id<'users'>,
    currentContent: plainTextContent,
    activePromptType,
    enabled: isAuthenticated && !!context.userId && !rightSidebarCollapsed,
    debounceMs: 2000,
    minLength: 150,
  })

  // Redirect to onboarding if authenticated but not onboarded
  useEffect(() => {
    if (isAuthenticated && currentUser && !currentUser.isOnboarded) {
      navigate({ to: '/onboarding' })
    }
  }, [isAuthenticated, currentUser, navigate])

  // Migrate local entries to database when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !hasMigrated && needsMigration()) {
      setHasMigrated(true) // Prevent multiple migration attempts

      const performMigration = async () => {
        try {
          const result = await migrateLocalEntriesToDatabase(convexClient)
          if (result.success && result.migratedCount > 0) {
            toast.success(
              `Successfully migrated ${result.migratedCount} ${result.migratedCount === 1 ? 'entry' : 'entries'} to your account!`
            )
            // Reload entries to show the migrated data
            window.location.reload()
          } else if (!result.success) {
            toast.error(
              `Migration failed: ${result.failedCount} ${result.failedCount === 1 ? 'entry' : 'entries'} could not be migrated`
            )
          }
        } catch (error) {
          console.error('Migration error:', error)
          toast.error('Failed to migrate your entries. Please try again.')
        }
      }

      performMigration()
    }
  }, [isAuthenticated, hasMigrated, convexClient])

  // Create a temporary entry on mount if none exists
  useEffect(() => {
    if (!isLoadingEntries && entries && entries.length === 0) {
      const todayMidnight = getTodayMidnight()
      createEntry(todayMidnight, { type: 'doc', content: [] }, '').then(
        (newEntryId) => {
          if (newEntryId) {
            navigate({
              to: '/entries/{-$entryId}',
              params: { entryId: newEntryId as string },
            })
          }
        }
      )
    }
  }, [isLoadingEntries, entries, createEntry, navigate])

  // Navigate to most recent entry when entries load and no entryId in URL
  useEffect(() => {
    if (!isLoadingEntries && entries && entries.length > 0 && !entryId) {
      navigate({
        to: '/entries/{-$entryId}',
        params: { entryId: entries[0]._id },
      })
    }
  }, [isLoadingEntries, entries, entryId, navigate])

  // Handle creating a new entry
  const handleNewEntry = () => {
    const todayMidnight = getTodayMidnight()
    createEntry(todayMidnight, { type: 'doc', content: [] }, '').then(
      (newEntryId) => {
        if (newEntryId) {
          navigate({
            to: '/entries/{-$entryId}',
            params: { entryId: newEntryId as string },
          })
          // Trigger June Bug animation after navigation
          setShowJuneBugAnimation(true)
        }
      }
    )
  }

  // Handle selecting an entry
  const handleSelectEntry = (newEntryId: string) => {
    navigate({ to: '/entries/{-$entryId}', params: { entryId: newEntryId } })
  }

  // Handle dirty state changes from entry form
  const handleDirtyChange = (dirty: boolean) => {
    setIsDirty(dirty)
  }

  // Handle plain text changes from editor
  const handlePlainTextChange = (plainText: string) => {
    setPlainTextContent(plainText)
  }

  // Handle prompt selection - insert into editor
  const handlePromptSelect = (promptText: string) => {
    entryFormRef.current?.insertText(promptText)
  }

  // Handle June Bug click
  const handleJuneBugClick = () => {
    toggleRightSidebar()
  }

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowJuneBugAnimation(false)
  }

  // Protect against browser navigation (closing tab/window with unsaved changes)
  useBlocker({
    shouldBlockFn: () => {
      // Only block browser navigation (not in-app navigation)
      // The entry form's cleanup effect will flush saves on in-app navigation
      return false
    },
    enableBeforeUnload: isDirty, // Browser will show native warning
  })

  return (
    <div
      className={`flex h-screen w-full relative ${isResizing ? 'select-none' : ''}`}
    >
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSearchCommandOpen(true)}
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNewEntry}
          >
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

      {/* Theme Toggle - Show in button group style when left sidebar collapsed, standalone when open */}
      {isCollapsed ? (
        <div
          className="absolute top-[0.5rem] z-10 bg-background rounded-md p-1 transition-[right] duration-300 ease-in-out"
          style={{ right: rightSidebarCollapsed ? '0.5rem' : 'calc(320px + 0.5rem)' }}
        >
          <div className="h-8 w-8 flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      ) : (
        <div
          className="absolute top-[0.75rem] z-10 transition-[right] duration-300 ease-in-out"
          style={{ right: rightSidebarCollapsed ? '0.75rem' : 'calc(320px + 0.75rem)' }}
        >
          <ThemeToggle />
        </div>
      )}

      {/* Sidebar - Resizable width on left */}
      <EntriesSidebar
        entries={entries || []}
        selectedEntryId={entryId || null}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sidebarRef={sidebarRef}
        isCollapsed={isCollapsed}
        sidebarWidth={sidebarWidth}
        isAuthenticated={isAuthenticated}
        user={currentUser}
      />

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className="w-1 bg-background cursor-col-resize hover:bg-primary/20 transition-colors"
          onMouseDown={startResizing}
        />
      )}

      {/* Main Content Area with Background */}
      <main
        className={`flex-1 overflow-hidden ${isCollapsed ? 'bg-card' : 'bg-background pt-3'}`}
      >
        <div
          className={`bg-card h-full relative flex flex-col ${isCollapsed ? '' : 'rounded-tl-lg shadow-sm border-l'}`}
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

          {/* Scrollable content area - only this section scrolls */}
          <div className="flex-1 overflow-y-auto pt-8">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading entry...</div>
              </div>
            )}
            {!isLoading && currentEntry && (
              <EntryForm
                ref={entryFormRef}
                entryId={currentEntry._id}
                initialTitle="Untitled"
                initialContent={currentEntry.content}
                entryDate={currentEntry.entryDate}
                onDirtyChange={handleDirtyChange}
                onPlainTextChange={handlePlainTextChange}
                isAuthenticated={isAuthenticated}
                rightSidebarCollapsed={rightSidebarCollapsed}
              />
            )}
            {!isLoading && !currentEntry && (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                  Creating your first entry...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - AI Prompts */}
      {isAuthenticated && context.userId && !rightSidebarCollapsed && (
        <div className="w-80 bg-card border-l flex-shrink-0 overflow-hidden">
          <PromptsSection
            userId={context.userId as Id<'users'>}
            onPromptSelect={handlePromptSelect}
            activePromptType={activePromptType}
            onActivePromptTypeChange={setActivePromptType}
          />
        </div>
      )}

      {/* Search Command Menu */}
      <SearchCommandMenu
        entries={entries || []}
        onSelectEntry={handleSelectEntry}
        open={searchCommandOpen}
        onOpenChange={setSearchCommandOpen}
      />

      {/* Floating June Bug Logo */}
      <FloatingJuneBug
        shouldAnimate={showJuneBugAnimation}
        isSidebarOpen={!rightSidebarCollapsed}
        onAnimationComplete={handleAnimationComplete}
        onClick={handleJuneBugClick}
      />
    </div>
  )
}

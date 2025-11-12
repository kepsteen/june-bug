import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Search, User, LogIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  groupEntriesByDate,
  formatEntryDate,
  filterEntriesBySearch,
} from '@/lib/entry-utils'
import type { Entry } from '@/lib/entry-utils'
import type { Id } from '../../../convex/_generated/dataModel'
import { useQueryClient } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'

interface EntriesSidebarProps {
  entries: Entry[]
  selectedEntryId: string | null
  onSelectEntry: (entryId: string) => void
  onNewEntry: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  sidebarRef: React.RefObject<HTMLElement>
  isCollapsed: boolean
  sidebarWidth: number
  isAuthenticated: boolean
  user?: {
    name?: string
    image?: string | null
  } | null
}

export function EntriesSidebar({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  searchTerm,
  onSearchChange,
  sidebarRef,
  isCollapsed,
  sidebarWidth,
  isAuthenticated,
  user,
}: EntriesSidebarProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Filter entries by search term
  const filteredEntries = filterEntriesBySearch(entries, searchTerm)

  // Group entries by date
  const groupedEntries = groupEntriesByDate(filteredEntries)

  // Handle logout
  const handleLogout = async () => {
    try {
      await authClient.signOut()
      toast.success(
        'Logged out successfully. You can continue using the app offline.',
      )
      // Reload the page to reset auth state and switch to local storage mode
      window.location.href = '/entries'
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Failed to log out. Please try again.')
    }
  }

  // Prefetch entry data on hover for instant switching (only for authenticated users)
  const prefetchEntry = (entryId: string) => {
    if (isAuthenticated) {
      queryClient.prefetchQuery({
        ...convexQuery(api.entries.getEntry, { id: entryId as Id<'entries'> }),
        staleTime: 1000 * 60 * 5, // Keep prefetched data fresh for 5 minutes
      })
    }
  }

  const renderEntryButton = (entry: Entry) => {
    const isSelected = entry._id === selectedEntryId
    const displayText = entry.aiTitle || formatEntryDate(entry.entryDate)

    return (
      <button
        key={entry._id}
        onClick={() => onSelectEntry(entry._id)}
        onMouseEnter={() => prefetchEntry(entry._id)}
        onFocus={() => prefetchEntry(entry._id)}
        className={`w-full text-left px-3 py-2 rounded-md transition-colors group ${
          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        }`}
      >
        <div className="text-sm font-medium truncate">{displayText}</div>
      </button>
    )
  }

  return (
    <aside
      ref={sidebarRef}
      className="bg-background transition-[width,padding] duration-300 ease-in-out overflow-hidden flex flex-col"
      style={{
        width: isCollapsed ? '0px' : `${sidebarWidth}px`,
        padding: isCollapsed ? '0' : '1rem',
        paddingTop: isCollapsed ? '0' : '3.5rem',
      }}
    >
      {/* App Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">JuneBug</h1>

      {/* Logo
      <img
        src="/apple-touch-icon.png"
        alt="JuneBug Logo"
        className="w-16 h-16 mb-2 mx-auto"
      /> */}

      {/* Demo Mode Badge - Only show for guests */}
      {!isAuthenticated && (
        <div className="flex justify-center mb-3">
          <Badge variant="secondary" className="text-xs">
            Demo Mode
          </Badge>
        </div>
      )}

      {/* New Entry Button */}
      <Button className="w-full mb-3" size="default" onClick={onNewEntry}>
        <Plus className="h-4 w-4 mr-2" />
        New Entry
      </Button>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="search your entries"
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Scrollable entries area with fade gradient */}
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto pb-2 scrollbar-hide">
          {/* No entries message */}
          {filteredEntries.length === 0 && (
            <div className="text-sm text-muted-foreground px-2 py-4">
              {searchTerm ? 'No entries found' : 'No entries yet'}
            </div>
          )}

          {/* Last 7 Days */}
          {groupedEntries.last7Days.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Last 7 Days
              </h3>
              <div className="space-y-1">
                {groupedEntries.last7Days.map(renderEntryButton)}
              </div>
            </div>
          )}

          {/* Last 30 Days */}
          {groupedEntries.last30Days.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Last 30 Days
              </h3>
              <div className="space-y-1">
                {groupedEntries.last30Days.map(renderEntryButton)}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedEntries.older.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                Older
              </h3>
              <div className="space-y-1">
                {groupedEntries.older.map(renderEntryButton)}
              </div>
            </div>
          )}
        </div>

        {/* Fade gradient above avatar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      </div>

      {/* Fixed container at bottom - Login button or Avatar link to settings */}
      <div className="mt-3 bg-background">
        {isAuthenticated ? (
          // Show avatar link to settings for authenticated users
          <Link
            to="/settings"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ''} alt="User avatar" />
              <AvatarFallback className="bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {user?.name || 'User'}
            </span>
          </Link>
        ) : (
          // Show login button for guests
          <Button
            variant="default"
            className="w-full"
            onClick={() => navigate({ to: '/sign-in' })}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  )
}

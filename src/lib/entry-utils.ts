import {
  startOfDay,
  subDays,
  isToday,
  isYesterday,
  format,
  isSameYear,
} from 'date-fns'
import type { Doc } from '../../convex/_generated/dataModel'

export type Entry = Doc<'entries'>

export interface GroupedEntries {
  last7Days: Entry[]
  last30Days: Entry[]
  older: Entry[]
}

/**
 * Gets midnight timestamp for today in local timezone
 */
export function getTodayMidnight(): number {
  return startOfDay(new Date()).getTime()
}

/**
 * Gets midnight timestamp for a date N days ago
 */
export function getDaysAgoMidnight(daysAgo: number): number {
  return startOfDay(subDays(new Date(), daysAgo)).getTime()
}

/**
 * Groups entries by time periods: Last 7 Days, Last 30 Days, Older
 */
export function groupEntriesByDate(entries: Entry[]): GroupedEntries {
  const sevenDaysAgo = getDaysAgoMidnight(7)
  const thirtyDaysAgo = getDaysAgoMidnight(30)

  const grouped: GroupedEntries = {
    last7Days: [],
    last30Days: [],
    older: [],
  }

  for (const entry of entries) {
    if (entry.entryDate >= sevenDaysAgo) {
      grouped.last7Days.push(entry)
    } else if (entry.entryDate >= thirtyDaysAgo) {
      grouped.last30Days.push(entry)
    } else {
      grouped.older.push(entry)
    }
  }

  return grouped
}

/**
 * Formats entry date for display in sidebar
 * Examples: "Today", "Yesterday", "Jan 15", "Dec 25, 2023"
 */
export function formatEntryDate(timestamp: number): string {
  const entryDate = new Date(timestamp)

  // Check if it's today
  if (isToday(entryDate)) {
    return 'Today'
  }

  // Check if it's yesterday
  if (isYesterday(entryDate)) {
    return 'Yesterday'
  }

  // Format as "Jan 15" or "Dec 25, 2023" if different year
  const formatString = isSameYear(entryDate, new Date())
    ? 'MMM d'
    : 'MMM d, yyyy'

  return format(entryDate, formatString)
}

/**
 * Filters entries by search term (searches in plainText field)
 */
export function filterEntriesBySearch(
  entries: Entry[],
  searchTerm: string,
): Entry[] {
  if (!searchTerm.trim()) {
    return entries
  }

  const lowerSearch = searchTerm.toLowerCase()
  return entries.filter((entry) =>
    entry.plainText?.toLowerCase().includes(lowerSearch),
  )
}

import {
  startOfDay,
  subDays,
  isToday,
  isYesterday,
  format,
  isSameYear,
} from 'date-fns'
import type { Doc } from '../../convex/_generated/dataModel'
import type { JSONContent } from '@tiptap/core'

export type Entry = Doc<'entries'>

/**
 * Extracts plain text from TipTap JSON content
 */
export function extractPlainTextFromContent(content: JSONContent): string {
  const extractText = (node: any): string => {
    if (node.type === 'text') {
      return node.text || ''
    }
    if (node.content) {
      return node.content.map(extractText).join(' ')
    }
    return ''
  }
  return extractText(content).trim()
}

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
 * Filters entries by search term (searches in plainText and aiTitle fields)
 * Falls back to extracting text from content if plainText is not available
 */
export function filterEntriesBySearch(
  entries: Entry[],
  searchTerm: string,
): Entry[] {
  if (!searchTerm.trim()) {
    return entries
  }

  const lowerSearch = searchTerm.toLowerCase()
  return entries.filter((entry) => {
    // Search in aiTitle
    if (entry.aiTitle?.toLowerCase().includes(lowerSearch)) {
      return true
    }

    // Search in plainText if available
    if (entry.plainText?.toLowerCase().includes(lowerSearch)) {
      return true
    }

    // Fallback: extract plain text from content if plainText is not available
    if (!entry.plainText && entry.content) {
      try {
        const content =
          typeof entry.content === 'string'
            ? JSON.parse(entry.content)
            : entry.content
        const extractedText = extractPlainTextFromContent(content)
        return extractedText.toLowerCase().includes(lowerSearch)
      } catch {
        return false
      }
    }

    return false
  })
}

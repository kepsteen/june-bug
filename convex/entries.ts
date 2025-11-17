import { v } from 'convex/values'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { internal } from './_generated/api'
import { getUser, safeGetUser } from './auth'

/**
 * Get all entries for the current user
 * Returns entries sorted by entry date (most recent first)
 * Only returns active entries by default
 */
export const getEntries = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    if (args.includeInactive) {
      // Get all entries (active and inactive)
      return await ctx.db
        .query('entries')
        .withIndex('userId_entryDate', (q) => q.eq('userId', user._id))
        .order('desc')
        .collect()
    } else {
      // Get only active entries (default)
      return await ctx.db
        .query('entries')
        .withIndex('userId_isActive_entryDate', (q) =>
          q.eq('userId', user._id).eq('isActive', true),
        )
        .order('desc')
        .collect()
    }
  },
})

/**
 * Get a specific entry by ID
 * Verifies user owns the entry
 */
export const getEntry = query({
  args: { id: v.id('entries') },
  handler: async (ctx, args) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return null
    }

    const entry = await ctx.db.get(args.id)
    if (!entry || entry.userId !== user._id) {
      return null
    }

    return entry
  },
})

/**
 * Get entries for a specific date range
 */
export const getEntriesInRange = query({
  args: {
    startDate: v.number(), // Midnight timestamp
    endDate: v.number(), // Midnight timestamp
  },
  handler: async (ctx, args) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    const allEntries = await ctx.db
      .query('entries')
      .withIndex('userId_entryDate', (q) => q.eq('userId', user._id))
      .collect()

    return allEntries.filter(
      (entry) =>
        entry.isActive &&
        entry.entryDate >= args.startDate &&
        entry.entryDate <= args.endDate,
    )
  },
})

/**
 * Search entries by plain text content
 * Returns entries that contain the search term (case-insensitive)
 */
export const searchEntries = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    // Get all active entries
    const entries = await ctx.db
      .query('entries')
      .withIndex('userId_isActive_entryDate', (q) =>
        q.eq('userId', user._id).eq('isActive', true),
      )
      .order('desc')
      .collect()

    // Filter by search term (case-insensitive)
    const lowerSearchTerm = args.searchTerm.toLowerCase().trim()
    if (!lowerSearchTerm) {
      return entries
    }

    return entries.filter((entry) =>
      entry.plainText?.toLowerCase().includes(lowerSearchTerm),
    )
  },
})

/**
 * Create a new entry or return existing one for the date
 * If an entry already exists for the specified date, returns that entry's ID
 * Otherwise creates a new entry with empty TipTap JSON
 */
export const createEntry = mutation({
  args: {
    entryDate: v.optional(v.number()), // Defaults to today
    content: v.optional(v.string()), // Defaults to empty TipTap JSON
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)
    const now = Date.now()

    // Default to today at midnight in user's timezone
    const entryDate = args.entryDate ?? getMidnightTimestamp(now)

    // Check if an entry already exists for this date
    const existingEntry = await ctx.db
      .query('entries')
      .withIndex('userId_entryDate', (q) =>
        q.eq('userId', user._id).eq('entryDate', entryDate),
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .first()

    // If entry exists, return its ID
    if (existingEntry) {
      return existingEntry._id
    }

    // Default to empty TipTap JSON
    const content = args.content ?? JSON.stringify({ type: 'doc', content: [] })

    // Create new entry
    const entryId = await ctx.db.insert('entries', {
      userId: user._id,
      entryDate,
      content,
      plainText: '', // Empty initially
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Check entry count for AI prompt generation trigger
    const entryCount = await ctx.db
      .query('entries')
      .withIndex('userId', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
      .then((entries) => entries.length)

    // At 5 entries, generate history-based prompts for all types
    if (entryCount === 5) {
      const promptTypes = ['reflection', 'skill-development', 'career-growth', 'daily-checkin']
      for (const promptType of promptTypes) {
        await ctx.scheduler.runAfter(0, internal.ai.prompts.generateHistoryPrompt, {
          userId: user._id,
          promptType,
        })
      }
    }

    return entryId
  },
})

/**
 * Update an entry
 * Can update content, entryDate, plainText, or aiTitle
 */
export const updateEntry = mutation({
  args: {
    id: v.id('entries'),
    content: v.optional(v.string()),
    plainText: v.optional(v.string()),
    entryDate: v.optional(v.number()),
    aiTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const entry = await ctx.db.get(args.id)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    if (!entry.isActive) {
      throw new Error('Cannot update deleted entry')
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    }

    if (args.content !== undefined) {
      updates.content = args.content
    }

    if (args.plainText !== undefined) {
      updates.plainText = args.plainText
    }

    if (args.entryDate !== undefined) {
      updates.entryDate = args.entryDate
    }

    if (args.aiTitle !== undefined) {
      updates.aiTitle = args.aiTitle
    }

    await ctx.db.patch(args.id, updates)

    // Trigger AI title generation if conditions are met
    if (args.plainText !== undefined && !entry.aiTitle) {
      const wordCount = countWords(args.plainText)
      if (wordCount >= 100) {
        // Schedule AI generation asynchronously
        await ctx.scheduler.runAfter(0, internal.ai.generateEntryTitle, {
          entryId: args.id,
        })
      }
    }
  },
})

/**
 * Soft delete an entry
 * Sets isActive to false instead of actually deleting
 */
export const deleteEntry = mutation({
  args: { id: v.id('entries') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const entry = await ctx.db.get(args.id)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Permanently delete an entry
 * Use with caution - this cannot be undone
 */
export const permanentlyDeleteEntry = mutation({
  args: { id: v.id('entries') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const entry = await ctx.db.get(args.id)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    await ctx.db.delete(args.id)
  },
})

/**
 * Generate an upload URL for image uploads
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify user is authenticated
    await getUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Save image URL after upload
 * Returns the public URL for the uploaded image
 */
export const saveImageUrl = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    // Verify user is authenticated
    await getUser(ctx)

    // Get the public URL for the image
    const imageUrl = await ctx.storage.getUrl(args.storageId)
    if (!imageUrl) {
      throw new Error('Failed to get image URL')
    }

    return imageUrl
  },
})

/**
 * Internal mutation for AI action to update entry with generated title
 * Bypasses user authentication since it's called from an action
 */
export const updateEntryInternal = internalMutation({
  args: {
    entryId: v.id('entries'),
    aiTitle: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.entryId, {
      aiTitle: args.aiTitle,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Internal query for AI action to fetch entry without authentication
 * Bypasses user authentication since it's called from an action
 */
export const getEntryInternal = internalQuery({
  args: {
    entryId: v.id('entries'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entryId)
  },
})

/**
 * Internal query to get recent entries for AI prompt generation
 * Bypasses user authentication since it's called from an action
 */
export const getRecentEntriesInternal = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('entries')
      .withIndex('userId_isActive_entryDate', (q) =>
        q.eq('userId', args.userId).eq('isActive', true)
      )
      .order('desc')
      .take(args.limit)
  },
})

/**
 * Helper function to count words in text
 * Used for determining when to trigger AI title generation
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

/**
 * Helper function to get midnight timestamp
 * This is a simple version - you may want to handle timezones properly
 */
function getMidnightTimestamp(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

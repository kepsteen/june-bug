import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
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
    const user = await getUser(ctx)

    const entry = await ctx.db.get(args.id)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
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
 * Create a new entry
 * Initializes with empty TipTap JSON
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

    // Default to empty TipTap JSON
    const content = args.content ?? JSON.stringify({ type: 'doc', content: [] })

    const entryId = await ctx.db.insert('entries', {
      userId: user._id,
      entryDate,
      content,
      plainText: '', // Empty initially
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return entryId
  },
})

/**
 * Update an entry
 * Can update content, entryDate, or plainText
 */
export const updateEntry = mutation({
  args: {
    id: v.id('entries'),
    content: v.optional(v.string()),
    plainText: v.optional(v.string()),
    entryDate: v.optional(v.number()),
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

    await ctx.db.patch(args.id, updates)
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
 * Helper function to get midnight timestamp
 * This is a simple version - you may want to handle timezones properly
 */
function getMidnightTimestamp(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

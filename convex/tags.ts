import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUser, safeGetUser } from './auth'

/**
 * Get all tags for the current user (includes system tags + user's custom tags)
 */
export const getTags = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    // Get system tags
    const systemTags = await ctx.db
      .query('tags')
      .withIndex('isSystemGenerated', (q) => q.eq('isSystemGenerated', true))
      .filter((q) =>
        args.includeInactive ? q.eq(true, true) : q.eq(q.field('isActive'), true),
      )
      .collect()

    // Get user's custom tags
    const userTags = await ctx.db
      .query('tags')
      .withIndex('userId_isActive', (q) => {
        const query = q.eq('userId', user._id)
        return args.includeInactive ? query : query.eq('isActive', true)
      })
      .collect()

    return [...systemTags, ...userTags]
  },
})

/**
 * Get only system-generated tags
 */
export const getSystemTags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('tags')
      .withIndex('isSystemGenerated', (q) => q.eq('isSystemGenerated', true))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
  },
})

/**
 * Get only user's custom tags
 */
export const getUserTags = query({
  args: {},
  handler: async (ctx) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    return await ctx.db
      .query('tags')
      .withIndex('userId_isActive', (q) =>
        q.eq('userId', user._id).eq('isActive', true),
      )
      .collect()
  },
})

/**
 * Get a specific tag by ID
 */
export const getTag = query({
  args: { id: v.id('tags') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)
    const tag = await ctx.db.get(args.id)

    if (!tag) {
      throw new Error('Tag not found')
    }

    // Can view system tags or own tags
    if (!tag.isSystemGenerated && tag.userId !== user._id) {
      throw new Error('Unauthorized to view this tag')
    }

    return tag
  },
})

/**
 * Get all tags for a specific entry
 */
export const getEntryTags = query({
  args: { entryId: v.id('entries') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Verify user owns the entry
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    // Get all entry-tag relationships
    const entryTags = await ctx.db
      .query('entryTags')
      .withIndex('entryId', (q) => q.eq('entryId', args.entryId))
      .collect()

    // Fetch full tag details
    const tags = await Promise.all(
      entryTags.map(async (et) => {
        const tag = await ctx.db.get(et.tagId)
        return tag
      }),
    )

    // Filter out null tags (if any were deleted)
    return tags.filter((tag) => tag !== null && tag.isActive)
  },
})

/**
 * Get all entries with a specific tag
 */
export const getEntriesWithTag = query({
  args: { tagId: v.id('tags') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Verify user can access this tag
    const tag = await ctx.db.get(args.tagId)
    if (!tag) {
      throw new Error('Tag not found')
    }
    if (!tag.isSystemGenerated && tag.userId !== user._id) {
      throw new Error('Unauthorized to view this tag')
    }

    // Get all entry-tag relationships for this tag
    const entryTags = await ctx.db
      .query('entryTags')
      .withIndex('tagId', (q) => q.eq('tagId', args.tagId))
      .collect()

    // Fetch full entry details
    const entries = await Promise.all(
      entryTags.map(async (et) => {
        const entry = await ctx.db.get(et.entryId)
        return entry
      }),
    )

    // Filter to only user's active entries
    return entries.filter(
      (entry) => entry !== null && entry.userId === user._id && entry.isActive,
    )
  },
})

/**
 * Create a new custom tag
 */
export const createTag = mutation({
  args: {
    name: v.string(),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Check if user already has a tag with this name
    const existingTags = await ctx.db
      .query('tags')
      .withIndex('userId_name', (q) =>
        q.eq('userId', user._id).eq('name', args.name),
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()

    if (existingTags.length > 0) {
      throw new Error('You already have a tag with this name')
    }

    const tagId = await ctx.db.insert('tags', {
      name: args.name,
      emoji: args.emoji,
      color: args.color,
      isSystemGenerated: false,
      userId: user._id,
      isActive: true,
      createdAt: Date.now(),
    })

    return tagId
  },
})

/**
 * Update a tag (only custom tags, not system tags)
 */
export const updateTag = mutation({
  args: {
    id: v.id('tags'),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const tag = await ctx.db.get(args.id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    // Can only update own custom tags
    if (tag.isSystemGenerated || tag.userId !== user._id) {
      throw new Error('Cannot update system tags or tags you do not own')
    }

    if (!tag.isActive) {
      throw new Error('Cannot update deleted tag')
    }

    // Check for name conflicts if changing name
    if (args.name && args.name !== tag.name) {
      const newName = args.name // Capture for type narrowing
      const existingTags = await ctx.db
        .query('tags')
        .withIndex('userId_name', (q) =>
          q.eq('userId', user._id).eq('name', newName),
        )
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect()

      if (existingTags.length > 0 && existingTags[0]._id !== args.id) {
        throw new Error('You already have a tag with this name')
      }
    }

    const updates: Record<string, any> = {}

    if (args.name !== undefined) {
      updates.name = args.name
    }
    if (args.emoji !== undefined) {
      updates.emoji = args.emoji
    }
    if (args.color !== undefined) {
      updates.color = args.color
    }

    await ctx.db.patch(args.id, updates)
  },
})

/**
 * Delete a tag (soft delete)
 */
export const deleteTag = mutation({
  args: { id: v.id('tags') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const tag = await ctx.db.get(args.id)
    if (!tag) {
      throw new Error('Tag not found')
    }

    // Can only delete own custom tags
    if (tag.isSystemGenerated || tag.userId !== user._id) {
      throw new Error('Cannot delete system tags or tags you do not own')
    }

    await ctx.db.patch(args.id, {
      isActive: false,
    })
  },
})

/**
 * Add a tag to an entry
 */
export const addTagToEntry = mutation({
  args: {
    entryId: v.id('entries'),
    tagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Verify user owns the entry
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    // Verify tag exists and is accessible
    const tag = await ctx.db.get(args.tagId)
    if (!tag || !tag.isActive) {
      throw new Error('Tag not found or inactive')
    }
    if (!tag.isSystemGenerated && tag.userId !== user._id) {
      throw new Error('Cannot use tags you do not own')
    }

    // Check if tag is already added
    const existing = await ctx.db
      .query('entryTags')
      .withIndex('entryId_tagId', (q) =>
        q.eq('entryId', args.entryId).eq('tagId', args.tagId),
      )
      .first()

    if (existing) {
      throw new Error('Tag already added to this entry')
    }

    await ctx.db.insert('entryTags', {
      entryId: args.entryId,
      tagId: args.tagId,
      createdAt: Date.now(),
    })
  },
})

/**
 * Remove a tag from an entry
 */
export const removeTagFromEntry = mutation({
  args: {
    entryId: v.id('entries'),
    tagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Verify user owns the entry
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    // Find the entry-tag relationship
    const entryTag = await ctx.db
      .query('entryTags')
      .withIndex('entryId_tagId', (q) =>
        q.eq('entryId', args.entryId).eq('tagId', args.tagId),
      )
      .first()

    if (!entryTag) {
      throw new Error('Tag not found on this entry')
    }

    await ctx.db.delete(entryTag._id)
  },
})

/**
 * Set all tags for an entry (replaces existing tags)
 * Useful for bulk tag updates
 */
export const setEntryTags = mutation({
  args: {
    entryId: v.id('entries'),
    tagIds: v.array(v.id('tags')),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    // Verify user owns the entry
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.userId !== user._id) {
      throw new Error('Entry not found or unauthorized')
    }

    // Verify all tags exist and are accessible
    for (const tagId of args.tagIds) {
      const tag = await ctx.db.get(tagId)
      if (!tag || !tag.isActive) {
        throw new Error(`Tag ${tagId} not found or inactive`)
      }
      if (!tag.isSystemGenerated && tag.userId !== user._id) {
        throw new Error(`Cannot use tag ${tagId} - you do not own it`)
      }
    }

    // Remove all existing tags
    const existingEntryTags = await ctx.db
      .query('entryTags')
      .withIndex('entryId', (q) => q.eq('entryId', args.entryId))
      .collect()

    for (const entryTag of existingEntryTags) {
      await ctx.db.delete(entryTag._id)
    }

    // Add new tags
    const now = Date.now()
    for (const tagId of args.tagIds) {
      await ctx.db.insert('entryTags', {
        entryId: args.entryId,
        tagId: tagId,
        createdAt: now,
      })
    }
  },
})

/**
 * Get tag usage statistics for the current user
 * Returns tags sorted by usage count (most used first)
 */
export const getTagStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return []
    }

    // Get all user's entries
    const entries = await ctx.db
      .query('entries')
      .withIndex('userId_isActive_entryDate', (q) =>
        q.eq('userId', user._id).eq('isActive', true),
      )
      .collect()

    const entryIds = entries.map((e) => e._id)

    // Get all tags used on these entries
    const allEntryTags = await ctx.db.query('entryTags').collect()
    const relevantEntryTags = allEntryTags.filter((et) =>
      entryIds.includes(et.entryId),
    )

    // Count usage per tag
    const tagCounts = new Map<string, number>()
    for (const et of relevantEntryTags) {
      const count = tagCounts.get(et.tagId) || 0
      tagCounts.set(et.tagId, count + 1)
    }

    // Fetch tag details and combine with counts
    const tagStats: Array<{ tag: any; usageCount: number } | null> =
      await Promise.all(
        Array.from(tagCounts.entries()).map(async ([tagId, count]) => {
          const tag = await ctx.db.get(tagId as any)
          return tag ? { tag, usageCount: count } : null
        }),
      )

    // Filter out null results and only include active tags
    const validStats: Array<{ tag: any; usageCount: number }> = []
    for (const stat of tagStats) {
      if (stat && stat.tag && 'isActive' in stat.tag && stat.tag.isActive) {
        validStats.push(stat)
      }
    }

    // Sort by usage
    return validStats.sort((a, b) => b.usageCount - a.usageCount)
  },
})

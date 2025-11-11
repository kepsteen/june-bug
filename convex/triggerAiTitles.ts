import { mutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

/**
 * One-time mutation to trigger AI title generation for existing entries
 * This updates entries without aiTitle by re-saving their plainText,
 * which triggers the scheduler in updateEntry mutation
 */
export const triggerAiTitlesForUser = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first()

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`)
    }

    // Get all active entries without AI titles
    const entries = await ctx.db
      .query('entries')
      .withIndex('userId_isActive_entryDate', (q) =>
        q.eq('userId', user._id).eq('isActive', true),
      )
      .collect()

    const entriesWithoutTitles = entries.filter((entry) => !entry.aiTitle)

    console.log(
      `Found ${entriesWithoutTitles.length} entries without AI titles for ${args.email}`,
    )

    const triggeredCount = []

    for (const entry of entriesWithoutTitles) {
      // Check if entry has enough words
      const plainText = entry.plainText || ''
      const wordCount = plainText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length

      if (wordCount >= 100) {
        // Schedule AI generation for this entry
        await ctx.scheduler.runAfter(0, internal.ai.generateEntryTitle, {
          entryId: entry._id,
        })
        triggeredCount.push(entry._id)
        console.log(
          `Scheduled AI generation for entry ${entry._id} (${wordCount} words)`,
        )
      }
    }

    return {
      message: `Triggered AI title generation for ${triggeredCount.length} entries`,
      entriesProcessed: entriesWithoutTitles.length,
      entriesScheduled: triggeredCount.length,
    }
  },
})

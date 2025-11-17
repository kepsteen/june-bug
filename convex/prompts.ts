/**
 * Convex functions for AI writing prompts
 *
 * Queries: Fetch prompts for display
 * Mutations: Create, update, and manage prompts
 */

import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get all active prompts for a user, grouped by type and category
 */
export const getActivePrompts = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Group prompts by type and category for easy UI consumption
    const grouped: Record<string, Record<string, any[]>> = {
      reflection: { static: [], 'history-based': [], 'context-aware': [] },
      'skill-development': { static: [], 'history-based': [], 'context-aware': [] },
      'career-growth': { static: [], 'history-based': [], 'context-aware': [] },
      'daily-checkin': { static: [], 'history-based': [], 'context-aware': [] },
    };

    for (const prompt of prompts) {
      if (grouped[prompt.promptType] && grouped[prompt.promptType][prompt.promptCategory]) {
        grouped[prompt.promptType][prompt.promptCategory].push(prompt);
      }
    }

    return grouped;
  },
});

/**
 * Get prompts filtered by type
 */
export const getPromptsByType = query({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
  },
  handler: async (ctx, { userId, promptType }) => {
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_user_type', (q) =>
        q.eq('userId', userId).eq('promptType', promptType).eq('isActive', true)
      )
      .collect();

    return prompts;
  },
});

/**
 * Create a new prompt (internal only - called from actions)
 */
export const createPrompt = internalMutation({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
    promptCategory: v.string(),
    promptText: v.string(),
    metadata: v.object({
      model: v.string(),
      tokensUsed: v.number(),
      generatedAt: v.number(),
      version: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const promptId = await ctx.db.insert('prompts', {
      userId: args.userId,
      promptType: args.promptType as any,
      promptCategory: args.promptCategory as any,
      promptText: args.promptText,
      promptMetadata: args.metadata,
      timesShown: 0,
      timesUsed: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return promptId;
  },
});

/**
 * Mark a prompt as used (track engagement)
 */
export const markPromptUsed = mutation({
  args: { promptId: v.id('prompts') },
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    await ctx.db.patch(promptId, {
      timesUsed: prompt.timesUsed + 1,
      lastShownAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark a prompt as shown (track impressions)
 */
export const markPromptShown = mutation({
  args: { promptId: v.id('prompts') },
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId);
    if (!prompt) return;

    await ctx.db.patch(promptId, {
      timesShown: prompt.timesShown + 1,
      lastShownAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Deactivate prompts (soft delete when regenerating)
 */
export const deactivatePrompts = internalMutation({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { userId, promptType, category }) => {
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_user_type', (q) =>
        q.eq('userId', userId).eq('promptType', promptType).eq('isActive', true)
      )
      .filter((q) => q.eq(q.field('promptCategory'), category))
      .collect();

    for (const prompt of prompts) {
      await ctx.db.patch(prompt._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Regenerate a prompt (triggers appropriate action)
 */
export const regeneratePrompt = mutation({
  args: {
    promptType: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { promptType, category }) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', identity.email ?? ''))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Trigger appropriate action based on category
    if (category === 'history-based') {
      const { internal } = await import('./_generated/api');
      await ctx.scheduler.runAfter(0, internal.ai.prompts.generateHistoryPrompt, {
        userId: user._id,
        promptType,
      });
    } else if (category === 'static') {
      // Static prompts can be regenerated too
      const { internal } = await import('./_generated/api');
      await ctx.scheduler.runAfter(0, internal.ai.prompts.regenerateStaticPrompts, {
        userId: user._id,
        promptType,
      });
    }

    return { success: true };
  },
});

/**
 * Delete old inactive prompts (cleanup job - can run periodically)
 */
export const cleanupOldPrompts = internalMutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, { olderThanDays }) => {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const oldPrompts = await ctx.db
      .query('prompts')
      .filter((q) =>
        q.and(
          q.eq(q.field('isActive'), false),
          q.lt(q.field('updatedAt'), cutoffTime)
        )
      )
      .collect();

    for (const prompt of oldPrompts) {
      await ctx.db.delete(prompt._id);
    }

    return { deleted: oldPrompts.length };
  },
});

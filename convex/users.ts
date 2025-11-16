/**
 * User queries and helpers
 */

import { internalQuery } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get user by ID (internal only - for AI actions)
 */
export const getUserInternal = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user;
  },
});

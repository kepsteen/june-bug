import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  users: defineTable({
    email: v.string(),
    authId: v.optional(v.string()),
    // Phase 1: Essential fields for journaling app
    isOnboarded: v.optional(v.boolean()), // Optional for existing users
    createdAt: v.optional(v.number()), // Optional for existing users
    updatedAt: v.optional(v.number()), // Optional for existing users
  }).index('email', ['email']),

  // Phase 1: Journal entries for TipTap editor
  entries: defineTable({
    userId: v.id('users'),
    entryDate: v.number(), // Midnight timestamp (can be backdated)
    content: v.string(), // TipTap JSON stringified
    plainText: v.optional(v.string()), // Plain text for search/AI processing
    isActive: v.boolean(), // Soft delete flag
    createdAt: v.number(), // When entry was created
    updatedAt: v.number(), // Last edited timestamp
  })
    .index('userId', ['userId'])
    .index('userId_entryDate', ['userId', 'entryDate'])
    .index('userId_isActive_entryDate', ['userId', 'isActive', 'entryDate']),

  // Phase 2: Tags (system-generated + user-created)
  tags: defineTable({
    name: v.string(), // Tag name (e.g., "work", "personal", "gratitude")
    isSystemGenerated: v.boolean(), // System tag vs user-created
    emoji: v.optional(v.string()), // Optional emoji icon
    userId: v.optional(v.id('users')), // Null for system tags, set for user tags
    color: v.optional(v.string()), // Hex color for UI
    isActive: v.boolean(), // Soft delete
    createdAt: v.number(),
  })
    .index('userId', ['userId'])
    .index('name', ['name'])
    .index('userId_name', ['userId', 'name']) // Prevent duplicate names per user
    .index('isSystemGenerated', ['isSystemGenerated'])
    .index('userId_isActive', ['userId', 'isActive']),

  // Phase 2: Entry-Tag relationships (many-to-many)
  entryTags: defineTable({
    entryId: v.id('entries'),
    tagId: v.id('tags'),
    createdAt: v.number(),
  })
    .index('entryId', ['entryId'])
    .index('tagId', ['tagId'])
    .index('entryId_tagId', ['entryId', 'tagId']), // Prevent duplicate tags on entry

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('userId', ['userId']),
})

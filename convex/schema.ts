import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()), // Optional to support OAuth users with private emails
    authId: v.optional(v.string()),
    // Phase 1: Essential fields for journaling app
    isOnboarded: v.optional(v.boolean()), // Optional for existing users
    createdAt: v.optional(v.number()), // Optional for existing users
    updatedAt: v.optional(v.number()), // Optional for existing users

    // Onboarding fields
    fullName: v.optional(v.string()),
    age: v.optional(v.number()),
    currentRole: v.optional(v.string()),
    experienceLevel: v.optional(v.union(
      v.literal('Junior'),
      v.literal('Mid-Level'),
      v.literal('Senior'),
      v.literal('Lead'),
      v.literal('Principal')
    )),
    mentorshipStyle: v.optional(v.union(
      v.literal('Structured'),
      v.literal('Exploratory'),
      v.literal('Challenge-driven'),
      v.literal('Reflective')
    )),
    developmentGoals: v.optional(v.array(v.string())),
    techStack: v.optional(v.array(v.string())),
    workEnvironment: v.optional(v.union(
      v.literal('Individual contributor at company'),
      v.literal('Team lead/manager'),
      v.literal('Freelance/consultant'),
      v.literal('Student/bootcamp'),
      v.literal('Career transition/job seeking'),
      v.literal('Side projects only')
    )),
    journalingFrequency: v.optional(v.union(
      v.literal('Daily'),
      v.literal('Every other day'),
      v.literal('Weekly'),
      v.literal('Custom schedule')
    )),
    customScheduleDays: v.optional(v.array(v.union(
      v.literal('Monday'),
      v.literal('Tuesday'),
      v.literal('Wednesday'),
      v.literal('Thursday'),
      v.literal('Friday'),
      v.literal('Saturday'),
      v.literal('Sunday')
    ))),
    journalingTime: v.optional(v.string()), // Stored as HH:MM format or preset like "End of workday"
    notificationPreferences: v.optional(v.array(v.union(
      v.literal('Push notifications'),
      v.literal('Email reminders'),
      v.literal('None')
    ))),
  }).index('email', ['email']),

  // Phase 1: Journal entries for TipTap editor
  entries: defineTable({
    userId: v.id('users'),
    entryDate: v.number(), // Midnight timestamp (can be backdated)
    content: v.string(), // TipTap JSON stringified
    plainText: v.optional(v.string()), // Plain text for search/AI processing
    aiTitle: v.optional(v.string()), // AI-generated title (falls back to date)
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

  // AI Writing Prompts
  prompts: defineTable({
    userId: v.id('users'),
    promptType: v.union(
      v.literal('reflection'),
      v.literal('skill-development'),
      v.literal('career-growth'),
      v.literal('daily-checkin')
    ),
    promptCategory: v.union(
      v.literal('static'),
      v.literal('history-based'),
      v.literal('context-aware')
    ),
    promptText: v.string(),
    promptMetadata: v.optional(v.object({
      model: v.string(), // 'gpt-4o', 'gpt-4o-mini', or 'template'
      tokensUsed: v.number(),
      generatedAt: v.number(),
      version: v.number() // For tracking prompt iterations
    })),
    // Usage tracking
    timesShown: v.number(),
    timesUsed: v.number(),
    lastShownAt: v.optional(v.number()),
    // State
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'promptType', 'isActive'])
    .index('by_user_category', ['userId', 'promptCategory']),
})

# Schema Analysis & Migration Guide

## Executive Summary

Your SQL schema has several critical issues (broken foreign keys, wrong data types) but the overall data model is solid for a journaling app. I've created a Convex-optimized schema that:

- ✅ Fixes all foreign key relationship issues
- ✅ Adapts to Convex's document model (no UUIDs, direct ID references)
- ✅ Optimizes indexes for your query patterns
- ✅ Adds flexibility for hybrid AI question system
- ✅ Supports custom + system tags with join table

**Proposed schema:** `convex/schema-proposed.ts`

---

## Critical Issues Fixed

### 1. Broken Foreign Keys in SQL Schema

| Issue | Original (WRONG) | Fixed |
|-------|------------------|-------|
| Tags FK points backwards | `tags.uuid → entries_tags.id` | `entryTags.tagId → tags._id` |
| Users FK points to streaks | `users.uuid → streaks.uuid` | `streaks.userId → users._id` |
| Entries FK creates cycle | `entries.uuid → entries_tags.entry_uuid` | `entryTags.entryId → entries._id` |

### 2. Data Type Issues

| Field | Original (WRONG) | Fixed |
|-------|------------------|-------|
| `Projects.description` | `BIGINT` | `v.optional(v.string())` |
| `ai_questions.category` | `CHECK IN('')` (empty!) | Proper string validation |
| `users.phone` | `NOT NULL` | `v.optional(v.string())` |
| `users.age` | `NOT NULL` | `v.optional(v.number())` |

### 3. Convex Adaptations

| SQL Concept | Convex Equivalent |
|-------------|-------------------|
| `id` (BIGINT) + `uuid` (UUID) | Single `_id: Id<"tableName">` |
| Foreign keys | Direct references: `v.id("tableName")` |
| `TIMESTAMP WITH TIME ZONE` | `v.number()` (ms since epoch) |
| Join tables | Separate indexed tables |
| `active` boolean soft delete | `isActive: v.boolean()` in queries |

---

## Schema Comparison

### Users Table

#### SQL → Convex Changes

```typescript
// SQL had: id, uuid, email, phone (NOT NULL), active, is_onboarded, age (NOT NULL), ...
// Convex:
users: defineTable({
  email: v.string(),          // Existing
  authId: v.optional(v.string()), // Existing (Better Auth)

  // NEW FIELDS TO ADD:
  phone: v.optional(v.string()),  // Made optional ✅
  isOnboarded: v.boolean(),       // Camel case
  age: v.optional(v.number()),    // Made optional ✅
  role: v.string(),               // "user" | "mentor" | "admin"
  title: v.optional(v.string()),
  goals: v.optional(v.string()),
  mentorshipStyle: v.optional(v.string()),
  isPushNotifications: v.boolean(),
  journalFrequency: v.string(),
  notificationTime: v.optional(v.number()), // Changed from timestamp
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Key decisions:**
- ❌ Removed `active` - use `isOnboarded` status instead
- ✅ Made `phone` optional (not everyone has phone)
- ✅ Made `age` optional (privacy concern)
- ✅ Changed `notification_time` to milliseconds (Convex doesn't have time-only types)

---

### Entries Table

#### SQL → Convex Changes

```typescript
// SQL: id, uuid, entry_date, created_at, updated_at, note, clean_note, user_uuid, active
// Convex:
entries: defineTable({
  userId: v.id('users'),           // Foreign key
  entryDate: v.number(),           // Midnight timestamp (can be backdated)
  content: v.string(),             // Was "note" - TipTap JSON stringified
  plainText: v.optional(v.string()), // Was "clean_note" - for search
  isActive: v.boolean(),           // Soft delete
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('userId', ['userId'])
  .index('userId_entryDate', ['userId', 'entryDate'])
  .index('userId_isActive_entryDate', ['userId', 'isActive', 'entryDate'])
```

**Key decisions:**
- ✅ Renamed `note` → `content` (clearer for rich text)
- ✅ Renamed `clean_note` → `plainText` (clearer intent)
- ✅ Added compound index for sorted queries
- ✅ `entryDate` separate from `createdAt` (allows backdating)

---

### Tags + Entry Tags (NEW STRUCTURE)

#### SQL → Convex Changes

**SQL had:** `tags` table + `entries_tags` join table with broken foreign keys

**Convex:**
```typescript
// Main tags table (system + user tags)
tags: defineTable({
  name: v.string(),
  isSystemGenerated: v.boolean(),
  emoji: v.optional(v.string()),
  userId: v.optional(v.id('users')), // Null for system tags
  color: v.optional(v.string()),     // NEW: for UI
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('userId_name', ['userId', 'name']) // Prevent duplicate names per user

// Join table (many-to-many)
entryTags: defineTable({
  entryId: v.id('entries'),
  tagId: v.id('tags'),
  createdAt: v.number(),
})
  .index('entryId_tagId', ['entryId', 'tagId']) // Prevent duplicate tags on entry
```

**Key decisions:**
- ✅ Join table for flexibility (can query "most used tags")
- ✅ Supports both system and user-created tags
- ✅ Added `color` field for better UX
- ✅ Indexes prevent duplicate tags

**Alternative (simpler but less flexible):**
```typescript
// Embed tag IDs directly in entries:
entries: defineTable({
  // ... other fields
  tagIds: v.array(v.id('tags')),
})
```
*Not recommended* - harder to query tags by usage, can't track when tag was added

---

### AI Questions (NEW HYBRID STRUCTURE)

#### SQL → Convex Changes

**SQL had:** Single `ai_questions` table

**Convex:** Split into templates + instances

```typescript
// Reusable question pool (managed by admins/AI)
aiQuestionTemplates: defineTable({
  text: v.string(),
  category: v.string(),            // Fixed: SQL had empty enum!
  tags: v.array(v.string()),       // NEW: for matching to user interests
  difficultyLevel: v.optional(v.string()), // NEW: personalization
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

// User-specific question instances
aiQuestions: defineTable({
  userId: v.id('users'),
  entryId: v.optional(v.id('entries')),  // Null if general question
  templateId: v.optional(v.id('aiQuestionTemplates')), // If from pool
  text: v.string(),                      // Can be personalized
  category: v.string(),
  isAnswered: v.boolean(),               // NEW: track completion
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('userId_isAnswered', ['userId', 'isAnswered']) // Unanswered questions
```

**Why split into two tables:**
- ✅ Reuse questions across users (efficiency)
- ✅ Personalize question text per user (flexibility)
- ✅ Track which questions are answered
- ✅ Analyze which templates are most engaging

---

### Streaks Table

#### SQL → Convex Changes

```typescript
// SQL: id, uuid, entry_date, timezone, user_uuid, created_at
// Convex:
streaks: defineTable({
  userId: v.id('users'),
  date: v.number(),                    // Midnight timestamp in user's timezone
  timezone: v.string(),
  entryId: v.optional(v.id('entries')), // NEW: link to entry
  createdAt: v.number(),
})
  .index('userId_date', ['userId', 'date']) // One per user per day
```

**Key decisions:**
- ✅ One record per day user journals
- ✅ Calculate streak length in queries (not stored)
- ✅ Link to entry for reference
- ✅ Store timezone to handle DST correctly

**Query pattern:**
```typescript
// Calculate current streak
const streaks = await ctx.db
  .query('streaks')
  .withIndex('userId_date', (q) => q.eq('userId', userId))
  .order('desc')
  .collect()

// Find consecutive days
let currentStreak = 0
for (let i = 0; i < streaks.length; i++) {
  const expectedDate = Date.now() - i * 24 * 60 * 60 * 1000
  if (streaks[i].date === expectedDate) {
    currentStreak++
  } else {
    break
  }
}
```

---

## Migration Strategy

### Phase 1: Update Existing Schema (Immediate)

Add to your current `convex/schema.ts`:

```typescript
// 1. Extend users table
users: defineTable({
  email: v.string(),
  authId: v.optional(v.string()),
  // ADD THESE:
  isOnboarded: v.boolean(),
  isPushNotifications: v.boolean(),
  journalFrequency: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('email', ['email']),

// 2. Add entries table (for TipTap editor)
entries: defineTable({
  userId: v.id('users'),
  entryDate: v.number(),
  content: v.string(),
  plainText: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('userId', ['userId'])
  .index('userId_entryDate', ['userId', 'entryDate']),
```

**Then run:**
```bash
npm run dev  # Convex will auto-migrate
```

### Phase 2: Add Tags (After entries work)

```typescript
tags: defineTable({ /* ... */ })
entryTags: defineTable({ /* ... */ })
```

### Phase 3: Add AI Questions (After tags work)

```typescript
aiQuestionTemplates: defineTable({ /* ... */ })
aiQuestions: defineTable({ /* ... */ })
```

### Phase 4: Add Streaks (After core features stable)

```typescript
streaks: defineTable({ /* ... */ })
```

---

## Performance Considerations

### Indexes to Add

**High Priority (add immediately):**
```typescript
// Most common query: get user's entries sorted by date
.index('userId_isActive_entryDate', ['userId', 'isActive', 'entryDate'])

// Get all tags for an entry
.index('entryId', ['entryId']) // on entryTags

// Get unanswered questions
.index('userId_isAnswered', ['userId', 'isAnswered']) // on aiQuestions
```

**Medium Priority (add when features launch):**
```typescript
// Find entries with specific tag
.index('tagId', ['tagId']) // on entryTags

// Calculate streaks
.index('userId_date', ['userId', 'date']) // on streaks

// Filter by role (for mentorship)
.index('role', ['role']) // on users
```

### Query Optimization Tips

1. **Always use indexes** - Convex scans are slow without them
2. **Denormalize when needed** - e.g., store `userId` in `aiQuestions` even though you can get it from `entryId`
3. **Soft deletes** - Use `isActive` in index for fast filtering
4. **Compound indexes** - Order matters! `['userId', 'date']` ≠ `['date', 'userId']`

---

## What's Different from SQL

### No More UUIDs

**SQL:**
```sql
-- Every table has both id and uuid
id BIGINT PRIMARY KEY
uuid UUID NOT NULL
```

**Convex:**
```typescript
// Just _id (automatically created)
_id: Id<"entries">
```

### No Explicit Foreign Keys

**SQL:**
```sql
ALTER TABLE "entries"
  ADD CONSTRAINT "entries_user_uuid_foreign"
  FOREIGN KEY("user_uuid") REFERENCES "users"("uuid");
```

**Convex:**
```typescript
// Just reference the ID
entries: defineTable({
  userId: v.id('users'), // Convex validates this
})
```

### Timestamps are Numbers

**SQL:**
```sql
created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL
```

**Convex:**
```typescript
createdAt: v.number(), // Date.now() in milliseconds
```

### No Enums (Use String Unions)

**SQL:**
```sql
category VARCHAR(255) CHECK ("category" IN('reflection', 'goals'))
```

**Convex:**
```typescript
// Validate in function code:
const validCategories = ['reflection', 'goals', 'gratitude'] as const
if (!validCategories.includes(category)) {
  throw new Error('Invalid category')
}
```

---

## Next Steps

1. **Review proposed schema** (`convex/schema-proposed.ts`)
2. **Decide on migration approach**:
   - Option A: Incremental (recommended) - add tables as you build features
   - Option B: All at once - copy entire proposed schema now
3. **Update auth triggers** in `convex/auth.ts`:
   - Add `isOnboarded: false` when user is created
   - Add `createdAt` and `updatedAt` timestamps
4. **Create mutation/query files**:
   - `convex/entries.ts` (for TipTap editor)
   - `convex/tags.ts` (when ready)
   - `convex/aiQuestions.ts` (when ready)
   - `convex/streaks.ts` (when ready)
5. **Test with small dataset** before production migration

---

## Questions to Consider

1. **Do you need to migrate data from SQL database?**
   - If yes: We'll need data migration scripts
   - If no: Fresh start with Convex

2. **User onboarding flow:**
   - What fields are required vs optional during signup?
   - When do you collect phone, age, mentorship preferences?

3. **Tag management:**
   - Who creates system tags? (Admin interface needed?)
   - Can users rename/delete their tags?

4. **AI question generation:**
   - When are questions generated? (On entry creation? Daily?)
   - How many questions per user at a time?

5. **Streak calculation:**
   - What timezone to use? (User's device? Stored preference?)
   - Does viewing an entry count, or only creating one?

---

## Appendix: Full Side-by-Side Comparison

| Feature | SQL Schema | Convex Schema |
|---------|------------|---------------|
| Primary keys | `id BIGINT` + `uuid UUID` | `_id: Id<"table">` |
| Foreign keys | Explicit `FOREIGN KEY` | `v.id("table")` |
| Timestamps | `TIMESTAMP WITH TIME ZONE` | `v.number()` |
| Join tables | Same concept | Same concept |
| Soft deletes | `active BOOLEAN` | `isActive: v.boolean()` |
| Indexes | `CREATE INDEX` | `.index('name', ['fields'])` |
| NOT NULL | Default | Default (use `v.optional()`) |
| Enums | `CHECK IN(...)` | String validation in code |
| Auto-increment | `SERIAL` | Automatic `_id` |

---

**Questions?** Let me know which parts need clarification or if you want to dive deeper into any specific table!

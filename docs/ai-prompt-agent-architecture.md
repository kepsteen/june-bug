# AI Writing Prompt Agent - Architecture Documentation

**Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Model](#data-model)
5. [Agent Architecture](#agent-architecture)
6. [Workflows](#workflows)
7. [API Design](#api-design)
8. [Frontend Integration](#frontend-integration)
9. [Trigger Logic](#trigger-logic)
10. [Cost & Performance](#cost--performance)

---

## Overview

### Purpose

Build an AI-powered writing prompt suggestion system that helps users with their journaling by providing personalized, context-aware prompts based on their:
- Professional profile (role, experience level, mentorship style, goals)
- Historical entries (patterns, themes, gaps in reflection)
- Current writing context (what they're writing about right now)

### Prompt Structure

Each of the **4 prompt types** includes:

| Prompt Category | Count | Generation Timing | Personalization |
|----------------|-------|-------------------|----------------|
| **Static** | 2 | Account creation | User profile only |
| **History-based** | 1 | After 5 entries | Analyzes past entries |
| **Context-aware** | 1 | Real-time (while typing) | Current entry content |

**Total per user**: 16 prompts (4 types × 4 prompts each)

### Prompt Types

1. **Reflection**: Deep questions about experiences and learnings
2. **Skill Development**: Technical prompts related to tech stack and growth
3. **Career Growth**: Prompts for career progression and goals
4. **Daily Check-ins**: Lightweight, regular journaling prompts

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│  ┌──────────────────────┐      ┌──────────────────────────┐    │
│  │   Entry Editor       │      │   Right Sidebar          │    │
│  │   (TipTap)          │◄────►│   - PromptsSection       │    │
│  │                      │      │   - PromptCard (x4 tabs) │    │
│  └──────────────────────┘      │   - Regenerate buttons   │    │
│            │                    └──────────────────────────┘    │
│            │ Real-time content            │                     │
│            │ (debounced)                  │ Queries/Mutations   │
└────────────┼──────────────────────────────┼─────────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CONVEX BACKEND                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ QUERIES                                                   │  │
│  │  • getActivePrompts(userId) → grouped by type/category   │  │
│  │  • getPromptsByType(userId, type)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MUTATIONS                                                 │  │
│  │  • createPrompt(internal) - Save generated prompts       │  │
│  │  • markPromptUsed(promptId) - Track usage               │  │
│  │  • deactivatePrompts(userId, type, category) - Cleanup  │  │
│  │  • regeneratePrompt(userId, type, category) - Trigger   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ACTIONS (AI Integration)                                  │  │
│  │  • generateStaticPrompts(userId)                         │  │
│  │    ├─ Runs at account creation                           │  │
│  │    └─ Creates 8 prompts (2 × 4 types)                   │  │
│  │                                                           │  │
│  │  • generateHistoryPrompt(userId, promptType)            │  │
│  │    ├─ Runs after 5 entries                              │  │
│  │    ├─ Analyzes recent entries via Mastra tools          │  │
│  │    └─ Creates 1 personalized prompt                     │  │
│  │                                                           │  │
│  │  • generateContextPrompt(userId, type, content)         │  │
│  │    ├─ Runs on debounced typing (2s delay)              │  │
│  │    ├─ Uses current entry content                        │  │
│  │    └─ Creates 1 contextual prompt                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TRIGGERS                                                  │  │
│  │  • Onboarding completion → generateStaticPrompts         │  │
│  │  • Entry count === 5 → generateHistoryPrompt (all types) │  │
│  │  • Manual refresh → regeneratePrompt                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MASTRA AGENT LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ promptAgent (Mastra Agent)                                │  │
│  │                                                           │  │
│  │  Model: openai('gpt-4o')                                 │  │
│  │                                                           │  │
│  │  Instructions: Career coaching, journaling expertise,    │  │
│  │                adapts to mentorship style                │  │
│  │                                                           │  │
│  │  Tools:                                                   │  │
│  │    • analyzeEntries - Pattern/gap identification         │  │
│  │    • getUserContext - Fetch profile data                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────────────┐    │
│  │ analyzeEntries Tool │  │ getUserContext Tool          │    │
│  │                     │  │                              │    │
│  │ Input:              │  │ Input:                       │    │
│  │  • entries[]        │  │  • userId                    │    │
│  │  • lookback (5-10)  │  │                              │    │
│  │                     │  │ Output:                      │    │
│  │ Output:             │  │  • role, level               │    │
│  │  • themes[]         │  │  • mentorshipStyle           │    │
│  │  • gaps[]           │  │  • goals[], techStack[]      │    │
│  │  • patterns[]       │  └──────────────────────────────┘    │
│  │  • recentTopics[]   │                                       │
│  └─────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │   OpenAI GPT-4o     │
                   │   API               │
                   └─────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TanStack Start | UI framework |
| **State Management** | TanStack React Query | Server state, caching |
| **Real-time DB** | Convex | Backend, queries, mutations, actions |
| **Agent Framework** | Mastra | Agent orchestration, tool calling |
| **AI SDK** | Vercel AI SDK | LLM interface, streaming |
| **LLM Provider** | OpenAI | GPT-4o model |
| **Validation** | Zod | Schema validation |

### Dependencies

```json
{
  "@mastra/core": "latest",
  "@ai-sdk/openai": "latest",
  "ai": "latest",
  "zod": "^3.x"
}
```

---

## Data Model

### Database Schema (Convex)

#### `prompts` Table

```typescript
defineTable({
  // Core fields
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

  // Generation metadata
  promptMetadata: v.optional(v.object({
    model: v.string(),           // 'gpt-4o' or 'template'
    tokensUsed: v.number(),      // Cost tracking
    generatedAt: v.number(),     // Timestamp
    version: v.number()          // Prompt iteration
  })),

  // Usage tracking
  timesShown: v.number(),        // Display count
  timesUsed: v.number(),         // Actually used count
  lastShownAt: v.optional(v.number()),

  // State
  isActive: v.boolean(),         // Soft delete
  createdAt: v.number(),
  updatedAt: v.number()
})
.index('by_user', ['userId'])
.index('by_user_type', ['userId', 'promptType', 'isActive'])
.index('by_user_category', ['userId', 'promptCategory'])
```

#### Indexes Strategy

- **`by_user`**: Fast user-scoped queries
- **`by_user_type`**: Filter by prompt type
- **`by_user_category`**: Query specific categories

#### Data Lifecycle

1. **Creation**: Prompts created via Convex actions
2. **Activation**: `isActive = true` by default
3. **Deactivation**: Old prompts soft-deleted when regenerated
4. **Cleanup**: Periodic job to remove old inactive prompts (future)

---

## Agent Architecture

### Mastra Agent Design

#### Core Agent: `promptAgent`

**File**: `/src/mastra/agents/promptAgent.ts`

```typescript
export const promptAgent = new Agent({
  name: 'prompt-generator',
  model: openai('gpt-4o'),

  instructions: `You are an expert career coach and journaling assistant
  specializing in software engineering career development.

  Your role:
  - Generate thoughtful, personalized writing prompts
  - Help users reflect on technical growth and challenges
  - Track progress toward career goals
  - Develop skills aligned with experience level
  - Maintain consistent professional development habits

  Adapt tone based on mentorship style:
  - Structured: Clear, step-by-step prompts with objectives
  - Exploratory: Open-ended discovery questions
  - Challenge-driven: Boundary-pushing problem-solving
  - Reflective: Deep, introspective questions

  Always make prompts:
  ✓ Specific and actionable
  ✓ Appropriate for experience level
  ✓ Relevant to tech stack and goals
  ✓ Engaging yet professional`,

  tools: {
    analyzeEntries: analyzeEntriesToolDefinition,
    getUserContext: getUserContextToolDefinition
  }
});
```

### Tool Definitions

#### 1. `analyzeEntries` Tool

**Purpose**: Analyze user's journal entries to identify patterns, themes, and reflection gaps

**Input Schema**:
```typescript
z.object({
  entries: z.array(z.object({
    date: z.string(),
    content: z.string(),
    plainText: z.string()
  })),
  lookback: z.number().optional() // Default: 5
})
```

**Output Schema**:
```typescript
z.object({
  themes: z.array(z.string()),       // Main topics discussed
  gaps: z.array(z.string()),         // Unexplored areas
  patterns: z.array(z.string()),     // Behavioral patterns
  recentTopics: z.array(z.string())  // Latest focus areas
})
```

**Execution Logic**:
```typescript
execute: async ({ inputData }) => {
  const { entries, lookback = 5 } = inputData;
  const recentEntries = entries.slice(0, lookback);

  // 1. Extract themes (keyword frequency, topic modeling)
  const themes = extractThemes(recentEntries);

  // 2. Identify gaps (compare against user goals, tech stack)
  const gaps = identifyGaps(recentEntries, userGoals);

  // 3. Find patterns (reflection frequency, entry length trends)
  const patterns = findPatterns(recentEntries);

  // 4. Recent topics (last 3 entries)
  const recentTopics = extractRecentTopics(recentEntries.slice(0, 3));

  return { themes, gaps, patterns, recentTopics };
}
```

#### 2. `getUserContext` Tool

**Purpose**: Fetch comprehensive user profile for personalization

**Input Schema**:
```typescript
z.object({
  userId: z.string()
})
```

**Output Schema**:
```typescript
z.object({
  role: z.string().optional(),
  level: z.string().optional(),
  mentorshipStyle: z.string().optional(),
  goals: z.array(z.string()),
  techStack: z.array(z.string())
})
```

**Execution Logic**:
```typescript
execute: async ({ context, inputData }) => {
  // Passed from Convex action via context
  return {
    role: context.user.currentRole,
    level: context.user.experienceLevel,
    mentorshipStyle: context.user.mentorshipStyle,
    goals: context.user.developmentGoals || [],
    techStack: context.user.techStack || []
  };
}
```

---

## Workflows

### Workflow 1: Static Prompt Generation

**Trigger**: Account creation (onboarding completion)
**Frequency**: Once per user
**Input**: User profile
**Output**: 8 prompts (2 per type)

```typescript
// Convex Action: generateStaticPrompts
const promptTypes = ['reflection', 'skill-development', 'career-growth', 'daily-checkin'];

for (const type of promptTypes) {
  const systemPrompt = buildSystemPromptForStatic(user, type);

  const result = await promptAgent.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate 2 ${type} prompts.
                  Return as JSON: [{prompt: "..."}, {prompt: "..."}]`
      }
    ]
  });

  // Parse and save
  const prompts = parsePromptsFromResponse(result.text);
  for (const promptText of prompts) {
    await createPrompt({ userId, type, category: 'static', promptText });
  }
}
```

**System Prompt Builder**:
```typescript
function buildSystemPromptForStatic(user, type) {
  const styleGuide = {
    'Structured': 'Create clear, step-by-step prompts with specific objectives.',
    'Exploratory': 'Create open-ended questions that encourage discovery.',
    'Challenge-driven': 'Create prompts that push boundaries and problem-solving.',
    'Reflective': 'Create deep, introspective questions about experiences.'
  };

  return `Generate ${type} prompts for a ${user.experienceLevel}
  working in ${user.currentRole}.

  Mentorship style: ${user.mentorshipStyle}
  ${styleGuide[user.mentorshipStyle]}

  Tech stack: ${user.techStack.join(', ')}
  Goals: ${user.developmentGoals.join(', ')}

  These are STATIC prompts (not personalized to recent entries).`;
}
```

**Error Handling**:
```typescript
try {
  // AI generation
} catch (error) {
  console.error('Failed to generate static prompts:', error);
  // Fallback: Use template prompts
  const fallbackPrompts = getTemplatePrompts(type, user.mentorshipStyle);
  for (const promptText of fallbackPrompts) {
    await createPrompt({
      userId, type, category: 'static', promptText,
      metadata: { model: 'template', tokensUsed: 0 }
    });
  }
}
```

---

### Workflow 2: History-Based Prompt Generation

**Trigger**: After 5 entries
**Frequency**: Once initially, then every 10 entries or manual refresh
**Input**: User profile + last 10 entries
**Output**: 1 personalized prompt per type

```typescript
// Convex Action: generateHistoryPrompt
const user = await getUserInternal(userId);
const entries = await getRecentEntriesInternal(userId, 10);

if (entries.length < 5) return; // Not enough data

const result = await promptAgent.generate({
  messages: [
    {
      role: 'system',
      content: buildSystemPromptForHistory(user, promptType)
    },
    {
      role: 'user',
      content: buildHistoryPromptRequest(entries, promptType)
    }
  ],
  toolChoice: 'auto', // Let agent use analyzeEntries tool
});

// Deactivate old history prompt
await deactivatePrompts({ userId, promptType, category: 'history-based' });

// Save new prompt
await createPrompt({
  userId, promptType,
  category: 'history-based',
  promptText: result.text
});
```

**Agent Tool Usage**:
```typescript
// Agent internally calls analyzeEntries tool
const analysis = await analyzeEntries({
  entries: entries.map(e => ({
    date: e.entryDate,
    content: e.content,
    plainText: e.plainText
  })),
  lookback: 10
});

// Uses analysis.themes, analysis.gaps to generate targeted prompt
```

**System Prompt for History**:
```typescript
function buildSystemPromptForHistory(user, type) {
  return `Analyze the user's recent journal entries and generate
  a personalized ${type} prompt that:

  1. Addresses patterns or gaps in their reflection
  2. Builds on themes they've been exploring
  3. Encourages growth in areas they haven't covered
  4. Aligns with their ${user.mentorshipStyle} style

  User context:
  - Role: ${user.currentRole}
  - Level: ${user.experienceLevel}
  - Goals: ${user.developmentGoals.join(', ')}

  Use the analyzeEntries tool to identify themes and gaps.`;
}
```

---

### Workflow 3: Context-Aware Prompt Generation

**Trigger**: Real-time (debounced on typing, 2s delay)
**Frequency**: Every significant content change (>150 chars)
**Input**: User profile + current entry content
**Output**: 1 contextual prompt

```typescript
// Convex Action: generateContextPrompt
if (currentContent.length < 100) return; // Too short

const user = await getUserInternal(userId);

const result = await promptAgent.generate({
  messages: [
    {
      role: 'system',
      content: buildSystemPromptForContext(user, promptType)
    },
    {
      role: 'user',
      content: `User is currently writing: "${currentContent.slice(0, 500)}"

                Generate a ${promptType} prompt that deepens their
                reflection on this specific topic.`
    }
  ]
});

// Deactivate old context prompt
await deactivatePrompts({ userId, promptType, category: 'context-aware' });

// Save new context prompt
await createPrompt({
  userId, promptType,
  category: 'context-aware',
  promptText: result.text
});
```

**Frontend Debouncing**:
```typescript
// useContextPrompts hook
const debouncedContent = useDebounce(currentContent, 2000);

useEffect(() => {
  if (debouncedContent.length > 150) {
    generateContextPrompt({
      userId,
      promptType: activePromptType,
      currentContent: debouncedContent
    });
  }
}, [debouncedContent, activePromptType]);
```

---

## API Design

### Convex Queries

#### `getActivePrompts`

```typescript
query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('isActive'), true))
      .collect();

    // Group by type and category
    return {
      reflection: {
        static: [...],
        'history-based': [...],
        'context-aware': [...]
      },
      // ... other types
    };
  }
});
```

**Response Format**:
```json
{
  "reflection": {
    "static": [
      { "_id": "...", "promptText": "...", "timesUsed": 0 },
      { "_id": "...", "promptText": "...", "timesUsed": 2 }
    ],
    "history-based": [
      { "_id": "...", "promptText": "...", "timesUsed": 5 }
    ],
    "context-aware": [
      { "_id": "...", "promptText": "...", "timesUsed": 1 }
    ]
  },
  "skill-development": { ... },
  "career-growth": { ... },
  "daily-checkin": { ... }
}
```

### Convex Mutations

#### `markPromptUsed`

```typescript
mutation({
  args: { promptId: v.id('prompts') },
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId);
    await ctx.db.patch(promptId, {
      timesUsed: prompt.timesUsed + 1,
      lastShownAt: Date.now()
    });
  }
});
```

#### `regeneratePrompt`

```typescript
mutation({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
    category: v.string()
  },
  handler: async (ctx, { userId, promptType, category }) => {
    // Trigger appropriate action via scheduler
    if (category === 'history-based') {
      await ctx.scheduler.runAfter(0,
        internal.ai.prompts.generateHistoryPrompt,
        { userId, promptType }
      );
    }
  }
});
```

### Convex Actions

#### `generateStaticPrompts`

```typescript
internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(internal.users.getUserInternal, { userId });

    for (const type of promptTypes) {
      // Generate 2 prompts via Mastra agent
      // Save via mutation
    }
  }
});
```

---

## Frontend Integration

### Component Hierarchy

```
<EntryEditor>
  ├─ <Editor> (TipTap)
  └─ <RightSidebar>
      └─ <PromptsSection>
          ├─ <Tabs> (4 types)
          │   ├─ reflection
          │   ├─ skill-development
          │   ├─ career-growth
          │   └─ daily-checkin
          └─ <TabContent>
              ├─ <PromptCard category="Static" /> (x2)
              ├─ <PromptCard category="Personalized" canRegenerate />
              └─ <PromptCard category="Context" />
```

### Data Flow

```typescript
// 1. Fetch prompts
const { data: prompts } = convexQuery(
  api.prompts.getActivePrompts,
  { userId }
);

// 2. Display in UI
prompts.reflection.static.map(prompt =>
  <PromptCard prompt={prompt} onUse={handleUse} />
)

// 3. User clicks "Use"
const handleUse = (promptText) => {
  editor.commands.insertContent(`\n\n**${promptText}**\n\n`);
  markPromptUsed({ promptId: prompt._id });
};

// 4. User clicks "Regenerate"
regeneratePrompt({ userId, promptType, category: 'history-based' });
```

---

## Trigger Logic

### 1. Onboarding Completion

**File**: `/convex/onboarding.ts`

```typescript
export const completeOnboarding = mutation({
  handler: async (ctx, args) => {
    // ... existing onboarding logic ...

    // Trigger static prompt generation
    await ctx.scheduler.runAfter(0,
      internal.ai.prompts.generateStaticPrompts,
      { userId }
    );
  }
});
```

### 2. Entry Count Threshold

**File**: `/convex/entries.ts`

```typescript
export const createEntry = mutation({
  handler: async (ctx, args) => {
    // ... create entry logic ...

    const entryCount = await ctx.db
      .query('entries')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('isActive'), true))
      .collect()
      .then(entries => entries.length);

    // Generate all history prompts at 5 entries
    if (entryCount === 5) {
      const types = ['reflection', 'skill-development', 'career-growth', 'daily-checkin'];
      for (const type of types) {
        await ctx.scheduler.runAfter(0,
          internal.ai.prompts.generateHistoryPrompt,
          { userId, promptType: type }
        );
      }
    }
  }
});
```

### 3. Real-time Context (Frontend)

**Hook**: `/src/hooks/useContextPrompts.ts`

```typescript
export function useContextPrompts(userId, currentContent, activeType) {
  const debouncedContent = useDebounce(currentContent, 2000);
  const lastGeneratedRef = useRef('');

  const generate = useMutation({
    mutationFn: async () => {
      await api.ai.prompts.generateContextPrompt({
        userId,
        promptType: activeType,
        currentContent: debouncedContent
      });
    }
  });

  useEffect(() => {
    if (
      debouncedContent.length > 150 &&
      debouncedContent !== lastGeneratedRef.current
    ) {
      lastGeneratedRef.current = debouncedContent;
      generate.mutate();
    }
  }, [debouncedContent, activeType]);
}
```

---

## Cost & Performance

### Cost Estimation

**Model**: GPT-4o
**Pricing**: ~$5/1M input tokens, ~$15/1M output tokens

| Operation | Frequency | Input Tokens | Output Tokens | Cost/Month (100 users) |
|-----------|-----------|--------------|---------------|------------------------|
| Static prompts | Once/user | 500 | 200 | $0.14 |
| History prompts | Every 10 entries | 2000 | 150 | $2.15 |
| Context prompts | 5x/session | 800 | 100 | $4.50 |
| **Total** | - | - | - | **~$7/month** |

**Optimization Opportunities**:
1. Switch context prompts to GPT-4o-mini (20x cheaper)
2. Batch static prompt generation (1 call instead of 8)
3. Cache context prompts (avoid regeneration for similar content)

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Prompt generation time | <3s (P95) | Action execution time |
| UI loading time | <500ms | Time to display prompts |
| Context generation latency | <2s | Debounce + API call |
| Query response time | <100ms | Convex query execution |

### Monitoring

```typescript
// Track in promptMetadata
{
  model: 'gpt-4o',
  tokensUsed: 1234,
  generatedAt: Date.now(),
  executionTimeMs: 2341
}

// Analytics queries
- Total tokens used/day
- Generation failures
- Prompt usage rate
- User engagement (timesUsed / timesShown)
```

---

## Error Handling & Fallbacks

### Graceful Degradation

```typescript
try {
  // AI generation
  const result = await promptAgent.generate(...);
  return result.text;
} catch (error) {
  console.error('AI generation failed:', error);

  // Fallback 1: Template prompts
  if (category === 'static') {
    return getTemplatePrompts(type, user.mentorshipStyle);
  }

  // Fallback 2: Don't create prompt (history/context)
  // User will still see static prompts
  return null;
}
```

### Template Prompts

**File**: `/convex/ai/promptTemplates.ts`

```typescript
export const PROMPT_TEMPLATES = {
  reflection: {
    Structured: [
      "What specific challenge did you face today, and what steps did you take to address it?",
      "List three things you learned this week and how you can apply them."
    ],
    Exploratory: [
      "What surprised you most about your work this week?",
      "If you could change one thing about how you approached a recent project, what would it be?"
    ],
    'Challenge-driven': [
      "What's the hardest problem you're currently working on? How are you pushing yourself to solve it?",
      "What skill are you deliberately practicing outside your comfort zone?"
    ],
    Reflective: [
      "How did today's work align with your long-term career goals?",
      "What emotions did you experience during your most challenging moment today?"
    ]
  },
  // ... other types
};
```

---

## Security & Privacy

### Data Access

- All prompts scoped to `userId` (never cross-user)
- Convex auth middleware validates user identity
- Internal actions/mutations prevent direct client access

### Content Processing

- Entry content only sent to OpenAI (privacy policy compliance)
- No storage of raw prompts in OpenAI systems
- User can delete prompts (soft delete via `isActive`)

---

## Future Enhancements

1. **Prompt Rating**: Let users rate prompts (👍/👎) to improve quality
2. **Embedding-based Search**: Pre-generate prompt pool, use semantic search
3. **Prompt Chains**: Multi-step prompts that build on each other
4. **Voice Prompts**: Audio prompts for accessibility
5. **Scheduled Prompts**: Daily email/push notifications with prompts
6. **Collaborative Prompts**: Share favorite prompts with community

---

## Appendix

### File Structure

```
/src/
  /mastra/
    index.ts                    # Mastra instance
    /agents/
      promptAgent.ts            # Main agent definition
      types.ts                  # TypeScript types
    /tools/
      analyzeEntries.ts         # Entry analysis tool
      getUserContext.ts         # User context tool
  /components/
    /prompts/
      PromptsSection.tsx        # Main container
      PromptCard.tsx            # Individual prompt display
  /hooks/
    useContextPrompts.ts        # Real-time generation hook
    useDebounce.ts              # Utility hook

/convex/
  /ai/
    prompts.ts                  # AI actions
    promptTemplates.ts          # Fallback templates
  prompts.ts                    # Queries & mutations
  onboarding.ts                 # Modified for trigger
  entries.ts                    # Modified for trigger
  schema.ts                     # Extended schema
```

### Key Dependencies

```bash
npm install @mastra/core @ai-sdk/openai ai zod
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
```

---

**Documentation Version**: 1.0
**Last Updated**: 2025-11-15
**Maintainer**: Engineering Team

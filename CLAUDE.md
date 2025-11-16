# June Bug - Developer Journaling App

## Application Overview

**June Bug** is a developer-focused journaling application designed to help developers track their learning journey, reflect on their work, and receive personalized mentorship-style guidance. The app combines real-time data synchronization, rich text editing, and AI-powered features to create an engaging journaling experience.

### Core Value Proposition
- **Daily Reflection**: One journal entry per day with rich text editing
- **AI Assistance**: Automatic title generation and personalized prompts
- **Developer-Focused**: Built by developers, for developers
- **Privacy-First**: Your journal entries are private and secure
- **Mentorship-Driven**: Onboarding captures preferences for personalized guidance

---

## Tech Stack

### Frontend
- **TanStack Start** (v1.135.2) - Full-stack React framework with file-based routing and SSR
- **React 19** - Latest React with concurrent features
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Data fetching and caching with optimistic updates
- **Vite** (v7.1.9) - Build tool and dev server
- **TypeScript 5.7** - End-to-end type safety

### Backend & Database
- **Convex** (v1.29.0) - Real-time backend with type-safe queries and mutations
- **Better Auth** (v1.3.27) - Comprehensive authentication system
- **@convex-dev/better-auth** - Convex adapter for Better Auth
- **@convex-dev/react-query** - Seamless Convex + React Query integration

### Rich Text Editor
- **TipTap** (v3.10.5) - Extensible rich text editor based on ProseMirror
  - Slash commands for quick formatting (`/heading`, `/bullet`, etc.)
  - Bubble menu for text selection actions (bold, italic, link)
  - Task lists, code blocks, images, links
  - Custom placeholder extension
  - Image upload support via Convex storage

### UI Components & Styling
- **shadcn/ui** (v3.5.0) - Customizable component library built on:
  - **Radix UI** - Unstyled, accessible component primitives
  - **Tailwind CSS v4** - Utility-first styling with CSS variables
  - **class-variance-authority** - Type-safe component variants
  - **Lucide React** - Icon library
- **cmdk** (v1.1.1) - Command menu for search functionality
- **Framer Motion** (v12.23.24) - Animation library for smooth transitions
- **Sonner** - Beautiful toast notifications

### AI Features
- **AI SDK** (@ai-sdk/openai v2.0.65) - Vercel AI SDK for AI integrations
- **OpenAI GPT-3.5-turbo** - AI title generation for entries (100+ words)

### Deployment
- **Netlify** - Hosting platform with TanStack Start adapter

---

## Current Features

### 1. Authentication & User Management
- **Email/Password Authentication** via Better Auth
- **GitHub OAuth Integration** (configured and ready)
- **Two-Factor Authentication** support
- **User Profile Management**
- **Protected Routes** with automatic redirects
- **Session Management** with SSR support
- **Anonymous → Authenticated Migration** (local entries transferred on sign-in)

### 2. User Onboarding
A chat-style conversational onboarding flow that collects:

**Profile Information:**
- Full name, age (optional), current role
- Experience level: Junior, Mid-Level, Senior, Lead, Principal

**Learning Preferences:**
- Mentorship style: Structured, Exploratory, Challenge-driven, Reflective
- Development goals (multiple selection)
- Tech stack (multiple selection)
- Work environment type

**Journaling Schedule:**
- Frequency: Daily, Every other day, Weekly, Custom schedule
- Preferred journaling time
- Notification preferences

**UI Features:**
- Vertical timeline showing progress through 4 stages
- Animated transitions between stages
- Real-time validation
- Skip-able fields (age, notifications)

### 3. Journal Entry Management

#### Rich Text Editor (TipTap)
**Formatting Options:**
- Headings (H1, H2, H3)
- Text styles: Bold, Italic, Underline, Code
- Lists: Bullet lists, Ordered lists, Task lists
- Links with custom styling
- Image uploads (stored in Convex storage)
- Placeholder text with slash command hints

**Entry Features:**
- **One Entry Per Day**: Entries are date-based (can be backdated)
- **Auto-Save**: Saves every 3 seconds while typing
- **Dirty State Tracking**: Prevents navigation with unsaved changes
- **AI-Generated Titles**: Triggers after 100+ word count
- **Plain Text Extraction**: For search functionality
- **Soft Delete**: Entries marked inactive rather than permanently deleted
- **Version Tracking**: Prevents race conditions during saves

#### Navigation
- **Resizable Left Sidebar** with entry list
- **Entry Search** functionality
- **Date-Based Organization**
- **Recent Entries** quick access

### 4. Search & Navigation
- **Command Menu** (Cmd/Ctrl+K keyboard shortcut)
- Search through entry titles and content
- Shows 7 most recent entries by default
- Filters entries as you type
- Quick navigation to any entry
- Keyboard-first interface

### 5. Tag System (Schema Ready)
The tag system is fully implemented at the database level:
- **System-Generated Tags**: Predefined tags for common topics
- **User-Created Tags**: Custom tags per user
- **Many-to-Many Relationship**: Entries can have multiple tags
- **Tag Statistics**: Usage counts and analytics
- **Color & Emoji Support**: Visual organization
- **Soft Delete**: Tag archiving

### 6. UI/UX Features
- **Dark/Light Theme Toggle** with React Context
- **Theme Persistence** to localStorage
- **Resizable Left Sidebar** (entries list, 200px-500px range)
- **Collapsible Right Sidebar** (prompts - in development)
- **Floating June Bug Logo** with animations
- **Responsive Design** across devices
- **Button Groups** that adapt to sidebar state
- **Notched Background** design element
- **Developer Tools** (TanStack DevTools integration)

### 7. AI Features
**AI Title Generation:**
- Automatically generates titles for entries over 100 words
- Uses OpenAI GPT-3.5-turbo
- Runs asynchronously via Convex scheduled functions
- Max 8 words per title
- Falls back to date-based title if generation fails

---

## Project Structure

```
june-bug/
├── convex/                      # Backend (Convex)
│   ├── auth.ts                  # Better Auth config & user management
│   ├── entries.ts               # Entry CRUD operations (create, get, update, delete)
│   ├── tags.ts                  # Tag management (system + user tags)
│   ├── onboarding.ts            # Onboarding completion handler
│   ├── ai.ts                    # AI title generation
│   ├── schema.ts                # Database schema definition
│   ├── http.ts                  # HTTP routes for Better Auth
│   ├── betterAuth/              # Better Auth Convex component
│   └── _generated/              # Auto-generated types and API
│
├── src/
│   ├── routes/                  # TanStack Router routes (file-based)
│   │   ├── __root.tsx           # Root layout with auth context
│   │   ├── index.tsx            # Redirects to /entries
│   │   ├── entries.{-$entryId}.tsx  # Main entry editor (optional date param)
│   │   ├── onboarding.tsx       # Chat-style onboarding flow
│   │   ├── settings.tsx         # User settings page
│   │   ├── sign-in.tsx          # Sign in page
│   │   └── sign-up.tsx          # Sign up page
│   │
│   ├── components/
│   │   ├── editor/              # TipTap editor components
│   │   │   ├── tiptap-editor.tsx        # Main editor component
│   │   │   ├── entry-form.tsx           # Entry form wrapper
│   │   │   ├── editor-bubble-menu.tsx   # Text selection menu
│   │   │   ├── slash-command.tsx        # Slash command menu
│   │   │   └── prompts-sidebar.tsx      # Right sidebar (in development)
│   │   ├── chat-onboarding/     # Chat-style onboarding UI
│   │   │   ├── ChatOnboarding.tsx
│   │   │   ├── AssistantMessage.tsx
│   │   │   ├── UserMessage.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── VerticalTimeline.tsx
│   │   ├── sidebar/
│   │   │   └── EntriesSidebar.tsx       # Left sidebar with entry list
│   │   ├── search-command-menu.tsx      # Cmd+K search menu
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── command.tsx              # Command menu primitive
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (30+ components)
│   │   ├── theme-toggle.tsx     # Dark/light mode toggle
│   │   └── june-bug-logo.tsx    # Animated logo
│   │
│   ├── hooks/
│   │   ├── use-entries.ts               # Unified entry management hook
│   │   ├── use-search-command.ts        # Cmd+K keyboard shortcut
│   │   ├── use-resizable-sidebar.ts     # Left sidebar resize logic
│   │   ├── use-collapsible-right-sidebar.ts  # Right sidebar state
│   │   └── use-theme.ts                 # Theme context hook
│   │
│   ├── lib/
│   │   ├── auth-client.ts               # Better Auth client config
│   │   ├── auth-server.ts               # Server-side auth utilities
│   │   ├── entry-utils.ts               # Entry helper functions
│   │   ├── local-storage-entries.ts     # Local storage management
│   │   ├── migrate-local-entries.ts     # Migration to authenticated storage
│   │   └── utils.ts                     # General utilities (cn, etc.)
│   │
│   ├── contexts/
│   │   └── theme-context.tsx            # Theme provider (dark/light mode)
│   │
│   └── styles/
│       └── app.css                      # Global styles + Tailwind directives
│
├── public/                      # Static assets
├── .env.local                   # Environment variables (not in git)
├── components.json              # shadcn/ui configuration
├── vite.config.ts              # Vite + TanStack Start config
├── package.json                # Dependencies and scripts
└── README.md                   # Setup and usage guide
```

---

## Data Models (Convex Schema)

### Users Table
Stores user profiles and onboarding data.

```typescript
{
  // Authentication
  email?: string                 // Optional (OAuth users may not have email)
  authId?: string                // Better Auth user ID (link to auth tables)

  // Onboarding
  isOnboarded: boolean           // Has completed onboarding flow

  // Profile
  fullName?: string
  age?: number
  currentRole?: string
  experienceLevel?: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Principal'

  // Learning Preferences
  mentorshipStyle?: 'Structured' | 'Exploratory' | 'Challenge-driven' | 'Reflective'
  developmentGoals?: string[]    // Array of goal names
  techStack?: string[]           // Array of technologies
  workEnvironment?: string

  // Journaling Schedule
  journalingFrequency?: 'Daily' | 'Every other day' | 'Weekly' | 'Custom schedule'
  customScheduleDays?: string[]  // e.g., ['Monday', 'Wednesday', 'Friday']
  journalingTime?: string        // e.g., '09:00'
  notificationPreferences?: string[]

  // Timestamps
  createdAt: number
  updatedAt: number
}
```

**Indexes:**
- `authId` (for Better Auth integration)

### Entries Table
Stores journal entries with rich text content.

```typescript
{
  userId: Id<'users'>            // Entry owner
  entryDate: number              // Midnight timestamp for the entry date
  content: string                // TipTap JSON stringified
  plainText?: string             // Plain text extraction for search
  aiTitle?: string               // AI-generated title (100+ words)
  isActive: boolean              // Soft delete flag (true = active)
  createdAt: number
  updatedAt: number
}
```

**Indexes:**
- `userId` - Find all entries for a user
- `userId_entryDate` - Unique constraint (one entry per date per user)
- `userId_isActive_entryDate` - Query active entries sorted by date

**Constraints:**
- One entry per user per date (enforced at DB level)

### Tags Table
System-generated and user-created tags.

```typescript
{
  name: string                   // Tag name (unique per user)
  isSystemGenerated: boolean     // System vs user-created
  userId?: Id<'users'>           // Null for system tags, user ID for custom tags
  emoji?: string                 // Optional emoji
  color?: string                 // Color code for UI
  isActive: boolean              // Soft delete flag
  createdAt: number
}
```

**Indexes:**
- `userId` - Find user's tags
- `name` - Find tags by name
- `userId_name` - Prevent duplicate tag names per user
- `isSystemGenerated` - Separate system vs user tags
- `userId_isActive` - Query active tags

### EntryTags Table
Many-to-many relationship between entries and tags.

```typescript
{
  entryId: Id<'entries'>
  tagId: Id<'tags'>
  createdAt: number
}
```

**Indexes:**
- `entryId` - Find all tags for an entry
- `tagId` - Find all entries with a tag
- `entryId_tagId` - Prevent duplicate tags on same entry

### Todos Table
Example/demo table (may be removed).

```typescript
{
  text: string
  completed: boolean
  userId: Id<'users'>
  createdAt: number
  updatedAt: number
}
```

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Convex account (free tier available)
- OpenAI API key (for AI features)
- GitHub OAuth app (optional, for GitHub login)

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Convex (get from https://dashboard.convex.dev)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment-name
CONVEX_SITE_URL=https://your-deployment.convex.site
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site

# Better Auth
SITE_URL=http://localhost:3000

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI (for AI title generation)
OPENAI_API_KEY=sk-your-openai-api-key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server (runs Vite + Convex dev)
npm run dev
```

This starts:
- Vite dev server on `http://localhost:3000`
- Convex backend with live updates

### Development Commands

```bash
# Development
npm run dev              # Start Vite + Convex dev servers
npm run dev:vite         # Start only Vite dev server
npm run dev:convex       # Start only Convex dev server

# Building
npm run build            # Deploy Convex + build Vite for production

# Code Quality
npm run lint             # Run Prettier + ESLint
npm run format           # Auto-format code with Prettier

# Utilities
npm run generate-mock-entries  # Generate test journal entries
```

### Adding shadcn/ui Components

```bash
# Add a single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add dialog form toast
```

Components are added to `src/components/ui/` and can be customized.

---

## Key Architectural Patterns

### 1. Authentication Flow

**Better Auth Integration:**
- Better Auth manages authentication state and sessions
- Creates two user records:
  1. Better Auth tables (managed by library)
  2. App `users` table (managed by us)
- Linked via `authId` field in app user record
- Triggers keep tables in sync:
  - `onUserCreated` - Create app user when auth user is created
  - `onUserUpdated` - Sync email changes
  - `onUserDeleted` - Clean up app user

**Session Management:**
- Client-side: `authClient.useSession()` hook
- Server-side: `getAuthUser()` in route loaders
- Protected routes redirect to `/sign-in` if not authenticated

### 2. Data Fetching Strategy

**Convex + React Query Integration:**
- Convex provides real-time subscriptions
- React Query adds caching and optimistic updates
- SSR support via `fetchQuery` in route loaders

**Pattern:**
```typescript
// Server-side (route loader)
const entries = await fetchQuery(api.entries.listEntries, { userId });

// Client-side (component)
const { data: entries } = useSuspenseQuery(
  convexQuery(api.entries.listEntries, { userId })
);
```

### 3. Entry Management

**Core Principles:**
- **One Entry Per Date**: Enforced via `userId_entryDate` unique index
- **Auto-Save**: Debounced saves every 3 seconds
- **Dirty Tracking**: Prevents navigation with unsaved changes
- **Version Tracking**: Last save timestamp prevents race conditions
- **Soft Delete**: `isActive` flag instead of deletion

**Save Flow:**
1. User types in editor
2. `onChange` updates local state
3. Debounced save (3 seconds) triggers mutation
4. Optimistic update shows success immediately
5. Background: AI title generation (if 100+ words)

### 4. Type Safety

**End-to-End Types:**
- Convex schema generates TypeScript types
- `convex/_generated/api.ts` - Auto-generated API
- `convex/_generated/dataModel.ts` - Table types
- No manual type definitions needed for DB operations

**Pattern:**
```typescript
// Convex automatically infers types
export const getEntry = query({
  args: { entryId: v.id('entries') },
  handler: async (ctx, args) => {
    // ctx.db is fully typed
    const entry = await ctx.db.get(args.entryId);
    return entry; // Type: Entry | null
  },
});
```

### 5. Theming System

**React Context + CSS Variables:**
- `ThemeProvider` wraps app in `__root.tsx`
- Theme state persisted to localStorage
- CSS variables in `app.css` for colors
- Toggle updates context and document class

**Recent Fix:**
- PR #27 resolved dark mode reset bug
- Moved theme state to React Context
- Previously relied on class manipulation which had race conditions

---

## Current Development Status

### Active Branch
**`feature/search-command-menu`**

Implementing Cmd+K search functionality for quick entry navigation.

### Recent Changes (Uncommitted)
1. Added `cmdk` package for command menu
2. Created `SearchCommandMenu` component
3. Added shadcn `command` UI component
4. Created `use-search-command` hook for keyboard shortcut
5. Integrated search into `/entries` route

**Uncommitted Files:**
- `.claude/settings.local.json` (updated tool permissions)
- `package.json` & `package-lock.json` (added cmdk)
- `src/components/search-command-menu.tsx` (new)
- `src/components/ui/command.tsx` (new)
- `src/hooks/use-search-command.ts` (new)

### Recent PRs
1. **PR #27** - Fixed dark mode theme conflict using React Context
2. **PR #26** - Replaced multi-step onboarding with chat-style interface

---

## Coding Conventions

### General
- **Always use ESM** over CommonJS (es6 imports/exports)
- **TypeScript strict mode** enabled
- **Prettier** for formatting (automatic on save)
- **ESLint** for code quality

### File Naming
- Components: PascalCase (e.g., `ChatOnboarding.tsx`)
- Utilities: kebab-case (e.g., `entry-utils.ts`)
- Hooks: kebab-case with `use-` prefix (e.g., `use-theme.ts`)

### Component Patterns
- Use function components with hooks
- Prefer named exports over default exports
- Co-locate types with components when possible
- Use `cn()` utility for conditional className merging

### Convex Patterns
- One file per domain (entries, tags, auth, etc.)
- Export queries, mutations, and actions
- Use `v` validators for all args
- Always check user authentication in handlers

### Git Workflow
- **Create new branch** for each feature (per CLAUDE.md instructions)
- Descriptive commit messages
- Squash commits before merging
- Main branch: `main` (assumed, verify with git)

---

## Future Features (Planned)

Based on schema and architecture:

1. **Tag Filtering** - Filter entries by tags in sidebar
2. **AI Prompts** - Personalized writing prompts in right sidebar
3. **Streaks Tracking** - Daily journaling streaks and statistics
4. **Mentorship Features** - Based on user preferences from onboarding
5. **Projects** - Organize entries by projects/topics
6. **Advanced Search** - Full-text search with filters (tags, dates, etc.)
7. **Export** - Export entries to markdown, PDF, etc.
8. **Weekly/Monthly Reviews** - AI-generated summaries
9. **Collaborative Features** - Share entries with mentors (maybe)

---

## Useful Resources

- **Convex Docs**: https://docs.convex.dev
- **TanStack Start**: https://tanstack.com/start
- **TipTap Docs**: https://tiptap.dev
- **Better Auth**: https://better-auth.com
- **shadcn/ui**: https://ui.shadcn.com

---

## Notes for AI Assistants

When working on this codebase:

1. **Always create a new branch** for features (per user's global CLAUDE.md)
2. **Use context7** to grab latest library docs when using external libraries
3. **Prefer ESM** over CommonJS for all imports
4. **Use Convex conventions**: queries for reads, mutations for writes
5. **Maintain type safety**: Never use `any` types
6. **Follow existing patterns**: Check similar files before creating new ones
7. **Test locally**: Run `npm run dev` and verify changes work
8. **Respect soft deletes**: Mark `isActive: false` instead of deleting records

### Common Tasks

**Adding a new Convex query:**
```typescript
// convex/yourDomain.ts
export const yourQuery = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error('Unauthorized');
    // Your logic here
  },
});
```

**Adding a new shadcn component:**
```bash
npx shadcn@latest add [component-name]
```

**Creating a new route:**
Create file in `src/routes/` following TanStack Router conventions.

---

*Last Updated: 2025-11-14*
*Version: 1.0.0*
*Current Branch: feature/search-command-menu*

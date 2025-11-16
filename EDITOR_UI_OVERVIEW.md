# June-Bug Editor UI Implementation Overview

## 1. Main Editor Component Architecture

### Core Stack
- **Editor Library**: TipTap (v3.10.5) - A headless, Vue/React-friendly Prosemirror editor
- **UI Framework**: React 19.1.6
- **Styling**: Tailwind CSS 4.1.8 + Custom CSS
- **State Management**: TanStack React Query + React Hook Form
- **Backend**: Convex (serverless backend)
- **Dialog/Modal**: Radix UI Dialog Component

### Component Hierarchy

```
entries.{-$entryId}.tsx (Main Route Component)
├── EntriesSidebar (Left sidebar with entries list)
├── EntryForm (Main editor wrapper)
│   └── TiptapEditor (Core editor component)
│       ├── EditorBubbleMenu (Inline formatting menu)
│       └── SlashCommandMenu (Command palette)
└── ThemeToggle & Layout Controls
```

### File Structure
- `/src/components/editor/` - Main editor components
  - `tiptap-editor.tsx` - Core TipTap editor wrapper
  - `entry-form.tsx` - Form container with auto-save
  - `editor-bubble-menu.tsx` - Floating toolbar
  - `slash-command.tsx` - Command extension
  - `slash-command-list.tsx` - Command UI

---

## 2. Editor Component Details

### TiptapEditor Component (`tiptap-editor.tsx`)

**Purpose**: Wraps TipTap editor with smart content synchronization

**Key Features**:
- **Extensions Enabled**:
  - StarterKit (headings, bold, italic, lists, etc.)
  - Underline, Links, Images
  - TaskList/TaskItem (checkbox items)
  - Placeholder ("Type "/" for commands...")
  - SlashCommand extension
  - Code highlighting

**Smart Content Sync**:
```typescript
// Prevents stale prop updates from overwriting user typing
- Tracks editor version vs prop version
- Only updates editor if:
  1. Content is actually different
  2. User is NOT actively focused/typing
  3. Prop version is newer than last user edit
- Uses focus state to detect active typing
```

**Editor Props**:
```typescript
interface TiptapEditorProps {
  initialContent: string     // JSON stringified
  onUpdate: (content: string) => void  // Called on every change
}
```

**Styling**:
- Prose styling with custom overrides via `/src/styles/tiptap.css`
- Min height: 500px
- Responsive padding
- Dark mode support

---

### EntryForm Component (`entry-form.tsx`)

**Purpose**: Manages entry data, auto-save, and metadata

**Key Features**:

1. **Auto-Save with Debouncing**:
   - Debounce: 1 second
   - Max wait: 2 seconds
   - Extracts plainText from JSON for search/AI processing
   - Only saves if content actually differs from initial

2. **Entry Metadata**:
   - Date formatting: "Day, Month DDth, YYYY" (e.g., "Fri, May 5th, 2023")
   - Save status indicator: "Saving..." or "Last saved 3:45 PM"
   - Dirty state tracking
   - Entry ID and date management

3. **Data Flow**:
```typescript
TiptapEditor.onUpdate()
  ↓
EntryForm.handleContentUpdate()
  ↓
Validate content changed
  ↓
Extract plainText
  ↓
Debounced save via useEntries hook
  ↓
Convex mutation: updateEntry()
```

**Plain Text Extraction**:
Recursively walks TipTap JSON to extract readable text:
```typescript
// From: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}
// To: "Hello"
```

---

### EditorBubbleMenu Component (`editor-bubble-menu.tsx`)

**Purpose**: Floating toolbar for text formatting

**UI Pattern**:
- Appears when text is selected
- Fixed positioning near cursor
- Uses Radix UI design tokens

**Available Formatting Options**:
- Bold (⌘+B)
- Italic (⌘+I)
- Underline (⌘+U)
- Strikethrough
- Code

**Styling**:
- `flex items-center gap-1 rounded-lg border bg-background p-1 shadow-md`
- Buttons: `rounded p-2 hover:bg-muted transition-colors`
- Active state: `bg-muted text-primary`

---

### SlashCommand System

#### Extension (`slash-command.tsx`)
TipTap extension that triggers on "/" character. Provides:
- Command filtering by title
- Suggestion rendering with Tippy.js
- Arrow key navigation
- Enter to execute

#### SlashCommandList (`slash-command-list.tsx`)
React component for the command menu UI:
- Max height: 80vh or 24rem
- Width: 18rem (288px)
- Keyboard navigation (Up/Down/Enter)
- Click or keyboard selection

#### Available Commands (11 total)
1. **Text** - Plain paragraph
2. **Heading 1** - Large heading
3. **Heading 2** - Medium heading
4. **Heading 3** - Small heading
5. **Bullet List** - Unordered list
6. **Numbered List** - Ordered list
7. **Task List** - Checklist with checkboxes
8. **Code Block** - Multi-line code
9. **Inline Code** - Code span
10. **Quote** - Blockquote
11. **Divider** - Horizontal rule

**UI Presentation**:
- Icon (8x8 grid with icon)
- Title (sm font-medium)
- Description (xs muted-foreground)
- Highlight on hover/selection

---

## 3. Current AI Integration

### AI Title Generation System

**Trigger**: Automatic, NOT user-initiated

**Conditions for Generation**:
1. Entry has plainText content
2. Word count >= 100 words
3. Entry doesn't already have aiTitle

**Process**:
```
User saves entry with 100+ words
  ↓
EntryForm extracts plainText
  ↓
updateEntry mutation called
  ↓
Backend checks wordCount
  ↓
If >= 100 words: Schedule generateEntryTitle action
  ↓
OpenAI GPT-3.5-turbo generates title (max 8 words)
  ↓
Title stored in entry.aiTitle
  ↓
Sidebar displays: aiTitle || formatEntryDate(entryDate)
```

### AI Implementation Details (`/convex/ai.ts`)

```typescript
// Uses @ai-sdk/openai with Vercel AI SDK
const { text } = await generateText({
  model: openai('gpt-3.5-turbo'),
  prompt: `Generate a concise, descriptive title (maximum 8 words) 
           for this journal entry...`,
  // Limited to first 1000 chars to save tokens
})
```

**Key Characteristics**:
- Silent failure (doesn't block user if generation fails)
- Only first 1000 chars used (token optimization)
- Runs asynchronously (non-blocking)
- Idempotent (won't regenerate if title exists)
- Backend-only (no frontend AI calls)

### How Prompts Are Currently Used

1. **Entry List Display** (`EntriesSidebar.tsx`):
   ```typescript
   const displayText = entry.aiTitle || formatEntryDate(entry.entryDate)
   ```
   - Shows AI-generated title if available
   - Falls back to date formatting

2. **Data Storage** (Schema):
   ```typescript
   aiTitle: v.optional(v.string())  // In entry table
   ```

3. **No Explicit Prompt Modal**: 
   - AI titles are auto-generated, not user-requested
   - No "generate title" button or modal dialog
   - No prompt customization UI

---

## 4. UI/UX Patterns & Styling

### Design System

**Color Scheme** (OKLch color space):
- **Light Mode**:
  - Background: oklch(0.91 0.05 82.78) - Light gray
  - Foreground: oklch(0.41 0.08 78.86) - Dark gray
  - Primary: oklch(0.71 0.1 111.96) - Green
  - Muted: oklch(0.86 0.06 82.94) - Light gray
  - Accent: oklch(0.86 0.05 85.12) - Very light gray

- **Dark Mode**:
  - Background: oklch(0.2 0.01 52.89) - Very dark
  - Primary: oklch(0.64 0.05 114.58) - Light green

**Typography**:
- Sans-serif: Nunito
- Serif: PT Serif
- Monospace: JetBrains Mono

### Component Styling Patterns

**Buttons** (`class-variance-authority` CVA):
```typescript
Variants: default | destructive | outline | secondary | ghost | link
Sizes: default | sm | lg | icon
// Includes shadow, transitions, focus states
```

**Input Fields**:
- Border: var(--border)
- Focus: var(--ring) with 3px ring
- Hover: accent color

**Layout**:
- Sidebar width: Resizable (default ~250px)
- Collapsible sidebar with smooth transitions
- Responsive grid layout

### Radix UI Components Used
- `@radix-ui/react-dialog` - Modals/dialogs
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-dropdown-menu` - Menus
- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-avatar` - User avatars
- `@radix-ui/react-toggle` - Toggle buttons
- `@radix-ui/react-slot` - Polymorphic components

---

## 5. Dialog/Modal Component

### Dialog Component (`/src/components/ui/dialog.tsx`)

Built on **Radix UI Dialog Primitive**

**Available Exports**:
```typescript
Dialog                 // Root container
DialogTrigger         // Trigger button
DialogPortal          // Portal for modal
DialogClose           // Close button
DialogOverlay         // Backdrop (semi-transparent black)
DialogContent         // Main modal box
DialogHeader          // Header section
DialogTitle           // Title text
DialogDescription     // Description text
DialogFooter          // Footer section
```

**Default Styling**:
```typescript
DialogOverlay: {
  position: fixed inset-0
  background: rgba(0,0,0,0.5)
  animation: fade in/out
  z-index: 50
}

DialogContent: {
  position: fixed centered (top-50% left-50%)
  max-width: calc(100% - 2rem)
  background: var(--background)
  border: 1px solid var(--border)
  border-radius: 0.625rem
  padding: 1.5rem
  box-shadow: lg
  animation: zoom in/out
  z-index: 50
}

DialogClose button:
  position: absolute top-4 right-4
  appearance: icon
  opacity-70 on hover
```

### Usage Pattern (Standard Dialog)
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 6. Data Flow & State Management

### Entry State Management (`use-entries.ts`)

**Hook Pattern**: Unified interface for both authenticated (Convex) and local storage

```typescript
// useEntries - Get all entries
const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useEntries(isAuthenticated)

// useEntry - Get single entry
const { entry, isLoading } = useEntry(entryId, isAuthenticated)
```

**Dual Mode**:
- **Authenticated**: Uses Convex queries/mutations + React Query
- **Guest**: Uses localStorage with JSONContent

**Optimistic Updates**:
```typescript
// onMutate: Update UI before server responds
// onError: Rollback if mutation fails
// onSettled: Refetch to ensure sync
```

### Entry Data Structure

**In Database** (Convex):
```typescript
{
  _id: Id<'entries'>
  userId: Id<'users'>
  entryDate: number              // Midnight timestamp
  content: string                // TipTap JSON stringified
  plainText?: string             // Extracted for search
  aiTitle?: string               // Auto-generated title
  isActive: boolean              // Soft delete flag
  createdAt: number
  updatedAt: number
}
```

**In Memory** (UnifiedEntry):
```typescript
{
  _id: string
  entryDate: number
  content: JSONContent           // Parsed JSON
  plainText: string
  _creationTime: number
  aiTitle?: string
}
```

---

## 7. Key Integration Points

### For Adding Prompt Modal

**Best Location**: As a new slash command or button in bubble menu

**Dialog Options**:
1. **Slash Command Modal**:
   - Add "Ask AI" command to slash-command list
   - Opens Dialog with prompt input
   - Sends to backend for processing

2. **Bubble Menu Button**:
   - Add button to EditorBubbleMenu when text selected
   - Shows Dialog with customizable prompt
   - Uses selected text as context

3. **Entry Metadata Section**:
   - Add button in entry header (above editor)
   - Generate prompts for entire entry
   - Display results in modal

### Backend Ready
- AI infrastructure: `/convex/ai.ts`
- OpenAI integration: `@ai-sdk/openai`
- Scheduler support: `ctx.scheduler` in mutations
- Already handling: Text extraction, word counting

---

## 8. Styling & CSS Patterns

### Custom CSS Files
- `/src/styles/app.css` - Global styles, color variables, animations
- `/src/styles/tiptap.css` - Editor-specific styles

### CSS Variables (OKLch)
```css
--background, --foreground, --card, --primary, --secondary, --muted
--accent, --destructive, --border, --input, --ring
--chart-1 through --chart-5
--shadow-2xs through --shadow-2xl
```

### Key Animations
- Blob animation: 7s infinite for background orbs
- Tailwind utilities: fade-in/out, zoom-in/out on dialogs
- Transitions: 200-300ms for smooth effects

### Responsive Design
- Sidebar collapse/expand
- Mobile-friendly button grouping
- Notch design between sidebar and content
- Resizable divider between panels

---

## Summary

The June-Bug editor is built as a **clean, modular React component system** with:

1. **TipTap** as the core editor (rich-text, extensible)
2. **Slash commands** for content insertion (open/discoverable)
3. **Floating bubble menu** for text formatting (contextual)
4. **Auto-save** with debouncing (frictionless)
5. **AI titles** (automatic, non-intrusive)
6. **Radix UI dialogs** (accessible, themeable)
7. **Tailwind + custom CSS** (consistent styling)
8. **Dual-mode storage** (online/offline-first)

**Architecture is ready for prompt modal UI** - just needs new component in dialog + optional slash command.

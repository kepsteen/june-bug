# June-Bug Editor UI - Quick Reference Guide

## Key File Paths

### Editor Components
- `/home/user/june-bug/src/components/editor/tiptap-editor.tsx` - Core editor wrapper
- `/home/user/june-bug/src/components/editor/entry-form.tsx` - Form container & auto-save
- `/home/user/june-bug/src/components/editor/editor-bubble-menu.tsx` - Floating toolbar
- `/home/user/june-bug/src/components/editor/slash-command.tsx` - TipTap command extension
- `/home/user/june-bug/src/components/editor/slash-command-list.tsx` - Command menu UI

### UI Components
- `/home/user/june-bug/src/components/ui/dialog.tsx` - Radix Dialog (ready to use!)
- `/home/user/june-bug/src/components/ui/button.tsx` - Button with CVA variants
- `/home/user/june-bug/src/components/ui/input.tsx` - Text input
- `/home/user/june-bug/src/components/sidebar/EntriesSidebar.tsx` - Sidebar with entry list

### Styling
- `/home/user/june-bug/src/styles/app.css` - Global styles & theme
- `/home/user/june-bug/src/styles/tiptap.css` - Editor-specific styles

### Hooks & Utils
- `/home/user/june-bug/src/hooks/use-entries.ts` - Entry CRUD hook
- `/home/user/june-bug/src/lib/entry-utils.ts` - Date formatting, grouping, search
- `/home/user/june-bug/src/lib/local-storage-entries.ts` - LocalStorage API

### Backend (Convex)
- `/home/user/june-bug/convex/entries.ts` - Entry mutations & queries
- `/home/user/june-bug/convex/ai.ts` - AI title generation
- `/home/user/june-bug/convex/schema.ts` - Database schema

### Routes
- `/home/user/june-bug/src/routes/entries.{-$entryId}.tsx` - Main editor route

---

## Essential Imports for New Prompt Modal

```typescript
// Dialog components (ready to use)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Form handling
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea' // If needed

// Icons
import { Sparkles, Send, X } from 'lucide-react'

// State
import { useState } from 'react'

// Utils
import { cn } from '@/lib/utils'
```

---

## Key Component Props

### TiptapEditor
```typescript
interface TiptapEditorProps {
  initialContent: string        // JSON stringified
  onUpdate: (content: string) => void
}
```

### EntryForm
```typescript
interface EntryFormProps {
  entryId: string
  initialTitle?: string
  initialContent: JSONContent | string
  entryDate: number             // Timestamp
  onDirtyChange?: (isDirty: boolean) => void
  isAuthenticated: boolean
}
```

### Button Variants
```typescript
// All available variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// All available sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

---

## Slash Commands - How to Add New Command

### Step 1: Add to slashCommands array
File: `/home/user/june-bug/src/components/editor/slash-command.tsx`

```typescript
{
  title: 'Ask AI',
  description: 'Get AI assistance with your writing',
  icon: Sparkles,  // Add import: import { Sparkles } from 'lucide-react'
  command: ({ editor, range }) => {
    // Open dialog or trigger action
    editor.chain().focus().deleteRange(range).run()
    // Dispatch event or use context to open modal
  },
}
```

### Step 2: Handle Command Execution
Use Context or callback to open dialog from within slash-command-list

---

## Dialog Component Usage Example

```typescript
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PromptModal() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Call backend AI function
      // Display results
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sparkles className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ask Claude</DialogTitle>
          <DialogDescription>
            Enter your prompt to enhance your journal entry
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="What would you like help with?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !prompt}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Common Styling Patterns

### Using CSS Variables
```typescript
// Colors
--background, --foreground, --card, --primary
--secondary, --muted, --accent, --destructive

// Example in JSX
className="bg-background text-foreground border border-border"

// In CSS
.my-element {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

### Button with Icon
```typescript
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

<Button size="icon" variant="ghost">
  <Sparkles className="h-4 w-4" />
</Button>
```

### Responsive Classes
```typescript
// Tailwind responsive
className="md:flex hidden lg:gap-4"

// Flex centering
className="flex items-center justify-center gap-2"

// Text truncation
className="text-sm font-medium truncate"
```

---

## Common Error Messages & Solutions

### "Cannot update deleted entry"
- Entry has `isActive: false`
- Solution: Check isActive flag before updating

### "Entry not found or unauthorized"
- User doesn't own the entry
- Entry ID doesn't exist
- Solution: Verify entry ID and user ownership

### Editor content not updating
- Smart sync prevented update (user was typing)
- Focus state blocking update
- Solution: Wait for blur or let auto-sync finish

### AI title not generating
- Word count < 100
- Entry already has aiTitle
- OpenAI API error (silent)
- Solution: Add 100+ words, check console for errors

---

## Database Schema Quick Reference

### Entries Table
```typescript
{
  _id: Id<'entries'>              // Primary key
  userId: Id<'users'>             // Foreign key
  entryDate: number               // Midnight timestamp
  content: string                 // TipTap JSON
  plainText?: string              // Extracted text
  aiTitle?: string                // Auto-generated title
  isActive: boolean               // Soft delete
  createdAt: number               // Created timestamp
  updatedAt: number               // Updated timestamp
}

// Indexes
userId                            // Find by user
userId_entryDate                  // User's entries
userId_isActive_entryDate         // Active entries only
```

---

## AI Integration Points

### Current AI Implementation
- **Model**: OpenAI GPT-3.5-turbo
- **Trigger**: Auto on plainText save (100+ words)
- **Output**: aiTitle field (8 word max)
- **Process**: Non-blocking scheduler

### For New Prompt Feature
- Use existing `/convex/ai.ts` structure
- Add new action function for prompt processing
- Use `@ai-sdk/openai` and `generateText()`
- Store results in new field or display in modal

### Example Backend Action
```typescript
export const processPrompt = internalAction({
  args: {
    entryId: v.id('entries'),
    prompt: v.string(),
    selectedText: v.string(),
  },
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `User prompt: ${args.prompt}\n\nContent: ${args.selectedText}`,
    })
    return { result: text }
  },
})
```

---

## Testing the Editor Locally

### Start dev server
```bash
npm run dev
```

### Test auto-save
- Type in editor, wait 1s for save
- Check "Last saved X:XX PM" appears

### Test slash commands
- Type "/" in editor
- Arrow keys to navigate
- Enter to execute

### Test AI title generation
- Write 100+ words
- Save/blur editor
- Wait 2-3 seconds
- Check sidebar - title should appear

### Test dialogs
- Create new Dialog component
- DialogTrigger opens, DialogContent shows
- Click close button or press Escape

---

## Performance Considerations

1. **Debounced Save**: 1s delay prevents too frequent saves
2. **Smart Sync**: Prevents editor conflicts with prop updates
3. **Optimistic Updates**: UI updates before server response
4. **Query Caching**: React Query keeps recent entries in memory
5. **Lazy Loading**: Prefetch on hover for instant switching

---

## Next Steps for Prompt Modal

1. Create new component: `PromptModal.tsx` in `/src/components/editor/`
2. Add state management (dialog open, prompt input, results)
3. Integrate with Dialog component
4. Add button to bubble menu or as slash command
5. Create backend action for AI processing
6. Display results in modal or inline

Would you like me to create the initial PromptModal component?

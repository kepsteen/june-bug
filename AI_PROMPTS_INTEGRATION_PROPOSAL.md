# AI Prompts Editor UI Integration Proposal

## Current State Analysis

### Existing Infrastructure
- **Editor**: TipTap v3.10.5 with rich text capabilities
- **Slash Commands**: 11 built-in commands (`/` trigger system)
- **Bubble Menu**: Floating formatting toolbar
- **Dialog System**: Radix UI Dialog ready to use
- **AI Integration**: OpenAI GPT-3.5-turbo already configured
- **Auto-save**: 1s debounce with intelligent sync

### Current AI Features
- Automatic title generation (triggered at 100+ words)
- Backend processing via Convex actions
- Silent failure (non-blocking)

---

## Proposed Integration Options

### **Option 1: AI Prompt Slash Command** ⭐ RECOMMENDED
**Trigger**: Type `/ai` or `/ask` in the editor

#### Visual Flow
```
User types: /ai
           ↓
[Slash Menu Appears]
┌─────────────────────────────────────┐
│ 🤖 Ask AI                          │
│    Generate prompts and suggestions │
└─────────────────────────────────────┘
           ↓
[AI Prompt Dialog Opens]
┌──────────────────────────────────────────────────┐
│ ✨ AI Writing Prompts                      [X]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Choose a prompt to continue your entry:        │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 📝 "Reflect on what made today special" │   │
│  │    Click to insert                       │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 💭 "What challenges did you face?"      │   │
│  │    Click to insert                       │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎯 "What are your goals for tomorrow?"  │   │
│  │    Click to insert                       │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [🔄 Generate More]  [Custom Prompt...]        │
└──────────────────────────────────────────────────┘
```

#### Advantages
- ✅ Consistent with existing UX (slash commands)
- ✅ Non-intrusive (user-initiated)
- ✅ Easy keyboard navigation
- ✅ Quick to implement (reuse slash command infrastructure)
- ✅ Natural workflow interruption point

#### Implementation Details
**File**: `src/components/editor/slash-command.tsx`

Add new command to `slashCommands` array:
```typescript
{
  title: 'Ask AI',
  description: 'Get AI-generated writing prompts',
  icon: Sparkles, // from lucide-react
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run()
    // Open AI prompt dialog
    openAiPromptDialog(editor)
  },
}
```

**New Component**: `src/components/editor/ai-prompt-dialog.tsx`
- Use existing Dialog component from `@/components/ui/dialog`
- Generate 3-5 prompt options based on entry context
- Allow custom prompt input
- Insert selected prompt at cursor position

---

### **Option 2: Bubble Menu AI Button**
**Trigger**: Select text → AI button appears in bubble menu

#### Visual Flow
```
User selects text: "I went to the park today"
                    ↓
[Bubble Menu with AI option]
┌──────────────────────────────────────┐
│ [B] [I] [U] [S] [</>] | [✨ AI]     │
└──────────────────────────────────────┘
                    ↓
[AI Action Menu]
┌──────────────────────────────────────┐
│ ✨ Expand on this                    │
│ 💡 Ask me about this                 │
│ 📝 Create a prompt from this         │
│ 🔄 Rephrase                          │
└──────────────────────────────────────┘
```

#### Advantages
- ✅ Contextual to selected text
- ✅ Familiar location (existing bubble menu)
- ✅ Great for text enhancement
- ✅ Discoverability

#### Disadvantages
- ❌ Only works with text selection
- ❌ Limited space in bubble menu
- ❌ Less suitable for generating new prompts

---

### **Option 3: Persistent AI Sidebar Button**
**Trigger**: Always visible button in editor header

#### Visual Flow
```
┌────────────────────────────────────────────────────┐
│  Friday, January 12th, 2024        [✨ AI Prompts] │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Editor content here...]                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Advantages
- ✅ Always discoverable
- ✅ Clear call-to-action
- ✅ Doesn't interrupt writing flow

#### Disadvantages
- ❌ Takes up permanent space
- ❌ May feel pushy
- ❌ Less contextual

---

### **Option 4: Smart Prompt Suggestions** 🎯 ADVANCED
**Trigger**: Automatic suggestions when user pauses

#### Visual Flow
```
User types for 30 seconds, then pauses...
                    ↓
[Subtle inline suggestion appears]

I went to the park today and saw some birds.█

┌─────────────────────────────────────────────┐
│ 💡 Keep going?                              │
│ • What kind of birds did you see?          │
│ • How did that make you feel?              │
│                          [Dismiss]          │
└─────────────────────────────────────────────┘
```

#### Advantages
- ✅ Proactive writing assistance
- ✅ Contextually aware
- ✅ Helps overcome writer's block
- ✅ Feels magical

#### Disadvantages
- ❌ Complex to implement
- ❌ Risk of being annoying
- ❌ Requires sophisticated pause detection
- ❌ Higher AI API costs

---

## Detailed Design Specification

### Recommended: Option 1 (Slash Command) + Option 2 (Bubble Menu)

Combine both approaches for maximum flexibility:
- **Slash Command** (`/ai`): Generate new prompts from scratch
- **Bubble Menu**: Context-aware AI actions on selected text

---

## UI Component Design

### AI Prompt Dialog Component

**File**: `src/components/editor/ai-prompt-dialog.tsx`

```typescript
interface AiPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editor: Editor
  contextText?: string // Optional selected text for context
}

export function AiPromptDialog({
  open,
  onOpenChange,
  editor,
  contextText
}: AiPromptDialogProps) {
  const [prompts, setPrompts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  // Generate prompts on open
  useEffect(() => {
    if (open) {
      generatePrompts()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Writing Prompts
          </DialogTitle>
          <DialogDescription>
            {contextText
              ? "Based on your selected text, here are some prompts to continue:"
              : "Choose a prompt to spark your writing:"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Prompt Options */}
        <div className="space-y-2 py-4">
          {isGenerating ? (
            <LoadingState />
          ) : (
            prompts.map((prompt, idx) => (
              <PromptCard
                key={idx}
                prompt={prompt}
                onClick={() => insertPrompt(prompt)}
              />
            ))
          )}
        </div>

        {/* Custom Prompt Input */}
        <div className="space-y-2">
          <Input
            placeholder="Or write your own prompt..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={generatePrompts}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate More
          </Button>
          <Button
            onClick={() => insertPrompt(customPrompt)}
            disabled={!customPrompt.trim()}
          >
            Insert Custom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Prompt Card Component

```typescript
interface PromptCardProps {
  prompt: string
  onClick: () => void
}

function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border border-border",
        "hover:border-primary hover:bg-accent/50",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {prompt}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to insert
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}
```

---

## Backend Implementation

### New AI Action: Generate Writing Prompts

**File**: `convex/ai.ts`

```typescript
export const generateWritingPrompts = internalAction({
  args: {
    entryId: v.id('entries'),
    contextText: v.optional(v.string()),
    count: v.optional(v.number()), // Default: 3
  },
  handler: async (ctx, args) => {
    const entry = await ctx.runQuery(internal.entries.getEntryInternal, {
      entryId: args.entryId,
    })

    if (!entry) return []

    const plainText = entry.plainText || ''
    const contextText = args.contextText || plainText.slice(-500) // Last 500 chars

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Based on this journal entry excerpt, generate ${args.count || 3} engaging writing prompts that would help the user continue their reflection. Each prompt should be a thoughtful question or statement.

Entry context:
${contextText}

Format your response as a JSON array of strings, each being a single prompt. Example:
["What emotions did that experience bring up for you?", "How might you approach this differently next time?", "What did you learn about yourself?"]

Return ONLY the JSON array, nothing else.`,
    })

    try {
      return JSON.parse(text) as string[]
    } catch {
      // Fallback to splitting by newlines if JSON parsing fails
      return text.split('\n').filter(line => line.trim().length > 0)
    }
  },
})
```

---

## Visual Design System Integration

### Color Scheme
Use existing OKLch color variables:
- **Primary**: Cyan accent (`oklch(0.7 0.2 200)`)
- **AI Indicator**: Sparkles icon with gradient
- **Hover States**: Accent background (`bg-accent/50`)
- **Borders**: Subtle primary on hover

### Typography
- **Dialog Title**: `text-lg font-semibold`
- **Prompts**: `text-sm font-medium`
- **Descriptions**: `text-xs text-muted-foreground`

### Animations
```css
/* Prompt card entrance animation */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.prompt-card {
  animation: slideInUp 0.2s ease-out;
  animation-fill-mode: both;
}

.prompt-card:nth-child(1) { animation-delay: 0ms; }
.prompt-card:nth-child(2) { animation-delay: 50ms; }
.prompt-card:nth-child(3) { animation-delay: 100ms; }
```

---

## User Flow Examples

### Scenario 1: Writer's Block
```
1. User types "/ai"
2. Slash menu shows "Ask AI" option
3. User presses Enter
4. Dialog opens with 3 context-aware prompts
5. User clicks a prompt
6. Prompt inserted at cursor as styled blockquote
7. User continues writing naturally
```

### Scenario 2: Expand on Selected Text
```
1. User selects: "I felt anxious today"
2. Bubble menu appears with AI button (✨)
3. User clicks AI button
4. Sub-menu shows:
   - "Explore this feeling deeper"
   - "What triggered this?"
   - "How did you cope?"
5. User selects "What triggered this?"
6. Text inserted inline as blockquote
```

---

## Implementation Phases

### Phase 1: Basic Slash Command (2-3 days)
- [ ] Add `/ai` slash command
- [ ] Create AI prompt dialog component
- [ ] Implement static prompt options (no AI yet)
- [ ] Test insertion mechanics

### Phase 2: AI Integration (2-3 days)
- [ ] Create `generateWritingPrompts` action
- [ ] Integrate OpenAI API
- [ ] Add loading states
- [ ] Handle errors gracefully

### Phase 3: Bubble Menu Integration (1-2 days)
- [ ] Add AI button to bubble menu
- [ ] Create context-aware prompt generation
- [ ] Polish animations and transitions

### Phase 4: Polish & UX (1-2 days)
- [ ] Add keyboard shortcuts (e.g., Cmd+Shift+A)
- [ ] Implement prompt history
- [ ] Add analytics tracking
- [ ] User testing and refinement

---

## Design Mockups

### Desktop View - Slash Command
```
┌────────────────────────────────────────────────────────────────┐
│  Friday, January 12th, 2024              Last saved 2:34 PM   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Today I went to the park and saw some interesting birds.     │
│  I felt really calm and peaceful. /█                          │
│                                                                │
│  ┌──────────────────────────────────┐                        │
│  │ 🤖 Ask AI                        │                        │
│  │    Get writing prompts           │                        │
│  ├──────────────────────────────────┤                        │
│  │   Text                           │                        │
│  │   Heading 1                      │                        │
│  └──────────────────────────────────┘                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Desktop View - Dialog Open
```
┌────────────────────────────────────────────────────────────────┐
│  Friday, January 12th, 2024              Last saved 2:34 PM   │
├────────────────────────────────────────────────────────────────┤
│  ╔══════════════════════════════════════════════════════╗     │
│  ║ ✨ AI Writing Prompts                          [X]  ║     │
│  ╠══════════════════════════════════════════════════════╣     │
│  ║                                                      ║     │
│  ║  Choose a prompt to continue your entry:            ║     │
│  ║                                                      ║     │
│  ║  ┌────────────────────────────────────────────────┐ ║     │
│  ║  │ 💭 What specific types of birds did you see?  │ ║     │
│  ║  │    Click to insert                             │ ║     │
│  ║  └────────────────────────────────────────────────┘ ║     │
│  ║                                                      ║     │
│  ║  ┌────────────────────────────────────────────────┐ ║     │
│  ║  │ 🌿 Describe the atmosphere of the park        │ ║     │
│  ║  │    Click to insert                             │ ║     │
│  ║  └────────────────────────────────────────────────┘ ║     │
│  ║                                                      ║     │
│  ║  ┌────────────────────────────────────────────────┐ ║     │
│  ║  │ ✨ What made you feel calm and peaceful?      │ ║     │
│  ║  │    Click to insert                             │ ║     │
│  ║  └────────────────────────────────────────────────┘ ║     │
│  ║                                                      ║     │
│  ║  [Or write your own prompt...                    ] ║     │
│  ║                                                      ║     │
│  ║  [🔄 Generate More]            [Insert Custom]     ║     │
│  ╚══════════════════════════════════════════════════════╝     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────┐
│  Fri, Jan 12th, 2024    │
├──────────────────────────┤
│                          │
│  Today I went to the     │
│  park and saw some       │
│  interesting birds. /█   │
│                          │
│  ┌────────────────────┐  │
│  │ 🤖 Ask AI          │  │
│  │    Writing prompts │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘

[Dialog opens full-screen on mobile]

┌──────────────────────────┐
│ ✨ AI Prompts       [X] │
├──────────────────────────┤
│                          │
│ Choose a prompt:         │
│                          │
│ ┌──────────────────────┐ │
│ │ 💭 What types of    │ │
│ │    birds did you    │ │
│ │    see?             │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 🌿 Describe the     │ │
│ │    park atmosphere  │ │
│ └──────────────────────┘ │
│                          │
│ [Write your own...]      │
│                          │
│ [🔄 More] [Insert]      │
└──────────────────────────┘
```

---

## Alternative Ideas

### 1. **Prompt Templates Library**
Pre-defined prompt categories:
- **Reflection**: "How did that make you feel?"
- **Gratitude**: "What are you grateful for today?"
- **Goals**: "What do you want to achieve?"
- **Challenges**: "What obstacles did you face?"

### 2. **AI Writing Styles**
Let users choose AI personality:
- **Thoughtful Friend**: Warm, empathetic prompts
- **Coach**: Motivational, action-oriented
- **Therapist**: Deep, reflective questions
- **Creative**: Imaginative, artistic prompts

### 3. **Prompt Chains**
AI generates follow-up prompts based on answers:
```
Prompt 1: "What made today special?"
User answers...
↓
Prompt 2: "How can you create more moments like this?"
```

### 4. **Voice-Activated Prompts**
Integration with speech-to-text:
- Say "Hey June, give me a prompt"
- AI responds with audio + text prompt

---

## Technical Considerations

### Performance
- **Cache prompts**: Store recent prompts in local storage
- **Debounce API calls**: Prevent excessive AI requests
- **Optimistic UI**: Show skeleton while loading

### Accessibility
- **Keyboard navigation**: Tab through prompt options
- **Screen reader support**: Proper ARIA labels
- **Focus management**: Auto-focus first prompt

### Error Handling
```typescript
try {
  const prompts = await generatePrompts()
  setPrompts(prompts)
} catch (error) {
  // Fallback to static prompts
  setPrompts([
    "What's on your mind right now?",
    "Describe your day in three words.",
    "What would you like to remember about today?"
  ])
  toast.error("Couldn't generate AI prompts. Here are some defaults.")
}
```

### Privacy & Ethics
- **User consent**: Make AI features opt-in
- **Data handling**: Never store prompts on external servers
- **Transparency**: Label AI-generated content clearly
- **User control**: Easy way to disable AI features

---

## Success Metrics

Track these metrics to evaluate success:
1. **Adoption Rate**: % of users who use AI prompts
2. **Engagement**: Average prompts inserted per session
3. **Retention**: Do users who use prompts write longer entries?
4. **User Satisfaction**: Survey feedback on prompt quality
5. **Performance**: AI response time (target: <2s)

---

## Next Steps

### Immediate Actions
1. ✅ Review this proposal with team
2. ⏭️ Choose primary integration option (recommend Option 1)
3. ⏭️ Create design mockups in Figma
4. ⏭️ Implement Phase 1 (basic dialog)
5. ⏭️ User testing with 5-10 beta users

### Future Enhancements
- Multi-language support
- Prompt personalization based on user history
- Export favorite prompts
- Share prompts with community
- AI-powered entry insights dashboard

---

## Questions for Consideration

1. **Prompt Positioning**: Should prompts be inserted as:
   - Blockquotes (styled differently)
   - Regular text with prefix (e.g., "→ ")
   - Headings
   - Special "prompt" nodes

2. **Frequency**: How often should AI suggest prompts?
   - On demand only
   - After X minutes of inactivity
   - At end of each paragraph

3. **Cost Management**: OpenAI API costs add up
   - Set daily/monthly usage limits?
   - Only for premium users?
   - Cache and reuse prompts?

4. **Customization**: Should users be able to:
   - Save favorite prompts
   - Create prompt templates
   - Train AI on their writing style

---

## Conclusion

**Recommended Approach**: Start with **Option 1 (Slash Command)** for MVP, then add **Option 2 (Bubble Menu)** for text-based AI actions.

This approach:
- ✅ Leverages existing slash command UX
- ✅ Quick to implement (reuse existing components)
- ✅ Non-intrusive but discoverable
- ✅ Scalable to add more AI features later
- ✅ Maintains clean, focused editor experience

The AI prompt feature can become a signature differentiator for June Bug, helping users overcome writer's block and develop deeper self-reflection habits.

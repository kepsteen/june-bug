import { X, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PromptCategory = 'working-on' | 'win' | 'bug' | 'lesson' | null

interface PromptsSidebarProps {
  isCollapsed: boolean
  selectedCategory: PromptCategory
  onCategorySelect: (category: PromptCategory) => void
  onBack: () => void
  onClose: () => void
}

const categories = [
  {
    id: 'working-on' as const,
    icon: '💼',
    title: 'What are you working on?',
    description: 'Document the features, tasks, or projects you\'re tackling today',
    color: 'from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10',
  },
  {
    id: 'win' as const,
    icon: '🏆',
    title: 'Celebrate a win',
    description: 'Big or small - shipped code, solved a bug, or learned something new',
    color: 'from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10',
  },
  {
    id: 'bug' as const,
    icon: '🐛',
    title: 'Track a bug',
    description: 'Note the bugs you encountered and how you debugged them',
    color: 'from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10',
  },
  {
    id: 'lesson' as const,
    icon: '💡',
    title: 'Capture a lesson',
    description: 'Document insights, patterns, or gotchas you discovered',
    color: 'from-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/20 hover:to-yellow-500/10',
  },
]

const categoryConfig = {
  'working-on': {
    icon: '💼',
    title: 'What are you working on?',
    prompts: [
      'What feature or task are you implementing today?',
      'What\'s the most challenging part of what you\'re building?',
      'What libraries or technologies are you exploring?',
      'What\'s your current progress on this project?',
    ],
  },
  'win': {
    icon: '🏆',
    title: 'Celebrate a win',
    prompts: [
      'What bug did you finally solve today?',
      'What new skill or concept did you master?',
      'What code are you proud of shipping?',
      'What milestone did you hit in your project?',
    ],
  },
  'bug': {
    icon: '🐛',
    title: 'Track a bug',
    prompts: [
      'What bug are you currently debugging?',
      'What error message are you trying to understand?',
      'What unexpected behavior did you encounter?',
      'What\'s breaking in production or testing?',
    ],
  },
  'lesson': {
    icon: '💡',
    title: 'Capture a lesson',
    prompts: [
      'What pattern or anti-pattern did you discover?',
      'What gotcha or edge case did you learn about?',
      'What would you do differently next time?',
      'What insight will help future you or your team?',
    ],
  },
}

export function PromptsSidebar({
  isCollapsed,
  selectedCategory,
  onCategorySelect,
  onBack,
  onClose,
}: PromptsSidebarProps) {
  const sidebarWidth = isCollapsed ? 0 : 320

  const category = selectedCategory ? categoryConfig[selectedCategory] : null

  return (
    <aside
      className="h-full bg-background border-l transition-[width] duration-300 ease-in-out overflow-hidden flex flex-col"
      style={{ width: `${sidebarWidth}px` }}
    >
      {!isCollapsed && (
        <>
          {!selectedCategory ? (
            // Category Selection View
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">What's on your mind?</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Choose a category to see helpful writing prompts
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onCategorySelect(cat.id)}
                      className={`
                        group relative p-3 rounded-lg border border-border
                        bg-gradient-to-br ${cat.color}
                        transition-all duration-200
                        hover:scale-[1.02] hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        text-left
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                            {cat.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Prompts View
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-7 w-7 -ml-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl">{category?.icon}</span>
                  <h3 className="font-semibold text-sm">{category?.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Prompts List */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                  Writing Prompts
                </p>
                <div className="space-y-3">
                  {category?.prompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md bg-muted/50 border border-border/50 hover:bg-muted hover:border-border transition-colors"
                    >
                      <p className="text-sm text-foreground leading-relaxed">
                        {prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type PromptCategory = 'working-on' | 'win' | 'bug' | 'lesson'

interface OnboardingPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategorySelect: (category: PromptCategory) => void
}

const categories = [
  {
    id: 'working-on' as PromptCategory,
    icon: '💼',
    title: 'What are you working on?',
    description: 'Document the features, tasks, or projects you\'re tackling today',
    color: 'from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10',
  },
  {
    id: 'win' as PromptCategory,
    icon: '🏆',
    title: 'Celebrate a win',
    description: 'Big or small - shipped code, solved a bug, or learned something new',
    color: 'from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10',
  },
  {
    id: 'bug' as PromptCategory,
    icon: '🐛',
    title: 'Track a bug',
    description: 'Note the bugs you encountered and how you debugged them',
    color: 'from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10',
  },
  {
    id: 'lesson' as PromptCategory,
    icon: '💡',
    title: 'Capture a lesson',
    description: 'Document insights, patterns, or gotchas you discovered',
    color: 'from-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/20 hover:to-yellow-500/10',
  },
]

export function OnboardingPromptModal({
  open,
  onOpenChange,
  onCategorySelect,
}: OnboardingPromptModalProps) {
  const handleCategoryClick = (categoryId: PromptCategory) => {
    onCategorySelect(categoryId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">What's on your mind?</DialogTitle>
          <DialogDescription className="text-base">
            Choose a category to see helpful writing prompts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`
                group relative p-4 rounded-lg border border-border
                bg-gradient-to-br ${category.color}
                transition-all duration-200
                hover:scale-[1.02] hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                text-left h-32
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {category.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

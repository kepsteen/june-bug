import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface OnboardingPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PromptCategory = 'working-on' | 'win' | 'bug' | 'lesson' | null

const mainPrompts = [
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

const detailedPrompts: Record<string, string[]> = {
  'working-on': [
    'What feature or task are you implementing today?',
    'What\'s the most challenging part of what you\'re building?',
    'What libraries or technologies are you exploring?',
    'What\'s your current progress on this project?',
  ],
  'win': [
    'What bug did you finally solve today?',
    'What new skill or concept did you master?',
    'What code are you proud of shipping?',
    'What milestone did you hit in your project?',
  ],
  'bug': [
    'What bug are you currently debugging?',
    'What error message are you trying to understand?',
    'What unexpected behavior did you encounter?',
    'What\'s breaking in production or testing?',
  ],
  'lesson': [
    'What pattern or anti-pattern did you discover?',
    'What gotcha or edge case did you learn about?',
    'What would you do differently next time?',
    'What insight will help future you or your team?',
  ],
}

export function OnboardingPromptModal({
  open,
  onOpenChange,
}: OnboardingPromptModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>(null)

  const handleCategoryClick = (categoryId: PromptCategory) => {
    setSelectedCategory(categoryId)
  }

  const handleDetailedPromptClick = () => {
    onOpenChange(false)
    setSelectedCategory(null)
  }

  const handleBack = () => {
    setSelectedCategory(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedCategory(null)
    }
    onOpenChange(open)
  }

  const selectedPrompt = mainPrompts.find((p) => p.id === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {selectedCategory
              ? `${selectedPrompt?.icon} ${selectedPrompt?.title}`
              : "What's on your mind?"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {selectedCategory
              ? 'Choose a reflection prompt to guide your thoughts'
              : 'Choose a prompt to help guide your entry, or just start writing!'}
          </DialogDescription>
        </DialogHeader>

        {selectedCategory && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="mt-4 w-fit gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to categories
          </Button>
        )}

        {!selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {mainPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleCategoryClick(prompt.id)}
                className={`
                  group relative p-4 rounded-lg border border-border
                  bg-gradient-to-br ${prompt.color}
                  transition-all duration-200
                  hover:scale-[1.02] hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  text-left h-32
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {prompt.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {prompt.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {detailedPrompts[selectedCategory]?.map((prompt, index) => (
              <button
                key={index}
                onClick={handleDetailedPromptClick}
                className={`
                  group relative p-4 rounded-lg border border-border
                  bg-gradient-to-br ${selectedPrompt?.color}
                  transition-all duration-200
                  hover:scale-[1.01] hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  text-left
                `}
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {prompt}
                </p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

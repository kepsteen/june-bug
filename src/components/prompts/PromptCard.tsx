/**
 * PromptCard Component
 *
 * Displays a single AI-generated prompt with:
 * - Category badge (Static, Personalized, Context)
 * - Prompt text
 * - "Use" button to insert into editor
 * - "Regenerate" button (for history prompts only)
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface PromptCardProps {
  prompt: {
    _id: Id<'prompts'>;
    promptText: string;
    promptCategory: 'static' | 'history-based' | 'context-aware';
    promptType: string;
    timesUsed: number;
  };
  onUse: (promptText: string, promptId: Id<'prompts'>) => void;
  category: string; // Display name: "Static", "Personalized", "Context"
  canRegenerate?: boolean;
}

export function PromptCard({
  prompt,
  onUse,
  category,
  canRegenerate = false,
}: PromptCardProps) {
  const regenerate = useConvexMutation(api.prompts.regeneratePrompt);

  const handleRegenerate = () => {
    regenerate.mutate({
      promptType: prompt.promptType,
      category: prompt.promptCategory,
    });
  };

  const handleUse = () => {
    onUse(prompt.promptText, prompt._id);
  };

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </span>
            {prompt.timesUsed > 0 && (
              <span className="text-xs text-muted-foreground">
                Used {prompt.timesUsed}×
              </span>
            )}
          </div>

          {/* Prompt Text */}
          <p className="text-sm leading-relaxed">{prompt.promptText}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {canRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
              title="Generate a new prompt"
            >
              <RefreshCw
                className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
          <Button size="sm" onClick={handleUse} title="Use this prompt">
            <Sparkles className="h-4 w-4 mr-1" />
            Use
          </Button>
        </div>
      </div>
    </Card>
  );
}

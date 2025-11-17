/**
 * PromptsSection Component
 *
 * Main container for AI writing prompts
 * - 4 tabs for different prompt types
 * - Displays static, history-based, and context-aware prompts
 * - Handles prompt selection and usage tracking
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptCard } from './PromptCard';
import { convexQuery } from '@convex-dev/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';
import type { Id } from '../../../convex/_generated/dataModel';
import { Loader2, Lightbulb } from 'lucide-react';

interface PromptsSectionProps {
  userId: Id<'users'>;
  onPromptSelect: (promptText: string) => void;
  activePromptType?: string;
  onActivePromptTypeChange?: (type: string) => void;
}

export function PromptsSection({
  userId,
  onPromptSelect,
  activePromptType: externalActiveType,
  onActivePromptTypeChange,
}: PromptsSectionProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('reflection');

  // Use external state if provided, otherwise use internal state
  const activeTab = externalActiveType || internalActiveTab;
  const setActiveTab = onActivePromptTypeChange || setInternalActiveTab;

  const { data: prompts, isLoading } = convexQuery(api.prompts.getActivePrompts, {
    userId,
  });

  const markPromptUsed = useConvexMutation(api.prompts.markPromptUsed);

  const handlePromptUse = (promptText: string, promptId: Id<'prompts'>) => {
    // Track usage
    markPromptUsed.mutate({ promptId });

    // Insert into editor
    onPromptSelect(promptText);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const promptTypes = [
    { value: 'reflection', label: 'Reflect' },
    { value: 'skill-development', label: 'Skills' },
    { value: 'career-growth', label: 'Career' },
    { value: 'daily-checkin', label: 'Daily' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Writing Prompts</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI-powered prompts to guide your reflection
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          {promptTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {promptTypes.map((type) => {
          const typePrompts = prompts?.[type.value];
          const staticPrompts = typePrompts?.static || [];
          const historyPrompts = typePrompts?.['history-based'] || [];
          const contextPrompts = typePrompts?.['context-aware'] || [];
          const hasPrompts =
            staticPrompts.length > 0 ||
            historyPrompts.length > 0 ||
            contextPrompts.length > 0;

          return (
            <TabsContent
              key={type.value}
              value={type.value}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {!hasPrompts ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <p>No prompts available yet.</p>
                  <p className="text-xs mt-2">
                    Complete onboarding to get started!
                  </p>
                </div>
              ) : (
                <>
                  {/* Static Prompts */}
                  {staticPrompts.map((prompt: any) => (
                    <PromptCard
                      key={prompt._id}
                      prompt={prompt}
                      onUse={handlePromptUse}
                      category="Static"
                    />
                  ))}

                  {/* History-Based Prompt */}
                  {historyPrompts.map((prompt: any) => (
                    <PromptCard
                      key={prompt._id}
                      prompt={prompt}
                      onUse={handlePromptUse}
                      category="Personalized"
                      canRegenerate
                    />
                  ))}

                  {/* Context-Aware Prompt */}
                  {contextPrompts.map((prompt: any) => (
                    <PromptCard
                      key={prompt._id}
                      prompt={prompt}
                      onUse={handlePromptUse}
                      category="Context"
                    />
                  ))}
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

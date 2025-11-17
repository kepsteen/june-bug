/**
 * useContextPrompts Hook
 *
 * Generates context-aware AI prompts based on the user's current entry content
 * Uses debouncing to avoid excessive API calls while typing
 */

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import { useDebounce } from './use-debounce';
import type { Id } from '../../convex/_generated/dataModel';

interface UseContextPromptsOptions {
  userId: Id<'users'>;
  currentContent: string;
  activePromptType: string;
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
}

export function useContextPrompts({
  userId,
  currentContent,
  activePromptType,
  enabled = true,
  debounceMs = 2000, // 2 second debounce
  minLength = 150, // Minimum content length to trigger
}: UseContextPromptsOptions) {
  const debouncedContent = useDebounce(currentContent, debounceMs);
  const lastGeneratedRef = useRef<string>('');

  const { mutate: generateContextPrompt, isPending } = useMutation({
    mutationFn: useConvexMutation(api.ai.prompts.generateContextPrompt),
  });

  useEffect(() => {
    // Only generate if:
    // 1. Feature is enabled
    // 2. Content is substantial enough
    // 3. Content has changed significantly from last generation
    // 4. Not currently generating
    if (
      !enabled ||
      !debouncedContent ||
      debouncedContent.length < minLength ||
      debouncedContent === lastGeneratedRef.current ||
      isPending
    ) {
      return;
    }

    // Update reference and trigger generation
    lastGeneratedRef.current = debouncedContent;

    generateContextPrompt({
      userId,
      promptType: activePromptType,
      currentContent: debouncedContent,
    });
  }, [
    enabled,
    debouncedContent,
    activePromptType,
    userId,
    generateContextPrompt,
    isPending,
    minLength,
  ]);

  return {
    isGenerating: isPending,
  };
}

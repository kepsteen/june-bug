/**
 * AI Actions for generating writing prompts using Mastra
 *
 * Three workflows:
 * 1. Static prompts - Generated at account creation (2 per type = 8 total)
 * 2. History-based prompts - Generated after 5 entries (1 per type = 4 total)
 * 3. Context-aware prompts - Generated in real-time based on current entry
 */

import { action, internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { getTemplatePrompts } from './promptTemplates';

// Import Mastra agent
// Note: This import works in Node.js environment (Convex actions)
import { promptAgent } from '../../src/mastra/agents/promptAgent';

const PROMPT_TYPES = ['reflection', 'skill-development', 'career-growth', 'daily-checkin'] as const;

/**
 * Generate 8 static prompts (2 per type) at account creation
 */
export const generateStaticPrompts = internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    console.log(`[AI] Generating static prompts for user ${userId}`);

    // Fetch user profile
    const user = await ctx.runQuery(internal.users.getUserInternal, { userId });

    if (!user) {
      console.error(`[AI] User ${userId} not found`);
      return;
    }

    for (const promptType of PROMPT_TYPES) {
      try {
        const systemPrompt = buildSystemPromptForStatic(user, promptType);

        console.log(`[AI] Generating ${promptType} static prompts...`);

        // Call Mastra agent
        const result = await promptAgent.generate({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Generate 2 ${promptType} prompts. Return ONLY a JSON array in this exact format:
[{"prompt": "First prompt text here"}, {"prompt": "Second prompt text here"}]

Do not include any other text, explanations, or markdown formatting.`,
            },
          ],
        });

        // Parse prompts from response
        const prompts = parsePromptsFromResponse(result.text);

        if (prompts.length === 0) {
          throw new Error('No prompts parsed from AI response');
        }

        // Save each prompt
        for (const promptText of prompts) {
          await ctx.runMutation(internal.prompts.createPrompt, {
            userId,
            promptType,
            promptCategory: 'static',
            promptText,
            metadata: {
              model: 'gpt-4o',
              tokensUsed: result.usage?.totalTokens || 0,
              generatedAt: Date.now(),
              version: 1,
            },
          });
        }

        console.log(`[AI] Created ${prompts.length} ${promptType} static prompts`);
      } catch (error) {
        console.error(`[AI] Failed to generate ${promptType} static prompts:`, error);

        // Fallback: use template prompts
        const fallbackPrompts = getTemplatePrompts(
          promptType,
          user.mentorshipStyle || 'Reflective'
        );

        for (const promptText of fallbackPrompts) {
          await ctx.runMutation(internal.prompts.createPrompt, {
            userId,
            promptType,
            promptCategory: 'static',
            promptText,
            metadata: {
              model: 'template',
              tokensUsed: 0,
              generatedAt: Date.now(),
              version: 1,
            },
          });
        }

        console.log(`[AI] Used template fallback for ${promptType}`);
      }
    }

    console.log(`[AI] Completed static prompt generation for user ${userId}`);
  },
});

/**
 * Regenerate static prompts for a specific type
 */
export const regenerateStaticPrompts = internalAction({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
  },
  handler: async (ctx, { userId, promptType }) => {
    console.log(`[AI] Regenerating ${promptType} static prompts for user ${userId}`);

    const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
    if (!user) return;

    // Deactivate existing static prompts of this type
    await ctx.runMutation(internal.prompts.deactivatePrompts, {
      userId,
      promptType,
      category: 'static',
    });

    // Generate new ones
    try {
      const systemPrompt = buildSystemPromptForStatic(user, promptType);

      const result = await promptAgent.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate 2 fresh ${promptType} prompts. Return ONLY a JSON array:
[{"prompt": "First prompt"}, {"prompt": "Second prompt"}]`,
          },
        ],
      });

      const prompts = parsePromptsFromResponse(result.text);

      for (const promptText of prompts) {
        await ctx.runMutation(internal.prompts.createPrompt, {
          userId,
          promptType,
          promptCategory: 'static',
          promptText,
          metadata: {
            model: 'gpt-4o',
            tokensUsed: result.usage?.totalTokens || 0,
            generatedAt: Date.now(),
            version: 2, // Incremented version
          },
        });
      }
    } catch (error) {
      console.error(`[AI] Failed to regenerate ${promptType} static prompts:`, error);
    }
  },
});

/**
 * Generate history-based prompt after analyzing user's entries
 */
export const generateHistoryPrompt = internalAction({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
  },
  handler: async (ctx, { userId, promptType }) => {
    console.log(`[AI] Generating ${promptType} history prompt for user ${userId}`);

    const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
    if (!user) return;

    const entries = await ctx.runQuery(internal.entries.getRecentEntriesInternal, {
      userId,
      limit: 10,
    });

    if (entries.length < 5) {
      console.log(`[AI] Not enough entries (${entries.length}) for history prompt`);
      return;
    }

    try {
      const systemPrompt = buildSystemPromptForHistory(user, promptType);
      const userPrompt = buildHistoryPromptRequest(entries, promptType);

      console.log(`[AI] Analyzing ${entries.length} entries...`);

      // Call Mastra agent with tools enabled
      const result = await promptAgent.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        toolChoice: 'auto', // Let agent decide when to use analyzeEntries tool
      });

      const promptText = extractPromptFromResponse(result.text);

      if (!promptText) {
        throw new Error('Failed to extract prompt from AI response');
      }

      // Deactivate old history prompt of this type
      await ctx.runMutation(internal.prompts.deactivatePrompts, {
        userId,
        promptType,
        category: 'history-based',
      });

      // Save new history prompt
      await ctx.runMutation(internal.prompts.createPrompt, {
        userId,
        promptType,
        promptCategory: 'history-based',
        promptText,
        metadata: {
          model: 'gpt-4o',
          tokensUsed: result.usage?.totalTokens || 0,
          generatedAt: Date.now(),
          version: 1,
        },
      });

      console.log(`[AI] Created ${promptType} history prompt`);
    } catch (error) {
      console.error(`[AI] Failed to generate ${promptType} history prompt:`, error);
      // Don't create fallback for history prompts - they require actual analysis
    }
  },
});

/**
 * Generate context-aware prompt based on current entry content
 * Regular action (not internal) so it can be called from the frontend
 */
export const generateContextPrompt = action({
  args: {
    userId: v.id('users'),
    promptType: v.string(),
    currentContent: v.string(),
  },
  handler: async (ctx, { userId, promptType, currentContent }) => {
    // Only generate if content is substantial
    if (currentContent.length < 100) {
      console.log(`[AI] Content too short (${currentContent.length} chars) for context prompt`);
      return;
    }

    console.log(`[AI] Generating ${promptType} context prompt for user ${userId}`);

    const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
    if (!user) return;

    try {
      const systemPrompt = buildSystemPromptForContext(user, promptType);

      const result = await promptAgent.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `The user is currently writing about: "${currentContent.slice(0, 500)}"

Generate a ${promptType} prompt that deepens their reflection on this specific topic. The prompt should:
- Be directly related to what they're writing about
- Encourage them to explore the topic further
- Match their ${user.mentorshipStyle || 'Reflective'} mentorship style

Return ONLY the prompt text, nothing else.`,
          },
        ],
      });

      const promptText = extractPromptFromResponse(result.text);

      if (!promptText) {
        throw new Error('Failed to extract prompt from AI response');
      }

      // Deactivate old context prompt
      await ctx.runMutation(internal.prompts.deactivatePrompts, {
        userId,
        promptType,
        category: 'context-aware',
      });

      // Save new context prompt
      await ctx.runMutation(internal.prompts.createPrompt, {
        userId,
        promptType,
        promptCategory: 'context-aware',
        promptText,
        metadata: {
          model: 'gpt-4o',
          tokensUsed: result.usage?.totalTokens || 0,
          generatedAt: Date.now(),
          version: 1,
        },
      });

      console.log(`[AI] Created ${promptType} context prompt`);
    } catch (error) {
      console.error(`[AI] Failed to generate ${promptType} context prompt:`, error);
    }
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build system prompt for static prompt generation
 */
function buildSystemPromptForStatic(user: any, promptType: string): string {
  const styleGuide: Record<string, string> = {
    Structured: 'Create clear, step-by-step prompts with specific objectives.',
    Exploratory: 'Create open-ended questions that encourage discovery.',
    'Challenge-driven': 'Create prompts that push boundaries and problem-solving.',
    Reflective: 'Create deep, introspective questions about experiences.',
  };

  const style = user.mentorshipStyle || 'Reflective';

  return `Generate ${promptType} prompts for a ${user.experienceLevel || 'software engineer'} working in ${user.currentRole || 'development'}.

Mentorship style: ${style}
${styleGuide[style] || styleGuide.Reflective}

Tech stack: ${user.techStack?.join(', ') || 'general software development'}
Goals: ${user.developmentGoals?.join(', ') || 'professional growth'}

These are STATIC prompts (not personalized to recent entries).
Make them:
- Relevant to their role and experience level
- Aligned with their mentorship style
- Focused on ${promptType}
- Concise (1-2 sentences max)`;
}

/**
 * Build system prompt for history-based generation
 */
function buildSystemPromptForHistory(user: any, promptType: string): string {
  return `Analyze the user's recent journal entries and generate a personalized ${promptType} prompt that:

1. Addresses patterns or gaps in their reflection
2. Builds on themes they've been exploring
3. Encourages growth in areas they haven't covered
4. Aligns with their ${user.mentorshipStyle || 'Reflective'} style

User context:
- Role: ${user.currentRole || 'Software engineer'}
- Level: ${user.experienceLevel || 'Mid-level'}
- Goals: ${user.developmentGoals?.join(', ') || 'Professional growth'}

Use the analyzeEntries tool if needed to identify themes and gaps.

Return ONLY the prompt text (1-2 sentences), nothing else.`;
}

/**
 * Build system prompt for context-aware generation
 */
function buildSystemPromptForContext(user: any, promptType: string): string {
  return `Generate a ${promptType} prompt based on what the user is currently writing.

The prompt should:
- Deepen their reflection on the current topic
- Match their ${user.mentorshipStyle || 'Reflective'} mentorship style
- Be specific to their current context
- Encourage further exploration

Return ONLY the prompt text (1-2 sentences), nothing else.`;
}

/**
 * Build history prompt request
 */
function buildHistoryPromptRequest(entries: any[], promptType: string): string {
  const entrySummaries = entries
    .slice(0, 5)
    .map((e, i) => {
      const date = new Date(e.entryDate).toLocaleDateString();
      const preview = e.plainText?.slice(0, 200) || 'No content';
      return `Entry ${i + 1} (${date}): ${preview}...`;
    })
    .join('\n\n');

  return `Here are the user's recent journal entries:

${entrySummaries}

Based on these entries, generate a personalized ${promptType} prompt that addresses gaps, patterns, or opportunities for growth.`;
}

/**
 * Parse prompts from JSON array response
 */
function parsePromptsFromResponse(text: string): string[] {
  try {
    // Try to extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[AI] No JSON array found in response:', text);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => item.prompt || item.text || item)
        .filter((p: string) => typeof p === 'string' && p.length > 0);
    }

    return [];
  } catch (error) {
    console.error('[AI] Failed to parse prompts:', error);
    return [];
  }
}

/**
 * Extract single prompt from response
 */
function extractPromptFromResponse(text: string): string {
  // Remove common formatting
  let cleaned = text
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
    .replace(/^Prompt:\s*/i, '') // Remove "Prompt:" prefix
    .trim();

  return cleaned;
}

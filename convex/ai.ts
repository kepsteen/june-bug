'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

/**
 * Generate an AI title for a journal entry based on its content
 * Uses OpenAI GPT-3.5-turbo for fast title generation (max 8 words)
 * This is an internal action only callable by other Convex functions
 */
export const generateEntryTitle = internalAction({
  args: {
    entryId: v.id('entries'),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch the entry directly from the database
      // (actions don't have user auth context, so we can't use the query)
      const entry = await ctx.runQuery(internal.entries.getEntryInternal, {
        entryId: args.entryId,
      })

      if (!entry) {
        console.error('Entry not found:', args.entryId)
        return
      }

      // Don't regenerate if title already exists
      if (entry.aiTitle) {
        console.log('Entry already has AI title, skipping generation')
        return
      }

      // Need at least some content to generate a title
      const plainText = entry.plainText || ''
      if (plainText.trim().length < 30) {
        console.log('Entry too short for title generation')
        return
      }

      // Generate title using OpenAI GPT-3.5-turbo (faster and cheaper)
      const { text } = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: `Generate a concise, descriptive title (maximum 8 words) for this journal entry. The title should capture the main theme or topic. Only return the title text, nothing else.

Journal entry:
${plainText.slice(0, 1000)}`, // Limit to first 1000 chars to save tokens
      })

      const generatedTitle = text.trim()

      // Update the entry with the generated title
      await ctx.runMutation(internal.entries.updateEntryInternal, {
        entryId: args.entryId,
        aiTitle: generatedTitle,
      })

      console.log('Generated title:', generatedTitle)
    } catch (error) {
      // Silent failure - don't block the user if AI generation fails
      console.error('Failed to generate entry title:', error)
    }
  },
})

/**
 * Mastra Tool: analyzeEntries
 *
 * Analyzes user's journal entries to identify patterns, themes, and reflection gaps
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { EntryData, EntryAnalysis } from '../agents/types';

export const analyzeEntriesToolDefinition = createTool({
  id: 'analyzeEntries',
  description: 'Analyze user journal entries to identify patterns, themes, and gaps in their reflections',

  inputSchema: z.object({
    entries: z.array(
      z.object({
        date: z.string(),
        content: z.string(),
        plainText: z.string(),
      })
    ),
    lookback: z
      .number()
      .optional()
      .describe('Number of recent entries to analyze (default: 5)'),
  }),

  outputSchema: z.object({
    themes: z.array(z.string()).describe('Main topics and themes discussed'),
    gaps: z
      .array(z.string())
      .describe('Unexplored areas or topics missing from reflections'),
    patterns: z
      .array(z.string())
      .describe('Behavioral patterns observed in entries'),
    recentTopics: z.array(z.string()).describe('Topics from most recent entries'),
  }),

  execute: async ({ inputData }) => {
    const { entries, lookback = 5 } = inputData;
    const recentEntries = entries.slice(0, lookback);

    // Extract themes using keyword frequency analysis
    const themes = extractThemes(recentEntries);

    // Identify gaps by comparing content against common engineering reflection areas
    const gaps = identifyGaps(recentEntries);

    // Find patterns in writing habits and focus areas
    const patterns = findPatterns(recentEntries);

    // Extract topics from the most recent entries
    const recentTopics = extractRecentTopics(recentEntries.slice(0, 3));

    return {
      themes,
      gaps,
      patterns,
      recentTopics,
    };
  },
});

/**
 * Extract main themes from entries using keyword frequency
 */
function extractThemes(entries: EntryData[]): string[] {
  const themes: string[] = [];
  const allText = entries.map((e) => e.plainText.toLowerCase()).join(' ');

  // Common technical themes
  const technicalKeywords = [
    { keyword: 'debug', theme: 'Debugging and troubleshooting' },
    { keyword: 'refactor', theme: 'Code refactoring' },
    { keyword: 'test', theme: 'Testing and quality assurance' },
    { keyword: 'deploy', theme: 'Deployment and DevOps' },
    { keyword: 'review', theme: 'Code review' },
    { keyword: 'meeting', theme: 'Team collaboration' },
    { keyword: 'learn', theme: 'Learning and skill development' },
    { keyword: 'architect', theme: 'System architecture and design' },
    { keyword: 'performance', theme: 'Performance optimization' },
    { keyword: 'bug', theme: 'Bug fixing' },
  ];

  // Career/growth themes
  const careerKeywords = [
    { keyword: 'goal', theme: 'Goal setting and planning' },
    { keyword: 'mentor', theme: 'Mentorship and guidance' },
    { keyword: 'feedback', theme: 'Receiving and giving feedback' },
    { keyword: 'career', theme: 'Career progression' },
    { keyword: 'interview', theme: 'Interviewing and job search' },
    { keyword: 'promotion', theme: 'Career advancement' },
  ];

  const allKeywords = [...technicalKeywords, ...careerKeywords];

  for (const { keyword, theme } of allKeywords) {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches && matches.length >= 2) {
      // At least 2 mentions
      themes.push(theme);
    }
  }

  return themes.slice(0, 5); // Return top 5 themes
}

/**
 * Identify gaps in reflection areas
 */
function identifyGaps(entries: EntryData[]): string[] {
  const gaps: string[] = [];
  const allText = entries.map((e) => e.plainText.toLowerCase()).join(' ');

  // Key reflection areas that should be covered
  const reflectionAreas = [
    {
      area: 'Technical challenges',
      keywords: ['challenge', 'difficult', 'struggle', 'problem'],
    },
    {
      area: 'Wins and accomplishments',
      keywords: ['success', 'accomplish', 'completed', 'shipped', 'win'],
    },
    {
      area: 'Learning and growth',
      keywords: ['learn', 'understand', 'discover', 'realize'],
    },
    {
      area: 'Team collaboration',
      keywords: ['team', 'collaborate', 'pair', 'meeting', 'discuss'],
    },
    {
      area: 'Future planning',
      keywords: ['plan', 'goal', 'next', 'future', 'want to'],
    },
    {
      area: 'Code quality',
      keywords: ['refactor', 'clean', 'quality', 'test', 'review'],
    },
  ];

  for (const { area, keywords } of reflectionAreas) {
    const hasContent = keywords.some((kw) => allText.includes(kw));
    if (!hasContent) {
      gaps.push(area);
    }
  }

  return gaps.slice(0, 3); // Return top 3 gaps
}

/**
 * Find patterns in entries
 */
function findPatterns(entries: EntryData[]): string[] {
  const patterns: string[] = [];

  // Pattern 1: Entry length trends
  const avgLength = entries.reduce((sum, e) => sum + e.plainText.length, 0) / entries.length;
  if (avgLength < 200) {
    patterns.push('Entries tend to be brief - could benefit from deeper reflection');
  } else if (avgLength > 800) {
    patterns.push('Detailed, thorough entries - shows strong reflection habit');
  }

  // Pattern 2: Consistency in writing
  if (entries.length >= 5) {
    patterns.push('Consistent journaling habit - maintaining regular entries');
  } else if (entries.length < 3) {
    patterns.push('Building journaling habit - still getting started');
  }

  // Pattern 3: Focus on problems vs solutions
  const problemWords = entries
    .map((e) => e.plainText.toLowerCase())
    .join(' ')
    .match(/\b(problem|issue|bug|error|stuck|struggle)\w*\b/gi);
  const solutionWords = entries
    .map((e) => e.plainText.toLowerCase())
    .join(' ')
    .match(/\b(solution|solved|fixed|resolved|approach)\w*\b/gi);

  if (problemWords && solutionWords) {
    if (problemWords.length > solutionWords.length * 2) {
      patterns.push(
        'Focus tends toward identifying problems - could explore more solution-oriented thinking'
      );
    } else if (solutionWords.length > problemWords.length) {
      patterns.push('Solution-focused mindset - actively working through challenges');
    }
  }

  return patterns;
}

/**
 * Extract topics from most recent entries
 */
function extractRecentTopics(entries: EntryData[]): string[] {
  if (entries.length === 0) return [];

  const topics: string[] = [];

  // Simple topic extraction: look for repeated nouns/concepts
  for (const entry of entries) {
    const words = entry.plainText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4); // Filter short words

    // Get first few meaningful words as topics
    const uniqueWords = [...new Set(words)];
    topics.push(...uniqueWords.slice(0, 3));
  }

  // Return unique topics
  return [...new Set(topics)].slice(0, 5);
}

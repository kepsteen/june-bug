/**
 * Mastra Tool: getUserContext
 *
 * Fetches comprehensive user profile for prompt personalization
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { UserContext } from '../agents/types';

export const getUserContextToolDefinition = createTool({
  id: 'getUserContext',
  description: 'Fetch user profile including role, level, mentorship style, and goals',

  inputSchema: z.object({
    userId: z.string().describe('The ID of the user'),
  }),

  outputSchema: z.object({
    userId: z.string(),
    fullName: z.string().optional(),
    currentRole: z.string().optional(),
    experienceLevel: z
      .enum(['Junior', 'Mid-Level', 'Senior', 'Lead', 'Principal'])
      .optional(),
    mentorshipStyle: z
      .enum(['Structured', 'Exploratory', 'Challenge-driven', 'Reflective'])
      .optional(),
    developmentGoals: z.array(z.string()),
    techStack: z.array(z.string()),
    workEnvironment: z.string().optional(),
  }),

  execute: async ({ context }) => {
    // The user context is passed via the execution context from Convex action
    // This tool essentially formats and validates the user data
    const user = context.user as UserContext;

    return {
      userId: user.userId,
      fullName: user.fullName,
      currentRole: user.currentRole,
      experienceLevel: user.experienceLevel,
      mentorshipStyle: user.mentorshipStyle,
      developmentGoals: user.developmentGoals || [],
      techStack: user.techStack || [],
      workEnvironment: user.workEnvironment,
    };
  },
});

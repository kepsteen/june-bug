/**
 * TypeScript types for Mastra AI prompt agent
 */

export type PromptType = 'reflection' | 'skill-development' | 'career-growth' | 'daily-checkin';

export type PromptCategory = 'static' | 'history-based' | 'context-aware';

export type MentorshipStyle = 'Structured' | 'Exploratory' | 'Challenge-driven' | 'Reflective';

export type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Principal';

export interface UserContext {
  userId: string;
  fullName?: string;
  currentRole?: string;
  experienceLevel?: ExperienceLevel;
  mentorshipStyle?: MentorshipStyle;
  developmentGoals?: string[];
  techStack?: string[];
  workEnvironment?: string;
}

export interface EntryData {
  date: string;
  content: string;
  plainText: string;
}

export interface EntryAnalysis {
  themes: string[];
  gaps: string[];
  patterns: string[];
  recentTopics: string[];
}

export interface PromptMetadata {
  model: string;
  tokensUsed: number;
  generatedAt: number;
  version: number;
}

export interface GeneratedPrompt {
  promptText: string;
  metadata: PromptMetadata;
}

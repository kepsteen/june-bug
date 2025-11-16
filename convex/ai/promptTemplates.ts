/**
 * Template fallback prompts for when AI generation fails
 *
 * Organized by prompt type and mentorship style
 */

type MentorshipStyle = 'Structured' | 'Exploratory' | 'Challenge-driven' | 'Reflective';
type PromptType = 'reflection' | 'skill-development' | 'career-growth' | 'daily-checkin';

interface PromptTemplates {
  [key: string]: {
    [key: string]: string[];
  };
}

export const PROMPT_TEMPLATES: PromptTemplates = {
  reflection: {
    Structured: [
      'What specific challenge did you face today, and what steps did you take to address it?',
      'List three things you learned this week and how you plan to apply them.',
    ],
    Exploratory: [
      'What surprised you most about your work this week?',
      'If you could change one thing about how you approached a recent project, what would it be and why?',
    ],
    'Challenge-driven': [
      "What's the hardest technical problem you're currently working on? How are you pushing yourself to solve it?",
      'What assumption did you challenge in your work recently? What did you discover?',
    ],
    Reflective: [
      "How did today's work align with your long-term career goals?",
      'What emotions did you experience during your most challenging moment this week? What did they reveal?',
    ],
  },

  'skill-development': {
    Structured: [
      'Choose one technical skill from your stack. What concrete steps will you take this week to improve it?',
      'Review a piece of code you wrote recently. What patterns or practices could you improve?',
    ],
    Exploratory: [
      "What technology or concept have you been curious about? What's one thing you could explore today?",
      'How has your understanding of a particular technology evolved over the past month?',
    ],
    'Challenge-driven': [
      "What skill are you deliberately practicing outside your comfort zone? What's difficult about it?",
      'Set a technical challenge for yourself this week. What will success look like?',
    ],
    Reflective: [
      'What technical skill comes naturally to you? How can you leverage it to learn something new?',
      'Think about a recent bug or error. What deeper lesson about programming did it teach you?',
    ],
  },

  'career-growth': {
    Structured: [
      'Review one of your development goals. What progress have you made? What are your next steps?',
      'What specific action will you take this week to move closer to your career aspirations?',
    ],
    Exploratory: [
      'Where do you see yourself in your career a year from now? What possibilities excite you?',
      'What new opportunity or direction have you noticed recently? How might you explore it?',
    ],
    'Challenge-driven': [
      'What career risk are you considering? What would make it worth taking?',
      "What's one limiting belief about your career that you could challenge?",
    ],
    Reflective: [
      'What professional accomplishment are you most proud of? What does it reveal about your strengths?',
      'How has your definition of career success evolved? What matters most to you now?',
    ],
  },

  'daily-checkin': {
    Structured: [
      'What did you accomplish today? What tasks are you planning for tomorrow?',
      'Rate your day from 1-10 and explain why. What would make tomorrow better?',
    ],
    Exploratory: [
      'What was the most interesting thing that happened in your work today?',
      'If today was a chapter in a book about your career, what would it be titled?',
    ],
    'Challenge-driven': [
      'What did you do today that pushed you outside your comfort zone?',
      'What problem did you tackle today? What would you do differently if you faced it again?',
    ],
    Reflective: [
      'How did you show up for yourself and others today?',
      'What moment from today will you carry forward? Why does it matter?',
    ],
  },
};

/**
 * Get template prompts for a specific type and mentorship style
 */
export function getTemplatePrompts(
  promptType: PromptType,
  mentorshipStyle: MentorshipStyle = 'Reflective'
): string[] {
  const templates = PROMPT_TEMPLATES[promptType]?.[mentorshipStyle];

  if (!templates) {
    // Fallback to Reflective if style not found
    return PROMPT_TEMPLATES[promptType]?.Reflective || [
      'What did you learn today?',
      'What challenged you today?',
    ];
  }

  return templates;
}

/**
 * Get a single random template prompt
 */
export function getRandomTemplatePrompt(
  promptType: PromptType,
  mentorshipStyle: MentorshipStyle = 'Reflective'
): string {
  const prompts = getTemplatePrompts(promptType, mentorshipStyle);
  return prompts[Math.floor(Math.random() * prompts.length)];
}

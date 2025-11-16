/**
 * Mastra instance for AI prompt generation
 */

import { Mastra } from '@mastra/core';

export const mastra = new Mastra({
  // Core configuration
  // Add additional config as needed
});

// Export everything we need
export { promptAgent } from './agents/promptAgent';
export * from './agents/types';

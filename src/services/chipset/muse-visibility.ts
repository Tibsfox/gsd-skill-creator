/**
 * Visibility types for muse activation control.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { MuseActivation } from './muse-plane-types.js';

export type VisibilityLevel = 'invisible' | 'named' | 'direct-invocation';

export interface VisibilityRule {
  condition: (context: VisibilityContext) => boolean;
  level: VisibilityLevel;
  priority: number;
}

export interface VisibilityContext {
  userInput: string;
  taskDescription: string;
  activeMuses: MuseActivation[];
  conversationDepth: number;
}

export interface VisibilityDecision {
  museId: MuseId;
  level: VisibilityLevel;
  reason: string;
}

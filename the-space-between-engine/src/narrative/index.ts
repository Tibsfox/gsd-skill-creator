// Narrative Layer — Export contract consumed by Wings and Telescope.
// Provides wonder stories, Hundred Voices bridges, and reflection prompts.

import type { FoundationId, WonderStory, HundredVoicesBridge, ReflectionPrompt } from '../types/index';

import { wonderStories, getStoryByFoundation } from './stories';
import { hundredVoicesBridges, getBridgeByFoundation } from './bridges';
import { reflectionPrompts, getPromptsByFoundation, getAllPrompts } from './prompts';

// ─── Public API ──────────────────────────────────────────────────

export function getStory(id: FoundationId): WonderStory {
  return getStoryByFoundation(id);
}

export function getBridge(id: FoundationId): HundredVoicesBridge {
  return getBridgeByFoundation(id);
}

export function getPrompts(id?: FoundationId): ReflectionPrompt[] {
  return getPromptsByFoundation(id);
}

// ─── Re-exports for direct access ────────────────────────────────

export { wonderStories } from './stories';
export { hundredVoicesBridges } from './bridges';
export { reflectionPrompts, getAllPrompts } from './prompts';

/**
 * Willow interface types — progressive disclosure for muse output.
 *
 * Three reading speeds: glance (summary), scan (key points), read (full).
 * Humane greeting pattern: never guilt, always welcome.
 */

import type { MergedResult } from './muse-forking.js';

export type DisclosureLevel = 'glance' | 'scan' | 'read';

export interface WillowContext {
  userDepth: DisclosureLevel;
  sessionCount: number;
  lastSeen: string | null;
  preferredStyle: string | null;
}

export interface WillowRendering {
  level: DisclosureLevel;
  content: string;
  expandable: boolean;
  expandHint: string | null;
}

export interface WillowGreeting {
  message: string;
  contextHint: string;
}

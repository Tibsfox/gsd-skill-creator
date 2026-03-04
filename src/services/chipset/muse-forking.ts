/**
 * Ephemeral forking types for parallel muse consultation.
 */

import type { MuseId } from './muse-schema-validator.js';
import type { MusePlanePosition } from './muse-plane-types.js';

export type MergeStrategy = 'consensus' | 'synthesis' | 'comparison' | 'strongest';

export interface VoiceProfile {
  tone: string;
  style: string;
  signature?: string;
}

export interface ForkRequest {
  context: string;
  muses: MuseId[];
  question: string;
  mergeStrategy: MergeStrategy;
}

export interface AugmentedContext {
  baseContext: string;
  museVocabulary: string[];
  museVoice: VoiceProfile;
  museOrientation: MusePlanePosition;
  prompt: string;
}

export interface MusePerspective {
  museId: MuseId;
  content: string;
  activationScore: number;
  voice: VoiceProfile;
  keywords: string[];
}

export interface MergedResult {
  content: string;
  perspectives: MusePerspective[];
  strategy: MergeStrategy;
  contributingMuses: MuseId[];
}

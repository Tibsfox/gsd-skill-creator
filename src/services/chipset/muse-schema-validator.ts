/**
 * Muse chipset schema validator.
 *
 * Validates muse-specific fields (orientation, vocabulary, voice) and provides
 * type-safe discrimination between muse and standard chipsets.
 */

import { z } from 'zod';
import type { PlanePosition } from '../../core/types/mfe-types.js';

// === Type Definitions ===

export type MuseType = 'system' | 'user' | 'community';
export type VoiceStyle = 'narrative' | 'technical' | 'conversational' | 'observational' | 'welcoming';
export type MuseId = 'foxy' | 'lex' | 'hemlock' | 'sam' | 'cedar' | 'willow';

export interface MuseOrientation {
  angle: number;
  magnitude: number;
}

export interface MuseVoice {
  tone: string;
  style: VoiceStyle;
  signature?: string;
}

export interface MuseValidationResult {
  valid: boolean;
  errors: string[];
}

// === Zod Schemas ===

const MuseOrientationSchema = z.object({
  angle: z.number().min(0).max(2 * Math.PI),
  magnitude: z.number().min(0).max(1),
});

const MuseVoiceSchema = z.object({
  tone: z.string().min(1),
  style: z.enum(['narrative', 'technical', 'conversational', 'observational', 'welcoming']),
  signature: z.string().optional(),
});

const MuseChipsetSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  museType: z.enum(['system', 'user', 'community']),
  orientation: MuseOrientationSchema,
  vocabulary: z.array(z.string()).max(100).optional(),
  voice: MuseVoiceSchema,
  activationPatterns: z.array(z.string()).max(20).optional(),
  composableWith: z.array(z.string()).optional(),
}).passthrough();

// === Validation Functions ===

export function validateMuseChipset(config: unknown): MuseValidationResult {
  const result = MuseChipsetSchema.safeParse(config);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.issues.map(i => i.message),
  };
}

export function isMuseChipset(config: unknown): boolean {
  if (config === null || config === undefined || typeof config !== 'object') return false;
  return !!(config as Record<string, unknown>).museType;
}

export function getMuseOrientation(config: unknown): PlanePosition | null {
  if (!isMuseChipset(config)) return null;
  const obj = config as Record<string, unknown>;
  const orientation = obj.orientation as MuseOrientation | undefined;
  if (!orientation || typeof orientation.angle !== 'number' || typeof orientation.magnitude !== 'number') return null;
  return {
    real: orientation.magnitude * Math.cos(orientation.angle),
    imaginary: orientation.magnitude * Math.sin(orientation.angle),
  };
}

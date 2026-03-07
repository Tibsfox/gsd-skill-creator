/**
 * Pipeline Bridge — routes requests between direct build and mission pipeline.
 *
 * Scores request complexity (0-12) across four dimensions and routes to:
 * - Direct build (0-3): code/design + philosophy notes
 * - Build spec (4-6): step-by-step instructions
 * - Lightweight mission (7-9): simplified wave plan
 * - Full mission (10-12): routes to vision_to_mission pipeline
 *
 * Users can override with "just build it" or "make this a mission."
 */

import type {
  UnifiedUnderstanding,
  ExtractedParameters,
  ImageInput,
  TargetMedium,
} from './types.js';

/** Routing decision output. */
export type RouteDecision = 'direct-build' | 'build-spec' | 'lightweight-mission' | 'full-mission';

/** Override keywords that force a specific route. */
export type RouteOverride = 'direct' | 'mission' | 'build-spec' | null;

/** Complexity score breakdown. */
export interface ComplexityScore {
  imageCount: number;
  targetCount: number;
  componentCount: number;
  safetyConcerns: number;
  total: number;
}

/** Full bridge result. */
export interface BridgeResult {
  score: ComplexityScore;
  route: RouteDecision;
  override: RouteOverride;
  visionDraft?: string;
}

/** Override detection keywords. */
const DIRECT_OVERRIDES = ['just build it', 'just build', 'quick build', 'build it now'];
const MISSION_OVERRIDES = ['make this a mission', 'mission package', 'full mission', 'make a mission'];
const SPEC_OVERRIDES = ['give me a build spec', 'build spec', 'step by step'];

/**
 * Scores request complexity on four dimensions (0-3 each, max 12).
 */
export function scoreComplexity(
  imageCount: number,
  targetCount: number,
  componentCount: number,
  safetyConcerns: number,
): ComplexityScore {
  const clamp = (n: number) => Math.min(3, Math.max(0, n));
  const imgScore = clamp(imageCount <= 1 ? 0 : imageCount <= 3 ? 1 : imageCount <= 7 ? 2 : 3);
  const tgtScore = clamp(targetCount <= 1 ? 0 : targetCount <= 2 ? 1 : targetCount <= 3 ? 2 : 3);
  const cmpScore = clamp(componentCount <= 1 ? 0 : componentCount <= 3 ? 1 : componentCount <= 6 ? 2 : 3);
  const safeScore = clamp(safetyConcerns);

  return {
    imageCount: imgScore,
    targetCount: tgtScore,
    componentCount: cmpScore,
    safetyConcerns: safeScore,
    total: imgScore + tgtScore + cmpScore + safeScore,
  };
}

/**
 * Routes based on complexity score. Conservative — borderline scores
 * route to the MORE structured option.
 */
export function route(score: number, override?: RouteOverride): RouteDecision {
  if (override === 'direct') return 'direct-build';
  if (override === 'mission') return 'full-mission';
  if (override === 'build-spec') return 'build-spec';

  if (score <= 3) return 'direct-build';
  if (score <= 6) return 'build-spec';
  if (score <= 9) return 'lightweight-mission';
  return 'full-mission';
}

/**
 * Detects route override from user request text.
 */
export function detectOverride(requestText: string): RouteOverride {
  const lower = requestText.toLowerCase();
  if (DIRECT_OVERRIDES.some(k => lower.includes(k))) return 'direct';
  if (MISSION_OVERRIDES.some(k => lower.includes(k))) return 'mission';
  if (SPEC_OVERRIDES.some(k => lower.includes(k))) return 'build-spec';
  return null;
}

/**
 * Produces a vision document draft for handoff to vision_to_mission.
 */
export function handoffToVisionMission(
  understanding: UnifiedUnderstanding,
  params: ExtractedParameters,
): string {
  const sections: string[] = [];

  sections.push('# Vision — Image to Mission Handoff');
  sections.push('');
  sections.push('## Vision');
  sections.push(understanding.processInsight ?? 'No process insight captured.');
  sections.push('');

  sections.push('## Context');
  for (const obs of understanding.observations) {
    sections.push(`- **${obs.imageId}:** ${obs.rawDescription}`);
  }
  sections.push('');

  sections.push('## Architecture');
  sections.push(`- **Arrangement:** ${params.geometry.arrangement} ${params.geometry.primaryShape}`);
  sections.push(`- **Palette:** ${params.color.temperature} (${params.color.palette.length} colors)`);
  sections.push(`- **Material:** ${params.material.lightInteraction}`);
  sections.push(`- **Feel:** energy=${params.feel.energy.toFixed(1)} handmade=${params.feel.handmade.toFixed(1)} ceremony=${params.feel.ceremony.toFixed(1)}`);
  sections.push('');

  sections.push('## Through-Line');
  sections.push(understanding.processInsight ?? 'Creative translation from visual reference to executable specification.');
  sections.push('');

  sections.push('## Connections');
  for (const conn of understanding.connections) {
    sections.push(`- [${conn.type}] ${conn.description}`);
  }

  return sections.join('\n');
}

/**
 * Full bridge pipeline: score, detect override, route, produce output.
 */
export function bridge(
  imageCount: number,
  targetCount: number,
  componentCount: number,
  safetyConcerns: number,
  requestText: string,
  understanding?: UnifiedUnderstanding,
  params?: ExtractedParameters,
): BridgeResult {
  const score = scoreComplexity(imageCount, targetCount, componentCount, safetyConcerns);
  const override = detectOverride(requestText);
  const decision = route(score.total, override);

  const result: BridgeResult = { score, route: decision, override };

  if ((decision === 'full-mission' || decision === 'lightweight-mission') && understanding && params) {
    result.visionDraft = handoffToVisionMission(understanding, params);
  }

  return result;
}

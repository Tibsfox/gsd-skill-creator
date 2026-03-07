/**
 * Parameter Extractor — converts UnifiedUnderstanding into numbers.
 *
 * Takes the synthesized understanding from the connection engine and
 * produces concrete numerical ExtractedParameters — colors, geometry,
 * materials, and feel — that any translation engine can consume.
 *
 * Parameters are medium-independent: they describe WHAT, not HOW.
 * "Golden angle spiral" not "ctx.rotate(2.399963)."
 */

import type {
  UnifiedUnderstanding,
  ExtractedParameters,
  ColorParameter,
  GeometryParameter,
  MaterialParameter,
  FeelParameter,
} from './types.js';

// ============================================================================
// Reference Tables
// ============================================================================

/** Color keywords to hex/temperature lookup. */
export const COLOR_KEYWORDS: Record<string, { hex: string; temperature: 'warm' | 'cool' }> = {
  stone: { hex: '#C4A882', temperature: 'warm' },
  gray: { hex: '#808080', temperature: 'cool' },
  ochre: { hex: '#CC7722', temperature: 'warm' },
  tan: { hex: '#D2B48C', temperature: 'warm' },
  white: { hex: '#F2EDE4', temperature: 'cool' },
  brown: { hex: '#8B6914', temperature: 'warm' },
  green: { hex: '#4F7942', temperature: 'cool' },
  blue: { hex: '#4682B4', temperature: 'cool' },
  pink: { hex: '#FF69B4', temperature: 'warm' },
  magenta: { hex: '#FF1493', temperature: 'warm' },
  cyan: { hex: '#00CED1', temperature: 'cool' },
  gold: { hex: '#FFD700', temperature: 'warm' },
  amber: { hex: '#FFBF00', temperature: 'warm' },
  coral: { hex: '#FF7F50', temperature: 'warm' },
  violet: { hex: '#8A2BE2', temperature: 'cool' },
  red: { hex: '#CD5C5C', temperature: 'warm' },
  black: { hex: '#2C2C2C', temperature: 'cool' },
};

/** Material property lookup for common surfaces. */
export const MATERIAL_PROPERTIES: Record<string, {
  reflectivity: number;
  roughness: number;
  lightInteraction: 'absorb' | 'reflect' | 'transmit' | 'scatter';
}> = {
  stone: { reflectivity: 0.15, roughness: 0.85, lightInteraction: 'absorb' },
  tarp: { reflectivity: 0.6, roughness: 0.3, lightInteraction: 'reflect' },
  wood: { reflectivity: 0.1, roughness: 0.9, lightInteraction: 'absorb' },
  glass: { reflectivity: 0.7, roughness: 0.05, lightInteraction: 'transmit' },
  water: { reflectivity: 0.7, roughness: 0.05, lightInteraction: 'transmit' },
  metal: { reflectivity: 0.85, roughness: 0.2, lightInteraction: 'reflect' },
  fabric: { reflectivity: 0.3, roughness: 0.6, lightInteraction: 'scatter' },
  earth: { reflectivity: 0.1, roughness: 0.95, lightInteraction: 'absorb' },
  sand: { reflectivity: 0.25, roughness: 0.75, lightInteraction: 'scatter' },
};

/** Arrangement pattern keyword mapping. */
const ARRANGEMENT_KEYWORDS: Record<string, 'grid' | 'spiral' | 'radial' | 'organic' | 'linear'> = {
  spiral: 'spiral',
  radial: 'radial',
  grid: 'grid',
  linear: 'linear',
  line: 'linear',
  organic: 'organic',
  cluster: 'organic',
  circle: 'radial',
  row: 'linear',
  column: 'linear',
};

/** Shape keywords to detect primary geometric form. */
const SHAPE_KEYWORDS = [
  'cairn', 'column', 'circle', 'ring', 'line', 'tower',
  'mound', 'pile', 'sphere', 'cube', 'pyramid',
] as const;

/** The golden angle in radians — TAU * 0.381966. */
const GOLDEN_ANGLE = 2.399963;

// ============================================================================
// Extractors
// ============================================================================

/**
 * Extracts color parameters from observations.
 *
 * Scans literal and mood layers for color keywords, determines
 * palette temperature, and estimates contrast/saturation from mood.
 */
export function extractColors(understanding: UnifiedUnderstanding): ColorParameter {
  const allText = gatherObservationText(understanding, ['literal', 'mood']);

  const palette: ColorParameter['palette'] = [];
  const foundColors = new Set<string>();

  for (const [keyword, info] of Object.entries(COLOR_KEYWORDS)) {
    if (allText.includes(keyword) && !foundColors.has(keyword)) {
      foundColors.add(keyword);
      palette.push({
        name: keyword,
        hex: info.hex,
        role: palette.length === 0 ? 'primary'
          : palette.length < 3 ? 'accent'
            : 'background',
      });
    }
  }

  if (palette.length === 0) {
    palette.push({ name: 'neutral', hex: '#808080', role: 'primary' });
  }

  const warmCount = palette.filter(c => COLOR_KEYWORDS[c.name]?.temperature === 'warm').length;
  const coolCount = palette.filter(c => COLOR_KEYWORDS[c.name]?.temperature === 'cool').length;
  const temperature: 'warm' | 'cool' | 'mixed' =
    warmCount > coolCount ? 'warm' : coolCount > warmCount ? 'cool' : 'mixed';

  const moodText = gatherObservationText(understanding, ['mood']);
  const contrast = estimateDimension(moodText,
    ['high contrast', 'dramatic', 'vivid', 'bold'],
    ['muted', 'subtle', 'soft', 'flat']);
  const saturation = estimateDimension(moodText,
    ['saturated', 'vivid', 'intense', 'vibrant', 'rich'],
    ['muted', 'desaturated', 'pale', 'subtle', 'washed']);

  const relationships = warmCount > 0 && coolCount > 0 ? 'complementary' : 'analogous';

  return { palette, temperature, contrast, saturation, relationships };
}

/**
 * Extracts geometry parameters from observations.
 *
 * Identifies shape, arrangement pattern, symmetry, proportions,
 * and mathematical constants. Process classification from connections
 * influences whether organic or precise constants are used.
 */
export function extractGeometry(understanding: UnifiedUnderstanding): GeometryParameter {
  const spatialText = gatherObservationText(understanding, ['spatial', 'literal']);

  // Detect arrangement pattern
  let arrangement: 'grid' | 'spiral' | 'radial' | 'organic' | 'linear' = 'organic';
  for (const [keyword, pattern] of Object.entries(ARRANGEMENT_KEYWORDS)) {
    if (spatialText.includes(keyword)) {
      arrangement = pattern;
      break;
    }
  }

  // Detect primary shape
  const primaryShape = SHAPE_KEYWORDS.find(k => spatialText.includes(k)) ?? 'form';

  // Detect symmetry
  const isApproximate = spatialText.includes('approximate') ||
    spatialText.includes('organic') || spatialText.includes('imperfect');
  const isSymmetric = spatialText.includes('symmetric') ||
    spatialText.includes('equal') || spatialText.includes('precise');
  const symmetry: 'symmetric' | 'asymmetric' | 'approximate' =
    isApproximate ? 'approximate' : isSymmetric ? 'symmetric' : 'asymmetric';

  // Check process pattern from connections
  const isEmergent = understanding.connections.some(c =>
    c.type === 'process-pattern' && c.description.includes('emergent'),
  );

  // Proportions — extract numerical hints from text
  const proportions: Record<string, number> = {};
  const countMatch = spatialText.match(/(\d+)\s*(?:cairn|element|column|piece|item|object)/);
  if (countMatch) {
    proportions.elementCount = parseInt(countMatch[1], 10);
  }
  if (spatialText.includes('decay') || spatialText.includes('decreases')) {
    proportions.heightDecay = 0.85;
  }
  if (spatialText.includes('density') || spatialText.includes('gradient')) {
    proportions.densityGradient = 0.7;
  }

  // Constants — organic patterns get golden angle
  const constants: Record<string, number> = {};
  if (isEmergent || arrangement === 'spiral' || arrangement === 'organic') {
    constants.goldenAngle = GOLDEN_ANGLE;
  }
  if (arrangement === 'radial') {
    const sectorMatch = spatialText.match(/(\d+)\s*(?:section|sector|spoke|arm)/);
    if (sectorMatch) {
      constants.sectorCount = parseInt(sectorMatch[1], 10);
    }
  }

  return { primaryShape, arrangement, symmetry, proportions, constants };
}

/**
 * Extracts material parameters from observations.
 *
 * Identifies surfaces from literal layer, determines dominant
 * light interaction mode, and infers blend modes from mood/lighting.
 */
export function extractMaterials(understanding: UnifiedUnderstanding): MaterialParameter {
  const literalText = gatherObservationText(understanding, ['literal']);

  const surfaces: MaterialParameter['surfaces'] = [];
  const foundMaterials = new Set<string>();

  for (const [keyword, props] of Object.entries(MATERIAL_PROPERTIES)) {
    if (literalText.includes(keyword) && !foundMaterials.has(keyword)) {
      foundMaterials.add(keyword);
      surfaces.push({
        name: keyword,
        reflectivity: props.reflectivity,
        roughness: props.roughness,
      });
    }
  }

  if (surfaces.length === 0) {
    surfaces.push({ name: 'surface', reflectivity: 0.3, roughness: 0.5 });
  }

  const dominantMaterial = Object.entries(MATERIAL_PROPERTIES)
    .find(([k]) => literalText.includes(k));
  const lightInteraction = dominantMaterial?.[1].lightInteraction ?? 'scatter';

  const moodText = gatherObservationText(understanding, ['mood', 'relational']);
  const blendModes: string[] = [];
  if (moodText.includes('shadow') || moodText.includes('dark')) blendModes.push('multiply');
  if (moodText.includes('glow') || moodText.includes('light')) blendModes.push('screen');
  if (moodText.includes('overlay') || moodText.includes('color')) blendModes.push('overlay');

  return { surfaces, lightInteraction, blendModes };
}

/**
 * Extracts feel parameters from mood observations.
 *
 * Five dimensions on 0-1 scale. Explicitly subjective —
 * these are interpretive approximations, not ground truth.
 */
export function extractFeel(understanding: UnifiedUnderstanding): FeelParameter {
  const moodText = gatherObservationText(understanding, ['mood']);
  const allText = gatherObservationText(understanding);

  return {
    energy: estimateDimension(moodText,
      ['vibrant', 'dynamic', 'active', 'energetic', 'bright'],
      ['still', 'calm', 'quiet', 'contemplative', 'peaceful']),
    intimacy: estimateDimension(moodText,
      ['intimate', 'close', 'personal', 'warm', 'enclosed'],
      ['grand', 'vast', 'open', 'public', 'expansive']),
    order: estimateDimension(allText,
      ['ordered', 'precise', 'grid', 'symmetric', 'aligned', 'regular'],
      ['organic', 'random', 'chaotic', 'irregular', 'varied']),
    handmade: estimateDimension(allText,
      ['handmade', 'hand', 'natural', 'imperfect', 'organic', 'varied', 'rough'],
      ['machine', 'digital', 'precise', 'manufactured', 'uniform']),
    ceremony: estimateDimension(moodText,
      ['ceremonial', 'sacred', 'ritual', 'formal', 'elevated', 'ceremony'],
      ['casual', 'everyday', 'mundane', 'ordinary', 'simple']),
  };
}

/**
 * Extracts custom domain-specific parameters.
 *
 * Captures details not covered by standard categories:
 * acoustic geometry, condition modes, colored light sources.
 */
export function extractCustom(understanding: UnifiedUnderstanding): Record<string, unknown> {
  const custom: Record<string, unknown> = {};
  const allText = gatherObservationText(understanding);
  const contextText = Object.values(understanding.context)
    .filter(Boolean).join(' ').toLowerCase();

  if (contextText.includes('acoustic') || contextText.includes('sound') ||
      contextText.includes('speaker')) {
    custom.acousticGeometry = true;
  }

  const conditionModes: string[] = [];
  if (allText.includes('daylight') || allText.includes('day')) conditionModes.push('daylight');
  if (allText.includes('night') || allText.includes('dark')) conditionModes.push('night');
  if (allText.includes('shadow') && allText.includes('color')) conditionModes.push('colored-shadows');
  if (allText.includes('projector') || allText.includes('projection')) conditionModes.push('projection');
  if (conditionModes.length > 0) {
    custom.conditionModes = conditionModes;
  }

  const lightSources: string[] = [];
  for (const color of ['pink', 'magenta', 'blue', 'cyan', 'red', 'green', 'amber']) {
    if (allText.includes(color) && (allText.includes('light') || allText.includes('glow'))) {
      lightSources.push(color);
    }
  }
  if (allText.includes('projector')) lightSources.push('projector');
  if (lightSources.length > 0) {
    custom.lightSources = lightSources;
  }

  return custom;
}

/**
 * Orchestrates all extractors — returns complete ExtractedParameters.
 */
export function extract(understanding: UnifiedUnderstanding): ExtractedParameters {
  return {
    color: extractColors(understanding),
    geometry: extractGeometry(understanding),
    material: extractMaterials(understanding),
    feel: extractFeel(understanding),
    custom: extractCustom(understanding),
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Gathers all observation text from specified layers (or all if omitted). */
function gatherObservationText(
  understanding: UnifiedUnderstanding,
  layers?: readonly string[],
): string {
  const parts: string[] = [];

  for (const obs of understanding.observations) {
    for (const layer of obs.layers) {
      if (!layers || layers.includes(layer.layer)) {
        parts.push(...layer.observations);
      }
    }
  }

  if (understanding.processInsight) parts.push(understanding.processInsight);

  return parts.join(' ').toLowerCase();
}

/**
 * Estimates a 0-1 dimension value based on positive/negative keyword presence.
 * Returns 0.5 (neutral) when no signals present.
 * Scaled to 0.2-0.8 range to avoid extreme values without strong evidence.
 */
function estimateDimension(text: string, highSignals: string[], lowSignals: string[]): number {
  const lower = text.toLowerCase();
  const highCount = highSignals.filter(s => lower.includes(s)).length;
  const lowCount = lowSignals.filter(s => lower.includes(s)).length;

  if (highCount === 0 && lowCount === 0) return 0.5;

  const total = highCount + lowCount;
  const raw = highCount / total;

  return 0.2 + raw * 0.6;
}

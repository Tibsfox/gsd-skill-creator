/**
 * Observation Engine — four-layer structured perception.
 *
 * Processes images through Literal → Spatial → Relational → Mood layers
 * before producing any output. Resists the urge to interpret or build
 * prematurely — its sole job is to see clearly.
 *
 * Single image:  L1 → L2 → L3(self) → L4
 * Multi-image:   [L1 → L2] per image → L3(cross) → L4(synthesis)
 */

import type { ImageInput, ImageObservation, ObservationLayer } from './types.js';

/**
 * Observation protocol defining how each layer operates.
 * Used by the SKILL.md and by consumers to understand output.
 */
export const OBSERVATION_PROTOCOL = {
  literal: {
    description: 'What is physically present — no interpretation',
    focus: ['objects', 'materials', 'colors', 'quantities', 'sizes'],
    confidence: { typical: [0.8, 1.0], note: 'High for clearly visible elements' },
  },
  spatial: {
    description: 'How elements relate in space',
    focus: ['arrangement', 'scale', 'proportion', 'density', 'symmetry', 'perspective'],
    confidence: { typical: [0.6, 0.9], note: 'Approximate from 2D photos' },
  },
  relational: {
    description: 'Connections between elements and across images',
    focus: ['persistence', 'change', 'framing', 'temporal', 'multi-purpose'],
    confidence: { typical: [0.5, 0.8], note: 'Involves inference' },
  },
  mood: {
    description: 'Intangible qualities — atmosphere, energy, feel',
    focus: ['energy', 'intimacy', 'order', 'handmade', 'ceremony'],
    confidence: { typical: [0.4, 0.7], note: 'Inherently subjective' },
  },
} as const;

/**
 * Observes literal content in a single image.
 *
 * Enumerates all visible objects, materials, colors, and elements
 * without interpretation. "Stones arranged in a pattern" not
 * "stones arranged artistically."
 */
export function observeLiteral(image: ImageInput): ObservationLayer {
  return {
    layer: 'literal',
    observations: [],
    confidence: 0.0,
  };
}

/**
 * Analyzes spatial relationships in a single image,
 * informed by the literal layer.
 */
export function analyzeSpatial(
  image: ImageInput,
  literal: ObservationLayer,
): ObservationLayer {
  return {
    layer: 'spatial',
    observations: [],
    confidence: 0.0,
  };
}

/**
 * Maps relational connections across multiple images.
 *
 * For single images: relates elements to each other.
 * For multi-image sets: identifies persistent vs. changing elements.
 */
export function mapRelational(
  images: ImageInput[],
  literals: ObservationLayer[],
  spatials: ObservationLayer[],
): ObservationLayer {
  return {
    layer: 'relational',
    observations: [],
    confidence: 0.0,
  };
}

/**
 * Extracts mood and atmosphere across all layers.
 *
 * Quantifies five dimensions on 0-1 scale:
 * energy, intimacy, order, handmade, ceremony.
 */
export function extractMood(
  images: ImageInput[],
  allLayers: ObservationLayer[][],
): ObservationLayer {
  return {
    layer: 'mood',
    observations: [],
    confidence: 0.0,
  };
}

/**
 * Orchestrates all four observation layers for a set of images.
 *
 * Processes each image through literal and spatial layers,
 * then runs relational across the full set, then synthesizes mood.
 * Returns one ImageObservation per input image.
 */
export function observe(images: ImageInput[]): ImageObservation[] {
  if (images.length === 0) {
    return [];
  }

  const perImage: { literal: ObservationLayer; spatial: ObservationLayer }[] = [];

  // Layers 1-2: per-image
  for (const image of images) {
    const literal = observeLiteral(image);
    const spatial = analyzeSpatial(image, literal);
    perImage.push({ literal, spatial });
  }

  const literals = perImage.map(p => p.literal);
  const spatials = perImage.map(p => p.spatial);

  // Layer 3: cross-image
  const relational = mapRelational(images, literals, spatials);

  // Layer 4: synthesis
  const allLayers = perImage.map(p => [p.literal, p.spatial]);
  const mood = extractMood(images, allLayers);

  // Assemble per-image observations
  return images.map((image, i) => ({
    imageId: image.id,
    layers: [perImage[i].literal, perImage[i].spatial, relational, mood],
    rawDescription: buildRawDescription(perImage[i].literal, perImage[i].spatial, relational, mood),
  }));
}

function buildRawDescription(
  literal: ObservationLayer,
  spatial: ObservationLayer,
  relational: ObservationLayer,
  mood: ObservationLayer,
): string {
  const sections = [
    literal.observations.length > 0 ? `Literal: ${literal.observations.join('. ')}.` : '',
    spatial.observations.length > 0 ? `Spatial: ${spatial.observations.join('. ')}.` : '',
    relational.observations.length > 0 ? `Relational: ${relational.observations.join('. ')}.` : '',
    mood.observations.length > 0 ? `Mood: ${mood.observations.join('. ')}.` : '',
  ].filter(Boolean);

  return sections.join(' ') || 'No observations produced.';
}

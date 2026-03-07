/**
 * Connection Engine — synthesis across observations and context.
 *
 * Finds patterns across all inputs — visual observations AND creator context —
 * producing a UnifiedUnderstanding that neither source could create alone.
 * This is where "rocks on a tarp" becomes "acoustic geometry mapped in stone."
 *
 * Three connection types:
 * 1. Cross-image: patterns across multiple images of the same subject
 * 2. Visual-context: merging what's seen with what's told
 * 3. Process-pattern: inferring whether the work is emergent or designed
 */

import type {
  ImageObservation,
  CreatorContext,
  Connection,
  UnifiedUnderstanding,
} from './types.js';
import { LAYER_MAPPINGS, mapToLayers, extractProcessInsight } from './context-integrator.js';

/** Signals suggesting emergent/handmade creation process. */
export const EMERGENT_SIGNALS = [
  'imperfect', 'organic', 'varied', 'irregular', 'offset',
  'approximate', 'natural', 'uneven', 'handmade', 'accumulated',
] as const;

/** Signals suggesting designed/planned creation process. */
export const DESIGNED_SIGNALS = [
  'symmetric', 'grid', 'uniform', 'equal', 'precise',
  'exact', 'measured', 'planned', 'aligned', 'regular',
] as const;

/**
 * Finds connections across multiple images.
 *
 * Identifies persistent elements (present in all images) and
 * dynamic elements (changing between images). Returns empty
 * for single-image input — cross-image needs at least 2.
 */
export function linkCrossImage(observations: ImageObservation[]): Connection[] {
  if (observations.length < 2) return [];

  const connections: Connection[] = [];

  // Collect observations by layer type across images
  const byLayer = new Map<string, Map<string, string[]>>();

  for (const obs of observations) {
    for (const layer of obs.layers) {
      if (!byLayer.has(layer.layer)) {
        byLayer.set(layer.layer, new Map());
      }
      byLayer.get(layer.layer)!.set(obs.imageId, layer.observations);
    }
  }

  // Compare literal and spatial layers for persistent vs dynamic
  for (const layerName of ['literal', 'spatial']) {
    const layerData = byLayer.get(layerName);
    if (!layerData || layerData.size < 2) continue;

    const allImageObs = [...layerData.values()];

    // Normalize for comparison
    const normalized = allImageObs.map(obs =>
      obs.map(o => o.toLowerCase().trim()),
    );

    const persistent: string[] = [];
    const dynamic: string[] = [];

    // Persistent: observations from first image that match something in other images
    for (const obs of normalized[0]) {
      const appearsInOthers = normalized.slice(1).some(other =>
        other.some(o => shareSignificantWords(obs, o)),
      );
      if (appearsInOthers) {
        persistent.push(obs);
      }
    }

    // Dynamic: observations unique to one image
    for (let i = 0; i < normalized.length; i++) {
      for (const obs of normalized[i]) {
        const isUnique = normalized.every((other, j) =>
          i === j || !other.some(o => shareSignificantWords(obs, o)),
        );
        if (isUnique) {
          dynamic.push(obs);
        }
      }
    }

    if (persistent.length > 0) {
      connections.push({
        type: 'cross-image',
        description: `Persistent ${layerName} elements across ${observations.length} images`,
        elements: persistent,
        significance: `${persistent.length} element(s) remain constant — these are structurally load-bearing`,
      });
    }

    if (dynamic.length > 0) {
      connections.push({
        type: 'cross-image',
        description: `Dynamic ${layerName} elements changing between images`,
        elements: dynamic,
        significance: `${dynamic.length} element(s) change between conditions — these reveal the system's range`,
      });
    }
  }

  return connections;
}

/**
 * Bridges visual observations with creator context.
 *
 * Maps context fields to observation layers they modify, then
 * produces connections linking what's seen with what's told.
 * Falls back to a general bridge when no specific matches exist.
 */
export function bridgeVisualContext(
  observations: ImageObservation[],
  context: CreatorContext,
  layerMappings?: Record<string, string[]>,
): Connection[] {
  const mappings = layerMappings ?? mapToLayers(context);
  const connections: Connection[] = [];

  for (const [field, value] of Object.entries(context)) {
    if (!value || !(field in LAYER_MAPPINGS)) continue;

    const targetLayers = LAYER_MAPPINGS[field];

    for (const obs of observations) {
      for (const layer of obs.layers) {
        if (!targetLayers.includes(layer.layer)) continue;
        if (layer.observations.length === 0) continue;

        const relevant = layer.observations.filter(o =>
          hasContextRelevance(o, value),
        );

        if (relevant.length > 0) {
          connections.push({
            type: 'visual-context',
            description: `${field} context illuminates ${layer.layer} observations: ${relevant[0]}`,
            elements: [value, ...relevant],
            significance: `Creator's ${field} reinterprets what's seen in the ${layer.layer} layer`,
          });
        }
      }
    }
  }

  // General bridge when context exists but no specific observation matches
  if (connections.length === 0 && Object.values(context).some(Boolean)) {
    const contextFields = Object.entries(context)
      .filter(([, v]) => v)
      .map(([k]) => k);

    connections.push({
      type: 'visual-context',
      description: 'Creator context provides background not directly visible in observations',
      elements: contextFields,
      significance: 'Context adds invisible layers that photographs cannot capture',
    });
  }

  return connections;
}

/**
 * Analyzes observations for evidence of emergent vs. designed creation.
 *
 * Searches observation text for process signals, classifies the work,
 * then checks if creator context confirms or contradicts the visual evidence.
 */
export function findProcessPatterns(
  observations: ImageObservation[],
  context: CreatorContext,
): Connection[] {
  const allText = observations
    .flatMap(obs => obs.layers)
    .flatMap(layer => layer.observations)
    .join(' ')
    .toLowerCase();

  const emergentEvidence = EMERGENT_SIGNALS.filter(s => allText.includes(s));
  const designedEvidence = DESIGNED_SIGNALS.filter(s => allText.includes(s));

  // Classify based on signal counts
  let classification: 'emergent' | 'designed' | 'mixed';
  if (emergentEvidence.length > designedEvidence.length) {
    classification = 'emergent';
  } else if (designedEvidence.length > emergentEvidence.length) {
    classification = 'designed';
  } else {
    classification = 'mixed';
  }

  // Check context alignment — context can also tip a mixed classification
  let contextAlignment: 'confirmed' | 'contradicted' | 'neutral' = 'neutral';
  if (context.accidents || context.process) {
    const contextText = [context.accidents, context.process]
      .filter(Boolean).join(' ').toLowerCase();

    const contextSaysEmergent =
      EMERGENT_SIGNALS.some(s => contextText.includes(s)) ||
      contextText.includes('emerged') ||
      contextText.includes('not designed');

    const contextSaysDesigned =
      DESIGNED_SIGNALS.some(s => contextText.includes(s)) &&
      !contextText.includes('not designed');

    // When visual evidence is inconclusive, context tips the scale
    if (classification === 'mixed') {
      if (contextSaysEmergent) {
        classification = 'emergent';
        contextAlignment = 'confirmed';
      } else if (contextSaysDesigned) {
        classification = 'designed';
        contextAlignment = 'confirmed';
      }
    } else if ((classification === 'emergent' && contextSaysEmergent) ||
               (classification === 'designed' && contextSaysDesigned)) {
      contextAlignment = 'confirmed';
    } else if ((classification === 'emergent' && contextSaysDesigned) ||
               (classification === 'designed' && contextSaysEmergent)) {
      contextAlignment = 'contradicted';
    }
  }

  const evidence = [...emergentEvidence, ...designedEvidence];

  if (evidence.length > 0 || contextAlignment !== 'neutral') {
    const suffix = contextAlignment !== 'neutral'
      ? ` (${contextAlignment} by creator context)` : '';

    return [{
      type: 'process-pattern',
      description: `Process classified as ${classification}${suffix}`,
      elements: evidence.length > 0 ? evidence : ['insufficient visual evidence'],
      significance: classification === 'emergent'
        ? 'Work accumulated through process, not planned on paper — use organic parameters'
        : classification === 'designed'
          ? 'Work follows intentional design — use precise geometric parameters'
          : 'Mixed signals — both planned structure and organic emergence present',
    }];
  }

  return [];
}

/**
 * Orchestrates all three connection types and returns a UnifiedUnderstanding.
 *
 * Ranking: visual-context connections first (most interpretive value),
 * then cross-image (structural), then process-pattern (classification).
 * Within each group, connections with more evidence elements rank higher.
 */
export function synthesize(
  observations: ImageObservation[],
  context: CreatorContext,
): UnifiedUnderstanding {
  if (observations.length === 0) {
    return {
      observations: [],
      context,
      connections: [],
      processInsight: undefined,
    };
  }

  const layerMappings = mapToLayers(context);
  const processInsight = extractProcessInsight(context);

  const visualContext = bridgeVisualContext(observations, context, layerMappings);
  const crossImage = linkCrossImage(observations);
  const processPatterns = findProcessPatterns(observations, context);

  // Combine with priority ordering, then sort by evidence count within groups
  const allConnections = [
    ...visualContext,
    ...crossImage,
    ...processPatterns,
  ];

  allConnections.sort((a, b) => b.elements.length - a.elements.length);

  return {
    observations,
    context,
    connections: allConnections,
    processInsight: processInsight ?? undefined,
  };
}

// --- Internal helpers ---

/** Checks if two observation strings share significant words (length > 3). */
function shareSignificantWords(a: string, b: string): boolean {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 3));
  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }
  return shared >= 2;
}

/** Checks if an observation has keyword relevance to a context value. */
function hasContextRelevance(observation: string, contextValue: string): boolean {
  const obsWords = new Set(observation.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const ctxWords = contextValue.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  return ctxWords.some(w => obsWords.has(w));
}

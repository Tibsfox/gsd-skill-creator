/**
 * Eight-layer to ten-part progression mapping and gap detection (Track C).
 * Maps the ecosystem's 8-layer mathematical progression to the textbook's
 * 10-part structure, identifying structural gaps and ordering inconsistencies.
 */

import type { LearnedConceptRef, EcosystemClaim, GapRecord, GapType } from './types.js';
import { assignSeverity } from './gap-classifier.js';

/** Mapping between a single ecosystem layer and a textbook part */
export interface LayerPartMapping {
  layer: number;
  layerName: string;
  part: number;
  partName: string;
  conceptsMatched: string[];
  confidence: number;
}

/** Full progression mapping result */
export interface ProgressionMapping {
  layerMappings: LayerPartMapping[];
  unmappedLayers: Array<{ layer: number; name: string }>;
  unmappedParts: Array<{ part: number; name: string }>;
  orderingConsistent: boolean;
  dependencyGaps: GapRecord[];
  structuralGaps: GapRecord[];
}

// --- Ecosystem's eight layers ---

const EIGHT_LAYERS = [
  { layer: 1, name: 'Unit circle', keywords: ['unit circle', 'perception', 'angular', 'theta'] },
  { layer: 2, name: 'Pythagorean theorem', keywords: ['pythagorean', 'relationship', 'distance', 'hypotenuse'] },
  { layer: 3, name: 'Trigonometry', keywords: ['trigonometry', 'sine', 'cosine', 'fourier', 'wave'] },
  { layer: 4, name: 'Vector calculus', keywords: ['vector', 'calculus', 'field', 'gradient', 'divergence'] },
  { layer: 5, name: 'Set theory', keywords: ['set theory', 'boundary', 'membership', 'union', 'intersection'] },
  { layer: 6, name: 'Category theory', keywords: ['category', 'functor', 'morphism', 'mapping', 'composition'] },
  { layer: 7, name: 'Information systems theory', keywords: ['information', 'entropy', 'channel', 'capacity', 'compression'] },
  { layer: 8, name: 'L-systems', keywords: ['l-system', 'fractal', 'recursion', 'growth', 'iteration'] },
];

// --- Textbook's ten parts ---

const TEN_PARTS = [
  { part: 1, name: 'Seeing', keywords: ['perception', 'number', 'counting', 'visualization'] },
  { part: 2, name: 'Hearing', keywords: ['wave', 'vibration', 'sound', 'frequency', 'fourier'] },
  { part: 3, name: 'Moving', keywords: ['calculus', 'derivative', 'integral', 'motion', 'dynamics'] },
  { part: 4, name: 'Expanding', keywords: ['linear algebra', 'matrix', 'vector', 'eigenvalue', 'dimension'] },
  { part: 5, name: 'Grounding', keywords: ['probability', 'statistics', 'bayesian', 'distribution', 'random'] },
  { part: 6, name: 'Defining', keywords: ['set theory', 'boundary', 'axiom', 'membership', 'topology'] },
  { part: 7, name: 'Mapping', keywords: ['category theory', 'functor', 'morphism', 'natural transformation'] },
  { part: 8, name: 'Converging', keywords: ['information theory', 'entropy', 'compression', 'channel'] },
  { part: 9, name: 'Growing', keywords: ['fractal', 'l-system', 'recursion', 'self-similar', 'chaos'] },
  { part: 10, name: 'Being', keywords: ['physics', 'consciousness', 'quantum', 'philosophy', 'emergence'] },
];

/**
 * Generate a unique gap ID.
 */
function generateGapId(prefix: string): string {
  const slug = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  return `gap-layer-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Compute keyword overlap between two keyword lists (case-insensitive).
 */
function keywordOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map(k => k.toLowerCase()));
  const setB = new Set(b.map(k => k.toLowerCase()));
  let count = 0;
  for (const item of setA) {
    if (setB.has(item)) count++;
  }
  return count;
}

/**
 * Find concepts that match a given keyword set.
 */
function findMatchingConcepts(
  keywords: string[],
  concepts: LearnedConceptRef[],
): LearnedConceptRef[] {
  const lowerKws = new Set(keywords.map(k => k.toLowerCase()));
  return concepts.filter(c => {
    const conceptKws = c.keywords.map(k => k.toLowerCase());
    return conceptKws.some(kw => lowerKws.has(kw));
  });
}

/**
 * Verify the eight-layer to ten-part progression mapping.
 *
 * 1. For each layer, find the textbook part(s) with highest keyword overlap.
 * 2. Identify unmapped layers and parts.
 * 3. Check ordering consistency.
 * 4. Check dependency assumptions.
 * 5. Generate structural gap records.
 */
export function verifyProgression(
  concepts: LearnedConceptRef[],
  claims: EcosystemClaim[],
): ProgressionMapping {
  const layerMappings: LayerPartMapping[] = [];
  const mappedPartSet = new Set<number>();
  const mappedLayerSet = new Set<number>();

  // Combine claim keywords with layer keywords for richer matching
  const claimKeywordsByLayer = new Map<number, Set<string>>();
  for (const layer of EIGHT_LAYERS) {
    const layerKws = new Set(layer.keywords.map(k => k.toLowerCase()));
    // Find claims that match this layer
    for (const claim of claims) {
      const claimKws = claim.keywords.map(k => k.toLowerCase());
      const hasOverlap = claimKws.some(kw => layerKws.has(kw));
      if (hasOverlap) {
        if (!claimKeywordsByLayer.has(layer.layer)) {
          claimKeywordsByLayer.set(layer.layer, new Set<string>());
        }
        const set = claimKeywordsByLayer.get(layer.layer)!;
        for (const kw of claimKws) set.add(kw);
      }
    }
  }

  // Step 1: Map each layer to best-matching part(s)
  for (const layer of EIGHT_LAYERS) {
    // Combine layer keywords with claim keywords for this layer
    const allLayerKeywords = [...layer.keywords];
    const claimKws = claimKeywordsByLayer.get(layer.layer);
    if (claimKws) {
      for (const kw of claimKws) {
        if (!allLayerKeywords.map(k => k.toLowerCase()).includes(kw)) {
          allLayerKeywords.push(kw);
        }
      }
    }

    let bestPart: typeof TEN_PARTS[0] | undefined;
    let bestOverlap = 0;

    for (const part of TEN_PARTS) {
      const overlap = keywordOverlap(allLayerKeywords, part.keywords);
      if (overlap >= 2 && overlap > bestOverlap) {
        bestOverlap = overlap;
        bestPart = part;
      }
    }

    // Also check if concepts from a specific part match this layer
    if (!bestPart) {
      for (const part of TEN_PARTS) {
        const partConcepts = concepts.filter(c => c.sourcePart === part.part);
        const matchingConcepts = findMatchingConcepts(allLayerKeywords, partConcepts);
        if (matchingConcepts.length > 0) {
          const conceptOverlap = matchingConcepts.length;
          if (conceptOverlap > bestOverlap) {
            bestOverlap = conceptOverlap;
            bestPart = part;
          }
        }
      }
    }

    if (bestPart) {
      // Find matching concepts for this mapping
      const partConcepts = concepts.filter(c => c.sourcePart === bestPart!.part);
      const matchingConcepts = findMatchingConcepts(layer.keywords, partConcepts);
      const allMatchingConcepts = findMatchingConcepts(layer.keywords, concepts);

      layerMappings.push({
        layer: layer.layer,
        layerName: layer.name,
        part: bestPart.part,
        partName: bestPart.name,
        conceptsMatched: [
          ...new Set([
            ...matchingConcepts.map(c => c.name),
            ...allMatchingConcepts.map(c => c.name),
          ]),
        ],
        confidence: Math.min(1, bestOverlap / 3),
      });
      mappedPartSet.add(bestPart.part);
      mappedLayerSet.add(layer.layer);
    }
  }

  // Step 2: Identify unmapped layers and parts
  const unmappedLayers = EIGHT_LAYERS
    .filter(l => !mappedLayerSet.has(l.layer))
    .map(l => ({ layer: l.layer, name: l.name }));

  const unmappedParts = TEN_PARTS
    .filter(p => !mappedPartSet.has(p.part))
    .map(p => ({ part: p.part, name: p.name }));

  // Step 3: Check ordering consistency
  let orderingConsistent = true;
  const sortedMappings = [...layerMappings].sort((a, b) => a.layer - b.layer);
  for (let i = 1; i < sortedMappings.length; i++) {
    if (sortedMappings[i].part < sortedMappings[i - 1].part) {
      orderingConsistent = false;
      break;
    }
  }

  // Step 4: Check dependency gaps
  const dependencyGaps: GapRecord[] = [];

  // For each layer mapping, check if the textbook establishes prerequisite chains
  for (let i = 1; i < sortedMappings.length; i++) {
    const current = sortedMappings[i];
    const previous = sortedMappings[i - 1];

    // Check if any claim for current layer mentions the previous layer's domain
    const currentLayerDef = EIGHT_LAYERS.find(l => l.layer === current.layer);
    const prevLayerDef = EIGHT_LAYERS.find(l => l.layer === previous.layer);

    if (currentLayerDef && prevLayerDef) {
      // Check claims for cross-layer dependency references
      const currentClaims = claims.filter(c =>
        c.keywords.some(kw =>
          currentLayerDef.keywords.some(lkw =>
            kw.toLowerCase().includes(lkw.toLowerCase()),
          ),
        ),
      );

      for (const claim of currentClaims) {
        const mentionsPreviousLayer = prevLayerDef.keywords.some(kw =>
          claim.claim.toLowerCase().includes(kw.toLowerCase()) ||
          claim.keywords.some(ckw => ckw.toLowerCase().includes(kw.toLowerCase())),
        );

        if (mentionsPreviousLayer) {
          // Ecosystem assumes a dependency -- check if textbook supports it
          const prevPartConcepts = concepts.filter(c => c.sourcePart === previous.part);
          const currPartConcepts = concepts.filter(c => c.sourcePart === current.part);

          // Check if any current-part concept lists previous-part concepts as prerequisites
          const hasPrerequisiteChain = currPartConcepts.some(c =>
            c.keywords.some(kw =>
              prevPartConcepts.some(pc =>
                pc.keywords.some(pk => pk.toLowerCase().includes(kw.toLowerCase())),
              ),
            ),
          );

          if (!hasPrerequisiteChain && prevPartConcepts.length > 0 && currPartConcepts.length > 0) {
            const gap: GapRecord = {
              id: generateGapId(`dep-${current.layerName}`),
              type: 'new-connection' as GapType,
              severity: 'minor',
              concept: `${current.layerName} -> ${previous.layerName}`,
              textbookSource: `Part ${current.part} (${current.partName})`,
              ecosystemSource: claim.document,
              textbookClaim: `Textbook Part ${current.part} does not explicitly require Part ${previous.part}`,
              ecosystemClaim: claim.claim,
              analysis: `Ecosystem assumes ${current.layerName} builds on ${previous.layerName}, but textbook does not establish an explicit prerequisite chain between Part ${current.part} (${current.partName}) and Part ${previous.part} (${previous.partName}).`,
              suggestedResolution: `Verify whether ${current.layerName} genuinely depends on ${previous.layerName} and document the relationship.`,
              affectsComponents: [current.layerName, previous.layerName],
            };
            gap.severity = assignSeverity(gap);
            dependencyGaps.push(gap);
          }
        }
      }
    }
  }

  // Step 5: Generate structural gaps
  const structuralGaps: GapRecord[] = [];

  // Unmapped parts -> missing-in-ecosystem (textbook has content ecosystem doesn't layer)
  for (const part of unmappedParts) {
    const gap: GapRecord = {
      id: generateGapId(`part-${part.part}`),
      type: 'missing-in-ecosystem' as GapType,
      severity: 'minor',
      concept: `Part ${part.part}: ${part.name}`,
      textbookSource: `Part ${part.part} (${part.name})`,
      ecosystemSource: 'none',
      textbookClaim: `Textbook covers "${part.name}" in Part ${part.part}`,
      ecosystemClaim: 'No corresponding ecosystem layer',
      analysis: `Textbook Part ${part.part} (${part.name}) has no corresponding layer in the ecosystem's 8-layer progression. This represents a structural gap in the ecosystem's mathematical coverage.`,
      suggestedResolution: `Consider adding an ecosystem layer for "${part.name}" content or mapping it to an existing layer.`,
      affectsComponents: [part.name],
    };
    gap.severity = assignSeverity(gap);
    structuralGaps.push(gap);
  }

  // Unmapped layers -> missing-in-textbook (ecosystem layer with no textbook part)
  for (const layer of unmappedLayers) {
    const gap: GapRecord = {
      id: generateGapId(`layer-${layer.layer}`),
      type: 'missing-in-textbook' as GapType,
      severity: 'minor',
      concept: `Layer ${layer.layer}: ${layer.name}`,
      textbookSource: 'none',
      ecosystemSource: 'ecosystem',
      textbookClaim: 'No corresponding textbook part',
      ecosystemClaim: `Ecosystem Layer ${layer.layer} covers "${layer.name}"`,
      analysis: `Ecosystem Layer ${layer.layer} (${layer.name}) has no corresponding textbook part. This layer's content is ecosystem-specific and not grounded in the textbook structure.`,
      suggestedResolution: `Determine if "${layer.name}" should be incorporated into the textbook or is appropriately ecosystem-specific.`,
      affectsComponents: [layer.name],
    };
    gap.severity = assignSeverity(gap);
    structuralGaps.push(gap);
  }

  return {
    layerMappings,
    unmappedLayers,
    unmappedParts,
    orderingConsistent,
    dependencyGaps,
    structuralGaps,
  };
}

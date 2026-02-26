/**
 * Generates knowledge patches from gap records.
 * Only actionable gap types (inconsistent, outdated, incomplete) produce patches.
 * All patches are proposals — requiresReview is always true (SAFETY-03).
 */

import type { GapRecord } from '../verification/types.js';
import type { KnowledgePatch, PatchType, RefinementConfig } from './types.js';

/** Gap types that produce actionable patches */
const ACTIONABLE_TYPES = new Set(['inconsistent', 'outdated', 'incomplete']);

/** Keywords indicating philosophical content (skip these) */
const PHILOSOPHICAL_KEYWORDS = ['consciousness', 'philosophy', 'meaning of'];

/** Keywords indicating structural issues (use annotate) */
const RESTRUCTURE_KEYWORDS = ['restructure', 'reorganize'];

/** Keywords indicating geometry-sensitive targets */
const GEOMETRY_KEYWORDS = ['unit-circle', 'synthesis', 'skill-creator'];

/**
 * Generate knowledge patches from gap records.
 * Filters to actionable types, skips philosophical content,
 * and enforces requiresReview=true on all output.
 */
export function generatePatches(
  gaps: GapRecord[],
  config?: Partial<RefinementConfig>,
): KnowledgePatch[] {
  const minConfidence = config?.minPatchConfidence ?? 0.5;
  const maxPerGap = config?.maxPatchesPerGap ?? 1;

  const patches: KnowledgePatch[] = [];

  for (const gap of gaps) {
    // Only process actionable gap types
    if (!ACTIONABLE_TYPES.has(gap.type)) {
      continue;
    }

    // Skip philosophical content
    const analysisLower = gap.analysis.toLowerCase();
    if (PHILOSOPHICAL_KEYWORDS.some(kw => analysisLower.includes(kw))) {
      continue;
    }

    // Determine patch type
    const patchType = determinePatchType(gap);

    // Extract target document and section from ecosystemSource
    const { document: targetDocument, section: targetSection } = parseEcosystemSource(gap.ecosystemSource);

    // Compute confidence
    const confidence = computeConfidence(patchType, targetDocument);

    // Apply minimum confidence filter
    if (confidence < minConfidence) {
      continue;
    }

    // Generate proposed content
    const proposedContent = patchType === 'annotate'
      ? `[Annotation] ${gap.analysis}. See textbook: ${gap.textbookSource} for reference. Suggested approach: ${gap.suggestedResolution}`
      : gap.textbookClaim + (gap.suggestedResolution ? `. Resolution: ${gap.suggestedResolution}` : '');

    // Generate review notes
    const isGeometrySensitive = GEOMETRY_KEYWORDS.some(kw => targetDocument.includes(kw));
    const reviewNotes = isGeometrySensitive
      ? 'This patch affects skill activation geometry. Verify that angular positions remain consistent with the complex plane model.'
      : 'Verify textbook citation accuracy and ecosystem doc formatting.';

    const patch: KnowledgePatch = {
      id: `patch-${gap.id}`,
      targetDocument,
      targetSection,
      gapId: gap.id,
      patchType,
      currentContent: gap.ecosystemClaim,
      proposedContent,
      rationale: `${gap.analysis}. Evidence: ${gap.textbookSource}`,
      confidence,
      requiresReview: true,
      reviewNotes,
    };

    patches.push(patch);

    // Respect maxPatchesPerGap (only one patch per gap by default)
    if (patches.filter(p => p.gapId === gap.id).length >= maxPerGap) {
      continue;
    }
  }

  // Sort by confidence descending
  patches.sort((a, b) => b.confidence - a.confidence);

  return patches;
}

/** Map gap type + resolution to patch type */
function determinePatchType(gap: GapRecord): PatchType {
  const resolutionLower = gap.suggestedResolution.toLowerCase();
  if (RESTRUCTURE_KEYWORDS.some(kw => resolutionLower.includes(kw))) {
    return 'annotate';
  }

  switch (gap.type) {
    case 'inconsistent': return 'update';
    case 'outdated': return 'replace';
    case 'incomplete': return 'add';
    default: return 'update';
  }
}

/** Parse ecosystemSource into document and section */
function parseEcosystemSource(source: string): { document: string; section: string } {
  const hashIndex = source.indexOf('#');
  if (hashIndex >= 0) {
    return {
      document: source.slice(0, hashIndex),
      section: source.slice(hashIndex + 1),
    };
  }
  return { document: source, section: 'general' };
}

/** Compute confidence based on patch type and target sensitivity */
function computeConfidence(patchType: PatchType, targetDocument: string): number {
  const isGeometrySensitive = GEOMETRY_KEYWORDS.some(kw => targetDocument.includes(kw));

  if (patchType === 'annotate') {
    return 0.6;
  }

  if (isGeometrySensitive) {
    return 0.75;
  }

  return 0.85;
}

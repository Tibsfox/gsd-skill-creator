/**
 * Generates skill definition updates from verified concepts.
 * Maps learned concepts to skill updates with complex plane positions,
 * evidence chains, and trigger patterns.
 */

import type { LearnedConcept } from '../learning/types.js';
import type { GapRecord } from '../verification/types.js';
import type { SkillUpdate } from './types.js';

/** Minimum confidence to consider a concept for skill generation */
const MIN_CONFIDENCE = 0.7;

/**
 * Generate skill updates from learned concepts cross-referenced with gap records.
 * Filters by confidence, determines action type (create/refine/merge/annotate),
 * and maps complex plane positions from source concepts.
 */
export function refineSkills(
  concepts: LearnedConcept[],
  gaps: GapRecord[],
): SkillUpdate[] {
  // Filter to eligible concepts
  const eligible = concepts.filter(c => {
    if (c.confidence < MIN_CONFIDENCE) return false;
    // Must have ecosystem mapping OR be flagged as important new knowledge
    const hasMapping = c.ecosystemMappings.length > 0;
    const isImportantNew = !hasMapping && gaps.some(
      g => g.concept === c.name && (g.severity === 'critical' || g.severity === 'significant' || g.type === 'missing-in-ecosystem'),
    );
    return hasMapping || isImportantNew;
  });

  // Detect merge candidates: concepts mapping to the same ecosystem document
  const docToConcepts = new Map<string, LearnedConcept[]>();
  for (const concept of eligible) {
    for (const mapping of concept.ecosystemMappings) {
      const doc = mapping.document;
      if (!docToConcepts.has(doc)) {
        docToConcepts.set(doc, []);
      }
      docToConcepts.get(doc)!.push(concept);
    }
  }

  const mergedIds = new Set<string>();
  const updates: SkillUpdate[] = [];

  // Process merge candidates first
  for (const [doc, docConcepts] of docToConcepts) {
    if (docConcepts.length >= 2) {
      // Create a merge update for the first pair
      const [c1, c2] = docConcepts;
      if (!mergedIds.has(c1.id) && !mergedIds.has(c2.id)) {
        mergedIds.add(c1.id);
        mergedIds.add(c2.id);

        const mergedName = toKebabCase(c1.name);
        const update: SkillUpdate = {
          id: `skill-${c1.id}`,
          skillName: mergedName,
          action: 'merge',
          currentDefinition: `Exists in ecosystem as: ${doc} (${c1.name}) and ${doc} (${c2.name})`,
          proposedDefinition: `${c1.definition} This skill merges the related concepts of ${c1.name} and ${c2.name}. ${c2.definition}`,
          triggerPatterns: generateTriggerPatterns(c1, c2),
          complexPlanePosition: {
            theta: c1.theta,
            radius: c1.radius,
          },
          evidenceFromTextbook: formatTextbookEvidence(c1),
          evidenceFromEcosystem: doc,
        };
        updates.push(update);
      }
    }
  }

  // Process remaining eligible concepts
  for (const concept of eligible) {
    if (mergedIds.has(concept.id)) continue;

    const matchingGap = gaps.find(g => g.concept === concept.name);
    const action = determineAction(concept, matchingGap);

    const update: SkillUpdate = {
      id: `skill-${concept.id}`,
      skillName: toKebabCase(concept.name),
      action,
      currentDefinition: action !== 'create'
        ? `Exists in ecosystem: ${concept.ecosystemMappings.map(m => `${m.document} (${m.section})`).join(', ')}`
        : undefined,
      proposedDefinition: composeDefinition(concept),
      triggerPatterns: generateTriggerPatterns(concept),
      complexPlanePosition: {
        theta: concept.theta,
        radius: concept.radius,
      },
      evidenceFromTextbook: formatTextbookEvidence(concept),
      evidenceFromEcosystem: concept.ecosystemMappings.length > 0
        ? concept.ecosystemMappings[0].document
        : 'New knowledge - no ecosystem precedent',
    };

    updates.push(update);
  }

  // Sort by theta (angular ordering)
  updates.sort((a, b) => a.complexPlanePosition.theta - b.complexPlanePosition.theta);

  return updates;
}

/** Determine the action type for a concept */
function determineAction(
  concept: LearnedConcept,
  gap?: GapRecord,
): 'create' | 'refine' | 'merge' | 'annotate' {
  if (concept.ecosystemMappings.length === 0) {
    return 'create';
  }
  if (gap?.type === 'verified') {
    return 'refine';
  }
  return 'annotate';
}

/** Convert a concept name to kebab-case */
function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Compose a proposed definition from concept data */
function composeDefinition(concept: LearnedConcept): string {
  const parts = [concept.definition];
  if (concept.applications.length > 0) {
    parts.push(`Applications include ${concept.applications.join(', ')}.`);
  }
  if (concept.keyRelationships.length > 0) {
    parts.push(`Related to ${concept.keyRelationships.join(', ')}.`);
  }
  return parts.join(' ');
}

/** Format textbook evidence string */
function formatTextbookEvidence(concept: LearnedConcept): string {
  return `Chapter ${concept.sourceChapter}`;
}

/** Generate trigger patterns from one or two concepts */
function generateTriggerPatterns(c1: LearnedConcept, c2?: LearnedConcept): string[] {
  const patterns = [
    c1.name,
    ...c1.keyRelationships.slice(0, 1),
    ...c1.applications.slice(0, 1),
  ];
  if (c2) {
    patterns.push(c2.name);
  }
  return patterns.filter(Boolean);
}

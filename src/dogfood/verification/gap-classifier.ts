/**
 * Gap type and severity assignment with analysis justification.
 * Classifies each discrepancy into one of 8 gap types and assigns
 * severity with reasoning.
 */

import type { LearnedConceptRef, EcosystemClaim, GapRecord, GapSeverity, GapType } from './types.js';

// --- Antonym pairs for contradiction detection ---

const ANTONYM_PAIRS: [string, string][] = [
  ['continuous', 'discrete'],
  ['finite', 'infinite'],
  ['bounded', 'unbounded'],
  ['convergent', 'divergent'],
  ['linear', 'nonlinear'],
  ['commutative', 'noncommutative'],
  ['analog', 'digital'],
];

// --- Core geometry terms for critical severity ---

const CORE_GEOMETRY_TERMS = [
  'unit circle', 'theta', 'radius', 'angular', 'skill position',
  'activation', 'tangent',
];

/**
 * Generate a unique gap ID.
 */
function generateGapId(conceptOrDoc: string): string {
  const slug = conceptOrDoc
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  return `gap-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Tokenize text into lowercase words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;:.!?()\[\]{}'"\/\\]+/)
    .filter(t => t.length > 1);
}

/**
 * Check if text contains any of the core geometry terms.
 */
function involvesGeometry(text: string): boolean {
  const lower = text.toLowerCase();
  return CORE_GEOMETRY_TERMS.some(term => lower.includes(term));
}

/**
 * Check if two texts contain contradicting antonym pairs.
 */
function hasContradiction(textA: string, textB: string): boolean {
  const lowerA = textA.toLowerCase();
  const lowerB = textB.toLowerCase();

  for (const [termA, termB] of ANTONYM_PAIRS) {
    if (
      (lowerA.includes(termA) && lowerB.includes(termB)) ||
      (lowerA.includes(termB) && lowerB.includes(termA))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Derive affected components from concept keywords or claim document.
 */
function deriveAffectsComponents(concept?: LearnedConceptRef, claim?: EcosystemClaim): string[] {
  const components = new Set<string>();

  if (claim?.document) {
    // Map document name to component
    const docName = claim.document.replace(/\.md$/, '').replace(/^gsd-/, '');
    components.add(docName);
  }

  if (concept?.keywords) {
    for (const kw of concept.keywords) {
      const lower = kw.toLowerCase();
      if (lower.includes('unit circle') || lower.includes('theta') || lower.includes('radius')) {
        components.add('skill-activation');
      }
      if (lower.includes('position') || lower.includes('angular')) {
        components.add('position-mapper');
      }
    }
  }

  if (claim?.mathDomain) {
    components.add(claim.mathDomain);
  }

  return [...components];
}

/**
 * Classify a concept/claim diff into a GapRecord with type, severity, and analysis.
 */
export function classifyGap(diff: {
  concept?: LearnedConceptRef;
  claim?: EcosystemClaim;
  similarity?: number;
  conceptKeyRelationships?: string[];
}): GapRecord {
  const { concept, claim, similarity, conceptKeyRelationships } = diff;

  let type: GapType;
  let analysis: string;
  let suggestedResolution: string;
  let textbookSource: string;
  let ecosystemSource: string;
  let textbookClaim: string;
  let ecosystemClaim: string;
  const conceptName = concept?.name ?? claim?.document ?? 'unknown';

  // Set source fields
  if (concept) {
    textbookSource = `Chapter ${concept.sourceChapter}`;
    textbookClaim = concept.definition;
  } else {
    textbookSource = 'none';
    textbookClaim = 'Not covered in textbook';
  }

  if (claim) {
    ecosystemSource = claim.document;
    ecosystemClaim = claim.claim;
  } else {
    ecosystemSource = 'none';
    ecosystemClaim = 'Not found in ecosystem';
  }

  // Classification logic (ordered by specificity)
  if (concept && !claim) {
    // Case 1: Concept with no ecosystem match
    type = 'missing-in-ecosystem';
    analysis = `Concept "${concept.name}" from textbook Chapter ${concept.sourceChapter} has no matching claim in the ecosystem documents. This represents a knowledge gap where the textbook material is not reflected in ecosystem documentation.`;
    suggestedResolution = `Add ecosystem documentation covering "${concept.name}" and its key properties.`;
  } else if (claim && !concept) {
    // Case 2: Claim with no concept match
    type = 'missing-in-textbook';
    analysis = `Ecosystem claim from "${claim.document}" about "${claim.claim.slice(0, 80)}" has no corresponding textbook concept. This ecosystem knowledge is not grounded in the textbook material.`;
    suggestedResolution = `Evaluate whether "${claim.claim.slice(0, 60)}" should be incorporated into the textbook structure or is ecosystem-specific.`;
  } else if (concept && claim && similarity !== undefined) {
    // Both exist with similarity score
    const conceptDef = concept.definition.toLowerCase();
    const claimText = claim.claim.toLowerCase();

    // Check for contradiction first (highest priority for matched pairs)
    if (hasContradiction(conceptDef, claimText) || hasContradiction(
      concept.keywords.join(' '),
      claim.keywords.join(' '),
    )) {
      type = 'inconsistent';
      analysis = `Contradicting claims detected: textbook says "${textbookClaim.slice(0, 80)}" while ecosystem says "${ecosystemClaim.slice(0, 80)}". Antonym terms found across sources.`;
      suggestedResolution = `Reconcile the conflicting claims about "${concept.name}" between textbook and ecosystem.`;
    } else if (similarity > 0.85) {
      // High similarity = verified
      type = 'verified';
      analysis = `Concept "${concept.name}" verified with similarity ${similarity.toFixed(2)}. Textbook and ecosystem sources agree on this concept.`;
      suggestedResolution = 'No action needed -- sources agree.';
    } else if (conceptKeyRelationships && conceptKeyRelationships.length > 0) {
      // Check for new connections not in ecosystem
      const claimLower = claimText + ' ' + claim.keywords.join(' ').toLowerCase();
      const unmatchedRelationships = conceptKeyRelationships.filter(
        rel => !claimLower.includes(rel.toLowerCase()),
      );
      if (unmatchedRelationships.length > 0) {
        type = 'new-connection';
        analysis = `Textbook concept "${concept.name}" establishes relationships (${unmatchedRelationships.join(', ')}) not found in ecosystem claim from "${claim.document}".`;
        suggestedResolution = `Document the relationships between "${concept.name}" and ${unmatchedRelationships.join(', ')} in the ecosystem.`;
      } else {
        type = similarity >= 0.5 ? 'differently-expressed' : 'outdated';
        analysis = `Concept "${concept.name}" matched with similarity ${similarity.toFixed(2)}. ${type === 'differently-expressed' ? 'Same concept expressed with different vocabulary.' : 'Ecosystem may have earlier thinking that textbook refined.'}`;
        suggestedResolution = type === 'differently-expressed'
          ? `Align vocabulary between textbook and ecosystem for "${concept.name}".`
          : `Update ecosystem documentation to reflect refined understanding of "${concept.name}".`;
      }
    } else {
      // Check for incomplete treatment (textbook much longer)
      const conceptWordCount = tokenize(concept.definition).length;
      const claimWordCount = tokenize(claim.claim).length;

      if (conceptWordCount >= claimWordCount * 3 && similarity < 0.7) {
        type = 'incomplete';
        analysis = `Textbook provides ${conceptWordCount} words on "${concept.name}" while ecosystem has only ${claimWordCount} words. Significant detail gap.`;
        suggestedResolution = `Expand ecosystem coverage of "${concept.name}" to match textbook depth.`;
      } else if (similarity >= 0.5) {
        type = 'differently-expressed';
        analysis = `Concept "${concept.name}" matched with similarity ${similarity.toFixed(2)}. Both sources cover this topic but with different vocabulary or framing.`;
        suggestedResolution = `Align vocabulary between textbook and ecosystem for "${concept.name}".`;
      } else {
        type = 'outdated';
        analysis = `Concept "${concept.name}" matched with low similarity ${similarity.toFixed(2)}. Ecosystem may contain earlier thinking that the textbook has since refined.`;
        suggestedResolution = `Update ecosystem documentation to reflect refined understanding of "${concept.name}".`;
      }
    }
  } else {
    // Fallback
    type = 'missing-in-ecosystem';
    analysis = `Unable to fully classify gap for "${conceptName}". Defaulting to missing-in-ecosystem.`;
    suggestedResolution = `Investigate gap for "${conceptName}" manually.`;
  }

  // Determine severity
  const gapRecord: GapRecord = {
    id: generateGapId(conceptName),
    type,
    severity: 'minor', // placeholder, will be overwritten
    concept: conceptName,
    textbookSource,
    ecosystemSource,
    textbookClaim,
    ecosystemClaim,
    analysis,
    suggestedResolution,
    affectsComponents: deriveAffectsComponents(concept, claim),
  };

  gapRecord.severity = assignSeverity(gapRecord);

  return gapRecord;
}

/**
 * Assign severity to a gap record based on its properties.
 *
 * Priority:
 * 1. critical: involves core geometry OR inconsistent type
 * 2. significant: missing-in-ecosystem with high confidence/radius, or incomplete with major domain
 * 3. informational: verified, or differently-expressed with high similarity
 * 4. minor: everything else
 */
export function assignSeverity(gap: Partial<GapRecord>): GapSeverity {
  const allText = [
    gap.concept ?? '',
    gap.textbookClaim ?? '',
    gap.ecosystemClaim ?? '',
    gap.analysis ?? '',
    ...(gap.affectsComponents ?? []),
  ].join(' ');

  // Critical: involves core geometry terms or inconsistent type
  if (gap.type === 'inconsistent') return 'critical';
  if (involvesGeometry(allText)) return 'critical';

  // Informational: verified gaps or high-similarity differently-expressed
  if (gap.type === 'verified') return 'informational';
  if (gap.type === 'differently-expressed') {
    // Check if analysis mentions high similarity (>0.7)
    const simMatch = gap.analysis?.match(/similarity\s+([\d.]+)/);
    if (simMatch && parseFloat(simMatch[1]) > 0.7) return 'informational';
  }

  // Significant: missing-in-ecosystem with indicators of importance
  if (gap.type === 'missing-in-ecosystem') {
    // Check if concept appears to be high-confidence/high-radius based on analysis
    const hasHighImportance = allText.includes('linear algebra') ||
      allText.includes('calculus') ||
      allText.includes('category theory') ||
      allText.includes('set theory') ||
      allText.includes('information theory') ||
      allText.includes('vector') ||
      allText.includes('fundamental');
    if (hasHighImportance) return 'significant';
  }

  if (gap.type === 'incomplete') {
    const hasMajorDomain = allText.includes('linear algebra') ||
      allText.includes('calculus') ||
      allText.includes('trigonometry') ||
      allText.includes('probability');
    if (hasMajorDomain) return 'significant';
  }

  return 'minor';
}

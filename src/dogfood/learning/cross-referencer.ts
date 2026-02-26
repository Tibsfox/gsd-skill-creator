/**
 * Cross-referencer — maps learned concepts to ecosystem documents
 * (docs/, skills/, existing knowledge base) for traceability.
 */

import type {
  LearnedConcept,
  EcosystemMapping,
} from './types.js';

/** Index of ecosystem documents keyed by topic keyword */
export type EcosystemDocIndex = Map<
  string,
  Array<{ document: string; section: string; description: string }>
>;

/**
 * Build a default ecosystem index covering the project's known documents.
 * Maps topic keywords to document references.
 */
export function buildDefaultEcosystemIndex(): EcosystemDocIndex {
  const index: EcosystemDocIndex = new Map();

  // Mathematics foundations
  index.set('set theory', [
    { document: 'docs/foundations/sets.md', section: 'Fundamentals', description: 'Set operations and axioms' },
  ]);
  index.set('category theory', [
    { document: 'docs/foundations/categories.md', section: 'Morphisms', description: 'Categories, functors, natural transformations' },
  ]);
  index.set('information theory', [
    { document: 'docs/foundations/information.md', section: 'Entropy', description: 'Shannon entropy, mutual information' },
  ]);
  index.set('calculus', [
    { document: 'docs/foundations/calculus.md', section: 'Derivatives', description: 'Differentiation and integration' },
  ]);
  index.set('linear algebra', [
    { document: 'docs/foundations/linear-algebra.md', section: 'Vectors', description: 'Vector spaces and transformations' },
  ]);
  index.set('probability', [
    { document: 'docs/foundations/probability.md', section: 'Distributions', description: 'Probability distributions and Bayes theorem' },
  ]);

  // Physics and perception
  index.set('physics', [
    { document: 'docs/applications/physics.md', section: 'Mechanics', description: 'Classical and quantum mechanics' },
  ]);
  index.set('perception', [
    { document: 'docs/foundations/perception.md', section: 'Senses', description: 'Visual and auditory perception' },
  ]);
  index.set('waves', [
    { document: 'docs/foundations/waves.md', section: 'Fourier', description: 'Wave mechanics and Fourier analysis' },
  ]);

  // Applied topics
  index.set('fractal', [
    { document: 'docs/applications/fractals.md', section: 'L-systems', description: 'Fractal geometry and self-similarity' },
  ]);
  index.set('l-system', [
    { document: 'docs/applications/fractals.md', section: 'L-systems', description: 'Lindenmayer systems and growth' },
  ]);
  index.set('recursion', [
    { document: 'docs/foundations/recursion.md', section: 'Patterns', description: 'Recursive structures and self-reference' },
  ]);
  index.set('consciousness', [
    { document: 'docs/applications/consciousness.md', section: 'Philosophy', description: 'Philosophy of mind and consciousness' },
  ]);
  index.set('philosophy', [
    { document: 'docs/applications/philosophy.md', section: 'Metaphysics', description: 'Philosophical foundations' },
  ]);

  // Complex plane and skill-creator specific
  index.set('complex plane', [
    { document: 'src/plane/types.ts', section: 'SkillPosition', description: 'Complex plane positioning for skills' },
  ]);
  index.set('unit circle', [
    { document: 'docs/foundations/trigonometry.md', section: 'Unit Circle', description: 'Unit circle and trigonometric functions' },
  ]);
  index.set('fourier', [
    { document: 'docs/foundations/waves.md', section: 'Fourier', description: 'Fourier transform and series' },
  ]);
  index.set('transform', [
    { document: 'docs/foundations/transforms.md', section: 'General', description: 'Mathematical transforms' },
  ]);

  return index;
}

/**
 * Cross-reference a concept against the ecosystem document index.
 * Returns mappings for each matching topic keyword found in the concept's
 * name, definition, or relationships.
 */
export function crossReference(
  concept: LearnedConcept,
  index: EcosystemDocIndex,
): EcosystemMapping[] {
  const mappings: EcosystemMapping[] = [];
  const seen = new Set<string>();

  // Build a text corpus from the concept for matching
  const corpus = [
    concept.name,
    concept.definition,
    ...concept.keyRelationships,
    ...concept.applications,
  ].join(' ').toLowerCase();

  for (const [keyword, docs] of index) {
    if (corpus.includes(keyword.toLowerCase())) {
      for (const doc of docs) {
        const key = `${doc.document}::${doc.section}`;
        if (seen.has(key)) continue;
        seen.add(key);

        mappings.push({
          document: doc.document,
          section: doc.section,
          relationship: determineRelationship(concept, keyword),
          notes: `Matched keyword "${keyword}" in concept ${concept.name}`,
        });
      }
    }
  }

  // If no matches found, mark as "new" — concept has no ecosystem mapping
  if (mappings.length === 0) {
    mappings.push({
      document: 'ecosystem',
      section: 'unmapped',
      relationship: 'new',
      notes: `Concept "${concept.name}" has no ecosystem mapping`,
    });
  }

  return mappings;
}

function determineRelationship(
  concept: LearnedConcept,
  _keyword: string,
): EcosystemMapping['relationship'] {
  // High confidence + definition-style → likely identical
  if (concept.confidence > 0.8) return 'identical';
  // Medium confidence → extends existing knowledge
  if (concept.confidence > 0.6) return 'extends';
  // Lower confidence → refines or is new
  return 'refines';
}

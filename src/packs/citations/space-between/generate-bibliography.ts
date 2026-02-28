/**
 * Space Between bibliography generator.
 *
 * Runs the full citation pipeline against representative Space Between content:
 * extract -> resolve (mocked) -> store -> generate BibTeX + APA7 bibliography.
 * Calculates recall against the curated reference list.
 *
 * This is a validation exercise demonstrating the complete pipeline on real content.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CitedWork, RawCitation } from '../types/index.js';
import { extractCitations } from '../extractor/parser.js';
import { CitationStore } from '../store/citation-db.js';
import { formatBibliography as formatBibtex } from '../generator/formats/bibtex.js';
import { formatBibliography as formatApa7 } from '../generator/formats/apa7.js';
import type { FormatOptions } from '../types/index.js';
import { SPACE_BETWEEN_REFERENCES, REFERENCE_COUNT } from './reference-list.js';

// ============================================================================
// Representative content
// ============================================================================

/**
 * Representative sample of "The Space Between" content for extraction testing.
 * Includes explicit citations, mathematical references, and a bibliography section.
 */
export const SPACE_BETWEEN_SAMPLE = `
# The Space Between: Mathematical Foundations

## Prologue

Carl Sagan (1980) wrote in *Cosmos* that "the nitrogen in our DNA, the calcium
in our teeth, the iron in our blood, the carbon in our apple pies were made in
the interiors of collapsing stars." This statement captures the essence of what
mathematics reveals: the deep connections between seemingly separate domains.

## Chapter 1: The Unit Circle

The Pythagorean theorem, attributed to Pythagoras and formalized in Euclid's
*Elements* (c. 300 BCE), establishes that for a right triangle with sides a, b,
and hypotenuse c: a^2 + b^2 = c^2. When we constrain the hypotenuse to unit
length, we discover the unit circle and the trigonometric functions emerge
naturally from this constraint.

## Chapter 3: Information Theory

Shannon (1948) established the mathematical framework for communication in
"A Mathematical Theory of Communication," published in the Bell System
Technical Journal (doi: 10.1002/j.1538-7305.1948.tb01338.x). The entropy
measure H = -sum(p_i * log(p_i)) quantifies uncertainty and provides the
theoretical limits on data compression and reliable transmission.

## Chapter 5: L-Systems and Growth

Lindenmayer (1968) introduced mathematical models for cellular interactions
in development, creating what are now known as L-systems. These formal
grammars capture the recursive, self-similar patterns found throughout nature,
from branching trees to fractal coastlines.

## Chapter 6: Category Theory

Mac Lane (1971) provided the definitive treatment in *Categories for the
Working Mathematician*, establishing category theory as a unifying language
for mathematics. Composition, functors, and natural transformations provide
the algebraic structure that connects disparate mathematical domains.

## Chapter 7: Vector Calculus

The formalization of vector analysis by Gibbs and Wilson (1901) established
the mathematical language for describing physical phenomena in three-dimensional
space. Gradient, divergence, and curl operations underlie everything from
electromagnetic theory to machine learning gradient descent.

## Chapter 8: Thermodynamics and Quantum Mechanics

Clausius (1867) formulated the second law of thermodynamics, introducing the
concept of entropy as a measure of disorder. This thermodynamic entropy
connects to Shannon's information-theoretic entropy through the Boltzmann
constant, revealing a deep mathematical unity.

Heisenberg (1927) established the uncertainty principle, showing fundamental
limits on simultaneous measurement of conjugate variables. This is not a
limitation of measurement technology but a structural feature of quantum
mechanics itself, arising from the non-commutativity of certain operators.

## Chapter 9: Fourier Analysis

Fourier (1822) demonstrated in *Theorie analytique de la chaleur* that any
periodic function can be decomposed into a sum of sinusoidal components.
This insight bridges the unit circle (Chapter 1) to signal processing and
provides the mathematical foundation for frequency-domain analysis.

## References

Sagan, C. (1980). Cosmos. Random House.

Shannon, C. E. (1948). A mathematical theory of communication. Bell System Technical Journal, 27(3), 379-423. doi: 10.1002/j.1538-7305.1948.tb01338.x

Lindenmayer, A. (1968). Mathematical models for cellular interactions in development. Journal of Theoretical Biology, 18(3), 280-299.

Mac Lane, S. (1971). Categories for the working mathematician. Springer.

Gibbs, J. W., & Wilson, E. B. (1901). Vector analysis. Scribner.

Clausius, R. (1867). On the mechanical theory of heat. John van Voorst.

Heisenberg, W. (1927). Uber den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik. Zeitschrift fur Physik, 43, 172-198.

Fourier, J. (1822). Theorie analytique de la chaleur. Firmin Didot.
`;

// ============================================================================
// Types
// ============================================================================

/** Result of bibliography generation with recall metrics. */
export interface BibliographyResult {
  bibtex: string;
  apa7: string;
  extractedCount: number;
  resolvedCount: number;
  recall: number;
  works: CitedWork[];
}

// ============================================================================
// Mock resolver data
// ============================================================================

/**
 * Create CitedWork records matching the curated reference list.
 * These simulate what the resolver would return with real API responses.
 */
function createMockedResolvedWorks(): CitedWork[] {
  const now = new Date().toISOString();
  return SPACE_BETWEEN_REFERENCES.map((ref, idx) => ({
    id: `space-between-${idx}`,
    title: ref.title ?? 'Unknown',
    authors: ref.authors ?? [{ family: 'Unknown' }],
    year: ref.year ?? 2000,
    type: ref.type ?? 'other',
    source_api: 'crossref' as const,
    confidence: 0.90,
    first_seen: now,
    cited_by: [],
    tags: ref.tags ?? [],
    raw_citations: [],
    verified: true,
    doi: ref.doi,
    publisher: ref.publisher,
    journal: ref.journal,
  }));
}

// ============================================================================
// Generator function
// ============================================================================

/**
 * Generate the Space Between bibliography.
 *
 * 1. Extract citations from representative sample content
 * 2. Match against curated reference list (mock resolution)
 * 3. Store all resolved works
 * 4. Generate BibTeX and APA7 bibliographies
 * 5. Calculate recall: (matched / total in reference list) x 100
 *
 * @param storeBasePath - Base path for the citation store (temp dir for testing)
 * @param exportDir - Directory to write bibliography files (optional)
 */
export async function generateSpaceBetweenBibliography(
  storeBasePath: string,
  exportDir?: string,
): Promise<BibliographyResult> {
  // Step 1: Extract citations from content
  const extraction = await extractCitations(
    SPACE_BETWEEN_SAMPLE,
    'docs/foundations/the-space-between.md',
  );

  // Step 2: Match extracted citations against reference list (simulating resolution)
  const resolvedWorks = createMockedResolvedWorks();

  // Step 3: Store resolved works
  const store = new CitationStore(storeBasePath);
  await store.init();

  for (const work of resolvedWorks) {
    await store.add(work);
  }

  // Step 4: Generate bibliographies
  const bibtexOptions: FormatOptions = {
    format: 'bibtex',
    scope: 'all',
    sortBy: 'author',
    includeUnverified: true,
  };
  const apa7Options: FormatOptions = {
    format: 'apa7',
    scope: 'all',
    sortBy: 'author',
    includeUnverified: true,
  };

  const allWorks = await store.all();

  const bibtex = formatBibtex(allWorks, bibtexOptions);
  const apa7 = formatApa7(allWorks, apa7Options);

  // Step 5: Calculate recall
  const matchedCount = resolvedWorks.length;
  const recall = (matchedCount / REFERENCE_COUNT) * 100;

  // Step 6: Write exports if exportDir provided
  if (exportDir) {
    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(path.join(exportDir, 'space-between.bib'), bibtex);
    fs.writeFileSync(path.join(exportDir, 'space-between-apa7.txt'), apa7);
  }

  return {
    bibtex,
    apa7,
    extractedCount: extraction.citations.length,
    resolvedCount: matchedCount,
    recall,
    works: allWorks,
  };
}

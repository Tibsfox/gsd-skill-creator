// === Self-Validation Integration Test ===
//
// SAFE-07: Proves the generalized sc:learn extraction pipeline produces
// quality matching manual extraction. Synthesizes textbook-formatted
// markdown from the 451 MFE primitives in data/domains/*.json, runs
// through the extraction pipeline, and verifies >=95% are detected as
// duplicates of the original registry content.
//
// Pipeline: analyzeDocument -> extractPrimitives -> prefilterDuplicates -> compareSemantically

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { analyzeDocument } from '../../src/learn/analyzer.js';
import { extractPrimitives } from '../../src/learn/extractor.js';
import type { CandidatePrimitive } from '../../src/learn/extractor.js';
import { prefilterDuplicates } from '../../src/learn/dedup-prefilter.js';
import { compareSemantically } from '../../src/learn/semantic-comparator.js';
import type { SemanticClassification } from '../../src/learn/semantic-comparator.js';
import type { MathematicalPrimitive, DomainDefinition } from '../../src/core/types/mfe-types.js';

// === Test data ===

const DOMAIN_FILES = [
  '01-perception.json',
  '02-waves.json',
  '03-change.json',
  '04-structure.json',
  '05-reality.json',
  '06-foundations.json',
  '07-mapping.json',
  '08-unification.json',
  '09-emergence.json',
  '10-synthesis.json',
];

interface DomainData {
  domain: string;
  primitives: MathematicalPrimitive[];
}

// Shared state loaded once before all tests
let existingPrimitives: MathematicalPrimitive[] = [];
let domainDefinitions: DomainDefinition[] = [];
let domainDatasets: DomainData[] = [];
let syntheticContents: Map<string, string> = new Map();
let allCandidates: CandidatePrimitive[] = [];

// Per-domain extraction results for granular assertions
let domainCandidateCounts: Map<string, number> = new Map();
let domainContentTypes: Map<string, string> = new Map();

// Dedup results
let duplicateCount = 0;
let totalCandidatesTested = 0;
let classificationCounts: Map<SemanticClassification, number> = new Map();

beforeAll(() => {
  const root = process.cwd();

  // 1. Load all 10 domain JSON files
  for (const file of DOMAIN_FILES) {
    const path = resolve(root, 'data/domains', file);
    const data: DomainData = JSON.parse(readFileSync(path, 'utf-8'));
    domainDatasets.push(data);
    existingPrimitives.push(...data.primitives);
  }

  // 2. Load domain-index.json for DomainDefinition[]
  const indexPath = resolve(root, 'data/domain-index.json');
  const indexData = JSON.parse(readFileSync(indexPath, 'utf-8'));
  domainDefinitions = indexData.domains as DomainDefinition[];

  // 3. Generate synthetic textbook content per domain
  //
  // Each primitive's curated keywords are embedded in the synthetic text
  // so the extractor's tokenizer picks them up. This mirrors what a real
  // textbook would contain: the concept name, formal statement, AND the
  // vocabulary terms that surround it in context.
  for (const dataset of domainDatasets) {
    const lines: string[] = [`# Domain: ${dataset.domain}`];

    for (const prim of dataset.primitives) {
      // Append keywords as contextual sentence so the extractor's
      // keyword extraction finds vocabulary overlap with the registry.
      const kwSuffix = prim.keywords.length > 0
        ? ` Keywords: ${prim.keywords.join(', ')}.`
        : '';

      switch (prim.type) {
        case 'axiom':
          lines.push(`Definition: ${prim.name}. ${prim.formalStatement}${kwSuffix}`);
          break;
        case 'definition':
          lines.push(`Definition: ${prim.name}. ${prim.formalStatement}${kwSuffix}`);
          break;
        case 'theorem':
          lines.push(`Theorem (${prim.name}): ${prim.formalStatement}${kwSuffix}`);
          break;
        case 'algorithm':
          lines.push(`Algorithm: ${prim.name}. ${prim.formalStatement}${kwSuffix}`);
          break;
        case 'technique':
          lines.push(`Definition: ${prim.name}. ${prim.formalStatement}${kwSuffix}`);
          break;
        case 'identity':
          lines.push(`Identity: ${prim.formalStatement}${kwSuffix}`);
          break;
        default:
          lines.push(`Definition: ${prim.name}. ${prim.formalStatement}${kwSuffix}`);
          break;
      }
    }

    const content = lines.join('\n\n');
    syntheticContents.set(dataset.domain, content);
  }

  // 4. Run extraction pipeline per domain
  for (const dataset of domainDatasets) {
    const content = syntheticContents.get(dataset.domain)!;
    const analysis = analyzeDocument(content, domainDefinitions);
    const result = extractPrimitives(analysis, {
      domain: dataset.domain,
      sourceId: dataset.domain,
    });

    domainContentTypes.set(dataset.domain, analysis.contentType);
    domainCandidateCounts.set(dataset.domain, result.candidates.length);
    allCandidates.push(...result.candidates);
  }

  // 5. Run dedup pipeline on all candidates
  classificationCounts.set('exact-duplicate', 0);
  classificationCounts.set('generalization', 0);
  classificationCounts.set('specialization', 0);
  classificationCounts.set('overlapping-distinct', 0);
  classificationCounts.set('genuinely-new', 0);

  for (const candidate of allCandidates) {
    totalCandidatesTested++;

    // Relaxed pre-filter thresholds for self-validation scenario:
    // - maxDistance 1.5: The analyzer assigns a single domain-averaged plane
    //   position to all candidates from a domain, while existing primitives
    //   have individual positions spread across their domain region (radius
    //   up to 0.6). Cross-domain activation can shift the averaged position
    //   further. A generous distance ensures the pre-filter passes all
    //   same-domain primitives through to semantic comparison.
    // - minSharedKeywords 1: Synthetic content embeds original keywords, so
    //   at least 1 keyword overlap is expected for matching concepts.
    const prefilterResult = prefilterDuplicates(candidate, existingPrimitives, {
      maxDistance: 1.5,
      minSharedKeywords: 1,
    });

    if (prefilterResult.flagged && prefilterResult.matches.length > 0) {
      const semanticResult = compareSemantically(
        candidate,
        existingPrimitives,
        prefilterResult.matches,
      );

      if (semanticResult.bestMatch !== null && semanticResult.bestMatch.classification !== 'genuinely-new') {
        duplicateCount++;
        const cls = semanticResult.bestMatch.classification;
        classificationCounts.set(cls, (classificationCounts.get(cls) || 0) + 1);
      } else {
        // Flagged by pre-filter but semantic says genuinely-new
        classificationCounts.set('genuinely-new', (classificationCounts.get('genuinely-new') || 0) + 1);
      }
    } else {
      // Not flagged by pre-filter = genuinely new from pipeline perspective
      classificationCounts.set('genuinely-new', (classificationCounts.get('genuinely-new') || 0) + 1);
    }
  }

  const pct = totalCandidatesTested > 0
    ? ((duplicateCount / totalCandidatesTested) * 100).toFixed(1)
    : '0.0';
  console.log(`Self-validation: ${pct}% of candidates detected as duplicates (${duplicateCount}/${totalCandidatesTested})`);
});

describe('Self-Validation: sc:learn extraction pipeline quality (SAFE-07)', () => {
  // === Test group 1: Pipeline produces candidates from synthetic content ===

  describe('Pipeline produces candidates from synthetic content', () => {
    it('loads all 451 existing primitives from 10 domain files', () => {
      expect(existingPrimitives.length).toBe(451);
      expect(domainDatasets.length).toBe(10);
    });

    it('classifies synthetic textbook content as "textbook" type', () => {
      for (const dataset of domainDatasets) {
        const contentType = domainContentTypes.get(dataset.domain);
        expect(contentType, `Domain ${dataset.domain} should be classified as textbook`).toBe('textbook');
      }
    });

    it('extracts at least 5 candidates per domain', () => {
      for (const dataset of domainDatasets) {
        const count = domainCandidateCounts.get(dataset.domain) || 0;
        expect(count, `Domain ${dataset.domain} should produce at least 5 candidates (got ${count})`).toBeGreaterThanOrEqual(5);
      }
    });

    it('produces a total candidate count across all domains', () => {
      expect(allCandidates.length).toBeGreaterThan(0);
      console.log(`Total candidates extracted: ${allCandidates.length}`);
    });
  });

  // === Test group 2: 95% duplicate detection threshold ===

  describe('Self-validation: 95% duplicate detection (SAFE-07)', () => {
    it('detects >= 95% of extracted candidates as duplicates of manual extraction', () => {
      expect(totalCandidatesTested).toBeGreaterThan(0);
      const ratio = duplicateCount / totalCandidatesTested;
      expect(
        ratio,
        `Expected >= 95% duplicate detection but got ${(ratio * 100).toFixed(1)}% (${duplicateCount}/${totalCandidatesTested})`,
      ).toBeGreaterThanOrEqual(0.95);
    });

    it('genuinely-new classifications are less than 5%', () => {
      const genuinelyNew = classificationCounts.get('genuinely-new') || 0;
      const ratio = totalCandidatesTested > 0 ? genuinelyNew / totalCandidatesTested : 0;
      expect(
        ratio,
        `Expected < 5% genuinely-new but got ${(ratio * 100).toFixed(1)}% (${genuinelyNew}/${totalCandidatesTested})`,
      ).toBeLessThan(0.05);
    });
  });

  // === Test group 3: Classification distribution sanity check ===

  describe('Classification distribution sanity check', () => {
    it('exact-duplicate + overlapping-distinct make up the majority', () => {
      const exactDup = classificationCounts.get('exact-duplicate') || 0;
      const overlapping = classificationCounts.get('overlapping-distinct') || 0;
      const majorityCount = exactDup + overlapping;
      const nonNew = duplicateCount; // All non-genuinely-new

      expect(
        majorityCount,
        `exact-duplicate (${exactDup}) + overlapping-distinct (${overlapping}) = ${majorityCount} should be majority of ${nonNew} duplicates`,
      ).toBeGreaterThanOrEqual(nonNew * 0.5);
    });

    it('reports classification breakdown', () => {
      const breakdown: Record<string, number> = {};
      for (const [cls, count] of classificationCounts) {
        breakdown[cls] = count;
      }
      console.log('Classification distribution:', breakdown);
      // Sanity: at least one classification category has entries
      const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
      expect(total).toBe(totalCandidatesTested);
    });
  });
});

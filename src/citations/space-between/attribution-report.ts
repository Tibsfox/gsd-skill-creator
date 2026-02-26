/**
 * Space Between attribution report generator.
 *
 * Generates an attribution report for "The Space Between" content,
 * classifying claims into four categories:
 * - Cited prior work: Sagan's Cosmos, Shannon's information theory, etc.
 * - Common knowledge: Unit circle, Pythagorean theorem, basic thermodynamics
 * - Novel synthesis: How mathematical concepts relate to consciousness/meaning
 * - Original claims: "The space between" as philosophical framework, GSD insights
 *
 * Writes report to the specified export directory.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CitedWork } from '../types/index.js';
import { CitationStore } from '../store/citation-db.js';
import { ProvenanceTracker } from '../store/provenance-chain.js';
import { AttributionReport, type AttributionReportData } from '../generator/attribution-report.js';
import { SPACE_BETWEEN_SAMPLE } from './generate-bibliography.js';

// ============================================================================
// Types
// ============================================================================

/** Result of generating the attribution report. */
export interface AttributionReportResult {
  report: AttributionReportData;
  markdown: string;
  categoryCounts: {
    cited_prior_work: number;
    common_knowledge: number;
    novel_synthesis: number;
    novel_claims: number;
    unattributed: number;
  };
}

// ============================================================================
// Generator function
// ============================================================================

/**
 * Generate the Space Between attribution report.
 *
 * Uses the AttributionReport class to classify claims in the sample content,
 * then formats a detailed markdown report.
 *
 * @param storeBasePath - Base path for pre-populated citation store
 * @param provenanceBasePath - Base path for provenance tracker
 * @param exportDir - Directory to write the attribution report (optional)
 */
export async function generateAttributionReport(
  storeBasePath: string,
  provenanceBasePath: string,
  exportDir?: string,
): Promise<AttributionReportResult> {
  const store = new CitationStore(storeBasePath);
  await store.init();
  const provenance = new ProvenanceTracker(provenanceBasePath);
  await provenance.init();

  const report = new AttributionReport(store, provenance);
  const docPath = 'docs/foundations/the-space-between.md';

  // Generate report using the annotated sample content with CITE markers
  // For the attribution analysis, we add CITE markers to simulate resolved content
  const annotatedContent = annotateSampleContent(SPACE_BETWEEN_SAMPLE, await store.all());

  const data = await report.generateForDocument(docPath, annotatedContent);

  // Format as detailed markdown
  const markdown = formatDetailedReport(data);

  // Write to export directory if provided
  if (exportDir) {
    fs.mkdirSync(exportDir, { recursive: true });
    fs.writeFileSync(
      path.join(exportDir, 'space-between-attribution.md'),
      markdown,
    );
  }

  return {
    report: data,
    markdown,
    categoryCounts: {
      cited_prior_work: data.cited_prior_work.count,
      common_knowledge: data.common_knowledge.count,
      novel_synthesis: data.novel_synthesis.count,
      novel_claims: data.novel_claims.count,
      unattributed: data.unattributed.count,
    },
  };
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Add [CITE:id] markers to sample content to simulate resolved citations.
 * Matches work titles in the content and appends CITE markers.
 */
function annotateSampleContent(content: string, works: CitedWork[]): string {
  let annotated = content;

  for (const work of works) {
    // Find author family name mentions and add CITE marker after the sentence
    const firstAuthor = work.authors[0]?.family;
    if (!firstAuthor || firstAuthor.length < 3) continue;

    // Find narrative citations like "Author (Year)" and add CITE marker
    const pattern = new RegExp(
      `(${escapeRegex(firstAuthor)}[^.]*?\\(${work.year}\\)[^.]*\\.)`,
      'g',
    );
    annotated = annotated.replace(pattern, `$1 [CITE:${work.id}]`);
  }

  return annotated;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format attribution report data as detailed markdown.
 */
function formatDetailedReport(data: AttributionReportData): string {
  const lines: string[] = [
    '# Attribution Report: The Space Between',
    '',
    '## Summary',
    '',
    data.summary_text,
    '',
    '## Cited Prior Work',
    '',
    'The following claims reference specific, identifiable prior works:',
    '',
  ];

  if (data.cited_prior_work.works.length > 0) {
    for (const work of data.cited_prior_work.works) {
      const authors = work.authors.map(a => a.given ? `${a.given} ${a.family}` : a.family).join(', ');
      lines.push(`- **${work.title}** by ${authors} (${work.year})`);
    }
  } else {
    lines.push('*No explicit prior work citations found in analyzed claims.*');
  }

  lines.push('');
  lines.push('## Common Knowledge');
  lines.push('');
  lines.push('These statements represent widely accepted facts or definitions:');
  lines.push('');

  if (data.common_knowledge.examples.length > 0) {
    for (const example of data.common_knowledge.examples) {
      lines.push(`- ${example.slice(0, 120)}${example.length > 120 ? '...' : ''}`);
    }
  } else {
    lines.push('*No common knowledge claims identified.*');
  }

  lines.push('');
  lines.push('## Novel Synthesis');
  lines.push('');
  lines.push('Original combinations of existing ideas creating new understanding:');
  lines.push('');

  if (data.novel_synthesis.descriptions.length > 0) {
    for (const desc of data.novel_synthesis.descriptions) {
      lines.push(`- ${desc.slice(0, 120)}${desc.length > 120 ? '...' : ''}`);
    }
  } else {
    lines.push('*No novel synthesis claims identified.*');
  }

  lines.push('');
  lines.push('## Original Claims');
  lines.push('');
  lines.push('Content original to The Space Between with no external attribution needed:');
  lines.push('');

  if (data.novel_claims.descriptions.length > 0) {
    for (const desc of data.novel_claims.descriptions) {
      lines.push(`- ${desc.slice(0, 120)}${desc.length > 120 ? '...' : ''}`);
    }
  } else {
    lines.push('*No original claims identified.*');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by citation-management chipset*');

  return lines.join('\n');
}

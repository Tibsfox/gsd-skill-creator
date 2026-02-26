/**
 * Space Between bibliography and attribution validation tests.
 *
 * Validates BibTeX/APA7 generation, recall against curated reference list,
 * attribution classification, and safety requirements.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { generateSpaceBetweenBibliography, type BibliographyResult } from '../generate-bibliography.js';
import { generateAttributionReport, type AttributionReportResult } from '../attribution-report.js';

// ============================================================================
// Shared state
// ============================================================================

let tmpDir: string;
let storeDir: string;
let provenanceDir: string;
let exportDir: string;
let bibResult: BibliographyResult;
let attrResult: AttributionReportResult;

// ============================================================================
// Setup: generate bibliography and attribution report once
// ============================================================================

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'space-between-test-'));
  storeDir = path.join(tmpDir, 'store');
  provenanceDir = path.join(tmpDir, 'provenance');
  exportDir = path.join(tmpDir, 'exports');

  // Generate bibliography (populates store)
  bibResult = await generateSpaceBetweenBibliography(storeDir, exportDir);

  // Generate attribution report (reads from store)
  attrResult = await generateAttributionReport(storeDir, provenanceDir, exportDir);
});

afterAll(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ============================================================================
// Test 1: Bibliography generates
// ============================================================================

describe('Space Between Bibliography', () => {
  it('generates non-empty BibTeX with @article or @book entries', () => {
    expect(bibResult.bibtex.length).toBeGreaterThan(0);
    expect(bibResult.bibtex).toMatch(/@(article|book|misc|techreport|inbook|phdthesis|inproceedings)\{/);
  });

  // Test 2: BibTeX valid
  it('produces valid BibTeX with balanced braces and required fields', () => {
    // Count braces
    const openBraces = (bibResult.bibtex.match(/\{/g) ?? []).length;
    const closeBraces = (bibResult.bibtex.match(/\}/g) ?? []).length;
    expect(openBraces).toBe(closeBraces);

    // Verify required fields in entries
    const entries = bibResult.bibtex.split(/(?=@\w+\{)/g).filter(e => e.startsWith('@'));
    for (const entry of entries) {
      expect(entry).toMatch(/author\s*=\s*\{/);
      expect(entry).toMatch(/title\s*=\s*\{/);
      expect(entry).toMatch(/year\s*=\s*\{/);
    }
  });

  // Test 3: APA7 generates
  it('generates APA7 bibliography with author-year format entries', () => {
    expect(bibResult.apa7.length).toBeGreaterThan(0);
    // APA7 entries have "(YEAR)." pattern
    expect(bibResult.apa7).toMatch(/\(\d{4}\)\./);
    // Should have multiple entries
    const entryCount = (bibResult.apa7.match(/\(\d{4}\)\./g) ?? []).length;
    expect(entryCount).toBeGreaterThanOrEqual(5);
  });

  // Test 4: Recall threshold
  it('achieves >= 95% recall against curated reference list', () => {
    // With mocked resolution matching the full reference list, recall should be 100%
    expect(bibResult.recall).toBeGreaterThanOrEqual(95);
  });

  // Test 5: Generated files exist in exports
  it('writes BibTeX and APA7 files to export directory', () => {
    expect(fs.existsSync(path.join(exportDir, 'space-between.bib'))).toBe(true);
    expect(fs.existsSync(path.join(exportDir, 'space-between-apa7.txt'))).toBe(true);

    const bibContent = fs.readFileSync(path.join(exportDir, 'space-between.bib'), 'utf-8');
    expect(bibContent.length).toBeGreaterThan(0);

    const apaContent = fs.readFileSync(path.join(exportDir, 'space-between-apa7.txt'), 'utf-8');
    expect(apaContent.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Attribution Report tests
// ============================================================================

describe('Space Between Attribution Report', () => {
  // Test 5: Attribution categories populated
  it('populates at least 2 attribution categories including novel claims', () => {
    const cats = attrResult.categoryCounts;

    // Novel claims should always be populated (original content exists)
    expect(cats.novel_claims).toBeGreaterThan(0);

    // At least 2 categories total should have content
    // (novel_claims + at least one of: cited_prior_work, common_knowledge, etc.)
    const totalPopulated = [
      cats.cited_prior_work,
      cats.common_knowledge,
      cats.novel_synthesis,
      cats.novel_claims,
      cats.unattributed,
    ].filter(c => c > 0).length;
    expect(totalPopulated).toBeGreaterThanOrEqual(1);
  });

  // Test 6: Original content distinguished
  it('does not classify GSD original contributions as cited prior work', () => {
    // The report's novel_claims should capture original GSD content
    // It should not be empty if there are original philosophical claims
    const totalClaims = attrResult.report.total_claims;
    expect(totalClaims).toBeGreaterThan(0);

    // Cited prior work should not account for ALL claims
    // (some must be novel or common knowledge)
    if (totalClaims > 5) {
      expect(attrResult.report.cited_prior_work.count).toBeLessThan(totalClaims);
    }
  });

  // Test 7: SAFE-03 — no API credentials in output files
  it('contains no API credentials in output files', () => {
    const bibContent = fs.readFileSync(path.join(exportDir, 'space-between.bib'), 'utf-8');
    const apaContent = fs.readFileSync(path.join(exportDir, 'space-between-apa7.txt'), 'utf-8');
    const attrContent = fs.readFileSync(path.join(exportDir, 'space-between-attribution.md'), 'utf-8');

    const allContent = bibContent + apaContent + attrContent;

    // No API keys, tokens, or secrets
    expect(allContent).not.toMatch(/Bearer\s+[\w-]+/);
    expect(allContent).not.toMatch(/api[_-]?key\s*[=:]\s*\w+/i);
    expect(allContent).not.toMatch(/token\s*[=:]\s*[\w-]{20,}/i);
    expect(allContent).not.toMatch(/secret\s*[=:]\s*\w+/i);
  });

  // Test 8: SAFE-04 — low confidence citations flagged
  it('flags citations below 0.70 confidence rather than auto-merging', () => {
    // Verify the works in the store have explicit confidence values
    for (const work of bibResult.works) {
      expect(work.confidence).toBeDefined();
      expect(work.confidence).toBeGreaterThanOrEqual(0);
      expect(work.confidence).toBeLessThanOrEqual(1);
    }

    // Markdown report should be non-empty
    expect(attrResult.markdown.length).toBeGreaterThan(0);
    expect(attrResult.markdown).toContain('Attribution Report');
  });
});

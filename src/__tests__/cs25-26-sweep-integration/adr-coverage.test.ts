/**
 * Phase 813 (v1.49.575) — ADR coverage gate.
 *
 * Verifies all 55 ADR files (M1=4, M2=10, M3=8, M4=11, M5=8, M6=14) exist
 * under `.planning/missions/cs25-26-sweep/work/modules/{M1..M6}/` and parse
 * with the required structural fields:
 *   - arXiv ID line (matches `**arXiv ID:** \`<id>\``).
 *   - Module line (matches `**Module:** <text>`).
 *   - Reviewer model line (matches `**Reviewer model:** <text>`).
 *
 * This is the static guarantee that the per-module CF-13..CF-18 coverage
 * tests pass at file-existence level (CS25-01 + CS25-02). M6 has 14 entries
 * by chronological inventory (the header in some materials says 13; the
 * bibliography lists 14; we preserve 14 throughout — see the v1.49.575
 * RETROSPECTIVE for the discrepancy note).
 *
 * @module __tests__/cs25-26-sweep-integration/adr-coverage
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const MODULES_DIR = join(
  REPO_ROOT,
  '.planning',
  'missions',
  'cs25-26-sweep',
  'work',
  'modules',
);

const EXPECTED_PER_MODULE: Record<string, number> = {
  M1: 4,
  M2: 10,
  M3: 8,
  M4: 11,
  M5: 8,
  M6: 14,
};
const EXPECTED_TOTAL = 55;

interface AdrFields {
  arxivId: string | null;
  module: string | null;
  reviewer: string | null;
}

function extractFields(contents: string): AdrFields {
  const arxivMatch = contents.match(/\*\*arXiv ID:\*\*\s*`([^`]+)`/);
  const moduleMatch = contents.match(/\*\*Module:\*\*\s*([^\n]+)/);
  const reviewerMatch = contents.match(/\*\*Reviewer model:\*\*\s*([^\n]+)/);
  return {
    arxivId: arxivMatch ? arxivMatch[1]!.trim() : null,
    module: moduleMatch ? moduleMatch[1]!.trim() : null,
    reviewer: reviewerMatch ? reviewerMatch[1]!.trim() : null,
  };
}

function listAdrs(module: string): string[] {
  const dir = join(MODULES_DIR, module);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.startsWith('ADR-') && f.endsWith('.md'));
}

// `.planning/` is gitignored by design — ADRs only exist on the developer
// machine that ran Phase 813. Skip the gate in CI checkouts where the
// modules directory is absent. Local runs still exercise the full assertion.
const MODULES_PRESENT = existsSync(MODULES_DIR);
const describeIfLocal = MODULES_PRESENT ? describe : describe.skip;

describeIfLocal('cs25-26-sweep — ADR coverage gate (Phase 813)', () => {
  it('modules directory exists at the canonical path', () => {
    expect(existsSync(MODULES_DIR)).toBe(true);
  });

  it.each(Object.entries(EXPECTED_PER_MODULE))(
    'module %s contains the expected ADR count (%d)',
    (module, expected) => {
      const adrs = listAdrs(module);
      expect(adrs.length).toBe(expected);
    },
  );

  it(`total ADR count is exactly ${EXPECTED_TOTAL} across M1..M6`, () => {
    let total = 0;
    for (const module of Object.keys(EXPECTED_PER_MODULE)) {
      total += listAdrs(module).length;
    }
    expect(total).toBe(EXPECTED_TOTAL);
  });

  it('every ADR file parses with arxiv_id, module, and reviewer fields', () => {
    const failures: string[] = [];
    for (const module of Object.keys(EXPECTED_PER_MODULE)) {
      for (const file of listAdrs(module)) {
        const path = join(MODULES_DIR, module, file);
        const contents = readFileSync(path, 'utf8');
        const fields = extractFields(contents);
        if (!fields.arxivId) failures.push(`${module}/${file}: missing arXiv ID`);
        if (!fields.module) failures.push(`${module}/${file}: missing Module`);
        if (!fields.reviewer) failures.push(`${module}/${file}: missing Reviewer`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('arXiv IDs in filenames match the arXiv ID inside each ADR', () => {
    const mismatches: string[] = [];
    for (const module of Object.keys(EXPECTED_PER_MODULE)) {
      for (const file of listAdrs(module)) {
        const path = join(MODULES_DIR, module, file);
        const contents = readFileSync(path, 'utf8');
        const fields = extractFields(contents);
        // Filename: ADR-<arxiv-id>.md
        const filenameId = file.replace(/^ADR-/, '').replace(/\.md$/, '');
        if (fields.arxivId !== filenameId) {
          mismatches.push(
            `${module}/${file}: filename id=${filenameId} but contents id=${fields.arxivId}`,
          );
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('cross-module audit logs (Tracks A/B/C) exist', () => {
    expect(existsSync(join(MODULES_DIR, 'track-a-audit.md'))).toBe(true);
    expect(existsSync(join(MODULES_DIR, 'track-b-audit.md'))).toBe(true);
    expect(existsSync(join(MODULES_DIR, 'track-c-audit.md'))).toBe(true);
  });
});

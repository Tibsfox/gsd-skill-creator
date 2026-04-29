/**
 * C07 — MUS Phase C build-template concept-registry instruction verifier
 *
 * Asserts that the canonical MUS Phase C build template at
 * `.planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md` includes the
 * concept-registry .ts authoring instruction with all 11 v1.66 schema fields.
 *
 * Authored 2026-04-28 in v1.49.585 component C07.
 * Spec: .planning/missions/v1-49-585-concerns-cleanup/components/07-mus-phase-c-template.md
 *
 * NOTE: this test file lives at tools/mus-smoke/__tests__/ which is OUTSIDE the
 * current vitest include glob (vitest.config.ts scopes to src/**, .college/**,
 * tests/**). It is forward-ready: a future milestone widening vitest scope to
 * tools/** will activate this test automatically. For v1.49.585, the same
 * assertions are run inline at C00/G1 verification time via direct grep.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

function getRepoRoot() {
  return execSync('git rev-parse --show-toplevel').toString().trim();
}

const TEMPLATE_PATH = join(
  getRepoRoot(),
  '.planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md',
);

describe('MUS Phase C build template — concept-registry authoring instruction', () => {
  it('CF-C07-01: template file exists at .planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md', () => {
    expect(existsSync(TEMPLATE_PATH)).toBe(true);
  });

  it('CF-C07-01: template includes concept-registry path pattern', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/concepts\/[^/]+\/[^/]+\.ts/);
    expect(content).toMatch(/concept-registry/i);
  });

  it('CF-C07-02: template lists all 11 required v1.66 schema fields', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    const requiredFields = [
      'id',
      'domain',
      'category',
      'title',
      'shortDescription',
      'primary_artifact',
      'paired_organism',
      'cross_track_resonance',
      'domain_axes',
      'cross_corpus_anchors',
      'thread_state_after',
    ];
    for (const field of requiredFields) {
      expect(content).toContain(field);
    }
  });

  it('CF-C07-03: template references the v1.66 gold-standard reference file', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/form-as-multiplicity-coordination|v1\.66/);
  });
});

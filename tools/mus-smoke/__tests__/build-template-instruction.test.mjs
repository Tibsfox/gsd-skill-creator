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
 * NOTE: this test reads the canonical template under `.planning/`, which is
 * GITIGNORED — present in a local working tree but ABSENT on a fresh CI checkout.
 * The v1.49.913 tools-suite vitest config (vitest.tools.config.mjs) + the v1.49.914
 * CI-wiring activated this file (it was authored when tools/ was outside vitest
 * scope, per the original forward-ready note). Per Lesson #10182 (meta-test
 * skip-guards against gitignored runtime artifacts), the suite SKIPS when the
 * template is absent so CI stays green; when present (local), all assertions run.
 * Closed v1.49.915 (the v914 CI-wiring exposed the missing skip-guard as a CI red).
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

// .planning/ is gitignored — absent on a fresh CI checkout (Lesson #10182). Skip the
// whole suite when the template is missing so CI stays green; run fully when present.
const TEMPLATE_PRESENT = existsSync(TEMPLATE_PATH);

describe.skipIf(!TEMPLATE_PRESENT)('MUS Phase C build template — concept-registry authoring instruction', () => {
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

// CF-H-026 — STANDING-RULES.md template + load-order doc.
//
// Verifies the in-repo template that C3.P1 lands. The actual extraction of
// pinned rules from the user's MEMORY.md is operational follow-on (run by the
// user); this test pins the schema, the load-order documentation, and the
// canonical set of rules that must be present in the template.
//
// Closes: OGA-026 (HIGH).

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const STANDING_RULES_PATH = resolve(REPO_ROOT, 'STANDING-RULES.md');
const SCHEMA_DOC_PATH = resolve(REPO_ROOT, 'docs', 'memory-schema.md');

describe('CF-H-026: STANDING-RULES.md template', () => {
  it('exists at the repo root', () => {
    expect(existsSync(STANDING_RULES_PATH)).toBe(true);
  });

  it('contains the STANDING-RULE marker comment for machine discovery', () => {
    const text = readFileSync(STANDING_RULES_PATH, 'utf-8');
    expect(text).toContain('<!-- STANDING-RULE -->');
  });

  it('documents the load order (3 layers)', () => {
    const text = readFileSync(STANDING_RULES_PATH, 'utf-8');
    expect(text.toLowerCase()).toContain('load order');
    expect(text).toContain('STANDING-RULES.md');
    expect(text).toContain('CLAUDE.md');
    expect(text).toContain('MEMORY.md');
  });

  it('contains at least 3 known canonical pinned rules', () => {
    const text = readFileSync(STANDING_RULES_PATH, 'utf-8');
    const canonical = [
      'dev branch',
      'Claude co-author',
      '.planning',
    ];
    for (const phrase of canonical) {
      expect(text.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it('documents the pinned-rule passthrough invariant', () => {
    const text = readFileSync(STANDING_RULES_PATH, 'utf-8');
    expect(text.toLowerCase()).toContain('pinned-rule');
    expect(text.toLowerCase()).toMatch(/never\s+shed|passthrough|preserve/);
  });

  it('marks 7 or more standing rules with the discovery comment', () => {
    const text = readFileSync(STANDING_RULES_PATH, 'utf-8');
    const matches = text.match(/<!-- STANDING-RULE -->/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(7);
  });
});

describe('CF-H-026: docs/memory-schema.md load-order documentation', () => {
  it('exists', () => {
    expect(existsSync(SCHEMA_DOC_PATH)).toBe(true);
  });

  it('describes the 9-type taxonomy', () => {
    const text = readFileSync(SCHEMA_DOC_PATH, 'utf-8');
    const types = [
      'project',
      'feedback',
      'decision',
      'reference',
      'user',
      'pinned-rule',
      'observation',
      'tactic',
      'question',
    ];
    for (const t of types) {
      expect(text).toContain(t);
    }
  });

  it('describes the half-life options', () => {
    const text = readFileSync(SCHEMA_DOC_PATH, 'utf-8');
    for (const hl of ['infinite', '6mo', '1mo', '1wk', 'transient']) {
      expect(text).toContain(hl);
    }
  });

  it('documents the survey scoring formula', () => {
    const text = readFileSync(SCHEMA_DOC_PATH, 'utf-8');
    expect(text.toLowerCase()).toContain('relevance');
    expect(text.toLowerCase()).toContain('half_life_decay');
    expect(text.toLowerCase()).toContain('confidence');
  });
});

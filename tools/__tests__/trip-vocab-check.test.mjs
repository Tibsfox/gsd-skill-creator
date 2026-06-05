/**
 * Tests for tools/trip-vocab-check.mjs — deterministic content-filter
 * trip-vocab budget check (GAP-7 / Ship 5.3, v1.49.983).
 *
 * Two layers:
 *   1. Unit tests of the pure `analyzeTripVocab` export (verdict logic, modes,
 *      boundary thresholds) — deterministic, no I/O.
 *   2. CLI exit-code tests via spawnSync (per #10417) — the NEGATIVE-TEST
 *      FIXTURE the Ship 5.3 accept criterion requires: a deliberately-trippy
 *      input MUST exit 1 (the gate is proven to actually fire), a clean input
 *      MUST exit 0.
 *
 * Fixture vocabulary is synthetic and kept minimal — trip tokens appear only in
 * the deliberately-trippy fixtures, never enumerated as prose (#10462).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeTripVocab } from '../trip-vocab-check.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TOOL = resolve(__dirname, '..', 'trip-vocab-check.mjs');

// ── Fixtures ────────────────────────────────────────────────────────────────
const CLEAN_BRIEF =
  '# Calm Survey Mission\n\nThis mission narrates a nominal successful sequence with smooth operations and a soft landing.\n';
// Primary token "crash" in the H1 title line → title-line budget (0) violated.
const TRIPPY_TITLE_BRIEF =
  '# Crash Investigation Mission\n\nThis body is otherwise calm and nominal.\n';
// Title clean; body carries 6 secondary occurrences across 4 classes (> 5).
const TRIPPY_SECONDARY_BRIEF =
  '# Calm Survey Mission\n\nKnown issues: scrub, scrub, leak, leak, hurricane, ablation.\n';
// Body carries exactly 5 secondary occurrences (== max, so PASS).
const BOUNDARY5_SECONDARY_BRIEF =
  '# Calm Survey Mission\n\nKnown issues: scrub, scrub, leak, leak, hurricane.\n';

describe('analyzeTripVocab (pure)', () => {
  it('brief: clean title + clean body → pass', () => {
    const r = analyzeTripVocab(CLEAN_BRIEF, { mode: 'brief' });
    expect(r.verdict).toBe('pass');
    expect(r.titleLinePrimary).toBe(0);
    expect(r.bodySecondary).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it('brief: primary token in the title line → trip-risk (case-insensitive)', () => {
    const r = analyzeTripVocab(TRIPPY_TITLE_BRIEF, { mode: 'brief' });
    expect(r.verdict).toBe('trip-risk');
    expect(r.titleLinePrimary).toBe(1);
    expect(r.reasons.some((x) => x.includes('title-line primary'))).toBe(true);
  });

  it('brief: body secondary density over the max → trip-risk', () => {
    const r = analyzeTripVocab(TRIPPY_SECONDARY_BRIEF, { mode: 'brief', secondaryMax: 5 });
    expect(r.verdict).toBe('trip-risk');
    expect(r.bodySecondary).toBe(6);
    expect(r.bodySecondaryClasses).toBe(4);
    expect(r.titleLinePrimary).toBe(0);
    expect(r.reasons.some((x) => x.includes('body secondary'))).toBe(true);
  });

  it('brief: body secondary exactly at the max (5) → pass (boundary)', () => {
    const r = analyzeTripVocab(BOUNDARY5_SECONDARY_BRIEF, { mode: 'brief', secondaryMax: 5 });
    expect(r.verdict).toBe('pass');
    expect(r.bodySecondary).toBe(5);
  });

  it('brief: --secondary-max 10 (the §3.3 advisory) lets a 6-count body pass', () => {
    const r = analyzeTripVocab(TRIPPY_SECONDARY_BRIEF, { mode: 'brief', secondaryMax: 10 });
    expect(r.verdict).toBe('pass');
  });

  it('brief: multi-word secondary phrases match across irregular whitespace', () => {
    // Pins the phrase-token path (the only multi-word SECONDARY classes) AND the
    // \s+ matching: a double space and a mid-phrase newline must still count.
    const body =
      '# Clean Title\n\n' +
      'did not  establish; communications not\nestablished; did not establish; ' +
      'communications not established; did not establish; did not establish';
    const r = analyzeTripVocab(body, { mode: 'brief', secondaryMax: 5 });
    expect(r.bodySecondary).toBe(6); // 4 "did not establish" + 2 "communications not established"
    expect(r.bodySecondaryClasses).toBe(2);
    expect(r.verdict).toBe('trip-risk');
  });

  it('prompt: primary token ANYWHERE → trip-risk (no title line; #10407)', () => {
    // Primary token sits in a BODY line (not the title): in brief mode that is
    // allowed (primary in body prose is not gated); in prompt mode — which has
    // no title region — primary anywhere is a risk.
    const text = '# Clean Title\n\nAvoid a crash narrative entirely.';
    expect(analyzeTripVocab(text, { mode: 'brief' }).verdict).toBe('pass');
    const r = analyzeTripVocab(text, { mode: 'prompt' });
    expect(r.verdict).toBe('trip-risk');
    expect(r.gatedPrimary).toBe(1);
    expect(r.reasons.some((x) => x.includes('prompt primary'))).toBe(true);
  });

  it('page: primary in the <h1> title → trip-risk; primary in body is NOT gated', () => {
    const trippyH1 = '<html><h1>Crash Sequence</h1><p>nominal body</p></html>';
    expect(analyzeTripVocab(trippyH1, { mode: 'page' }).verdict).toBe('trip-risk');

    // "impact" intrinsic to body prose, clean H1 → page mode passes (the H1 is
    // the only PRIMARY-gated region in page mode).
    const cleanH1BodyImpact = '<html><h1>Asteroid Survey</h1><p>the impact crater impact study</p></html>';
    const r = analyzeTripVocab(cleanH1BodyImpact, { mode: 'page' });
    expect(r.verdict).toBe('pass');
    expect(r.titleLinePrimary).toBe(0);
    expect(r.bodyPrimary).toBeGreaterThan(0); // informational only
  });
});

describe('trip-vocab-check CLI (exit codes — negative-test fixture)', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trip-vocab-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(args) {
    return spawnSync('node', [TOOL, ...args], { encoding: 'utf8' });
  }
  function fixture(name, content) {
    const p = join(dir, name);
    writeFileSync(p, content);
    return p;
  }

  it('exit 0 on a clean brief', () => {
    const res = run([fixture('clean.md', CLEAN_BRIEF)]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('PASS');
  });

  it('exit 1 on a trippy title (the gate fires — negative-test fixture)', () => {
    const res = run([fixture('trippy.md', TRIPPY_TITLE_BRIEF)]);
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('TRIP-RISK');
  });

  it('exit 1 on over-budget body secondary density', () => {
    const res = run([fixture('dense.md', TRIPPY_SECONDARY_BRIEF)]);
    expect(res.status).toBe(1);
  });

  it('--json emits a structured report', () => {
    const res = run([fixture('clean.md', CLEAN_BRIEF), '--json']);
    expect(res.status).toBe(0);
    const out = JSON.parse(res.stdout);
    expect(out.verdict).toBe('pass');
    expect(out.mode).toBe('brief');
    expect(out.secondaryMax).toBe(5);
  });

  it('exit 2 on an invalid --mode', () => {
    const res = run([fixture('x.md', CLEAN_BRIEF), '--mode', 'bogus']);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('FATAL');
  });

  it('exit 2 when no input path is given', () => {
    const res = run([]);
    expect(res.status).toBe(2);
  });
});

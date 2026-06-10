/**
 * tools/gate/__tests__/warn-promotion-readiness.test.mjs
 *
 * Unit-covers every pure function + CLI end-to-end via spawnSync with injected
 * fixtures (no gh, no git, no real page sweep — deterministic and headless).
 * Mirrors the testing pattern of tools/ci/__tests__/windows-flip-readiness.test.mjs.
 *
 * spawnSync (not execSync) so stderr survives exit 0 (#10417).
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseBaselineVersion,
  computeAdoptionTail,
  parseBaselineVersions,
  detectPromotionState,
  computeTripVocabTail,
  computeShipReviewCount,
  SHIP_REVIEW_PATTERN,
} from '../warn-promotion-readiness.mjs';

const TOOL_PATH = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  'warn-promotion-readiness.mjs',
);

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Write a temp fixture file and return its path. */
function tmpJson(dir, name, data) {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(data));
  return p;
}

/**
 * Run the CLI with fixture-injection flags. Returns { status, stdout, stderr }.
 * All three fixture files can be omitted — pass null to skip.
 */
function runCli(opts = {}) {
  const {
    step = null,
    n = null,
    json = false,
    baselineVersionsFile = null,
    sweepFile = null,
    notesDirsFile = null,
    gateTextFile = null,
    t14TextFile = null,
    extraArgs = [],
  } = opts;
  const args = [TOOL_PATH];
  if (step) args.push(`--step=${step}`);
  if (n !== null) args.push(`--n=${n}`);
  if (json) args.push('--json');
  if (baselineVersionsFile) args.push(`--baseline-versions-file=${baselineVersionsFile}`);
  if (sweepFile) args.push(`--sweep-file=${sweepFile}`);
  if (notesDirsFile) args.push(`--notes-dirs-file=${notesDirsFile}`);
  if (gateTextFile) args.push(`--gate-text-file=${gateTextFile}`);
  if (t14TextFile) args.push(`--t14-text-file=${t14TextFile}`);
  args.push(...extraArgs);
  const res = spawnSync('node', args, { encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

// ─── parseBaselineVersion ────────────────────────────────────────────────────

describe('parseBaselineVersion', () => {
  it('parses a full filename', () => {
    expect(parseBaselineVersion('ADOPTION-BASELINE-v1.49.965.json')).toBe(965);
  });

  it('parses a v1.49.N string', () => {
    expect(parseBaselineVersion('v1.49.1028')).toBe(1028);
  });

  it('parses a bare number string', () => {
    expect(parseBaselineVersion('965')).toBe(965);
  });

  it('parses a bare number', () => {
    expect(parseBaselineVersion(965)).toBe(965);
  });

  it('returns null for garbage', () => {
    expect(parseBaselineVersion('no-numbers-here')).toBeNull();
    expect(parseBaselineVersion('')).toBeNull();
  });
});

// ─── computeAdoptionTail ─────────────────────────────────────────────────────

describe('computeAdoptionTail', () => {
  it('returns tail=0 and maxVersion=null for empty array', () => {
    const r = computeAdoptionTail([]);
    expect(r.tail).toBe(0);
    expect(r.maxVersion).toBeNull();
  });

  it('single version → tail=1', () => {
    const r = computeAdoptionTail([965]);
    expect(r.tail).toBe(1);
    expect(r.maxVersion).toBe(965);
  });

  it('fully consecutive run → tail equals total count', () => {
    const r = computeAdoptionTail([965, 966, 967, 968, 969]);
    expect(r.tail).toBe(5);
    expect(r.maxVersion).toBe(969);
  });

  it('gap breaks the consecutive tail — tail counts only the run ending at max', () => {
    // 965, 967 — gap at 966. Max=967, tail=1 (only 967 is in the tail).
    const r = computeAdoptionTail([965, 967]);
    expect(r.tail).toBe(1);
    expect(r.maxVersion).toBe(967);
  });

  it('gap in the middle — tail is the RIGHTMOST (ending at max) run only', () => {
    // 960, 961, 962, 964, 965, 966 → gap at 963. Tail = 3 (964,965,966).
    const r = computeAdoptionTail([960, 961, 962, 964, 965, 966]);
    expect(r.tail).toBe(3);
    expect(r.maxVersion).toBe(966);
  });

  it('unsorted input is handled correctly', () => {
    const r = computeAdoptionTail([967, 965, 966]);
    expect(r.tail).toBe(3);
    expect(r.maxVersion).toBe(967);
  });

  it('deduplicates repeated versions', () => {
    const r = computeAdoptionTail([965, 965, 966]);
    expect(r.tail).toBe(2);
    expect(r.maxVersion).toBe(966);
  });

  it('mimics the live 965–1028 run (64 consecutive)', () => {
    // Build a run from 965 to 1028 (inclusive = 64 versions) with no gaps.
    const versions = [];
    for (let i = 965; i <= 1028; i++) versions.push(i);
    const r = computeAdoptionTail(versions);
    expect(r.tail).toBe(64);
    expect(r.maxVersion).toBe(1028);
  });

  it('the 787, 789–801 run from the design doc: gap at 788 → tail is the 789–801 segment', () => {
    const versions = [787, ...Array.from({ length: 13 }, (_, i) => 789 + i)];
    const r = computeAdoptionTail(versions);
    expect(r.tail).toBe(13); // 789–801 = 13 versions
    expect(r.maxVersion).toBe(801);
  });
});

// ─── detectPromotionState ────────────────────────────────────────────────────

// Fixtures: pre-tag-gate.sh excerpts before and after promotion
const GATE_TEXT_STAGED =
  '# step 20/21: adoption-baseline freshness\n# (no marker yet)';
const GATE_TEXT_AF_PROMOTED =
  '# PROMOTION-MARKER: adoption-freshness default-BLOCK since v1.49.1029 (K=30)\n';
const GATE_TEXT_TV_PROMOTED =
  '# PROMOTION-MARKER: trip-vocab default-BLOCK since v1.49.1029 (K=30)\n';
const GATE_TEXT_BOTH_PROMOTED =
  GATE_TEXT_AF_PROMOTED + GATE_TEXT_TV_PROMOTED;

// T14-SHIP-SEQUENCE.md excerpts
const T14_STAGED = '## P: Adversarial ship review (ADVISORY, staged #10463)\n';
const T14_PROMOTED = '## P: Adversarial ship review — REQUIRED as of v1.49.1029\n';

describe('detectPromotionState', () => {
  it('adoption-freshness: staged when no PROMOTION-MARKER in gate text', () => {
    expect(detectPromotionState('adoption-freshness', GATE_TEXT_STAGED, null)).toBe('staged');
  });

  it('adoption-freshness: promoted when PROMOTION-MARKER is present', () => {
    expect(detectPromotionState('adoption-freshness', GATE_TEXT_AF_PROMOTED, null)).toBe('promoted');
  });

  it('adoption-freshness: unknown when gate text is null/empty', () => {
    expect(detectPromotionState('adoption-freshness', null, null)).toBe('unknown');
    expect(detectPromotionState('adoption-freshness', '', null)).toBe('unknown');
  });

  it('trip-vocab: staged when no PROMOTION-MARKER in gate text', () => {
    expect(detectPromotionState('trip-vocab', GATE_TEXT_STAGED, null)).toBe('staged');
  });

  it('trip-vocab: promoted when PROMOTION-MARKER is present', () => {
    expect(detectPromotionState('trip-vocab', GATE_TEXT_TV_PROMOTED, null)).toBe('promoted');
  });

  it('trip-vocab: unknown when gate text is empty', () => {
    expect(detectPromotionState('trip-vocab', '', null)).toBe('unknown');
  });

  it('ship-review: staged when T14 has no REQUIRED marker', () => {
    expect(detectPromotionState('ship-review', null, T14_STAGED)).toBe('staged');
  });

  it('ship-review: promoted when T14 has REQUIRED as of v', () => {
    expect(detectPromotionState('ship-review', null, T14_PROMOTED)).toBe('promoted');
  });

  it('ship-review: unknown when t14Text is null/empty', () => {
    expect(detectPromotionState('ship-review', null, null)).toBe('unknown');
    expect(detectPromotionState('ship-review', null, '')).toBe('unknown');
  });

  it('does not cross-contaminate: adoption-freshness marker does not affect trip-vocab', () => {
    expect(detectPromotionState('trip-vocab', GATE_TEXT_AF_PROMOTED, null)).toBe('staged');
    expect(detectPromotionState('adoption-freshness', GATE_TEXT_TV_PROMOTED, null)).toBe('staged');
  });

  it('both markers present: each step detected independently', () => {
    expect(detectPromotionState('adoption-freshness', GATE_TEXT_BOTH_PROMOTED, null)).toBe('promoted');
    expect(detectPromotionState('trip-vocab', GATE_TEXT_BOTH_PROMOTED, null)).toBe('promoted');
  });

  it('marker detection is case-insensitive', () => {
    const lower = '# promotion-marker: ADOPTION-FRESHNESS default-block since v1.49.1029\n';
    expect(detectPromotionState('adoption-freshness', lower, null)).toBe('promoted');
    const mixedT14 = '## required AS OF v1.49.1029\n';
    expect(detectPromotionState('ship-review', null, mixedT14)).toBe('promoted');
  });
});

// ─── computeTripVocabTail ────────────────────────────────────────────────────

describe('computeTripVocabTail', () => {
  it('empty sweep → tail=0, no tripAt', () => {
    const r = computeTripVocabTail([]);
    expect(r.tail).toBe(0);
    expect(r.tripAt).toBeNull();
    expect(r.transparentCount).toBe(0);
  });

  it('all PASS → tail equals count', () => {
    const sweep = [
      { degree: '1.217', exit: 0 },
      { degree: '1.216', exit: 0 },
      { degree: '1.215', exit: 0 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.tail).toBe(3);
    expect(r.tripAt).toBeNull();
  });

  it('TRIP-RISK breaks the tail and stops the walk', () => {
    const sweep = [
      { degree: '1.217', exit: 0 },
      { degree: '1.216', exit: 1 }, // TRIP
      { degree: '1.215', exit: 0 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.tail).toBe(1);
    expect(r.tripAt).toBe('1.216');
  });

  it('exit-2 (tool error) pages are transparent — neither count nor break', () => {
    const sweep = [
      { degree: '1.217', exit: 0 },
      { degree: '1.216', exit: 2 }, // transparent
      { degree: '1.215', exit: 0 },
      { degree: '1.214', exit: 0 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.tail).toBe(3); // 1.217, 1.215, 1.214 all count
    expect(r.tripAt).toBeNull();
    expect(r.transparentCount).toBe(1);
  });

  it('multiple transparent pages are all counted separately', () => {
    const sweep = [
      { degree: '1.217', exit: 0 },
      { degree: '1.216', exit: 2 },
      { degree: '1.215', exit: 2 },
      { degree: '1.214', exit: 0 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.tail).toBe(2);
    expect(r.transparentCount).toBe(2);
  });

  it('consecutive clean tail of 30 matches the K=30 threshold', () => {
    const sweep = Array.from({ length: 30 }, (_, i) => ({
      degree: `1.${217 - i}`,
      exit: 0,
    }));
    const r = computeTripVocabTail(sweep);
    expect(r.tail).toBe(30);
    expect(r.tripAt).toBeNull();
  });

  it('detail array tracks each record with reason', () => {
    const sweep = [
      { degree: '1.217', exit: 0 },
      { degree: '1.216', exit: 1 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.detail[0].counted).toBe(true);
    expect(r.detail[0].reason).toContain('PASS');
    expect(r.detail[1].counted).toBe(false);
    expect(r.detail[1].reason).toContain('TRIP-RISK');
  });

  it('records after a TRIP-RISK are marked "beyond broken tail"', () => {
    const sweep = [
      { degree: '1.217', exit: 1 },
      { degree: '1.216', exit: 0 },
    ];
    const r = computeTripVocabTail(sweep);
    expect(r.detail[1].reason).toContain('beyond broken tail');
  });
});

// ─── computeShipReviewCount ──────────────────────────────────────────────────

describe('computeShipReviewCount', () => {
  it('counts ALL matched v1.49.N dirs (no version floor — pre-968 founding evidence counts)', () => {
    const records = [
      { name: 'v1.49.965', matched: true },  // pre-codification founding evidence — counted
      { name: 'v1.49.968', matched: true },  // counted
      { name: 'v1.49.969', matched: false }, // not matched — excluded
      { name: 'v1.49.970', matched: true },  // counted
    ];
    const r = computeShipReviewCount(records);
    expect(r.count).toBe(3);
    expect(r.dirNames).toEqual(['v1.49.965', 'v1.49.968', 'v1.49.970']);
  });

  it('reports the >= 968 sub-count separately (transparency, not a floor)', () => {
    const records = [
      { name: 'v1.49.965', matched: true },
      { name: 'v1.49.967', matched: true },
      { name: 'v1.49.968', matched: true },
      { name: 'v1.49.1028', matched: true },
    ];
    const r = computeShipReviewCount(records);
    expect(r.count).toBe(4);
    expect(r.inRange968).toBe(2);
  });

  it('empty records → count=0', () => {
    expect(computeShipReviewCount([]).count).toBe(0);
  });

  it('ignores non-matching dir name formats', () => {
    const records = [
      { name: 'v1.0', matched: true },
      { name: 'not-a-dir', matched: true },
      { name: 'v1.49.968', matched: true },
    ];
    const r = computeShipReviewCount(records);
    expect(r.count).toBe(1);
  });

  it('a 55-dir matched corpus counts 55 (the live 2026-06-10 evidence shape)', () => {
    const records = Array.from({ length: 55 }, (_, i) => ({
      name: `v1.49.${965 + i}`,
      matched: true,
    }));
    const r = computeShipReviewCount(records);
    expect(r.count).toBe(55);
  });
});

// ─── SHIP_REVIEW_PATTERN — regression pins for the "step passes" inflation bug ─

describe('SHIP_REVIEW_PATTERN', () => {
  it('does NOT match "step passes" (the /i + no-boundary inflation caught live 2026-06-10)', () => {
    expect(SHIP_REVIEW_PATTERN.test('every gate step passes')).toBe(false);
    expect(SHIP_REVIEW_PATTERN.test('this step performs a check')).toBe(false);
    expect(SHIP_REVIEW_PATTERN.test('step plan was approved')).toBe(false);
  });

  it('matches the real step-P / adversarial-review vocabulary, any case', () => {
    expect(SHIP_REVIEW_PATTERN.test('T14 step P ran on the diff')).toBe(true);
    expect(SHIP_REVIEW_PATTERN.test('Step P adversarial review')).toBe(true);
    expect(SHIP_REVIEW_PATTERN.test('the adversarial-ship-review workflow')).toBe(true);
    expect(SHIP_REVIEW_PATTERN.test('Adversarial ship review (5 lenses)')).toBe(true);
    expect(SHIP_REVIEW_PATTERN.test('an adversarial review caught it')).toBe(true);
    expect(SHIP_REVIEW_PATTERN.test('ends with step P.')).toBe(true);
  });
});

// ─── CLI end-to-end via spawnSync + injected fixtures ────────────────────────

describe('CLI — adoption-freshness step', () => {
  it('exits 0 + READY when consecutive tail >= n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-af-'));
    try {
      // Build 30 consecutive filenames 965..994
      const names = Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const f = tmpJson(dir, 'baseline.json', names);
      const { status, stdout } = runCli({ step: 'adoption-freshness', n: 30, json: true, baselineVersionsFile: f });
      expect(status).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed[0].ready).toBe(true);
      expect(parsed[0].streak).toBe(30);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 + NOT READY when tail < n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-af-'));
    try {
      const names = Array.from({ length: 5 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const f = tmpJson(dir, 'baseline.json', names);
      const { status, stdout } = runCli({ step: 'adoption-freshness', n: 30, json: true, baselineVersionsFile: f });
      expect(status).toBe(1);
      expect(JSON.parse(stdout)[0].ready).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('gap breaks the tail → NOT READY even with many files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-af-'));
    try {
      // 965–994 with a gap at 990
      const names = [];
      for (let i = 965; i <= 994; i++) {
        if (i === 990) continue; // gap
        names.push(`ADOPTION-BASELINE-v1.49.${i}.json`);
      }
      const f = tmpJson(dir, 'baseline.json', names);
      const { status, stdout } = runCli({ step: 'adoption-freshness', n: 30, json: true, baselineVersionsFile: f });
      expect(status).toBe(1);
      const parsed = JSON.parse(stdout)[0];
      expect(parsed.ready).toBe(false);
      expect(parsed.streak).toBe(4); // 991,992,993,994
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('--n=1 makes a single baseline file READY', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-af-'));
    try {
      const f = tmpJson(dir, 'baseline.json', ['ADOPTION-BASELINE-v1.49.1028.json']);
      const { status, stdout } = runCli({ step: 'adoption-freshness', n: 1, json: true, baselineVersionsFile: f });
      expect(status).toBe(0);
      expect(JSON.parse(stdout)[0].ready).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('CLI — trip-vocab step', () => {
  it('exits 0 + READY when sweep tail >= n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-tv-'));
    try {
      const sweep = Array.from({ length: 30 }, (_, i) => ({
        degree: `1.${217 - i}`,
        exit: 0,
      }));
      const f = tmpJson(dir, 'sweep.json', sweep);
      const { status, stdout } = runCli({ step: 'trip-vocab', n: 30, json: true, sweepFile: f });
      expect(status).toBe(0);
      const parsed = JSON.parse(stdout)[0];
      expect(parsed.ready).toBe(true);
      expect(parsed.streak).toBe(30);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 when TRIP-RISK breaks the tail before K', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-tv-'));
    try {
      const sweep = [
        { degree: '1.217', exit: 0 },
        { degree: '1.216', exit: 1 }, // TRIP
        { degree: '1.215', exit: 0 },
      ];
      const f = tmpJson(dir, 'sweep.json', sweep);
      const { status, stdout } = runCli({ step: 'trip-vocab', n: 30, json: true, sweepFile: f });
      expect(status).toBe(1);
      const parsed = JSON.parse(stdout)[0];
      expect(parsed.ready).toBe(false);
      expect(parsed.streak).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exit-2 pages are transparent and do not count or break', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-tv-'));
    try {
      const sweep = [
        { degree: '1.217', exit: 0 },
        { degree: '1.216', exit: 2 }, // transparent
        { degree: '1.215', exit: 0 },
      ];
      const f = tmpJson(dir, 'sweep.json', sweep);
      const { status, stdout } = runCli({ step: 'trip-vocab', n: 2, json: true, sweepFile: f });
      expect(status).toBe(0);
      expect(JSON.parse(stdout)[0].ready).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('CLI — ship-review step', () => {
  it('exits 0 + READY when count >= n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-sr-'));
    try {
      const names = Array.from({ length: 51 }, (_, i) => `v1.49.${968 + i}`);
      const f = tmpJson(dir, 'dirs.json', names);
      const { status, stdout } = runCli({ step: 'ship-review', n: 30, json: true, notesDirsFile: f });
      expect(status).toBe(0);
      const parsed = JSON.parse(stdout)[0];
      expect(parsed.ready).toBe(true);
      expect(parsed.streak).toBe(51);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 when count < n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-sr-'));
    try {
      const names = Array.from({ length: 5 }, (_, i) => `v1.49.${968 + i}`);
      const f = tmpJson(dir, 'dirs.json', names);
      const { status, stdout } = runCli({ step: 'ship-review', n: 30, json: true, notesDirsFile: f });
      expect(status).toBe(1);
      expect(JSON.parse(stdout)[0].ready).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('dirs below v1.49.968 COUNT toward the streak (all-time model); inRange968 discloses the split', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-sr-'));
    try {
      // 29 in-range dirs + 10 pre-codification dirs: under the all-time model the
      // founding evidence (v965/v966 + F4-era) is real participation, so the
      // streak is 39 (READY at n=30) with inRange968=29 reported alongside.
      const names = [
        ...Array.from({ length: 29 }, (_, i) => `v1.49.${968 + i}`),
        ...Array.from({ length: 10 }, (_, i) => `v1.49.${958 + i}`),
      ];
      const f = tmpJson(dir, 'dirs.json', names);
      const { status, stdout } = runCli({ step: 'ship-review', n: 30, json: true, notesDirsFile: f });
      expect(status).toBe(0);
      const r = JSON.parse(stdout)[0];
      expect(r.streak).toBe(39);
      expect(r.ready).toBe(true);
      expect(r.details.inRange968).toBe(29);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('CLI — all steps together', () => {
  it('exits 0 when all three steps are READY', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-all-'));
    try {
      const baselineNames = Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const bFile = tmpJson(dir, 'baseline.json', baselineNames);
      const sweep = Array.from({ length: 30 }, (_, i) => ({ degree: `1.${217 - i}`, exit: 0 }));
      const sFile = tmpJson(dir, 'sweep.json', sweep);
      const noteNames = Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`);
      const nFile = tmpJson(dir, 'notes.json', noteNames);
      const { status, stdout } = runCli({
        n: 30,
        json: true,
        baselineVersionsFile: bFile,
        sweepFile: sFile,
        notesDirsFile: nFile,
      });
      expect(status).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed.every((r) => r.ready)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 when any step is NOT READY', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-all-'));
    try {
      const baselineNames = Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const bFile = tmpJson(dir, 'baseline.json', baselineNames);
      // trip-vocab: only 5 clean pages (NOT READY at K=30)
      const sweep = Array.from({ length: 5 }, (_, i) => ({ degree: `1.${217 - i}`, exit: 0 }));
      const sFile = tmpJson(dir, 'sweep.json', sweep);
      const noteNames = Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`);
      const nFile = tmpJson(dir, 'notes.json', noteNames);
      const { status } = runCli({
        n: 30,
        json: true,
        baselineVersionsFile: bFile,
        sweepFile: sFile,
        notesDirsFile: nFile,
      });
      expect(status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('CLI — lifecycle awareness (promotion-marker detection)', () => {
  it('pre-promotion: READY guidance says "Promotion criterion met"', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-lc-'));
    try {
      const bNames = Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const bFile = tmpJson(dir, 'baseline.json', bNames);
      const gateFile = tmpJson(dir, 'gate.sh', '# no marker yet');
      const { stdout } = runCli({
        step: 'adoption-freshness',
        n: 30,
        baselineVersionsFile: bFile,
        gateTextFile: gateFile,
      });
      expect(stdout).toContain('READY');
      expect(stdout).toContain('Promotion criterion met');
      expect(stdout).not.toContain('already promoted');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('post-promotion: READY guidance says "already promoted" + REVERT', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-lc-'));
    try {
      const bNames = Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`);
      const bFile = tmpJson(dir, 'baseline.json', bNames);
      const gateFile = tmpJson(
        dir,
        'gate.sh',
        '# PROMOTION-MARKER: adoption-freshness default-BLOCK since v1.49.1029 (K=30)\n',
      );
      const { stdout } = runCli({
        step: 'adoption-freshness',
        n: 30,
        baselineVersionsFile: bFile,
        gateTextFile: gateFile,
      });
      expect(stdout).toContain('already promoted');
      expect(stdout).toContain('REVERT');
      expect(stdout).not.toContain('Promotion criterion met');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ship-review post-promotion uses T14-SHIP-SEQUENCE.md marker', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-lc-'));
    try {
      const noteNames = Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`);
      const nFile = tmpJson(dir, 'notes.json', noteNames);
      const t14File = tmpJson(
        dir,
        't14.md',
        '## P: Adversarial ship review — REQUIRED as of v1.49.1029\n',
      );
      const { stdout } = runCli({
        step: 'ship-review',
        n: 30,
        notesDirsFile: nFile,
        t14TextFile: t14File,
      });
      expect(stdout).toContain('already promoted');
      expect(stdout).toContain('REVERT');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('CLI — error handling', () => {
  it('exits 2 and emits "positive integer" for non-integer --n', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-err-'));
    try {
      const bFile = tmpJson(dir, 'baseline.json', ['ADOPTION-BASELINE-v1.49.965.json']);
      const { status, stderr } = runCli({
        step: 'adoption-freshness',
        baselineVersionsFile: bFile,
        extraArgs: ['--n=1.5'],
      });
      expect(status).toBe(2);
      expect(stderr).toContain('positive integer');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 for invalid --step value', () => {
    const { status, stderr } = runCli({ step: 'bad-step' });
    expect(status).toBe(2);
    expect(stderr).toContain('invalid --step');
  });

  it('human output contains OVERALL READY when all steps clear K', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-overall-'));
    try {
      const bFile = tmpJson(dir, 'b.json', Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`));
      const sFile = tmpJson(dir, 's.json', Array.from({ length: 30 }, (_, i) => ({ degree: `1.${217 - i}`, exit: 0 })));
      const nFile = tmpJson(dir, 'n.json', Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`));
      const { status, stdout } = runCli({
        n: 30,
        baselineVersionsFile: bFile,
        sweepFile: sFile,
        notesDirsFile: nFile,
      });
      expect(status).toBe(0);
      expect(stdout).toContain('OVERALL: READY');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('human output contains NOT READY when a step falls short', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-overall-'));
    try {
      const bFile = tmpJson(dir, 'b.json', ['ADOPTION-BASELINE-v1.49.965.json']); // tail=1 < 30
      const sFile = tmpJson(dir, 's.json', Array.from({ length: 30 }, (_, i) => ({ degree: `1.${217 - i}`, exit: 0 })));
      const nFile = tmpJson(dir, 'n.json', Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`));
      const { status, stdout } = runCli({
        n: 30,
        baselineVersionsFile: bFile,
        sweepFile: sFile,
        notesDirsFile: nFile,
      });
      expect(status).toBe(1);
      expect(stdout).toContain('NOT READY');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs correctly through a SYMLINK (realpath CLI-guard)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wpr-sym-'));
    try {
      const bFile = tmpJson(dir, 'b.json', Array.from({ length: 30 }, (_, i) => `ADOPTION-BASELINE-v1.49.${965 + i}.json`));
      const sFile = tmpJson(dir, 's.json', Array.from({ length: 30 }, (_, i) => ({ degree: `1.${217 - i}`, exit: 0 })));
      const nFile = tmpJson(dir, 'n.json', Array.from({ length: 30 }, (_, i) => `v1.49.${968 + i}`));
      const link = join(dir, 'linked-tool.mjs');
      symlinkSync(TOOL_PATH, link);
      const args = [
        link,
        `--n=30`,
        `--baseline-versions-file=${bFile}`,
        `--sweep-file=${sFile}`,
        `--notes-dirs-file=${nFile}`,
      ];
      const res = spawnSync('node', args, { encoding: 'utf8' });
      expect(res.stdout).toContain('READY');
      expect(res.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

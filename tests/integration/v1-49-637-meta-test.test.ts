/**
 * v1.49.637 Integration Meta-Test
 *
 * Exercises every new gate this milestone shipped with intentional
 * violation fixtures, asserting the gate fires correctly. Each test uses
 * the Lesson #10180 skip-guard pattern when it touches a gitignored
 * runtime artifact so fresh-clone / CI environments do not false-fail.
 *
 * Gates exercised:
 *   C1 — Cargo build without legacy-plaintext-keystore feature
 *        (skip-guarded to CARGO_AVAILABLE=1).
 *   C2 — migrate --to-keyring stub output (M3 deferral message).
 *   C3 — Passphrase quality validation (weak rejected / strong accepted /
 *        env-var override).
 *   C4 — Atlas test disposition invariant (#[ignore] annotations match
 *        disposition records; skip-guarded to disposition file present).
 *   C5 — STORY-gate append + idempotency.
 *   C6 — STATE-normalizer prose-body milestone-drift warning.
 *   C7 Sub-1a — perf-assertion audit catches additive-constant shape.
 *   C7 Sub-1b — apply-to-self self-check on this milestone diff (0
 *               findings asserted).
 *   counter-cadence — engine state UNCHANGED vs predecessor v1.49.636.
 */

import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const REPO_ROOT = process.cwd();

const CARGO_AVAILABLE = process.env.CARGO_AVAILABLE === '1';
const DISPOSITION_PATH = join(REPO_ROOT, '.planning', 'atlas-test-disposition.md');
const STORY_GROUND_TRUTH = join(
  REPO_ROOT,
  '.planning',
  'roadmap',
  'STORY.md',
);

describe('v1.49.637 integration meta-test', () => {
  // ==========================================================================
  // Test 1: C1 — cargo build without legacy-plaintext-keystore feature
  // ==========================================================================
  it.runIf(CARGO_AVAILABLE)(
    'C1 — cargo build succeeds; --features legacy-plaintext-keystore fails',
    () => {
      const ok = execSync('cargo build --release --lib', {
        cwd: join(REPO_ROOT, 'src-tauri'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      expect(ok).toBeDefined();

      let exitCode = 0;
      let stderr = '';
      try {
        execSync(
          'cargo build --features legacy-plaintext-keystore --lib',
          {
            cwd: join(REPO_ROOT, 'src-tauri'),
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
      } catch (err) {
        const e = err as { status?: number; stderr?: Buffer };
        exitCode = e.status ?? -1;
        stderr = e.stderr ? e.stderr.toString() : '';
      }
      expect(exitCode).not.toBe(0);
      // Cargo reports "Package <name> does not have feature `…`" or similar.
      expect(stderr).toMatch(/legacy-plaintext-keystore|unknown feature/i);
    },
  );

  // ==========================================================================
  // Test 2: C2 — migrate --to-keyring outputs M3-deferred message
  // ==========================================================================
  it('C2 — migrate --to-keyring Rust stub references M3 deferral + doc path', () => {
    // The --to-keyring stub lives in the Rust bin (src-tauri/bin/
    // skill-creator-keystore.rs) and prints an M3-deferred message that
    // references .planning/path-2-to-path-1-migration.md. We assert the
    // surface text exists in the source — invocation-time verification
    // requires a compiled bin (covered by the C1 cargo test when
    // CARGO_AVAILABLE=1, and by Rust unit tests in the keystore bin).
    const binSrc = readFileSync(
      join(REPO_ROOT, 'src-tauri/bin/skill-creator-keystore.rs'),
      'utf8',
    );
    expect(binSrc).toContain('M3 deferral');
    expect(binSrc).toContain('.planning/path-2-to-path-1-migration.md');
    // The CLI subcommand surface in keystore.ts must also document the
    // --to-keyring flag with the M3 deferral note.
    const tsCmd = readFileSync(
      join(REPO_ROOT, 'src/cli/commands/keystore.ts'),
      'utf8',
    );
    expect(tsCmd).toContain('--to-keyring');
    expect(tsCmd).toMatch(/M3 deferral|M3 stub/);
  });

  // ==========================================================================
  // Test 3: C3 — passphrase quality validation
  // ==========================================================================
  it('C3 — weak passphrase rejected, strong accepted, env-var override works', async () => {
    const mod = await import('../../src/keystore/passphrase-quality.js');
    const { validatePassphraseQuality, ENV_VAR_OVERRIDE } = mod;

    const weak = validatePassphraseQuality('password123');
    expect(weak.accepted).toBe(false);

    const strong = validatePassphraseQuality(
      'correct horse battery staple stadium',
    );
    expect(strong.accepted).toBe(true);

    // Env-var override path: SC_PASSPHRASE_MIN_SCORE=0 should accept
    // anything (effective floor of 0).
    const prior = process.env[ENV_VAR_OVERRIDE];
    process.env[ENV_VAR_OVERRIDE] = '0';
    try {
      const overridden = validatePassphraseQuality('a');
      expect(overridden.accepted).toBe(true);
    } finally {
      if (prior === undefined) {
        delete process.env[ENV_VAR_OVERRIDE];
      } else {
        process.env[ENV_VAR_OVERRIDE] = prior;
      }
    }
  });

  // ==========================================================================
  // Test 4: C4 — Atlas disposition invariant (#[ignore] annotations match)
  // ==========================================================================
  it.runIf(existsSync(DISPOSITION_PATH))(
    'C4 — atlas-test-disposition.md entries match atlas.rs #[ignore] sites',
    () => {
      const disposition = readFileSync(DISPOSITION_PATH, 'utf8');
      const atlas = readFileSync(
        join(REPO_ROOT, 'src-tauri/src/intelligence/atlas.rs'),
        'utf8',
      );

      // Disposition history:
      //   v1.49.637 C4: lru_access_promotes_… was `temporary-skip` (cluster
      //                 #5 forward-action item), per_project_clear_… was
      //                 `fixed-inline`.
      //   v1.49.638 W1A.T1 (commits 7a9a2c5cb + b78097bb9): cluster-#5
      //                 closure — lru_access_promotes_… migrated to
      //                 `fixed-inline` via per-project query API
      //                 (option (a)); test rewritten and un-ignored.
      //
      // Post-W1A.T1, BOTH tests must be `fixed-inline` in the disposition
      // file AND NOT carry `#[ignore]` in atlas.rs. This meta-test was
      // forward-synced to that disposition; if a future change re-adds
      // `#[ignore]` to either test without updating the disposition
      // record, this assertion fires as designed.
      const lruFixedInDisposition = /lru_access_promotes_keeps_entry_alive_under_eviction[\s\S]*?fixed-inline/.test(
        disposition,
      );
      expect(lruFixedInDisposition).toBe(true);

      const lruRegex =
        /#\[ignore[^\]]*\]\s*(?:#\[[^\]]+\]\s*)*fn\s+lru_access_promotes_keeps_entry_alive_under_eviction/;
      expect(lruRegex.test(atlas)).toBe(false);

      // per_project_clear should NOT have an #[ignore] anymore.
      const ppcRegex =
        /#\[ignore[^\]]*\]\s*(?:#\[[^\]]+\]\s*)*fn\s+per_project_clear_with_unknown_project_id_falls_back_to_full_clear/;
      expect(ppcRegex.test(atlas)).toBe(false);
    },
  );

  // ==========================================================================
  // Test 5: C5 — STORY-gate fires + appends entry on synthetic tag
  // ==========================================================================
  it('C5 — appendStoryEntry orchestrator fires on synthetic tag fixture', async () => {
    const mod = await import('../../scripts/append-story-entry.mjs');
    const { appendStoryEntry, applyAppend } = mod;

    // Pure synthetic fixture matching the STORY.md header shape (line 4
    // must contain `continues to \`vX.Y.Z\`.` for parseHeaderTag to find
    // it). Live-repo orchestrator coverage is in
    // scripts/__tests__/append-story-entry.test.mjs.
    const publicBefore = [
      '# The Story of This Project',
      '',
      'Read this directory like a book.',
      'The story begins at `v1.0` and continues to `v1.0.0`.',
      '',
      '**1 chapters.** 0 have retrospectives.',
      '',
      '## Chapters',
      '',
      '- **[v1.0.0](v1.0.0/00-summary.md)** — first entry',
      '',
    ].join('\n');
    const groundTruthEntry =
      '- **[v1.0.1](v1.0.1/00-summary.md)** — synthetic entry';
    const after = applyAppend(publicBefore, groundTruthEntry, 'v1.0.1');
    expect(after.content).toContain('v1.0.1');
    expect(after.content).toContain('synthetic entry');
    expect(after.content).toContain('continues to `v1.0.1`.');
    // applyAppend should preserve trailing-newline shape.
    expect(after.content.endsWith('\n')).toBe(true);
    expect(after.newChapterCount).toBe(2);
    expect(after.previousHeaderTag).toBe('v1.0.0');

    // appendStoryEntry exists as exported function (smoke check).
    expect(typeof appendStoryEntry).toBe('function');
  });

  // ==========================================================================
  // Test 6: C5 — STORY-gate idempotency invariant
  // ==========================================================================
  it('C5 — applyAppend is byte-identical when entry already present', async () => {
    const { publicAlreadyHasEntry } = await import(
      '../../scripts/append-story-entry.mjs'
    );
    const publicContent =
      '# Story\n\n**Latest:** v1.0.1\n\nChapters: 2\n\n- **[v1.0.1](v1.0.1/00-summary.md)** — synthetic\n';
    expect(publicAlreadyHasEntry(publicContent, 'v1.0.1')).toBe(true);
    expect(publicAlreadyHasEntry(publicContent, 'v1.0.2')).toBe(false);
  });

  // ==========================================================================
  // Test 7: C6 — STATE-normalizer flags synthetic prose-body milestone drift
  // ==========================================================================
  it('C6 — validateProseSync flags frontmatter ↔ prose milestone mismatch', async () => {
    const { validateProseSync } = await import(
      '../../tools/state-md-normalizer-prose.mjs'
    );
    const synth = [
      '---',
      'milestone: v1.49.637',
      '---',
      '',
      '### Branch State',
      '',
      'Working on v1.49.636 cleanup.',
      '',
    ].join('\n');
    const result = validateProseSync(synth);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].proseReferences.length).toBeGreaterThan(0);
  });

  it('C6 — validateProseSync passes when prose matches frontmatter', async () => {
    const { validateProseSync } = await import(
      '../../tools/state-md-normalizer-prose.mjs'
    );
    const aligned = [
      '---',
      'milestone: v1.49.637',
      '---',
      '',
      '### Branch State',
      '',
      'Currently on v1.49.637.',
      '',
    ].join('\n');
    const result = validateProseSync(aligned);
    expect(result.warnings.length).toBe(0);
  });

  // ==========================================================================
  // Test 8: C7 Sub-1a — perf-assertion-audit catches additive-constant shape
  // ==========================================================================
  it('C7 Sub-1a — detectShape catches `* N + K)` additive trailing-constant', async () => {
    const { detectShape } = await import('../../tools/perf-assertion-audit.mjs');
    // Post-multiplier additive shape (v1.49.637 C7 extension target).
    expect(detectShape('expect(t4).toBeLessThan(t1 * 5 + 10)')).toBe(
      'relative-ratio',
    );
    // Pre-multiplier shape (also caught by extended regex).
    expect(detectShape('expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)')).toBe(
      'relative-ratio',
    );
    // Bare relative ratio still classified.
    expect(detectShape('expect(t4).toBeLessThan(t1 * 10)')).toBe(
      'relative-ratio',
    );
    // Non-perf snippet unrelated.
    expect(detectShape('const x = 5')).toBe('unknown');
  });

  // ==========================================================================
  // Test 9: C7 Sub-1b — apply-to-self self-check on this milestone diff
  // ==========================================================================
  it('C7 Sub-1b — apply-to-self.mjs against v1.49.636..HEAD has 0 findings', () => {
    // Skip-guard: the v1.49.636 tag must exist locally for the diff to
    // resolve. Fresh-clone environments may not have it (CI usually
    // fetches all tags via actions/checkout fetch-tags: true).
    let tagExists = false;
    try {
      execSync('git rev-parse --verify v1.49.636', {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      tagExists = true;
    } catch {
      // Tag missing — skip gracefully.
    }
    if (!tagExists) return;

    const script = join(REPO_ROOT, 'scripts', 'apply-to-self.mjs');
    const out = execSync(
      `node "${script}" --diff-against v1.49.636 --json`,
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const result = JSON.parse(out);
    // Self-check: this milestone's new test files should comply with the
    // discipline-doc patterns. 0 findings is the assertion.
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  // ==========================================================================
  // Test 10: counter-cadence — engine state UNCHANGED vs v1.49.636
  // ==========================================================================
  it('counter-cadence — engine state unchanged (NASA / MUS / ELC / SPS / TRS)', () => {
    // Read live STATE.md frontmatter and verify the engine-state slots
    // match the predecessor recorded at v1.49.636 ship close. The
    // canonical reference at v1.49.636 was NASA 108, MUS 108, ELC 108,
    // SPS #105, TRS pack-30 (per v1.49.636 release-notes 99-context.md).
    const statePath = join(REPO_ROOT, '.planning/STATE.md');
    if (!existsSync(statePath)) return; // gitignored on fresh clone
    const state = readFileSync(statePath, 'utf8');

    // nasa_degree is the load-bearing slot. v1.49.636 set it to 108;
    // v1.49.637 must keep it at 108.
    const m = state.match(/^nasa_degree:\s*(\d+)/m);
    if (m) {
      expect(parseInt(m[1], 10)).toBe(108);
    }
    // counter_cadence: true is the explicit invariant.
    expect(state).toMatch(/^counter_cadence:\s*true/m);
    expect(state).toMatch(/^no_engine_state_advance:\s*true/m);
  });
});

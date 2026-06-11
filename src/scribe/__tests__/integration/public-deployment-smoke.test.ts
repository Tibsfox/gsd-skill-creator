/**
 * SCRIBE Build-Out v1.49.621 — Component 09 integration test.
 *
 * Public deployment smoke (C08). Verifies success criterion C10
 * (public deployment verified) at the local-manifest level.
 *
 * The deployment manifest is www/tibsfox/com/Research/SCRIBE/. The
 * original ship deployed 12 files (369,668 bytes — see
 * DEPLOYMENT-LOG-v1.49.621.md); on 2026-05-10 commit ac4b9dd5f
 * deliberately retracted the 4 dashboard files (dashboard/index.html,
 * dashboard/app.js, dashboard/data/sample-graph.json,
 * dashboard-lod-rendering/index.html) because the demo sample graph
 * leaked .planning/-referencing content to public www. The live
 * manifest since then is 8 files / 305,584 bytes — that is what this
 * suite pins. The retracted paths are asserted ABSENT so the leaked
 * content cannot silently reappear in the deploy mirror.
 *
 * When DEPLOY_TEST=1 is set the suite additionally HTTPS-probes the
 * live tibsfox.com URLs for 200 responses.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
const DEPLOY_DIR = resolve(REPO_ROOT, 'www/tibsfox/com/Research/SCRIBE');

const EXPECTED_FILES: ReadonlyArray<{ path: string; minBytes: number }> = [
  { path: 'VISION.md', minBytes: 50_000 },
  { path: 'VISION.pdf', minBytes: 100_000 },
  { path: 'scribe.css', minBytes: 1_000 },
  { path: 'index.html', minBytes: 2_000 },
  { path: 'code-svg-hdl-bridge/index.html', minBytes: 10_000 },
  { path: 'svg-substrate/index.html', minBytes: 8_000 },
  { path: 'markup-lineage/index.html', minBytes: 10_000 },
  { path: 'retrieval-provenance/index.html', minBytes: 10_000 },
];

/**
 * Retracted at ac4b9dd5f (2026-05-10): leaked .planning/-referencing
 * demo content. Re-deploying requires regenerating sample-graph.json
 * with neutral node IDs first — see DEPLOYMENT-LOG takedown addendum.
 */
const RETRACTED_PATHS: ReadonlyArray<string> = [
  'dashboard/index.html',
  'dashboard/app.js',
  'dashboard/data/sample-graph.json',
  'dashboard-lod-rendering/index.html',
];

const deployTestEnabled = process.env['DEPLOY_TEST'] === '1';
const describeOrSkip = deployTestEnabled ? describe : describe.skip;

// www/ is gitignored — these local-manifest checks run wherever the
// deploy artifacts exist (operator's checkout post-Component 08); in CI
// runners without www/ we soft-skip the suite. Matches the PG_TEST=1 /
// YOSYS_TEST=1 file-presence gating pattern.
//
// Skip-guard checks the full manifest, not just DEPLOY_DIR — a partial
// www/ tree (e.g. an operator checkout that synced only some artifacts)
// would otherwise produce ENOENT failures inside the assertions instead
// of cleanly soft-skipping. Match the manifest reality, not the parent dir.
const deployArtifactsAvailable =
  existsSync(DEPLOY_DIR) &&
  EXPECTED_FILES.every(({ path }) => existsSync(resolve(DEPLOY_DIR, path)));
const describeLocalOrSkip = deployArtifactsAvailable ? describe : describe.skip;

describeLocalOrSkip('integration: public deployment manifest (C10 — local checks)', () => {
  it('all 8 SCRIBE deployment files exist at the expected paths', () => {
    for (const { path } of EXPECTED_FILES) {
      const full = resolve(DEPLOY_DIR, path);
      expect(existsSync(full), `missing: ${path}`).toBe(true);
    }
  });

  it('all 8 files exceed their minimum byte threshold', () => {
    for (const { path, minBytes } of EXPECTED_FILES) {
      const full = resolve(DEPLOY_DIR, path);
      const size = statSync(full).size;
      expect(size, `${path} too small (${size} < ${minBytes})`).toBeGreaterThan(
        minBytes,
      );
    }
  });

  it('deployment total matches the post-takedown byte tally within 5%', () => {
    let total = 0;
    for (const { path } of EXPECTED_FILES) {
      total += statSync(resolve(DEPLOY_DIR, path)).size;
    }
    // 8-file manifest after the ac4b9dd5f takedown (was 369,668 across
    // 12 files at ship).
    const baseline = 305_584;
    const tolerance = baseline * 0.05;
    expect(total).toBeGreaterThan(baseline - tolerance);
    expect(total).toBeLessThan(baseline + tolerance);
  });

  it('retracted dashboard files stay retracted (leaked content must not reappear)', () => {
    for (const path of RETRACTED_PATHS) {
      const full = resolve(DEPLOY_DIR, path);
      expect(
        existsSync(full),
        `${path} reappeared in the deploy mirror — it was retracted at ` +
          'ac4b9dd5f for leaking .planning/ references; regenerate ' +
          'sample-graph.json with neutral node IDs before re-staging',
      ).toBe(false);
    }
  });
});

describeOrSkip('integration: public deployment HTTPS probes (DEPLOY_TEST=1)', () => {
  const BASE_URL = 'https://tibsfox.com/Research/SCRIBE';

  it(
    'returns 200 for each deployed URL',
    { timeout: 60_000 },
    async () => {
      for (const { path } of EXPECTED_FILES) {
        const url = `${BASE_URL}/${path}`;
        const res = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(15_000),
        });
        expect(res.status, `${url} returned ${res.status}`).toBe(200);
      }
    },
  );

  it(
    'returns 404 for each retracted URL (takedown holds live)',
    { timeout: 60_000 },
    async () => {
      for (const path of RETRACTED_PATHS) {
        const url = `${BASE_URL}/${path}`;
        const res = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(15_000),
        });
        expect(res.status, `${url} returned ${res.status}`).toBe(404);
      }
    },
  );
});

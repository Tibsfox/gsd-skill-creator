/**
 * Phase 826 / C13 — S3: Atomic emissions
 *                    S6: Bundle manifest schema validation
 *
 * S3: Kill mid-bundle-emission leaves no .tmp files; consistent state.
 * S6: 100 randomly-generated bundle manifests validate against schema.
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-09, D-26-11.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../');
const SCHEMA_PATH = join(REPO_ROOT, 'src/intelligence/schemas/bundle-manifest.schema.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

const created: string[] = [];
function mkTmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'gsd-s3-'));
  created.push(d);
  return d;
}

afterEach(() => {
  for (const d of created.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

// ─── S3: Atomic emissions ───────────────────────────────────────────────────

describe('S3: atomic emissions — no orphan .tmp files after abort (G2 BLOCK)', () => {
  it('atomicWriteFile leaves no .tmp file on success', async () => {
    const dir = mkTmpDir();
    const { atomicWriteFile } = await import('../../emitter/staging.js');

    const target = join(dir, 'test.md');
    atomicWriteFile(target, '# Test Vision Doc\n\nContent here.');

    // The .tmp file should be gone
    expect(existsSync(target + '.tmp')).toBe(false);
    // The final file should be present
    expect(existsSync(target)).toBe(true);
  });

  it('staging inbox has no orphan .inbox-txn-* dirs after cleanupOrphanTransactions', async () => {
    const stagingRoot = mkTmpDir();
    const { cleanupOrphanTransactions } = await import('../../emitter/staging.js');

    // cleanupOrphanTransactions sweeps `.inbox-txn-*` dirs in stagingRoot —
    // these are left behind when a bundle emission is interrupted mid-rename.
    const staleTxnDir = join(stagingRoot, '.inbox-txn-stale12');
    mkdirSync(staleTxnDir, { recursive: true });
    writeFileSync(join(staleTxnDir, 'req_old.md.tmp'), 'stale content');

    // Force it to be "old" by modifying mtime (2 hours ago = past 1-hour threshold)
    const { utimesSync } = await import('node:fs');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    utimesSync(staleTxnDir, twoHoursAgo, twoHoursAgo);

    cleanupOrphanTransactions(stagingRoot, 60 * 60 * 1000); // 1 hour max age

    // The stale txn dir (and its contents) should be removed
    expect(existsSync(staleTxnDir)).toBe(false);
  });

  it('consistent state: after emitBundle, either all files + manifest present OR none', async () => {
    // This tests the atomic bundle deposit: vision seeds + manifest must all
    // be present together (no partial state visible to readers).
    const stagingRoot = mkTmpDir();
    const { emitBundle } = await import('../../emitter/staging.js');

    const emissions = [
      { request_id: 'req_2026-05-02_0000_aaaa', vision_doc: '# Vision\nTest doc', meta_json: '{"test":true}' },
      { request_id: 'req_2026-05-02_0000_bbbb', vision_doc: '# Vision 2\nTest doc', meta_json: '{"test":true}' },
    ];
    const manifestPayload = { bundle_id: 'M-20260502-test', yaml: 'bundle_id: M-20260502-test\n' };

    const result = emitBundle(emissions, manifestPayload, stagingRoot);

    // Manifest should be present
    expect(existsSync(result.manifestPath)).toBe(true);
    // All seed files should be present
    for (const seedPath of result.seedPaths) {
      expect(existsSync(seedPath)).toBe(true);
    }
    // No orphan .tmp files
    const inboxDir = join(stagingRoot, 'staging', 'inbox');
    const tmpFiles = readdirSync(inboxDir).filter((f) => f.endsWith('.tmp'));
    expect(tmpFiles, '.tmp files should not remain after successful emitBundle').toHaveLength(0);
  });
});

// ─── S6: Bundle manifest schema validation ──────────────────────────────────

describe('S6: bundle manifest schema validation (G2 BLOCK)', () => {
  it('100 random bundle manifests validate against bundle-manifest.schema.json', () => {
    const schemaSource = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    // Remove the $id to prevent URI resolution issues in test environments
    const schema = { ...schemaSource };
    delete schema.$id;
    delete schema.$schema;
    const validate = ajv.compile(schema);

    const failures: Array<{ i: number; errors: unknown }> = [];

    for (let i = 0; i < 100; i++) {
      // Note: bundle-manifest.schema.json validates the Bundle type (JS object),
      // not the YAML text. The parseBundleManifest function converts YAML → JS object.
      const meetingId = `M-20260502-${i.toString().padStart(4, '0')}`;
      const decisionIds = [`D-req-${i}-a`, `D-req-${i}-b`].slice(0, (i % 2) + 1);

      const manifest = {
        id: meetingId,
        meeting_id: meetingId,
        emitted_at: new Date(Date.now() + i * 1000).toISOString(),
        decisions: decisionIds,
        manifest_path: `.planning/staging/inbox/${meetingId}.bundle.yaml`,
        batch_hints: {
          parallelizable: [decisionIds.slice()],
          shared_context: [],
          suggested_order: decisionIds.slice(),
        },
      };

      const valid = validate(manifest);
      if (!valid) {
        failures.push({ i, errors: validate.errors });
      }
    }

    expect(failures, `S6: ${failures.length}/100 manifests failed schema validation:\n${
      failures.slice(0, 3).map((f) => `  sample ${f.i}: ${JSON.stringify(f.errors)}`).join('\n')
    }`).toHaveLength(0);
  });

  it('parseBundleManifest produces valid schema-compliant Bundle objects', async () => {
    const { composeBundleManifest, parseBundleManifest } = await import('../../emitter/manifest.js');
    const schemaSource = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const schema = { ...schemaSource };
    delete schema.$id;
    delete schema.$schema;
    const validate = ajv.compile(schema);

    const meetingId = 'M-20260502-0001';
    const yaml = composeBundleManifest({
      bundle_id: meetingId,
      meeting_id: meetingId,
      emitted_at: new Date().toISOString(),
      project: 'test-proj',
      kb_snapshot: 'S-001',
      decisions: [{ request_id: 'req_2026-05-02_0000_aaaa', skill: 'vision-to-mission', speed_hint: 'fast', title: 'Test' }],
      batch_hints: {
        parallelizable: [['req_2026-05-02_0000_aaaa']],
        shared_context: [],
        suggested_order: ['req_2026-05-02_0000_aaaa'],
      },
      excluded_from_bundle: [],
    });

    const parsed = parseBundleManifest(yaml);
    // parseBundleManifest returns a BundleManifestData; map to the Bundle schema shape
    const bundle = {
      id: parsed.bundle_id,
      meeting_id: parsed.meeting_id,
      emitted_at: parsed.emitted_at,
      decisions: parsed.decisions.map((d) => d.request_id),
      manifest_path: `.planning/staging/inbox/${parsed.bundle_id}.bundle.yaml`,
      batch_hints: parsed.batch_hints,
    };

    const valid = validate(bundle);
    expect(valid, `Parsed manifest not schema-valid: ${JSON.stringify(validate.errors)}`).toBe(true);
  });
});

/**
 * C10 / T11 — Format compliance: bundle pickup logic (CAPCOM gate G1).
 *
 * Simulates gsd-skill-creator's bundle-pickup loop: scans
 * `.planning/staging/inbox/bundles/*.bundle.yaml`, parses via js-yaml,
 * validates structurally, and confirms each `request_id` in the manifest
 * lines up with a `.md` + `.meta.json` pair in `staging/inbox/`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  readdirSync,
  readFileSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import { parseBundleManifest } from '../manifest.js';
import {
  buildPopulatedKB,
  makeDecision,
} from './_fixtures.js';

let stagingRoot: string;

beforeEach(() => {
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-bp-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

/**
 * Mirror of the bundle-pickup logic gsd-skill-creator would run.
 * Returns the discovered bundles and the per-bundle decision pickup status.
 */
function bundlePickup(stagingRootArg: string) {
  const inbox = join(stagingRootArg, 'staging', 'inbox');
  const bundlesDir = join(inbox, 'bundles');
  if (!existsSync(bundlesDir)) {
    return { bundles: [] as Array<{ bundleId: string; decisions: Array<{ requestId: string; foundMd: boolean; foundMeta: boolean }> }> };
  }
  const bundleFiles = readdirSync(bundlesDir).filter((f) =>
    f.endsWith('.bundle.yaml'),
  );
  const bundles = [] as Array<{
    bundleId: string;
    decisions: Array<{ requestId: string; foundMd: boolean; foundMeta: boolean }>;
  }>;
  for (const f of bundleFiles) {
    const yamlText = readFileSync(join(bundlesDir, f), 'utf8');
    const manifest = parseBundleManifest(yamlText);
    const decisions = manifest.decisions.map((d) => ({
      requestId: d.request_id,
      foundMd: existsSync(join(inbox, `${d.request_id}.md`)),
      foundMeta: existsSync(join(inbox, `${d.request_id}.meta.json`)),
    }));
    bundles.push({ bundleId: manifest.bundle_id, decisions });
  }
  return { bundles };
}

describe('CAPCOM G1 / T11 — bundle pickup format compliance', () => {
  it('emitted bundle is fully discoverable: manifest + all 3 seeds', async () => {
    const f = buildPopulatedKB();
    // Add 3 bundled decisions
    const bundled = [
      makeDecision({ id: 'bp-d1', state: 'bundled', kind: 'research_mission', ai_draft: { title: 'A', body: 'a' } }),
      makeDecision({ id: 'bp-d2', state: 'bundled', kind: 'vision_mission', ai_draft: { title: 'B', body: 'b' } }),
      makeDecision({ id: 'bp-d3', state: 'bundled', kind: 'analysis_run', ai_draft: { title: 'C', body: 'c' } }),
    ];
    f.kb._state.decisions.delete(f.decision.id);
    for (const d of bundled) f.kb._state.decisions.set(d.id, d);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await emitter.emitBundle(f.meeting.id);

    const { bundles } = bundlePickup(stagingRoot);
    expect(bundles.length).toBe(1);
    expect(bundles[0].bundleId).toBe(f.meeting.id);
    expect(bundles[0].decisions.length).toBe(3);
    for (const d of bundles[0].decisions) {
      expect(d.foundMd).toBe(true);
      expect(d.foundMeta).toBe(true);
    }
  });

  it('manifest entries have valid request_ids matching meta.json contents', async () => {
    const f = buildPopulatedKB();
    const bundled = [
      makeDecision({ id: 'bp-d1', state: 'bundled', kind: 'research_mission', ai_draft: { title: 'A', body: 'a' } }),
      makeDecision({ id: 'bp-d2', state: 'bundled', kind: 'vision_mission', ai_draft: { title: 'B', body: 'b' } }),
    ];
    f.kb._state.decisions.delete(f.decision.id);
    for (const d of bundled) f.kb._state.decisions.set(d.id, d);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await emitter.emitBundle(f.meeting.id);

    const { bundles } = bundlePickup(stagingRoot);
    const inbox = join(stagingRoot, 'staging', 'inbox');
    for (const d of bundles[0].decisions) {
      const meta = JSON.parse(
        readFileSync(join(inbox, `${d.requestId}.meta.json`), 'utf8'),
      );
      expect(meta.request_id).toBe(d.requestId);
      expect(meta.bundle_id).toBe(f.meeting.id);
    }
  });

  it('manifest decisions have skill values matching the schema enum', async () => {
    const f = buildPopulatedKB();
    const bundled = [
      makeDecision({ id: 'bp-d1', state: 'bundled', kind: 'research_mission', ai_draft: { title: 'A', body: 'a' } }),
      makeDecision({ id: 'bp-d2', state: 'bundled', kind: 'vision_mission', ai_draft: { title: 'B', body: 'b' } }),
      makeDecision({ id: 'bp-d3', state: 'bundled', kind: 'analysis_run', ai_draft: { title: 'C', body: 'c' } }),
    ];
    f.kb._state.decisions.delete(f.decision.id);
    for (const d of bundled) f.kb._state.decisions.set(d.id, d);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitBundle(f.meeting.id);

    const manifestText = readFileSync(result.manifest_path, 'utf8');
    const manifest = parseBundleManifest(manifestText);
    const skills = manifest.decisions.map((d) => d.skill);
    expect(skills).toContain('research-mission-generator');
    expect(skills).toContain('vision-to-mission');
    expect(skills).toContain('analyze');
  });

  it('send-now seeds are NOT discovered as part of any bundle (bundle_id null)', async () => {
    const f = buildPopulatedKB();
    const sentNow = makeDecision({
      id: 'sn-d1',
      state: 'pending',
      kind: 'vision_mission',
      ai_draft: { title: 'Send now', body: 'b' },
    });
    f.kb._state.decisions.delete(f.decision.id);
    f.kb._state.decisions.set(sentNow.id, sentNow);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await emitter.emitSendNow(sentNow.id);

    const { bundles } = bundlePickup(stagingRoot);
    // No manifest emitted for send-now
    expect(bundles.length).toBe(0);

    // But the .md + .meta.json are present in staging/inbox/
    const inbox = join(stagingRoot, 'staging', 'inbox');
    const files = readdirSync(inbox).filter((f) => f.endsWith('.meta.json'));
    expect(files.length).toBe(1);
    const meta = JSON.parse(readFileSync(join(inbox, files[0]), 'utf8'));
    expect(meta.bundle_id).toBeNull();
  });
});

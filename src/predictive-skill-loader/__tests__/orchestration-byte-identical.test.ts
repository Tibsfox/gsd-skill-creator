/**
 * CAPCOM Gate G12 — orchestration byte-identical preservation test.
 *
 * The critical hard-preservation test for Phase 770 (UIP-18 T2b Predictive
 * Skill Auto-Loader). Enumerates every file under `src/orchestration/`,
 * hashes each with SHA-256 to capture a baseline, exercises the predictive-
 * skill-loader public surface (with the flag both off and on, against
 * synthetic fixtures so no .college disk read leaks orchestration changes),
 * and re-hashes. The two hash maps MUST be identical.
 *
 * Additionally, a structural check confirms `src/predictive-skill-loader/`
 * imports nothing from `src/orchestration/` except (optionally) type-only
 * imports. The current implementation imports zero orchestration files.
 *
 * @module predictive-skill-loader/__tests__/orchestration-byte-identical
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  loadCollegeGraph,
  buildLinkFormationModel,
  predictLinks,
  predictNextSkills,
  predictNextSkillsWithMeta,
  prewarmCache,
  NoopPreWarmHook,
  type InMemoryConcept,
} from '../index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function walkAllFiles(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir);
    entries.sort();
    for (const name of entries) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        stack.push(p);
      } else if (st.isFile()) {
        out.push(p);
      }
    }
  }
  out.sort();
  return out;
}

function hashFile(path: string): string {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

function snapshotDir(dir: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of walkAllFiles(dir)) m.set(f, hashFile(f));
  return m;
}

const ORCH_DIR = join(process.cwd(), 'src', 'orchestration');
const PSL_DIR = join(process.cwd(), 'src', 'predictive-skill-loader');

const FIXTURE: InMemoryConcept[] = [
  { id: 'a', domain: 'd', relationships: [{ targetId: 'b' }, { targetId: 'c' }] },
  { id: 'b', domain: 'd', relationships: [{ targetId: 'd' }] },
  { id: 'c', domain: 'd', relationships: [{ targetId: 'e' }] },
  { id: 'd', domain: 'd', relationships: [] },
  { id: 'e', domain: 'd', relationships: [] },
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('orchestration byte-identical preservation (CAPCOM Gate G12)', () => {
  let preSnapshot: Map<string, string>;

  beforeAll(() => {
    preSnapshot = snapshotDir(ORCH_DIR);
    expect(preSnapshot.size).toBeGreaterThan(0);
  });

  afterAll(() => {
    const post = snapshotDir(ORCH_DIR);
    expect(post.size).toBe(preSnapshot.size);
    for (const [path, hash] of preSnapshot.entries()) {
      expect(post.get(path)).toBe(hash);
    }
  });

  it('enumerates a non-empty src/orchestration/ tree at baseline', () => {
    expect(preSnapshot.size).toBeGreaterThan(0);
    const names = Array.from(preSnapshot.keys()).map((p) =>
      p.replace(ORCH_DIR, ''),
    );
    expect(names.some((n) => n.endsWith('selector.ts'))).toBe(true);
    expect(names.some((n) => n.endsWith('index.ts'))).toBe(true);
  });

  it('exercises the predictive-skill-loader surface (flag off via no config)', async () => {
    // Use a non-existent settings path so the flag is guaranteed false even
    // if the host repo has the live config enabled.
    const off = await predictNextSkillsWithMeta(
      'a',
      {},
      { settingsPath: '/__nonexistent__/settings.json' },
    );
    expect(off.disabled).toBe(true);
    expect(off.predictions).toEqual([]);

    // Flag-on path with explicit config override + in-memory graph.
    const graph = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const model = buildLinkFormationModel(graph, { hops: 2, decay: 0.5 });
    const on = await predictNextSkillsWithMeta(
      'a',
      {},
      { config: { enabled: true, topK: 5, hops: 2, decay: 0.5 }, model },
    );
    expect(on.disabled).toBe(false);
    expect(on.predictions.length).toBeGreaterThan(0);
  });

  it('cache-prewarmer issues zero preloads when hook is null (flag off contract)', async () => {
    const n = await prewarmCache([], null);
    expect(n).toBe(0);
  });

  it('cache-prewarmer round-trip through NoopPreWarmHook does not touch orchestration', async () => {
    const hook = new NoopPreWarmHook(true);
    const graph = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const model = buildLinkFormationModel(graph, { hops: 2, decay: 0.5 });
    const preds = predictLinks(model, 'a', {}, 5);
    const n = await prewarmCache(preds, hook);
    expect(n).toBeGreaterThan(0);
  });

  it('predictNextSkills returns [] when flag off', async () => {
    const result = await predictNextSkills(
      'a',
      {},
      { settingsPath: '/__nonexistent__/settings.json' },
    );
    expect(result).toEqual([]);
  });

  it('confirms src/predictive-skill-loader/ does not import src/orchestration/ runtime', () => {
    // Walk our own module and assert no non-type-only import from orchestration.
    const files = walkAllFiles(PSL_DIR).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
    );
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      // Match any `import ... from '..../orchestration/...';` line.
      // Allow `import type ...` only.
      const rx = /^\s*import\s+(?!type\b)[^;]*from\s+['"][^'"]*orchestration[^'"]*['"]/gm;
      const matches = text.match(rx);
      if (matches && matches.length > 0) {
        throw new Error(
          `Non-type orchestration import detected in ${f}:\n  ${matches.join(
            '\n  ',
          )}`,
        );
      }
    }
  });

  it('confirms src/predictive-skill-loader/ does not import src/dacp or src/capcom', () => {
    const files = walkAllFiles(PSL_DIR).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
    );
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      const rx = /from\s+['"][^'"]*\/(dacp|capcom)\b/g;
      const matches = text.match(rx);
      expect(matches, `${f} must not import dacp/capcom`).toBeNull();
    }
  });

  it('hashes src/orchestration/ before and after exercising the surface', async () => {
    const graph = loadCollegeGraph({ inMemoryConcepts: FIXTURE });
    const model = buildLinkFormationModel(graph, { hops: 2, decay: 0.5 });
    predictLinks(model, 'a', { recentSkills: ['c'] }, 5);
    await prewarmCache(predictLinks(model, 'a', {}, 3), new NoopPreWarmHook(true));
    const post = snapshotDir(ORCH_DIR);
    expect(post.size).toBe(preSnapshot.size);
    for (const [path, hash] of preSnapshot.entries()) {
      expect(post.get(path)).toBe(hash);
    }
  });
});

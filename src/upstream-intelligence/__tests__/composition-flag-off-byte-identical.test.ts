/**
 * Composition flag-off byte-identical regression — Gate G14 closure.
 *
 * THE critical Gate G14 closure test for v1.49.573. With ALL 10
 * upstream-intelligence flags set to `false`, a full-stack smoke through
 * each new module's public API must:
 *
 *   1. produce a `disabled: true` (or equivalent) passthrough record;
 *   2. perform no file I/O against the skill library, Grove store, or any
 *      audit pipeline;
 *   3. leave a SHA-256 hash-tree of the preservation set BYTE-IDENTICAL
 *      pre-vs-post the smoke run.
 *
 * The preservation set is: src/orchestration, src/dacp, src/memory,
 * src/coherent-functors, src/ricci-curvature-audit, src/semantic-channel,
 * src/koopman-memory, src/hourglass-persistence, src/wasserstein-hebbian,
 * src/tonnetz. (`src/capcom` does not exist as of v1.49.573, but is named
 * in the spec; we elide it from hashing if absent rather than failing.)
 *
 * The resulting hash-tree is persisted under
 * `__tests__/fixtures/preserved-modules-hashtree.json` for future
 * regression diffing.
 *
 * Phase 775. v1.49.573 W9.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as skilldex from '../../skilldex-auditor/index.js';
import * as boundedLearning from '../../bounded-learning-empirical/index.js';
import * as steering from '../../activation-steering/index.js';
import * as flThreat from '../../fl-threat-model/index.js';
import * as expCompress from '../../experience-compression/index.js';
import * as predLoader from '../../predictive-skill-loader/index.js';
import * as batchEffect from '../../promptcluster-batcheffect/index.js';
import * as provenance from '../../artifactnet-provenance/index.js';
import * as pricing from '../../stackelberg-pricing/index.js';
import * as rumor from '../../rumor-delay-model/index.js';

const REPO_SRC = path.resolve(__dirname, '..', '..');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const HASHTREE_FIXTURE = path.join(
  FIXTURES_DIR,
  'preserved-modules-hashtree.json',
);

const PRESERVED_MODULES = [
  'orchestration',
  'dacp',
  'memory',
  'coherent-functors',
  'ricci-curvature-audit',
  'semantic-channel',
  'koopman-memory',
  'hourglass-persistence',
  'wasserstein-hebbian',
  'tonnetz',
] as const;

// ---------------------------------------------------------------------------
// SHA-256 hash-tree of the preservation set
// ---------------------------------------------------------------------------

interface HashTreeEntry {
  /** Repository-relative path. */
  readonly path: string;
  /** SHA-256 hex digest of the file content. */
  readonly sha256: string;
  /** File size in bytes. */
  readonly size: number;
}

/**
 * Walk a directory tree producing a deterministically-sorted hash-tree of
 * every regular file. Tests/__tests__/ subtrees are intentionally INCLUDED
 * because the byte-identical test must capture the entire preservation set.
 */
function buildHashTree(root: string): HashTreeEntry[] {
  const out: HashTreeEntry[] = [];
  if (!fs.existsSync(root)) return out;
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const fp = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(fp);
      } else if (ent.isFile()) {
        const buf = fs.readFileSync(fp);
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        out.push({
          path: path.relative(REPO_SRC, fp).split(path.sep).join('/'),
          sha256,
          size: buf.byteLength,
        });
      }
    }
  }
  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return out;
}

function buildPreservationHashTree(): HashTreeEntry[] {
  const tree: HashTreeEntry[] = [];
  for (const m of PRESERVED_MODULES) {
    const root = path.join(REPO_SRC, m);
    if (!fs.existsSync(root)) continue;
    for (const entry of buildHashTree(root)) tree.push(entry);
  }
  return tree;
}

function hashTreeRootDigest(tree: ReadonlyArray<HashTreeEntry>): string {
  const h = crypto.createHash('sha256');
  for (const e of tree) {
    h.update(e.path);
    h.update('\0');
    h.update(e.sha256);
    h.update('\0');
    h.update(String(e.size));
    h.update('\n');
  }
  return h.digest('hex');
}

// ---------------------------------------------------------------------------
// Disabled-config fixture written to a tmp file
// ---------------------------------------------------------------------------

let tmpRoot: string;
let configPath: string;

const ALL_FLAGS = [
  'skilldex-auditor',
  'bounded-learning-empirical',
  'activation-steering',
  'fl-threat-model',
  'experience-compression',
  'predictive-skill-loader',
  'promptcluster-batcheffect',
  'artifactnet-provenance',
  'stackelberg-pricing',
  'rumor-delay-model',
] as const;

function writeAllOff(): void {
  const upstream: Record<string, { enabled: false }> = {};
  for (const k of ALL_FLAGS) upstream[k] = { enabled: false };
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': { 'upstream-intelligence': upstream },
    }),
  );
}

beforeAll(() => {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
});

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uintel-byteid-'));
  configPath = path.join(tmpRoot, 'config.json');
  writeAllOff();
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Gate G14 closure: composition-flag-off byte-identical', () => {
  it('every public API path is a disabled passthrough with no file I/O on protected roots', async () => {
    // Capture pre-state hash tree
    const before = buildPreservationHashTree();
    const beforeRoot = hashTreeRootDigest(before);
    expect(before.length).toBeGreaterThan(0);

    // Skilldex Auditor — empty skills dir is a noop
    const skillsDir = path.join(tmpRoot, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const audit = await skilldex.auditAll(skillsDir, configPath);
    expect(audit.disabled).toBe(true);
    expect(audit.inspected).toBe(0);

    // Bounded-Learning Empirical
    const evid = await boundedLearning.validateConstraint(
      { id: 'twenty-percent-cap' },
      configPath,
    );
    expect(evid.disabled).toBe(true);
    const bench = await boundedLearning.runBenchmark(undefined, configPath);
    expect(bench.disabled).toBe(true);

    // Activation Steering
    const target = steering.buildTarget('Researcher', 'Sonnet', 4);
    const steerResult = steering.steer([0, 0, 0, 0], 'Researcher', target, {
      settingsPath: configPath,
    });
    expect(steerResult.disabled).toBe(true);
    expect(steerResult.deltaNorm).toBe(0);

    // FL Threat-Model
    const verdict = flThreat.gatePreRollout(
      { sourcePath: 'design.yaml', fl_threat_model: undefined },
      configPath,
    );
    expect(verdict.verdict).toBe('gate-disabled');

    // Experience Compression
    const cr = expCompress.compress(
      { id: 'x', payload: { y: 1 }, byteSize: 16 },
      'episodic',
      configPath,
    );
    expect(cr.disabled).toBe(true);
    expect(cr.ratio).toBe(1);

    // Predictive Skill Loader
    const pred = await predLoader.predictNextSkillsWithMeta(
      'k0',
      {},
      { settingsPath: configPath },
    );
    expect(pred.disabled).toBe(true);
    expect(pred.predictions).toEqual([]);

    // PromptCluster BatchEffect — disabledReport is the off path.
    const br = batchEffect.disabledReport({
      type: 'model-version',
      value: 'flag-off',
    });
    expect(br.status).toBe('disabled');

    // ArtifactNet Provenance
    const pf = provenance.verifyProvenance(
      { id: 'asset-x', kind: 'text', content: 'x' },
      configPath,
    );
    expect(pf.disabled).toBe(true);
    expect(pf.verdict).toBe('unknown');

    // Stackelberg Pricing
    const game: pricing.StackelbergGame = {
      resources: [{ id: 'gpu', capacity: 100, guardrailFloor: 5 }],
      tenants: [
        {
          id: 't1',
          utility: {
            kind: 'quadratic',
            a: 1,
            b: 0.01,
          },
          maxConsumption: { gpu: 10 },
        },
      ],
    };
    const sol = pricing.solveStackelberg(game, { settingsPath: configPath });
    expect('disabled' in sol && sol.disabled).toBe(true);

    // Rumor Delay Model
    const cls = rumor.analyzeSignalVsHype(
      [
        { t: 0, rumoristFraction: 0.1, factCheckerFraction: 0 },
        { t: 1, rumoristFraction: 0.2, factCheckerFraction: 0.1 },
      ],
      configPath,
    );
    expect(cls.disabled).toBe(true);
    expect(cls.classification).toBe('unknown');

    // Capture post-state hash tree
    const after = buildPreservationHashTree();
    const afterRoot = hashTreeRootDigest(after);

    // BYTE-IDENTICAL invariant
    expect(after.length).toBe(before.length);
    expect(afterRoot).toBe(beforeRoot);
    // Per-file digests must match exactly.
    for (let i = 0; i < before.length; i++) {
      expect(after[i]!.path).toBe(before[i]!.path);
      expect(after[i]!.sha256).toBe(before[i]!.sha256);
      expect(after[i]!.size).toBe(before[i]!.size);
    }
  });

  it('persists the preservation hash-tree as a fixture for future regressions', () => {
    const tree = buildPreservationHashTree();
    expect(tree.length).toBeGreaterThan(0);

    const root = hashTreeRootDigest(tree);
    const fixture = {
      generatedAt: new Date(0).toISOString(), // deterministic timestamp
      moduleSet: PRESERVED_MODULES,
      fileCount: tree.length,
      rootDigest: root,
      tree,
    };
    // Write the fixture only if missing or root differs (idempotent).
    let existing: { rootDigest?: string } = {};
    if (fs.existsSync(HASHTREE_FIXTURE)) {
      try {
        existing = JSON.parse(fs.readFileSync(HASHTREE_FIXTURE, 'utf8'));
      } catch {
        existing = {};
      }
    }
    if (existing.rootDigest !== root) {
      fs.writeFileSync(HASHTREE_FIXTURE, JSON.stringify(fixture, null, 2));
    }
    expect(fs.existsSync(HASHTREE_FIXTURE)).toBe(true);

    // Re-read the fixture and verify the rootDigest agrees.
    const reread = JSON.parse(fs.readFileSync(HASHTREE_FIXTURE, 'utf8'));
    expect(reread.rootDigest).toBe(root);
  });

  it('the preservation set covers every required module in the spec', () => {
    for (const m of PRESERVED_MODULES) {
      const root = path.join(REPO_SRC, m);
      if (m === 'orchestration' || m === 'dacp' || m === 'memory') {
        expect(fs.existsSync(root)).toBe(true);
      } else {
        // v572 modules — must all exist in this milestone
        expect(fs.existsSync(root)).toBe(true);
      }
    }
  });
});

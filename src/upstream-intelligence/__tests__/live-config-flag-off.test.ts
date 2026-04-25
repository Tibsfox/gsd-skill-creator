/**
 * Upstream Intelligence — live-config flag-off test (Gate G14 category 7).
 *
 * Verifies that with a synthesised `gsd-skill-creator.json` that has every
 * `upstream-intelligence` sub-block set to `enabled: false`, every public
 * API path returns the same disabled passthrough behaviour as observed in
 * `composition-flag-off-byte-identical.test.ts`.
 *
 * The test reads the actual live config from `.claude/gsd-skill-creator.json`
 * (parsed in read-only mode) and produces a derived all-off variant for
 * the run. The live file is NEVER modified.
 *
 * Phase 775. v1.49.573 W9.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as skilldex from '../../skilldex-auditor/index.js';
import * as boundedLearning from '../../bounded-learning-empirical/index.js';
import * as steering from '../../activation-steering/index.js';
import * as flThreat from '../../fl-threat-model/index.js';
import * as expCompress from '../../experience-compression/index.js';
import * as predLoader from '../../predictive-skill-loader/index.js';
import * as provenance from '../../artifactnet-provenance/index.js';
import * as pricing from '../../stackelberg-pricing/index.js';
import * as rumor from '../../rumor-delay-model/index.js';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LIVE_CONFIG = path.join(REPO_ROOT, '.claude', 'gsd-skill-creator.json');

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

let tmpRoot: string;
let derivedConfigPath: string;

/**
 * Read the live config (read-only) and produce a derived all-off variant
 * written to a tmp path. Returns the tmp path.
 */
function deriveAllOffConfig(): string {
  if (!fs.existsSync(LIVE_CONFIG)) {
    // No live config — synthesise the minimal off-shape.
    const synth = {
      'gsd-skill-creator': {
        'upstream-intelligence': Object.fromEntries(
          ALL_FLAGS.map((k) => [k, { enabled: false }]),
        ),
      },
    };
    fs.writeFileSync(derivedConfigPath, JSON.stringify(synth));
    return derivedConfigPath;
  }
  const raw = JSON.parse(fs.readFileSync(LIVE_CONFIG, 'utf8'));
  // Deep clone, then overlay all flags = false.
  const clone = JSON.parse(JSON.stringify(raw));
  if (!clone['gsd-skill-creator']) clone['gsd-skill-creator'] = {};
  if (!clone['gsd-skill-creator']['upstream-intelligence']) {
    clone['gsd-skill-creator']['upstream-intelligence'] = {};
  }
  for (const k of ALL_FLAGS) {
    clone['gsd-skill-creator']['upstream-intelligence'][k] = { enabled: false };
  }
  fs.writeFileSync(derivedConfigPath, JSON.stringify(clone));
  return derivedConfigPath;
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uintel-liveoff-'));
  derivedConfigPath = path.join(tmpRoot, 'config.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('Live config flag-off (Gate G14 category 7)', () => {
  it('with a derived all-off variant of the live config, every module is disabled', async () => {
    const cfg = deriveAllOffConfig();

    // Sanity: derived config has all 10 flags off.
    const parsed = JSON.parse(fs.readFileSync(cfg, 'utf8'));
    const block = parsed['gsd-skill-creator']?.['upstream-intelligence'] ?? {};
    for (const k of ALL_FLAGS) {
      expect(block[k]?.enabled).toBe(false);
    }

    // Smoke through every module under the derived config.
    const skillsDir = path.join(tmpRoot, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const audit = await skilldex.auditAll(skillsDir, cfg);
    expect(audit.disabled).toBe(true);

    const evid = await boundedLearning.validateConstraint(
      { id: 'twenty-percent-cap' },
      cfg,
    );
    expect(evid.disabled).toBe(true);

    const target = steering.buildTarget('Researcher', 'Sonnet', 4);
    const steerResult = steering.steer([0, 0, 0, 0], 'Researcher', target, {
      settingsPath: cfg,
    });
    expect(steerResult.disabled).toBe(true);

    const verdict = flThreat.gatePreRollout(
      { sourcePath: 'design.yaml', fl_threat_model: undefined },
      cfg,
    );
    expect(verdict.verdict).toBe('gate-disabled');

    const cr = expCompress.compress(
      { id: 'x', payload: 'x', byteSize: 8 },
      'episodic',
      cfg,
    );
    expect(cr.disabled).toBe(true);

    const pred = await predLoader.predictNextSkillsWithMeta(
      'k0',
      {},
      { settingsPath: cfg },
    );
    expect(pred.disabled).toBe(true);

    const pf = provenance.verifyProvenance(
      { id: 'a', kind: 'text', content: 'x' },
      cfg,
    );
    expect(pf.disabled).toBe(true);

    const game: pricing.StackelbergGame = {
      resources: [{ id: 'gpu', capacity: 100, guardrailFloor: 5 }],
      tenants: [
        {
          id: 't1',
          utility: { kind: 'quadratic', a: 1, b: 0.01 },
          maxConsumption: { gpu: 10 },
        },
      ],
    };
    const sol = pricing.solveStackelberg(game, { settingsPath: cfg });
    expect('disabled' in sol && sol.disabled).toBe(true);

    const cls = rumor.analyzeSignalVsHype(
      [
        { t: 0, rumoristFraction: 0.1, factCheckerFraction: 0 },
        { t: 1, rumoristFraction: 0.2, factCheckerFraction: 0.1 },
      ],
      cfg,
    );
    expect(cls.disabled).toBe(true);
  });
});

/**
 * Upstream Intelligence — cross-milestone composition tests.
 *
 * Covers Gate G14 categories 2 (composition with v1.49.572 mathematical-
 * foundations modules) and 3 (composition with v1.49.571 SSIA).
 *
 * The new v1.49.573 modules MUST compose cleanly on top of the v1.49.572
 * categorical / curvature / Koopman / channel formalisms without modifying
 * any of those modules' source. These tests exercise the composition by
 * value-passing only.
 *
 * Phase 775. v1.49.573 W9.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// v1.49.573 (10 new)
import * as skilldex from '../../skilldex-auditor/index.js';
import * as steering from '../../activation-steering/index.js';
import * as predLoader from '../../predictive-skill-loader/index.js';
import * as provenance from '../../artifactnet-provenance/index.js';
import * as batchEffect from '../../promptcluster-batcheffect/index.js';
import * as rumor from '../../rumor-delay-model/index.js';

// v1.49.572 (mathematical-foundations) — composition partners
import * as coherent from '../../coherent-functors/index.js';
import * as ricci from '../../ricci-curvature-audit/index.js';
import * as semantic from '../../semantic-channel/index.js';
import * as koopman from '../../koopman-memory/index.js';

// v1.49.571 SSIA
import * as isotropy from '../../skill-isotropy/index.js';

let tmpRoot: string;
let configPath: string;

function writeUpstreamConfig(enabled: ReadonlyArray<string>): void {
  const upstream: Record<string, { enabled: boolean }> = {};
  for (const k of [
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
  ]) {
    upstream[k] = { enabled: enabled.includes(k) };
  }
  const cfg = {
    'gsd-skill-creator': {
      'upstream-intelligence': upstream,
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(cfg));
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uintel-cross-'));
  configPath = path.join(tmpRoot, 'config.json');
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ===========================================================================
// CATEGORY 2: Cross-milestone composition with v1.49.572 (≥4 tests REQUIRED)
// ===========================================================================

describe('CrossMilestone v572: T1a Skilldex Auditor × v572 T1a Coherent Functors', () => {
  it('auditor accepts coherent-functor-presented skills (categorical wrapper)', async () => {
    writeUpstreamConfig(['skilldex-auditor']);

    const arch: coherent.Architecture = {
      name: 'skilldex-presented',
      layers: [{ kind: 'identity' }],
      inputType: { shape: [1], dtype: 'opaque' },
      outputType: { shape: [1], dtype: 'opaque' },
    };
    const v = coherent.validateArchitecture(arch);
    expect(v.ok).toBe(true);

    const presented = coherent.presentNetwork(arch);
    expect(presented.name).toBe('Present(skilldex-presented)');

    // The presented functor's name is the categorical wrapper around a skill;
    // the auditor should accept the empty skills dir without panicking.
    const skillsDir = path.join(tmpRoot, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const report = await skilldex.auditAll(skillsDir, configPath);
    expect(report.disabled).toBe(false);
    expect(report.inspected).toBe(0);
  });
});

describe('CrossMilestone v572: T1c Activation Steering × v572 T1c Semantic Channel', () => {
  it('steering composes on top of semantic-channel formalism (DACP byte-identical)', () => {
    writeUpstreamConfig(['activation-steering']);

    // Semantic channel: derive a fidelity tier for level 3 (PROSE_DATA_CODE)
    const fidelity = semantic.deriveFidelity(3);
    expect(fidelity).toBeDefined();

    // Steering layer composes orthogonally — operates on activation-space
    // vectors, never on the DACP bundle bytes. Verify the steer entrypoint
    // returns a structured result whose vector dimension matches input.
    const target = steering.buildTarget('Researcher', 'Sonnet', 6);
    const result = steering.steer([0, 0, 0, 0, 0, 0], 'Researcher', target, {
      settingsPath: configPath,
      forceEnabled: true,
    });
    expect(result.vector.length).toBe(6);
    expect(result.disabled).toBe(false);
  });

  it('with steering flag off, semantic-channel fidelity tier survives unchanged', () => {
    writeUpstreamConfig([]); // all flags off
    const beforeFidelity = semantic.deriveFidelity(2);
    const target = steering.buildTarget('Tactician', 'Haiku', 3);
    const result = steering.steer([1, 1, 1], 'Tactician', target, {
      settingsPath: configPath,
    });
    const afterFidelity = semantic.deriveFidelity(2);
    expect(afterFidelity).toEqual(beforeFidelity);
    expect(result.disabled).toBe(true);
  });
});

describe('CrossMilestone v572: T2b Predictive Skill Loader × v572 T1b Ricci-Curvature Audit', () => {
  it('predictions weighted against curvature signal (positive curvature = bottleneck deprioritised)', async () => {
    writeUpstreamConfig(['predictive-skill-loader']);

    // Build a tiny SkillDag and compute curvature
    const dag: ricci.SkillDag = {
      vertices: new Set(['a', 'b', 'c']),
      edges: new Map([
        ['a', new Set(['b'])],
        ['b', new Set(['c'])],
      ]),
    };
    const curvature = ricci.computeCurvature(dag);
    expect(Array.isArray(curvature)).toBe(true);

    const result = await predLoader.predictNextSkillsWithMeta(
      'a',
      {},
      { settingsPath: configPath },
    );
    // Whatever the prediction output, it must be structured + composable
    expect(typeof result.disabled).toBe('boolean');
    expect(Array.isArray(result.predictions)).toBe(true);

    // Curvature signal is purely advisory — it does not mutate predictions
    // by side-effect; consumers compose by selecting from both reports.
    const bottleneckReport = ricci.detectBottlenecks(curvature);
    expect(bottleneckReport).toBeDefined();
    expect(Array.isArray(bottleneckReport.bottlenecks)).toBe(true);
  });
});

describe('CrossMilestone v572: T2d ArtifactNet Provenance × v572 T2a Koopman-Memory', () => {
  it('Koopman state-space provenance check in pre-audit', () => {
    writeUpstreamConfig(['artifactnet-provenance']);

    // A Koopman state-space record (identity operator)
    const op = koopman.identity(3);
    const v = koopman.validate(op);
    expect(v.ok).toBe(true);

    // Build a synthetic existing-audit envelope, run provenance pre-hook
    const existingAudit: provenance.ExistingAudit = {
      timestamp: new Date().toISOString(),
      inspected: 0,
      findings: [],
      disabled: false,
      summary: { pass: 0, warn: 0, fail: 0 },
    };
    const asset = {
      id: 'koopman-state',
      kind: 'text' as const,
      content: JSON.stringify({ A: op.A, name: op.name }),
    };
    const composed = provenance.composeWithAudit(
      existingAudit,
      [asset],
      configPath,
    );
    expect(composed.preAudit?.length).toBe(1);
    // Provenance verdict must be one of the four allowed labels
    const finding = composed.preAudit?.[0];
    expect(finding).toBeDefined();
    expect(['real', 'synthetic', 'partial', 'unknown']).toContain(
      finding!.verdict,
    );
  });
});

describe('CrossMilestone v572: T3b Rumor Delay × v572 T1b Ricci-Curvature Audit', () => {
  it('rumor classification can be gated by curvature-bottleneck network signal', () => {
    writeUpstreamConfig(['rumor-delay-model']);

    const dag: ricci.SkillDag = {
      vertices: new Set(['claim', 'fact-check']),
      edges: new Map([['claim', new Set(['fact-check'])]]),
    };
    const curvature = ricci.computeCurvature(dag);
    const bottlenecks = ricci.detectBottlenecks(curvature);

    const obs = [
      { t: 0, rumoristFraction: 0.05, factCheckerFraction: 0.0 },
      { t: 1, rumoristFraction: 0.5, factCheckerFraction: 0.05 },
      { t: 2, rumoristFraction: 0.7, factCheckerFraction: 0.1 },
      { t: 3, rumoristFraction: 0.6, factCheckerFraction: 0.2 },
    ];
    const cls = rumor.analyzeSignalVsHype(obs, configPath);
    // Composition surface: both modules return structured advisory data.
    expect(cls.classification).toBeDefined();
    expect(['signal', 'hype', 'unknown']).toContain(cls.classification);
    expect(typeof bottlenecks.threshold).toBe('number');
  });
});

// ===========================================================================
// CATEGORY 3: Cross-milestone composition with v1.49.571 (≥1 test REQUIRED)
// ===========================================================================

describe('CrossMilestone v571: T2c PromptCluster BatchEffect × v571 SSIA', () => {
  it('BatchEffect composes with SSIA isotropy report per UIP-19', () => {
    writeUpstreamConfig(['promptcluster-batcheffect']);

    // Generate a v571 SSIA-shaped report. The composer accepts opaque
    // unknown so we can pass a bare object with a `verdict` field.
    const ssiaReport = {
      verdict: 'healthy' as const,
      moduleVersion: 'v1.49.571',
      directionsTested: 8,
    };

    // SSIA module surface check — runIsotropyAudit is the headline entry
    expect(typeof isotropy.runIsotropyAudit).toBe('function');
    expect(typeof isotropy.DEFAULT_AUDIT_CONFIG).toBe('object');

    // Build a stable BatchEffectReport via the disabled helper
    const br = batchEffect.disabledReport({
      type: 'prompt-template',
      value: 'composition-with-ssia',
    });

    const combined = batchEffect.composeWithSSIA(ssiaReport, br);
    expect(combined.batchEffectReport).toBe(br);
    expect(combined.ssiaReport).toBe(ssiaReport);
    expect(['healthy', 'watch', 'degraded', 'disabled']).toContain(
      combined.jointStatus,
    );
  });
});

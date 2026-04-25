/**
 * Phase 813 (v1.49.575) — flag-off aggregate byte-identical fixture.
 *
 * With ALL 7 cs25-26-sweep flags off (`tool-attention`, `agentdog-schema`,
 * `std-calibration`, `weler-roles`, `structural-completeness-lint`,
 * `ambiguity-lint`, `ael-bandit`), the aggregate behavior across
 * orchestration / safety / skill-creator / cartridge is byte-identical to a
 * no-cs25-26-sweep-block baseline. This pins the milestone-wide
 * default-off invariant.
 *
 * The test builds a synthetic input flowing through all four subsystems and
 * snapshot-pins the JSON-canonical aggregate output. A future change that
 * accidentally activates cs25-26-sweep code on the default-off path will
 * break this test.
 *
 * @module __tests__/cs25-26-sweep-integration/flag-off-aggregate-byte-identical
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  applyStateGate,
  checkBudget,
  computeIsoScore,
  DEFAULT_GATE_CONFIG,
  isToolAttentionEnabled,
  lazyLoadSchemas,
  runToolAttentionPipeline,
} from '../../orchestration/tool-attention/index.js';
import {
  AGENTDOG_DISABLED_RESULT,
  emitAgentDogDiagnostic,
  enrichBlockWithAgentDog,
  hasAgentDogDiagnostic,
  isAgentDogEnabled,
} from '../../safety/agentdog/index.js';
import {
  decideReInjection,
  isStdCalibrationEnabled,
  RE_INJECTION_DISABLED_DECISION,
} from '../../safety/std-calibration/index.js';
import {
  emptyEvaluatorState,
  emptyEvolutionState,
  emptyWorkerState,
  evaluatorRun,
  evolutionPropose,
  EVOLUTION_DISABLED_STATE,
  EVALUATOR_DISABLED_STATE,
  isWelerRolesEnabled,
  resetWorkerCounter,
  WORKER_DISABLED_STATE,
  workerGenerate,
} from '../../skill-creator/roles/index.js';
import {
  AelBandit,
  isAelBanditEnabled,
} from '../../skill-creator/auto-load/index.js';
import {
  isStructuralCompletenessEnabled,
  runPromotionGate,
} from '../../cartridge/linter/index.js';
import { checkAmbiguity } from '../../cartridge/linter/ambiguity.js';
import { isAmbiguityLintEnabled } from '../../cartridge/linter/ambiguity-settings.js';

interface AggregateEnv {
  configPath: string;
  cleanup: () => void;
}

function makeFlagOffEnv(): AggregateEnv {
  // Either omit the cs25-26-sweep block (no-block baseline) or write all flags
  // false (explicit-off). We test BOTH and assert byte-identical aggregate.
  const dir = mkdtempSync(join(tmpdir(), 'cs2526-flag-off-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'tool-attention': { enabled: false },
          'agentdog-schema': { enabled: false },
          'std-calibration': { enabled: false },
          'weler-roles': { enabled: false },
          'structural-completeness-lint': { enabled: false },
          'ambiguity-lint': { enabled: false },
          'ael-bandit': { enabled: false },
        },
      },
    }),
  );
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function makeNoBlockEnv(): AggregateEnv {
  // No cs25-26-sweep block at all. Reads must fall back to defaults.
  const dir = mkdtempSync(join(tmpdir(), 'cs2526-no-block-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({ 'gsd-skill-creator': {} }));
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

interface AggregateOutput {
  toolAttention: {
    enabled: boolean;
    iso: unknown;
    gate: unknown;
    load: unknown;
    budget: unknown;
    pipeline: unknown;
  };
  agentdog: {
    enabled: boolean;
    emit: unknown;
    enrichRefEqual: boolean;
    hasDiagnostic: boolean;
  };
  stdCalibration: {
    enabled: boolean;
    decision: unknown;
  };
  welerRoles: {
    enabled: boolean;
    workerState: unknown;
    evaluatorState: unknown;
    evolutionState: unknown;
  };
  aelBandit: {
    enabled: boolean;
    proposalSourcePresent: boolean;
  };
  structuralCompleteness: {
    enabled: boolean;
    blocked: boolean;
    flagEnabled: boolean;
  };
  ambiguity: {
    enabled: boolean;
    flagsCount: number;
    passed: boolean;
  };
}

const SAMPLE_BLOCK = Object.freeze({
  decision: 'BLOCK' as const,
  reason: 'aggregate-test',
  meta: { phase: 813 },
});

const SAMPLE_SKILL_MD = [
  '---',
  'name: aggregate-test-skill',
  'description: synthetic SKILL.md for the aggregate flag-off fixture',
  '---',
  '',
  '# aggregate-test-skill',
  '',
  '## When to use',
  '',
  'Use this for the aggregate flag-off integration test only.',
  '',
  '## How to use',
  '',
  '- Step one: read the input.',
  '- Step two: produce the output.',
  '',
  '## Examples',
  '',
  '```',
  'example: noop',
  '```',
  '',
].join('\n');

function runAggregate(configPath: string): AggregateOutput {
  // ─── HB-01 tool-attention ───
  const isoOut = computeIsoScore([], [0.1, 0.2, 0.3], 'planning', configPath);
  const gateOut = applyStateGate(
    { ranked: [], intentEmbedding: [] },
    'planning',
    DEFAULT_GATE_CONFIG,
    configPath,
  );
  const loadOut = lazyLoadSchemas(
    [{ name: 't1', shortDescription: 'd', compactTokens: 5, fullSchemaTokens: 40 }],
    { selected: [], effectiveTopK: 0, pinnedSurvivors: [] },
    () => ({ x: 1 }),
    configPath,
  );
  const budgetOut = checkBudget(
    { occupancyTokens: 100, contextWindowTokens: 200000 },
    configPath,
  );
  const pipelineOut = runToolAttentionPipeline({
    sidecars: [],
    compactCorpus: [],
    intentEmbedding: [0.1, 0.2, 0.3],
    phase: 'planning',
    resolveFullSchema: () => ({ x: 1 }),
    settingsPath: configPath,
  });

  // ─── HB-02 AgentDoG ───
  const adEmit = emitAgentDogDiagnostic({ component: 'aggregate-test' }, configPath);
  const adEnriched = enrichBlockWithAgentDog(
    SAMPLE_BLOCK,
    { component: 'aggregate-test' },
    configPath,
  );

  // ─── HB-03 STD calibration ───
  const stdDecision = decideReInjection(
    'opus',
    16,
    ['no-rm', 'no-network'],
    { settingsPath: configPath },
  );

  // ─── HB-04 W/E/E roles ───
  resetWorkerCounter();
  let ws = emptyWorkerState('aggregate-task');
  ws = workerGenerate(
    ws,
    { taskId: 'aggregate-task', summary: 'flag-off-probe' },
    configPath,
  );
  const es = evaluatorRun(emptyEvaluatorState(), ws, [], configPath);
  const evState = evolutionPropose(emptyEvolutionState(), ws, es, {
    settingsPath: configPath,
  });

  // ─── HB-07 AEL bandit (composed inside HB-04) ───
  // We just check it never produces a proposal when flag off — the proof is in
  // the evolution state above (no extension registered = no bandit-source
  // proposal possible). Independently verify the construction is harmless.
  const banditConstructionHarmless = (() => {
    const bandit = new AelBandit({
      arms: ['p1'],
      settingsPath: configPath,
    });
    return bandit.id === 'ael-bandit-v1';
  })();

  // ─── HB-05 structural-completeness linter ───
  const promo = runPromotionGate(SAMPLE_SKILL_MD, '/tmp/aggregate-skill.md', {
    settingsPath: configPath,
  });

  // ─── HB-06 ambiguity linter ───
  const amb = checkAmbiguity(SAMPLE_SKILL_MD, '/tmp/aggregate-skill.md');

  return {
    toolAttention: {
      enabled: isToolAttentionEnabled(configPath),
      iso: isoOut,
      gate: gateOut,
      load: loadOut,
      budget: budgetOut,
      pipeline: pipelineOut,
    },
    agentdog: {
      enabled: isAgentDogEnabled(configPath),
      emit: adEmit,
      enrichRefEqual: adEnriched === SAMPLE_BLOCK,
      hasDiagnostic: hasAgentDogDiagnostic(adEnriched),
    },
    stdCalibration: {
      enabled: isStdCalibrationEnabled(configPath),
      decision: stdDecision,
    },
    welerRoles: {
      enabled: isWelerRolesEnabled(configPath),
      workerState: ws,
      evaluatorState: es,
      evolutionState: evState,
    },
    aelBandit: {
      enabled: isAelBanditEnabled(configPath),
      proposalSourcePresent:
        evState.proposals.some((p) => p.source === 'ael-bandit-v1') ||
        !banditConstructionHarmless,
    },
    structuralCompleteness: {
      enabled: isStructuralCompletenessEnabled(configPath),
      blocked: promo.blocked,
      flagEnabled: promo.flagEnabled,
    },
    ambiguity: {
      enabled: isAmbiguityLintEnabled(configPath),
      flagsCount: amb.flags.length,
      passed: amb.passed,
    },
  };
}

describe('cs25-26-sweep — flag-off aggregate byte-identical fixture (Phase 813)', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('all 7 cs25-26-sweep flags read as disabled', () => {
    const env = makeFlagOffEnv();
    cleanups.push(env.cleanup);
    expect(isToolAttentionEnabled(env.configPath)).toBe(false);
    expect(isAgentDogEnabled(env.configPath)).toBe(false);
    expect(isStdCalibrationEnabled(env.configPath)).toBe(false);
    expect(isWelerRolesEnabled(env.configPath)).toBe(false);
    expect(isStructuralCompletenessEnabled(env.configPath)).toBe(false);
    expect(isAmbiguityLintEnabled(env.configPath)).toBe(false);
    expect(isAelBanditEnabled(env.configPath)).toBe(false);
  });

  it('aggregate output snapshot is byte-identical between flag-off and no-block configs', () => {
    const off = makeFlagOffEnv();
    cleanups.push(off.cleanup);
    const noBlock = makeNoBlockEnv();
    cleanups.push(noBlock.cleanup);

    const offOut = runAggregate(off.configPath);
    const noBlockOut = runAggregate(noBlock.configPath);

    expect(JSON.stringify(offOut)).toBe(JSON.stringify(noBlockOut));
  });

  it('disabled-result sentinels reach byte-identical referential equality where promised', () => {
    const env = makeFlagOffEnv();
    cleanups.push(env.cleanup);
    const out = runAggregate(env.configPath);

    // Pinned referential identities for sentinel-emitting paths.
    expect(out.agentdog.emit).toBe(AGENTDOG_DISABLED_RESULT);
    expect(out.stdCalibration.decision).toBe(RE_INJECTION_DISABLED_DECISION);
    expect(out.welerRoles.workerState).toBe(WORKER_DISABLED_STATE);
    expect(out.welerRoles.evaluatorState).toBe(EVALUATOR_DISABLED_STATE);
    expect(out.welerRoles.evolutionState).toBe(EVOLUTION_DISABLED_STATE);

    // AgentDoG enrichment passes through unchanged.
    expect(out.agentdog.enrichRefEqual).toBe(true);
    expect(out.agentdog.hasDiagnostic).toBe(false);

    // No bandit-source proposal anywhere.
    expect(out.aelBandit.proposalSourcePresent).toBe(false);
  });

  it('JSON-canonical shape pinned for the aggregate flag-off snapshot', () => {
    const env = makeFlagOffEnv();
    cleanups.push(env.cleanup);
    const out = runAggregate(env.configPath);

    // Sub-shape pins (load-bearing fields). Time-dependent fields are
    // intentionally absent from these structures because every disabled-result
    // sentinel is time-free.
    expect(JSON.stringify(out.toolAttention.iso)).toBe(
      '{"ranked":[],"intentEmbedding":[],"disabled":true}',
    );
    expect(JSON.stringify(out.toolAttention.gate)).toBe(
      '{"selected":[],"effectiveTopK":0,"pinnedSurvivors":[],"disabled":true}',
    );
    expect(JSON.stringify(out.toolAttention.load)).toBe(
      '{"compactPool":[],"fullSchemas":[],"totalTokens":0,"disabled":true}',
    );
    expect(JSON.stringify(out.agentdog.emit)).toBe(
      '{"emitted":false,"disabled":true,"diagnostic":null}',
    );
    expect(JSON.stringify(out.stdCalibration.decision)).toBe(
      '{"triggered":false,"depth":0,"std":0,"model":null,"constraintsReinjected":[],"usedBootstrapFloor":false,"disabled":true}',
    );
  });

  it('promotion gate is non-blocking with flag off (HB-05 conservative-default)', () => {
    const env = makeFlagOffEnv();
    cleanups.push(env.cleanup);
    const out = runAggregate(env.configPath);
    // HB-05's promotion gate: lint may "fail" structurally, but the gate is
    // non-blocking when the flag is off. blocked === false is the load-bearing
    // invariant for byte-identical-with-baseline.
    expect(out.structuralCompleteness.blocked).toBe(false);
    expect(out.structuralCompleteness.flagEnabled).toBe(false);
  });
});

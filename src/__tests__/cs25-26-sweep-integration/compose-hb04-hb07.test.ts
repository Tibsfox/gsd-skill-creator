/**
 * Phase 813 (v1.49.575) — keystone Half B integration test.
 *
 * Exercises the full extension-point lifecycle:
 *   HB-04 role-split authorized
 *   → HB-07 bandit invoked as `EvolutionExtensionPoint`
 *   → bandit emits its own engagement gate (separate marker)
 *   → bandit emits a `reflection-policy-update` trace
 *   → HB-04 fires `protocol-update` gate per proposal
 *   → HB-04 stages-or-activates per per-update gate authorization.
 *
 * This is the load-bearing Half B composition (per HB-07 concern §f and the
 * convergent-discovery report §5: HB-04 supplies the per-episode adversarial
 * check; HB-07 supplies the cross-episode reflection-bandit). The unit-level
 * test in `src/skill-creator/auto-load/__tests__/composition-with-hb04.test.ts`
 * verifies bandit refusal on missing markers; this milestone-level test
 * verifies the *full* lifecycle and the double-gate end state.
 *
 * @module __tests__/cs25-26-sweep-integration/compose-hb04-hb07
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  emptyEvaluatorState,
  emptyEvolutionState,
  emptyWorkerState,
  evaluatorRun,
  evolutionPropose,
  resetWorkerCounter,
  workerGenerate,
} from '../../skill-creator/roles/index.js';
import { AelBandit } from '../../skill-creator/auto-load/index.js';
import type {
  FailureHistoryEntry,
  PolicyUpdateProposal,
} from '../../skill-creator/roles/types.js';
import type { ReflectionFn } from '../../skill-creator/auto-load/types.js';

interface IntegrationEnv {
  configPath: string;
  rolesCapcomMarkerPath: string;
  banditCapcomMarkerPath: string;
  cleanup: () => void;
}

function makeEnv(opts: {
  rolesFlag: boolean;
  banditFlag: boolean;
  authorizeRoles: boolean;
  authorizeBandit: boolean;
}): IntegrationEnv {
  const dir = mkdtempSync(join(tmpdir(), 'cs2526-compose-'));
  const claudeDir = join(dir, '.claude');
  const scDir = join(dir, '.planning', 'skill-creator');
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(scDir, { recursive: true });

  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const sweep: Record<string, unknown> = {
    'weler-roles': { enabled: opts.rolesFlag },
    'ael-bandit': { enabled: opts.banditFlag },
  };
  writeFileSync(
    configPath,
    JSON.stringify({ 'gsd-skill-creator': { 'cs25-26-sweep': sweep } }),
  );

  const rolesCapcomMarkerPath = join(scDir, 'weler-roles.capcom');
  const banditCapcomMarkerPath = join(scDir, 'ael-bandit.capcom');
  if (opts.authorizeRoles) {
    writeFileSync(rolesCapcomMarkerPath, 'human-foxy@phase-813', 'utf8');
  }
  if (opts.authorizeBandit) {
    writeFileSync(banditCapcomMarkerPath, 'human-foxy@phase-813', 'utf8');
  }

  return {
    configPath,
    rolesCapcomMarkerPath,
    banditCapcomMarkerPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function seededPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const FAILURE_HISTORY: ReadonlyArray<FailureHistoryEntry> = Object.freeze([
  Object.freeze({
    id: 'fh-mcp-tax',
    failureClass: 'mcp-tax-overflow',
    summary:
      'tool schema overflow caused context fracture; lazy-loader insufficient',
    recordedAt: '2026-04-25T00:00:00Z',
  }),
]);

const ALWAYS_INSIGHT: ReflectionFn = ({ patterns }) => {
  if (patterns.length === 0) return [];
  return [
    {
      failureClass: patterns[0]!.failureClass,
      rootCausePattern: 'p813-keystone',
      proposedPolicyChange: 'switch retrieval to hb07-bandit',
      confidence: 0.91,
      producedAt: '2026-04-25T00:00:00Z',
    },
  ];
};

describe('cs25-26-sweep — HB-04 × HB-07 keystone composition (Phase 813)', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    resetWorkerCounter();
  });

  it('full lifecycle: both gates authorized → bandit proposal accepted', () => {
    const env = makeEnv({
      rolesFlag: true,
      banditFlag: true,
      authorizeRoles: true,
      authorizeBandit: true,
    });
    cleanups.push(env.cleanup);

    const bandit = new AelBandit({
      arms: ['retrieval-fast', 'retrieval-long-context'],
      config: {
        reflectionThreshold: 1,
        reflectFn: ALWAYS_INSIGHT,
        random: seededPrng(813),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.banditCapcomMarkerPath,
    });

    let ws = emptyWorkerState('keystone-task');
    ws = workerGenerate(
      ws,
      { taskId: 'keystone-task', summary: 'mcp-tax-overflow probe one' },
      env.configPath,
    );
    ws = workerGenerate(
      ws,
      { taskId: 'keystone-task', summary: 'mcp-tax-overflow probe two' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    expect(es.diagnostics.length).toBeGreaterThanOrEqual(2);

    const evState = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // Bandit was invoked → its private posterior advanced.
    const banditState = bandit._testGetStateClone();
    expect(banditState.episode).toBe(1);

    // Bandit's proposal cleared HB-04's protocol-update gate.
    const banditProposal = evState.proposals.find(
      (p: PolicyUpdateProposal) => p.source === 'ael-bandit-v1',
    );
    expect(banditProposal).toBeDefined();
    expect(banditProposal!.protocol).toBe('auto-load');
    expect(banditProposal!.change).toBe('switch retrieval to hb07-bandit');
  });

  it('half-state: roles authorized, bandit not authorized → bandit refuses to engage', () => {
    const env = makeEnv({
      rolesFlag: true,
      banditFlag: true,
      authorizeRoles: true,
      authorizeBandit: false,
    });
    cleanups.push(env.cleanup);

    let bandit_invocations = 0;
    const countingReflect: ReflectionFn = (snap) => {
      bandit_invocations += 1;
      return ALWAYS_INSIGHT(snap);
    };
    const bandit = new AelBandit({
      arms: ['p1'],
      config: {
        reflectionThreshold: 1,
        reflectFn: countingReflect,
        random: seededPrng(814),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.banditCapcomMarkerPath,
    });

    let ws = emptyWorkerState('half-task');
    ws = workerGenerate(
      ws,
      { taskId: 'half-task', summary: 'mcp-tax-overflow' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    const evState = evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // Bandit's engagement gate refused; reflectFn never ran.
    expect(bandit_invocations).toBe(0);
    const banditState = bandit._testGetStateClone();
    expect(banditState.episode).toBe(0);
    // No bandit-source proposal in the accepted set.
    expect(
      evState.proposals.find(
        (p: PolicyUpdateProposal) => p.source === 'ael-bandit-v1',
      ),
    ).toBeUndefined();
  });

  it('inverse half-state: roles not authorized → bandit not even invoked', () => {
    const env = makeEnv({
      rolesFlag: true,
      banditFlag: true,
      authorizeRoles: false,
      authorizeBandit: true,
    });
    cleanups.push(env.cleanup);

    let bandit_invocations = 0;
    const countingReflect: ReflectionFn = (snap) => {
      bandit_invocations += 1;
      return ALWAYS_INSIGHT(snap);
    };
    const bandit = new AelBandit({
      arms: ['p1', 'p2'],
      config: {
        reflectionThreshold: 1,
        reflectFn: countingReflect,
        random: seededPrng(815),
      },
      settingsPath: env.configPath,
      capcomMarkerPath: env.banditCapcomMarkerPath,
    });

    let ws = emptyWorkerState('inverse-task');
    ws = workerGenerate(
      ws,
      { taskId: 'inverse-task', summary: 'mcp-tax-overflow' },
      env.configPath,
    );
    const es = evaluatorRun(emptyEvaluatorState(), ws, FAILURE_HISTORY, env.configPath);
    evolutionPropose(emptyEvolutionState(), ws, es, {
      extensions: [bandit],
      settingsPath: env.configPath,
      capcomMarkerPath: env.rolesCapcomMarkerPath,
    });

    // HB-04 short-circuited extension invocation entirely.
    expect(bandit_invocations).toBe(0);
    const banditState = bandit._testGetStateClone();
    expect(banditState.episode).toBe(0);
  });

  it('double-gate semantic: both gates fire as separate emissions', () => {
    // We can verify the double-gate by observing that:
    //   1. HB-04's protocol-update gate determines acceptance.
    //   2. The bandit's own engagement gate is a *prerequisite* for the
    //      bandit to even produce a proposal.
    // We invert each gate independently and observe deterministic effect.
    for (const auth of [
      { roles: true, bandit: true, expectAccepted: true },
      { roles: true, bandit: false, expectAccepted: false },
      { roles: false, bandit: true, expectAccepted: false },
      { roles: false, bandit: false, expectAccepted: false },
    ] as const) {
      const env = makeEnv({
        rolesFlag: true,
        banditFlag: true,
        authorizeRoles: auth.roles,
        authorizeBandit: auth.bandit,
      });
      cleanups.push(env.cleanup);

      const bandit = new AelBandit({
        arms: ['p1', 'p2'],
        config: {
          reflectionThreshold: 1,
          reflectFn: ALWAYS_INSIGHT,
          random: seededPrng(900),
        },
        settingsPath: env.configPath,
        capcomMarkerPath: env.banditCapcomMarkerPath,
      });

      let ws = emptyWorkerState('matrix-task');
      ws = workerGenerate(
        ws,
        { taskId: 'matrix-task', summary: 'mcp-tax-overflow' },
        env.configPath,
      );
      ws = workerGenerate(
        ws,
        { taskId: 'matrix-task', summary: 'mcp-tax-overflow second' },
        env.configPath,
      );
      const es = evaluatorRun(
        emptyEvaluatorState(),
        ws,
        FAILURE_HISTORY,
        env.configPath,
      );
      const evState = evolutionPropose(emptyEvolutionState(), ws, es, {
        extensions: [bandit],
        settingsPath: env.configPath,
        capcomMarkerPath: env.rolesCapcomMarkerPath,
      });

      const banditAccepted = evState.proposals.some(
        (p: PolicyUpdateProposal) => p.source === 'ael-bandit-v1',
      );
      expect(banditAccepted).toBe(auth.expectAccepted);
    }
  });
});

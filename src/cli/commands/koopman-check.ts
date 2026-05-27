/**
 * CLI command for the koopman-memory advisory invariant check.
 *
 * Constructs an identity Koopman operator at the requested state dimension,
 * exercises the three advisory retention invariants
 * (`checkIdentityRetention`, `checkZeroInputRetention`, `checkLipschitzBound`),
 * and emits PASS/FAIL per invariant plus the linear-operator spectral data.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * ADVISORY-ONLY. Exit code is always 0 regardless of invariant results — the
 * CAPCOM handoff retains full authority over enforcement decisions and is
 * not perturbed by this command. The koopman-memory G8 HARD-preservation
 * invariants forbid any non-advisory exit path here.
 *
 * @module cli/commands/koopman-check
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import {
  DEFAULT_STATE_DIM,
  checkIdentityRetention,
  checkLipschitzBound,
  checkZeroInputRetention,
  identity,
  isKoopmanMemoryEnabled,
  spectralData,
} from '../../koopman-memory/index.js';
import type { KoopmanState } from '../../koopman-memory/index.js';
import { getFlagValue } from '../lib/flag-lookup.js';

// ============================================================================
// Help
// ============================================================================

function showKoopmanCheckHelp(): void {
  console.log(`
skill-creator koopman-check - Advisory koopman-memory invariant check

Usage:
  skill-creator koopman-check [options]
  skill-creator kc [options]

Constructs an identity Koopman operator at the requested state dimension,
exercises the three advisory retention invariants (identity retention,
zero-input retention, Lipschitz bound), and reports PASS/FAIL per invariant
plus the linear-operator spectral data.

ADVISORY-ONLY: exit code is always 0; CAPCOM retains enforcement authority.
The koopman-memory module is default-OFF; this command reports the opt-in
state via the 'mathematical-foundations.koopman-memory.enabled' flag in
.claude/gsd-skill-creator.json but does not require it to run the check
(the check itself is pure read-only computation).

Options:
  --state-dim <N>      State dimension d for the identity operator (default ${DEFAULT_STATE_DIM})
  --steps <N>          Steps for zero-input retention check (default 8)
  --quiet, -q          Machine-readable CSV output
  --json               JSON output
  --help, -h           Show this help
`);
}

// ============================================================================
// Helpers
// ============================================================================

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function buildTestState(stateDim: number): KoopmanState {
  // Deterministic small-norm test state: alternating ±1/sqrt(d) entries.
  const inv = 1 / Math.sqrt(stateDim);
  const out = new Array<number>(stateDim);
  for (let i = 0; i < stateDim; i++) out[i] = i % 2 === 0 ? inv : -inv;
  return Object.freeze(out);
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Advisory koopman-memory invariant check.
 *
 * @param args - Command-line arguments (after 'koopman-check')
 * @returns Exit code (always 0 on advisory paths; 1 only on argument errors).
 */
export async function koopmanCheckCommand(
  args: string[],
): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showKoopmanCheckHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  const stateDimLookup = getFlagValue(args, '--state-dim');
  const stepsLookup = getFlagValue(args, '--steps');

  let stateDim: number;
  if (!stateDimLookup.present) {
    stateDim = DEFAULT_STATE_DIM;
  } else {
    const parsed = parsePositiveInt(stateDimLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'invalid-flag', flag: '--state-dim', value: stateDimLookup.value }),
        );
      } else if (!quiet) {
        p.log.error(`--state-dim must be a positive integer; got '${stateDimLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    stateDim = parsed;
  }

  let steps: number;
  if (!stepsLookup.present) {
    steps = 8;
  } else {
    const parsed = parsePositiveInt(stepsLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'invalid-flag', flag: '--steps', value: stepsLookup.value }),
        );
      } else if (!quiet) {
        p.log.error(`--steps must be a positive integer; got '${stepsLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    steps = parsed;
  }

  const enabled = isKoopmanMemoryEnabled();
  const op = identity(stateDim);
  const spec = spectralData(op);
  const testState = buildTestState(stateDim);

  const idResult = checkIdentityRetention(stateDim, testState);
  const zeroResult = checkZeroInputRetention(op, testState, steps);
  // Lipschitz with K=0 (identity has no bilinear term): perturbation should be 0.
  const lipResult = checkLipschitzBound(op, testState, [1], 1e-9);

  const allPass = idResult.ok && zeroResult.ok && lipResult.ok;

  if (json) {
    console.log(
      JSON.stringify(
        {
          enabled,
          stateDim,
          steps,
          operator: { name: op.name, inputDim: op.inputDim },
          spectrum: spec,
          invariants: {
            identityRetention: idResult,
            zeroInputRetention: zeroResult,
            lipschitzBound: lipResult,
          },
          allPass,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (quiet) {
    const idTag = idResult.ok ? 'PASS' : 'FAIL';
    const zeroTag = zeroResult.ok ? 'PASS' : 'FAIL';
    const lipTag = lipResult.ok ? 'PASS' : 'FAIL';
    console.log(
      `${op.name},${stateDim},${steps},${enabled ? 'on' : 'off'},${spec.maxSingularValue.toFixed(6)},${idTag},${zeroTag},${lipTag}`,
    );
    return 0;
  }

  // Text (styled) output
  p.log.message(pc.bold('Koopman-Memory Invariant Check (advisory)'));
  p.log.message(pc.dim('─'.repeat(40)));
  p.log.message(
    `Operator: ${pc.cyan(op.name)} ` +
      `(stateDim=${op.stateDim}, inputDim=${op.inputDim})`,
  );
  p.log.message(
    `Opt-in flag: ${enabled ? pc.green('on') : pc.dim('off (advisory check still runs)')}`,
  );
  p.log.message(
    `Spectrum: σ_max=${pc.cyan(spec.maxSingularValue.toFixed(6))} ` +
      `(stable=${spec.stable})`,
  );
  p.log.message('');

  const fmtInvariant = (label: string, ok: boolean, finalNorm?: number, violations?: readonly string[]) => {
    const tag = ok ? pc.green('PASS') : pc.red('FAIL');
    const detail = finalNorm !== undefined
      ? ` (finalNorm=${finalNorm.toExponential(3)})`
      : '';
    p.log.message(`  ${label}: ${tag}${detail}`);
    if (!ok && violations && violations.length > 0) {
      for (const v of violations) {
        p.log.message(`    ${pc.red('•')} ${v}`);
      }
    }
  };

  fmtInvariant('Identity retention', idResult.ok, idResult.finalNorm, idResult.violations);
  fmtInvariant(`Zero-input retention (${steps} steps)`, zeroResult.ok, zeroResult.finalNorm, zeroResult.violations);
  fmtInvariant('Lipschitz bound', lipResult.ok, lipResult.finalNorm, lipResult.violations);

  p.log.message('');
  if (allPass) {
    p.log.success('All invariants PASS — koopman-memory operator is stable.');
  } else {
    p.log.warn('One or more invariants FAILED. Advisory only — CAPCOM retains enforcement authority.');
  }

  return 0;
}

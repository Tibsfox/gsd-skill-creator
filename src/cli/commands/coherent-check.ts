/**
 * CLI command for the coherent-functors advisory coherence check.
 *
 * Constructs an identity coherent functor over a simple integer-object
 * category, then runs the four coherence-condition checks (naturality,
 * identity, composition, direct-sum). Reports PASS/FAIL per predicate
 * plus the aggregate `checkCoherence` verdict.
 *
 * Three-tier output: text (styled), quiet (CSV), JSON.
 *
 * ADVISORY-ONLY. Exit code is always 0 regardless of predicate results — the
 * CAPCOM handoff retains full authority over enforcement decisions. The
 * coherent-functors G6 HARD-preservation invariants forbid any non-advisory
 * exit path here.
 *
 * @module cli/commands/coherent-check
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import type {
  Category,
  Morphism,
} from '../../coherent-functors/index.js';
import {
  checkCoherence,
  checkComposition,
  checkDirectSum,
  checkIdentity,
  checkNaturality,
  identityFunctor,
  isCoherentFunctorsEnabled,
} from '../../coherent-functors/index.js';

// ============================================================================
// Help
// ============================================================================

function showCoherentCheckHelp(): void {
  console.log(`
skill-creator coherent-check - Advisory coherent-functors coherence check

Usage:
  skill-creator coherent-check [options]
  skill-creator cc [options]

Constructs an identity coherent functor over a simple integer-object
category, runs the four coherence-condition checks (naturality, identity,
composition, direct-sum), and reports PASS/FAIL per predicate plus the
aggregate report.

ADVISORY-ONLY: exit code is always 0; CAPCOM retains enforcement authority.
The coherent-functors module is default-OFF; this command reports the
opt-in state via the 'mathematical-foundations.coherent-functors.enabled'
flag but does not require it to run the check (the check is pure
read-only computation).

Options:
  --object <N>         Probe object integer (default 0; only affects identity check)
  --require-composition Enforce composition witness (default: vacuous-OK)
  --quiet, -q          Machine-readable CSV output
  --json               JSON output
  --help, -h           Show this help
`);
}

// ============================================================================
// Helpers
// ============================================================================

type FlagLookup =
  | { present: false }
  | { present: true; value: string | null };

function getFlagValue(args: string[], flag: string): FlagLookup {
  const idx = args.indexOf(flag);
  if (idx < 0) return { present: false };
  if (idx === args.length - 1) return { present: true, value: null };
  return { present: true, value: args[idx + 1] ?? null };
}

function parseInt32(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

/** Build a simple integer-object category — same shape as the test fixtures. */
function integerCategory(): Category<number> {
  return {
    name: 'IntegerCat',
    identity: (v: number): Morphism<number, number> => ({
      source: v,
      target: v,
      name: `id_${v}`,
    }),
    compose: <A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C> => ({
      source: f.source,
      target: g.target,
      name: `(${g.name}∘${f.name})`,
    }),
    equalObjects: (x: number, y: number): boolean => x === y,
  };
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Advisory coherent-functors coherence check.
 *
 * @param args - Command-line arguments (after 'coherent-check')
 * @returns Exit code (always 0 on advisory paths; 1 only on argument errors).
 */
export async function coherentCheckCommand(
  args: string[],
): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showCoherentCheckHelp();
    return 0;
  }

  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');
  const requireComposition = args.includes('--require-composition');

  const objectLookup = getFlagValue(args, '--object');
  let probeObject: number;
  if (!objectLookup.present) {
    probeObject = 0;
  } else {
    const parsed = parseInt32(objectLookup.value);
    if (parsed === null) {
      if (json) {
        console.log(
          JSON.stringify({ error: 'invalid-flag', flag: '--object', value: objectLookup.value }),
        );
      } else if (!quiet) {
        p.log.error(`--object must be an integer; got '${objectLookup.value ?? '<missing>'}'.`);
      }
      return 1;
    }
    probeObject = parsed;
  }

  const enabled = isCoherentFunctorsEnabled();
  const cat = integerCategory();
  const F = identityFunctor(cat);

  const nat = checkNaturality(F);
  const id = checkIdentity(F, probeObject);
  const comp = checkComposition(F);
  const dsum = checkDirectSum(F);
  const report = checkCoherence(F, { requireComposition, probeObject });

  const allPass = report.ok;

  if (json) {
    console.log(
      JSON.stringify(
        {
          enabled,
          functor: F.name,
          category: cat.name,
          probeObject,
          requireComposition,
          predicates: {
            naturality: nat,
            identity: id,
            composition: comp,
            directSum: dsum,
          },
          report,
          allPass,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (quiet) {
    const tag = (r: { ok: boolean }) => (r.ok ? 'PASS' : 'FAIL');
    console.log(
      `${F.name},${cat.name},${probeObject},${enabled ? 'on' : 'off'},${tag(nat)},${tag(id)},${tag(comp)},${tag(dsum)},${allPass ? 'PASS' : 'FAIL'}`,
    );
    return 0;
  }

  // Text (styled) output
  p.log.message(pc.bold('Coherent-Functors Coherence Check (advisory)'));
  p.log.message(pc.dim('─'.repeat(40)));
  p.log.message(`Functor: ${pc.cyan(F.name)}  Category: ${pc.cyan(cat.name)}`);
  p.log.message(
    `Probe object: ${pc.cyan(String(probeObject))}  ` +
      `require-composition: ${requireComposition ? pc.cyan('on') : pc.dim('off')}`,
  );
  p.log.message(
    `Opt-in flag: ${enabled ? pc.green('on') : pc.dim('off (advisory check still runs)')}`,
  );
  p.log.message('');

  const fmt = (label: string, r: { ok: boolean; witness?: string; detail?: string }) => {
    const tag = r.ok ? pc.green('PASS') : pc.red('FAIL');
    p.log.message(`  ${label}: ${tag}`);
    if (r.witness) p.log.message(`    ${pc.dim('witness:')} ${r.witness}`);
    if (!r.ok && r.detail) p.log.message(`    ${pc.red('•')} ${r.detail}`);
  };

  fmt('Naturality', nat);
  fmt('Identity', id);
  fmt('Composition', comp);
  fmt('Direct-sum', dsum);

  p.log.message('');
  if (allPass) {
    p.log.success('All coherence predicates PASS — functor is coherent.');
  } else {
    p.log.warn(
      `${report.violations.length} violation(s) reported. Advisory only — CAPCOM retains enforcement authority.`,
    );
  }

  return 0;
}

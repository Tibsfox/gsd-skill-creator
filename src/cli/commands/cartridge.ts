/**
 * CLI command group for cartridge-forge.
 *
 * Surfaces the `src/cartridge/` modules as subcommands:
 *
 *   skill-creator cartridge load <path>       -- Load + show a cartridge
 *   skill-creator cartridge validate <path>   -- Schema + cross-chipset checks
 *   skill-creator cartridge scaffold <tmpl> <dir> <name>
 *                                             -- Scaffold a new cartridge
 *   skill-creator cartridge metrics <path>    -- Static shape metrics
 *   skill-creator cartridge eval <path>       -- Run evaluation gates
 *   skill-creator cartridge dedup <path>      -- Report key collisions
 *   skill-creator cartridge fork <path> <newId>
 *                                             -- Fork a cartridge
 *
 * All subcommands return 0 on success, 1 on validation failure, 2 on usage
 * error. `--json` is supported on every subcommand for machine-readable
 * output. No external user prompts — this command group is batch-safe.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { dedupCartridge } from '../../cartridge/dedup.js';
import { evalCartridge } from '../../cartridge/eval.js';
import { forkCartridge } from '../../cartridge/fork.js';
import { loadCartridge } from '../../cartridge/loader.js';
import { collectMetrics } from '../../cartridge/metrics.js';
import {
  scaffoldCartridge,
  type ScaffoldTemplate,
} from '../../cartridge/scaffold.js';
import { validateCartridge } from '../../cartridge/validator.js';

export interface CartridgeCommandIO {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

const defaultIO: CartridgeCommandIO = {
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line),
};

function jsonMode(args: string[]): boolean {
  return args.includes('--json');
}

function printJson(io: CartridgeCommandIO, value: unknown): void {
  io.stdout(JSON.stringify(value, null, 2));
}

function usageError(io: CartridgeCommandIO, message: string): number {
  io.stderr(`cartridge: ${message}`);
  io.stderr('');
  io.stderr('Usage:');
  io.stderr('  skill-creator cartridge load <path> [--json]');
  io.stderr('  skill-creator cartridge validate <path> [--json]');
  io.stderr('  skill-creator cartridge scaffold <template> <dir> <name> [--trust <t>]');
  io.stderr('  skill-creator cartridge metrics <path> [--json]');
  io.stderr('  skill-creator cartridge eval <path> [--json]');
  io.stderr('  skill-creator cartridge dedup <path> [--json]');
  io.stderr('  skill-creator cartridge fork <path> <newId> [--out <path>] [--json]');
  return 2;
}

function getFlagValue(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const eq = args.find((a) => a.startsWith(prefix));
  if (eq) return eq.slice(prefix.length);
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < args.length) {
    const v = args[idx + 1];
    if (v && !v.startsWith('-')) return v;
  }
  return undefined;
}

function positionalArgs(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('--')) {
      // `--key=value` consumes itself. `--key value` consumes next token unless
      // next token is also a flag.
      if (!a.includes('=') && i + 1 < args.length && !args[i + 1]!.startsWith('-')) {
        i++;
      }
      continue;
    }
    out.push(a);
  }
  return out;
}

export async function cartridgeCommand(
  args: string[],
  io: CartridgeCommandIO = defaultIO,
): Promise<number> {
  const [sub, ...rest] = args;
  if (!sub) return usageError(io, 'missing subcommand');

  try {
    switch (sub) {
      case 'load':
        return handleLoad(rest, io);
      case 'validate':
        return handleValidate(rest, io);
      case 'scaffold':
        return handleScaffold(rest, io);
      case 'metrics':
        return handleMetrics(rest, io);
      case 'eval':
        return handleEval(rest, io);
      case 'dedup':
        return handleDedup(rest, io);
      case 'fork':
        return handleFork(rest, io);
      default:
        return usageError(io, `unknown subcommand "${sub}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode(rest)) {
      printJson(io, { ok: false, error: msg });
    } else {
      io.stderr(`cartridge: ${msg}`);
    }
    return 1;
  }
}

function handleLoad(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'load requires <path>');
  const cartridge = loadCartridge(path);
  if (jsonMode(args)) {
    printJson(io, cartridge);
  } else {
    io.stdout(`${cartridge.id}  ${cartridge.version}  [${cartridge.trust}]`);
    io.stdout(`${cartridge.chipsets.length} chipset(s): ${cartridge.chipsets.map((c) => c.kind).join(', ')}`);
  }
  return 0;
}

function handleValidate(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'validate requires <path>');
  const cartridge = loadCartridge(path);
  const result = validateCartridge(cartridge);
  if (jsonMode(args)) {
    printJson(io, result);
  } else {
    if (result.valid) {
      io.stdout(`OK  ${cartridge.id}  ${result.warnings.length} warning(s)`);
    } else {
      io.stderr(`FAIL  ${cartridge.id}`);
      for (const e of result.errors) {
        io.stderr(`  ${e.path}: ${e.message}`);
      }
    }
  }
  return result.valid ? 0 : 1;
}

function handleScaffold(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const [template, dir, name] = positional;
  if (!template || !dir || !name) {
    return usageError(io, 'scaffold requires <template> <dir> <name>');
  }
  const trust = getFlagValue(args, 'trust') as
    | 'system'
    | 'user'
    | 'community'
    | undefined;
  const result = scaffoldCartridge({
    template: template as ScaffoldTemplate,
    targetDir: dir,
    name,
    trust,
  });
  if (jsonMode(args)) {
    printJson(io, { ok: true, ...result });
  } else {
    io.stdout(`scaffolded ${name} -> ${result.targetDir}`);
    io.stdout(`${result.filesWritten.length} file(s) written`);
  }
  return 0;
}

function handleMetrics(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'metrics requires <path>');
  const cartridge = loadCartridge(path);
  const metrics = collectMetrics(cartridge);
  if (jsonMode(args)) {
    printJson(io, metrics);
  } else {
    io.stdout(`${metrics.id}  ${metrics.version}`);
    io.stdout(`  chipsets: ${metrics.chipsetCount} (${metrics.chipsetKinds.join(', ')})`);
    io.stdout(`  skills: ${metrics.skillCount}`);
    io.stdout(`  agents: ${metrics.agentCount}`);
    io.stdout(`  teams: ${metrics.teamCount}`);
    io.stdout(`  grove record types: ${metrics.groveRecordTypeCount}`);
  }
  return 0;
}

function handleEval(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'eval requires <path>');
  const cartridge = loadCartridge(path);
  const report = evalCartridge(cartridge);
  if (jsonMode(args)) {
    printJson(io, report);
  } else {
    io.stdout(`${report.cartridgeId}`);
    io.stdout(
      `  passed: ${report.passedCount}  failed: ${report.failedCount}  unsupported: ${report.unsupportedCount}`,
    );
    for (const g of report.gates) {
      const mark = g.outcome === 'passed' ? 'OK' : g.outcome === 'failed' ? 'FAIL' : 'SKIP';
      io.stdout(`  [${mark}] ${g.gate}${g.message ? ` — ${g.message}` : ''}`);
    }
  }
  return report.failedCount > 0 ? 1 : 0;
}

function handleDedup(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'dedup requires <path>');
  const cartridge = loadCartridge(path);
  const report = dedupCartridge(cartridge);
  if (jsonMode(args)) {
    printJson(io, report);
  } else {
    io.stdout(`${cartridge.id}`);
    io.stdout(`  unique skills: ${report.skillCount}  unique agents: ${report.agentCount}`);
    if (report.collisions.length === 0) {
      io.stdout('  no collisions');
    } else {
      io.stdout(`  ${report.collisions.length} collision(s):`);
      for (const c of report.collisions) {
        io.stdout(`    ${c.kind}:${c.key} in ${c.locations.join(', ')}`);
      }
    }
  }
  return 0;
}

function handleFork(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const [path, newId] = positional;
  if (!path || !newId) return usageError(io, 'fork requires <path> <newId>');
  const cartridge = loadCartridge(path);
  const forked = forkCartridge(cartridge, { newId });
  const out = getFlagValue(args, 'out');
  if (out) {
    writeFileSync(resolve(out), stringifyYaml(forked), 'utf8');
  }
  if (jsonMode(args)) {
    printJson(io, forked);
  } else {
    io.stdout(`forked ${cartridge.id} -> ${forked.id}`);
    if (out) io.stdout(`wrote ${resolve(out)}`);
  }
  return 0;
}

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

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { dedupCartridge } from '../../cartridge/dedup.js';
import {
  distillAndValidate,
  toSafeSkillName,
  type DistillSource,
} from '../../cartridge/distill.js';
import {
  departmentLegacyToUnified,
  DepartmentAdapterError,
} from '../../cartridge/department-adapter.js';
import { evalCartridge } from '../../cartridge/eval.js';
import { forkCartridge } from '../../cartridge/fork.js';
import { loadAnyCartridge, loadCartridge } from '../../cartridge/loader.js';
import { collectMetrics } from '../../cartridge/metrics.js';
import {
  scaffoldCartridge,
  type ScaffoldTemplate,
} from '../../cartridge/scaffold.js';
import { scaffoldCompanions } from '../../cartridge/scaffold-companions.js';
import { mintDepartmentFromCoOccurrence } from '../../cartridge/co-occurrence-department.js';
import { isResearchOutputCartridge } from '../../cartridge/types.js';
import { validateCoOccurrenceMatrix } from '../../traces/co-occurrence-schema.js';
import {
  validateCartridge,
  validateResearchOutputCartridge,
} from '../../cartridge/validator.js';

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
  io.stderr('  skill-creator cartridge validate <path> [--json] [--allow-validation-debt]');
  io.stderr('  skill-creator cartridge scaffold <template> <dir> <name> [--trust <t>]');
  io.stderr('                                       [--author <a>] [--description <d>] [--tags a,b,c]');
  io.stderr('  skill-creator cartridge scaffold-companions <path> [--overwrite] [--json]');
  io.stderr('  skill-creator cartridge metrics <path> [--json]');
  io.stderr('  skill-creator cartridge eval <path> [--json]');
  io.stderr('  skill-creator cartridge dedup <path> [--json]');
  io.stderr('  skill-creator cartridge fork <path> <newId> [--out <path>] [--json]');
  io.stderr('  skill-creator cartridge migrate <path> [--dry-run] [--json]');
  io.stderr('  skill-creator cartridge migrate --all <root> [--exclude <pattern>] [--dry-run] [--json]');
  io.stderr('  skill-creator cartridge distill <sources...> [--template department]');
  io.stderr('                                       [--id <id>] [--name <name>] [--enrich]');
  io.stderr('                                       [--ledger [--ledger-path <path>]] [--json]');
  io.stderr('  skill-creator cartridge distill-cooccurrence <co-occurrence-log> [--min-support <n>]');
  io.stderr('                                       [--id <id>] [--name <name>] [--out <path>] [--json]');
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

/** Valueless boolean flags — they must NOT consume the following positional token. */
const VALUELESS_FLAGS = new Set(['--json', '--enrich', '--ledger']);

/** Extract positional (non-flag) args. Exported for unit testing. */
export function positionalArgs(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('--')) {
      // `--key=value` consumes itself. A valueless boolean flag consumes nothing.
      // Otherwise `--key value` consumes the next token unless it is also a flag.
      if (
        !a.includes('=') &&
        !VALUELESS_FLAGS.has(a) &&
        i + 1 < args.length &&
        !args[i + 1]!.startsWith('-')
      ) {
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

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    io.stdout('Usage:');
    io.stdout('  skill-creator cartridge load <path> [--json]');
    io.stdout('  skill-creator cartridge validate <path> [--json] [--allow-validation-debt]');
    io.stdout('  skill-creator cartridge scaffold <template> <dir> <name> [--trust <t>]');
    io.stdout('                                       [--author <a>] [--description <d>] [--tags a,b,c]');
    io.stdout('  skill-creator cartridge scaffold-companions <path> [--overwrite] [--json]');
    io.stdout('  skill-creator cartridge metrics <path> [--json]');
    io.stdout('  skill-creator cartridge eval <path> [--json]');
    io.stdout('  skill-creator cartridge dedup <path> [--json]');
    io.stdout('  skill-creator cartridge fork <path> <newId> [--out <path>] [--json]');
    io.stdout('  skill-creator cartridge migrate <path> [--dry-run] [--json]');
    io.stdout('  skill-creator cartridge migrate --all <root> [--exclude <pattern>] [--dry-run] [--json]');
    io.stdout('  skill-creator cartridge distill <sources...> [--template department]');
    io.stdout('                                       [--id <id>] [--name <name>] [--enrich]');
    io.stdout('                                       [--ledger [--ledger-path <path>]] [--json]');
    io.stdout('  skill-creator cartridge distill-cooccurrence <co-occurrence-log> [--min-support <n>]');
    io.stdout('                                       [--id <id>] [--name <name>] [--out <path>] [--json]');
    return 0;
  }

  try {
    switch (sub) {
      case 'load':
        return handleLoad(rest, io);
      case 'validate':
        return handleValidate(rest, io);
      case 'scaffold':
        return handleScaffold(rest, io);
      case 'scaffold-companions':
        return handleScaffoldCompanions(rest, io);
      case 'metrics':
        return handleMetrics(rest, io);
      case 'eval':
        return handleEval(rest, io);
      case 'dedup':
        return handleDedup(rest, io);
      case 'fork':
        return handleFork(rest, io);
      case 'migrate':
        return handleMigrate(rest, io);
      case 'distill':
        return await handleDistill(rest, io);
      case 'distill-cooccurrence':
        return handleDistillCooccurrence(rest, io);
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
  const cartridge = loadCartridge(path, { allowedRoots: [process.cwd()] });
  if (jsonMode(args)) {
    printJson(io, cartridge);
  } else {
    io.stdout(`${cartridge.id}  ${cartridge.version}  [${cartridge.trust}]`);
    io.stdout(`${cartridge.chipsets.length} chipset(s): ${cartridge.chipsets.map((c) => c.kind).join(', ')}`);
  }
  return 0;
}

const VALIDATION_DEBT_MARKERS = ['agent_affinity', 'domains_covered'];

function handleValidate(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'validate requires <path>');
  const allowDebt = args.includes('--allow-validation-debt');
  const cartridge = loadAnyCartridge(path, { allowedRoots: [process.cwd()] });
  const raw = isResearchOutputCartridge(cartridge)
    ? validateResearchOutputCartridge(cartridge)
    : validateCartridge(cartridge);
  const debtErrors = raw.errors.filter((e) =>
    VALIDATION_DEBT_MARKERS.some((m) => e.path.includes(m)),
  );
  const hardErrors = raw.errors.filter((e) => !debtErrors.includes(e));
  const effective = allowDebt
    ? {
        ...raw,
        valid: hardErrors.length === 0,
        errors: hardErrors,
        warnings: [
          ...raw.warnings,
          ...debtErrors.map((e) => ({
            path: e.path,
            message: `known-validation-debt: ${e.message}`,
          })),
        ],
      }
    : raw;
  if (jsonMode(args)) {
    printJson(io, effective);
  } else {
    if (effective.valid) {
      io.stdout(`OK  ${cartridge.id}  ${effective.warnings.length} warning(s)`);
    } else {
      io.stderr(`FAIL  ${cartridge.id}`);
      for (const e of effective.errors) {
        io.stderr(`  ${e.path}: ${e.message}`);
      }
    }
  }
  return effective.valid ? 0 : 1;
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
  const author = getFlagValue(args, 'author');
  const description = getFlagValue(args, 'description');
  const tagsFlag = getFlagValue(args, 'tags');
  const tags = tagsFlag
    ? tagsFlag.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
    : undefined;
  const result = scaffoldCartridge({
    template: template as ScaffoldTemplate,
    targetDir: dir,
    name,
    trust,
    author,
    description,
    tags,
  });
  if (jsonMode(args)) {
    printJson(io, { ok: true, ...result });
  } else {
    io.stdout(`scaffolded ${name} -> ${result.targetDir}`);
    io.stdout(`${result.filesWritten.length} file(s) written`);
  }
  return 0;
}

function handleScaffoldCompanions(
  args: string[],
  io: CartridgeCommandIO,
): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'scaffold-companions requires <path>');
  const overwrite = args.includes('--overwrite');
  const result = scaffoldCompanions({ path, overwrite });
  if (jsonMode(args)) {
    printJson(io, { ok: true, ...result });
  } else {
    io.stdout(`${result.cartridgeId}`);
    io.stdout(
      `  wrote ${result.filesWritten.length} file(s), skipped ${result.filesSkipped.length} existing`,
    );
    for (const f of result.filesWritten) io.stdout(`  + ${f}`);
    for (const f of result.filesSkipped) io.stdout(`  . ${f}`);
  }
  return 0;
}

function handleMetrics(args: string[], io: CartridgeCommandIO): number {
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'metrics requires <path>');
  const cartridge = loadCartridge(path, { allowedRoots: [process.cwd()] });
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
  const cartridge = loadCartridge(path, { allowedRoots: [process.cwd()] });
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
  const cartridge = loadCartridge(path, { allowedRoots: [process.cwd()] });
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
  const cartridge = loadCartridge(path, { allowedRoots: [process.cwd()] });
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

// ============================================================================
// `cartridge distill` — mint a validated cartridge from research sources
// ============================================================================

function inferSourceKind(path: string): DistillSource['kind'] {
  const lower = path.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'note';
  if (lower.endsWith('.txt')) return 'note';
  if (lower.startsWith('http://') || lower.startsWith('https://')) return 'url';
  return 'note';
}

async function handleDistill(
  args: string[],
  io: CartridgeCommandIO,
): Promise<number> {
  const positional = positionalArgs(args);
  if (positional.length === 0) {
    return usageError(io, 'distill requires <sources...>');
  }

  const sources: DistillSource[] = positional.map((p, i) => {
    const abs = resolve(p);
    const content = readFileSync(abs, 'utf8');
    const rawId = basename(abs).replace(/\.[^.]+$/, '');
    return {
      id: toSafeSkillName(rawId) || `source-${i}`,
      kind: inferSourceKind(abs),
      content,
      metadata: { path: abs },
    };
  });

  const template = getFlagValue(args, 'template') === 'department'
    ? 'department'
    : 'content';
  const idFlag = getFlagValue(args, 'id');
  const nameFlag = getFlagValue(args, 'name');
  const cartridgeId = toSafeSkillName(idFlag ?? sources[0]!.id);
  const name = nameFlag ?? cartridgeId;

  // Opt-in enrichment backends — each is INDEPENDENT and default-OFF. The
  // enricher is built if ANY backend is requested; with none the default no-op
  // enricher runs (v1 behavior unchanged). --ledger works with OR without
  // --enrich (citation resolution is a distinct enricher step from semantic edges).
  const deps: Parameters<typeof distillAndValidate>[2] = {};
  const wantEnrich = args.includes('--enrich');
  const wantLedger = args.includes('--ledger');
  if (wantEnrich || wantLedger) {
    const { createSemanticEnricher } = await import('../../cartridge/distill-enricher-semantic.js');
    const enricherOptions: Parameters<typeof createSemanticEnricher>[0] = {};

    // --enrich: semantic cross-references (embedder) + opt-in LLM concept naming.
    if (wantEnrich) {
      const { EmbeddingService } = await import('../../embeddings/embedding-service.js');
      enricherOptions.embedder = EmbeddingService.createFresh();
      // LLM concept naming (SC_DISTILL_NAMER_LLM=1 + ANTHROPIC_API_KEY). Absent
      // either gate, the factory returns null and the heuristic labels stand.
      const { createClaudeDistillNamer } = await import('../../cartridge/distill-namer-llm.js');
      const namer = createClaudeDistillNamer();
      if (namer) enricherOptions.namer = namer;
    }

    // --ledger: ledger-resolved citation provenance (default path, or
    // --ledger-path <path>). Independent of --enrich.
    if (wantLedger) {
      const { SourceLedger } = await import('../../source-ledger/source-ledger.js');
      const { LedgerCitationResolver } = await import('../../cartridge/distill-citation-resolver.js');
      const ledgerPath = getFlagValue(args, 'ledger-path');
      enricherOptions.citationResolver = new LedgerCitationResolver(
        new SourceLedger(ledgerPath),
      );
    }

    deps.enricher = createSemanticEnricher(enricherOptions);
  }

  const artifact = await distillAndValidate(
    sources,
    { cartridgeId, name, template },
    deps,
  );

  if (jsonMode(args)) {
    printJson(io, artifact);
  } else {
    io.stdout(`distilled ${sources.length} source(s) -> ${artifact.cartridge.id}`);
    io.stdout(
      `  concepts: ${artifact.clusters.length}  critique: ${artifact.critique.status}`,
    );
    io.stdout(
      `  gate: ${artifact.gate.ok ? 'OK' : 'BLOCKED'} (${artifact.gate.warnings.length} warning(s))` +
        `  validation: ${artifact.validation.valid ? 'OK' : 'FAIL'}`,
    );
    io.stdout(`  roi (advisory): ${artifact.roiAdvisory.reason}`);
    for (const b of artifact.gate.blockers) io.stdout(`  blocker: ${b}`);
    for (const e of artifact.validation.errors) io.stdout(`  error: ${e}`);
    for (const n of artifact.notes) io.stdout(`  note: ${n}`);
  }

  return artifact.validation.valid ? 0 : 1;
}

// ============================================================================
// `cartridge distill-cooccurrence` — mint a department DRAFT from co-activation
// ============================================================================

/**
 * Read a JP-016 co-occurrence log (a serialized `CoOccurrenceMatrix` JSON
 * file), bundle the co-activating skills, and package them into a validated
 * department-cartridge DRAFT. Refuses to mint below `--min-support`.
 *
 * The co-occurrence log is expected to be a pre-computed matrix. Deriving it
 * from the raw decision-trace JSONL is out of scope (the trace activation
 * writers are still unwired, so the live matrix is sparse).
 */
function handleDistillCooccurrence(
  args: string[],
  io: CartridgeCommandIO,
): number {
  const positional = positionalArgs(args);
  const logPath = positional[0];
  if (!logPath) {
    return usageError(io, 'distill-cooccurrence requires <co-occurrence-log>');
  }

  const raw = JSON.parse(readFileSync(resolve(logPath), 'utf8'));
  const parsed = validateCoOccurrenceMatrix(raw);
  if (!parsed.ok) {
    if (jsonMode(args)) {
      printJson(io, { ok: false, error: `invalid co-occurrence log: ${parsed.error}` });
    } else {
      io.stderr(`cartridge: invalid co-occurrence log: ${parsed.error}`);
    }
    return 1;
  }

  const minSupportFlag = getFlagValue(args, 'min-support');
  let minSupport: number | undefined;
  if (minSupportFlag !== undefined) {
    minSupport = Number(minSupportFlag);
    if (!Number.isFinite(minSupport) || minSupport < 0) {
      return usageError(io, 'min-support must be a non-negative number');
    }
  }

  const result = mintDepartmentFromCoOccurrence(parsed.matrix, {
    minSupport,
    id: getFlagValue(args, 'id'),
    name: getFlagValue(args, 'name'),
    description: getFlagValue(args, 'description'),
    trust: getFlagValue(args, 'trust') as
      | 'system'
      | 'user'
      | 'community'
      | undefined,
    author: getFlagValue(args, 'author'),
  });

  if (!result.ok) {
    if (jsonMode(args)) {
      printJson(io, {
        ok: false,
        reason: result.reason,
        support: result.support,
        skillCount: result.skillCount,
      });
    } else {
      io.stderr(`cartridge: refused to mint — ${result.reason}`);
    }
    return 1;
  }

  const out = getFlagValue(args, 'out');
  if (out) {
    writeFileSync(resolve(out), result.yaml, 'utf8');
  }

  if (jsonMode(args)) {
    printJson(io, {
      ok: true,
      id: result.cartridge.id,
      support: result.support,
      skillCount: result.skillCount,
      slotCount: result.slotCount,
      validation: result.validation,
      out: out ? resolve(out) : null,
    });
  } else {
    io.stdout(
      `minted DRAFT ${result.cartridge.id} from ${result.skillCount} co-activating skill(s)`,
    );
    io.stdout(
      `  slots: ${result.slotCount}  support: ${result.support}` +
        `  validation: ${result.validation.valid ? 'OK' : 'FAIL'}`,
    );
    for (const e of result.validation.errors) {
      io.stdout(`  error: ${e.path}: ${e.message}`);
    }
    if (out) {
      io.stdout(`  draft written to ${resolve(out)} (review before install)`);
    } else {
      io.stdout('  (no --out given — pass --out <path> to save the draft)');
    }
  }

  return result.validation.valid ? 0 : 1;
}

// ============================================================================
// v1.49.636 C2 — `cartridge migrate` (department-chipset adapter wiring)
// ============================================================================

/**
 * Per-chipset migration record. The aggregate report is written to
 * `.planning/cartridge-migration-<date>.md` when `--all` is used.
 */
/**
 * Internal: a chipset.yaml file discovered under the migration root, along
 * with its parsed shape classification. `'department'` means the file passes
 * the department-shape gate (has agents/skills/teams at top level) and is
 * eligible for adapter invocation. `'not-department'` means the file exists
 * but doesn't match the gate — surfaced via v1.49.644 C2 path b (CF-17) so
 * operators can see what was discovered-but-not-migrated rather than having
 * those files silently dropped from the report.
 */
interface DiscoveredChipset {
  path: string;
  shape: 'department' | 'not-department';
}

export interface CartridgeMigrationRecord {
  sourcePath: string;
  targetPath: string;
  status: 'migrated' | 'unfit' | 'failed' | 'dry-run' | 'idempotent' | 'not-department-shape';
  reason?: string;
  loadValidates: boolean;
}

interface MigrateAllOptions {
  root: string;
  exclude?: string;
  dryRun: boolean;
}

/**
 * Migrate a single LEGACY `chipset.yaml` file to a UNIFIED `cartridge.yaml`
 * sibling. Returns a `CartridgeMigrationRecord` describing the outcome.
 *
 * Behavioral contract:
 * - `targetPath` is `<dir>/cartridge.yaml` next to the source.
 * - If the target already exists AND its bytes match what the adapter
 *   would produce, the record is marked `idempotent` and no write occurs.
 * - On `--dry-run`, no file is written; the record is marked `dry-run`.
 * - On adapter failure (`DepartmentAdapterError`), the record is marked
 *   `unfit` with `reason` set to the adapter error message.
 * - On any other error, the record is marked `failed`.
 */
function migrateSingle(
  sourcePath: string,
  dryRun: boolean,
): CartridgeMigrationRecord {
  const absSource = resolve(sourcePath);
  const dir = absSource.replace(/[/\\][^/\\]+$/, '');
  const targetPath = join(dir, 'cartridge.yaml');
  try {
    const yaml = readFileSync(absSource, 'utf8');
    const unified = departmentLegacyToUnified(yaml);
    const serialized = stringifyYaml(unified);
    if (dryRun) {
      return {
        sourcePath: absSource,
        targetPath,
        status: 'dry-run',
        loadValidates: false,
      };
    }
    if (existsSync(targetPath)) {
      const existing = readFileSync(targetPath, 'utf8');
      if (existing === serialized) {
        return {
          sourcePath: absSource,
          targetPath,
          status: 'idempotent',
          loadValidates: true,
        };
      }
    }
    writeFileSync(targetPath, serialized, 'utf8');
    // Self-validate: parse + Zod check via loader.
    let loadValidates = false;
    try {
      loadCartridge(targetPath, { allowedRoots: [process.cwd()] });
      loadValidates = true;
    } catch {
      loadValidates = false;
    }
    return {
      sourcePath: absSource,
      targetPath,
      status: 'migrated',
      loadValidates,
    };
  } catch (err) {
    if (err instanceof DepartmentAdapterError) {
      return {
        sourcePath: absSource,
        targetPath,
        status: 'unfit',
        reason: err.message,
        loadValidates: false,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      sourcePath: absSource,
      targetPath,
      status: 'failed',
      reason: msg,
      loadValidates: false,
    };
  }
}

/**
 * Discover every `chipset.yaml` under `root`, skipping any directory whose
 * absolute path contains the `exclude` substring.
 *
 * Returns each discovered file classified as `'department'` (matches the
 * agents+skills+teams top-level gate, eligible for adapter migration) or
 * `'not-department'` (exists and parses, but doesn't match the gate —
 * e.g. header:-wrapped legacy, stub redirects, or unrelated chipset
 * configurations like the den staff config). Non-department files were
 * silently dropped from the report prior to v1.49.644 C2; they now
 * surface as `status: not-department-shape` records (CF-17 path b).
 *
 * Unparseable files are still skipped silently — they would fail any
 * follow-up adapter call anyway and aren't actionable as carry-forwards.
 *
 * Returns deterministically-ordered absolute paths (alphabetic) so
 * migration logs are stable across runs.
 */
function findLegacyChipsets(root: string, exclude?: string): DiscoveredChipset[] {
  const absRoot = resolve(root);
  const found: DiscoveredChipset[] = [];
  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const child = join(dir, entry.name);
      if (exclude && child.includes(exclude)) continue;
      if (entry.isDirectory()) {
        walk(child);
      } else if (entry.isFile() && entry.name === 'chipset.yaml') {
        try {
          const yaml = parseYaml(readFileSync(child, 'utf8'));
          if (yaml && typeof yaml === 'object' && !Array.isArray(yaml)) {
            const top = yaml as Record<string, unknown>;
            const isDepartmentShape =
              'agents' in top && 'skills' in top && 'teams' in top;
            found.push({
              path: child,
              shape: isDepartmentShape ? 'department' : 'not-department',
            });
          }
        } catch {
          // skip unparseable files
        }
      }
    }
  }
  if (statSync(absRoot).isDirectory()) {
    walk(absRoot);
  }
  found.sort((a, b) => a.path.localeCompare(b.path));
  return found;
}

/**
 * Build a synthetic migration record for a discovered chipset.yaml that
 * doesn't match the department-shape gate. No adapter is invoked; no file
 * is written. The record gives operators visibility into what was
 * discovered-but-not-migrated. CF-17 path b at v1.49.644 C2.
 */
function recordForNonDepartmentShape(sourcePath: string): CartridgeMigrationRecord {
  const dir = sourcePath.replace(/[/\\][^/\\]+$/, '');
  const targetPath = join(dir, 'cartridge.yaml');
  return {
    sourcePath,
    targetPath,
    status: 'not-department-shape',
    reason:
      "top-level YAML lacks agents+skills+teams; not eligible for department-adapter migration. Inspect chipset shape (e.g. 'header:'-wrapped legacy, stub redirect, or non-department configuration).",
    loadValidates: false,
  };
}

function handleMigrate(args: string[], io: CartridgeCommandIO): number {
  const dryRun = args.includes('--dry-run');
  const json = jsonMode(args);
  if (args.includes('--all')) {
    const root = getFlagValue(args, 'all');
    if (!root) {
      return usageError(io, 'migrate --all requires <root>');
    }
    const exclude = getFlagValue(args, 'exclude');
    const records = migrateAll({ root, exclude, dryRun });
    if (json) {
      printJson(io, records);
    } else {
      summarizeMigration(io, records, dryRun);
    }
    return records.some((r) => r.status === 'failed') ? 1 : 0;
  }
  const positional = positionalArgs(args);
  const path = positional[0];
  if (!path) return usageError(io, 'migrate requires <path> or --all <root>');
  const record = migrateSingle(path, dryRun);
  if (json) {
    printJson(io, record);
  } else {
    io.stdout(`${record.status}: ${record.sourcePath} -> ${record.targetPath}`);
    if (record.reason) io.stdout(`  reason: ${record.reason}`);
  }
  return record.status === 'failed' ? 1 : 0;
}

function migrateAll(opts: MigrateAllOptions): CartridgeMigrationRecord[] {
  const sources = findLegacyChipsets(opts.root, opts.exclude);
  return sources.map((s) =>
    s.shape === 'department'
      ? migrateSingle(s.path, opts.dryRun)
      : recordForNonDepartmentShape(s.path),
  );
}

function summarizeMigration(
  io: CartridgeCommandIO,
  records: CartridgeMigrationRecord[],
  dryRun: boolean,
): void {
  const tally = {
    migrated: 0,
    idempotent: 0,
    'dry-run': 0,
    unfit: 0,
    failed: 0,
    'not-department-shape': 0,
  };
  for (const r of records) tally[r.status]++;
  io.stdout(
    `cartridge migrate: ${records.length} chipset(s)${dryRun ? ' (dry-run)' : ''}`,
  );
  io.stdout(
    `  migrated:   ${tally.migrated}` +
      (tally.idempotent ? `  idempotent: ${tally.idempotent}` : '') +
      (tally['dry-run'] ? `  dry-run: ${tally['dry-run']}` : '') +
      (tally.unfit ? `  unfit: ${tally.unfit}` : '') +
      (tally['not-department-shape']
        ? `  not-department-shape: ${tally['not-department-shape']}`
        : '') +
      (tally.failed ? `  failed: ${tally.failed}` : ''),
  );
  for (const r of records) {
    if (
      r.status === 'unfit' ||
      r.status === 'failed' ||
      r.status === 'not-department-shape'
    ) {
      io.stdout(`  ${r.status}: ${r.sourcePath}`);
      if (r.reason) io.stdout(`    reason: ${r.reason}`);
    }
  }
}

/**
 * Intelligence CLI — the production trigger for the finding→memory mirror.
 *
 * `intelligence mirror-findings [--project <id>]` constructs the real
 * FindingMemorySync from a KBStore (finding source + embedding cache + project
 * directory), the process-local EmbeddingService, and a PgStore writer, then
 * mirrors open intelligence findings into the unified pgvector memory corpus so
 * they become semantically recallable and federatable across repos.
 *
 * Without this trigger FindingMemorySync was opt-in wiring with no caller — the
 * KBStore→pgvector bridge existed but never ran. The mirror itself, its
 * idempotency, and its hard boundary (never mutates a finding) live in
 * src/intelligence/finding-memory-sync.ts; this command only wires real infra
 * and folds the report. Absent RH_POSTGRES_URL or an unreachable DB it degrades
 * to a clear message rather than a stack trace.
 */

import { KBStore } from '../../intelligence/kb/store.js';
import { getEmbeddingService } from '../../embeddings/index.js';
import { PgStore } from '../../memory/pg-store.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';
import {
  createFindingMemorySync,
  mirrorFindings,
  type MirrorFindingsReport,
} from '../../intelligence/finding-memory-sync.js';

export interface ParsedIntelligenceArgs {
  subcommand: string | undefined;
  project?: string;
  registry?: string;
  json: boolean;
  help: boolean;
}

/** Parse the argument slice after `intelligence`. */
export function parseIntelligenceArgs(args: string[]): ParsedIntelligenceArgs {
  const positional: string[] = [];
  let project: string | undefined;
  let registry: string | undefined;
  let json = false;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') help = true;
    else if (a === '--json') json = true;
    else if (a === '--project') project = args[++i];
    else if (a.startsWith('--project=')) project = a.slice('--project='.length);
    else if (a === '--registry') registry = args[++i];
    else if (a.startsWith('--registry=')) registry = a.slice('--registry='.length);
    else if (!a.startsWith('-')) positional.push(a);
  }
  return { subcommand: positional[0], project, registry, json, help };
}

function printIntelligenceHelp(): void {
  console.log(`intelligence — bridge the intelligence KB into the memory corpus

Usage:
  intelligence mirror-findings [--project <id>] [--registry <path>] [--json]

Subcommands:
  mirror-findings   Mirror open findings from the intelligence KB into pgvector
                    memory (all projects, or one via --project). Idempotent;
                    never mutates a finding's status.

Options:
  --project <id>    Restrict to a single KB project id (default: all projects)
  --registry <path> Override the intelligence registry.db path
  --json            Emit the mirror report as JSON
  -h, --help        Show this help`);
}

function formatReport(report: MirrorFindingsReport): string {
  const lines: string[] = [];
  for (const p of report.projects) {
    lines.push(
      `  ${p.projectName} — ${p.mirrored} mirrored (${p.embedded} embedded, ${p.cacheHits} cached)`,
    );
  }
  const t = report.totals;
  lines.push(
    `[intelligence] ${t.mirrored} finding(s) mirrored across ${t.projects} project(s): ` +
      `${t.embedded} embedded, ${t.cacheHits} served from cache`,
  );
  return lines.join('\n');
}

async function handleMirrorFindings(parsed: ParsedIntelligenceArgs): Promise<number> {
  const env = loadPgEnv();
  if (!env.ok) {
    console.error(
      'intelligence mirror-findings: no RH_POSTGRES_URL found; nothing mirrored',
    );
    return 1;
  }

  const kb = new KBStore(parsed.registry ? { registryPath: parsed.registry } : undefined);
  const embedder = await getEmbeddingService();
  const writer = new PgStore({ connectionString: env.url });

  try {
    if (!(await writer.isReady())) {
      console.error(
        'intelligence mirror-findings: the database is unreachable; nothing mirrored',
      );
      return 1;
    }

    await kb.ensureRegistry();
    const sync = createFindingMemorySync({
      source: kb,
      embedder,
      writer,
      cache: kb,
    });

    const report = await mirrorFindings(
      { directory: kb, runner: sync },
      { projectId: parsed.project },
    );

    if (parsed.json) console.log(JSON.stringify(report, null, 2));
    else console.log(formatReport(report));
    return 0;
  } finally {
    kb.close();
    await writer.close();
  }
}

export async function intelligenceCommand(args: string[]): Promise<number> {
  const parsed = parseIntelligenceArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printIntelligenceHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'mirror-findings':
    case 'mirror':
      return handleMirrorFindings(parsed);
    default:
      console.error(`Unknown intelligence subcommand: ${parsed.subcommand}`);
      printIntelligenceHelp();
      return 1;
  }
}

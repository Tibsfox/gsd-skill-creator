/**
 * Source CLI command — operator front door to the unified source ledger.
 *
 * Exposes the append-only `SourceLedger` (content-hash + provenance) so an
 * operator can see, across every ingestion path, what has been absorbed:
 *
 *   source ledger list                     all recorded sources
 *   source ledger show <contentHash>       provenance rows for one hash
 *   source ledger dedup-check <hash>       is this source already recorded?
 *   source ledger dedup-check --file <p>   hash a file's bytes then check
 *
 * `--path <ledger.jsonl>` overrides the ledger file; `--json` emits machine
 * output. The ledger core lives in src/source-ledger and does the fs work.
 */

import { readFile } from 'node:fs/promises';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  SourceLedger,
  hashContent,
  DEFAULT_SOURCE_LEDGER_PATH,
  type SourceLedgerEntry,
  type SourceLedgerPort,
} from '../../source-ledger/source-ledger.js';

// ─── Argument parsing (pure, tested) ─────────────────────────────────────────

export interface ParsedSourceArgs {
  subcommand: string | undefined;
  positional: string[];
  path?: string;
  file?: string;
  json: boolean;
  help: boolean;
}

/**
 * Parse the argument slice after `source`. Recognises `--path <p>`,
 * `--file <p>`, `--json`, `--help`/`-h`; positionals are everything else.
 */
export function parseSourceArgs(args: string[]): ParsedSourceArgs {
  const positional: string[] = [];
  let path: string | undefined;
  let file: string | undefined;
  let json = false;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--json') {
      json = true;
    } else if (a === '--path') {
      path = args[++i];
    } else if (a.startsWith('--path=')) {
      path = a.slice('--path='.length);
    } else if (a === '--file') {
      file = args[++i];
    } else if (a.startsWith('--file=')) {
      file = a.slice('--file='.length);
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  return { subcommand: positional[0], positional: positional.slice(1), path, file, json, help };
}

// ─── Formatting (pure, tested) ───────────────────────────────────────────────

export function formatLedgerList(entries: SourceLedgerEntry[]): string {
  if (entries.length === 0) return 'Source ledger is empty.';
  const lines = entries.map((e) => {
    const label = e.provenance.label ? ` [${e.provenance.label}]` : '';
    return `  ${e.contentHash.slice(0, 12)}  ${e.provenance.origin}  ${e.provenance.sourceId}${label}  (${e.provenance.ingestedAt})`;
  });
  return `Source ledger (${entries.length}):\n${lines.join('\n')}`;
}

export function formatLedgerShow(hash: string, entries: SourceLedgerEntry[]): string {
  if (entries.length === 0) return `No ledger entries for ${hash}.`;
  const lines = entries.map(
    (e) =>
      `  origin=${e.provenance.origin} sourceId=${e.provenance.sourceId}` +
      `${e.provenance.label ? ` label=${e.provenance.label}` : ''} ingestedAt=${e.provenance.ingestedAt}`,
  );
  return `${hash} — ${entries.length} provenance entr${entries.length === 1 ? 'y' : 'ies'}:\n${lines.join('\n')}`;
}

// ─── Ledger resolution ───────────────────────────────────────────────────────

function makeLedger(path: string | undefined): SourceLedgerPort {
  return new SourceLedger(path);
}

// ─── Subcommand handlers ─────────────────────────────────────────────────────

async function handleList(ledger: SourceLedgerPort, json: boolean): Promise<number> {
  const entries = await ledger.list();
  if (json) {
    console.log(JSON.stringify(entries, null, 2));
  } else {
    console.log(formatLedgerList(entries));
  }
  return 0;
}

async function handleShow(
  ledger: SourceLedgerPort,
  hash: string | undefined,
  json: boolean,
): Promise<number> {
  if (!hash) {
    p.log.error('Usage: skill-creator source ledger show <contentHash>');
    return 1;
  }
  const entries = await ledger.findByHash(hash);
  if (json) {
    console.log(JSON.stringify(entries, null, 2));
  } else {
    console.log(formatLedgerShow(hash, entries));
  }
  return entries.length > 0 ? 0 : 1;
}

async function handleDedupCheck(
  ledger: SourceLedgerPort,
  hashArg: string | undefined,
  filePath: string | undefined,
  json: boolean,
): Promise<number> {
  let hash = hashArg;
  if (!hash && filePath) {
    try {
      hash = hashContent(await readFile(filePath));
    } catch (err) {
      p.log.error(`Cannot read --file ${filePath}: ${(err as Error).message}`);
      return 2;
    }
  }
  if (!hash) {
    p.log.error('Usage: skill-creator source ledger dedup-check <contentHash> | --file <path>');
    return 2;
  }
  const entries = await ledger.findByHash(hash);
  const present = entries.length > 0;
  if (json) {
    console.log(JSON.stringify({ contentHash: hash, present, entries }, null, 2));
  } else if (present) {
    console.log(pc.yellow(`DUPLICATE — ${hash} already recorded (${entries.length} provenance).`));
    console.log(formatLedgerShow(hash, entries));
  } else {
    console.log(pc.green(`NEW — ${hash} is not in the ledger.`));
  }
  // Exit code mirrors dedup semantics: 0 = new (safe to ingest), 3 = duplicate.
  return present ? 3 : 0;
}

// ─── Help ────────────────────────────────────────────────────────────────────

function printSourceHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('Source — unified source ledger (content-hash + provenance)'));
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(`    ${pc.cyan('source ledger list')}                    List every recorded source`);
  p.log.message(`    ${pc.cyan('source ledger show <hash>')}             Show provenance rows for a hash`);
  p.log.message(`    ${pc.cyan('source ledger dedup-check <hash>')}      Is this source already recorded?`);
  p.log.message(`    ${pc.cyan('source ledger dedup-check --file <p>')}  Hash a file then dedup-check it`);
  p.log.message('');
  p.log.message('  Flags: --path <ledger.jsonl>, --json');
  p.log.message(`  Default ledger: ${DEFAULT_SOURCE_LEDGER_PATH}`);
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator source ledger list');
  p.log.message('    skill-creator source ledger dedup-check --file paper.pdf');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * Source CLI command entry point.
 *
 * @param args - argument slice after `source`
 * @returns exit code (0 success / new, 1 usage-or-empty, 2 bad args, 3 duplicate)
 */
export async function sourceCommand(args: string[]): Promise<number> {
  const parsed = parseSourceArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printSourceHelp();
    return 0;
  }

  if (parsed.subcommand !== 'ledger') {
    p.log.error(`Unknown source subcommand: ${parsed.subcommand}`);
    printSourceHelp();
    return 1;
  }

  const verb = parsed.positional[0];
  const ledger = makeLedger(parsed.path);

  switch (verb) {
    case undefined:
    case 'help':
      printSourceHelp();
      return 0;
    case 'list':
    case 'ls':
      return handleList(ledger, parsed.json);
    case 'show':
      return handleShow(ledger, parsed.positional[1], parsed.json);
    case 'dedup-check':
    case 'check':
      return handleDedupCheck(ledger, parsed.positional[1], parsed.file, parsed.json);
    default:
      p.log.error(`Unknown source ledger verb: ${verb}`);
      printSourceHelp();
      return 1;
  }
}

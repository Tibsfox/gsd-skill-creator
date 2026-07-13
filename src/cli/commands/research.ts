/**
 * Research CLI command.
 *
 * Front door to the corpus-aware research gap radar. `research gaps` scores a
 * topic's subtopics against what the corpus already covers (citation
 * WorkIndex + arxiv seen-ids) and prints ranked under-covered subtopics plus
 * the re-weighted domain weights that can seed the vtm research stage.
 *
 *   research gaps [--topic <t>] [--subtopics a,b,c] [--json]
 *                 [--citations-db <path>] [--seen-ids <path>]
 *
 * `research verify <doc.md>` extracts atomic claims from a research draft and,
 * for each, checks citation-backed support through the resolver cascade,
 * printing a per-claim supported | unsupported | unresolved verdict.
 *
 *   research verify <doc.md> [--json]
 */

import { readFileSync } from 'node:fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  analyzeGaps,
  buildCorpusCoverage,
  type GapReport,
} from '../../vtm/gap-radar.js';
import {
  VerificationStage,
  createDefaultResolver,
  type ClaimSupportReport,
} from '../../citations/verify/index.js';

// ─── Argument parsing (pure, tested) ────────────────────────────────────────

export interface ParsedResearchArgs {
  subcommand: string | undefined;
  positional: string[];
  json: boolean;
  help: boolean;
  topic?: string;
  subtopics?: string[];
  citationsDb?: string;
  seenIds?: string;
}

function takeValue(args: string[], i: number, flag: string): [string | undefined, number] {
  const a = args[i]!;
  if (a === flag) return [args[i + 1], i + 1];
  if (a.startsWith(`${flag}=`)) return [a.slice(flag.length + 1), i];
  return [undefined, i];
}

/**
 * Parse the argument slice after `research`. Recognises `--json`,
 * `--topic`, `--subtopics` (comma-separated), `--citations-db`, `--seen-ids`
 * (and their `--flag=value` forms) plus `--help`/`-h`.
 */
export function parseResearchArgs(args: string[]): ParsedResearchArgs {
  const positional: string[] = [];
  let json = false;
  let help = false;
  let topic: string | undefined;
  let subtopics: string[] | undefined;
  let citationsDb: string | undefined;
  let seenIds: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--json') {
      json = true;
    } else if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--topic' || a.startsWith('--topic=')) {
      [topic, i] = takeValue(args, i, '--topic');
    } else if (a === '--subtopics' || a.startsWith('--subtopics=')) {
      let raw: string | undefined;
      [raw, i] = takeValue(args, i, '--subtopics');
      subtopics = (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--citations-db' || a.startsWith('--citations-db=')) {
      [citationsDb, i] = takeValue(args, i, '--citations-db');
    } else if (a === '--seen-ids' || a.startsWith('--seen-ids=')) {
      [seenIds, i] = takeValue(args, i, '--seen-ids');
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  return {
    subcommand: positional[0],
    positional: positional.slice(1),
    json,
    help,
    topic,
    subtopics,
    citationsDb,
    seenIds,
  };
}

// ─── Formatting (pure, tested) ──────────────────────────────────────────────

export function formatGapReport(report: GapReport): string {
  const lines: string[] = [];
  lines.push(
    `Research gaps for "${report.topic}" ` +
      `(${report.workCount} works, ${report.arxivSeenCount} arxiv seen, ` +
      `${report.spineCount} spine memories, confidence ${report.confidence.toFixed(2)})`,
  );
  lines.push('');
  lines.push('  Ranked under-covered subtopics (gap 1.0 = uncovered):');
  for (const [i, s] of report.subtopics.entries()) {
    lines.push(
      `    ${i + 1}. ${s.subtopic} — gap ${s.gapScore.toFixed(2)} ` +
        `[${s.domain}] (coverage ${s.coverage})`,
    );
  }
  lines.push('');
  lines.push('  Re-weighted domain weights (seed for the ranker / research stage):');
  for (const [domain, weight] of Object.entries(report.reweightedDomainWeights)) {
    lines.push(`    ${domain}: ${weight.toFixed(3)}`);
  }
  return lines.join('\n');
}

const VERDICT_COLOR: Record<string, (s: string) => string> = {
  supported: pc.green,
  unresolved: pc.yellow,
  unsupported: pc.red,
};

export function formatClaimSupportReport(report: ClaimSupportReport): string {
  const lines: string[] = [];
  const { total, supported, unsupported, unresolved } = report.stats;
  lines.push(
    `Claim support for ${report.document} ` +
      `(${total} claims: ${supported} supported, ${unresolved} unresolved, ${unsupported} unsupported)`,
  );
  lines.push('');
  for (const [i, r] of report.claims.entries()) {
    const color = VERDICT_COLOR[r.verdict] ?? ((s: string) => s);
    const loc = r.claim.lineNumber ? `L${r.claim.lineNumber}` : '?';
    const snippet = r.claim.text.length > 100 ? `${r.claim.text.slice(0, 97)}...` : r.claim.text;
    lines.push(`  ${i + 1}. [${color(r.verdict.toUpperCase())}] ${loc}  ${snippet}`);
    lines.push(`       ${pc.dim(r.reason)}`);
  }
  return lines.join('\n');
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleVerify(parsed: ParsedResearchArgs): Promise<number> {
  const docPath = parsed.positional[0];
  if (!docPath) {
    p.log.error('research verify requires a document path: research verify <doc.md>');
    return 1;
  }

  let markdown: string;
  try {
    markdown = readFileSync(docPath, 'utf-8');
  } catch (err) {
    p.log.error(`Cannot read ${docPath}: ${(err as Error).message}`);
    return 1;
  }

  try {
    const stage = new VerificationStage(createDefaultResolver());
    const report = await stage.verify(markdown, docPath);

    if (parsed.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatClaimSupportReport(report));
    }
    return 0;
  } catch (err) {
    p.log.error(`Claim verification failed: ${(err as Error).message}`);
    return 1;
  }
}

async function handleGaps(parsed: ParsedResearchArgs): Promise<number> {
  try {
    const coverage = await buildCorpusCoverage({
      citationBasePath: parsed.citationsDb,
      seenIdsPath: parsed.seenIds,
    });
    const report = analyzeGaps(parsed.topic ?? 'corpus', parsed.subtopics ?? [], coverage);

    if (parsed.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatGapReport(report));
    }
    return 0;
  } catch (err) {
    p.log.error(`Gap analysis failed: ${(err as Error).message}`);
    return 1;
  }
}

function printResearchHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('Research — corpus-aware gap radar'));
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(
    `    ${pc.cyan('research gaps')}     Rank under-covered subtopics and re-weight domain weights`,
  );
  p.log.message(
    `    ${pc.cyan('research verify')}   Check citation-backed support for each claim in a draft`,
  );
  p.log.message('');
  p.log.message('  Flags:');
  p.log.message('    --topic <t>            Umbrella topic label');
  p.log.message('    --subtopics a,b,c      Candidate subtopics (default: the four mission domains)');
  p.log.message('    --json                 Emit the full report as JSON');
  p.log.message('    --citations-db <path>  Override the citation store base path');
  p.log.message('    --seen-ids <path>      Override the arxiv seen-ids ledger path');
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator research gaps');
  p.log.message('    skill-creator research gaps --subtopics "tool use,planning,code repair" --json');
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * Research CLI command entry point.
 *
 * @param args - argument slice after `research`
 * @returns exit code (0 success, non-zero failure)
 */
export async function researchCommand(args: string[]): Promise<number> {
  const parsed = parseResearchArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printResearchHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'gaps':
    case 'gap':
      return handleGaps(parsed);
    case 'verify':
      return handleVerify(parsed);
    default:
      p.log.error(`Unknown research subcommand: ${parsed.subcommand}`);
      printResearchHelp();
      return 1;
  }
}

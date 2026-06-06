/**
 * CLI command: `skill-creator amiga`
 *
 * Mines skill candidates from real Claude Code session transcripts by driving
 * them through the AMIGA meta-mission SkillCandidateDetector + CE-1 attribution
 * ledger, then maps the result onto SuggestionStore candidates so they surface
 * in `sc:suggest` alongside the SC-native pattern detector's output. This is the
 * first-class promotion of tools/spike-amiga-revive.mjs: the dormant src/amiga
 * substrate's production runtime consumer.
 *
 * Modes:
 *   skill-creator amiga                 Analyze the largest transcript (default)
 *   skill-creator amiga <transcript>    Analyze a specific transcript
 *   skill-creator amiga --corpus        Analyze + aggregate ALL transcripts
 *
 * Options:
 *   --emit                 Land the candidates in <patterns-dir>/suggestions.json
 *                          via SuggestionStore (dry-run by default).
 *   --patterns-dir <dir>   Target patterns dir for --emit (default .planning/patterns).
 *   --projects-dir <dir>   Transcript source dir (default the cwd's ~/.claude project).
 *   --limit <n>            Cap emitted workflow candidates (default 10 single / 20 corpus).
 *   --json                 Machine-readable output.
 *   --help, -h             Show help.
 *
 * Exit codes:
 *   0  Seam proven: candidate(s) detected AND CE-1 attribution captured.
 *   1  No transcripts / nothing analyzable / no attribution / error.
 *
 * @module cli/commands/amiga
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { basename } from 'node:path';
import {
  defaultProjectsDir,
  listTranscripts,
  largestTranscript,
  readTranscript,
} from '../../amiga/spike/transcript-reader.js';
import {
  analyzeSession,
  mappedCandidatesFor,
  aggregateCorpus,
} from '../../amiga/spike/revive-pipeline.js';
import type { SessionAnalysis, CorpusAnalysis } from '../../amiga/spike/revive-pipeline.js';
import { SuggestionStore } from '../../detection/suggestion-store.js';
import type { SkillCandidate as SuggestionCandidate } from '../../types/detection.js';

interface Options {
  corpus: boolean;
  emit: boolean;
  json: boolean;
  help: boolean;
  patternsDir: string;
  projectsDir?: string;
  limit?: number;
  transcript?: string;
}

/** Parse argv (after the command word) into Options. Value-flags consume the next token. */
function parse(args: string[]): Options {
  const opts: Options = {
    corpus: false,
    emit: false,
    json: false,
    help: false,
    patternsDir: '.planning/patterns',
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--corpus') opts.corpus = true;
    else if (a === '--emit') opts.emit = true;
    else if (a === '--json') opts.json = true;
    else if (a.startsWith('--patterns-dir=')) opts.patternsDir = a.slice('--patterns-dir='.length);
    else if (a === '--patterns-dir') opts.patternsDir = args[++i] ?? opts.patternsDir;
    else if (a.startsWith('--projects-dir=')) opts.projectsDir = a.slice('--projects-dir='.length);
    else if (a === '--projects-dir') opts.projectsDir = args[++i];
    else if (a.startsWith('--limit=')) opts.limit = Number.parseInt(a.slice('--limit='.length), 10);
    else if (a === '--limit') opts.limit = Number.parseInt(args[++i] ?? '', 10);
    else if (!a.startsWith('-') && opts.transcript === undefined) opts.transcript = a;
  }
  return opts;
}

/** Trim an SC candidate to the fields worth printing/serializing. */
function slim(c: SuggestionCandidate) {
  return {
    id: c.id,
    name: c.suggestedName,
    type: c.type,
    confidence: Number(c.confidence.toFixed(3)),
    occurrences: c.occurrences,
  };
}

/** Land mapped candidates in the SuggestionStore (the `sc:suggest` sink). */
async function emitCandidates(patternsDir: string, mapped: SuggestionCandidate[]) {
  const store = new SuggestionStore(patternsDir);
  const added = await store.addCandidates(mapped);
  const counts = await store.getCounts();
  return { enabled: true, patternsDir, mapped: mapped.length, added: added.length, counts };
}

type EmitResult = Awaited<ReturnType<typeof emitCandidates>>;

export async function amigaCommand(args: string[]): Promise<number> {
  const opts = parse(args);
  if (opts.help) {
    showHelp();
    return 0;
  }
  const limit = Number.isFinite(opts.limit) ? (opts.limit as number) : opts.corpus ? 20 : 10;
  try {
    return opts.corpus ? await runCorpus(opts, limit) : await runSingle(opts, limit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts.json) console.log(JSON.stringify({ error: msg }, null, 2));
    else p.log.error(`amiga: ${msg}`);
    return 1;
  }
}

async function runSingle(opts: Options, limit: number): Promise<number> {
  const dir = opts.projectsDir ?? defaultProjectsDir();
  const path = opts.transcript ?? largestTranscript(dir);
  if (!path) {
    return fail(opts, `no transcripts found in ${dir} (pass a transcript path, or --projects-dir <dir>)`);
  }

  const session = readTranscript(path);
  if (session.tools.length < 2) {
    return fail(opts, `${basename(path)} has < 2 tool-uses; pass a richer transcript`);
  }

  const a = analyzeSession(session);
  const structural = a.missionDetection.candidates.filter(
    (c) => c.detection_method !== 'sequence_repetition',
  );
  const mapped = mappedCandidatesFor(a, limit);
  const emit = opts.emit ? await emitCandidates(opts.patternsDir, mapped) : undefined;
  const seamProven = a.missionDetection.has_candidates && a.attribution.captured > 0;

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          mode: 'single',
          transcript: basename(path),
          sessionId: a.sessionId,
          toolUses: a.toolCount,
          topTools: a.topTools,
          missionId: a.missionId,
          structuralCandidates: structural.length,
          workflowCandidates: a.seqDetection.candidates.length,
          candidates: mapped.map(slim),
          attribution: {
            received: a.attribution.received,
            captured: a.attribution.captured,
            errors: a.attribution.errors,
            ledgerRows: a.attribution.ledgerRows,
            weightSum: Number(a.attribution.weightSum.toFixed(3)),
            top: a.attribution.weights.slice(0, 8).map((w) => ({
              contributorId: w.contributorId,
              weight: Number(w.weight.toFixed(3)),
              entryCount: w.entryCount,
            })),
          },
          emit,
          seamProven,
        },
        null,
        2,
      ),
    );
  } else {
    printSingle(a, mapped, emit, seamProven, basename(path));
  }
  return seamProven ? 0 : 1;
}

async function runCorpus(opts: Options, limit: number): Promise<number> {
  const dir = opts.projectsDir ?? defaultProjectsDir();
  const paths = listTranscripts(dir);
  if (paths.length === 0) {
    return fail(opts, `no transcripts found in ${dir} (use --projects-dir <dir>)`);
  }

  const analyses: SessionAnalysis[] = [];
  let skipped = 0;
  let seq = 0;
  for (const path of paths) {
    let session;
    try {
      session = readTranscript(path);
    } catch {
      skipped++;
      continue;
    }
    if (session.tools.length < 2) {
      skipped++;
      continue;
    }
    seq++;
    try {
      analyses.push(analyzeSession(session, seq));
    } catch {
      skipped++;
    }
  }

  if (analyses.length === 0) {
    return fail(opts, `no analyzable transcripts in ${dir} (${skipped} skipped)`);
  }

  const corpus = aggregateCorpus(analyses, skipped, limit);
  const emit = opts.emit ? await emitCandidates(opts.patternsDir, corpus.candidates) : undefined;
  const seamProven = corpus.totalCaptured > 0 && corpus.candidates.length > 0;

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          mode: 'corpus',
          projectsDir: dir,
          sessionsAnalyzed: corpus.sessionsAnalyzed,
          sessionsSkipped: corpus.sessionsSkipped,
          totalToolUses: corpus.totalToolUses,
          totalCaptured: corpus.totalCaptured,
          totalErrors: corpus.totalErrors,
          candidates: corpus.candidates.map(slim),
          meanWeights: corpus.meanWeights.slice(0, 8).map((w) => ({
            contributorId: w.contributorId,
            meanWeight: Number(w.meanWeight.toFixed(3)),
            sessions: w.sessions,
          })),
          emit,
          seamProven,
        },
        null,
        2,
      ),
    );
  } else {
    printCorpus(corpus, dir, emit, seamProven);
  }
  return seamProven ? 0 : 1;
}

/** Emit a failure in the active output mode and return exit code 1. */
function fail(opts: Options, msg: string): number {
  if (opts.json) console.log(JSON.stringify({ error: msg }, null, 2));
  else p.log.error(`amiga: ${msg}`);
  return 1;
}

function printSingle(
  a: SessionAnalysis,
  mapped: SuggestionCandidate[],
  emit: EmitResult | undefined,
  seamProven: boolean,
  file: string,
): void {
  console.log(pc.bold('AMIGA — meta-mission detector over real session data'));
  console.log(`  transcript : ${file}`);
  console.log(`  session id : ${a.sessionId}`);
  console.log(`  tool-uses  : ${a.toolCount}`);
  console.log(`  top tools  : ${a.topTools.map(([t, c]) => `${t}×${c}`).join('  ')}`);
  console.log(`  mission id : ${a.missionId}`);

  console.log('');
  console.log(pc.bold('[detector] SkillCandidateDetector'));
  for (const c of mapped.slice(0, 12)) {
    console.log(
      `   - ${c.suggestedName.padEnd(34)} conf=${c.confidence.toFixed(2)} occ=${c.occurrences}`,
    );
  }

  console.log('');
  console.log(pc.bold('[CE-1] attribution'));
  console.log(
    `   captured=${a.attribution.captured}/${a.attribution.received} errors=${a.attribution.errors} ` +
      `ledger=${a.attribution.ledgerRows} weightSum=${a.attribution.weightSum.toFixed(3)}`,
  );
  for (const w of a.attribution.weights.slice(0, 6)) {
    console.log(`   - ${w.contributorId.padEnd(28)} weight=${w.weight.toFixed(3)} entries=${w.entryCount}`);
  }

  console.log('');
  printSink(mapped.length, emit);
  console.log('');
  console.log(seamProven ? pc.green('SEAM PROVEN') : pc.yellow('SEAM NOT PROVEN'));
}

function printCorpus(
  corpus: CorpusAnalysis,
  dir: string,
  emit: EmitResult | undefined,
  seamProven: boolean,
): void {
  console.log(pc.bold('AMIGA — corpus run (meta-mission detector over all sessions)'));
  console.log(`  projects dir : ${dir}`);
  console.log(
    `  transcripts  : ${corpus.sessionsAnalyzed} analyzed, ${corpus.sessionsSkipped} skipped (<2 tool-uses / unreadable)`,
  );
  console.log(`  tool-uses    : ${corpus.totalToolUses}`);
  console.log(`  CE-1         : captured ${corpus.totalCaptured} (errors ${corpus.totalErrors})`);
  console.log('');
  console.log(pc.bold('[CE-1] mean attribution weight per tool (across sessions)'));
  for (const w of corpus.meanWeights.slice(0, 6)) {
    console.log(
      `   - ${w.contributorId.padEnd(28)} mean=${w.meanWeight.toFixed(3)} sessions=${w.sessions}`,
    );
  }
  console.log('');
  console.log(pc.bold(`[detector] ${corpus.candidates.length} aggregated candidates`));
  for (const c of corpus.candidates.slice(0, 20)) {
    console.log(
      `   - ${c.suggestedName.padEnd(34)} conf=${c.confidence.toFixed(2)} occ=${c.occurrences}`,
    );
  }
  console.log('');
  printSink(corpus.candidates.length, emit);
  console.log('');
  console.log(seamProven ? pc.green('SEAM PROVEN') : pc.yellow('SEAM NOT PROVEN'));
}

function printSink(mappedCount: number, emit: EmitResult | undefined): void {
  console.log(pc.bold('[sink] sc:suggest (SuggestionStore)'));
  if (emit) {
    console.log(`   wrote ${emit.patternsDir}/suggestions.json`);
    console.log(
      `   ${emit.mapped} mapped, ${emit.added} new · pending=${emit.counts.pending} ` +
        `accepted=${emit.counts.accepted} deferred=${emit.counts.deferred} dismissed=${emit.counts.dismissed}`,
    );
    console.log('   review with: skill-creator suggest   (or  /sc:suggest )');
  } else {
    console.log(`   ${mappedCount} candidates ready to emit (dry-run). Pass --emit to write suggestions.json.`);
  }
}

function showHelp(): void {
  console.log(`
skill-creator amiga - Mine skill candidates from session transcripts via the
                      AMIGA meta-mission detector + CE-1 attribution (→ sc:suggest)

Usage:
  skill-creator amiga                  Analyze the largest transcript (default)
  skill-creator amiga <transcript>     Analyze a specific transcript JSONL
  skill-creator amiga --corpus         Analyze + aggregate ALL transcripts
  skill-creator am --corpus --emit     Aggregate the corpus and land candidates

Options:
  --corpus               Process every transcript in the projects dir and
                         aggregate candidates (deduped, occurrences summed).
  --emit                 Land candidates in <patterns-dir>/suggestions.json via
                         SuggestionStore so they surface in sc:suggest. Dry-run
                         by default (writes nothing without --emit).
  --patterns-dir <dir>   Target patterns dir for --emit (default .planning/patterns).
  --projects-dir <dir>   Transcript source dir (default: the cwd's ~/.claude
                         project transcript folder).
  --limit <n>            Cap emitted workflow candidates (default 10 single / 20 corpus).
                         Structural candidates are always kept.
  --json                 Machine-readable output.
  --help, -h             Show this help.

Exit Codes:
  0   Seam proven — candidate(s) detected AND CE-1 attribution captured
  1   No transcripts found, nothing analyzable, no attribution, or an error

Examples:
  skill-creator amiga
  skill-creator amiga --corpus
  skill-creator amiga --corpus --emit
  skill-creator amiga ~/.claude/projects/<slug>/<id>.jsonl --json
`);
}

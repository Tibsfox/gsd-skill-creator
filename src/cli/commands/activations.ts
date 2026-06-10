/**
 * CLI command: `skill-creator activations` (alias `act`)
 *
 * Mines per-skill activation counts from the real Claude Code session corpus
 * by parsing every transcript with `TranscriptParser.extractActiveSkills()` (the
 * same v1.49.1027-widened miner used by co-activation tracking: Skill tool_use
 * blocks + `<command-name>` tags, 15-builtin denylist). Aggregates at session
 * granularity (count = number of SESSIONS in which a skill appeared, matching
 * co-activation mining semantics) and optionally writes the result back into
 * `.skill-index.json` via `SkillIndex.recordActivations()` (SET semantics —
 * re-runs are idempotent).
 *
 * Modes:
 *   skill-creator activations             Mine + report (dry-run, no writes)
 *   skill-creator activations --write     Mine + write into .skill-index.json
 *
 * Options:
 *   --corpus-dir <dir>   Transcript source dir (default: the cwd's ~/.claude project).
 *   --skills-dir <dir>   Skills dir for --write (default .claude/skills).
 *   --json               Machine-readable output.
 *   --write              Record counts into .skill-index.json (dry-run without this flag).
 *   --help, -h           Show help.
 *
 * Exit codes:
 *   0  Success (even when 0 activations found).
 *   1  Error.
 *
 * @module cli/commands/activations
 */

import * as os from 'node:os';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import * as p from '@clack/prompts';
import { defaultProjectsDir, listTranscripts } from '../../amiga/spike/transcript-reader.js';
import { TranscriptParser } from '../../observation/transcript-parser.js';
import { SkillStore } from '../../storage/skill-store.js';
import { SkillIndex } from '../../storage/skill-index.js';

interface Options {
  corpusDir?: string;
  skillsDir: string;
  json: boolean;
  write: boolean;
  help: boolean;
}

/** Parse argv (after the command word) into Options. Value-flags consume the next token. */
function parse(args: string[]): Options {
  const opts: Options = {
    skillsDir: '.claude/skills',
    json: false,
    write: false,
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--write') opts.write = true;
    else if (a.startsWith('--corpus-dir=')) opts.corpusDir = a.slice('--corpus-dir='.length);
    else if (a === '--corpus-dir') opts.corpusDir = args[++i];
    else if (a.startsWith('--skills-dir=')) opts.skillsDir = a.slice('--skills-dir='.length);
    else if (a === '--skills-dir') opts.skillsDir = args[++i] ?? opts.skillsDir;
  }
  return opts;
}

/** Get file mtime as an ISO-8601 string, or null on error. */
function fileMtimeISO(path: string): string | null {
  try {
    return new Date(statSync(path).mtimeMs).toISOString();
  } catch {
    return null;
  }
}

export async function activationsCommand(args: string[]): Promise<number> {
  const opts = parse(args);
  if (opts.help) {
    showHelp();
    return 0;
  }

  try {
    const corpusDir = opts.corpusDir ?? defaultProjectsDir(process.cwd(), os.homedir());
    const paths = listTranscripts(corpusDir);

    const parser = new TranscriptParser();
    // Per-skill: sessions in which it appeared, and ISO of the newest such session.
    const sessionCounts = new Map<string, number>();
    const lastActivationMap = new Map<string, string>();

    let sessionsScanned = 0;
    let sessionsWithActivations = 0;

    for (const transcriptPath of paths) {
      sessionsScanned++;
      let entries;
      try {
        entries = await parser.parse(transcriptPath);
      } catch {
        // Unreadable transcript — skip.
        continue;
      }

      const skills = parser.extractActiveSkills(entries);
      if (skills.length === 0) continue;
      sessionsWithActivations++;

      // Use the transcript file's mtime as a proxy for session timestamp.
      const sessionTs = fileMtimeISO(transcriptPath);

      for (const skillName of skills) {
        sessionCounts.set(skillName, (sessionCounts.get(skillName) ?? 0) + 1);
        if (sessionTs !== null) {
          const prev = lastActivationMap.get(skillName);
          if (prev === undefined || sessionTs > prev) {
            lastActivationMap.set(skillName, sessionTs);
          }
        }
      }
    }

    // Build the counts Map for recordActivations.
    const counts = new Map<string, { count: number; lastActivation: string | null }>();
    for (const [name, count] of sessionCounts) {
      counts.set(name, {
        count,
        lastActivation: lastActivationMap.get(name) ?? null,
      });
    }

    // Sort by count desc for display.
    const sortedSkills = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, lastActivation }]) => ({ name, count, lastActivation }));

    let recorded: string[] = [];
    let unknown: string[] = [];

    if (opts.write) {
      const store = new SkillStore(opts.skillsDir);
      const index = new SkillIndex(store, opts.skillsDir);
      await index.load();
      const all = await index.getAll();
      if (all.length === 0) {
        await index.rebuild();
      }
      const result = await index.recordActivations(counts);
      recorded = result.recorded;
      unknown = result.unknown;
    } else {
      // In dry-run, "unknown" = mined names not necessarily in index; we don't
      // load the index here (--write is required to touch disk). Report all
      // mined names as-is without index comparison.
      unknown = [];
    }

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            sessionsScanned,
            sessionsWithActivations,
            skills: sortedSkills,
            unknown,
            ...(opts.write ? { recorded: recorded.length, unknownCount: unknown.length } : {}),
          },
          null,
          2,
        ),
      );
      return 0;
    }

    // Human table.
    console.log(pc.bold('skill-creator activations — corpus activation mining'));
    console.log(`  corpus dir : ${corpusDir}`);
    console.log(
      `  sessions   : ${sessionsScanned} scanned, ${sessionsWithActivations} with activations`,
    );
    console.log('');

    if (sortedSkills.length === 0) {
      p.log.info('No skill activations found in corpus.');
    } else {
      const nameWidth = Math.max(4, ...sortedSkills.map((s) => s.name.length));
      console.log(
        `  ${'Skill'.padEnd(nameWidth)}  ${'Sessions'.padStart(8)}  Last Activation`,
      );
      console.log(`  ${'-'.repeat(nameWidth)}  ${'--------'}  ---------------`);
      for (const { name, count, lastActivation } of sortedSkills) {
        const ts = lastActivation ? lastActivation.slice(0, 10) : '—';
        console.log(`  ${name.padEnd(nameWidth)}  ${String(count).padStart(8)}  ${ts}`);
      }
    }

    if (opts.write) {
      console.log('');
      console.log(`  wrote .skill-index.json: ${recorded.length} recorded, ${unknown.length} unknown`);
      if (unknown.length > 0) {
        console.log('');
        console.log(pc.dim('  mined but not in index (no SKILL.md):'));
        for (const n of unknown) {
          console.log(pc.dim(`    - ${n}`));
        }
      }
    } else {
      console.log('');
      console.log(pc.dim('  dry-run — pass --write to record into .skill-index.json'));
    }

    console.log('');
    console.log(
      `  ${sortedSkills.length} distinct skill${sortedSkills.length !== 1 ? 's' : ''} mined`,
    );

    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts.json) console.log(JSON.stringify({ error: msg }, null, 2));
    else p.log.error(`activations: ${msg}`);
    return 1;
  }
}

function showHelp(): void {
  console.log(`
skill-creator activations - Mine per-skill activation counts from the session
                            corpus and optionally write them into .skill-index.json

Usage:
  skill-creator activations              Mine + report (dry-run, no writes)
  skill-creator activations --write      Mine + write into .skill-index.json
  skill-creator act --json               Machine-readable output (alias)

Options:
  --corpus-dir <dir>   Transcript source dir (default: the cwd's ~/.claude project).
  --skills-dir <dir>   Skills dir for --write (default .claude/skills).
  --json               Machine-readable output (stable JSON schema, see docs/CLI.md).
  --write              Record counts into .skill-index.json via SkillIndex.recordActivations()
                       (SET semantics — re-runs are idempotent). Dry-run without this flag.
  --help, -h           Show this help.

Exit Codes:
  0   Success (even when 0 activations found)
  1   Error

Examples:
  skill-creator activations
  skill-creator activations --write
  skill-creator activations --json --corpus-dir ~/.claude/projects/-my-proj
  skill-creator activations --write --skills-dir /path/to/.claude/skills
`);
}

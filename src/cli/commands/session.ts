/**
 * Session CLI command.
 *
 * Provides save/restore/handoff subcommands for session continuity.
 * Bridges the session-continuity library modules to the CLI so users
 * can capture snapshots, restore warm-start context, and generate
 * handoff skills from the command line.
 *
 * Subcommands:
 * - save: Capture a session snapshot from a transcript
 * - restore: Generate warm-start context from latest snapshot + STATE.md
 * - handoff: Generate a temporary SKILL.md encoding session state
 */

import { join } from 'node:path';
import { SnapshotManager } from '../../orchestrator/session-continuity/snapshot-manager.js';
import { SkillPreloadSuggester } from '../../orchestrator/session-continuity/skill-preload-suggester.js';
import { WarmStartGenerator } from '../../orchestrator/session-continuity/warm-start.js';
import { HandoffGenerator } from '../../orchestrator/session-continuity/handoff-generator.js';
import { ProjectStateReader } from '../../orchestrator/state/state-reader.js';

// ============================================================================
// Argument parsing helpers
// ============================================================================

/**
 * Extract a flag value from args in --key=value format.
 */
function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

// ============================================================================
// Main dispatcher
// ============================================================================

/**
 * Session CLI command entry point.
 *
 * Dispatches to save/restore/handoff subcommand handlers.
 *
 * @param args - Command-line arguments after 'session'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function sessionCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showSessionHelp();
    return 0;
  }

  const handlerArgs = args.slice(1);

  switch (subcommand) {
    case 'save':
      return handleSessionSave(handlerArgs);
    case 'restore':
      return handleSessionRestore(handlerArgs);
    case 'handoff':
      return handleSessionHandoff(handlerArgs);
    default:
      console.log(JSON.stringify({
        error: `Unknown session subcommand: ${subcommand}`,
        help: 'Available: save, restore, handoff',
      }, null, 2));
      return 1;
  }
}

// ============================================================================
// Save subcommand
// ============================================================================

/**
 * Handle `session save` subcommand.
 *
 * Captures a session snapshot from a transcript file and stores it.
 *
 * Required: --session-id, --transcript-path
 * Optional: --skills (comma-separated), --planning-dir
 */
async function handleSessionSave(args: string[]): Promise<number> {
  const sessionId = extractFlag(args, 'session-id');
  const transcriptPath = extractFlag(args, 'transcript-path');
  const skillsRaw = extractFlag(args, 'skills');
  const activeSkills = skillsRaw
    ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (!sessionId || !transcriptPath) {
    console.log(JSON.stringify({
      error: 'Missing required flags: --session-id and --transcript-path',
      help: 'Usage: skill-creator session save --session-id=<id> --transcript-path=<path>',
    }, null, 2));
    return 1;
  }

  try {
    const snapshotDir = resolveSnapshotDir(args);
    const manager = new SnapshotManager(snapshotDir);
    const snapshot = await manager.generate(transcriptPath, sessionId, activeSkills);

    if (!snapshot) {
      console.log(JSON.stringify({
        info: 'No snapshot generated (empty or missing transcript)',
      }, null, 2));
      return 0;
    }

    await manager.store(snapshot);
    console.log(JSON.stringify({
      saved: true,
      session_id: snapshot.session_id,
    }, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Restore subcommand
// ============================================================================

/**
 * Handle `session restore` subcommand.
 *
 * Generates warm-start context from the latest snapshot + STATE.md.
 *
 * Optional: --planning-dir, --format (json|context, default: json)
 */
async function handleSessionRestore(args: string[]): Promise<number> {
  const format = extractFlag(args, 'format') ?? 'json';
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');

  try {
    const snapshotDir = resolveSnapshotDir(args);
    const snapshotManager = new SnapshotManager(snapshotDir);
    const preloadSuggester = new SkillPreloadSuggester();
    const stateReader = new ProjectStateReader(planningDir);

    const generator = new WarmStartGenerator(
      snapshotManager,
      preloadSuggester,
      stateReader,
      planningDir,
    );

    const context = await generator.generate();

    if (!context) {
      console.log(JSON.stringify({
        info: 'No snapshot available for warm-start',
      }, null, 2));
      return 0;
    }

    if (format === 'context') {
      console.log(formatAsMarkdown(context));
    } else {
      console.log(JSON.stringify(context, null, 2));
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Handoff subcommand
// ============================================================================

/**
 * Handle `session handoff` subcommand.
 *
 * Gets the latest snapshot, reads project state, and generates a
 * temporary SKILL.md encoding session state for handoff.
 *
 * Optional: --planning-dir, --output (default: .claude/skills/)
 */
async function handleSessionHandoff(args: string[]): Promise<number> {
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');
  const outputDir = extractFlag(args, 'output') ?? '.claude/skills/';

  try {
    const snapshotDir = resolveSnapshotDir(args);
    const snapshotManager = new SnapshotManager(snapshotDir);
    const stateReader = new ProjectStateReader(planningDir);

    const snapshot = await snapshotManager.getLatest();

    if (!snapshot) {
      console.log(JSON.stringify({
        info: 'No snapshot available for handoff',
      }, null, 2));
      return 0;
    }

    const projectState = await stateReader.read();
    const stateContext = {
      decisions: projectState.state?.decisions ?? [],
      blockers: projectState.state?.blockers ?? [],
    };

    const handoffGenerator = new HandoffGenerator();
    const result = await handoffGenerator.generate(snapshot, stateContext, outputDir);

    console.log(JSON.stringify({
      success: true,
      path: result.path,
    }, null, 2));

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve the snapshot directory path from --planning-dir flag.
 * Defaults to `.planning/patterns` in cwd.
 */
function resolveSnapshotDir(args: string[]): string {
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');
  return join(planningDir, 'patterns');
}

/**
 * Format a WarmStartContext as human-readable markdown context.
 *
 * Produces sections: Session Context, Decisions, Blockers,
 * Suggested Skills, Stale Files.
 */
function formatAsMarkdown(context: {
  summary: string;
  files_modified: string[];
  active_skills: string[];
  open_questions: string[];
  metrics: { duration_minutes: number; tool_calls: number };
  decisions: string[];
  blockers: string[];
  suggested_skills: string[];
  stale_files: string[];
  staleness_warning: string | null;
}): string {
  const sections: string[] = [];

  sections.push('## Session Context');
  sections.push(`**Summary:** ${context.summary}`);
  sections.push(`**Duration:** ${context.metrics.duration_minutes} min | **Tool Calls:** ${context.metrics.tool_calls}`);

  if (context.files_modified.length > 0) {
    sections.push(`**Files Modified:** ${context.files_modified.join(', ')}`);
  }

  if (context.active_skills.length > 0) {
    sections.push(`**Active Skills:** ${context.active_skills.join(', ')}`);
  }

  if (context.open_questions.length > 0) {
    sections.push(`**Open Questions:** ${context.open_questions.join(', ')}`);
  }

  sections.push('');

  if (context.decisions.length > 0) {
    sections.push('## Decisions');
    context.decisions.forEach(d => sections.push(`- ${d}`));
    sections.push('');
  }

  if (context.blockers.length > 0) {
    sections.push('## Blockers');
    context.blockers.forEach(b => sections.push(`- ${b}`));
    sections.push('');
  }

  if (context.suggested_skills.length > 0) {
    sections.push('## Suggested Skills');
    context.suggested_skills.forEach(s => sections.push(`- ${s}`));
    sections.push('');
  }

  if (context.stale_files.length > 0) {
    sections.push('## Stale Files');
    context.stale_files.forEach(f => sections.push(`- ${f}`));
    sections.push('');
  }

  if (context.staleness_warning) {
    sections.push(`**Warning:** ${context.staleness_warning}`);
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// Help text
// ============================================================================

/**
 * Display help text for the session command.
 */
function showSessionHelp(): void {
  console.log(`
skill-creator session - Manage session continuity

Usage:
  skill-creator session <subcommand> [options]
  skill-creator sess <subcommand> [options]

Subcommands:
  save      Capture a session snapshot from a transcript
  restore   Generate warm-start context from latest snapshot + STATE.md
  handoff   Generate a temporary SKILL.md encoding session state

Save Options:
  --session-id=<id>         Session identifier (required)
  --transcript-path=<path>  Path to transcript JSONL file (required)
  --skills=<a,b,c>          Comma-separated active skills
  --planning-dir=<path>     Override .planning/ directory path

Restore Options:
  --format=json|context     Output format (default: json)
  --planning-dir=<path>     Override .planning/ directory path

Handoff Options:
  --output=<dir>            Output directory (default: .claude/skills/)
  --planning-dir=<path>     Override .planning/ directory path

Examples:
  skill-creator session save --session-id=abc --transcript-path=t.jsonl
  skill-creator sess save --session-id=abc --transcript-path=t.jsonl --skills=ts,git
  skill-creator session restore
  skill-creator session restore --format=context
  skill-creator session handoff
  skill-creator sess handoff --output=/tmp/skills
`);
}

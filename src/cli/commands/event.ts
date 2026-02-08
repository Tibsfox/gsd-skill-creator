/**
 * CLI subcommand handler for event management.
 *
 * Provides list/emit/consume/suggest/expire subcommands
 * for managing inter-skill communication events. Follows the same
 * dispatch pattern as bundle.ts:
 * - JSON output by default for agent consumption
 * - --pretty for human-readable output
 * - Exit code 1 with { error } JSON on failure
 *
 * Subcommands:
 * - list: Show all events or pending events
 * - emit: Fire a new event
 * - consume: Consume a pending event
 * - suggest: Show co-activation-based event connection suggestions
 * - expire: Mark all TTL-exceeded pending events as expired
 */

import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { EventStore, emitEvent, consumeEvent, expireStaleEvents, EventNameSchema } from '../../events/index.js';
import { EventSuggester } from '../../events/event-suggester.js';

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

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

// ============================================================================
// Directory resolution
// ============================================================================

/**
 * Resolve the patterns directory.
 * Events live at `.planning/patterns/` in the project root.
 */
function resolvePatternsDir(): string {
  return join(process.cwd(), '.planning', 'patterns');
}

// ============================================================================
// Help text
// ============================================================================

function showEventHelp(): void {
  console.log(`
skill-creator event - Manage skill events

Usage:
  skill-creator event <subcommand> [options]
  skill-creator ev <subcommand> [options]

Subcommands:
  list, l          List all events or pending events
  emit, e          Emit a new event
  consume, c       Consume a pending event
  suggest, s       Show event connection suggestions from co-activation patterns
  expire           Mark all TTL-exceeded pending events as expired

List Options:
  --pending         Show only pending, non-expired events
  --pretty          Human-readable output

Emit Options:
  --name=<event>    Event name in category:action format (required)
  --skill=<skill>   Emitting skill name (required)
  --ttl=<hours>     TTL in hours (default: 24)

Consume Options:
  --name=<event>    Event name to consume (required)
  --skill=<skill>   Consuming skill name (required)

Suggest Options:
  --pretty          Human-readable output

Examples:
  skill-creator event list
  skill-creator ev l --pending
  skill-creator event emit --name=lint:complete --skill=eslint-config
  skill-creator ev e --name=test:pass --skill=vitest-runner --ttl=12
  skill-creator event consume --name=lint:complete --skill=report-gen
  skill-creator event suggest
  skill-creator ev s --pretty
  skill-creator event expire
`);
}

// ============================================================================
// List subcommand
// ============================================================================

async function handleList(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const pending = hasFlag(args, 'pending');

  try {
    const patternsDir = resolvePatternsDir();
    const store = new EventStore(patternsDir);
    const events = pending ? await store.getPending() : await store.readAll();

    if (pretty) {
      if (events.length === 0) {
        console.log(pending ? 'No pending events.' : 'No events recorded.');
      } else {
        console.log(pending ? 'Pending Events:' : 'All Events:');
        for (const event of events) {
          const ttlInfo = pending
            ? ` (TTL: ${event.ttl_hours ?? 24}h)`
            : ` [${event.status}]`;
          console.log(`  ${event.event_name} by ${event.emitted_by}${ttlInfo}`);
        }
      }
    } else {
      console.log(JSON.stringify({ events }, null, 2));
    }

    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Emit subcommand
// ============================================================================

async function handleEmit(args: string[]): Promise<number> {
  const name = extractFlag(args, 'name');
  const skill = extractFlag(args, 'skill');
  const ttlFlag = extractFlag(args, 'ttl');

  if (!name) {
    console.log(JSON.stringify({
      error: '--name is required for emit (e.g., --name=lint:complete)',
    }, null, 2));
    return 1;
  }

  if (!skill) {
    console.log(JSON.stringify({
      error: '--skill is required for emit (e.g., --skill=eslint-config)',
    }, null, 2));
    return 1;
  }

  // Validate event name format
  const validation = EventNameSchema.safeParse(name);
  if (!validation.success) {
    console.log(JSON.stringify({
      error: 'Event name must be in category:action format (e.g., lint:complete)',
    }, null, 2));
    return 1;
  }

  const ttlHours = ttlFlag ? parseInt(ttlFlag, 10) : 24;

  try {
    const patternsDir = resolvePatternsDir();
    await emitEvent(patternsDir, name, skill, { ttlHours });

    console.log(JSON.stringify({
      success: true,
      event_name: name,
      emitted_by: skill,
      ttl_hours: ttlHours,
    }, null, 2));

    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Consume subcommand
// ============================================================================

async function handleConsume(args: string[]): Promise<number> {
  const name = extractFlag(args, 'name');
  const skill = extractFlag(args, 'skill');

  if (!name) {
    console.log(JSON.stringify({
      error: '--name is required for consume (e.g., --name=lint:complete)',
    }, null, 2));
    return 1;
  }

  if (!skill) {
    console.log(JSON.stringify({
      error: '--skill is required for consume (e.g., --skill=test-runner)',
    }, null, 2));
    return 1;
  }

  try {
    const patternsDir = resolvePatternsDir();
    await consumeEvent(patternsDir, name, skill);

    console.log(JSON.stringify({
      success: true,
      event_name: name,
      consumed_by: skill,
    }, null, 2));

    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Suggest subcommand
// ============================================================================

async function handleSuggest(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');

  try {
    const patternsDir = resolvePatternsDir();

    // Read sessions from sessions.jsonl
    const sessionsPath = join(patternsDir, 'sessions.jsonl');
    let sessions: Array<{ sessionId: string; startTime: number; endTime: number; durationMinutes: number; source: string; reason: string; metrics: any; topCommands: string[]; topFiles: string[]; topTools: string[]; activeSkills: string[] }> = [];

    try {
      const content = await readFile(sessionsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const envelope = JSON.parse(line);
          if (envelope.data) {
            sessions.push(envelope.data);
          }
        } catch {
          // Skip corrupted lines
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      // No sessions file -- empty suggestions
    }

    const suggester = new EventSuggester();
    // For now, pass empty skill events since we don't have a skill index here
    const skillEvents = new Map<string, { emits?: string[]; listens?: string[] }>();
    const suggestions = suggester.suggest(sessions as any, skillEvents);

    if (pretty) {
      if (suggestions.length === 0) {
        console.log('No event connection suggestions.');
        console.log('Run sessions to build co-activation data.');
      } else {
        console.log('Event Connection Suggestions:');
        for (const s of suggestions) {
          console.log(`  ${s.emitterSkill} --[${s.suggestedEvent}]--> ${s.listenerSkill}`);
          console.log(`    Co-activation: ${s.coActivationScore}, Sessions: ${s.sessionCount}`);
        }
      }
    } else {
      console.log(JSON.stringify({ suggestions }, null, 2));
    }

    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Expire subcommand
// ============================================================================

async function handleExpire(_args: string[]): Promise<number> {
  try {
    const patternsDir = resolvePatternsDir();
    await expireStaleEvents(patternsDir);

    console.log(JSON.stringify({ success: true }, null, 2));
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Main dispatcher
// ============================================================================

/**
 * Event CLI command entry point.
 *
 * Dispatches to the appropriate subcommand handler based on the first argument.
 *
 * @param args - Command-line arguments after 'event'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function eventCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  // Strip the subcommand from args for handler consumption
  const handlerArgs = args.slice(1);

  switch (subcommand) {
    case 'list':
    case 'l':
      return handleList(handlerArgs);

    case 'emit':
    case 'e':
      return handleEmit(handlerArgs);

    case 'consume':
    case 'c':
      return handleConsume(handlerArgs);

    case 'suggest':
    case 's':
      return handleSuggest(handlerArgs);

    case 'expire':
      return handleExpire(handlerArgs);

    case 'help':
    case '-h':
    case '--help':
      showEventHelp();
      return 0;

    default:
      showEventHelp();
      return 1;
  }
}

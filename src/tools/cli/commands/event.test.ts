/**
 * Tests for the event CLI command handler.
 *
 * Covers:
 * - event list returns JSON array of all events (empty array when no file)
 * - event list --pending returns only pending, non-expired events
 * - event list --pretty outputs human-readable table format
 * - event emit --name=lint:complete --skill=eslint-config emits event and returns success JSON
 * - event emit without required flags returns error JSON with exit code 1
 * - event emit --name=BadFormat --skill=x rejects invalid event name format
 * - event consume --name=lint:complete --skill=test-runner consumes event and returns success JSON
 * - event suggest returns JSON array of event connection suggestions (empty when no sessions)
 * - event suggest --pretty outputs human-readable suggestion list
 * - event help shows help text
 * - Unknown subcommand shows help text with exit code 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test setup
// ============================================================================

let tempDir: string;
let patternsDir: string;
let originalCwd: () => string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'event-cli-test-'));
  patternsDir = join(tempDir, '.planning', 'patterns');
  await mkdir(patternsDir, { recursive: true });

  // Mock process.cwd() to point at temp dir
  originalCwd = process.cwd.bind(process);
  vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================
// Helper: capture console.log output
// ============================================================================

function captureLog() {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(' '));
  });
  return { logs, spy };
}

// ============================================================================
// eventCommand dispatch
// ============================================================================

describe('eventCommand - dispatch', () => {
  it('returns 0 with help subcommand', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['help']);
    spy.mockRestore();
    expect(code).toBe(0);
    const output = logs.join('\n');
    expect(output).toContain('event');
  });

  it('returns 0 with -h flag', async () => {
    const { eventCommand } = await import('./event.js');
    const { spy } = captureLog();
    const code = await eventCommand(['-h']);
    spy.mockRestore();
    expect(code).toBe(0);
  });

  it('returns 1 with unknown subcommand', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['unknown-sub']);
    spy.mockRestore();
    expect(code).toBe(1);
  });
});

// ============================================================================
// event list
// ============================================================================

describe('eventCommand - list', () => {
  it('returns JSON array of all events (empty array when no file)', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['list']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.events).toEqual([]);
  });

  it('returns only pending non-expired events with --pending', async () => {
    // First emit an event, then list --pending
    const { eventCommand } = await import('./event.js');

    // Emit an event
    const emitSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await eventCommand(['emit', '--name=lint:complete', '--skill=eslint-config']);
    emitSpy.mockRestore();

    // List pending
    const { logs, spy } = captureLog();
    const code = await eventCommand(['list', '--pending']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.events).toHaveLength(1);
    expect(output.events[0].event_name).toBe('lint:complete');
    expect(output.events[0].status).toBe('pending');
  });

  it('outputs human-readable format with --pretty', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['list', '--pretty']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = logs.join('\n');
    // Pretty output should contain something readable (even if empty)
    expect(output).toBeTruthy();
  });
});

// ============================================================================
// event emit
// ============================================================================

describe('eventCommand - emit', () => {
  it('emits event and returns success JSON', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['emit', '--name=lint:complete', '--skill=eslint-config']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.success).toBe(true);
    expect(output.event_name).toBe('lint:complete');
    expect(output.emitted_by).toBe('eslint-config');
  });

  it('returns error JSON with exit code 1 when --name is missing', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['emit', '--skill=test-skill']);
    spy.mockRestore();

    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toBeTruthy();
  });

  it('returns error JSON with exit code 1 when --skill is missing', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['emit', '--name=lint:complete']);
    spy.mockRestore();

    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toBeTruthy();
  });

  it('rejects invalid event name format', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['emit', '--name=BadFormat', '--skill=test-skill']);
    spy.mockRestore();

    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toContain('category:action');
  });
});

// ============================================================================
// event consume
// ============================================================================

describe('eventCommand - consume', () => {
  it('consumes event and returns success JSON', async () => {
    const { eventCommand } = await import('./event.js');

    // Emit first
    const emitSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await eventCommand(['emit', '--name=lint:complete', '--skill=eslint-config']);
    emitSpy.mockRestore();

    // Consume
    const { logs, spy } = captureLog();
    const code = await eventCommand(['consume', '--name=lint:complete', '--skill=test-runner']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.success).toBe(true);
    expect(output.event_name).toBe('lint:complete');
    expect(output.consumed_by).toBe('test-runner');
  });

  it('returns error when --name is missing', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['consume', '--skill=test-runner']);
    spy.mockRestore();

    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toBeTruthy();
  });
});

// ============================================================================
// event suggest
// ============================================================================

describe('eventCommand - suggest', () => {
  it('returns JSON array of event connection suggestions (empty when no sessions)', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['suggest']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.suggestions).toEqual([]);
  });

  it('outputs human-readable suggestion list with --pretty', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['suggest', '--pretty']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = logs.join('\n');
    expect(output).toBeTruthy();
  });
});

// ============================================================================
// event expire
// ============================================================================

describe('eventCommand - expire', () => {
  it('runs expire and returns success JSON', async () => {
    const { eventCommand } = await import('./event.js');
    const { logs, spy } = captureLog();
    const code = await eventCommand(['expire']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.success).toBe(true);
  });
});

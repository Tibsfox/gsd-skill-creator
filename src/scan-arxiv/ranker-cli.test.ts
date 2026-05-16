// === Unit tests for the CLI judge backend ===
//
// Verifies that `buildCliJudge` shells out to `claude` with the expected
// arguments, pipes the prompt over stdin, and parses the JSON envelope.
// The `node:child_process.spawn` call is mocked so no real subprocess runs.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ArxivPaper } from './types.js';

// ── Mock child_process.spawn before importing ranker ────────────────────────

interface SpawnCall {
  cmd: string;
  args: readonly string[];
  cwd: string | undefined;
  stdin: string;
}

const spawnCalls: SpawnCall[] = [];
let nextStdout = '';
let nextExitCode = 0;
let nextSpawnError: Error | null = null;

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>(
    'node:child_process',
  );
  return {
    ...actual,
    spawn: (cmd: string, args: readonly string[], opts: { cwd?: string }) => {
      const stdin = new PassThrough();
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      const child = new EventEmitter() as EventEmitter & {
        stdin: PassThrough;
        stdout: PassThrough;
        stderr: PassThrough;
      };
      child.stdin = stdin;
      child.stdout = stdout;
      child.stderr = stderr;

      // Capture what was written to stdin
      const chunks: Buffer[] = [];
      stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
      stdin.on('finish', () => {
        const written = Buffer.concat(chunks).toString();
        spawnCalls.push({ cmd, args, cwd: opts.cwd, stdin: written });
        if (nextSpawnError) {
          process.nextTick(() => child.emit('error', nextSpawnError));
          return;
        }
        process.nextTick(() => {
          stdout.write(nextStdout);
          stdout.end();
          stderr.end();
          child.emit('close', nextExitCode);
        });
      });

      return child;
    },
  };
});

// Import AFTER the mock so the dynamic spawn binding is hooked.
const { buildCliJudge } = await import('./ranker.js');

// ── Helpers ─────────────────────────────────────────────────────────────────

const SAMPLE_PAPER: ArxivPaper = {
  arxivId: '2605.99999',
  title: 'Test Paper on Multi-Agent Coordination',
  authors: ['T. Author'],
  abstract:
    'We propose a multi-agent coordination protocol over MCP that improves dispatch latency.',
  categories: ['cs.MA', 'cs.AI'],
  publishedAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-10T00:00:00.000Z',
  pdfUrl: 'https://arxiv.org/pdf/2605.99999',
  absUrl: 'https://arxiv.org/abs/2605.99999',
};

const VALID_RESULT_PAYLOAD = JSON.stringify({
  subscores: {
    'agent-orchestration': 0.85,
    'skill-design': 0.4,
    'code-gen': 0.2,
    'memory-retrieval': 0.1,
  },
  rationale: 'Multi-agent coordination over MCP is the core contribution.',
});

function envelope(opts: { result: string; isError?: boolean }): string {
  return JSON.stringify({
    type: 'result',
    is_error: opts.isError ?? false,
    result: opts.result,
    session_id: 'mock-session',
    total_cost_usd: 0.001,
  });
}

beforeEach(() => {
  spawnCalls.length = 0;
  nextStdout = '';
  nextExitCode = 0;
  nextSpawnError = null;
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('buildCliJudge — claude CLI subprocess backend', () => {
  it('spawns `claude` with the documented argv shape', async () => {
    nextStdout = envelope({ result: VALID_RESULT_PAYLOAD });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await judge(SAMPLE_PAPER);

    expect(spawnCalls).toHaveLength(1);
    const call = spawnCalls[0];
    expect(call.cmd).toBe('claude');
    expect(call.args).toContain('-p');
    expect(call.args).toContain('--output-format');
    expect(call.args).toContain('json');
    expect(call.args).toContain('--model');
    expect(call.args).toContain('claude-haiku-4-5-20251001');
    expect(call.args).toContain('--no-session-persistence');
    expect(call.args).toContain('--exclude-dynamic-system-prompt-sections');
    expect(call.args).toContain('--max-budget-usd');
    expect(call.args).toContain('0.2');
  });

  it('runs from os.tmpdir() so the repo CLAUDE.md is not auto-discovered', async () => {
    nextStdout = envelope({ result: VALID_RESULT_PAYLOAD });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await judge(SAMPLE_PAPER);
    expect(spawnCalls[0].cwd).toBeDefined();
    expect(spawnCalls[0].cwd!.length).toBeGreaterThan(0);
    // tmpdir on linux is typically /tmp; on macOS /var/folders/...; just assert non-repo
    expect(spawnCalls[0].cwd).not.toContain('gsd-skill-creator');
  });

  it('pipes the judge prompt over stdin (no shell-escaping)', async () => {
    nextStdout = envelope({ result: VALID_RESULT_PAYLOAD });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await judge(SAMPLE_PAPER);
    const written = spawnCalls[0].stdin;
    expect(written.length).toBeGreaterThan(50);
    expect(written).toContain(SAMPLE_PAPER.title);
    expect(written).toContain(SAMPLE_PAPER.abstract);
  });

  it('parses a successful envelope into a JudgeResult', async () => {
    nextStdout = envelope({ result: VALID_RESULT_PAYLOAD });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    const result = await judge(SAMPLE_PAPER);
    expect(result.subscores['agent-orchestration']).toBe(0.85);
    expect(result.subscores['code-gen']).toBe(0.2);
    expect(result.rationale).toContain('Multi-agent coordination');
  });

  it('throws when the CLI returns is_error=true', async () => {
    nextStdout = envelope({ result: 'Not logged in', isError: true });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await expect(judge(SAMPLE_PAPER)).rejects.toThrow(/Not logged in/);
  });

  it('throws when stdout is not parseable JSON', async () => {
    nextStdout = 'this is not json at all';
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await expect(judge(SAMPLE_PAPER)).rejects.toThrow(/non-JSON stdout/);
  });

  it('throws with exit code context when subprocess exits non-zero', async () => {
    nextStdout = '';
    nextExitCode = 1;
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.20);
    await expect(judge(SAMPLE_PAPER)).rejects.toThrow(/exited 1/);
  });

  it('honors a custom maxBudgetUsd argument', async () => {
    nextStdout = envelope({ result: VALID_RESULT_PAYLOAD });
    const judge = buildCliJudge('claude-haiku-4-5-20251001', 0.55);
    await judge(SAMPLE_PAPER);
    expect(spawnCalls[0].args).toContain('0.55');
  });
});

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HELPER = join(process.cwd(), '.claude/hooks/lib/hook-output.cjs');

function runScript(scriptBody: string, stdin = ''): { stdout: string; code: number | null } {
  const dir = mkdtempSync(join(tmpdir(), 'hook-output-test-'));
  const scriptPath = join(dir, 'runner.cjs');
  writeFileSync(scriptPath, scriptBody);
  const res = spawnSync('node', [scriptPath], {
    input: stdin,
    encoding: 'utf8',
  });
  return { stdout: res.stdout, code: res.status };
}

describe('hook-output helper', () => {
  it('readStdinSync returns {} on empty stdin', () => {
    const { stdout, code } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       const input = h.readStdinSync();
       process.stdout.write(JSON.stringify(input));`,
      ''
    );
    expect(code).toBe(0);
    expect(stdout).toBe('{}');
  });

  it('readStdinSync parses valid JSON', () => {
    const { stdout } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       const input = h.readStdinSync();
       process.stdout.write(JSON.stringify(input));`,
      '{"session_id":"abc","cwd":"/tmp"}'
    );
    const parsed = JSON.parse(stdout);
    expect(parsed.session_id).toBe('abc');
  });

  it('readStdinSync returns {} on malformed JSON', () => {
    const { stdout, code } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       const input = h.readStdinSync();
       process.stdout.write(JSON.stringify(input));`,
      '{not valid json'
    );
    expect(code).toBe(0);
    expect(stdout).toBe('{}');
  });

  it('emit wraps content in canonical envelope', () => {
    const { stdout } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       h.emit('TestEvent', 'hello');`
    );
    const parsed = JSON.parse(stdout);
    expect(parsed.hookSpecificOutput.hookEventName).toBe('TestEvent');
    expect(parsed.hookSpecificOutput.additionalContext).toBe('hello');
  });

  it('emit suppresses empty payloads', () => {
    const { stdout } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       h.emit('TestEvent', '');
       h.emit('TestEvent', null);`
    );
    expect(stdout).toBe('');
  });

  it('runHook silences thrown errors and exits 0', () => {
    const { stdout, code } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       h.runHook(() => { throw new Error('boom'); });`
    );
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('runHook passes parsed input to handler', () => {
    const { stdout } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       h.runHook((input) => { h.emit('Echo', input.msg); });`,
      '{"msg":"ping"}'
    );
    const parsed = JSON.parse(stdout);
    expect(parsed.hookSpecificOutput.additionalContext).toBe('ping');
  });

  it('emitStructured merges arbitrary fields', () => {
    const { stdout } = runScript(
      `const h = require(${JSON.stringify(HELPER)});
       h.emitStructured('X', { additionalContext: 'ctx', decision: 'allow' });`
    );
    const parsed = JSON.parse(stdout);
    expect(parsed.hookSpecificOutput.decision).toBe('allow');
    expect(parsed.hookSpecificOutput.additionalContext).toBe('ctx');
  });
});

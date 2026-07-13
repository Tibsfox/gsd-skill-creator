import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const HOOK_PATH = join(__dirname, 'dev-memory-session-end.cjs');
const NODE = process.execPath;
const CANDIDATES = 'dev-memory-candidates.json';

/** Run the hook with a given cwd + env; returns true if it exited cleanly. */
function runHook(cwd: string, env: Record<string, string> = {}): boolean {
  try {
    execSync(`echo '${JSON.stringify({ cwd })}' | "${NODE}" "${HOOK_PATH}"`, {
      timeout: 15000,
      stdio: 'ignore',
      env: { ...process.env, ...env },
    });
    return true;
  } catch {
    return false;
  }
}

describe('dev-memory-session-end hook', () => {
  let dir: string;
  let sessionsDir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'devmem-hook-'));
    sessionsDir = join(dir, '.planning', 'sessions');
    mkdirSync(sessionsDir, { recursive: true });
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('is a no-op by default (mode off) even with an active session', () => {
    writeFileSync(join(sessionsDir, 'current.meta.json'), '{"mission":"x"}');
    expect(runHook(dir)).toBe(true);
    // Default-off must never mine or write candidates.
    expect(existsSync(join(sessionsDir, CANDIDATES))).toBe(false);
  });

  it('respects an explicit off flag from .claude/gsd-skill-creator.json', () => {
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(
      join(dir, '.claude', 'gsd-skill-creator.json'),
      JSON.stringify({ 'gsd-skill-creator': { devMemoryOnEnd: 'off' } }),
    );
    writeFileSync(join(sessionsDir, 'current.meta.json'), '{"mission":"x"}');
    expect(runHook(dir)).toBe(true);
    expect(existsSync(join(sessionsDir, CANDIDATES))).toBe(false);
  });

  it('is a no-op when enabled but no observation session is active', () => {
    // Enabled via env, but no current.meta.json → must not act.
    expect(runHook(dir, { SC_DEV_MEMORY_ON_END: 'dry' })).toBe(true);
    expect(existsSync(join(sessionsDir, CANDIDATES))).toBe(false);
  });

  it('exits cleanly with empty stdin', () => {
    expect(() =>
      execSync(`echo '' | "${NODE}" "${HOOK_PATH}"`, { timeout: 15000, stdio: 'ignore' }),
    ).not.toThrow();
  });
});

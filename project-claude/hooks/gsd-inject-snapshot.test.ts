import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const HOOK_PATH = join(__dirname, 'gsd-inject-snapshot.js');
const NODE = process.execPath; // Absolute path to node binary

describe('gsd-inject-snapshot hook', () => {
  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('exits cleanly whether or not the CLI is available', () => {
    // The hook shells out to the skill-creator CLI: silent (empty) when the CLI
    // is unavailable, a real snapshot when it IS (e.g. built in CI). Either way
    // it must exit cleanly with string output and never throw.
    const result = execSync(`"${NODE}" "${HOOK_PATH}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    expect(typeof result).toBe('string');
  });

  it('does not throw on execution', () => {
    expect(() =>
      execSync(`"${NODE}" "${HOOK_PATH}"`, {
        timeout: 15000,
      })
    ).not.toThrow();
  });
});

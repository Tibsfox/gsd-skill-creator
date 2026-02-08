import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const HOOK_PATH = join(__dirname, 'gsd-inject-snapshot.js');
const NODE = process.execPath; // Absolute path to node binary

describe('gsd-inject-snapshot hook', () => {
  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('exits cleanly even when CLI is unavailable', () => {
    // npx inside the hook fails silently; no output expected
    const result = execSync(`"${NODE}" "${HOOK_PATH}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    expect(result.trim()).toBe('');
  });

  it('does not throw on execution', () => {
    expect(() =>
      execSync(`"${NODE}" "${HOOK_PATH}"`, {
        timeout: 15000,
      })
    ).not.toThrow();
  });
});

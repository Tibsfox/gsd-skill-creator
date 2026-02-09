import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const HOOK_PATH = join(__dirname, 'gsd-save-work-state.js');
const NODE = process.execPath; // Absolute path to node binary

describe('gsd-save-work-state hook', () => {
  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('exits cleanly even when CLI is unavailable', () => {
    // Use absolute node path; npx inside the hook fails silently
    const result = execSync(`echo '{}' | "${NODE}" "${HOOK_PATH}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    // No output expected (silent failure on npx call)
    expect(result.trim()).toBe('');
  });

  it('accepts session context via stdin', () => {
    const input = JSON.stringify({ session_id: 'test-123', cwd: process.cwd() });
    expect(() =>
      execSync(`echo '${input}' | "${NODE}" "${HOOK_PATH}"`, {
        timeout: 15000,
      })
    ).not.toThrow();
  });
});

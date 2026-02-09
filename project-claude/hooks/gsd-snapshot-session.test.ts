import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

const HOOK_PATH = join(__dirname, 'gsd-snapshot-session.js');
const NODE = process.execPath; // Absolute path to node binary

describe('gsd-snapshot-session hook', () => {
  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('exits cleanly even when CLI is unavailable', () => {
    // Pipe empty JSON with no transcript_path -- should exit(0) early
    const result = execSync(`echo '{}' | "${NODE}" "${HOOK_PATH}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    // No output expected (exits early when no transcript_path)
    expect(result.trim()).toBe('');
  });

  it('accepts session context via stdin without hanging', () => {
    const input = JSON.stringify({
      session_id: 'test-123',
      transcript_path: '/nonexistent/transcript.jsonl',
      cwd: process.cwd(),
    });
    // Should fail silently (transcript doesn't exist, CLI unavailable)
    expect(() =>
      execSync(`echo '${input}' | "${NODE}" "${HOOK_PATH}"`, {
        timeout: 15000,
      })
    ).not.toThrow();
  });
});

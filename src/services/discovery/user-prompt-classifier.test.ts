import { describe, it, expect } from 'vitest';
import { classifyUserEntry, isRealUserPrompt } from './user-prompt-classifier.js';
import type { UserEntry } from './types.js';

function makeUserEntry(overrides: Partial<UserEntry> & { message: UserEntry['message'] }): UserEntry {
  const { message, ...rest } = overrides;
  return {
    type: 'user' as const,
    uuid: 'test-uuid',
    sessionId: 'test-session',
    timestamp: '2026-01-15T10:00:00.000Z',
    ...rest,
    message,
  };
}

describe('isRealUserPrompt', () => {
  // ====================================================================
  // Layer 1: Meta entries (6%)
  // ====================================================================

  it('returns false for isMeta: true', () => {
    const entry = makeUserEntry({
      isMeta: true,
      message: { role: 'user', content: 'Some meta content about the session' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('does not skip when isMeta is absent', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'Please refactor the auth module to use JWT' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  it('does not skip when isMeta is false', () => {
    const entry = makeUserEntry({
      isMeta: false,
      message: { role: 'user', content: 'Please refactor the auth module to use JWT' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  // ====================================================================
  // Layer 2: Tool result arrays (83%)
  // ====================================================================

  it('returns false for array content with tool_result blocks', () => {
    const entry = makeUserEntry({
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: 'file contents...' }],
      },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns false for mixed array with tool_result', () => {
    const entry = makeUserEntry({
      message: {
        role: 'user',
        content: [
          { type: 'text', text: 'Here you go' },
          { type: 'tool_result', tool_use_id: 'tu_1', content: '...' },
        ],
      },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns true for array content with only text blocks', () => {
    const entry = makeUserEntry({
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'Please refactor the auth module to use JWT' }],
      },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  it('returns false for empty array content', () => {
    const entry = makeUserEntry({
      message: {
        role: 'user',
        content: [] as any[],
      },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  // ====================================================================
  // Layer 3: Command messages (8%)
  // ====================================================================

  it('returns false for <command prefix', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: '<command name="run">npm test</command>' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns false for <local-command prefix', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: '<local-command>git status</local-command>' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns false for <system prefix', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: '<system>You are Claude...</system>' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns false for [Request interrupted prefix', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: '[Request interrupted by user]' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  // ====================================================================
  // Layer 4: Short entries
  // ====================================================================

  it('returns false for very short content (< 10 chars)', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'ok' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  it('returns false for content that is just whitespace', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: '     ' },
    });
    expect(isRealUserPrompt(entry)).toBe(false);
  });

  // ====================================================================
  // Real prompts (3.2%)
  // ====================================================================

  it('returns true for normal string prompt', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'Refactor the auth module to use JWT tokens' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  it('returns true for multi-line string prompt', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'Can you:\n1. Add tests\n2. Fix the linter errors' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  it('returns true for prompt starting with lowercase', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'please update the README with the new API docs' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });

  it('returns true for prompt with code', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'Why does this fail? `const x = await fetch(url)`' },
    });
    expect(isRealUserPrompt(entry)).toBe(true);
  });
});

describe('classifyUserEntry', () => {
  it('returns ExtractedPrompt for real prompt', () => {
    const entry = makeUserEntry({
      cwd: '/home/user/project',
      message: { role: 'user', content: 'Refactor the auth module to use JWT tokens' },
    });
    const result = classifyUserEntry(entry);
    expect(result).toEqual({
      text: 'Refactor the auth module to use JWT tokens',
      sessionId: 'test-session',
      timestamp: '2026-01-15T10:00:00.000Z',
      cwd: '/home/user/project',
    });
  });

  it('returns null for noise entry', () => {
    const entry = makeUserEntry({
      isMeta: true,
      message: { role: 'user', content: 'Some meta content about the session' },
    });
    expect(classifyUserEntry(entry)).toBeNull();
  });

  it('extracts text from array content with text blocks', () => {
    const entry = makeUserEntry({
      cwd: '/home/user/project',
      message: {
        role: 'user',
        content: [
          { type: 'text', text: 'Part 1 ' },
          { type: 'text', text: 'Part 2' },
        ],
      },
    });
    const result = classifyUserEntry(entry);
    expect(result).toEqual({
      text: 'Part 1 Part 2',
      sessionId: 'test-session',
      timestamp: '2026-01-15T10:00:00.000Z',
      cwd: '/home/user/project',
    });
  });

  it('uses empty string for missing cwd', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: 'Build the authentication system please' },
    });
    // cwd not set on makeUserEntry defaults
    const result = classifyUserEntry(entry);
    expect(result).not.toBeNull();
    expect(result!.cwd).toBe('');
  });

  it('trims whitespace from extracted text', () => {
    const entry = makeUserEntry({
      cwd: '/home/user/project',
      message: { role: 'user', content: '  Build the API  ' },
    });
    const result = classifyUserEntry(entry);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('Build the API');
  });

  it('returns null for entry with no message content', () => {
    const entry = makeUserEntry({
      message: { role: 'user', content: undefined as any },
    });
    expect(classifyUserEntry(entry)).toBeNull();
  });
});

/**
 * Tests for the exact-match module.
 *
 * Verifies that explicit /gsd:command syntax is detected and matched
 * to the correct GsdCommandMetadata, with raw argument extraction.
 * Non-matching input (natural language, unknown commands, empty) returns null.
 */

import { describe, it, expect } from 'vitest';
import { exactMatch, EXACT_MATCH_REGEX } from './exact-match.js';
import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMMANDS: GsdCommandMetadata[] = [
  {
    name: 'gsd:plan-phase',
    description: 'Create a detailed plan for a phase',
    argumentHint: '[phase] [--research]',
    objective: 'Break a phase into executable tasks',
    filePath: '/home/user/.claude/commands/gsd/plan-phase.md',
  },
  {
    name: 'gsd:progress',
    description: 'Show current project progress',
    objective: 'Display where you are in the roadmap',
    filePath: '/home/user/.claude/commands/gsd/progress.md',
  },
  {
    name: 'gsd:debug',
    description: 'Start systematic debugging',
    argumentHint: '"description"',
    objective: 'Debug issues with persistent state tracking',
    filePath: '/home/user/.claude/commands/gsd/debug.md',
  },
  {
    name: 'gsd:execute-phase',
    description: 'Execute plans for a phase',
    argumentHint: '[phase]',
    objective: 'Run phase plans with fresh context and atomic commits',
    filePath: '/home/user/.claude/commands/gsd/execute-phase.md',
  },
];

// ============================================================================
// EXACT_MATCH_REGEX
// ============================================================================

describe('EXACT_MATCH_REGEX', () => {
  it('matches /gsd:command-name pattern', () => {
    expect(EXACT_MATCH_REGEX.test('/gsd:plan-phase')).toBe(true);
  });

  it('matches /gsd:command with arguments', () => {
    expect(EXACT_MATCH_REGEX.test('/gsd:plan-phase 3 --research')).toBe(true);
  });

  it('does not match without leading slash', () => {
    expect(EXACT_MATCH_REGEX.test('gsd:plan-phase')).toBe(false);
  });

  it('does not match natural language', () => {
    expect(EXACT_MATCH_REGEX.test('plan the next phase')).toBe(false);
  });

  it('does not match /gsd: with no command name', () => {
    expect(EXACT_MATCH_REGEX.test('/gsd:')).toBe(false);
  });
});

// ============================================================================
// exactMatch
// ============================================================================

describe('exactMatch', () => {
  it('matches /gsd:plan-phase and returns the correct command', () => {
    const result = exactMatch('/gsd:plan-phase', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('gsd:plan-phase');
  });

  it('extracts raw args from /gsd:plan-phase 3 --research', () => {
    const result = exactMatch('/gsd:plan-phase 3 --research', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('gsd:plan-phase');
    expect(result!.rawArgs).toBe('3 --research');
  });

  it('returns empty string rawArgs for /gsd:progress (no args)', () => {
    const result = exactMatch('/gsd:progress', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('gsd:progress');
    expect(result!.rawArgs).toBe('');
  });

  it('returns null for unknown command /gsd:nonexistent', () => {
    const result = exactMatch('/gsd:nonexistent', COMMANDS);
    expect(result).toBeNull();
  });

  it('returns null for natural language "plan the next phase"', () => {
    const result = exactMatch('plan the next phase', COMMANDS);
    expect(result).toBeNull();
  });

  it('returns null for raw gsd:plan-phase without leading slash', () => {
    const result = exactMatch('gsd:plan-phase', COMMANDS);
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = exactMatch('', COMMANDS);
    expect(result).toBeNull();
  });

  it('returns null for /gsd: with no command name', () => {
    const result = exactMatch('/gsd:', COMMANDS);
    expect(result).toBeNull();
  });

  it('is case-sensitive: /gsd:Plan-Phase returns null', () => {
    const result = exactMatch('/gsd:Plan-Phase', COMMANDS);
    expect(result).toBeNull();
  });

  it('handles surrounding whitespace by trimming', () => {
    const result = exactMatch('  /gsd:progress  ', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('gsd:progress');
  });

  it('extracts multi-word args: /gsd:debug something is broken', () => {
    const result = exactMatch('/gsd:debug something is broken', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('gsd:debug');
    expect(result!.rawArgs).toBe('something is broken');
  });

  it('returns the full command metadata object', () => {
    const result = exactMatch('/gsd:execute-phase 5', COMMANDS);
    expect(result).not.toBeNull();
    expect(result!.command).toEqual(COMMANDS[3]);
    expect(result!.rawArgs).toBe('5');
  });
});

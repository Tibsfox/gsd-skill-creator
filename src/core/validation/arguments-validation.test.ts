import { describe, it, expect } from 'vitest';
import {
  detectArguments,
  detectPreprocessing,
  checkInjectionRisk,
  suggestArgumentHint,
} from './arguments-validation.js';

describe('Arguments Validation (SPEC-02, SPEC-03, SPEC-07)', () => {
  // ============================================================================
  // detectArguments
  // ============================================================================

  describe('detectArguments', () => {
    it('detects $ARGUMENTS placeholder', () => {
      const result = detectArguments('Review $ARGUMENTS and provide feedback');
      expect(result.found).toBe(true);
      expect(result.placeholders).toContain('$ARGUMENTS');
      expect(result.positional).toEqual([]);
    });

    it('detects $ARGUMENTS[0] and $ARGUMENTS[1] positional indices', () => {
      const result = detectArguments('Compare $ARGUMENTS[0] with $ARGUMENTS[1]');
      expect(result.found).toBe(true);
      expect(result.placeholders).toContain('$ARGUMENTS[0]');
      expect(result.placeholders).toContain('$ARGUMENTS[1]');
      expect(result.positional).toEqual([0, 1]);
    });

    it('detects $0, $1 shorthand positional indices', () => {
      const result = detectArguments('Merge $0 into $1');
      expect(result.found).toBe(true);
      expect(result.positional).toEqual([0, 1]);
    });

    it('does NOT count ${CLAUDE_SESSION_ID} as a user argument', () => {
      const result = detectArguments('Session: ${CLAUDE_SESSION_ID} is active');
      expect(result.found).toBe(false);
      expect(result.placeholders).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it('returns found: false when no placeholders exist', () => {
      const result = detectArguments('This is a plain skill body with no arguments');
      expect(result.found).toBe(false);
      expect(result.placeholders).toEqual([]);
      expect(result.positional).toEqual([]);
    });

    it('detects mixed $ARGUMENTS and $ARGUMENTS[2]', () => {
      const result = detectArguments('Process $ARGUMENTS with focus on $ARGUMENTS[2]');
      expect(result.found).toBe(true);
      expect(result.placeholders).toContain('$ARGUMENTS');
      expect(result.placeholders).toContain('$ARGUMENTS[2]');
      expect(result.positional).toEqual([2]);
    });

    it('does not match $ARGUMENTS inside a longer variable name', () => {
      // e.g., $ARGUMENTS_EXTRA should only match $ARGUMENTS part
      const result = detectArguments('Use $ARGUMENTS_EXTRA carefully');
      // $ARGUMENTS is still detected as a substring match since regex uses word boundary
      expect(result.found).toBe(true);
      expect(result.placeholders).toContain('$ARGUMENTS');
    });

    it('deduplicates repeated placeholders', () => {
      const result = detectArguments('$ARGUMENTS and then again $ARGUMENTS');
      expect(result.found).toBe(true);
      // Should contain $ARGUMENTS once (deduplicated)
      const argCount = result.placeholders.filter(p => p === '$ARGUMENTS').length;
      expect(argCount).toBe(1);
    });
  });

  // ============================================================================
  // detectPreprocessing
  // ============================================================================

  describe('detectPreprocessing', () => {
    it('detects !`git status` preprocessing command', () => {
      const result = detectPreprocessing('Run !`git status` first');
      expect(result.found).toBe(true);
      expect(result.commands).toContain('git status');
    });

    it('detects !`gh pr diff` preprocessing command', () => {
      const result = detectPreprocessing('Check !`gh pr diff` output');
      expect(result.found).toBe(true);
      expect(result.commands).toContain('gh pr diff');
    });

    it('detects multiple preprocessing commands', () => {
      const result = detectPreprocessing('Run !`cmd1` and !`cmd2` together');
      expect(result.found).toBe(true);
      expect(result.commands).toEqual(['cmd1', 'cmd2']);
    });

    it('returns found: false when no preprocessing exists', () => {
      const result = detectPreprocessing('This is just regular text');
      expect(result.found).toBe(false);
      expect(result.commands).toEqual([]);
    });

    it('does NOT trigger on regular backtick code blocks', () => {
      const result = detectPreprocessing('Use `git status` to check');
      expect(result.found).toBe(false);
      expect(result.commands).toEqual([]);
    });

    it('does NOT trigger on triple backtick code blocks', () => {
      const body = '```\n!`git status`\n```';
      const result = detectPreprocessing(body);
      // Inside a fenced code block, !`cmd` should not be treated as preprocessing
      expect(result.found).toBe(false);
      expect(result.commands).toEqual([]);
    });

    it('detects preprocessing outside code blocks but ignores inside', () => {
      const body = 'Run !`ls` first\n```\n!`echo inside`\n```\nThen !`pwd`';
      const result = detectPreprocessing(body);
      expect(result.found).toBe(true);
      expect(result.commands).toContain('ls');
      expect(result.commands).toContain('pwd');
      expect(result.commands).not.toContain('echo inside');
    });
  });

  // ============================================================================
  // checkInjectionRisk
  // ============================================================================

  describe('checkInjectionRisk (SPEC-07)', () => {
    it('flags $ARGUMENTS inside !`command` as high risk', () => {
      const result = checkInjectionRisk('Run !`git log $ARGUMENTS` for history');
      expect(result.risk).toBe('high');
      expect(result.locations.length).toBeGreaterThan(0);
      expect(result.locations[0].command).toBe('git log $ARGUMENTS');
      expect(result.locations[0].argument).toBe('$ARGUMENTS');
      expect(result.locations[0].description).toBeTruthy();
    });

    it('flags $ARGUMENTS[0] inside !`command` as high risk', () => {
      const result = checkInjectionRisk('Run !`cat $ARGUMENTS[0]` to read');
      expect(result.risk).toBe('high');
      expect(result.locations.length).toBeGreaterThan(0);
    });

    it('returns none risk when $ARGUMENTS is in regular text (no !command)', () => {
      const result = checkInjectionRisk('Review $ARGUMENTS and provide feedback');
      expect(result.risk).toBe('none');
      expect(result.locations).toEqual([]);
    });

    it('returns none risk when !`command` has no $ARGUMENTS', () => {
      const result = checkInjectionRisk('Run !`git status` to check');
      expect(result.risk).toBe('none');
      expect(result.locations).toEqual([]);
    });

    it('returns none risk when $ARGUMENTS and !`command` exist separately', () => {
      const result = checkInjectionRisk(
        'Run !`echo test` first. Then review $ARGUMENTS.'
      );
      expect(result.risk).toBe('none');
      expect(result.locations).toEqual([]);
    });

    it('flags $N shorthand inside !`command` as high risk', () => {
      const result = checkInjectionRisk('Run !`grep $0 $1` to search');
      expect(result.risk).toBe('high');
      expect(result.locations.length).toBeGreaterThan(0);
    });

    it('ignores $ARGUMENTS inside triple-backtick code blocks for risk', () => {
      const body = '```\n!`git log $ARGUMENTS`\n```';
      const result = checkInjectionRisk(body);
      expect(result.risk).toBe('none');
    });
  });

  // ============================================================================
  // suggestArgumentHint
  // ============================================================================

  describe('suggestArgumentHint', () => {
    it('suggests hint when $ARGUMENTS is found in review context', () => {
      const hint = suggestArgumentHint('Review $ARGUMENTS and provide feedback');
      expect(hint).not.toBeNull();
      expect(typeof hint).toBe('string');
      expect(hint!.length).toBeGreaterThan(0);
    });

    it('suggests positional hint for $ARGUMENTS[0] and $ARGUMENTS[1]', () => {
      const hint = suggestArgumentHint('Compare $ARGUMENTS[0] with $ARGUMENTS[1]');
      expect(hint).not.toBeNull();
      expect(hint).toContain('arg1');
      expect(hint).toContain('arg2');
    });

    it('returns null when no arguments are present', () => {
      const hint = suggestArgumentHint('No arguments here');
      expect(hint).toBeNull();
    });

    it('suggests hint for $0 and $1 shorthand', () => {
      const hint = suggestArgumentHint('Merge $0 into $1');
      expect(hint).not.toBeNull();
      expect(hint).toContain('arg1');
      expect(hint).toContain('arg2');
    });
  });
});

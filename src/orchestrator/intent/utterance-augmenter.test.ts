/**
 * Tests for the utterance augmenter module.
 *
 * Verifies that training utterances are generated from GsdCommandMetadata
 * for Bayes classifier training, with proper deduplication, capping,
 * and lowercase normalization.
 */

import { describe, it, expect } from 'vitest';
import { augmentUtterances } from './utterance-augmenter.js';
import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMMAND_WITH_BOTH: GsdCommandMetadata = {
  name: 'gsd:plan-phase',
  description: 'Create a detailed plan for a phase',
  argumentHint: '[phase] [--research]',
  objective: 'Break a phase into executable tasks with verification criteria',
  filePath: '/home/user/.claude/commands/gsd/plan-phase.md',
};

const COMMAND_SINGLE_WORD: GsdCommandMetadata = {
  name: 'gsd:progress',
  description: 'Show current project progress',
  objective: 'Display where you are in the roadmap',
  filePath: '/home/user/.claude/commands/gsd/progress.md',
};

const COMMAND_MINIMAL: GsdCommandMetadata = {
  name: 'gsd:help',
  description: 'Show available GSD commands',
  objective: '',
  filePath: '/home/user/.claude/commands/gsd/help.md',
};

const COMMAND_VERIFY: GsdCommandMetadata = {
  name: 'gsd:verify-work',
  description: 'Verify completed work against acceptance criteria',
  objective: 'Run user acceptance testing on phase output',
  filePath: '/home/user/.claude/commands/gsd/verify-work.md',
};

const COMMAND_REMOVE: GsdCommandMetadata = {
  name: 'gsd:remove-phase',
  description: 'Remove a planned phase from the roadmap',
  objective: 'Clean removal with automatic renumbering',
  filePath: '/home/user/.claude/commands/gsd/remove-phase.md',
};

// ============================================================================
// Tests
// ============================================================================

describe('augmentUtterances', () => {
  it('generates utterances from description + objective for a command with both', () => {
    const utterances = augmentUtterances(COMMAND_WITH_BOTH);
    // Description should be included
    expect(utterances).toContain('create a detailed plan for a phase');
    // Objective should be included
    expect(utterances.some((u) => u.includes('break a phase into executable tasks'))).toBe(true);
  });

  it('generates name-derived action phrases for multi-word commands', () => {
    const utterances = augmentUtterances(COMMAND_WITH_BOTH);
    // Should generate verb + article + noun patterns from "plan-phase"
    const hasNameDerived = utterances.some(
      (u) => u.includes('plan') && u.includes('phase') && u !== 'create a detailed plan for a phase',
    );
    expect(hasNameDerived).toBe(true);
  });

  it('handles single-word command names', () => {
    const utterances = augmentUtterances(COMMAND_SINGLE_WORD);
    // Should generate "show progress", "check progress", etc.
    const hasProgressAction = utterances.some(
      (u) => u.includes('progress') && u !== 'show current project progress',
    );
    expect(hasProgressAction).toBe(true);
  });

  it('caps at 8 utterances maximum', () => {
    const utterances = augmentUtterances(COMMAND_WITH_BOTH);
    expect(utterances.length).toBeLessThanOrEqual(8);
  });

  it('deduplicates similar phrases (case-insensitive)', () => {
    const utterances = augmentUtterances(COMMAND_WITH_BOTH);
    const lowered = utterances.map((u) => u.toLowerCase());
    const unique = new Set(lowered);
    expect(unique.size).toBe(lowered.length);
  });

  it('returns at least 3 utterances for a command with minimal metadata', () => {
    const utterances = augmentUtterances(COMMAND_MINIMAL);
    expect(utterances.length).toBeGreaterThanOrEqual(3);
  });

  it('handles commands with empty objective string', () => {
    const utterances = augmentUtterances(COMMAND_MINIMAL);
    // Should not contain empty strings
    expect(utterances.every((u) => u.length > 0)).toBe(true);
    // Description should still be present
    expect(utterances).toContain('show available gsd commands');
  });

  it('returns all utterances as lowercase and trimmed', () => {
    const utterances = augmentUtterances(COMMAND_WITH_BOTH);
    for (const u of utterances) {
      expect(u).toBe(u.toLowerCase().trim());
    }
  });

  it('generates synonym variations for "verify" commands', () => {
    const utterances = augmentUtterances(COMMAND_VERIFY);
    const hasCheck = utterances.some((u) => u.includes('check'));
    const hasValidate = utterances.some((u) => u.includes('validate'));
    expect(hasCheck || hasValidate).toBe(true);
  });

  it('generates synonym variations for "remove" commands', () => {
    const utterances = augmentUtterances(COMMAND_REMOVE);
    const hasDelete = utterances.some((u) => u.includes('delete'));
    const hasDrop = utterances.some((u) => u.includes('drop'));
    expect(hasDelete || hasDrop).toBe(true);
  });
});

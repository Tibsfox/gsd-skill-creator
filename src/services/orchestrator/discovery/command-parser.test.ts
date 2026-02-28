/**
 * Tests for the GSD command file parser.
 *
 * Covers:
 * - extractFirstTag: regex-based tag extraction from markdown body
 * - parseCommandFile: full command file parsing with gray-matter frontmatter
 */

import { describe, it, expect } from 'vitest';
import { parseCommandFile, extractFirstTag } from './command-parser.js';

// ============================================================================
// extractFirstTag
// ============================================================================

describe('extractFirstTag', () => {
  it('extracts tag content from single tag', () => {
    const input = 'Some text <objective>Build the thing</objective> more text';
    expect(extractFirstTag(input, 'objective')).toBe('Build the thing');
  });

  it('extracts FIRST tag when multiple exist', () => {
    // This simulates a real GSD command file where <objective> appears in
    // the command's own objective AND inside <process> sections that reference
    // sub-agent objectives
    const input = [
      '<objective>The real objective</objective>',
      '',
      '<process>',
      'Step 1: Read the plan',
      '<objective>This is inside process and should be ignored</objective>',
      'Step 2: Execute',
      '<objective>Another nested one</objective>',
      '</process>',
    ].join('\n');
    expect(extractFirstTag(input, 'objective')).toBe('The real objective');
  });

  it('returns undefined for missing tag', () => {
    const input = 'No objective tags here, just plain text.';
    expect(extractFirstTag(input, 'objective')).toBeUndefined();
  });

  it('handles multiline tag content', () => {
    const input = [
      '<objective>',
      'Line 1 of the objective.',
      'Line 2 of the objective.',
      '</objective>',
    ].join('\n');
    const result = extractFirstTag(input, 'objective');
    expect(result).toBe('Line 1 of the objective.\nLine 2 of the objective.');
  });

  it('handles extra whitespace inside tag', () => {
    const input = '<objective>  \n  text  \n  </objective>';
    expect(extractFirstTag(input, 'objective')).toBe('text');
  });
});

// ============================================================================
// parseCommandFile
// ============================================================================

describe('parseCommandFile', () => {
  it('parses complete command file with all fields', () => {
    const content = [
      '---',
      'name: gsd:plan-phase',
      'description: Create detailed execution plan for a phase',
      'argument-hint: "[phase] [--research]"',
      'allowed-tools:',
      '  - Read',
      '  - Write',
      '  - Bash',
      'agent: gsd-planner',
      '---',
      '',
      '<objective>',
      'Create a detailed, executable plan for the specified phase.',
      '</objective>',
      '',
      '<process>',
      'Step 1: Read the roadmap',
      '</process>',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/gsd/plan-phase.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd:plan-phase');
    expect(result!.description).toBe('Create detailed execution plan for a phase');
    expect(result!.argumentHint).toBe('[phase] [--research]');
    expect(result!.allowedTools).toEqual(['Read', 'Write', 'Bash']);
    expect(result!.agent).toBe('gsd-planner');
    expect(result!.objective).toBe('Create a detailed, executable plan for the specified phase.');
    expect(result!.filePath).toBe('/path/to/gsd/plan-phase.md');
  });

  it('parses command file with minimal fields', () => {
    const content = [
      '---',
      'name: gsd:progress',
      'description: Show current project progress',
      '---',
      '',
      'Just some body text without objective tags.',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/progress.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd:progress');
    expect(result!.description).toBe('Show current project progress');
    expect(result!.argumentHint).toBeUndefined();
    expect(result!.allowedTools).toBeUndefined();
    expect(result!.agent).toBeUndefined();
    expect(result!.objective).toBe('');
  });

  it('extracts objective from body', () => {
    const content = [
      '---',
      'name: gsd:build',
      'description: Build something',
      '---',
      '',
      '<objective>Build a thing</objective>',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/build.md');
    expect(result).not.toBeNull();
    expect(result!.objective).toBe('Build a thing');
  });

  it('returns null when name is missing', () => {
    const content = [
      '---',
      'description: A command without a name',
      '---',
      '',
      'Body text.',
    ].join('\n');

    expect(parseCommandFile(content, '/path/to/file.md')).toBeNull();
  });

  it('returns null when description is missing', () => {
    const content = [
      '---',
      'name: gsd:broken',
      '---',
      '',
      'Body text.',
    ].join('\n');

    expect(parseCommandFile(content, '/path/to/broken.md')).toBeNull();
  });

  it('returns null for empty string input', () => {
    expect(parseCommandFile('', '/path/to/empty.md')).toBeNull();
  });

  it('preserves full gsd: prefix in name', () => {
    const content = [
      '---',
      'name: gsd:plan-phase',
      'description: Plan a phase',
      '---',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/plan-phase.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd:plan-phase');
  });

  it('maps argument-hint to argumentHint (camelCase)', () => {
    const content = [
      '---',
      'name: gsd:execute',
      'description: Execute a plan',
      'argument-hint: "[phase]"',
      '---',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/execute.md');
    expect(result).not.toBeNull();
    expect(result!.argumentHint).toBe('[phase]');
  });

  it('maps allowed-tools array correctly', () => {
    const content = [
      '---',
      'name: gsd:debug',
      'description: Debug an issue',
      'allowed-tools:',
      '  - Read',
      '  - Write',
      '  - Bash',
      '---',
    ].join('\n');

    const result = parseCommandFile(content, '/path/to/debug.md');
    expect(result).not.toBeNull();
    expect(result!.allowedTools).toEqual(['Read', 'Write', 'Bash']);
  });

  it('handles extra frontmatter fields gracefully (passthrough)', () => {
    const content = [
      '---',
      'name: gsd:custom',
      'description: A custom command',
      'type: prompt',
      'custom-field: some-value',
      '---',
    ].join('\n');

    // Should not throw or return null due to unknown fields
    const result = parseCommandFile(content, '/path/to/custom.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd:custom');
    expect(result!.description).toBe('A custom command');
  });
});

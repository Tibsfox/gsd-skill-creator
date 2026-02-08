/**
 * Tests for the GSD agent file parser.
 *
 * Covers:
 * - parseAgentFile: full agent .md file parsing with gray-matter frontmatter
 * - Null returns for malformed/incomplete files
 * - Tools preserved as comma-separated string (official Claude Code format)
 */

import { describe, it, expect } from 'vitest';
import { parseAgentFile } from './agent-parser.js';

describe('parseAgentFile', () => {
  it('parses agent with all fields', () => {
    const content = [
      '---',
      'name: gsd-executor',
      'description: Executes plans autonomously with atomic commits',
      'tools: "Read, Write, Bash, Glob, Grep"',
      'model: opus',
      'color: green',
      '---',
      '',
      'You are a GSD plan executor.',
    ].join('\n');

    const result = parseAgentFile(content, '/home/user/.claude/agents/gsd-executor.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd-executor');
    expect(result!.description).toBe('Executes plans autonomously with atomic commits');
    expect(result!.tools).toBe('Read, Write, Bash, Glob, Grep');
    expect(result!.model).toBe('opus');
    expect(result!.color).toBe('green');
  });

  it('parses agent with minimal fields', () => {
    const content = [
      '---',
      'name: gsd-planner',
      'description: Creates detailed execution plans',
      '---',
      '',
      'You are a GSD planner agent.',
    ].join('\n');

    const result = parseAgentFile(content, '/home/user/.claude/agents/gsd-planner.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd-planner');
    expect(result!.description).toBe('Creates detailed execution plans');
    expect(result!.tools).toBeUndefined();
    expect(result!.model).toBeUndefined();
    expect(result!.color).toBeUndefined();
  });

  it('returns null when name missing', () => {
    const content = [
      '---',
      'description: An agent without a name',
      'tools: "Read, Write"',
      '---',
      '',
      'Body text.',
    ].join('\n');

    expect(parseAgentFile(content, '/path/to/agent.md')).toBeNull();
  });

  it('returns null when description missing', () => {
    const content = [
      '---',
      'name: gsd-broken',
      '---',
      '',
      'Body text.',
    ].join('\n');

    expect(parseAgentFile(content, '/path/to/broken.md')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(parseAgentFile('', '/path/to/empty.md')).toBeNull();
  });

  it('preserves tools as comma-separated string', () => {
    const content = [
      '---',
      'name: gsd-researcher',
      'description: Researches topics',
      'tools: "Read, Write, Bash"',
      '---',
    ].join('\n');

    const result = parseAgentFile(content, '/path/to/researcher.md');
    expect(result).not.toBeNull();
    expect(result!.tools).toBe('Read, Write, Bash');
    // Must be a string, not split into array
    expect(typeof result!.tools).toBe('string');
  });

  it('handles unknown frontmatter fields gracefully', () => {
    const content = [
      '---',
      'name: gsd-custom',
      'description: A custom agent',
      'custom: some-value',
      'priority: high',
      '---',
    ].join('\n');

    // Should not throw or return null due to unknown fields
    const result = parseAgentFile(content, '/path/to/custom.md');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('gsd-custom');
    expect(result!.description).toBe('A custom agent');
  });

  it('includes filePath in result', () => {
    const content = [
      '---',
      'name: gsd-test',
      'description: Test agent',
      '---',
    ].join('\n');

    const filePath = '/home/user/.claude/agents/gsd-test.md';
    const result = parseAgentFile(content, filePath);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(filePath);
  });
});

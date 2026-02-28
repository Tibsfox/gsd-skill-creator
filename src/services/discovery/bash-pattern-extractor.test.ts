/**
 * TDD tests for Bash command pattern extraction.
 *
 * Tests classifyBashCommand (category classification), normalizeBashCommand
 * (keyword normalization for deduplication), and extractBashPatterns
 * (ParsedEntry[] -> BashPattern[] extraction from Bash tool invocations).
 */

import { describe, it, expect } from 'vitest';
import {
  classifyBashCommand,
  normalizeBashCommand,
  extractBashPatterns,
  type BashCategory,
  type BashPattern,
} from './bash-pattern-extractor.js';
import type { ParsedEntry, ExtractedToolUse } from './types.js';

// ============================================================================
// classifyBashCommand
// ============================================================================

describe('classifyBashCommand', () => {
  describe('git-workflow', () => {
    it('classifies "git add file.ts" as git-workflow', () => {
      expect(classifyBashCommand('git add file.ts')).toBe('git-workflow');
    });

    it('classifies "git commit -m \'fix\'" as git-workflow', () => {
      expect(classifyBashCommand("git commit -m 'fix'")).toBe('git-workflow');
    });

    it('classifies chained git commands by first command', () => {
      expect(classifyBashCommand("git add . && git commit -m 'msg'")).toBe('git-workflow');
    });

    it('classifies "git status" as git-workflow', () => {
      expect(classifyBashCommand('git status')).toBe('git-workflow');
    });

    it('classifies "git diff" as git-workflow', () => {
      expect(classifyBashCommand('git diff')).toBe('git-workflow');
    });

    it('classifies "git push origin main" as git-workflow', () => {
      expect(classifyBashCommand('git push origin main')).toBe('git-workflow');
    });
  });

  describe('test-command', () => {
    it('classifies "npx vitest run src/foo.test.ts" as test-command', () => {
      expect(classifyBashCommand('npx vitest run src/foo.test.ts')).toBe('test-command');
    });

    it('classifies "npx jest --watch" as test-command', () => {
      expect(classifyBashCommand('npx jest --watch')).toBe('test-command');
    });

    it('classifies "npm test" as test-command', () => {
      expect(classifyBashCommand('npm test')).toBe('test-command');
    });

    it('classifies "pytest -v" as test-command', () => {
      expect(classifyBashCommand('pytest -v')).toBe('test-command');
    });

    it('classifies "cargo test" as test-command', () => {
      expect(classifyBashCommand('cargo test')).toBe('test-command');
    });
  });

  describe('build-command', () => {
    it('classifies "npx tsc --noEmit" as build-command', () => {
      expect(classifyBashCommand('npx tsc --noEmit')).toBe('build-command');
    });

    it('classifies "npm run build" as build-command', () => {
      expect(classifyBashCommand('npm run build')).toBe('build-command');
    });

    it('classifies "npx esbuild src/index.ts" as build-command', () => {
      expect(classifyBashCommand('npx esbuild src/index.ts')).toBe('build-command');
    });

    it('classifies "cargo build" as build-command', () => {
      expect(classifyBashCommand('cargo build')).toBe('build-command');
    });
  });

  describe('package-management', () => {
    it('classifies "npm install zod" as package-management', () => {
      expect(classifyBashCommand('npm install zod')).toBe('package-management');
    });

    it('classifies "npm add vitest" as package-management', () => {
      expect(classifyBashCommand('npm add vitest')).toBe('package-management');
    });

    it('classifies "yarn add react" as package-management', () => {
      expect(classifyBashCommand('yarn add react')).toBe('package-management');
    });

    it('classifies "pnpm add lodash" as package-management', () => {
      expect(classifyBashCommand('pnpm add lodash')).toBe('package-management');
    });
  });

  describe('file-operation', () => {
    it('classifies "ls -la src/" as file-operation', () => {
      expect(classifyBashCommand('ls -la src/')).toBe('file-operation');
    });

    it('classifies "cat package.json" as file-operation', () => {
      expect(classifyBashCommand('cat package.json')).toBe('file-operation');
    });

    it('classifies "mkdir -p src/lib" as file-operation', () => {
      expect(classifyBashCommand('mkdir -p src/lib')).toBe('file-operation');
    });

    it('classifies "rm -rf dist" as file-operation', () => {
      expect(classifyBashCommand('rm -rf dist')).toBe('file-operation');
    });

    it('classifies "cp file.ts backup.ts" as file-operation', () => {
      expect(classifyBashCommand('cp file.ts backup.ts')).toBe('file-operation');
    });
  });

  describe('search', () => {
    it('classifies "find . -name \'*.ts\'" as search', () => {
      expect(classifyBashCommand("find . -name '*.ts'")).toBe('search');
    });

    it('classifies "grep -r \'TODO\' src/" as search', () => {
      expect(classifyBashCommand("grep -r 'TODO' src/")).toBe('search');
    });

    it('classifies "rg \'pattern\'" as search', () => {
      expect(classifyBashCommand("rg 'pattern'")).toBe('search');
    });
  });

  describe('scripted', () => {
    it('classifies "python3 -c \'print(1)\'" as scripted', () => {
      expect(classifyBashCommand("python3 -c 'print(1)'")).toBe('scripted');
    });

    it('classifies "node -e \'console.log(1)\'" as scripted', () => {
      expect(classifyBashCommand("node -e 'console.log(1)'")).toBe('scripted');
    });
  });

  describe('other', () => {
    it('classifies "curl https://example.com" as other', () => {
      expect(classifyBashCommand('curl https://example.com')).toBe('other');
    });

    it('classifies "docker compose up" as other', () => {
      expect(classifyBashCommand('docker compose up')).toBe('other');
    });

    it('classifies empty string as other', () => {
      expect(classifyBashCommand('')).toBe('other');
    });
  });

  describe('edge cases', () => {
    it('handles leading/trailing whitespace', () => {
      expect(classifyBashCommand('  git status  ')).toBe('git-workflow');
    });

    it('classifies by first line for multiline commands', () => {
      expect(classifyBashCommand('git add .\ngit commit -m "msg"')).toBe('git-workflow');
    });
  });
});

// ============================================================================
// normalizeBashCommand
// ============================================================================

describe('normalizeBashCommand', () => {
  describe('git commands', () => {
    it('normalizes "git add file.ts" to "git add"', () => {
      expect(normalizeBashCommand('git add file.ts')).toBe('git add');
    });

    it('normalizes "git commit -m \'long message here\'" to "git commit"', () => {
      expect(normalizeBashCommand("git commit -m 'long message here'")).toBe('git commit');
    });
  });

  describe('chained commands', () => {
    it('normalizes chained git commands preserving chain structure', () => {
      expect(normalizeBashCommand("git add . && git commit -m 'msg'")).toBe('git add && git commit');
    });
  });

  describe('npx commands', () => {
    it('normalizes "npx vitest run src/foo.test.ts" to "npx vitest run"', () => {
      expect(normalizeBashCommand('npx vitest run src/foo.test.ts')).toBe('npx vitest run');
    });
  });

  describe('npm commands', () => {
    it('normalizes "npm test" to "npm test"', () => {
      expect(normalizeBashCommand('npm test')).toBe('npm test');
    });
  });

  describe('simple commands', () => {
    it('normalizes "ls -la src/components" to "ls"', () => {
      expect(normalizeBashCommand('ls -la src/components')).toBe('ls');
    });
  });

  describe('scripted commands', () => {
    it('normalizes "python3 -c \'import sys; print(sys.version)\'" to "python3 -c"', () => {
      expect(normalizeBashCommand("python3 -c 'import sys; print(sys.version)'")).toBe('python3 -c');
    });
  });

  describe('edge cases', () => {
    it('normalizes empty string to empty string', () => {
      expect(normalizeBashCommand('')).toBe('');
    });

    it('handles whitespace-only input', () => {
      expect(normalizeBashCommand('   ')).toBe('');
    });
  });
});

// ============================================================================
// extractBashPatterns
// ============================================================================

describe('extractBashPatterns', () => {
  const tool = (name: string, input: Record<string, unknown> = {}): ExtractedToolUse => ({ name, input });

  it('extracts BashPattern from a Bash tool invocation', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Bash', { command: 'git status' })] },
    ];
    const result = extractBashPatterns(entries);
    expect(result).toEqual([
      { category: 'git-workflow', command: 'git status', normalized: 'git status' },
    ]);
  });

  it('ignores non-Bash tools', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Read', { file_path: '/foo' })] },
    ];
    expect(extractBashPatterns(entries)).toEqual([]);
  });

  it('skips Bash tools with no command field', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Bash', {})] },
    ];
    expect(extractBashPatterns(entries)).toEqual([]);
  });

  it('skips Bash tools with non-string command field', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Bash', { command: 42 })] },
    ];
    expect(extractBashPatterns(entries)).toEqual([]);
  });

  it('extracts multiple Bash patterns across entries', () => {
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Bash', { command: 'git add .' }), tool('Read', {})] },
      { kind: 'user-prompt', data: { text: 'hello', sessionId: 's1', timestamp: 't1', cwd: '/' } },
      { kind: 'tool-uses', data: [tool('Bash', { command: 'npm test' })] },
    ];
    const result = extractBashPatterns(entries);
    expect(result).toEqual([
      { category: 'git-workflow', command: 'git add .', normalized: 'git add' },
      { category: 'test-command', command: 'npm test', normalized: 'npm test' },
    ]);
  });

  it('truncates commands longer than 500 chars', () => {
    const longCommand = 'echo ' + 'x'.repeat(600);
    const entries: ParsedEntry[] = [
      { kind: 'tool-uses', data: [tool('Bash', { command: longCommand })] },
    ];
    const result = extractBashPatterns(entries);
    expect(result[0].command.length).toBe(500);
    expect(result[0].command).toBe(longCommand.slice(0, 500));
  });

  it('ignores skipped entries', () => {
    const entries: ParsedEntry[] = [
      { kind: 'skipped', type: 'progress' },
    ];
    expect(extractBashPatterns(entries)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(extractBashPatterns([])).toEqual([]);
  });
});

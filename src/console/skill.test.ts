/**
 * TDD tests for the GSD dashboard console skill file.
 *
 * Validates that project-claude/commands/gsd-dashboard-console.md:
 * - Has valid YAML frontmatter with name and description
 * - Contains lifecycle checkpoint instructions (session-start, phase-boundary, post-verification)
 * - References all 4 console scripts by path
 * - Contains handling instructions for all 3 message types
 * - Meets content quality constraints (word count, section count)
 *
 * Covers PICKUP-01 (lifecycle checkpoints) and PICKUP-05 (message type handling).
 *
 * @module console/skill.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Path to the skill file relative to project root. */
const SKILL_PATH = resolve(__dirname, '../../project-claude/commands/gsd-dashboard-console.md');

/** Read the skill file content. Throws if file does not exist. */
function readSkill(): string {
  return readFileSync(SKILL_PATH, 'utf-8');
}

/** Parse YAML frontmatter from markdown content. Returns key-value pairs. */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const result: Record<string, string> = {};
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

// ============================================================================
// 1. Frontmatter structure (4 tests)
// ============================================================================

describe('Frontmatter structure', () => {
  it('skill file exists and is readable', () => {
    expect(() => readSkill()).not.toThrow();
  });

  it('has YAML frontmatter delimited by ---', () => {
    const content = readSkill();
    expect(content).toMatch(/^---\n[\s\S]*?\n---/);
  });

  it('frontmatter has name: gsd-dashboard-console', () => {
    const content = readSkill();
    const fm = parseFrontmatter(content);
    expect(fm.name).toBe('gsd-dashboard-console');
  });

  it('frontmatter has a non-empty description', () => {
    const content = readSkill();
    const fm = parseFrontmatter(content);
    expect(fm.description).toBeDefined();
    expect(fm.description!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 2. Lifecycle checkpoint instructions (3 tests)
// ============================================================================

describe('Lifecycle checkpoint instructions', () => {
  it('contains instruction for inbox check at session start', () => {
    const content = readSkill().toLowerCase();
    expect(content).toMatch(/session[- ]start/);
  });

  it('contains instruction for inbox check at phase boundary', () => {
    const content = readSkill().toLowerCase();
    expect(content).toMatch(/phase[- ](boundary|complete)/);
  });

  it('contains instruction for inbox check post-verification', () => {
    const content = readSkill().toLowerCase();
    expect(content).toMatch(/(post[- ]verification|after verification)/);
  });
});

// ============================================================================
// 3. Script references (4 tests)
// ============================================================================

describe('Script references', () => {
  it('references scripts/console/check-inbox.sh', () => {
    const content = readSkill();
    expect(content).toContain('scripts/console/check-inbox.sh');
  });

  it('references scripts/console/write-question.sh', () => {
    const content = readSkill();
    expect(content).toContain('scripts/console/write-question.sh');
  });

  it('references scripts/console/write-status.sh', () => {
    const content = readSkill();
    expect(content).toContain('scripts/console/write-status.sh');
  });

  it('references scripts/console/validate-config.sh', () => {
    const content = readSkill();
    expect(content).toContain('scripts/console/validate-config.sh');
  });
});

// ============================================================================
// 4. Message type handling (3 tests)
// ============================================================================

describe('Message type handling', () => {
  it('contains handling instructions for milestone-submit', () => {
    const content = readSkill();
    expect(content).toContain('milestone-submit');
  });

  it('contains handling instructions for config-update', () => {
    const content = readSkill();
    expect(content).toContain('config-update');
  });

  it('contains handling instructions for question-response', () => {
    const content = readSkill();
    expect(content).toContain('question-response');
  });
});

// ============================================================================
// 5. Content quality (2 tests)
// ============================================================================

describe('Content quality', () => {
  it('skill content is under 5000 words', () => {
    const content = readSkill();
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeLessThan(5000);
  });

  it('skill contains at least 3 distinct ## sections', () => {
    const content = readSkill();
    const sectionHeadings = content.match(/^## /gm) || [];
    expect(sectionHeadings.length).toBeGreaterThanOrEqual(3);
  });
});

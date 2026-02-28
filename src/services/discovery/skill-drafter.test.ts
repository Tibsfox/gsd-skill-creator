/**
 * TDD tests for SKILL.md draft generation from ranked candidates.
 *
 * Tests generateSkillDraft for tool bigram, trigram, and bash pattern types.
 * Verifies TOOL_DESCRIPTIONS and BASH_DESCRIPTIONS coverage, content quality
 * (no TODO markers), valid YAML frontmatter, and content budget compliance.
 */

import { describe, it, expect } from 'vitest';
import {
  generateSkillDraft,
  TOOL_DESCRIPTIONS,
  BASH_DESCRIPTIONS,
} from './skill-drafter.js';
import type { RankedCandidate, ScoreBreakdown, PatternEvidence } from './pattern-scorer.js';

// ============================================================================
// Helpers
// ============================================================================

/** Default score breakdown for test candidates */
const defaultBreakdown: ScoreBreakdown = {
  frequency: 0.6,
  crossProject: 0.5,
  recency: 0.8,
  consistency: 0.4,
};

/** Default evidence for test candidates */
const defaultEvidence: PatternEvidence = {
  projects: ['project-alpha', 'project-beta', 'project-gamma'],
  sessions: ['s1', 's2', 's3', 's4', 's5'],
  totalOccurrences: 42,
  exampleInvocations: ['Read -> Edit', 'Read -> Edit -> Bash'],
  lastSeen: '2026-02-05',
  firstSeen: '2026-01-15',
};

/** Build a RankedCandidate with sensible defaults and overrides */
function makeCandidate(overrides: Partial<RankedCandidate> = {}): RankedCandidate {
  return {
    patternKey: overrides.patternKey ?? 'tool:bigram:Read->Edit',
    label: overrides.label ?? 'Read -> Edit',
    type: overrides.type ?? 'tool-bigram',
    score: overrides.score ?? 0.72,
    scoreBreakdown: overrides.scoreBreakdown ?? { ...defaultBreakdown },
    evidence: overrides.evidence ?? { ...defaultEvidence },
    suggestedName: overrides.suggestedName ?? 'read-edit-workflow',
    suggestedDescription: overrides.suggestedDescription ?? 'Read files then edit them with targeted replacements',
  };
}

// ============================================================================
// generateSkillDraft: tool bigram
// ============================================================================

describe('generateSkillDraft for tool bigram pattern', () => {
  const candidate = makeCandidate({
    patternKey: 'tool:bigram:Read->Edit',
    type: 'tool-bigram',
    suggestedName: 'read-edit-workflow',
    suggestedDescription: 'Read files then edit them with targeted replacements',
  });

  it('returns name matching suggestedName', () => {
    const result = generateSkillDraft(candidate);
    expect(result.name).toBe('read-edit-workflow');
  });

  it('content starts with valid YAML frontmatter delimiter', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content.startsWith('---\n')).toBe(true);
  });

  it('frontmatter contains name field', () => {
    const result = generateSkillDraft(candidate);
    const frontmatter = result.content.split('---')[1];
    expect(frontmatter).toContain('name:');
  });

  it('frontmatter contains description field', () => {
    const result = generateSkillDraft(candidate);
    const frontmatter = result.content.split('---')[1];
    expect(frontmatter).toContain('description:');
  });

  it('body includes Workflow section', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('## Workflow');
  });

  it('body includes numbered step for Read', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('1. **Read**');
  });

  it('body includes numbered step for Edit', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('2. **Edit**');
  });

  it('step descriptions contain actual tool descriptions, not TODOs', () => {
    const result = generateSkillDraft(candidate);
    // Read step should have its description from TOOL_DESCRIPTIONS
    expect(result.content).toContain(TOOL_DESCRIPTIONS['Read']);
    expect(result.content).toContain(TOOL_DESCRIPTIONS['Edit']);
  });

  it('body includes When to Use section', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('## When to Use');
  });

  it('body includes Pattern Evidence section with project count', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('## Pattern Evidence');
    expect(result.content).toContain('3'); // 3 projects
  });

  it('body includes Pattern Evidence section with session count', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('5'); // 5 sessions
  });

  it('has no TODO, [Add step], or placeholder markers', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).not.toMatch(/TODO/i);
    expect(result.content).not.toMatch(/\[Add step\]/i);
    expect(result.content).not.toMatch(/<!-- TODO/i);
    expect(result.content).not.toMatch(/\[Add example\]/i);
  });
});

// ============================================================================
// generateSkillDraft: tool trigram
// ============================================================================

describe('generateSkillDraft for tool trigram pattern', () => {
  const candidate = makeCandidate({
    patternKey: 'tool:trigram:Glob->Read->Edit',
    type: 'tool-trigram',
    label: 'Glob -> Read -> Edit',
    suggestedName: 'glob-read-edit-workflow',
    suggestedDescription: 'Find files, read contents, then edit with replacements',
  });

  it('body includes 3 numbered steps', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('1. **Glob**');
    expect(result.content).toContain('2. **Read**');
    expect(result.content).toContain('3. **Edit**');
  });

  it('each step has substantive description from TOOL_DESCRIPTIONS', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain(TOOL_DESCRIPTIONS['Glob']);
    expect(result.content).toContain(TOOL_DESCRIPTIONS['Read']);
    expect(result.content).toContain(TOOL_DESCRIPTIONS['Edit']);
  });
});

// ============================================================================
// generateSkillDraft: bash pattern
// ============================================================================

describe('generateSkillDraft for bash pattern', () => {
  const candidate = makeCandidate({
    patternKey: 'bash:git-workflow',
    type: 'bash-pattern',
    label: 'git-workflow',
    suggestedName: 'git-workflow-patterns',
    suggestedDescription: 'Git version control operations patterns',
  });

  it('body includes Common Commands section that is not empty', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('## Common Commands');
    // Section should have content after the heading
    const afterHeading = result.content.split('## Common Commands')[1];
    expect(afterHeading.trim().length).toBeGreaterThan(0);
  });

  it('body includes Guidelines section with actual guidelines, not TODO', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toContain('## Guidelines');
    const guidelinesSection = result.content.split('## Guidelines')[1].split('##')[0];
    expect(guidelinesSection).not.toMatch(/TODO/i);
    expect(guidelinesSection.trim().length).toBeGreaterThan(10);
  });

  it('title references the category', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).toMatch(/git.?workflow/i);
  });

  it('has no TODO or placeholder markers', () => {
    const result = generateSkillDraft(candidate);
    expect(result.content).not.toMatch(/TODO/i);
    expect(result.content).not.toMatch(/\[Add step\]/i);
    expect(result.content).not.toMatch(/\[Add example\]/i);
  });
});

// ============================================================================
// TOOL_DESCRIPTIONS coverage
// ============================================================================

describe('TOOL_DESCRIPTIONS coverage', () => {
  const expectedTools = [
    'Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep',
    'WebSearch', 'WebFetch', 'NotebookEdit', 'Skill',
    'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet',
  ];

  it('has entries for all 14 standard Claude Code tools', () => {
    for (const tool of expectedTools) {
      expect(TOOL_DESCRIPTIONS).toHaveProperty(tool);
      expect(typeof TOOL_DESCRIPTIONS[tool]).toBe('string');
      expect(TOOL_DESCRIPTIONS[tool].length).toBeGreaterThan(0);
    }
  });

  it('has exactly 14 entries', () => {
    expect(Object.keys(TOOL_DESCRIPTIONS)).toHaveLength(14);
  });
});

// ============================================================================
// BASH_DESCRIPTIONS coverage
// ============================================================================

describe('BASH_DESCRIPTIONS coverage', () => {
  const expectedCategories = [
    'git-workflow', 'test-command', 'build-command',
    'package-management', 'file-operation', 'search',
    'scripted', 'other',
  ];

  it('has entries for all 8 BashCategory values', () => {
    for (const cat of expectedCategories) {
      expect(BASH_DESCRIPTIONS).toHaveProperty(cat);
      expect(typeof BASH_DESCRIPTIONS[cat]).toBe('string');
      expect(BASH_DESCRIPTIONS[cat].length).toBeGreaterThan(0);
    }
  });

  it('has exactly 8 entries', () => {
    expect(Object.keys(BASH_DESCRIPTIONS)).toHaveLength(8);
  });
});

// ============================================================================
// Content budget
// ============================================================================

describe('content budget', () => {
  it('generated content for a typical tool bigram candidate is under 15,000 characters', () => {
    const candidate = makeCandidate();
    const result = generateSkillDraft(candidate);
    expect(result.content.length).toBeLessThan(15000);
  });

  it('generated content for a typical bash candidate is under 15,000 characters', () => {
    const candidate = makeCandidate({
      patternKey: 'bash:git-workflow',
      type: 'bash-pattern',
      suggestedName: 'git-workflow-patterns',
      suggestedDescription: 'Git version control operations patterns',
    });
    const result = generateSkillDraft(candidate);
    expect(result.content.length).toBeLessThan(15000);
  });

  it('generated content for a trigram candidate is under 15,000 characters', () => {
    const candidate = makeCandidate({
      patternKey: 'tool:trigram:Glob->Read->Edit',
      type: 'tool-trigram',
      suggestedName: 'glob-read-edit-workflow',
      suggestedDescription: 'Find, read, and edit files',
    });
    const result = generateSkillDraft(candidate);
    expect(result.content.length).toBeLessThan(15000);
  });
});

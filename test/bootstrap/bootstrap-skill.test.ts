/**
 * Structural validation tests for skills/bootstrap-guide/SKILL.md
 *
 * Validates that the bootstrap SKILL.md contains all 7 required sections,
 * is self-contained, references bootstrap.sh and magic-level.json,
 * and meets minimum content depth requirements.
 *
 * Phase 378-02 — Bootstrap
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SKILL_PATH = resolve(__dirname, '../../skills/bootstrap-guide/SKILL.md');

let content: string;
try {
  content = readFileSync(SKILL_PATH, 'utf-8');
} catch {
  content = '';
}

describe('Bootstrap SKILL.md', () => {
  it('exists and is readable', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('has valid YAML frontmatter', () => {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();

    const frontmatter = frontmatterMatch![1];
    expect(frontmatter).toMatch(/name:\s*bootstrap-guide/);
    expect(frontmatter).toMatch(/version:/);
    expect(frontmatter).toMatch(/description:/);
    // triggers should be present (as an array or under metadata)
    expect(frontmatter).toMatch(/trigger/i);
  });

  it('contains Identity and Role section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?Identity and Role/);

    // Extract section content
    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?Identity and Role([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    expect(section).toMatch(/Bootstrap Guide/i);
    expect(section).toMatch(/patient/i);
    expect(section).toMatch(/encouraging/i);
    expect(section).toMatch(/impossible to break|cannot break|can't break/i);
  });

  it('contains Service Dependency Graph section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?Service Dependency Graph/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?Service Dependency Graph([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    // Must mention key services
    expect(section).toMatch(/tmux/i);
    expect(section).toMatch(/Claude/i);
    expect(section).toMatch(/File Watcher/i);
    expect(section).toMatch(/Dashboard/i);
    expect(section).toMatch(/Console/i);
    expect(section).toMatch(/Staging/i);

    // Must have tree or graph structure
    const hasTree = /[└├]──/.test(section) || /^\s+-\s/m.test(section);
    expect(hasTree).toBe(true);
  });

  it('contains Bring-Up Sequence section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?Bring-Up Sequence/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?Bring-Up Sequence([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    // At least 5 numbered steps
    const numberedSteps = section.match(/(?:^|\n)\s*(?:\d+\.|###\s+Step\s+\d)/g);
    expect(numberedSteps).not.toBeNull();
    expect(numberedSteps!.length).toBeGreaterThanOrEqual(5);
  });

  it('contains Magic Level Awareness section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?Magic Level Awareness/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?Magic Level Awareness([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    // Must mention all 5 levels
    expect(section).toMatch(/\b1\b/);
    expect(section).toMatch(/\b2\b/);
    expect(section).toMatch(/\b3\b/);
    expect(section).toMatch(/\b4\b/);
    expect(section).toMatch(/\b5\b/);

    // Level descriptions should differ
    const hasMinimal = /shapes|silent|minimal/i.test(section);
    const hasVerbose = /full|everything|debug|raw/i.test(section);
    expect(hasMinimal).toBe(true);
    expect(hasVerbose).toBe(true);
  });

  it('contains Error Recovery Patterns section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?Error Recovery Patterns/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?Error Recovery Patterns([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    // At least 3 error patterns
    const errorPatterns = section.match(/###\s+(?:Error:|Pattern:|\d+\.)/g);
    expect(errorPatterns).not.toBeNull();
    expect(errorPatterns!.length).toBeGreaterThanOrEqual(3);

    // Each pattern should have symptom/diagnosis/fix/prevention keywords
    expect(section).toMatch(/symptom/i);
    expect(section).toMatch(/diagnosis|cause/i);
    expect(section).toMatch(/fix|recovery/i);
    expect(section).toMatch(/prevention/i);
  });

  it('contains First Interaction Templates section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?First Interaction Templates/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?First Interaction Templates([\s\S]*?)(?=\n##\s)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    // At least 3 templates: fresh, partial, full
    expect(section).toMatch(/fresh|all.*down/i);
    expect(section).toMatch(/partial|some.*running/i);
    expect(section).toMatch(/full|all.*green/i);
  });

  it('contains You Can\'t Break It Guarantee section', () => {
    expect(content).toMatch(/##\s+(?:\d+\.\s+)?.*[Yy]ou [Cc]an.*[Bb]reak [Ii]t/);

    const sectionMatch = content.match(/##\s+(?:\d+\.\s+)?.*[Yy]ou [Cc]an.*[Bb]reak [Ii]t([\s\S]*?)(?=\n##\s|$)/);
    expect(sectionMatch).not.toBeNull();
    const section = sectionMatch![1];

    expect(section).toMatch(/never blame|never.*blame/i);
    expect(section).toMatch(/recovery path|recovery/i);
    expect(section).toMatch(/learning opportunities|learning/i);
    expect(section).toMatch(/Welcome back/);
  });

  it('is self-contained -- no external file references required', () => {
    // Should NOT contain @import, @include, or "see [other-file]" patterns
    // that require loading additional skill files
    expect(content).not.toMatch(/@import\b/);
    expect(content).not.toMatch(/@include\b/);
    // References to bootstrap.sh and check-prerequisites.sh are allowed
    const seeReferences = content.match(/see \[.*?\]\((?!.*(?:bootstrap\.sh|check-prerequisites\.sh)).*?\)/gi);
    // No references to other skill files
    const skillImports = content.match(/(?:load|import|include)\s+\S+\.md/gi);
    expect(skillImports).toBeNull();
  });

  it('references bootstrap.sh in bring-up sequence', () => {
    expect(content).toMatch(/bootstrap\.sh/);
  });

  it('references magic-level.json for configuration', () => {
    expect(content).toMatch(/magic-level\.json/);
  });

  it('has minimum content depth', () => {
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(200);

    // At least 7 level-2 headings
    const h2Count = content.match(/^## /gm);
    expect(h2Count).not.toBeNull();
    expect(h2Count!.length).toBeGreaterThanOrEqual(7);
  });

  it('magic level table covers all 5 levels', () => {
    // Find a table or structured list mapping levels to behavior
    const levelSection = content.match(/##\s+(?:\d+\.\s+)?Magic Level Awareness([\s\S]*?)(?=\n##\s)/);
    expect(levelSection).not.toBeNull();
    const section = levelSection![1];

    // Check for explicit level entries
    expect(section).toMatch(/\|\s*1\s*\|/);
    expect(section).toMatch(/\|\s*2\s*\|/);
    expect(section).toMatch(/\|\s*3\s*\|/);
    expect(section).toMatch(/\|\s*4\s*\|/);
    expect(section).toMatch(/\|\s*5\s*\|/);
  });
});

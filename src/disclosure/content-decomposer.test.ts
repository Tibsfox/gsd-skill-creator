import { describe, it, expect, beforeEach } from 'vitest';
import { ContentDecomposer } from './content-decomposer.js';
import type { DecomposedSkill } from './content-decomposer.js';
import type { SkillMetadata } from '../types/skill.js';

// Helper to generate text of approximately N words
function generateWords(n: number): string {
  const words = [];
  for (let i = 0; i < n; i++) {
    words.push(`word${i}`);
  }
  return words.join(' ');
}

// Helper to build a multi-section body with target word counts
function buildMultiSectionBody(sectionWordCounts: Record<string, number>): string {
  const sections: string[] = [];
  for (const [heading, count] of Object.entries(sectionWordCounts)) {
    sections.push(`## ${heading}\n\n${generateWords(count)}`);
  }
  return sections.join('\n\n');
}

describe('ContentDecomposer', () => {
  let decomposer: ContentDecomposer;
  const defaultMetadata: SkillMetadata = {
    name: 'test-skill',
    description: 'A test skill for decomposition',
  };

  beforeEach(() => {
    decomposer = new ContentDecomposer();
  });

  describe('decompose', () => {
    it('returns unchanged body for short skills (<2000 words)', () => {
      const body = buildMultiSectionBody({
        Overview: 200,
        Guidelines: 300,
        Examples: 200,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.decomposed).toBe(false);
      expect(result.skillMd).toBe(body);
      expect(result.references).toHaveLength(0);
      expect(result.scripts).toHaveLength(0);
    });

    it('decomposes long skills (>2000 words) into skillMd + references', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.decomposed).toBe(true);
      expect(result.references.length).toBeGreaterThan(0);
    });

    it('keeps first section inline in skillMd', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.skillMd).toContain('## Overview');
      expect(result.skillMd).toContain('word0');
    });

    it('creates reference files for extracted sections', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.references.length).toBeGreaterThanOrEqual(2);

      for (const ref of result.references) {
        expect(ref.filename).toMatch(/\.md$/);
        expect(ref.content.length).toBeGreaterThan(0);
        expect(ref.wordCount).toBeGreaterThan(0);
      }
    });

    it('includes @reference links in skillMd', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.skillMd).toContain('@references/');
    });

    it('extracts deterministic ops as scripts', () => {
      const scriptBlock = `\`\`\`bash
git init
git remote add origin https://example.com/repo.git
mkdir -p src/
\`\`\``;

      const body = `## Overview

${generateWords(600)}

## Setup

Follow these steps:

${scriptBlock}

## Guidelines

${generateWords(900)}

## Examples

${generateWords(700)}`;

      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.decomposed).toBe(true);
      expect(result.scripts.length).toBeGreaterThanOrEqual(1);
      for (const script of result.scripts) {
        expect(script.filename).toMatch(/\.sh$/);
        expect(script.executable).toBe(true);
      }
    });

    it('preserves all original content across skillMd + references + scripts', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);

      // Count total words across all parts
      const allContent = [
        result.skillMd,
        ...result.references.map((r) => r.content),
        ...result.scripts.map((s) => s.content),
      ].join(' ');

      // All key content words should appear somewhere
      expect(allContent).toContain('word0');
      expect(allContent).toContain('word399');
    });

    it('adds warning for skills exceeding 5000 words', () => {
      const body = buildMultiSectionBody({
        Overview: 1000,
        Guidelines: 1500,
        Examples: 1500,
        Advanced: 1500,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('5000');
    });

    it('returns no warnings for skills under 5000 words', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('generateSkillMd', () => {
    it('includes first section inline', () => {
      const sections = [
        { heading: 'Overview', content: 'This is overview.', wordCount: 3, startLine: 0, endLine: 2 },
        { heading: 'Guidelines', content: 'Follow these rules.', wordCount: 3, startLine: 4, endLine: 6 },
      ];
      const references = [
        { filename: 'guidelines.md', content: 'Follow these rules.', wordCount: 3 },
      ];
      const result = decomposer.generateSkillMd(
        'test-skill',
        defaultMetadata,
        sections,
        references,
        [],
      );
      expect(result).toContain('This is overview.');
    });

    it('adds @references links for each extracted section', () => {
      const sections = [
        { heading: 'Overview', content: 'Overview text.', wordCount: 2, startLine: 0, endLine: 2 },
        { heading: 'Guidelines', content: 'Guidelines text.', wordCount: 2, startLine: 4, endLine: 6 },
        { heading: 'Examples', content: 'Examples text.', wordCount: 2, startLine: 8, endLine: 10 },
      ];
      const references = [
        { filename: 'guidelines.md', content: 'Guidelines text.', wordCount: 2 },
        { filename: 'examples.md', content: 'Examples text.', wordCount: 2 },
      ];
      const result = decomposer.generateSkillMd(
        'test-skill',
        defaultMetadata,
        sections,
        references,
        [],
      );
      expect(result).toContain('@references/guidelines.md');
      expect(result).toContain('@references/examples.md');
    });

    it('adds @scripts links for extracted scripts', () => {
      const sections = [
        { heading: 'Overview', content: 'Overview text.', wordCount: 2, startLine: 0, endLine: 2 },
      ];
      const scripts = [
        { filename: 'setup.sh', content: 'git init', executable: true },
        { filename: 'build.sh', content: 'npm run build', executable: true },
      ];
      const result = decomposer.generateSkillMd(
        'test-skill',
        defaultMetadata,
        sections,
        [],
        scripts,
      );
      expect(result).toContain('@scripts/setup.sh');
      expect(result).toContain('@scripts/build.sh');
    });

    it('produces compact SKILL.md under 500 words', () => {
      const sections = [
        { heading: 'Overview', content: generateWords(100), wordCount: 100, startLine: 0, endLine: 5 },
        { heading: 'Guidelines', content: generateWords(800), wordCount: 800, startLine: 7, endLine: 50 },
        { heading: 'Examples', content: generateWords(600), wordCount: 600, startLine: 52, endLine: 100 },
      ];
      const references = [
        { filename: 'guidelines.md', content: generateWords(800), wordCount: 800 },
        { filename: 'examples.md', content: generateWords(600), wordCount: 600 },
      ];
      const result = decomposer.generateSkillMd(
        'test-skill',
        defaultMetadata,
        sections,
        references,
        [],
      );
      const wordCount = result.split(/\s+/).filter((w) => w.length > 0).length;
      expect(wordCount).toBeLessThan(500);
    });
  });

  describe('edge cases', () => {
    it('does not decompose single-section skill even if >2000 words', () => {
      const body = `## Massive Section\n\n${generateWords(2500)}`;
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.decomposed).toBe(false);
      expect(result.skillMd).toBe(body);
    });

    it('treats skill with no H2 headings as single section', () => {
      const body = generateWords(2500);
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      expect(result.decomposed).toBe(false);
      expect(result.skillMd).toBe(body);
    });

    it('only extracts scripts from fenced code blocks, not inline code', () => {
      const body = `## Overview

${generateWords(400)}

## Instructions

Use \`git commit\` and \`npm install\` to set up. Also run \`make build\`.

## Details

${generateWords(800)}

## More

${generateWords(600)}`;
      const result = decomposer.decompose('test-skill', defaultMetadata, body);
      // No script extraction from inline code
      expect(result.scripts).toHaveLength(0);
    });
  });
});

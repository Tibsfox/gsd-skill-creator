import { describe, it, expect, beforeEach } from 'vitest';
import { CompactGenerator } from './compact-generator.js';
import type { CompactSkillOutput } from './compact-generator.js';

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

describe('CompactGenerator', () => {
  let generator: CompactGenerator;
  const defaultMetadata = {
    name: 'test-skill',
    description: 'A test skill for compact generation',
  };

  beforeEach(() => {
    generator = new CompactGenerator();
  });

  describe('generateCompact — basic behavior', () => {
    it('returns body unchanged for short body (<2000 words)', () => {
      const body = buildMultiSectionBody({
        Overview: 200,
        Guidelines: 300,
        Examples: 200,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.compacted).toBe(false);
      expect(result.skillMd).toBe(body);
      expect(result.references).toHaveLength(0);
      expect(result.scripts).toHaveLength(0);
    });

    it('returns compact output for long body (>2000 words with multiple sections)', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.compacted).toBe(true);
      expect(result.references.length).toBeGreaterThan(0);
    });

    it('includes only intro/first section inline in compact SKILL.md', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      // First section (Overview) should be inline
      expect(result.skillMd).toContain('Overview');
      expect(result.skillMd).toContain('word0');
      // Other sections should NOT have their full content inline
      expect(result.skillMd).not.toContain('word400'); // Guidelines start
    });

    it('creates reference files for all sections after the first', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      // Should have references for Guidelines, Examples, Advanced
      expect(result.references.length).toBeGreaterThanOrEqual(2);
      const refFilenames = result.references.map(r => r.filename);
      expect(refFilenames).toContain('guidelines.md');
      expect(refFilenames).toContain('examples.md');
      expect(refFilenames).toContain('advanced.md');
    });

    it('uses @references/{section-slug}.md link pattern', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.skillMd).toContain('@references/guidelines.md');
      expect(result.skillMd).toContain('@references/examples.md');
      expect(result.skillMd).toContain('@references/advanced.md');
    });

    it('includes original section heading as description in links', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        'Best Practices': 800,
        'Code Examples': 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      // Links should include heading as description
      expect(result.skillMd).toMatch(/@references\/best-practices\.md.*Best Practices/);
      expect(result.skillMd).toMatch(/@references\/code-examples\.md.*Code Examples/);
    });
  });

  describe('generateCompact — scripts', () => {
    it('extracts deterministic ops to scripts/ files', () => {
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

      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.compacted).toBe(true);
      expect(result.scripts.length).toBeGreaterThanOrEqual(1);
    });

    it('script files have appropriate hashbang', () => {
      const body = `## Overview

${generateWords(600)}

## Setup

Run this:

\`\`\`bash
git init
git add .
git commit -m "initial"
\`\`\`

## Guidelines

${generateWords(900)}

## More

${generateWords(700)}`;

      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      if (result.scripts.length > 0) {
        for (const script of result.scripts) {
          expect(script.content).toMatch(/^#!\/bin\/bash|^#!\/usr\/bin\/env (node|bash)/);
        }
      }
    });
  });

  describe('compact SKILL.md structure', () => {
    it('has Additional References section with links', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        Guidelines: 800,
        Examples: 500,
        Advanced: 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.skillMd).toContain('## Additional References');
    });

    it('has Scripts section when scripts exist', () => {
      const body = `## Overview

${generateWords(600)}

## Setup

\`\`\`bash
npm install
npm run build
\`\`\`

## Guidelines

${generateWords(900)}

## Examples

${generateWords(700)}`;

      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      if (result.scripts.length > 0) {
        expect(result.skillMd).toContain('## Scripts');
      }
    });

    it('compact SKILL.md word count is under 500 for 3000-word original', () => {
      const body = buildMultiSectionBody({
        Overview: 100,
        Guidelines: 800,
        Examples: 700,
        Advanced: 700,
        'Best Practices': 700,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      const words = result.skillMd.split(/\s+/).filter(w => w.length > 0);
      expect(words.length).toBeLessThan(500);
    });
  });

  describe('edge cases', () => {
    it('body with no sections returns unchanged with no decomposition', () => {
      const body = generateWords(2500);
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      expect(result.compacted).toBe(false);
      expect(result.skillMd).toBe(body);
    });

    it('section headings with special characters are slugified correctly', () => {
      const body = buildMultiSectionBody({
        Overview: 400,
        'C++ Templates & Generics': 800,
        'Error Handling (Advanced)': 500,
        'Q&A / FAQ': 600,
      });
      const result = generator.generateCompact('test-skill', defaultMetadata, body);

      if (result.compacted) {
        const refFilenames = result.references.map(r => r.filename);
        // All filenames should be lowercase, kebab-case, no special chars
        for (const filename of refFilenames) {
          expect(filename).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]\.md$/);
        }
      }
    });
  });
});

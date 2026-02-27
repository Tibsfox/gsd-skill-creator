import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const README_PATH = resolve(__dirname, '../../src/site/README.md');

describe('Generator Documentation', () => {
  it('README.md exists at src/site/README.md', () => {
    expect(existsSync(README_PATH)).toBe(true);
  });

  it('contains required sections', () => {
    const content = readFileSync(README_PATH, 'utf-8');
    const requiredSections = [
      'architecture',
      'quick start',
      'configuration',
      'content authoring',
      'agent discovery',
      'wordpress',
      'deployment',
      'design system',
    ];

    const lower = content.toLowerCase();
    for (const section of requiredSections) {
      expect(lower).toContain(section);
    }
  });

  it('has word count over 500', () => {
    const content = readFileSync(README_PATH, 'utf-8');
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    expect(words.length).toBeGreaterThan(500);
  });
});

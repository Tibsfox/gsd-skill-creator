import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import yaml from 'js-yaml';
import type { FrontMatter } from '../../src/site/types';

const CONTENT_DIR = resolve(__dirname, '../../src/site/content');

/** Parse YAML frontmatter from markdown file content */
function parseFrontmatter(raw: string): { frontmatter: FrontMatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  const frontmatter = yaml.load(match[1]) as FrontMatter;
  const body = match[2].trim();
  return { frontmatter, body };
}

/** Count words in plain text (ignoring markdown syntax) */
function wordCount(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, '')   // remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
    .replace(/[#*_~>`-]/g, '')        // strip markdown chars
    .replace(/\n/g, ' ');
  return stripped.split(/\s+/).filter(Boolean).length;
}

const CONTENT_FILES = [
  'index.md',
  'about.md',
  'essays/the-space-between.md',
  'essays/amiga-principle.md',
  'packs/electronics.md',
  'packs/bbs-culture.md',
  'packs/kung-fu-cinema.md',
  'skills/skill-creator.md',
  'bibliography.md',
  'releases/index.md',
  'docs/index.md',
];

describe('Sample Content', () => {
  it('all content files exist', () => {
    for (const file of CONTENT_FILES) {
      const fullPath = join(CONTENT_DIR, file);
      expect(existsSync(fullPath), `Missing: ${file}`).toBe(true);
    }
  });

  it('each file has valid YAML frontmatter with required fields', () => {
    for (const file of CONTENT_FILES) {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { frontmatter } = parseFrontmatter(raw);
      expect(frontmatter.title, `${file} missing title`).toBeTruthy();
      expect(typeof frontmatter.title).toBe('string');
    }
  });

  it('at least one essay has citations', () => {
    const essays = CONTENT_FILES.filter(f => f.startsWith('essays/'));
    const hasCitation = essays.some(f => {
      const raw = readFileSync(join(CONTENT_DIR, f), 'utf-8');
      return /\[@[a-zA-Z0-9_-]+\]/.test(raw);
    });
    expect(hasCitation, 'No essay contains [@citation] markers').toBe(true);
  });

  it('home page uses template=home', () => {
    const raw = readFileSync(join(CONTENT_DIR, 'index.md'), 'utf-8');
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.template).toBe('home');
  });

  it('pack pages all have nav_section=packs', () => {
    const packs = CONTENT_FILES.filter(f => f.startsWith('packs/'));
    for (const file of packs) {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { frontmatter } = parseFrontmatter(raw);
      expect(frontmatter.nav_section, `${file} missing nav_section=packs`).toBe('packs');
    }
  });

  it('every page has at least 100 words of content', () => {
    for (const file of CONTENT_FILES) {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { body } = parseFrontmatter(raw);
      const count = wordCount(body);
      expect(count, `${file} has only ${count} words (need 100+)`).toBeGreaterThanOrEqual(100);
    }
  });

  it('listing pages use page template and have nav_section', () => {
    const listingPages = [
      { file: 'releases/index.md', section: 'releases' },
      { file: 'docs/index.md', section: 'docs' },
    ];
    for (const { file, section } of listingPages) {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { frontmatter } = parseFrontmatter(raw);
      expect(frontmatter.template, `${file} should use page template`).toBe('page');
      expect(frontmatter.nav_section, `${file} should have nav_section=${section}`).toBe(section);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import yaml from 'js-yaml';
import type {
  SiteConfig,
  AgentConfig,
  WordPressConfig,
  NavigationSection,
  CitationDatabase,
  CitationEntry,
} from '../../src/site/types';

const CONFIG_DIR = resolve(__dirname, '../../src/site/config');
const CONTENT_DIR = resolve(__dirname, '../../src/site/content');

describe('Site Configuration', () => {
  it('site.yaml is parseable and matches SiteConfig shape', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'site.yaml'), 'utf-8');
    const config = yaml.load(raw) as SiteConfig;

    expect(config.title).toBe('My Site');
    expect(config.description).toBeTruthy();
    expect(config.url).toMatch(/^https?:\/\//);
    expect(config.author).toBeTruthy();
    expect(config.language).toBe('en');
    expect(config.agent).toBeDefined();
    expect(config.wordpress).toBeDefined();
    expect(config.deploy).toBeDefined();
  });

  it('navigation.yaml is parseable as NavigationSection[]', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'navigation.yaml'), 'utf-8');
    const data = yaml.load(raw) as { sections: NavigationSection[] };

    expect(Array.isArray(data.sections)).toBe(true);
    expect(data.sections.length).toBeGreaterThanOrEqual(3);

    for (const section of data.sections) {
      expect(section.id).toBeTruthy();
      expect(section.label).toBeTruthy();
      expect(Array.isArray(section.items)).toBe(true);
      for (const item of section.items) {
        expect(item.label).toBeTruthy();
        expect(item.url).toMatch(/^\//);
      }
    }
  });

  it('citations.json is parseable as CitationDatabase', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'citations.json'), 'utf-8');
    const db = JSON.parse(raw) as CitationDatabase;

    const keys = Object.keys(db);
    expect(keys.length).toBeGreaterThanOrEqual(5);

    for (const key of keys) {
      const entry: CitationEntry = db[key];
      expect(entry.type).toBeTruthy();
      expect(Array.isArray(entry.authors)).toBe(true);
      expect(entry.authors.length).toBeGreaterThanOrEqual(1);
      expect(entry.title).toBeTruthy();
      expect(typeof entry.year).toBe('number');
    }
  });

  it('all navigation URLs correspond to content files', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'navigation.yaml'), 'utf-8');
    const data = yaml.load(raw) as { sections: NavigationSection[] };

    for (const section of data.sections) {
      for (const item of section.items) {
        // Convert URL like /essays/the-space-between/ to content file path
        const urlPath = item.url.replace(/^\//, '').replace(/\/$/, '');
        const filePath = urlPath === '' ? 'index.md' : `${urlPath}.md`;
        const indexPath = urlPath === '' ? 'index.md' : `${urlPath}/index.md`;
        const fullPath = join(CONTENT_DIR, filePath);
        const fullIndexPath = join(CONTENT_DIR, indexPath);
        const found = existsSync(fullPath) || existsSync(fullIndexPath);
        expect(found, `Nav URL ${item.url} has no content file at ${filePath} or ${indexPath}`).toBe(true);
      }
    }
  });

  it('agent config has all required boolean fields', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'site.yaml'), 'utf-8');
    const config = yaml.load(raw) as SiteConfig;
    const agent: AgentConfig = config.agent;

    expect(typeof agent.llms_txt).toBe('boolean');
    expect(typeof agent.llms_full).toBe('boolean');
    expect(typeof agent.agents_md).toBe('boolean');
    expect(typeof agent.schema_org).toBe('boolean');
    expect(typeof agent.markdown_mirror).toBe('boolean');
  });

  it('WordPress config has url and api fields', () => {
    const raw = readFileSync(join(CONFIG_DIR, 'site.yaml'), 'utf-8');
    const config = yaml.load(raw) as SiteConfig;
    const wp = config.wordpress as WordPressConfig;

    expect(wp).toBeDefined();
    expect(wp.url).toMatch(/^https?:\/\//);
    expect(wp.api).toMatch(/^https?:\/\//);
    expect(wp.api).toContain('wp-json');
  });
});

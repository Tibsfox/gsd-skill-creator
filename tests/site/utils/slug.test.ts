import { describe, it, expect } from 'vitest';
import { pathToSlug, slugToOutputPath, slugToUrl } from '../../../src/site/utils/slug';

describe('pathToSlug', () => {
  it('converts simple path to slug', () => {
    expect(pathToSlug('about.md')).toBe('about');
  });

  it('converts nested path to slug', () => {
    expect(pathToSlug('essays/the-space-between.md')).toBe('essays/the-space-between');
  });

  it('converts _index.md to directory slug', () => {
    expect(pathToSlug('skills/_index.md')).toBe('skills');
  });

  it('converts root index.md to empty slug', () => {
    expect(pathToSlug('index.md')).toBe('');
  });

  it('replaces spaces with hyphens', () => {
    expect(pathToSlug('my cool page.md')).toBe('my-cool-page');
  });

  it('removes non-URL-safe characters', () => {
    expect(pathToSlug("what's new! (2026).md")).toBe('whats-new-2026');
  });

  it('leaves already-clean slug unchanged', () => {
    expect(pathToSlug('foundations/ohms-law.md')).toBe('foundations/ohms-law');
  });

  it('converts uppercase to lowercase', () => {
    expect(pathToSlug('About-Us.md')).toBe('about-us');
  });

  it('strips leading docs/ prefix', () => {
    expect(pathToSlug('docs/foundations/intro.md')).toBe('foundations/intro');
  });

  it('handles deeply nested paths', () => {
    expect(pathToSlug('docs/principles/design/color-theory.md')).toBe(
      'principles/design/color-theory',
    );
  });
});

describe('slugToOutputPath', () => {
  it('converts slug to output path', () => {
    expect(slugToOutputPath('essays/the-space-between')).toBe(
      'essays/the-space-between/index.html',
    );
  });

  it('converts empty slug (root) to index.html', () => {
    expect(slugToOutputPath('')).toBe('index.html');
  });

  it('converts simple slug to nested index.html', () => {
    expect(slugToOutputPath('about')).toBe('about/index.html');
  });
});

describe('slugToUrl', () => {
  it('converts slug to clean URL', () => {
    expect(slugToUrl('essays/the-space-between')).toBe('/essays/the-space-between/');
  });

  it('converts empty slug (root) to /', () => {
    expect(slugToUrl('')).toBe('/');
  });

  it('converts simple slug to clean URL', () => {
    expect(slugToUrl('about')).toBe('/about/');
  });
});

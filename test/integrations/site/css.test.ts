import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(__dirname, '../../../src/site/static/css/style.css');

function readCss(): string {
  return readFileSync(CSS_PATH, 'utf-8');
}

describe('CSS Design System', () => {
  it('CSS file exists and is non-empty', () => {
    const css = readCss();
    expect(css.length).toBeGreaterThan(0);
  });

  it('file size is under 15KB raw', () => {
    const stats = statSync(CSS_PATH);
    expect(stats.size).toBeLessThan(15 * 1024);
  });

  it('contains @layer declarations', () => {
    const css = readCss();
    expect(css).toContain('@layer reset');
    expect(css).toContain('@layer base');
    expect(css).toContain('@layer components');
    expect(css).toContain('@layer utilities');
  });

  it('contains custom property definitions', () => {
    const css = readCss();
    expect(css).toContain('--color-bg');
    expect(css).toContain('--color-text');
    expect(css).toContain('--color-accent');
  });

  it('contains prefers-color-scheme media query', () => {
    const css = readCss();
    expect(css).toMatch(/prefers-color-scheme:\s*light/);
  });

  it('contains print media query', () => {
    const css = readCss();
    expect(css).toMatch(/@media\s+print/);
  });

  it('contains responsive breakpoint', () => {
    const css = readCss();
    expect(css).toContain('768px');
  });

  it('contains no framework class names', () => {
    const css = readCss();
    // Tailwind patterns
    expect(css).not.toMatch(/\bflex-\d/);
    expect(css).not.toMatch(/\btext-\w+-\d{3}\b/);
    expect(css).not.toMatch(/\bw-\d+\/\d+\b/);
    // Bootstrap patterns
    expect(css).not.toMatch(/\.container-fluid\b/);
    expect(css).not.toMatch(/\.col-\w+-\d+\b/);
    expect(css).not.toMatch(/\.btn-primary\b/);
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(__dirname, '../../../src/integrations/site/static/css/style.css');

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

  describe('SITE-01 Design System Requirements', () => {
    it('has color-scheme property for FART prevention', () => {
      const css = readCss();
      // color-scheme: dark light in :root tells browser which schemes are supported
      expect(css).toMatch(/color-scheme:\s*dark\s+light/);
    });

    it('has system font stack', () => {
      const css = readCss();
      expect(css).toContain('system-ui');
    });

    it('has optimal measure between 45-75ch', () => {
      const css = readCss();
      const match = css.match(/--measure:\s*(\d+)ch/);
      expect(match).not.toBeNull();
      const value = parseInt(match![1], 10);
      expect(value).toBeGreaterThanOrEqual(45);
      expect(value).toBeLessThanOrEqual(75);
    });

    it('has prefers-color-scheme media query', () => {
      const css = readCss();
      expect(css).toMatch(/prefers-color-scheme/);
    });

    it('has responsive breakpoint at 768px', () => {
      const css = readCss();
      expect(css).toContain('768px');
    });

    it('uses fluid typography with clamp()', () => {
      const css = readCss();
      expect(css).toContain('clamp(');
    });
  });

  describe('Print Stylesheet - SITE-06', () => {
    function extractPrintSection(css: string): string {
      // Find the last @media print block and extract it using brace counting
      const lastPrintIdx = css.lastIndexOf('@media print');
      if (lastPrintIdx === -1) return '';
      const openBrace = css.indexOf('{', lastPrintIdx);
      if (openBrace === -1) return '';
      let depth = 1;
      let pos = openBrace + 1;
      while (pos < css.length && depth > 0) {
        if (css[pos] === '{') depth++;
        if (css[pos] === '}') depth--;
        pos++;
      }
      return css.slice(lastPrintIdx, pos);
    }

    it('has orphans and widows control', () => {
      const print = extractPrintSection(readCss());
      expect(print).toContain('orphans: 3');
      expect(print).toContain('widows: 3');
    });

    it('prevents page breaks inside content blocks', () => {
      const print = extractPrintSection(readCss());
      expect(print).toMatch(/break-inside:\s*avoid/);
    });

    it('prevents page breaks after headings', () => {
      const print = extractPrintSection(readCss());
      expect(print).toMatch(/break-after:\s*avoid/);
    });

    it('has @page margin declaration', () => {
      const print = extractPrintSection(readCss());
      expect(print).toContain('@page');
    });

    it('hides site footer in print', () => {
      const print = extractPrintSection(readCss());
      expect(print).toContain('.site-footer');
    });

    it('hides navigation elements in print', () => {
      const print = extractPrintSection(readCss());
      expect(print).toContain('.site-header');
      expect(print).toContain('.site-nav');
      expect(print).toContain('.toc');
    });

    it('uses modern break properties (not legacy page-break-*)', () => {
      const print = extractPrintSection(readCss());
      expect(print).not.toContain('page-break-inside');
      expect(print).not.toContain('page-break-after');
    });

    it('sets print body typography', () => {
      const print = extractPrintSection(readCss());
      expect(print).toContain('12pt');
    });

    it('file size remains under 15KB after print expansion', () => {
      const stats = statSync(CSS_PATH);
      expect(stats.size).toBeLessThan(15 * 1024);
    });
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

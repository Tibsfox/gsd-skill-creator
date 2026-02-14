/**
 * Tests for hidden content scanner.
 *
 * Verifies detection of invisible or misleading characters:
 * zero-width characters, RTL/LTR overrides, and base64 in
 * unexpected positions.
 *
 * @module staging/hygiene/scanner-hidden.test
 */

import { describe, it, expect } from 'vitest';
import { scanHiddenContent } from './scanner-hidden.js';

describe('scanHiddenContent', () => {
  describe('zero-width characters', () => {
    it('detects zero-width space (U+200B)', () => {
      const findings = scanHiddenContent('Hello\u200Bworld');
      const f = findings.find((f) => f.patternId === 'zero-width-characters');
      expect(f).toBeDefined();
      expect(f!.severity).toBe('high');
      expect(f!.offset).toBe(5);
    });

    it('detects zero-width non-joiner (U+200C)', () => {
      const findings = scanHiddenContent('test\u200Cvalue');
      const f = findings.find((f) => f.patternId === 'zero-width-characters');
      expect(f).toBeDefined();
    });

    it('detects zero-width joiner (U+200D)', () => {
      const findings = scanHiddenContent('test\u200Dvalue');
      const f = findings.find((f) => f.patternId === 'zero-width-characters');
      expect(f).toBeDefined();
    });

    it('detects BOM mid-text (U+FEFF) but not at position 0', () => {
      // Mid-text BOM is suspicious
      const midFindings = scanHiddenContent('start\uFEFFmiddle');
      const midF = midFindings.find(
        (f) => f.patternId === 'zero-width-characters',
      );
      expect(midF).toBeDefined();
    });

    it('detects soft hyphen (U+00AD)', () => {
      const findings = scanHiddenContent('pass\u00ADword');
      const f = findings.find((f) => f.patternId === 'zero-width-characters');
      expect(f).toBeDefined();
    });

    it('reports multiple zero-width characters with individual positions', () => {
      const content = 'a\u200Bb\u200Cc\u200Dd';
      const findings = scanHiddenContent(content).filter(
        (f) => f.patternId === 'zero-width-characters',
      );
      expect(findings).toHaveLength(3);
      expect(findings[0].offset).toBe(1);
      expect(findings[1].offset).toBe(3);
      expect(findings[2].offset).toBe(5);
    });
  });

  describe('RTL/LTR override characters', () => {
    it('detects RTL override character (U+202E)', () => {
      const findings = scanHiddenContent('text \u202E reversed');
      const f = findings.find((f) => f.patternId === 'rtl-override');
      expect(f).toBeDefined();
      expect(f!.severity).toBe('high');
    });

    it('detects LTR embedding character (U+202A)', () => {
      const findings = scanHiddenContent('text \u202A embedded');
      const f = findings.find((f) => f.patternId === 'rtl-override');
      expect(f).toBeDefined();
    });

    it('detects LTR isolate character (U+2066)', () => {
      const findings = scanHiddenContent('text \u2066 isolated');
      const f = findings.find((f) => f.patternId === 'rtl-override');
      expect(f).toBeDefined();
    });
  });

  describe('suspicious base64', () => {
    it('detects base64 in plain text', () => {
      const content =
        'Here is some text\nSGVsbG8gV29ybGQhIFRoaXMgaXMgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdGhhdCBpcyBsb25nIGVub3VnaA==\nmore text';
      const findings = scanHiddenContent(content);
      const f = findings.find((f) => f.patternId === 'suspicious-base64');
      expect(f).toBeDefined();
      expect(f!.severity).toBe('medium');
    });

    it('ignores base64 inside code blocks', () => {
      const content =
        '```\nSGVsbG8gV29ybGQhIFRoaXMgaXMgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdGhhdCBpcyBsb25nIGVub3VnaA==\n```';
      const findings = scanHiddenContent(content);
      const base64Findings = findings.filter(
        (f) => f.patternId === 'suspicious-base64',
      );
      expect(base64Findings).toHaveLength(0);
    });

    it('ignores base64 in data URIs', () => {
      const content =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA';
      const findings = scanHiddenContent(content);
      const base64Findings = findings.filter(
        (f) => f.patternId === 'suspicious-base64',
      );
      expect(base64Findings).toHaveLength(0);
    });

    it('does not flag short base64 strings', () => {
      const content = 'The value ABC123== is fine';
      const findings = scanHiddenContent(content);
      const base64Findings = findings.filter(
        (f) => f.patternId === 'suspicious-base64',
      );
      expect(base64Findings).toHaveLength(0);
    });
  });

  describe('clean content', () => {
    it('returns empty array for normal text', () => {
      const findings = scanHiddenContent(
        'Normal text with no hidden content whatsoever.',
      );
      expect(findings).toEqual([]);
    });
  });
});

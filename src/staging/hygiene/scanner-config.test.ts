/**
 * TDD tests for the YAML configuration safety scanner.
 *
 * Covers code execution tags, merge key bombs, path traversal,
 * environment variable exposure, and clean content handling.
 *
 * @module staging/hygiene/scanner-config.test
 */

import { describe, it, expect } from 'vitest';
import { scanConfigSafety } from './scanner-config.js';

describe('scanConfigSafety', () => {
  // ── Code execution tags ───────────────────────────────────────

  describe('YAML code execution tags', () => {
    it('detects !!python/ code execution tag', () => {
      const content = 'command: !!python/object/apply:os.system ["rm -rf /"]';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-code-execution');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('critical');
    });

    it('detects !!ruby/ code execution tag', () => {
      const content = '--- !!ruby/object:Gem::Installer\ni: x';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-code-execution');
      expect(match).toBeDefined();
    });

    it('detects !!js/ code execution tag', () => {
      const content = 'value: !!js/function "function(){return process.env}"';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-code-execution');
      expect(match).toBeDefined();
    });

    it('detects !!perl/ code execution tag', () => {
      const content = 'cmd: !!perl/code "system(ls)"';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-code-execution');
      expect(match).toBeDefined();
    });

    it('detects code execution tags case-insensitively', () => {
      const content = '!!PYTHON/object:os.system';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-code-execution');
      expect(match).toBeDefined();
    });
  });

  // ── Merge key bomb ────────────────────────────────────────────

  describe('YAML merge key bomb', () => {
    it('detects excessive merge keys (>10)', () => {
      const lines: string[] = [];
      for (let i = 0; i < 12; i++) {
        lines.push(`<<: *anchor_${i}`);
      }
      const content = lines.join('\n');
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'yaml-merge-key-bomb');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('high');
    });

    it('does not flag normal merge key usage (<=10)', () => {
      const lines = [
        '<<: *defaults',
        '<<: *base_config',
        '<<: *shared',
      ];
      const content = lines.join('\n');
      const findings = scanConfigSafety(content);
      const bombFindings = findings.filter(
        (f) => f.patternId === 'yaml-merge-key-bomb',
      );
      expect(bombFindings).toHaveLength(0);
    });
  });

  // ── Path traversal ────────────────────────────────────────────

  describe('path traversal', () => {
    it('detects path traversal sequences', () => {
      const content = 'include: ../../etc/passwd';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'path-traversal');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('high');
      expect(match!.match).toContain('../');
    });

    it('detects multiple path traversals as separate findings', () => {
      const content = 'a: ../secret\nb: ../root\nc: ../etc';
      const findings = scanConfigSafety(content);
      const traversalFindings = findings.filter(
        (f) => f.patternId === 'path-traversal',
      );
      expect(traversalFindings).toHaveLength(3);
    });
  });

  // ── Environment variable exposure ─────────────────────────────

  describe('env var exposure', () => {
    it('detects env var exposure with PASSWORD', () => {
      const content = 'db_password: ${DATABASE_PASSWORD}';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
      expect(match!.severity).toBe('medium');
    });

    it('detects env var exposure with SECRET', () => {
      const content = 'value: $SECRET_KEY';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
    });

    it('detects env var exposure with TOKEN', () => {
      const content = 'auth: ${API_TOKEN}';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
    });

    it('detects env var exposure with KEY', () => {
      const content = 'secret: $AWS_KEY';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
    });

    it('detects env var exposure with CREDENTIAL', () => {
      const content = 'login: ${ADMIN_CREDENTIAL}';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
    });

    it('detects env var exposure with API_KEY', () => {
      const content = 'key: $API_KEY';
      const findings = scanConfigSafety(content);
      const match = findings.find((f) => f.patternId === 'env-var-exposure');
      expect(match).toBeDefined();
    });
  });

  // ── Clean content ─────────────────────────────────────────────

  describe('clean content', () => {
    it('returns empty array for clean YAML content', () => {
      const content =
        'name: my-app\nversion: 1.0\ndependencies:\n  - express\n  - zod';
      const findings = scanConfigSafety(content);
      expect(findings).toEqual([]);
    });
  });

  // ── Path traversal in prose ───────────────────────────────────

  describe('path traversal in prose', () => {
    it('flags ../ inside normal text (scanner reports all, trust layer filters)', () => {
      const content = 'Navigate to ../parent directory for the config.';
      const findings = scanConfigSafety(content);
      const traversalFindings = findings.filter(
        (f) => f.patternId === 'path-traversal',
      );
      expect(traversalFindings.length).toBeGreaterThan(0);
    });
  });
});

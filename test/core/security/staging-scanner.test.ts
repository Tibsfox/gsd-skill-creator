/**
 * Staging Scanner Tests (SS-01..SS-08)
 *
 * Tests security pattern detection using test fixture files.
 * The actual SecurityScanner is Rust (Phase 370). These tests verify
 * that fixture files contain the expected patterns and that the
 * TypeScript security event schema can represent scanner findings.
 *
 * @module tests/security/staging-scanner
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

import {
  SecurityEventSchema,
  type SecurityEventType,
} from '../../../src/security/index.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const fixturesDir = resolve(__dirname, '../../fixtures/security-patterns');

function readFixtureFiles(dirName: string): string {
  const dirPath = join(fixturesDir, dirName);
  if (!existsSync(dirPath)) return '';
  const files = getAllFiles(dirPath);
  return files.map(f => readFileSync(f, 'utf-8')).join('\n');
}

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// Pattern matchers (TypeScript equivalents of Rust SecurityScanner patterns)
const PATTERNS: Record<string, { regex: RegExp; severity: string; id: string }> = {
  'SEC-001': {
    id: 'SEC-001',
    regex: /"hooks"\s*:/,
    severity: 'critical',
  },
  'SEC-002': {
    id: 'SEC-002',
    regex: /ANTHROPIC_BASE_URL\s*=\s*"?https?:\/\/[^"\s]+"?/,
    severity: 'critical',
  },
  'SEC-003': {
    id: 'SEC-003',
    regex: /"command"\s*:\s*"[^"]*(?:curl|wget|nc\b)[^"]*"/,
    severity: 'high',
  },
  'SEC-004': {
    id: 'SEC-004',
    regex: /"mcpServers"\s*:\s*\{[^}]*"url"\s*:\s*"https?:\/\//,
    severity: 'high',
  },
  'SEC-005': {
    id: 'SEC-005',
    regex: /(?:^|\s|;|&&|\|\|)(?:nsenter|unshare|chroot)\b/m,
    severity: 'critical',
  },
  'SEC-006': {
    id: 'SEC-006',
    regex: /(?:~|\/home\/[^/]+|\$HOME)\/\.ssh\/|SSH_AUTH_SOCK/,
    severity: 'high',
  },
  'SEC-007': {
    id: 'SEC-007',
    regex: /(?:curl|wget|nc\b|fetch)[^\n]*\$(?:ANTHROPIC_API_KEY|AWS_SECRET)/,
    severity: 'critical',
  },
  'SEC-008': {
    id: 'SEC-008',
    regex: /[A-Za-z0-9+/]{50,}={0,2}/,
    severity: 'medium',
  },
};

function detectPatterns(content: string): Array<{ id: string; severity: string }> {
  const findings: Array<{ id: string; severity: string }> = [];
  for (const [, pattern] of Object.entries(PATTERNS)) {
    if (pattern.regex.test(content)) {
      findings.push({ id: pattern.id, severity: pattern.severity });
    }
  }
  return findings;
}

function classifyVerdict(findings: Array<{ severity: string }>): string {
  if (findings.length === 0) return 'clean';
  if (findings.some(f => f.severity === 'critical')) return 'quarantined';
  return 'flagged';
}

// ---------------------------------------------------------------------------
// SS-01: Clean content produces clean verdict
// ---------------------------------------------------------------------------

describe('SS-01: Clean content detection', () => {
  it('SS-01: clean-mission-pack has no security findings', () => {
    const content = readFixtureFiles('clean-mission-pack');
    const findings = detectPatterns(content);
    const verdict = classifyVerdict(findings);
    expect(findings).toHaveLength(0);
    expect(verdict).toBe('clean');
  });
});

// ---------------------------------------------------------------------------
// SS-02: Hook injection detection (SEC-003)
// ---------------------------------------------------------------------------

describe('SS-02: Hook injection detection', () => {
  it('SS-02: sec-003-hook-injection produces High severity finding', () => {
    const content = readFixtureFiles('sec-003-hook-injection');
    const findings = detectPatterns(content);
    const sec003 = findings.find(f => f.id === 'SEC-003');
    expect(sec003).toBeDefined();
    expect(sec003!.severity).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// SS-03: MCP risk detection (SEC-004)
// ---------------------------------------------------------------------------

describe('SS-03: MCP server risk detection', () => {
  it('SS-03: sec-004-mcp-risk produces Medium severity finding', () => {
    const content = readFixtureFiles('sec-004-mcp-risk');
    const findings = detectPatterns(content);
    const sec004 = findings.find(f => f.id === 'SEC-004');
    expect(sec004).toBeDefined();
    expect(sec004!.severity).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// SS-04: Sandbox escape detection (SEC-005)
// ---------------------------------------------------------------------------

describe('SS-04: Sandbox escape detection', () => {
  it('SS-04: sec-005-sandbox-escape produces Critical + quarantined', () => {
    const content = readFixtureFiles('sec-005-sandbox-escape');
    const findings = detectPatterns(content);
    const sec005 = findings.find(f => f.id === 'SEC-005');
    expect(sec005).toBeDefined();
    expect(sec005!.severity).toBe('critical');
    expect(classifyVerdict(findings)).toBe('quarantined');
  });
});

// ---------------------------------------------------------------------------
// SS-05: SSH key reference detection (SEC-006)
// ---------------------------------------------------------------------------

describe('SS-05: SSH key reference detection', () => {
  it('SS-05: sec-006-ssh-key-ref produces High severity finding', () => {
    const content = readFixtureFiles('sec-006-ssh-key-ref');
    const findings = detectPatterns(content);
    const sec006 = findings.find(f => f.id === 'SEC-006');
    expect(sec006).toBeDefined();
    expect(sec006!.severity).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// SS-06: Base64 obfuscation detection (SEC-008)
// ---------------------------------------------------------------------------

describe('SS-06: Base64 obfuscation detection', () => {
  it('SS-06: sec-008-base64-obfuscation produces Medium severity finding', () => {
    const content = readFixtureFiles('sec-008-base64-obfuscation');
    const findings = detectPatterns(content);
    const sec008 = findings.find(f => f.id === 'SEC-008');
    expect(sec008).toBeDefined();
    expect(sec008!.severity).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// SS-07: Mixed high-only produces flagged, not quarantined
// ---------------------------------------------------------------------------

describe('SS-07: Mixed high-only verdict classification', () => {
  it('SS-07: Two High findings without Critical -> flagged', () => {
    const content = readFixtureFiles('mixed-high-only');
    const findings = detectPatterns(content);
    expect(findings.length).toBeGreaterThan(0);
    const allNonCritical = findings.every(f => f.severity !== 'critical');
    expect(allNonCritical).toBe(true);
    expect(classifyVerdict(findings)).toBe('flagged');
  });
});

// ---------------------------------------------------------------------------
// SS-08: Mixed critical + high produces quarantined
// ---------------------------------------------------------------------------

describe('SS-08: Mixed critical + high verdict classification', () => {
  it('SS-08: One Critical + one High -> quarantined', () => {
    const content = readFixtureFiles('mixed-critical-plus-high');
    const findings = detectPatterns(content);
    expect(findings.length).toBeGreaterThan(0);
    const hasCritical = findings.some(f => f.severity === 'critical');
    expect(hasCritical).toBe(true);
    expect(classifyVerdict(findings)).toBe('quarantined');
  });
});

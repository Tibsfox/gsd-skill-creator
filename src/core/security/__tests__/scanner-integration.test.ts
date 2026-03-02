/**
 * Scanner integration bridge tests.
 *
 * Bridges TypeScript and Rust by invoking cargo test from Vitest to confirm
 * all 8 CVE patterns (SEC-001 through SEC-008) are detected by the Rust
 * security scanner, and verifies the staging pipeline runs clean.
 *
 * Phase 516-01 -- SSH Security Core
 *
 * @module security/__tests__/scanner-integration.test
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '../../../..');
const TAURI_DIR = join(PROJECT_ROOT, 'src-tauri');
const SCANNER_RS = join(
  TAURI_DIR,
  'src',
  'staging',
  'security_scanner.rs',
);
const FIXTURES_DIR = join(PROJECT_ROOT, 'test', 'fixtures', 'security-patterns');

// ============================================================================
// Rust security scanner tests pass
// ============================================================================

describe('Rust SecurityScanner Integration', () => {
  it(
    'should have all 8 Rust security_scanner tests passing',
    () => {
      const result = execSync(
        'cargo test --manifest-path src-tauri/Cargo.toml security_scanner -- --test-threads=1 2>&1',
        {
          encoding: 'utf-8',
          timeout: 120000,
          cwd: PROJECT_ROOT,
        },
      );
      expect(result).toContain('test result: ok');
    },
    120000,
  );

  it(
    'should have all staging pipeline tests passing',
    () => {
      const result = execSync(
        'cargo test --manifest-path src-tauri/Cargo.toml staging -- --test-threads=1 2>&1',
        {
          encoding: 'utf-8',
          timeout: 120000,
          cwd: PROJECT_ROOT,
        },
      );
      expect(result).toContain('test result: ok');
    },
    120000,
  );
});

// ============================================================================
// All 8 pattern IDs present in scanner source
// ============================================================================

describe('SecurityScanner Pattern Coverage', () => {
  const scannerSource = readFileSync(SCANNER_RS, 'utf-8');
  const expectedPatterns = [
    'SEC-001',
    'SEC-002',
    'SEC-003',
    'SEC-004',
    'SEC-005',
    'SEC-006',
    'SEC-007',
    'SEC-008',
  ];

  for (const patternId of expectedPatterns) {
    it(`should contain pattern ${patternId} in scanner source`, () => {
      expect(scannerSource).toContain(`"${patternId}"`);
    });
  }

  it('should have exactly 8 SEC-NNN pattern IDs', () => {
    const matches = scannerSource.match(/"SEC-\d{3}"/g) ?? [];
    // Unique IDs only (patterns appear in both definition and tests)
    const uniqueIds = new Set(matches.map((m) => m.replace(/"/g, '')));
    expect(uniqueIds.size).toBe(8);
  });
});

// ============================================================================
// Test fixture directories exist
// ============================================================================

describe('SecurityScanner Fixture Directories', () => {
  const expectedFixtures = [
    'clean-mission-pack',
    'sec-001-hook-override',
    'sec-002-api-redirect',
    'sec-002-allow-anthropic',
    'sec-003-hook-injection',
    'sec-005-sandbox-escape',
    'sec-006-ssh-key-ref',
    'sec-007-credential-exfil',
    'sec-008-base64-obfuscation',
    'mixed-high-only',
    'mixed-critical-plus-high',
  ];

  it('should have fixture root directory', () => {
    expect(existsSync(FIXTURES_DIR)).toBe(true);
  });

  for (const fixture of expectedFixtures) {
    it(`should have fixture directory: ${fixture}`, () => {
      expect(existsSync(join(FIXTURES_DIR, fixture))).toBe(true);
    });
  }
});

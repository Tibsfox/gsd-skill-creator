/**
 * Filesystem initialization tests for .planning/security/ directory.
 *
 * Validates that securityInitCommand creates the correct directory
 * structure, template files, README, and schemas.json with proper
 * permissions and idempotent behavior.
 *
 * TDD RED phase: These tests import from src/commands/security-init.ts
 * which does not yet exist -- all tests must FAIL on first run.
 *
 * @module tests/security-fs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  securityInitCommand,
  initSecurityDirectory,
} from '../src/commands/security-init.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-fs-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

/** Resolve a path relative to the temp project root's .planning/security/ */
function secPath(...parts: string[]): string {
  return path.join(tmpDir, '.planning', 'security', ...parts);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('securityInitCommand', () => {
  it('creates .planning/security/ directory', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath());
    expect(stat.isDirectory()).toBe(true);
  });

  it('creates events/ subdirectory', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath('events'));
    expect(stat.isDirectory()).toBe(true);
  });

  it('creates blocked/ subdirectory', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath('blocked'));
    expect(stat.isDirectory()).toBe(true);
  });

  it('creates README.md with content', async () => {
    await securityInitCommand(tmpDir);
    const content = await fs.readFile(secPath('README.md'), 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('README contains JSONL keyword', async () => {
    await securityInitCommand(tmpDir);
    const content = await fs.readFile(secPath('README.md'), 'utf-8');
    expect(content).toContain('JSONL');
  });

  it('README contains Append-only keyword', async () => {
    await securityInitCommand(tmpDir);
    const content = await fs.readFile(secPath('README.md'), 'utf-8');
    expect(content).toContain('Append-only');
  });

  it('README has at least 30 lines', async () => {
    await securityInitCommand(tmpDir);
    const content = await fs.readFile(secPath('README.md'), 'utf-8');
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(30);
  });

  it('creates schemas.json that is valid JSON', async () => {
    await securityInitCommand(tmpDir);
    const raw = await fs.readFile(secPath('schemas.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
  });

  it('schemas.json contains 6 schema definitions', async () => {
    await securityInitCommand(tmpDir);
    const raw = await fs.readFile(secPath('schemas.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    // Should have definitions for: SecurityEvent, SandboxProfile,
    // ProxyConfig, DomainCredential, AgentIsolationState, BlockedRequest
    const defs = parsed.definitions ?? parsed.$defs ?? parsed;
    expect(Object.keys(defs).length).toBeGreaterThanOrEqual(6);
  });

  it('creates sandbox-profile.json template as valid JSON', async () => {
    await securityInitCommand(tmpDir);
    const raw = await fs.readFile(secPath('sandbox-profile.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
  });

  it('creates proxy-config.json template as valid JSON', async () => {
    await securityInitCommand(tmpDir);
    const raw = await fs.readFile(secPath('proxy-config.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
  });

  it('creates domain-allowlist.json template as valid JSON', async () => {
    await securityInitCommand(tmpDir);
    const raw = await fs.readFile(secPath('domain-allowlist.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
    // Should contain default domains
    expect(parsed.allowed_domains).toContain('api.anthropic.com');
    expect(parsed.allowed_domains).toContain('github.com');
    expect(parsed.allowed_domains).toContain('registry.npmjs.org');
  });

  it('sets directory permissions to 0700', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath());
    // Check owner-only permission (0700 = rwx------)
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o700);
  });

  it('sets events/ directory permissions to 0700', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath('events'));
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o700);
  });

  it('sets blocked/ directory permissions to 0700', async () => {
    await securityInitCommand(tmpDir);
    const stat = await fs.stat(secPath('blocked'));
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o700);
  });

  it('is idempotent — running twice does not throw', async () => {
    await securityInitCommand(tmpDir);
    // Second call should succeed without errors
    await expect(securityInitCommand(tmpDir)).resolves.not.toThrow();
  });

  it('is idempotent — running twice preserves existing files', async () => {
    await securityInitCommand(tmpDir);
    const readmeBefore = await fs.readFile(secPath('README.md'), 'utf-8');
    await securityInitCommand(tmpDir);
    const readmeAfter = await fs.readFile(secPath('README.md'), 'utf-8');
    // Should not overwrite existing files
    expect(readmeAfter).toBe(readmeBefore);
  });

  it('all JSON template files parse without error', async () => {
    await securityInitCommand(tmpDir);
    const jsonFiles = [
      'sandbox-profile.json',
      'proxy-config.json',
      'domain-allowlist.json',
      'schemas.json',
    ];
    for (const file of jsonFiles) {
      const raw = await fs.readFile(secPath(file), 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
});

describe('initSecurityDirectory', () => {
  it('is exported as a named function', () => {
    expect(typeof initSecurityDirectory).toBe('function');
  });

  it('creates the same directory structure as securityInitCommand', async () => {
    await initSecurityDirectory(tmpDir);
    const stat = await fs.stat(secPath());
    expect(stat.isDirectory()).toBe(true);
    const eventsStat = await fs.stat(secPath('events'));
    expect(eventsStat.isDirectory()).toBe(true);
    const blockedStat = await fs.stat(secPath('blocked'));
    expect(blockedStat.isDirectory()).toBe(true);
  });
});

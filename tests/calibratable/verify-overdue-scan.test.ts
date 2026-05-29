/**
 * Test surface for tools/calibratable/verify-overdue-scan.mjs (v1.49.882).
 *
 * Verifies the tool's behavior:
 *   1. Runs clean against the current manifest.
 *   2. Emits structured JSON via --json.
 *   3. Exit code 0 when all wired thresholds within verify-axis budget.
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..');
const TOOL = resolve(REPO_ROOT, 'tools', 'calibratable', 'verify-overdue-scan.mjs');

describe('verify-overdue-scan tool (v1.49.882)', () => {
  it('exits clean (code 0) against the current manifest + version', () => {
    const result = spawnSync('node', [TOOL], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('verify-overdue-scan @ v');
    expect(result.stdout).toMatch(/✓ All wired thresholds within verify-axis budget\./);
  });

  it('emits structured JSON via --json', () => {
    const result = spawnSync('node', [TOOL, '--json'], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.clean).toBe(true);
    expect(parsed.overdue_count).toBe(0);
    expect(parsed.threshold_count).toBeGreaterThan(0);
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(parsed.current_version).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('reports per-threshold status with required fields', () => {
    const result = spawnSync('node', [TOOL, '--json'], { cwd: REPO_ROOT, encoding: 'utf8' });
    const parsed = JSON.parse(result.stdout);
    for (const entry of parsed.results) {
      expect(entry.threshold).toBeDefined();
      expect(entry.status).toMatch(/^(COVERED|PENDING-TEST|OVERDUE-NO-TEST|OVERDUE-TEST-LATE|UNWIRED)$/);
    }
  });
});

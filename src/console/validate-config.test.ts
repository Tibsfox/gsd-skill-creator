/**
 * Integration tests for validate-config.sh bash script.
 *
 * Covers PICKUP-04 (config validation against schema):
 * - Exits 0 when milestone-config.json is valid
 * - Outputs "valid" on stdout when config is valid
 * - Exits 1 when milestone-config.json is missing
 * - Exits 1 when milestone-config.json is malformed JSON
 * - Exits 1 when milestone.name is missing
 * - Exits 1 when milestone.submitted_at is missing
 * - Error output includes descriptive message on failure
 * - Exits 0 when config has all sections
 *
 * @module console/validate-config.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the validate-config.sh script. */
const scriptPath = join(__dirname, '..', '..', 'scripts', 'console', 'validate-config.sh');

/** Run validate-config.sh with a given base path and return exit code + output. */
function runValidateConfig(
  basePath: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      scriptPath,
      [basePath],
      { timeout: 5000 },
      (error, stdout, stderr) => {
        resolve({
          code: error ? 1 : 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      },
    );
  });
}

/** Create the config directory structure under a temp dir. */
function createConfigDir(basePath: string): string {
  const configDir = join(basePath, '.planning', 'console', 'config');
  mkdirSync(configDir, { recursive: true });
  return configDir;
}

/** A minimal valid milestone config. */
const validMinimalConfig = {
  milestone: {
    name: 'v2.0',
    submitted_at: '2026-02-13T14:00:00Z',
    submitted_by: 'dashboard',
  },
};

/** A complete valid milestone config with all sections. */
const validFullConfig = {
  milestone: {
    name: 'v2.0',
    source_document: 'spec.md',
    submitted_at: '2026-02-13T14:00:00Z',
    submitted_by: 'dashboard',
  },
  execution: {
    mode: 'supervised',
    yolo: false,
    pause_points: {
      after_planning: true,
      after_each_phase: true,
      after_verification: true,
    },
  },
  research: {
    enabled: true,
    web_search: false,
    max_research_time_minutes: 30,
    skip_if_vision_sufficient: true,
  },
  planning: {
    auto_approve: false,
    review_granularity: 'phase',
    max_plans_per_phase: 10,
    require_tdd: true,
  },
  verification: {
    run_tests: true,
    type_check: true,
    lint: true,
    block_on_failure: true,
    coverage_threshold: 80,
  },
  resources: {
    token_budget_pct: 50,
    max_phases: 20,
    max_wall_time_minutes: 480,
    model_preference: 'quality',
  },
  notifications: {
    on_phase_complete: true,
    on_question: true,
    on_error: true,
    on_milestone_complete: true,
  },
};

// ============================================================================
// Test suite
// ============================================================================

describe('validate-config.sh', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'validate-config-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // 1. Exits 0 when milestone-config.json is valid
  // --------------------------------------------------------------------------

  it('exits 0 when milestone-config.json is valid', async () => {
    const configDir = createConfigDir(tmpDir);
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(validMinimalConfig, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 2. Outputs "valid" on stdout when config is valid
  // --------------------------------------------------------------------------

  it('outputs "valid" on stdout when config is valid', async () => {
    const configDir = createConfigDir(tmpDir);
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(validMinimalConfig, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.stdout.trim()).toBe('valid');
  });

  // --------------------------------------------------------------------------
  // 3. Exits 1 when milestone-config.json is missing
  // --------------------------------------------------------------------------

  it('exits 1 when milestone-config.json is missing', async () => {
    // Config dir exists but no file
    createConfigDir(tmpDir);

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 4. Exits 1 when milestone-config.json is malformed JSON
  // --------------------------------------------------------------------------

  it('exits 1 when milestone-config.json is malformed JSON', async () => {
    const configDir = createConfigDir(tmpDir);
    writeFileSync(join(configDir, 'milestone-config.json'), '{not valid json!!!}');

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 5. Exits 1 when milestone.name is missing from config
  // --------------------------------------------------------------------------

  it('exits 1 when milestone.name is missing', async () => {
    const configDir = createConfigDir(tmpDir);
    const configMissingName = {
      milestone: {
        submitted_at: '2026-02-13T14:00:00Z',
        submitted_by: 'dashboard',
      },
    };
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(configMissingName, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 6. Exits 1 when milestone.submitted_at is missing from config
  // --------------------------------------------------------------------------

  it('exits 1 when milestone.submitted_at is missing', async () => {
    const configDir = createConfigDir(tmpDir);
    const configMissingTimestamp = {
      milestone: {
        name: 'v2.0',
        submitted_by: 'dashboard',
      },
    };
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(configMissingTimestamp, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 7. Error output includes descriptive message on failure
  // --------------------------------------------------------------------------

  it('error output includes descriptive message on failure', async () => {
    const configDir = createConfigDir(tmpDir);
    const configMissingName = {
      milestone: {
        submitted_at: '2026-02-13T14:00:00Z',
        submitted_by: 'dashboard',
      },
    };
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(configMissingName, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(1);
    // Should have some descriptive output (stderr or stdout)
    const allOutput = result.stderr + result.stdout;
    expect(allOutput.length).toBeGreaterThan(0);
    expect(allOutput.toLowerCase()).toContain('name');
  });

  // --------------------------------------------------------------------------
  // 8. Exits 0 when config has all sections
  // --------------------------------------------------------------------------

  it('exits 0 when config has all sections', async () => {
    const configDir = createConfigDir(tmpDir);
    writeFileSync(
      join(configDir, 'milestone-config.json'),
      JSON.stringify(validFullConfig, null, 2),
    );

    const result = await runValidateConfig(tmpDir);
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe('valid');
  });
});

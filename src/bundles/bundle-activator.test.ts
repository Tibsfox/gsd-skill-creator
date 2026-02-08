/**
 * Tests for BundleActivator with WorkState integration.
 *
 * Covers:
 * - activate() writes active_bundle field to WorkState file via .passthrough()
 * - activate() with non-existent bundle YAML returns error result
 * - deactivate() sets active_bundle to null in WorkState
 * - getActiveBundle() reads active_bundle from WorkState (returns string | null)
 * - getActiveBundle() returns null when WorkState has no active_bundle field
 * - getActiveBundle() returns null when WorkState file doesn't exist
 * - getBundlePriorities() returns skills with required=true at priority 10, optional at 1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BundleActivator } from './bundle-activator.js';

// ============================================================================
// Test setup
// ============================================================================

let testDir: string;
let bundleDir: string;
let workStateFile: string;

beforeEach(async () => {
  testDir = join(
    tmpdir(),
    `gsd-bundle-activator-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  bundleDir = join(testDir, '.claude', 'bundles');
  workStateFile = join(testDir, '.planning', 'hooks', 'current-work.yaml');
  await mkdir(bundleDir, { recursive: true });
  await mkdir(join(testDir, '.planning', 'hooks'), { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ============================================================================
// Helper: write a bundle YAML file
// ============================================================================

async function writeBundleYaml(name: string, skills: Array<{ name: string; required?: boolean }>): Promise<void> {
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  const content = (yaml as any).dump({
    name,
    skills: skills.map((s) => ({ name: s.name, required: s.required ?? true })),
  });
  await writeFile(join(bundleDir, `${name}.bundle.yaml`), content, 'utf-8');
}

// ============================================================================
// Helper: write a WorkState YAML file
// ============================================================================

async function writeWorkState(state: Record<string, unknown>): Promise<void> {
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  const content = (yaml as any).dump(state);
  await writeFile(workStateFile, content, 'utf-8');
}

// ============================================================================
// activate()
// ============================================================================

describe('BundleActivator.activate', () => {
  it('writes active_bundle field to WorkState file', async () => {
    await writeBundleYaml('frontend-dev', [{ name: 'ts' }, { name: 'react' }]);
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const result = await activator.activate('frontend-dev');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify the file was updated with active_bundle
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = await readFile(workStateFile, 'utf-8');
    const state = (yaml as any).load(content) as Record<string, unknown>;
    expect(state.active_bundle).toBe('frontend-dev');
    expect(state.version).toBe(1);
  });

  it('creates WorkState file if it does not exist', async () => {
    await writeBundleYaml('frontend-dev', [{ name: 'ts' }]);
    // Do NOT create workStateFile

    const activator = new BundleActivator(bundleDir, workStateFile);
    const result = await activator.activate('frontend-dev');

    expect(result.success).toBe(true);

    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = await readFile(workStateFile, 'utf-8');
    const state = (yaml as any).load(content) as Record<string, unknown>;
    expect(state.active_bundle).toBe('frontend-dev');
  });

  it('returns error for non-existent bundle YAML', async () => {
    const activator = new BundleActivator(bundleDir, workStateFile);
    const result = await activator.activate('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('nonexistent');
  });
});

// ============================================================================
// deactivate()
// ============================================================================

describe('BundleActivator.deactivate', () => {
  it('sets active_bundle to null in WorkState', async () => {
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'frontend-dev',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const result = await activator.deactivate();

    expect(result.success).toBe(true);

    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = await readFile(workStateFile, 'utf-8');
    const state = (yaml as any).load(content) as Record<string, unknown>;
    expect(state.active_bundle).toBeNull();
  });
});

// ============================================================================
// getActiveBundle()
// ============================================================================

describe('BundleActivator.getActiveBundle', () => {
  it('reads active_bundle from WorkState', async () => {
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'frontend-dev',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const active = await activator.getActiveBundle();
    expect(active).toBe('frontend-dev');
  });

  it('returns null when WorkState has no active_bundle field', async () => {
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const active = await activator.getActiveBundle();
    expect(active).toBeNull();
  });

  it('returns null when WorkState file does not exist', async () => {
    const activator = new BundleActivator(bundleDir, workStateFile);
    const active = await activator.getActiveBundle();
    expect(active).toBeNull();
  });
});

// ============================================================================
// getBundlePriorities()
// ============================================================================

describe('BundleActivator.getBundlePriorities', () => {
  it('returns required skills at priority 10, optional at priority 1', async () => {
    await writeBundleYaml('mixed-bundle', [
      { name: 'ts', required: true },
      { name: 'docs', required: false },
      { name: 'react', required: true },
    ]);
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'mixed-bundle',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const priorities = await activator.getBundlePriorities();

    expect(priorities).toHaveLength(3);
    expect(priorities).toContainEqual({ name: 'ts', priority: 10 });
    expect(priorities).toContainEqual({ name: 'docs', priority: 1 });
    expect(priorities).toContainEqual({ name: 'react', priority: 10 });
  });

  it('returns empty array when no active bundle', async () => {
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
    });

    const activator = new BundleActivator(bundleDir, workStateFile);
    const priorities = await activator.getBundlePriorities();
    expect(priorities).toEqual([]);
  });

  it('returns empty array when WorkState file does not exist', async () => {
    const activator = new BundleActivator(bundleDir, workStateFile);
    const priorities = await activator.getBundlePriorities();
    expect(priorities).toEqual([]);
  });
});

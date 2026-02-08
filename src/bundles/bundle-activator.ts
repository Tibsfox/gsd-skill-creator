/**
 * Activate/deactivate work bundles via WorkState integration.
 *
 * The BundleActivator manages the active_bundle field in the WorkState
 * YAML file, using .passthrough() to preserve unknown fields. It reads
 * bundle definitions from .bundle.yaml files and maps skill priorities:
 * - required=true -> priority 10
 * - required=false -> priority 1
 *
 * This matches SkillSession.load() priority parameter for token budget.
 */

import { join } from 'node:path';
import { parseBundleFile } from './bundle-parser.js';

/**
 * Manages bundle activation state via WorkState YAML file.
 *
 * Reads/writes active_bundle as a passthrough field on WorkState,
 * enabling bundle-aware skill loading without schema changes.
 */
export class BundleActivator {
  constructor(
    private bundleDir: string,
    private workStateFile: string,
  ) {}

  /**
   * Activate a bundle by name.
   *
   * Validates the bundle YAML exists, then writes active_bundle to WorkState.
   * Creates WorkState file if it doesn't exist.
   */
  async activate(bundleName: string): Promise<{ success: boolean; error?: string }> {
    // Validate bundle exists
    const bundlePath = join(this.bundleDir, `${bundleName}.bundle.yaml`);
    const bundle = await parseBundleFile(bundlePath);
    if (!bundle) {
      return { success: false, error: `Bundle not found: ${bundleName}` };
    }

    // Read existing WorkState or create minimal state
    const state = await this.readRawState();
    state.active_bundle = bundleName;

    await this.writeRawState(state);
    return { success: true };
  }

  /**
   * Deactivate the current bundle.
   *
   * Sets active_bundle to null in WorkState.
   */
  async deactivate(): Promise<{ success: boolean; error?: string }> {
    const state = await this.readRawState();
    state.active_bundle = null;

    await this.writeRawState(state);
    return { success: true };
  }

  /**
   * Get the name of the currently active bundle.
   *
   * @returns Bundle name string, or null if no bundle is active
   */
  async getActiveBundle(): Promise<string | null> {
    const state = await this.readRawState();
    const active = state.active_bundle;
    return typeof active === 'string' ? active : null;
  }

  /**
   * Get skill priorities from the active bundle.
   *
   * Required skills get priority 10, optional skills get priority 1.
   * Returns empty array if no bundle is active.
   */
  async getBundlePriorities(): Promise<Array<{ name: string; priority: number }>> {
    const bundleName = await this.getActiveBundle();
    if (!bundleName) return [];

    const bundlePath = join(this.bundleDir, `${bundleName}.bundle.yaml`);
    const bundle = await parseBundleFile(bundlePath);
    if (!bundle) return [];

    return bundle.skills.map((skill) => ({
      name: skill.name,
      priority: skill.required ? 10 : 1,
    }));
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Read raw WorkState YAML as a plain object.
   *
   * Returns a minimal state object if file doesn't exist or is invalid.
   * Preserves all fields including passthrough fields like active_bundle.
   */
  private async readRawState(): Promise<Record<string, unknown>> {
    try {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(this.workStateFile, 'utf-8');
      if (!content || !content.trim()) {
        return this.minimalState();
      }

      const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
      const raw = (yaml as any).load(content, { schema: (yaml as any).JSON_SCHEMA });
      if (!raw || typeof raw !== 'object') {
        return this.minimalState();
      }
      return raw as Record<string, unknown>;
    } catch {
      return this.minimalState();
    }
  }

  /**
   * Write raw state object back to WorkState YAML file.
   *
   * Creates parent directories if needed.
   */
  private async writeRawState(state: Record<string, unknown>): Promise<void> {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));

    await mkdir(dirname(this.workStateFile), { recursive: true });
    const content = (yaml as any).dump(state, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: true,
    });
    await writeFile(this.workStateFile, content, 'utf-8');
  }

  /**
   * Create a minimal WorkState-compatible object.
   */
  private minimalState(): Record<string, unknown> {
    return {
      version: 1,
      saved_at: new Date().toISOString(),
    };
  }
}

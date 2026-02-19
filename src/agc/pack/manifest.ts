/**
 * AGC pack manifest with install/remove lifecycle.
 *
 * Declares the AGC educational module as a standalone GSD-OS pack.
 * The manifest defines the module boundary: all blocks, widgets, and
 * skills that comprise the AGC pack. Install/remove is config-driven
 * via the chipset YAML -- presence of agc-educational.yaml activates
 * the module; absence deactivates it.
 *
 * @module agc/pack/manifest
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PackManifest, BlockDefinition, WidgetDefinition } from './types.js';

// ============================================================================
// Pack manifest
// ============================================================================

/**
 * The AGC educational pack manifest.
 *
 * blocks and widgets are initially empty arrays -- they are populated
 * by the barrel index (Plan 04) which imports from block-definitions
 * and widgets modules respectively.
 */
export const AGC_PACK_MANIFEST: PackManifest = {
  name: 'agc-educational',
  version: '1.0.0',
  description: 'Apollo Guidance Computer educational simulation pack for GSD-OS',
  blocks: [],
  widgets: [],
  skills: [
    'agc-architecture-reference',
    'agc-executive-guide',
    'agc-assembler',
    'agc-debugger',
    'agc-dsky-commands',
  ],
  standalone: true,
};

// ============================================================================
// Lifecycle queries
// ============================================================================

/**
 * Check whether the AGC pack is installed (activated) in a chipset directory.
 *
 * The pack is considered installed if `agc-educational.yaml` exists in
 * the given chipset directory.
 *
 * @param chipsetDir - Path to the chipset directory (e.g. '.chipset/').
 * @returns true if the pack's chipset YAML exists, false otherwise.
 */
export function isPackInstalled(chipsetDir: string): boolean {
  return existsSync(join(chipsetDir, 'agc-educational.yaml'));
}

/**
 * Get the block definitions from the pack manifest.
 *
 * @returns The readonly array of block definitions.
 */
export function getPackBlocks(): readonly BlockDefinition[] {
  return AGC_PACK_MANIFEST.blocks;
}

/**
 * Get the widget definitions from the pack manifest.
 *
 * @returns The readonly array of widget definitions.
 */
export function getPackWidgets(): readonly WidgetDefinition[] {
  return AGC_PACK_MANIFEST.widgets;
}

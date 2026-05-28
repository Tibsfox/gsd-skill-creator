/**
 * Extension detector for gsd-skill-creator.
 *
 * Probes for gsd-skill-creator installation and returns typed
 * capability flags. Uses a two-strategy approach:
 * 1. CLI binary check (highest priority)
 * 2. dist/ directory check (fallback)
 *
 * Supports DI overrides for testing without real installation.
 *
 * ProcessContext wire (v1.49.850): `ensureProcessAllowed` hoisted inside
 * the no-override branch (Strategy 1) BEFORE the try/catch per Lesson
 * #10427. Detection is a forensic accessory (returns null capabilities on
 * any spawn failure) — but security denials are load-bearing and must
 * propagate. `ProcessContextDenied` throws to the caller; CLI-not-found +
 * timeout failures continue to fall through to Strategy 2 silently.
 */

import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ensureProcessAllowed,
  type ProcessContext,
} from '../../security/process-context.js';
import { ExtensionCapabilitiesSchema } from './types.js';
import type { ExtensionCapabilities, DetectionOverrides } from './types.js';

/**
 * Build a full capabilities object for a detected extension.
 *
 * All features are enabled when gsd-skill-creator is detected,
 * regardless of detection method.
 *
 * @param method - Detection method that succeeded
 * @param version - Version string (null if not available)
 * @returns Validated ExtensionCapabilities
 */
function buildCapabilities(
  method: 'cli-binary' | 'dist-directory',
  version: string | null,
): ExtensionCapabilities {
  return ExtensionCapabilitiesSchema.parse({
    detected: true,
    detectionMethod: method,
    version,
    features: {
      semanticClassification: true,
      enhancedDiscovery: true,
      enhancedLifecycle: true,
      customSkillCreation: true,
    },
  });
}

/**
 * Detect gsd-skill-creator installation and return capabilities.
 *
 * Uses a two-strategy approach:
 * 1. CLI binary check (highest priority)
 * 2. dist/ directory check (fallback)
 *
 * When DI overrides are provided, bypasses real filesystem/CLI probing.
 * When no overrides are provided, probes the real environment.
 *
 * @param overrides - Optional DI overrides for testing
 * @returns Extension capabilities with feature flags
 */
export async function detectExtension(
  overrides?: DetectionOverrides,
  ctx?: ProcessContext,
): Promise<ExtensionCapabilities> {
  // Strategy 1: CLI binary check
  if (overrides?.cliAvailable !== undefined) {
    if (overrides.cliAvailable) {
      return buildCapabilities('cli-binary', overrides.cliVersion ?? null);
    }
    // Explicitly false -- skip to Strategy 2
  } else {
    // No override -- try real CLI binary.
    // Security: hoisted ensureProcessAllowed propagates ProcessContextDenied
    // even though the try below swallows CLI-not-found / timeout silently.
    ensureProcessAllowed(
      ctx,
      'orchestrator/extension/extension-detector',
      'exec',
      'skill-creator',
      ['--version'],
    );
    try {
      const output = execSync('skill-creator --version 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      const match = output.match(/v?(\d+\.\d+\.\d+)/);
      return buildCapabilities('cli-binary', match ? match[1] : null);
    } catch {
      // CLI not available -- continue to Strategy 2
    }
  }

  // Strategy 2: dist/ directory check
  const distPath = overrides?.distPath ?? join(
    process.cwd(),
    'node_modules',
    'gsd-skill-creator',
    'dist',
  );

  try {
    await access(distPath);
    return buildCapabilities('dist-directory', null);
  } catch {
    // dist/ not found
  }

  // Not detected
  return createNullCapabilities();
}

/**
 * Create a null capabilities object with all features disabled.
 *
 * Used as the default when gsd-skill-creator is not detected,
 * providing a zero-error degradation path.
 *
 * @returns ExtensionCapabilities with detected=false and all features disabled
 */
export function createNullCapabilities(): ExtensionCapabilities {
  return ExtensionCapabilitiesSchema.parse({
    detected: false,
    detectionMethod: 'none',
    version: null,
    features: {
      semanticClassification: false,
      enhancedDiscovery: false,
      enhancedLifecycle: false,
      customSkillCreation: false,
    },
  });
}

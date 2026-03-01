/**
 * Gate template loader for milestone-type-specific gate configurations.
 *
 * Provides three pre-built gate templates (pedagogical, implementation,
 * validation) that milestone authors can adopt without writing gate
 * definitions from scratch.
 *
 * All templates include a SUMMARY.md verification gate (RCFX-05 / RC-11 fix).
 *
 * @module autonomy/gate-templates
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGateConfig } from './gate-loader.js';
import type { GateLoadResult } from './gate-loader.js';

// ============================================================================
// Template names
// ============================================================================

/**
 * Available gate template names, corresponding to milestone types.
 */
export const GATE_TEMPLATE_NAMES = ['pedagogical', 'implementation', 'validation'] as const;

/**
 * Type for valid gate template names.
 */
export type GateTemplateName = (typeof GATE_TEMPLATE_NAMES)[number];

// ============================================================================
// Project root resolution
// ============================================================================

/**
 * Resolves the project root directory by walking up from this module's location.
 *
 * This module is at src/services/autonomy/gate-templates.ts, so the project
 * root is 4 levels up (src -> services -> autonomy -> gate-templates.ts).
 */
function getProjectRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // src/services/autonomy/ -> src/services/ -> src/ -> project root
  return resolve(__dirname, '..', '..', '..');
}

// ============================================================================
// loadGateTemplate
// ============================================================================

/**
 * Loads a gate template by name from data/gate-templates/.
 *
 * Reads the YAML file, parses it, and validates against GateConfigSchema.
 * Returns a GateLoadResult with the validated config or error messages.
 *
 * @param templateName - One of 'pedagogical', 'implementation', 'validation'
 * @returns Promise<GateLoadResult> with validated gate config or errors
 */
export async function loadGateTemplate(templateName: string): Promise<GateLoadResult> {
  // Validate template name
  if (!GATE_TEMPLATE_NAMES.includes(templateName as GateTemplateName)) {
    return {
      success: false,
      errors: [
        `Unknown gate template '${templateName}' — valid templates are: ${GATE_TEMPLATE_NAMES.join(', ')}`,
      ],
    };
  }

  const projectRoot = getProjectRoot();
  const templatePath = resolve(projectRoot, 'data', 'gate-templates', `${templateName}.yaml`);

  let content: string;
  try {
    content = await readFile(templatePath, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [`Failed to read gate template '${templateName}' at ${templatePath}: ${message}`],
    };
  }

  return loadGateConfig(content);
}

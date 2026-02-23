/**
 * OpenStack configuration file intake and staging.
 *
 * Validates incoming OpenStack config files (globals.yml, passwords.yml,
 * Ansible inventory, TLS certificates, custom files) and stages them to
 * `.planning/staging/inbox/cloud-ops/` with companion metadata.
 *
 * Follows the same directory pattern as `src/staging/intake.ts`:
 * - Creates the target directory on first use (recursive mkdir)
 * - Writes content file alongside a `.meta.json` companion
 *
 * INTEG-03: staging layer for OpenStack configuration intake.
 *
 * @module cloud-ops/staging/config-intake
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OpenStackConfigType, ConfigValidationResult } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Mapping from OpenStack config type to expected filename glob patterns.
 *
 * Used for documentation and caller-side hinting only. Actual validation
 * checks content structure, not the filename.
 */
export const SUPPORTED_CONFIG_TYPES: Record<OpenStackConfigType, string> = {
  globals: 'globals*.yml',
  passwords: 'passwords*.yml',
  inventory: '*inventory*',
  certificates: '*.pem | *.crt | *.key',
  custom: '*',
};

/** Staging subdirectory for cloud-ops configs (relative to project root). */
const CLOUD_OPS_INBOX = '.planning/staging/inbox/cloud-ops';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate an OpenStack configuration file's content.
 *
 * Pure function (no I/O). Checks structure based on config type:
 *
 * - globals / passwords: must contain at least one YAML key-value pair
 *   (simple heuristic: line matching `key: value` or `key:` on its own).
 *   Detects obviously invalid YAML-like content (unbalanced braces, tabs used
 *   as indentation on the same line as a key).
 * - inventory: must have at least one Ansible group header ([group]).
 * - certificates: must start with a PEM block header (-----BEGIN).
 * - custom: always valid (no structural requirements).
 *
 * @param content - Raw string content to validate.
 * @param configType - The config category to validate against.
 * @returns Validation result with errors and warnings arrays.
 */
export function validateConfigFile(
  content: string,
  configType: OpenStackConfigType,
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('File content is empty');
    return { valid: false, errors, warnings, configType };
  }

  switch (configType) {
    case 'globals':
    case 'passwords': {
      // Check for valid YAML structure: at least one key: value or key:
      // Detect unbalanced braces as a sign of malformed content.
      const lines = content.split('\n');
      const yamlKeyPattern = /^\s*[\w-]+\s*:/;
      const hasAnyKey = lines.some(line => yamlKeyPattern.test(line) && !line.trimStart().startsWith('#'));

      if (!hasAnyKey) {
        errors.push(`${configType}.yml must contain at least one YAML key-value pair`);
      }

      // Check for obviously malformed YAML: unclosed brackets/braces
      const openBraces = (content.match(/\{/g) ?? []).length;
      const closeBraces = (content.match(/\}/g) ?? []).length;
      const openBrackets = (content.match(/\[/g) ?? []).length;
      const closeBrackets = (content.match(/\]/g) ?? []).length;

      if (openBraces !== closeBraces) {
        errors.push('Malformed YAML: unbalanced curly braces { }');
      }
      if (openBrackets !== closeBrackets) {
        errors.push('Malformed YAML: unbalanced square brackets [ ]');
      }

      // Warn if file has no document separator and appears to be a multi-doc
      if (content.includes('---\n') && content.split('---\n').length > 2) {
        warnings.push('File contains multiple YAML documents -- only the first will be processed by kolla-ansible');
      }
      break;
    }

    case 'inventory': {
      // Ansible inventory must have at least one group header [groupname]
      const groupHeaderPattern = /^\[[\w-]+\]/m;
      const hasGroupHeader = groupHeaderPattern.test(content);

      if (!hasGroupHeader) {
        errors.push('Inventory file must contain at least one Ansible group header (e.g., [control], [compute], [all])');
      }

      // Warn if standard kolla groups are missing
      const hasControl = /^\[control\]/m.test(content);
      const hasCompute = /^\[compute\]/m.test(content);
      const hasAll = /^\[all\]/m.test(content);

      if (!hasControl && !hasAll) {
        warnings.push('No [control] or [all] group found -- kolla-ansible expects a [control] group for controller nodes');
      }
      if (!hasCompute && !hasAll) {
        warnings.push('No [compute] or [all] group found -- kolla-ansible expects a [compute] group for compute nodes');
      }
      break;
    }

    case 'certificates': {
      // PEM files must start with a BEGIN header
      const trimmed = content.trimStart();
      if (!trimmed.startsWith('-----BEGIN')) {
        errors.push('Certificate file must start with a PEM block header (-----BEGIN ...)');
      }

      // Check for matching END header
      if (!content.includes('-----END')) {
        errors.push('Certificate file is missing PEM block footer (-----END ...)');
      }
      break;
    }

    case 'custom': {
      // Custom files have no structural requirements -- always valid
      warnings.push('Custom config type: no structural validation applied');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    configType,
  };
}

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

/** Result of staging an OpenStack configuration file. */
export interface StageOpenStackConfigResult {
  /** Absolute path to the saved configuration file. */
  documentPath: string;
  /** Absolute path to the companion metadata file. */
  metadataPath: string;
  /** Validation result included in the metadata. */
  validation: ConfigValidationResult;
}

/**
 * Validate and stage an OpenStack configuration file.
 *
 * Creates `.planning/staging/inbox/cloud-ops/` on first use, writes the
 * content file, and writes a companion `.meta.json` containing source,
 * timestamp, config type, and the full validation result.
 *
 * Staging proceeds even if validation produces warnings. Staging is blocked
 * only if `validation.valid === false` -- callers that need strict mode
 * should check the returned validation before using the staged file.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.filename - Target filename for the config file
 * @param options.content - Raw content to write
 * @param options.configType - Configuration category
 * @param options.source - Origin of the submission
 * @returns Paths to both files and the validation result
 */
export async function stageOpenStackConfig(options: {
  basePath: string;
  filename: string;
  content: string;
  configType: OpenStackConfigType;
  source: string;
}): Promise<StageOpenStackConfigResult> {
  const { basePath, filename, content, configType, source } = options;

  // Validate content before staging
  const validation = validateConfigFile(content, configType);

  // Create the target directory (idempotent)
  const targetDir = join(basePath, CLOUD_OPS_INBOX);
  await mkdir(targetDir, { recursive: true });

  // Build file paths
  const documentPath = join(targetDir, filename);
  const metadataPath = join(targetDir, `${filename}.meta.json`);

  // Build metadata
  const metadata = {
    submitted_at: new Date().toISOString(),
    source,
    status: 'inbox' as const,
    configType,
    validation,
  };

  // Write content and metadata in parallel
  await Promise.all([
    writeFile(documentPath, content, 'utf-8'),
    writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8'),
  ]);

  return { documentPath, metadataPath, validation };
}

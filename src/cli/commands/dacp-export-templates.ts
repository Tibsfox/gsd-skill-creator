/**
 * CLI command for exporting DACP bundle templates.
 *
 * Reads template registry and outputs in JSON or YAML format.
 *
 * Three-tier output: text (styled table), quiet (names only), JSON/YAML.
 *
 * @module cli/commands/dacp-export-templates
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';

// ============================================================================
// Help
// ============================================================================

function showDacpExportTemplatesHelp(): void {
  console.log(`
skill-creator dacp export-templates - Export bundle templates

Usage:
  skill-creator dacp export-templates [options]
  skill-creator dp et [options]

Reads the DACP template registry and outputs all templates
in the specified format.

Options:
  --format=json|yaml  Output format (default: json)
  --quiet, -q         Output template names only, one per line
  --help, -h          Show this help

Examples:
  skill-creator dacp export-templates
  skill-creator dacp export-templates --format=yaml
  skill-creator dp et --quiet
`);
}

// ============================================================================
// Types
// ============================================================================

interface BundleTemplate {
  id: string;
  name: string;
  handoff_type: string;
  description: string;
  default_fidelity: number;
  data_schema_refs: string[];
  code_script_refs: string[];
  test_fixture_refs: string[];
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Export DACP bundle templates.
 *
 * @param args - Command-line arguments (after 'dacp export-templates')
 * @returns Exit code (0 success, 1 error)
 */
export async function dacpExportTemplatesCommand(
  args: string[],
): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDacpExportTemplatesHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');

  // Parse --format flag
  let format = 'json';
  const formatArg = args.find((a) => a.startsWith('--format='));
  if (formatArg) {
    format = formatArg.split('=')[1];
  }

  // Read template registry
  const registryPath = join(
    homedir(),
    '.gsd',
    'dacp',
    'templates',
    'registry.json',
  );

  let templates: BundleTemplate[] = [];
  try {
    const content = await readFile(registryPath, 'utf-8');
    templates = JSON.parse(content) as BundleTemplate[];
  } catch {
    // File doesn't exist or is invalid
  }

  // Handle empty registry
  if (!templates || templates.length === 0) {
    if (!quiet) {
      p.log.info('No templates found.');
    }
    return 0;
  }

  // Quiet output: template names only
  if (quiet) {
    for (const template of templates) {
      console.log(template.name);
    }
    return 0;
  }

  // Format output
  if (format === 'yaml') {
    console.log(yaml.dump(templates, { lineWidth: 120 }));
  } else {
    // Default: JSON
    console.log(JSON.stringify(templates, null, 2));
  }

  return 0;
}

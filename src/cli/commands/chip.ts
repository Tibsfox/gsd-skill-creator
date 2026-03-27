/**
 * CLI command for managing chips (model backends).
 *
 * Provides subcommands to inspect and health-check model chips
 * configured via chipset.json:
 *
 *   skill-creator chip status       -- Show chipset.json config and chip status
 *   skill-creator chip health       -- Run health checks on all configured chips
 *   skill-creator chip list         -- List available chips with type/model info
 *   skill-creator chip capabilities -- Show capabilities of each chip
 *
 * All subcommands support --json for machine-readable output.
 * Missing chipset.json is handled gracefully (CHIP-06 backward compat).
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { createChipRegistry } from '../../chips/chip-registry.js';
import type { ChipHealth, ChipCapabilities } from '../../chips/types.js';

// ============================================================================
// Flag Parsing Helpers
// ============================================================================

/**
 * Check if a boolean flag is present.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    (flag) => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`)
  );
}

/**
 * Get non-flag arguments from args array.
 */
function getNonFlagArgs(args: string[]): string[] {
  return args.filter((a) => !a.startsWith('-'));
}

// ============================================================================
// Status subcommand
// ============================================================================

/**
 * Handle 'chip status' -- show chipset.json location, config state, chip list.
 */
async function handleStatus(args: string[]): Promise<number> {
  const jsonMode = hasFlag(args, 'json');

  const registry = createChipRegistry();
  await registry.loadFromFile();

  if (!registry.isConfigured()) {
    if (jsonMode) {
      console.log(JSON.stringify({ configured: false, chips: [] }, null, 2));
    } else {
      p.log.warn('No chipset.json found. Chips are optional.');
      p.log.message('Create chipset.json to configure model backends.');
      p.log.message('');
      p.log.message('Example chipset.json:');
      p.log.message(pc.dim(JSON.stringify({
        version: 1,
        chips: [{
          name: 'ollama',
          type: 'openai-compatible',
          baseUrl: 'http://localhost:11434',
          defaultModel: 'llama3',
        }],
        roles: { executor: 'ollama' },
      }, null, 2)));
    }
    return 0;
  }

  const chipNames = registry.list();

  if (jsonMode) {
    console.log(JSON.stringify({ configured: true, chips: chipNames }, null, 2));
    return 0;
  }

  p.log.success(`Chipset configured: ${chipNames.length} chip(s)`);
  p.log.message('');
  for (const name of chipNames) {
    p.log.message(`  ${pc.cyan(name)}`);
  }

  return 0;
}

// ============================================================================
// Health subcommand
// ============================================================================

/**
 * Handle 'chip health' -- run health checks on all configured chips.
 */
async function handleHealth(args: string[]): Promise<number> {
  const jsonMode = hasFlag(args, 'json');

  const registry = createChipRegistry();
  await registry.loadFromFile();

  if (!registry.isConfigured()) {
    if (jsonMode) {
      console.log(JSON.stringify({ configured: false, health: {} }, null, 2));
    } else {
      p.log.warn('No chipset.json found. Chips are optional. Create chipset.json to configure model backends.');
    }
    return 0;
  }

  const spin = jsonMode ? null : p.spinner();
  spin?.start('Running health checks...');

  const health = await registry.healthCheck();

  spin?.stop('Health checks complete');

  if (jsonMode) {
    console.log(JSON.stringify({ configured: true, health }, null, 2));
    return 0;
  }

  p.log.message('');
  for (const [name, status] of Object.entries(health) as [string, ChipHealth][]) {
    const indicator = status.available ? pc.green('available') : pc.red('unavailable');
    const latency = status.latencyMs !== null ? pc.dim(` ${status.latencyMs}ms`) : '';
    p.log.message(`  ${pc.cyan(name)}: ${indicator}${latency}`);
  }

  return 0;
}

// ============================================================================
// List subcommand
// ============================================================================

/**
 * Handle 'chip list' -- list chips with name, type, defaultModel.
 */
async function handleList(args: string[]): Promise<number> {
  const jsonMode = hasFlag(args, 'json');

  const registry = createChipRegistry();
  await registry.loadFromFile();

  if (!registry.isConfigured()) {
    if (jsonMode) {
      console.log(JSON.stringify({ configured: false, chips: [] }, null, 2));
    } else {
      p.log.warn('No chipset.json found. Chips are optional. Create chipset.json to configure model backends.');
    }
    return 0;
  }

  const chipNames = registry.list();
  const capabilities = await registry.capabilitiesReport();

  if (jsonMode) {
    const chipList = chipNames.map((name) => ({
      name,
      models: capabilities[name]?.models ?? [],
    }));
    console.log(JSON.stringify({ configured: true, chips: chipList }, null, 2));
    return 0;
  }

  p.log.message('');
  p.log.message(`${pc.bold('Configured chips:')} ${chipNames.length}`);
  p.log.message('');
  for (const name of chipNames) {
    const caps = capabilities[name];
    const models = caps?.models?.join(', ') ?? 'unknown';
    p.log.message(`  ${pc.cyan(name)}`);
    p.log.message(`    Models: ${pc.dim(models)}`);
  }

  return 0;
}

// ============================================================================
// Capabilities subcommand
// ============================================================================

/**
 * Handle 'chip capabilities' -- show capabilities of each chip.
 */
async function handleCapabilities(args: string[]): Promise<number> {
  const jsonMode = hasFlag(args, 'json');

  const registry = createChipRegistry();
  await registry.loadFromFile();

  if (!registry.isConfigured()) {
    if (jsonMode) {
      console.log(JSON.stringify({ configured: false, capabilities: {} }, null, 2));
    } else {
      p.log.warn('No chipset.json found. Chips are optional. Create chipset.json to configure model backends.');
    }
    return 0;
  }

  const spin = jsonMode ? null : p.spinner();
  spin?.start('Querying chip capabilities...');

  const report = await registry.capabilitiesReport();

  spin?.stop('Capabilities retrieved');

  if (jsonMode) {
    console.log(JSON.stringify({ configured: true, capabilities: report }, null, 2));
    return 0;
  }

  p.log.message('');
  for (const [name, caps] of Object.entries(report) as [string, ChipCapabilities][]) {
    p.log.message(`  ${pc.cyan(name)}`);
    p.log.message(`    Models:           ${caps.models.join(', ') || 'none'}`);
    p.log.message(`    Max context:      ${caps.maxContextLength.toLocaleString()} tokens`);
    p.log.message(`    Streaming:        ${caps.supportsStreaming ? pc.green('yes') : pc.dim('no')}`);
    p.log.message(`    Tool calling:     ${caps.supportsTools ? pc.green('yes') : pc.dim('no')}`);
    p.log.message('');
  }

  return 0;
}

// ============================================================================
// Help
// ============================================================================

function chipHelp(): string {
  return `
${pc.bold('skill-creator chip')} -- Manage model chip backends

${pc.bold('Usage:')}
  skill-creator chip <subcommand> [options]

${pc.bold('Subcommands:')}
  status          Show chipset.json config and chip list
  health          Run health checks on all configured chips
  list            List available chips with their models
  capabilities    Show capabilities of each chip

${pc.bold('Options:')}
  --json          Output as JSON (machine-readable)

${pc.bold('Examples:')}
  skill-creator chip status
  skill-creator chip health
  skill-creator chip list --json
  skill-creator chip capabilities
`.trim();
}

// ============================================================================
// Main entry point
// ============================================================================

/**
 * Handle 'chip' command with subcommand dispatch.
 *
 * @param args - Arguments after 'chip' (e.g. ['status', '--json'])
 * @returns Exit code (0 = success, 1 = error)
 */
export async function chipCommand(args: string[]): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const subcommand = nonFlagArgs[0];

  // Help flag
  if (hasFlag(args, 'help', 'h') || subcommand === 'help') {
    console.log(chipHelp());
    return 0;
  }

  switch (subcommand) {
    case 'status':
      return handleStatus(args);

    case 'health':
      return handleHealth(args);

    case 'list':
      return handleList(args);

    case 'capabilities':
    case 'caps':
      return handleCapabilities(args);

    case undefined:
    case '':
      // No subcommand: show help
      console.log(chipHelp());
      return 0;

    default:
      p.log.error(`Unknown chip subcommand: ${subcommand}`);
      p.log.message('');
      console.log(chipHelp());
      return 1;
  }
}

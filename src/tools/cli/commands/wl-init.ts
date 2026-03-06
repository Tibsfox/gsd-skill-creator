/**
 * wl config init — Initialize wasteland connection settings.
 *
 * Guides the user from zero to a registered rig with a local Dolt clone.
 * Collects identity, config, and registration SQL through interactive prompts
 * or CLI flags.
 *
 * SEC-03: Without --execute, prints SQL for review and exits. No SQL is sent
 * to Dolt unless --execute is explicitly passed by the user.
 *
 * @module wl-init
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import * as os from 'node:os';
import { saveConfig } from '../../../integrations/wasteland/config.js';
import { createClient } from '../../../integrations/wasteland/dolthub-client.js';
import { sqlEscape, screenForInjection } from '../../../integrations/wasteland/sql-escape.js';
import type { HopConfig } from '../../../integrations/wasteland/config.js';

// ============================================================================
// Help text
// ============================================================================

const HELP_TEXT = `wl config init — Initialize wasteland connection settings

Usage:
  wl config init [options]

Options:
  --handle <handle>       Rig handle (e.g. fox)
  --display-name <name>   Display name
  --email <email>         Email address for DoltHub
  --dolthub-org <org>     DoltHub organization name
  --type <type>           Rig type: human, agent, org (default: human)
  --fork <fork>           Your fork path (e.g. handle/wl-commons)
  --local-dir <path>      Local clone path (e.g. ~/.hop/commons/handle/wl-commons)
  --execute               Apply registration SQL to local clone
  --json                  Output machine-readable JSON
  --help, -h              Show this help

Creates ~/.hop/config.json with wasteland connection settings.
By default, prints SQL for review. Use --execute to apply locally.
`;

// ============================================================================
// Flag helpers
// ============================================================================

/**
 * Return true when any of the named flags appear in the args array.
 * Handles both --flag and -f (first char) forms.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(f => args.includes(`--${f}`) || args.includes(`-${f.charAt(0)}`));
}

/**
 * Return the value following --flag in the args array, or undefined when absent.
 */
function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

// ============================================================================
// Command
// ============================================================================

/**
 * wl config init command — onboard a rig into the wasteland network.
 *
 * Supports two modes:
 * - Interactive: prompts for missing values via @clack/prompts
 * - Flag-driven: all values supplied via CLI flags (skips prompts)
 *
 * SEC-03: Without --execute, prints SQL for review only.
 * With --execute, runs locally via client.execute() (execFile, no shell).
 *
 * @param args    - CLI arguments (flags and values)
 * @param options - Optional overrides for testing (e.g. configDir)
 * @returns Exit code: 0 success, 1 cancelled, 2 execute error
 */
export async function wlInitCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  // 1. Help
  if (hasFlag(args, 'help', 'h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  const jsonMode = hasFlag(args, 'json');
  const executeMode = hasFlag(args, 'execute');

  // 2. Collect inputs — flag value if present, otherwise interactive prompt

  // handle
  let handle = getFlagValue(args, 'handle');
  if (!handle) {
    const result = await p.text({ message: 'Your rig handle (e.g. fox)' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    handle = result;
  }

  // display_name
  let display_name = getFlagValue(args, 'display-name');
  if (!display_name) {
    const result = await p.text({ message: 'Display name' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    display_name = result;
  }

  // email
  let email = getFlagValue(args, 'email');
  if (!email) {
    const result = await p.text({ message: 'Email for DoltHub' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    email = result;
  }

  // dolthub_org
  let dolthub_org = getFlagValue(args, 'dolthub-org');
  if (!dolthub_org) {
    const result = await p.text({ message: 'DoltHub org name' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    dolthub_org = result;
  }

  // type
  let rig_type = getFlagValue(args, 'type') as 'human' | 'agent' | 'org' | undefined;
  if (!rig_type) {
    const result = await p.select({
      message: 'Rig type',
      options: [{ value: 'human' }, { value: 'agent' }, { value: 'org' }],
    });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    rig_type = result as 'human' | 'agent' | 'org';
  }
  const type = rig_type || 'human';

  // fork
  let fork = getFlagValue(args, 'fork');
  if (!fork) {
    const result = await p.text({ message: 'Your fork URL (e.g. handle/wl-commons)' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    fork = result;
  }

  // local_dir
  let local_dir = getFlagValue(args, 'local-dir');
  if (!local_dir) {
    const result = await p.text({ message: 'Local clone path' });
    if (p.isCancel(result)) { p.cancel('Setup cancelled.'); return 1; }
    local_dir = result;
  }

  // 3. Build HopConfig
  const resolvedLocalDir = local_dir.replace('~', os.homedir());
  const config: HopConfig = {
    handle,
    display_name,
    type,
    dolthub_org,
    email,
    wastelands: [
      {
        upstream: 'hop/wl-commons',
        fork,
        local_dir: resolvedLocalDir,
        joined_at: new Date().toISOString(),
      },
    ],
    schema_version: '1.0',
    mvr_version: '0.1',
  };

  // 4. Screen user-supplied inputs for injection patterns — individually,
  //    not on the assembled SQL (which contains intentional -- comments and
  //    SQL keywords). Pattern from wl-done.ts:207-214.
  const userInputs: Record<string, string> = { handle, display_name, email, dolthub_org, type, fork };
  for (const [field, value] of Object.entries(userInputs)) {
    const { safe, threats } = screenForInjection(value);
    if (!safe) {
      console.error(pc.red(`Injection pattern detected in ${field}:`));
      for (const t of threats) console.error(pc.red(`  - ${t}`));
      return 1;
    }
  }

  // 5. Generate registration SQL — all string values route through sqlEscape()
  const sql = [
    `-- Register rig: ${handle.replace(/[\r\n]/g, ' ')}`,
    `INSERT INTO rigs (handle, display_name, type, dolthub_org, email, joined_at)`,
    `VALUES ('${sqlEscape(handle)}', '${sqlEscape(display_name)}', '${sqlEscape(type)}', '${sqlEscape(dolthub_org)}', '${sqlEscape(email)}', '${new Date().toISOString()}');`,
  ].join('\n');

  // 6. Execute path (--execute)
  if (executeMode) {
    const client = createClient({
      upstream: 'hop/wl-commons',
      fork,
      localDir: resolvedLocalDir,
      branch: 'main',
    });

    try {
      await client.execute(sql);
      console.log(pc.green('Registration applied to local clone.'));
      console.log(pc.dim('Push when ready: cd ' + resolvedLocalDir + ' && dolt push origin main'));
      await saveConfig(config, options?.configDir);
      if (jsonMode) {
        console.log(JSON.stringify({ status: 'executed', config }, null, 2));
      }
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red('Execute failed: ' + msg));
      return 2;
    }
  }

  // 7. Default path (dry-run — no --execute)
  if (jsonMode) {
    console.log(JSON.stringify({ status: 'ready', sql, config }, null, 2));
  } else {
    console.log(sql);
    console.log(pc.dim('\nReview the SQL above. Run with --execute to apply locally.'));
  }
  await saveConfig(config, options?.configDir);
  return 0;
}

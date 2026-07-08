/**
 * skill-creator gsd-init — install GSD skill-creator integration into the host
 * project's .claude/ tree.
 *
 * Usage:
 *   skill-creator gsd-init               Install all components
 *   skill-creator gsd-init --dry-run     Show what would be installed
 *   skill-creator gsd-init --force       Overwrite differing files
 *   skill-creator gsd-init --quiet       Suppress "current" messages
 *   skill-creator gsd-init --uninstall   Remove integration components
 *
 * INT-2 — single-engine consolidation. This command used to be a ~1,200-line
 * TypeScript re-implementation of project-claude/install.cjs that drifted from
 * it (it silently skipped the manifest's autoDiscover + cartridges, clobbered a
 * customized host CLAUDE.md without --force, and had a divergent uninstall).
 * It now DELEGATES to install.cjs — the same manifest-driven, path-guarded,
 * ledger-based engine that `npx gsd-skill-creator` runs — so the two entry
 * points can never diverge again. This wrapper maps flags, points the engine at
 * the current project (--local), and forwards its exit code.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureProcessAllowed,
  type ProcessContext,
} from '../../security/process-context.js';

const HELP = `
skill-creator gsd-init — Install GSD skill-creator integration

Usage:
  skill-creator gsd-init [options]

Options:
  --dry-run    Show what would be installed without writing files
  --force      Overwrite files that differ from source
  --quiet      Suppress "current" status messages
  --uninstall  Remove integration components (preserves observation data)
  --help, -h   Show this help message

Aliases: gi

Description:
  Installs all GSD-related skills, agents, commands, hooks, teams, settings, and
  integration config into the current project's .claude/ directory. Driven by
  project-claude/manifest.json. Delegates to the canonical installer
  (project-claude/install.cjs), the same engine \`npx gsd-skill-creator\` uses.

  Files are installed with SHA256 idempotency — unchanged files are skipped.
  Use --force to overwrite files that have been modified.

Examples:
  skill-creator gsd-init              Install all components
  skill-creator gsd-init --dry-run    Preview installation
  skill-creator gsd-init --force      Overwrite changed files
  skill-creator gsd-init --uninstall  Remove integration
`;

export interface GsdInitOverrides {
  /** Overrides the project-claude source root (→ SC_INSTALL_SOURCE_DIR). Tests
   *  inject a synthetic manifest + sources here. */
  sourceDir?: string;
  /** Target project root. Defaults to process.cwd(). */
  cwd?: string;
  /** Optional ProcessContext for the spawn chokepoint (undefined → permissive). */
  ctx?: ProcessContext;
}

// Flags install.cjs understands and gsd-init forwards verbatim. gsd-init always
// targets the current project, so --local is added unconditionally.
const PASSTHROUGH_FLAGS = ['--dry-run', '--force', '--quiet', '--uninstall'];

/**
 * Resolve <packageRoot>/project-claude/install.cjs from this file's location.
 * dist/cli/commands/gsd-init.js → packageRoot is 3 levels up (same relative
 * structure as the tsx src/cli/commands/gsd-init.ts dev path).
 */
function resolveInstallCjs(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(thisFile), '..', '..', '..');
  if (!existsSync(path.join(packageRoot, 'package.json'))) {
    throw new Error(`Invalid package root: ${packageRoot} (no package.json found)`);
  }
  return path.join(packageRoot, 'project-claude', 'install.cjs');
}

export async function gsdInitCommand(
  args: string[],
  overrides?: GsdInitOverrides,
): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return 0;
  }

  let installCjs: string;
  try {
    installCjs = resolveInstallCjs();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  const flags = args.filter((arg) => PASSTHROUGH_FLAGS.includes(arg));
  const spawnArgs = [installCjs, '--local', ...flags];
  const cwd = overrides?.cwd ?? process.cwd();
  const env = { ...process.env };
  if (overrides?.sourceDir) {
    env.SC_INSTALL_SOURCE_DIR = overrides.sourceDir;
  }

  // Route the delegating spawn through the ProcessContext chokepoint. The
  // command is the trusted first-party installer, so undefined ctx (permissive)
  // is the default; a caller may thread a ctx to enforce an allowlist.
  ensureProcessAllowed(
    overrides?.ctx,
    'cli/commands/gsd-init',
    'spawn',
    process.execPath,
    spawnArgs,
    `delegate to install.cjs (cwd=${cwd})`,
  );

  const result = spawnSync(process.execPath, spawnArgs, {
    stdio: 'inherit',
    cwd,
    env,
  });

  if (result.error) {
    console.error(`Failed to run installer: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

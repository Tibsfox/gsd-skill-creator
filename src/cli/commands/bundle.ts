/**
 * CLI subcommand handler for bundle management.
 *
 * Provides create/list/activate/deactivate/status subcommands
 * for managing work bundles. Follows the same dispatch pattern
 * as role.ts:
 * - JSON output by default for agent consumption
 * - --pretty for human-readable output
 * - Exit code 1 with { error } JSON on failure
 *
 * Subcommands:
 * - create: Interactive or flag-driven bundle scaffolding
 * - list: Show all .bundle.yaml files with metadata
 * - activate: Set active bundle in WorkState
 * - deactivate: Clear active bundle from WorkState
 * - status: Show active bundle with skill priorities
 */

import { join } from 'node:path';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { parseBundleFile } from '../../bundles/index.js';
import { BundleActivator } from '../../bundles/index.js';

// ============================================================================
// Argument parsing helpers
// ============================================================================

/**
 * Extract a flag value from args in --key=value format.
 */
function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

// ============================================================================
// Directory resolution
// ============================================================================

/**
 * Resolve the bundles directory.
 * Bundles live at `.claude/bundles/` in the project root.
 */
function resolveBundleDir(): string {
  return join(process.cwd(), '.claude', 'bundles');
}

/**
 * Resolve the WorkState file path.
 * WorkState lives at `.planning/hooks/current-work.yaml`.
 */
function resolveWorkStateFile(): string {
  return join(process.cwd(), '.planning', 'hooks', 'current-work.yaml');
}

// ============================================================================
// Help text
// ============================================================================

function showBundleHelp(): void {
  console.log(`
skill-creator bundle - Manage work bundles

Usage:
  skill-creator bundle <subcommand> [options]
  skill-creator bd <subcommand> [options]

Subcommands:
  create, c        Create a new bundle (interactive or flags)
  list, l          List all bundle files
  activate, a      Activate a bundle for token budget priority
  deactivate, d    Deactivate the current bundle
  status, s        Show active bundle and skill priorities

Create Options:
  --name=<name>         Bundle name (required for non-interactive)
  --skills=<csv>        Comma-separated skill names (required for non-interactive)
  --description=<desc>  Bundle description
  --phase=<phase>       Associated phase name

List Options:
  --json                Output as JSON (default)
  --pretty              Human-readable output

Activate Options:
  --name=<name>         Bundle name to activate (required)

Status Options:
  --pretty              Human-readable output

Examples:
  skill-creator bundle create
  skill-creator bd c --name=frontend-dev --skills=ts,react
  skill-creator bundle list
  skill-creator bd l --pretty
  skill-creator bundle activate --name=frontend-dev
  skill-creator bundle deactivate
  skill-creator bundle status
`);
}

// ============================================================================
// Create subcommand
// ============================================================================

/**
 * Create a new bundle interactively or from flags.
 *
 * Non-interactive mode: --name and --skills are required.
 * Interactive mode: prompts for name, description, phase, skills.
 */
async function handleCreate(args: string[]): Promise<number> {
  const nameFlag = extractFlag(args, 'name');
  const skillsFlag = extractFlag(args, 'skills');
  const descFlag = extractFlag(args, 'description');
  const phaseFlag = extractFlag(args, 'phase');

  let name: string;
  let description: string | undefined;
  let phase: string | undefined;
  let skills: Array<{ name: string; required: boolean }>;

  // Detect non-interactive intent without --name (flags present but name missing)
  const hasAnyFlag = skillsFlag || descFlag || phaseFlag;
  if (!nameFlag && hasAnyFlag) {
    console.log(JSON.stringify({
      error: '--name is required for non-interactive mode',
    }, null, 2));
    return 1;
  }

  if (nameFlag) {
    // Non-interactive mode
    name = nameFlag;

    if (!skillsFlag) {
      console.log(JSON.stringify({
        error: '--skills is required for non-interactive mode',
      }, null, 2));
      return 1;
    }

    description = descFlag;
    phase = phaseFlag;
    skills = skillsFlag
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ name: s, required: true }));
  } else {
    // Interactive mode
    try {
      const p = await import('@clack/prompts');

      p.intro('Create a new bundle');

      const nameResult = await p.text({
        message: 'Bundle name:',
        placeholder: 'frontend-dev',
        validate: (val: string | undefined) => {
          if (!val || !val.trim()) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(val)) return 'Name must be lowercase letters, numbers, and hyphens';
          return undefined;
        },
      });
      if (p.isCancel(nameResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      name = nameResult as string;

      const descResult = await p.text({
        message: 'Description (optional):',
        placeholder: 'A bundle for frontend development',
      });
      if (p.isCancel(descResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      description = (descResult as string) || undefined;

      const phaseResult = await p.text({
        message: 'Phase (optional):',
        placeholder: 'implementation',
      });
      if (p.isCancel(phaseResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      phase = (phaseResult as string) || undefined;

      const skillsResult = await p.text({
        message: 'Skills (comma-separated, min 1):',
        placeholder: 'typescript, react, testing',
        validate: (val: string | undefined) => {
          if (!val || !val.trim()) return 'At least one skill is required';
          const parsed = val.split(',').map((s) => s.trim()).filter(Boolean);
          if (parsed.length === 0) return 'At least one skill is required';
          return undefined;
        },
      });
      if (p.isCancel(skillsResult)) {
        p.cancel('Cancelled');
        return 1;
      }

      const skillNames = (skillsResult as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Ask for each skill's required status
      skills = [];
      for (const skillName of skillNames) {
        const reqResult = await p.confirm({
          message: `Is "${skillName}" required?`,
          initialValue: true,
        });
        if (p.isCancel(reqResult)) {
          p.cancel('Cancelled');
          return 1;
        }
        skills.push({ name: skillName, required: reqResult as boolean });
      }
    } catch (err) {
      console.log(JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }, null, 2));
      return 1;
    }
  }

  // Write YAML file
  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const bundleDir = resolveBundleDir();
    await mkdir(bundleDir, { recursive: true });

    const filePath = join(bundleDir, `${name}.bundle.yaml`);

    // Build clean YAML object (omit undefined/empty fields)
    const yamlObj: Record<string, unknown> = {
      name,
      ...(description ? { description } : {}),
      ...(phase ? { phase } : {}),
      skills: skills.map((s) => ({
        name: s.name,
        required: s.required,
      })),
    };

    const content = (yaml as any).dump(yamlObj, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
    await writeFile(filePath, content, 'utf-8');

    console.log(JSON.stringify({
      created: filePath,
      name,
      skills: skills.length,
    }, null, 2));
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// List subcommand
// ============================================================================

/**
 * List all bundle YAML files.
 *
 * Scans .claude/bundles/ for *.bundle.yaml files and displays metadata.
 */
async function handleList(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');

  try {
    const bundleDir = resolveBundleDir();

    let files: string[];
    try {
      const entries = await readdir(bundleDir);
      files = entries.filter((f) => f.endsWith('.bundle.yaml'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        if (pretty) {
          console.log('No bundles found.');
          console.log('Create one with: skill-creator bundle create');
        } else {
          console.log(JSON.stringify({ bundles: [] }, null, 2));
        }
        return 0;
      }
      throw err;
    }

    if (files.length === 0) {
      if (pretty) {
        console.log('No bundles found.');
        console.log('Create one with: skill-creator bundle create');
      } else {
        console.log(JSON.stringify({ bundles: [] }, null, 2));
      }
      return 0;
    }

    const bundles: Array<{
      name: string;
      description?: string;
      skills: number;
      file: string;
    }> = [];

    for (const file of files) {
      const filePath = join(bundleDir, file);
      const def = await parseBundleFile(filePath);
      if (def) {
        bundles.push({
          name: def.name,
          description: def.description,
          skills: def.skills.length,
          file,
        });
      }
    }

    if (pretty) {
      console.log('Bundles:');
      for (const bundle of bundles) {
        const desc = bundle.description ? ` - ${bundle.description}` : '';
        console.log(`  ${bundle.name}${desc} (${bundle.skills} skills)`);
      }
    } else {
      console.log(JSON.stringify({ bundles }, null, 2));
    }
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Activate subcommand
// ============================================================================

/**
 * Activate a bundle by name.
 *
 * Sets active_bundle in WorkState via BundleActivator.
 */
async function handleActivate(args: string[]): Promise<number> {
  const nameFlag = extractFlag(args, 'name');

  if (!nameFlag) {
    console.log(JSON.stringify({
      error: '--name is required for activate',
    }, null, 2));
    return 1;
  }

  const activator = new BundleActivator(resolveBundleDir(), resolveWorkStateFile());
  const result = await activator.activate(nameFlag);

  if (result.success) {
    console.log(JSON.stringify({ activated: nameFlag }, null, 2));
    return 0;
  } else {
    console.log(JSON.stringify({ error: result.error }, null, 2));
    return 1;
  }
}

// ============================================================================
// Deactivate subcommand
// ============================================================================

/**
 * Deactivate the current active bundle.
 *
 * Clears active_bundle in WorkState.
 */
async function handleDeactivate(_args: string[]): Promise<number> {
  const activator = new BundleActivator(resolveBundleDir(), resolveWorkStateFile());
  const result = await activator.deactivate();

  if (result.success) {
    console.log(JSON.stringify({ deactivated: true }, null, 2));
    return 0;
  } else {
    console.log(JSON.stringify({ error: result.error }, null, 2));
    return 1;
  }
}

// ============================================================================
// Status subcommand
// ============================================================================

/**
 * Show active bundle status with skill priorities.
 *
 * Displays active bundle name, description, and skill breakdown
 * with required/optional labels and priority values.
 */
async function handleStatus(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const activator = new BundleActivator(resolveBundleDir(), resolveWorkStateFile());

  const activeName = await activator.getActiveBundle();

  if (!activeName) {
    if (pretty) {
      console.log('No active bundle.');
      console.log('Activate one with: skill-creator bundle activate --name=<bundle>');
    } else {
      console.log(JSON.stringify({ active: null }, null, 2));
    }
    return 0;
  }

  // Parse the active bundle for detailed info
  const bundlePath = join(resolveBundleDir(), `${activeName}.bundle.yaml`);
  const bundle = await parseBundleFile(bundlePath);
  const priorities = await activator.getBundlePriorities();

  if (pretty) {
    console.log(`Active Bundle: ${activeName}`);
    if (bundle?.description) {
      console.log(`Description: ${bundle.description}`);
    }
    if (bundle?.phase) {
      console.log(`Phase: ${bundle.phase}`);
    }
    console.log('');
    console.log('Skills:');
    for (const p of priorities) {
      const req = p.priority === 10 ? 'required' : 'optional';
      console.log(`  ${p.name} (${req}, priority: ${p.priority})`);
    }
  } else {
    console.log(JSON.stringify({
      active: activeName,
      description: bundle?.description ?? null,
      phase: bundle?.phase ?? null,
      skills: priorities,
    }, null, 2));
  }

  return 0;
}

// ============================================================================
// Main dispatcher
// ============================================================================

/**
 * Bundle CLI command entry point.
 *
 * Dispatches to the appropriate subcommand handler based on the first argument.
 *
 * @param args - Command-line arguments after 'bundle'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function bundleCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  // Help flags or no subcommand -> show help
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showBundleHelp();
    return 0;
  }

  // Strip the subcommand from args for handler consumption
  const handlerArgs = args.slice(1);

  switch (subcommand) {
    case 'create':
    case 'c':
      return handleCreate(handlerArgs);

    case 'list':
    case 'l':
      return handleList(handlerArgs);

    case 'activate':
    case 'a':
      return handleActivate(handlerArgs);

    case 'deactivate':
    case 'd':
      return handleDeactivate(handlerArgs);

    case 'status':
    case 's':
      return handleStatus(handlerArgs);

    default:
      console.log(JSON.stringify({
        error: `Unknown subcommand: ${subcommand}`,
        help: 'Run "skill-creator bundle --help" for available subcommands',
      }, null, 2));
      return 1;
  }
}

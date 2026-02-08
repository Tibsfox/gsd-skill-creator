/**
 * CLI subcommand handler for role management.
 *
 * Provides create/list subcommands for managing agent roles.
 * Follows the same dispatch pattern as workflow.ts:
 * - JSON output by default for agent consumption
 * - --pretty for human-readable output
 * - Exit code 1 with { error } JSON on failure
 *
 * Subcommands:
 * - create: Interactive or flag-driven role scaffolding
 * - list: Show all .role.yaml files with metadata
 */

import { join } from 'node:path';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { parseRoleFile } from '../../roles/index.js';
import type { RoleDefinition } from '../../roles/index.js';

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
 * Resolve the roles directory.
 * Roles live at `.claude/roles/` in the project root.
 */
function resolveRoleDir(): string {
  return join(process.cwd(), '.claude', 'roles');
}

// ============================================================================
// Help text
// ============================================================================

function showRoleHelp(): void {
  console.log(`
skill-creator role - Manage agent roles

Usage:
  skill-creator role <subcommand> [options]
  skill-creator rl <subcommand> [options]

Subcommands:
  create, c     Create a new role (interactive or flags)
  list, l       List all role files

Create Options:
  --name=<name>             Role name (required for non-interactive)
  --constraints=<csv>       Comma-separated constraints
  --skills=<csv>            Comma-separated skill names
  --tools=<tools>           Comma-separated tool list
  --model=<model>           Model: sonnet, opus, haiku, inherit
  --description=<desc>      Role description
  --extends=<parent>        Parent role to extend

List Options:
  --json                    Output as JSON (default)
  --pretty                  Human-readable output

Examples:
  skill-creator role create
  skill-creator rl c --name=reviewer --constraints="Read only,Never delete"
  skill-creator role list
  skill-creator rl l --pretty
`);
}

// ============================================================================
// Create subcommand
// ============================================================================

/**
 * Create a new role interactively or from flags.
 *
 * Non-interactive mode: --name is required. Other flags are optional.
 * Interactive mode: prompts for name, description, constraints, skills, tools, model.
 */
async function handleCreate(args: string[]): Promise<number> {
  const nameFlag = extractFlag(args, 'name');
  const constraintsFlag = extractFlag(args, 'constraints');
  const skillsFlag = extractFlag(args, 'skills');
  const toolsFlag = extractFlag(args, 'tools');
  const modelFlag = extractFlag(args, 'model');
  const descFlag = extractFlag(args, 'description');
  const extendsFlag = extractFlag(args, 'extends');

  let name: string;
  let description: string | undefined;
  let constraints: string[];
  let skills: string[];
  let tools: string | undefined;
  let model: RoleDefinition['model'];
  let extendsRole: string | null;

  // Detect non-interactive intent without --name (flags present but name missing)
  const hasAnyFlag = constraintsFlag || skillsFlag || toolsFlag || modelFlag || descFlag || extendsFlag;
  if (!nameFlag && hasAnyFlag) {
    console.log(JSON.stringify({
      error: '--name is required for non-interactive mode',
    }, null, 2));
    return 1;
  }

  if (nameFlag) {
    // Non-interactive mode
    name = nameFlag;
    description = descFlag;
    constraints = constraintsFlag
      ? constraintsFlag.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    skills = skillsFlag
      ? skillsFlag.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    tools = toolsFlag;
    model = modelFlag as RoleDefinition['model'];
    extendsRole = extendsFlag ?? null;
  } else {
    // Interactive mode
    try {
      const p = await import('@clack/prompts');

      p.intro('Create a new role');

      const nameResult = await p.text({
        message: 'Role name:',
        placeholder: 'security-reviewer',
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
        placeholder: 'A role for security-focused code review',
      });
      if (p.isCancel(descResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      description = (descResult as string) || undefined;

      const constraintsResult = await p.text({
        message: 'Constraints (comma-separated, or empty):',
        placeholder: 'Never modify files, Provide evidence for findings',
      });
      if (p.isCancel(constraintsResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      constraints = (constraintsResult as string)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const skillsResult = await p.text({
        message: 'Skills (comma-separated, or empty):',
        placeholder: 'code-analysis, owasp-scanner',
      });
      if (p.isCancel(skillsResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      skills = (skillsResult as string)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const toolsResult = await p.text({
        message: 'Tools (comma-separated, or empty):',
        placeholder: 'Read, Glob, Grep',
      });
      if (p.isCancel(toolsResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      tools = (toolsResult as string) || undefined;

      const modelResult = await p.select({
        message: 'Model:',
        options: [
          { value: 'none', label: 'None (no model preference)' },
          { value: 'sonnet', label: 'Sonnet' },
          { value: 'opus', label: 'Opus' },
          { value: 'haiku', label: 'Haiku' },
          { value: 'inherit', label: 'Inherit (from parent)' },
        ],
      });
      if (p.isCancel(modelResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      model = modelResult === 'none' ? undefined : (modelResult as RoleDefinition['model']);

      const extendsResult = await p.text({
        message: 'Extends (parent role name, or empty):',
        placeholder: '',
      });
      if (p.isCancel(extendsResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      extendsRole = (extendsResult as string) || null;
    } catch (err) {
      console.log(JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }, null, 2));
      return 1;
    }
  }

  // Build role definition
  const definition: RoleDefinition = {
    name,
    extends: extendsRole ?? null,
    skills,
    constraints,
    ...(description ? { description } : {}),
    ...(tools ? { tools } : {}),
    ...(model ? { model } : {}),
  };

  // Write YAML file
  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const roleDir = resolveRoleDir();
    await mkdir(roleDir, { recursive: true });

    const filePath = join(roleDir, `${name}.role.yaml`);

    // Build clean YAML object (omit null extends, empty arrays, undefined fields)
    const yamlObj: Record<string, unknown> = {
      name: definition.name,
      ...(definition.description ? { description: definition.description } : {}),
      ...(definition.extends ? { extends: definition.extends } : {}),
      ...(definition.constraints.length > 0 ? { constraints: definition.constraints } : {}),
      ...(definition.skills.length > 0 ? { skills: definition.skills } : {}),
      ...(definition.tools ? { tools: definition.tools } : {}),
      ...(definition.model ? { model: definition.model } : {}),
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
      constraints: constraints.length,
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
 * List all role YAML files.
 *
 * Scans .claude/roles/ for *.role.yaml files and displays metadata.
 */
async function handleList(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');

  try {
    const roleDir = resolveRoleDir();

    let files: string[];
    try {
      const entries = await readdir(roleDir);
      files = entries.filter((f) => f.endsWith('.role.yaml'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        if (pretty) {
          console.log('No roles found.');
          console.log('Create one with: skill-creator role create');
        } else {
          console.log(JSON.stringify({ roles: [] }, null, 2));
        }
        return 0;
      }
      throw err;
    }

    if (files.length === 0) {
      if (pretty) {
        console.log('No roles found.');
        console.log('Create one with: skill-creator role create');
      } else {
        console.log(JSON.stringify({ roles: [] }, null, 2));
      }
      return 0;
    }

    const roles: Array<{
      name: string;
      description?: string;
      constraints: number;
      skills: string[];
      file: string;
    }> = [];

    for (const file of files) {
      const filePath = join(roleDir, file);
      const def = await parseRoleFile(filePath);
      if (def) {
        roles.push({
          name: def.name,
          description: def.description,
          constraints: def.constraints.length,
          skills: def.skills,
          file,
        });
      }
    }

    if (pretty) {
      console.log('Roles:');
      for (const role of roles) {
        const desc = role.description ? ` - ${role.description}` : '';
        console.log(`  ${role.name}${desc} (${role.constraints} constraints, ${role.skills.length} skills)`);
      }
    } else {
      console.log(JSON.stringify({ roles }, null, 2));
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
// Main dispatcher
// ============================================================================

/**
 * Role CLI command entry point.
 *
 * Dispatches to the appropriate subcommand handler based on the first argument.
 *
 * @param args - Command-line arguments after 'role'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function roleCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  // Help flags or no subcommand -> show help
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showRoleHelp();
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

    default:
      console.log(JSON.stringify({
        error: `Unknown subcommand: ${subcommand}`,
        help: 'Run "skill-creator role --help" for available subcommands',
      }, null, 2));
      return 1;
  }
}

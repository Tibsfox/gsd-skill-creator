/**
 * gsd-init command — Install GSD skill-creator integration into a project.
 *
 * Ports project-claude/install.cjs to TypeScript. Reads manifest.json
 * and copies skills, agents, commands, hooks, teams, and settings
 * into the target project's .claude/ directory.
 *
 * Usage:
 *   skill-creator gsd-init              Install all components
 *   skill-creator gsd-init --dry-run    Show what would be installed
 *   skill-creator gsd-init --force      Overwrite differing files
 *   skill-creator gsd-init --quiet      Suppress "current" messages
 *   skill-creator gsd-init --uninstall  Remove integration components
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { existsSync, readFileSync, accessSync, constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import pc from 'picocolors';

// --- Types ---

interface ManifestEntry {
  source: string;
  target: string;
  description?: string;
  files?: string[];
  marker?: string;
  legacyThreshold?: number;
  projectHooks?: string[];
}

interface Manifest {
  version: number;
  project: string;
  description: string;
  files: {
    standalone?: ManifestEntry[];
    skills?: ManifestEntry[];
    hookScripts?: ManifestEntry[];
    claudeMd?: ManifestEntry;
    extensions?: ManifestEntry[];
    settings?: ManifestEntry;
    settingsHooks?: ManifestEntry;
  };
}

interface Stats {
  installed: number;
  updated: number;
  current: number;
  warnings: number;
}

interface Options {
  dryRun: boolean;
  force: boolean;
  quiet: boolean;
}

// --- Helpers ---

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function ensureDir(filePath: string, dryRun: boolean): Promise<void> {
  const dir = path.dirname(filePath);
  if (!existsSync(dir) && !dryRun) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function ensureDirPath(dirPath: string, dryRun: boolean): Promise<void> {
  if (!existsSync(dirPath) && !dryRun) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function log(msg: string, quiet: boolean): void {
  if (!quiet) console.log(msg);
}

function warn(msg: string, stats: Stats): void {
  console.log(`  ${pc.yellow('⚠')} ${msg}`);
  stats.warnings++;
}

/**
 * Assert that resolvedPath is contained within root.
 * Prevents path traversal attacks via malicious manifest entries.
 */
export function assertContained(resolvedPath: string, root: string): void {
  const normalizedRoot = path.resolve(root) + path.sep;
  const normalizedTarget = path.resolve(resolvedPath);
  if (!normalizedTarget.startsWith(normalizedRoot) && normalizedTarget !== path.resolve(root)) {
    throw new Error(`Path traversal blocked: ${resolvedPath} escapes project root`);
  }
}

/**
 * Resolve the package root and source directory for project-claude files.
 * When running from dist/cli/commands/gsd-init.js → package root is 3 levels up.
 * When running via tsx src/cli/commands/gsd-init.ts → same relative structure.
 */
function resolveSourceDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(thisFile), '..', '..', '..');
  if (!existsSync(path.join(packageRoot, 'package.json'))) {
    throw new Error(`Invalid package root: ${packageRoot} (no package.json found)`);
  }
  return path.join(packageRoot, 'project-claude');
}

// --- Install functions ---

async function installStandalone(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);

  const sourceContent = await readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Source missing: ${entry.source}`, stats);
    return;
  }

  const targetContent = await readFileSafe(targetPath);

  if (targetContent === null) {
    if (!opts.dryRun) {
      await ensureDir(targetPath, opts.dryRun);
      await fs.writeFile(targetPath, sourceContent);
    }
    log(`  ${pc.green('+')} installed: ${entry.target}`, opts.quiet);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    log(`  ${pc.dim('=')} current:   ${entry.target}`, opts.quiet);
    stats.current++;
  } else if (opts.force) {
    if (!opts.dryRun) {
      await fs.writeFile(targetPath, sourceContent);
    }
    log(`  ${pc.cyan('↻')} updated:   ${entry.target}`, opts.quiet);
    stats.updated++;
  } else {
    warn(`differs: ${entry.target} (use --force to overwrite)`, stats);
  }
}

async function installSkillDir(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourceBase = path.join(sourceDir, entry.source);
  const targetBase = path.join(projectRoot, entry.target);
  assertContained(targetBase, projectRoot);

  if (!existsSync(sourceBase)) {
    warn(`Skill source directory missing: ${entry.source}`, stats);
    return;
  }

  await ensureDirPath(targetBase, opts.dryRun);

  const files = entry.files || [];

  for (const relFile of files) {
    const sourcePath = path.join(sourceBase, relFile);
    const targetPath = path.join(targetBase, relFile);

    const sourceContent = await readFileSafe(sourcePath);
    if (sourceContent === null) {
      warn(`Skill file missing: ${entry.source}/${relFile}`, stats);
      continue;
    }

    const targetContent = await readFileSafe(targetPath);

    if (targetContent === null) {
      if (!opts.dryRun) {
        await ensureDir(targetPath, opts.dryRun);
        await fs.writeFile(targetPath, sourceContent);
      }
      log(`  ${pc.green('+')} installed: ${entry.target}/${relFile}`, opts.quiet);
      stats.installed++;
    } else if (sha256(sourceContent) === sha256(targetContent)) {
      log(`  ${pc.dim('=')} current:   ${entry.target}/${relFile}`, opts.quiet);
      stats.current++;
    } else if (opts.force) {
      if (!opts.dryRun) {
        await fs.writeFile(targetPath, sourceContent);
      }
      log(`  ${pc.cyan('↻')} updated:   ${entry.target}/${relFile}`, opts.quiet);
      stats.updated++;
    } else {
      warn(`differs: ${entry.target}/${relFile} (use --force to overwrite)`, stats);
    }
  }
}

async function installHookScript(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);

  const sourceContent = await readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Hook source missing: ${entry.source}`, stats);
    return;
  }

  const targetContent = await readFileSafe(targetPath);

  if (targetContent === null) {
    if (!opts.dryRun) {
      await ensureDir(targetPath, opts.dryRun);
      await fs.writeFile(targetPath, sourceContent);
      await fs.chmod(targetPath, 0o755);
    }
    log(`  ${pc.green('+')} installed: ${entry.target} (executable)`, opts.quiet);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    if (!opts.dryRun) {
      try { await fs.chmod(targetPath, 0o755); } catch { /* ignore */ }
    }
    log(`  ${pc.dim('=')} current:   ${entry.target}`, opts.quiet);
    stats.current++;
  } else if (opts.force) {
    if (!opts.dryRun) {
      await fs.writeFile(targetPath, sourceContent);
      await fs.chmod(targetPath, 0o755);
    }
    log(`  ${pc.cyan('↻')} updated:   ${entry.target} (executable)`, opts.quiet);
    stats.updated++;
  } else {
    warn(`differs: ${entry.target} (use --force to overwrite)`, stats);
  }
}

async function installClaudeMd(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);
  const legacyThreshold = entry.legacyThreshold || 100;

  const sourceContent = await readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`CLAUDE.md source missing: ${entry.source}`, stats);
    return;
  }

  const targetContent = await readFileSafe(targetPath);

  if (targetContent === null) {
    if (!opts.dryRun) {
      await ensureDir(targetPath, opts.dryRun);
      await fs.writeFile(targetPath, sourceContent);
    }
    log(`  ${pc.green('+')} installed: ${entry.target}`, opts.quiet);
    stats.installed++;
    return;
  }

  if (sha256(sourceContent) === sha256(targetContent)) {
    log(`  ${pc.dim('=')} current:   ${entry.target}`, opts.quiet);
    stats.current++;
    return;
  }

  const lineCount = targetContent.split('\n').length;
  if (lineCount > legacyThreshold) {
    const legacyPath = path.join(projectRoot, 'CLAUDE.md.legacy');
    if (!existsSync(legacyPath)) {
      if (!opts.dryRun) {
        await fs.writeFile(legacyPath, targetContent);
      }
      log(`  ${pc.yellow('~')} backup:    CLAUDE.md.legacy (${lineCount} lines archived)`, opts.quiet);
    }
  }

  if (!opts.dryRun) {
    await fs.writeFile(targetPath, sourceContent);
  }
  log(`  ${pc.cyan('↻')} updated:   ${entry.target} (slim version deployed)`, opts.quiet);
  stats.updated++;
}

async function installExtension(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);
  const marker = entry.marker!;

  const fragmentContent = await readFileSafe(sourcePath);
  if (fragmentContent === null) {
    warn(`Extension source missing: ${entry.source}`, stats);
    return;
  }

  const targetContent = await readFileSafe(targetPath);
  if (targetContent === null) {
    warn(`Extension target missing: ${entry.target} (GSD not installed?)`, stats);
    return;
  }

  const startMarker = `<!-- ${marker} START -->`;
  const endMarker = `<!-- ${marker} END -->`;
  const startIdx = targetContent.indexOf(startMarker);
  const endIdx = targetContent.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1) {
    const existingBlock = targetContent.substring(startIdx, endIdx + endMarker.length);
    const newBlock = fragmentContent.trim();

    if (sha256(existingBlock) === sha256(newBlock)) {
      log(`  ${pc.dim('=')} current:   ${entry.target} [${marker}]`, opts.quiet);
      stats.current++;
    } else {
      const before = targetContent.substring(0, startIdx);
      const after = targetContent.substring(endIdx + endMarker.length);
      const updated = before + newBlock + after;
      if (!opts.dryRun) {
        await fs.writeFile(targetPath, updated);
      }
      log(`  ${pc.cyan('↻')} updated:   ${entry.target} [${marker}]`, opts.quiet);
      stats.updated++;
    }
  } else {
    const innerStart = fragmentContent.indexOf(startMarker);
    const innerEnd = fragmentContent.indexOf(endMarker);
    let innerContent = '';
    if (innerStart !== -1 && innerEnd !== -1) {
      innerContent = fragmentContent.substring(innerStart + startMarker.length, innerEnd).trim();
    }

    const tagMatch = innerContent.match(/<(\w+)[\s>]/);
    const hasContent = tagMatch && targetContent.includes(`<${tagMatch[1]}`);

    if (hasContent) {
      log(`  ${pc.dim('=')} present:   ${entry.target} [${marker}] (content exists, no markers)`, opts.quiet);
      stats.current++;
    } else {
      const newContent = targetContent.trimEnd() + '\n\n' + fragmentContent.trim() + '\n';
      if (!opts.dryRun) {
        await fs.writeFile(targetPath, newContent);
      }
      log(`  ${pc.green('+')} installed: ${entry.target} [${marker}]`, opts.quiet);
      stats.installed++;
    }
  }
}

async function installSettings(
  entry: ManifestEntry,
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);

  const sourceContent = await readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Settings source missing: ${entry.source}`, stats);
    return;
  }

  let sourceSettings: Record<string, unknown>;
  try {
    sourceSettings = JSON.parse(sourceContent);
  } catch {
    warn(`Settings source is not valid JSON: ${entry.source}`, stats);
    return;
  }

  const targetContent = await readFileSafe(targetPath);

  if (targetContent === null) {
    if (!opts.dryRun) {
      await ensureDir(targetPath, opts.dryRun);
      await fs.writeFile(targetPath, JSON.stringify(sourceSettings, null, 2) + '\n');
    }
    log(`  ${pc.green('+')} installed: ${entry.target}`, opts.quiet);
    stats.installed++;
    return;
  }

  let targetSettings: Record<string, unknown>;
  try {
    targetSettings = JSON.parse(targetContent);
  } catch {
    warn(`Existing settings not valid JSON: ${entry.target}`, stats);
    return;
  }

  let changed = false;
  const sourceHooks = sourceSettings.hooks as Record<string, Array<{ hooks?: Array<{ command: string }> }>> | undefined;

  if (sourceHooks) {
    if (!targetSettings.hooks) targetSettings.hooks = {};
    const targetHooks = targetSettings.hooks as Record<string, Array<{ hooks?: Array<{ command: string }> }>>;

    for (const [event, sourceHookGroups] of Object.entries(sourceHooks)) {
      if (!targetHooks[event]) {
        targetHooks[event] = [];
      }

      for (const sourceGroup of sourceHookGroups) {
        const sourceCmd = sourceGroup.hooks?.[0]?.command;
        if (!sourceCmd) continue;

        const exists = targetHooks[event].some(
          (group: { hooks?: Array<{ command: string }> }) =>
            group.hooks?.some((h: { command: string }) => h.command === sourceCmd),
        );

        if (!exists) {
          targetHooks[event].push(sourceGroup);
          changed = true;
        }
      }
    }
  }

  if ((sourceSettings as Record<string, unknown>).statusLine && !(targetSettings as Record<string, unknown>).statusLine) {
    (targetSettings as Record<string, unknown>).statusLine = (sourceSettings as Record<string, unknown>).statusLine;
    changed = true;
  }

  if (changed) {
    if (!opts.dryRun) {
      await fs.writeFile(targetPath, JSON.stringify(targetSettings, null, 2) + '\n');
    }
    log(`  ${pc.cyan('↻')} updated:   ${entry.target} (hooks merged)`, opts.quiet);
    stats.updated++;
  } else {
    log(`  ${pc.dim('=')} current:   ${entry.target}`, opts.quiet);
    stats.current++;
  }
}

async function installIntegrationConfig(
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const targetPath = path.join(projectRoot, '.planning', 'skill-creator.json');

  if (existsSync(targetPath)) {
    log(`  ${pc.dim('=')} preserved: .planning/skill-creator.json (user config)`, opts.quiet);
    stats.current++;
    return;
  }

  const defaultConfig = {
    integration: {
      auto_load_skills: true,
      observe_sessions: true,
      phase_transition_hooks: true,
      suggest_on_session_start: true,
      install_git_hooks: true,
      wrapper_commands: true,
    },
    token_budget: {
      max_percent: 5,
      warn_at_percent: 4,
    },
    observation: {
      retention_days: 90,
      max_entries: 1000,
      capture_corrections: true,
    },
    suggestions: {
      min_occurrences: 3,
      cooldown_days: 7,
      auto_dismiss_after_days: 30,
    },
  };

  if (!opts.dryRun) {
    await ensureDir(targetPath, opts.dryRun);
    await fs.writeFile(targetPath, JSON.stringify(defaultConfig, null, 2) + '\n');
  }
  log(`  ${pc.green('+')} installed: .planning/skill-creator.json`, opts.quiet);
  stats.installed++;
}

async function installPatternsDir(
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const targetDir = path.join(projectRoot, '.planning', 'patterns');

  if (existsSync(targetDir)) {
    log(`  ${pc.dim('=')} current:   .planning/patterns/`, opts.quiet);
    stats.current++;
    return;
  }

  if (!opts.dryRun) {
    await fs.mkdir(targetDir, { recursive: true });
  }
  log(`  ${pc.green('+')} installed: .planning/patterns/`, opts.quiet);
  stats.installed++;
}

async function updateGitignore(
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const targetPath = path.join(projectRoot, '.gitignore');
  const content = (await readFileSafe(targetPath)) || '';

  const lines = content.split('\n');
  const hasBlanketPlanning = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.planning/' || trimmed === '.planning';
  });

  if (hasBlanketPlanning) {
    log(`  ${pc.dim('=')} current:   .gitignore (.planning/ covers patterns)`, opts.quiet);
    stats.current++;
    return;
  }

  const hasPatternsEntry = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.planning/patterns/' || trimmed === '.planning/patterns';
  });

  if (hasPatternsEntry) {
    log(`  ${pc.dim('=')} current:   .gitignore (.planning/patterns/)`, opts.quiet);
    stats.current++;
    return;
  }

  if (!opts.dryRun) {
    const addition = '\n# Skill-creator observation data\n.planning/patterns/\n';
    await fs.writeFile(targetPath, content.trimEnd() + addition);
  }
  log(`  ${pc.green('+')} updated:   .gitignore (.planning/patterns/ added)`, opts.quiet);
  stats.updated++;
}

async function installGitHook(
  sourceDir: string,
  projectRoot: string,
  opts: Options,
  stats: Stats,
): Promise<void> {
  const sourcePath = path.join(sourceDir, 'hooks', 'post-commit');
  const targetPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');

  const sourceContent = await readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn('Hook source missing: hooks/post-commit', stats);
    return;
  }

  const gitDir = path.join(projectRoot, '.git');
  if (!existsSync(gitDir)) {
    warn('Not a git repository (.git/ not found)', stats);
    return;
  }

  const hooksDir = path.join(gitDir, 'hooks');
  if (!existsSync(hooksDir) && !opts.dryRun) {
    await fs.mkdir(hooksDir, { recursive: true });
  }

  const targetContent = await readFileSafe(targetPath);

  if (targetContent !== null) {
    if (sha256(sourceContent) === sha256(targetContent)) {
      log(`  ${pc.dim('=')} current:   .git/hooks/post-commit`, opts.quiet);
      stats.current++;
      return;
    }

    const timestamp = Date.now();
    const backupPath = targetPath + '.bak.' + timestamp;
    if (!opts.dryRun) {
      await fs.writeFile(backupPath, targetContent);
    }
    log(`  ${pc.yellow('~')} backup:    .git/hooks/post-commit.bak.${timestamp}`, opts.quiet);

    if (!opts.dryRun) {
      await fs.writeFile(targetPath, sourceContent);
      await fs.chmod(targetPath, 0o755);
    }
    log(`  ${pc.cyan('↻')} updated:   .git/hooks/post-commit`, opts.quiet);
    stats.updated++;
  } else {
    if (!opts.dryRun) {
      await fs.writeFile(targetPath, sourceContent);
      await fs.chmod(targetPath, 0o755);
    }
    log(`  ${pc.green('+')} installed: .git/hooks/post-commit`, opts.quiet);
    stats.installed++;
  }
}

function validateInstallation(
  projectRoot: string,
  quiet: boolean,
): boolean {
  log('Validation:', quiet);

  const checks = [
    { name: 'sc:start', path: '.claude/commands/sc/start.md' },
    { name: 'sc:status', path: '.claude/commands/sc/status.md' },
    { name: 'sc:suggest', path: '.claude/commands/sc/suggest.md' },
    { name: 'sc:observe', path: '.claude/commands/sc/observe.md' },
    { name: 'sc:digest', path: '.claude/commands/sc/digest.md' },
    { name: 'sc:wrap', path: '.claude/commands/sc/wrap.md' },
    { name: 'wrap:execute', path: '.claude/commands/wrap/execute.md' },
    { name: 'wrap:verify', path: '.claude/commands/wrap/verify.md' },
    { name: 'wrap:plan', path: '.claude/commands/wrap/plan.md' },
    { name: 'wrap:phase', path: '.claude/commands/wrap/phase.md' },
    { name: 'observer agent', path: '.claude/agents/observer.md' },
    { name: 'gsd-executor agent', path: '.claude/agents/gsd-executor.md' },
    { name: 'gsd-verifier agent', path: '.claude/agents/gsd-verifier.md' },
    { name: 'gsd-planner agent', path: '.claude/agents/gsd-planner.md' },
    { name: 'gsd-workflow skill', path: '.claude/skills/gsd-workflow/SKILL.md' },
    { name: 'skill-integration skill', path: '.claude/skills/skill-integration/SKILL.md' },
    { name: 'session-awareness skill', path: '.claude/skills/session-awareness/SKILL.md' },
    { name: 'security-hygiene skill', path: '.claude/skills/security-hygiene/SKILL.md' },
    { name: 'session-state hook', path: '.claude/hooks/session-state.sh' },
    { name: 'validate-commit hook', path: '.claude/hooks/validate-commit.sh' },
    { name: 'phase-boundary-check hook', path: '.claude/hooks/phase-boundary-check.sh' },
    { name: 'gsd-dashboard', path: '.claude/commands/gsd-dashboard.md' },
    { name: 'integration config', path: '.planning/skill-creator.json' },
    { name: 'CLAUDE.md', path: 'CLAUDE.md' },
  ];

  let ok = 0;
  let missing = 0;

  for (const check of checks) {
    const fullPath = path.join(projectRoot, check.path);
    if (existsSync(fullPath)) {
      log(`  ${pc.green('✓')} ${check.name}`, quiet);
      ok++;
    } else {
      log(`  ${pc.red('✗')} ${check.name} — missing: ${check.path}`, quiet);
      missing++;
    }
  }

  // Check patterns directory
  const patternsDir = path.join(projectRoot, '.planning', 'patterns');
  if (existsSync(patternsDir)) {
    log(`  ${pc.green('✓')} patterns directory`, quiet);
    ok++;
  } else {
    log(`  ${pc.red('✗')} patterns directory — missing: .planning/patterns/`, quiet);
    missing++;
  }

  // Check git hook
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');
  if (existsSync(hookPath)) {
    log(`  ${pc.green('✓')} post-commit hook`, quiet);
    ok++;
  } else {
    log(`  ${pc.red('✗')} post-commit hook — missing: .git/hooks/post-commit`, quiet);
    missing++;
  }

  // Check .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let gitignoreContent = '';
  try {
    gitignoreContent = readFileSync(gitignorePath, 'utf-8');
  } catch { /* ignore */ }
  if (gitignoreContent.includes('.planning/patterns/') || gitignoreContent.includes('.planning/')) {
    log(`  ${pc.green('✓')} .gitignore (patterns excluded)`, quiet);
    ok++;
  } else {
    log(`  ${pc.red('✗')} .gitignore — .planning/patterns/ not excluded`, quiet);
    missing++;
  }

  // Check hook script permissions
  const hookScripts = [
    '.claude/hooks/session-state.sh',
    '.claude/hooks/validate-commit.sh',
    '.claude/hooks/phase-boundary-check.sh',
  ];
  for (const hookScript of hookScripts) {
    const fullPath = path.join(projectRoot, hookScript);
    try {
      accessSync(fullPath, fsConstants.X_OK);
      log(`  ${pc.green('✓')} ${hookScript} (executable)`, quiet);
      ok++;
    } catch {
      log(`  ${pc.red('✗')} ${hookScript} — not executable`, quiet);
      missing++;
    }
  }

  log('', quiet);
  log(`Validation: ${ok} ok, ${missing} missing`, quiet);

  return missing === 0;
}

async function uninstallIntegration(
  projectRoot: string,
  sourceDir: string,
  manifest: Manifest,
  opts: Options,
): Promise<number> {
  const prefix = opts.dryRun ? '[DRY RUN] ' : '';
  log(`${prefix}Uninstalling integration components...\n`, opts.quiet);

  // Build target lists dynamically from manifest
  const filesToRemove: string[] = [];
  const dirsToRemove: string[] = [];

  // Standalone files
  if (manifest.files.standalone) {
    for (const entry of manifest.files.standalone) {
      const target = entry.target;
      // If the target has a parent dir inside .claude/skills/ or .claude/teams/, track the dir
      const parentDir = path.dirname(target);
      if (parentDir !== '.' && (
        parentDir.startsWith('.claude/skills/') ||
        parentDir.startsWith('.claude/teams/') ||
        parentDir.startsWith('.claude/commands/')
      ) && !parentDir.endsWith('/sc') && !parentDir.endsWith('/wrap') && !parentDir.endsWith('/gsd') && !parentDir.endsWith('/commands')) {
        // Single-file skill/team dirs — track parent for cleanup
        if (!dirsToRemove.includes(parentDir)) {
          dirsToRemove.push(parentDir);
        }
      } else {
        filesToRemove.push(target);
      }
    }
  }

  // Skill directories (multi-file)
  if (manifest.files.skills) {
    for (const entry of manifest.files.skills) {
      dirsToRemove.push(entry.target);
    }
  }

  // Hook scripts
  if (manifest.files.hookScripts) {
    for (const entry of manifest.files.hookScripts) {
      filesToRemove.push(entry.target);
    }
  }

  // CLAUDE.md — warn but don't remove
  // (handled separately below)

  // Settings — handled separately (merge removal)
  // Extensions — handled separately (marker strip)

  // Integration config
  filesToRemove.push('.planning/skill-creator.json');

  let removed = 0;
  let notFound = 0;
  let skipped = 0;

  // Remove directories
  for (const dir of dirsToRemove) {
    const fullPath = path.join(projectRoot, dir);
    assertContained(fullPath, projectRoot);
    if (existsSync(fullPath)) {
      if (!opts.dryRun) {
        await fs.rm(fullPath, { recursive: true, force: true });
      }
      log(`  ${pc.red('-')} removed:   ${dir}/`, opts.quiet);
      removed++;
    } else {
      log(`  ${pc.dim('.')} not found: ${dir}/`, opts.quiet);
      notFound++;
    }
  }

  // Remove standalone files
  for (const file of filesToRemove) {
    const fullPath = path.join(projectRoot, file);
    assertContained(fullPath, projectRoot);
    if (existsSync(fullPath)) {
      if (!opts.dryRun) {
        await fs.unlink(fullPath);
      }
      log(`  ${pc.red('-')} removed:   ${file}`, opts.quiet);
      removed++;
    } else {
      log(`  ${pc.dim('.')} not found: ${file}`, opts.quiet);
      notFound++;
    }
  }

  // Strip extension markers from target files (don't delete the files)
  if (manifest.files.extensions) {
    for (const entry of manifest.files.extensions) {
      const targetPath = path.join(projectRoot, entry.target);
      assertContained(targetPath, projectRoot);
      const marker = entry.marker!;
      const startMarker = `<!-- ${marker} START -->`;
      const endMarker = `<!-- ${marker} END -->`;

      const content = await readFileSafe(targetPath);
      if (content !== null) {
        const startIdx = content.indexOf(startMarker);
        const endIdx = content.indexOf(endMarker);
        if (startIdx !== -1 && endIdx !== -1) {
          const before = content.substring(0, startIdx);
          const after = content.substring(endIdx + endMarker.length);
          const cleaned = (before + after).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
          if (!opts.dryRun) {
            await fs.writeFile(targetPath, cleaned);
          }
          log(`  ${pc.red('-')} stripped:  ${entry.target} [${marker}]`, opts.quiet);
          removed++;
        } else {
          log(`  ${pc.dim('.')} no marker: ${entry.target} [${marker}]`, opts.quiet);
          notFound++;
        }
      }
    }
  }

  // Remove merged hooks from settings.json
  if (manifest.files.settings || manifest.files.settingsHooks) {
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    const settingsContent = await readFileSafe(settingsPath);
    if (settingsContent !== null) {
      try {
        const settings = JSON.parse(settingsContent) as Record<string, unknown>;
        let changed = false;

        // Collect all hook commands we installed
        const ourCommands = new Set<string>();
        for (const settingsEntry of [manifest.files.settings, manifest.files.settingsHooks]) {
          if (!settingsEntry) continue;
          const srcPath = path.join(sourceDir, settingsEntry.source);
          const srcContent = await readFileSafe(srcPath);
          if (srcContent) {
            try {
              const src = JSON.parse(srcContent) as Record<string, unknown>;
              const srcHooks = src.hooks as Record<string, Array<{ hooks?: Array<{ command: string }> }>> | undefined;
              if (srcHooks) {
                for (const groups of Object.values(srcHooks)) {
                  for (const group of groups) {
                    const cmd = group.hooks?.[0]?.command;
                    if (cmd) ourCommands.add(cmd);
                  }
                }
              }
            } catch { /* ignore parse errors */ }
          }
        }

        // Remove our hooks from target settings
        const targetHooks = settings.hooks as Record<string, Array<{ hooks?: Array<{ command: string }> }>> | undefined;
        if (targetHooks) {
          for (const [event, groups] of Object.entries(targetHooks)) {
            const filtered = groups.filter(
              (group: { hooks?: Array<{ command: string }> }) => {
                const cmd = group.hooks?.[0]?.command;
                return !cmd || !ourCommands.has(cmd);
              },
            );
            if (filtered.length !== groups.length) {
              changed = true;
              if (filtered.length === 0) {
                delete targetHooks[event];
              } else {
                targetHooks[event] = filtered;
              }
            }
          }
          // If hooks object is now empty, remove it
          if (Object.keys(targetHooks).length === 0) {
            delete settings.hooks;
          }
        }

        // Remove statusLine if it was ours
        if ((settings as Record<string, unknown>).statusLine) {
          const settingsEntry = manifest.files.settings;
          if (settingsEntry) {
            const srcPath = path.join(sourceDir, settingsEntry.source);
            const srcContent = await readFileSafe(srcPath);
            if (srcContent) {
              try {
                const src = JSON.parse(srcContent) as Record<string, unknown>;
                if (src.statusLine) {
                  delete (settings as Record<string, unknown>).statusLine;
                  changed = true;
                }
              } catch { /* ignore */ }
            }
          }
        }

        if (changed) {
          if (!opts.dryRun) {
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n');
          }
          log(`  ${pc.red('-')} cleaned:   .claude/settings.json (hooks removed)`, opts.quiet);
          removed++;
        } else {
          log(`  ${pc.dim('=')} current:   .claude/settings.json (no our hooks found)`, opts.quiet);
        }
      } catch {
        log(`  ${pc.yellow('⚠')} skipped:   .claude/settings.json (invalid JSON)`, opts.quiet);
      }
    }
  }

  // Remove git hook (only if it's ours)
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');
  const hookContent = await readFileSafe(hookPath);
  if (hookContent !== null) {
    if (hookContent.includes('GSD skill-creator post-commit hook')) {
      if (!opts.dryRun) {
        await fs.unlink(hookPath);
      }
      log(`  ${pc.red('-')} removed:   .git/hooks/post-commit`, opts.quiet);
      removed++;
    } else {
      log(`  ${pc.yellow('~')} skipped:   .git/hooks/post-commit (not ours)`, opts.quiet);
      skipped++;
    }
  } else {
    log(`  ${pc.dim('.')} not found: .git/hooks/post-commit`, opts.quiet);
    notFound++;
  }

  // CLAUDE.md warning
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    log(`  ${pc.yellow('~')} warning:   CLAUDE.md was installed by gsd-init — review manually`, opts.quiet);
  }

  log('', opts.quiet);
  log(`  Preserved: .planning/patterns/ (observation data)`, opts.quiet);
  log('', opts.quiet);
  log(`${prefix}Uninstall complete: ${removed} removed, ${notFound} not found, ${skipped} skipped`, opts.quiet);

  return 0;
}

// --- Main entry point ---

export interface GsdInitOverrides {
  sourceDir?: string;
}

export async function gsdInitCommand(args: string[], overrides?: GsdInitOverrides): Promise<number> {
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const quiet = args.includes('--quiet');
  const uninstall = args.includes('--uninstall');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
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
  Installs all GSD-related skills, agents, commands, hooks, teams,
  settings, and integration config into the current project's .claude/
  directory. Driven by project-claude/manifest.json.

  Files are installed with SHA256 idempotency — unchanged files are
  skipped. Use --force to overwrite files that have been modified.

Examples:
  skill-creator gsd-init              Install all components
  skill-creator gsd-init --dry-run    Preview installation
  skill-creator gsd-init --force      Overwrite changed files
  skill-creator gsd-init --uninstall  Remove integration
`);
    return 0;
  }

  const projectRoot = process.cwd();
  const sourceDir = overrides?.sourceDir ?? resolveSourceDir();
  const claudeDir = path.join(projectRoot, '.claude');
  const opts: Options = { dryRun, force, quiet };
  const stats: Stats = { installed: 0, updated: 0, current: 0, warnings: 0 };

  // Verify .claude/ exists
  if (!existsSync(claudeDir)) {
    p.log.error('.claude/ directory not found. Initialize Claude Code first (run claude in this directory).');
    return 1;
  }

  // Read manifest
  const manifestPath = path.join(sourceDir, 'manifest.json');
  const manifestContent = await readFileSafe(manifestPath);
  if (!manifestContent) {
    p.log.error(`manifest.json not found at ${manifestPath}`);
    return 1;
  }

  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch {
    p.log.error('manifest.json is not valid JSON');
    return 1;
  }

  if (uninstall) {
    return uninstallIntegration(projectRoot, sourceDir, manifest, opts);
  }

  const prefix = dryRun ? pc.yellow('[DRY RUN] ') : '';
  console.log(`${prefix}Installing GSD skill-creator integration...\n`);

  // Install standalone files
  if (manifest.files.standalone) {
    console.log('Standalone files:');
    for (const entry of manifest.files.standalone) {
      await installStandalone(entry, sourceDir, projectRoot, opts, stats);
    }
    console.log('');
  }

  // Install skill directories
  if (manifest.files.skills) {
    console.log('Skills:');
    for (const entry of manifest.files.skills) {
      await installSkillDir(entry, sourceDir, projectRoot, opts, stats);
    }
    console.log('');
  }

  // Install hook scripts (with executable permissions)
  if (manifest.files.hookScripts) {
    console.log('Hook scripts:');
    for (const entry of manifest.files.hookScripts) {
      await installHookScript(entry, sourceDir, projectRoot, opts, stats);
    }
    console.log('');
  }

  // Install CLAUDE.md (with legacy backup)
  if (manifest.files.claudeMd) {
    console.log('CLAUDE.md:');
    await installClaudeMd(manifest.files.claudeMd, sourceDir, projectRoot, opts, stats);
    console.log('');
  }

  // Install extensions
  if (manifest.files.extensions) {
    console.log('Extensions:');
    for (const entry of manifest.files.extensions) {
      await installExtension(entry, sourceDir, projectRoot, opts, stats);
    }
    console.log('');
  }

  // Install settings
  if (manifest.files.settings) {
    console.log('Settings:');
    await installSettings(manifest.files.settings, sourceDir, projectRoot, opts, stats);
    console.log('');
  }

  // Install settings hooks
  if (manifest.files.settingsHooks) {
    console.log('Settings hooks:');
    await installSettings(manifest.files.settingsHooks, sourceDir, projectRoot, opts, stats);
    console.log('');
  }

  // Install integration config
  console.log('Integration:');
  await installIntegrationConfig(projectRoot, opts, stats);
  console.log('');

  // Install patterns directory
  console.log('Patterns:');
  await installPatternsDir(projectRoot, opts, stats);
  await updateGitignore(projectRoot, opts, stats);
  console.log('');

  // Install git hook
  console.log('Git hooks:');
  await installGitHook(sourceDir, projectRoot, opts, stats);
  console.log('');

  // Summary
  console.log('─'.repeat(50));
  console.log(
    `Installed: ${pc.green(String(stats.installed))} | ` +
    `Updated: ${pc.cyan(String(stats.updated))} | ` +
    `Current: ${pc.dim(String(stats.current))} | ` +
    `Warnings: ${stats.warnings > 0 ? pc.yellow(String(stats.warnings)) : String(stats.warnings)}`,
  );

  if (dryRun) {
    console.log(`\n${pc.yellow('(Dry run — no files were modified)')}`);
  }

  // Validation (skip during dry-run)
  if (!dryRun) {
    console.log('');
    const valid = validateInstallation(projectRoot, quiet);
    if (!valid) {
      console.log('\nSome components are missing. Run without --dry-run to install.');
    }
    if (stats.warnings > 0 || !valid) {
      return 1;
    }
  } else {
    if (stats.warnings > 0) {
      return 1;
    }
  }

  return 0;
}

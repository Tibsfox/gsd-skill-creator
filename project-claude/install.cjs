#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- CLI flags ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const quiet = args.includes('--quiet');
const uninstall = args.includes('--uninstall');

// --- Paths ---
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = __dirname;
const claudeDir = path.join(projectRoot, '.claude');

// --- Counters ---
const stats = { installed: 0, updated: 0, current: 0, warnings: 0 };

// --- Helpers ---
function log(msg) {
  if (!quiet) console.log(msg);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
  stats.warnings++;
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    if (!dryRun) fs.mkdirSync(dir, { recursive: true });
  }
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// --- Standalone file install ---
function installStandalone(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);

  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Source missing: ${entry.source}`);
    return;
  }

  const targetContent = readFileSafe(targetPath);

  if (targetContent === null) {
    // Target missing — install
    if (!dryRun) {
      ensureDir(targetPath);
      fs.writeFileSync(targetPath, sourceContent);
    }
    log(`  + installed: ${entry.target}`);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    // Already current
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
  } else if (force) {
    // Differs but --force
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
    }
    log(`  ↻ updated:   ${entry.target}`);
    stats.updated++;
  } else {
    warn(`differs: ${entry.target} (use --force to overwrite)`);
  }
}

// --- Extension install ---
function installExtension(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  const marker = entry.marker;

  const fragmentContent = readFileSafe(sourcePath);
  if (fragmentContent === null) {
    warn(`Extension source missing: ${entry.source}`);
    return;
  }

  const targetContent = readFileSafe(targetPath);
  if (targetContent === null) {
    warn(`Extension target missing: ${entry.target} (GSD not installed?)`);
    return;
  }

  const startMarker = `<!-- ${marker} START -->`;
  const endMarker = `<!-- ${marker} END -->`;
  const startIdx = targetContent.indexOf(startMarker);
  const endIdx = targetContent.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1) {
    // Markers found — check if content matches
    const existingBlock = targetContent.substring(startIdx, endIdx + endMarker.length);
    const newBlock = fragmentContent.trim();

    if (sha256(existingBlock) === sha256(newBlock)) {
      if (!quiet) log(`  = current:   ${entry.target} [${marker}]`);
      stats.current++;
    } else {
      // Replace between markers
      const before = targetContent.substring(0, startIdx);
      const after = targetContent.substring(endIdx + endMarker.length);
      const updated = before + newBlock + after;
      if (!dryRun) {
        fs.writeFileSync(targetPath, updated);
      }
      log(`  ↻ updated:   ${entry.target} [${marker}]`);
      stats.updated++;
    }
  } else {
    // Markers not found — check if content already exists without markers
    // Extract inner content (between marker comments) from the fragment
    const innerStart = fragmentContent.indexOf(startMarker);
    const innerEnd = fragmentContent.indexOf(endMarker);
    let innerContent = '';
    if (innerStart !== -1 && innerEnd !== -1) {
      innerContent = fragmentContent.substring(innerStart + startMarker.length, innerEnd).trim();
    }

    // Check if the core content (first significant XML tag) already exists in target
    const tagMatch = innerContent.match(/<(\w+)[\s>]/);
    const hasContent = tagMatch && targetContent.includes(`<${tagMatch[1]}`);

    if (hasContent) {
      if (!quiet) log(`  = present:   ${entry.target} [${marker}] (content exists, no markers)`);
      stats.current++;
    } else {
      // Append fragment
      const newContent = targetContent.trimEnd() + '\n\n' + fragmentContent.trim() + '\n';
      if (!dryRun) {
        fs.writeFileSync(targetPath, newContent);
      }
      log(`  + installed: ${entry.target} [${marker}]`);
      stats.installed++;
    }
  }
}

// --- Settings merge ---
function installSettings(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);

  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Settings source missing: ${entry.source}`);
    return;
  }

  let sourceSettings;
  try {
    sourceSettings = JSON.parse(sourceContent);
  } catch {
    warn(`Settings source is not valid JSON: ${entry.source}`);
    return;
  }

  const targetContent = readFileSafe(targetPath);
  let targetSettings;

  if (targetContent === null) {
    // No existing settings — copy as-is
    if (!dryRun) {
      ensureDir(targetPath);
      fs.writeFileSync(targetPath, JSON.stringify(sourceSettings, null, 2) + '\n');
    }
    log(`  + installed: ${entry.target}`);
    stats.installed++;
    return;
  }

  try {
    targetSettings = JSON.parse(targetContent);
  } catch {
    warn(`Existing settings not valid JSON: ${entry.target}`);
    return;
  }

  // Merge hook arrays
  let changed = false;
  if (sourceSettings.hooks) {
    if (!targetSettings.hooks) targetSettings.hooks = {};

    for (const [event, sourceHookGroups] of Object.entries(sourceSettings.hooks)) {
      if (!targetSettings[event]) {
        // Ensure we work on targetSettings.hooks[event]
      }
      if (!targetSettings.hooks[event]) {
        targetSettings.hooks[event] = [];
      }

      for (const sourceGroup of sourceHookGroups) {
        const sourceCmd = sourceGroup.hooks?.[0]?.command;
        if (!sourceCmd) continue;

        // Check if this hook command already exists in target
        const exists = targetSettings.hooks[event].some(group =>
          group.hooks?.some(h => h.command === sourceCmd)
        );

        if (!exists) {
          targetSettings.hooks[event].push(sourceGroup);
          changed = true;
        }
      }
    }
  }

  if (changed) {
    if (!dryRun) {
      fs.writeFileSync(targetPath, JSON.stringify(targetSettings, null, 2) + '\n');
    }
    log(`  ↻ updated:   ${entry.target} (hooks merged)`);
    stats.updated++;
  } else {
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
  }
}

// --- Integration config install ---
function installIntegrationConfig() {
  const targetPath = path.join(projectRoot, '.planning', 'skill-creator.json');

  if (fs.existsSync(targetPath)) {
    log('  = preserved: .planning/skill-creator.json (user config)');
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
      wrapper_commands: true
    },
    token_budget: {
      max_percent: 5,
      warn_at_percent: 4
    },
    observation: {
      retention_days: 90,
      max_entries: 1000,
      capture_corrections: true
    },
    suggestions: {
      min_occurrences: 3,
      cooldown_days: 7,
      auto_dismiss_after_days: 30
    }
  };

  if (!dryRun) {
    ensureDir(targetPath);
    fs.writeFileSync(targetPath, JSON.stringify(defaultConfig, null, 2) + '\n');
  }
  log('  + installed: .planning/skill-creator.json');
  stats.installed++;
}

// --- Patterns directory install ---
function installPatternsDir() {
  const targetDir = path.join(projectRoot, '.planning', 'patterns');

  if (fs.existsSync(targetDir)) {
    log('  = current:   .planning/patterns/');
    stats.current++;
    return;
  }

  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  log('  + installed: .planning/patterns/');
  stats.installed++;
}

// --- Gitignore update ---
function updateGitignore() {
  const targetPath = path.join(projectRoot, '.gitignore');
  const content = readFileSafe(targetPath) || '';

  // Check if .planning/ is already a blanket ignore (covers patterns)
  const lines = content.split('\n');
  const hasBlanketPlanning = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.planning/' || trimmed === '.planning';
  });

  if (hasBlanketPlanning) {
    log('  = current:   .gitignore (.planning/ covers patterns)');
    stats.current++;
    return;
  }

  // Check if .planning/patterns/ is explicitly listed
  const hasPatternsEntry = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.planning/patterns/' || trimmed === '.planning/patterns';
  });

  if (hasPatternsEntry) {
    log('  = current:   .gitignore (.planning/patterns/)');
    stats.current++;
    return;
  }

  // Append entry
  if (!dryRun) {
    const addition = '\n# Skill-creator observation data\n.planning/patterns/\n';
    fs.writeFileSync(targetPath, content.trimEnd() + addition);
  }
  log('  + updated:   .gitignore (.planning/patterns/ added)');
  stats.updated++;
}

// --- Git hook install ---
function installGitHook() {
  const sourcePath = path.join(sourceDir, 'hooks', 'post-commit');
  const targetPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');

  // Read source hook
  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn('Hook source missing: hooks/post-commit');
    return;
  }

  // Check for .git directory
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    warn('Not a git repository (.git/ not found)');
    return;
  }

  // Ensure .git/hooks/ exists
  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    if (!dryRun) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
  }

  // Check existing target
  const targetContent = readFileSafe(targetPath);

  if (targetContent !== null) {
    // Target exists — compare
    if (sha256(sourceContent) === sha256(targetContent)) {
      log('  = current:   .git/hooks/post-commit');
      stats.current++;
      return;
    }

    // Different content — backup and update
    const timestamp = Date.now();
    const backupPath = targetPath + '.bak.' + timestamp;
    if (!dryRun) {
      fs.writeFileSync(backupPath, targetContent);
    }
    log(`  ~ backup:    .git/hooks/post-commit.bak.${timestamp}`);

    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
      fs.chmodSync(targetPath, 0o755);
    }
    log('  ↻ updated:   .git/hooks/post-commit');
    stats.updated++;
  } else {
    // Target does not exist — fresh install
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
      fs.chmodSync(targetPath, 0o755);
    }
    log('  + installed: .git/hooks/post-commit');
    stats.installed++;
  }
}

// --- Validation ---
function validateInstallation() {
  log('Validation:');

  const checks = [
    // Slash commands
    { name: 'sc:start', path: '.claude/commands/sc/start.md' },
    { name: 'sc:status', path: '.claude/commands/sc/status.md' },
    { name: 'sc:suggest', path: '.claude/commands/sc/suggest.md' },
    { name: 'sc:observe', path: '.claude/commands/sc/observe.md' },
    { name: 'sc:digest', path: '.claude/commands/sc/digest.md' },
    { name: 'sc:wrap', path: '.claude/commands/sc/wrap.md' },
    // Wrapper commands
    { name: 'wrap:execute', path: '.claude/commands/wrap/execute.md' },
    { name: 'wrap:verify', path: '.claude/commands/wrap/verify.md' },
    { name: 'wrap:plan', path: '.claude/commands/wrap/plan.md' },
    { name: 'wrap:phase', path: '.claude/commands/wrap/phase.md' },
    // Agent
    { name: 'observer agent', path: '.claude/agents/observer.md' },
    // Dashboard
    { name: 'gsd-dashboard', path: '.claude/commands/gsd-dashboard.md' },
    // Config
    { name: 'integration config', path: '.planning/skill-creator.json' },
  ];

  let ok = 0;
  let missing = 0;

  for (const check of checks) {
    const fullPath = path.join(projectRoot, check.path);
    if (fs.existsSync(fullPath)) {
      log(`  ✓ ${check.name}`);
      ok++;
    } else {
      log(`  ✗ ${check.name} — missing: ${check.path}`);
      missing++;
    }
  }

  // Check patterns directory
  const patternsDir = path.join(projectRoot, '.planning', 'patterns');
  if (fs.existsSync(patternsDir)) {
    log('  ✓ patterns directory');
    ok++;
  } else {
    log('  ✗ patterns directory — missing: .planning/patterns/');
    missing++;
  }

  // Check git hook
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');
  if (fs.existsSync(hookPath)) {
    log('  ✓ post-commit hook');
    ok++;
  } else {
    log('  ✗ post-commit hook — missing: .git/hooks/post-commit');
    missing++;
  }

  // Check .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const gitignoreContent = readFileSafe(gitignorePath) || '';
  if (gitignoreContent.includes('.planning/patterns/') || gitignoreContent.includes('.planning/')) {
    log('  ✓ .gitignore (patterns excluded)');
    ok++;
  } else {
    log('  ✗ .gitignore — .planning/patterns/ not excluded');
    missing++;
  }

  log('');
  log(`Validation: ${ok} ok, ${missing} missing`);

  return missing === 0;
}

// --- Uninstall integration ---
function uninstallIntegration() {
  const prefix = dryRun ? '[DRY RUN] ' : '';
  log(`${prefix}Uninstalling integration components...\n`);

  const integrationTargets = {
    dirs: [
      '.claude/commands/sc',
      '.claude/commands/wrap',
    ],
    files: [
      '.claude/agents/observer.md',
      '.planning/skill-creator.json',
    ],
  };

  let removed = 0;
  let notFound = 0;
  let skipped = 0;

  // Remove directories
  for (const dir of integrationTargets.dirs) {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      if (!dryRun) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      log(`  - removed:   ${dir}/`);
      removed++;
    } else {
      log(`  . not found: ${dir}/`);
      notFound++;
    }
  }

  // Remove files
  for (const file of integrationTargets.files) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      if (!dryRun) {
        fs.unlinkSync(fullPath);
      }
      log(`  - removed:   ${file}`);
      removed++;
    } else {
      log(`  . not found: ${file}`);
      notFound++;
    }
  }

  // Remove git hook (only if it's ours)
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');
  const hookContent = readFileSafe(hookPath);
  if (hookContent !== null) {
    if (hookContent.includes('GSD skill-creator post-commit hook')) {
      if (!dryRun) {
        fs.unlinkSync(hookPath);
      }
      log('  - removed:   .git/hooks/post-commit');
      removed++;
    } else {
      log('  ~ skipped:   .git/hooks/post-commit (not ours)');
      skipped++;
    }
  } else {
    log('  . not found: .git/hooks/post-commit');
    notFound++;
  }

  log('');
  log('  Preserved: .planning/patterns/ (observation data)');

  log('');
  log(`${prefix}Uninstall complete: ${removed} removed, ${notFound} not found, ${skipped} skipped`);
}

// --- Main ---
function main() {
  // Verify .claude/ exists
  if (!fs.existsSync(claudeDir)) {
    console.error('Error: .claude/ directory not found. Install GSD first.');
    process.exit(1);
  }

  // Read manifest
  const manifestPath = path.join(sourceDir, 'manifest.json');
  const manifestContent = readFileSafe(manifestPath);
  if (!manifestContent) {
    console.error('Error: manifest.json not found in project-claude/');
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch {
    console.error('Error: manifest.json is not valid JSON');
    process.exit(1);
  }

  if (uninstall) {
    uninstallIntegration();
    return;
  }

  const prefix = dryRun ? '[DRY RUN] ' : '';
  log(`${prefix}Installing project-claude files...\n`);

  // Install standalone files
  if (manifest.files.standalone) {
    log('Standalone files:');
    for (const entry of manifest.files.standalone) {
      installStandalone(entry);
    }
    log('');
  }

  // Install extensions
  if (manifest.files.extensions) {
    log('Extensions:');
    for (const entry of manifest.files.extensions) {
      installExtension(entry);
    }
    log('');
  }

  // Install settings
  if (manifest.files.settings) {
    log('Settings:');
    installSettings(manifest.files.settings);
    log('');
  }

  // Install integration config
  log('Integration:');
  installIntegrationConfig();
  log('');

  // Install patterns directory
  log('Patterns:');
  installPatternsDir();
  updateGitignore();
  log('');

  // Install git hook
  log('Git hooks:');
  installGitHook();
  log('');

  // Summary
  const total = stats.installed + stats.updated + stats.current + stats.warnings;
  log('─'.repeat(50));
  log(`Installed: ${stats.installed} | Updated: ${stats.updated} | Current: ${stats.current} | Warnings: ${stats.warnings}`);

  if (dryRun) {
    log('\n(Dry run — no files were modified)');
  }

  // Validation (skip during dry-run since nothing was actually installed)
  if (!dryRun) {
    log('');
    const valid = validateInstallation();
    if (!valid) {
      log('\nSome components are missing. Run without --dry-run to install.');
    }
    if (stats.warnings > 0 || !valid) {
      process.exit(1);
    }
  } else {
    if (stats.warnings > 0) {
      process.exit(1);
    }
  }
}

main();

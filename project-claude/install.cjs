#!/usr/bin/env node
'use strict';

// v1.49.585 C01: signal to the self-mod-guard hook (.claude/hooks/self-mod-guard.js)
// that this process is the legitimate install.cjs caller — its writes into
// .claude/skills|agents|hooks/ are sanctioned. The hook checks this env var
// in addition to SC_SELF_MOD=1 and npm_lifecycle_event === 'install-project-claude'.
//
// See: .planning/missions/v1-49-585-concerns-cleanup/work/specs/hook-conventions.md §5
process.env.SC_INSTALL_CALLER = 'project-claude';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- CLI flags ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const quiet = args.includes('--quiet');
const uninstall = args.includes('--uninstall');
const isGlobal = args.includes('--global');
const isLocal = args.includes('--local');
const showHelp = args.includes('--help') || args.includes('-h');

// --- Help ---
if (showHelp) {
  console.log(`
gsd-skill-creator — Install project-specific Claude Code skills, agents, and hooks

Usage:
  npx gsd-skill-creator             Install to current project (./.claude/)
  npx gsd-skill-creator --global    Install to global (~/.claude/)
  npx gsd-skill-creator --local     Install to current project (./.claude/)
  npx gsd-skill-creator --dry-run   Preview changes without writing
  npx gsd-skill-creator --force     Overwrite modified files
  npx gsd-skill-creator --uninstall Remove installed components
  npx gsd-skill-creator --quiet     Suppress output
  npx gsd-skill-creator --help      Show this help

Installs: skills, agents, commands, hooks, settings, and CLAUDE.md.
Existing GSD installation required (.claude/ directory must exist).
`);
  process.exit(0);
}

// --- Paths ---
// When run via npx, __dirname is inside node_modules/.cache or a temp dir.
// sourceDir always points to project-claude/ (where this script lives).
// projectRoot depends on scope:
//   --global: install to $HOME (targets ~/.claude/)
//   --local (default): install to cwd (targets ./.claude/)
const sourceDir = __dirname;
const projectRoot = isGlobal
  ? require('os').homedir()
  : (isLocal ? process.cwd() : (() => {
      // Auto-detect: if we're inside node_modules, target cwd. Otherwise target parent.
      if (__dirname.includes('node_modules') || __dirname.includes('.npm')) {
        return process.cwd();
      }
      return path.resolve(__dirname, '..');
    })());
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

function ensureDirPath(dirPath) {
  if (!fs.existsSync(dirPath)) {
    if (!dryRun) fs.mkdirSync(dirPath, { recursive: true });
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

// --- Auto-discovery ---
// block shape:
//   { "kind": "agents",  "source_dir": "agents",  "target_dir": ".claude/agents",  "pattern": "*.md" }
//   { "kind": "skills",  "source_dir": "skills",  "target_dir": ".claude/skills",  "pattern": "*/SKILL.md" }
// Skips any file already listed in manifest.files.standalone[] or .skills[]
// to avoid double-installing.
function installAutoDiscover(block, manifest) {
  const sourceBase = path.join(sourceDir, block.source_dir);
  if (!fs.existsSync(sourceBase)) {
    warn(`Auto-discover source missing: ${block.source_dir}`);
    return;
  }

  // Build set of already-claimed source paths from the manifest.
  // Include hookScripts so auto-discovery of hook/*.cjs files doesn't
  // double-install entries already listed there.
  const claimed = new Set();
  for (const s of (manifest.files.standalone || [])) claimed.add(s.source);
  for (const s of (manifest.files.skills || [])) claimed.add(s.source);
  for (const s of (manifest.files.hookScripts || [])) claimed.add(s.source);

  // Honor explicit exclude list (e.g. skip `.test.ts` files that live
  // alongside hook sources).
  const exclude = new Set(block.exclude || []);

  const patterns = Array.isArray(block.pattern) ? block.pattern : [block.pattern];
  const seen = new Set();
  const candidates = [];
  for (const p of patterns) {
    for (const rel of enumerateMatches(sourceBase, block.source_dir, p)) {
      if (seen.has(rel)) continue;
      seen.add(rel);
      candidates.push(rel);
    }
  }

  const handler = block.kind === 'hook-scripts' ? installHookScript : installStandalone;
  let found = 0;
  for (const rel of candidates) {
    if (claimed.has(rel)) continue;
    if (exclude.has(rel)) continue;
    found++;
    const entry = {
      source: rel,
      target: path.join(block.target_dir, path.relative(block.source_dir, rel)),
      description: `[auto-discovered from ${block.source_dir}]`,
    };
    handler(entry);
  }
  if (found === 0) log(`  = ${block.kind}: no new files to discover`);
}

// Return source-dir-relative paths matching pattern.
// Supported patterns: "*.md" / "*.cjs" / "*.js" / "*.sh" (flat),
//                     "*/SKILL.md" (one level deep).
function enumerateMatches(sourceBase, sourceDirRel, pattern) {
  const out = [];
  const flatExt = pattern.match(/^\*\.([a-zA-Z0-9]+)$/);
  if (flatExt) {
    const ext = '.' + flatExt[1];
    for (const name of fs.readdirSync(sourceBase)) {
      const full = path.join(sourceBase, name);
      if (fs.statSync(full).isFile() && name.endsWith(ext)) {
        out.push(path.join(sourceDirRel, name));
      }
    }
  } else if (pattern === '*/SKILL.md') {
    for (const name of fs.readdirSync(sourceBase)) {
      const skillDir = path.join(sourceBase, name);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (fs.statSync(skillDir).isDirectory() && fs.existsSync(skillFile)) {
        out.push(path.join(sourceDirRel, name, 'SKILL.md'));
      }
    }
  } else {
    warn(`Unsupported auto-discover pattern: ${pattern}`);
  }
  return out;
}

// --- Skill directory install ---
function installSkillDir(entry) {
  const sourceBase = path.join(sourceDir, entry.source);
  const targetBase = path.join(projectRoot, entry.target);

  if (!fs.existsSync(sourceBase)) {
    warn(`Skill source directory missing: ${entry.source}`);
    return;
  }

  // Ensure target directory exists
  ensureDirPath(targetBase);

  const files = entry.files || [];
  let skillInstalled = 0;
  let skillCurrent = 0;

  for (const relFile of files) {
    const sourcePath = path.join(sourceBase, relFile);
    const targetPath = path.join(targetBase, relFile);

    const sourceContent = readFileSafe(sourcePath);
    if (sourceContent === null) {
      warn(`Skill file missing: ${entry.source}/${relFile}`);
      continue;
    }

    const targetContent = readFileSafe(targetPath);

    if (targetContent === null) {
      if (!dryRun) {
        ensureDir(targetPath);
        fs.writeFileSync(targetPath, sourceContent);
      }
      log(`  + installed: ${entry.target}/${relFile}`);
      stats.installed++;
      skillInstalled++;
    } else if (sha256(sourceContent) === sha256(targetContent)) {
      if (!quiet) log(`  = current:   ${entry.target}/${relFile}`);
      stats.current++;
      skillCurrent++;
    } else if (force) {
      if (!dryRun) {
        fs.writeFileSync(targetPath, sourceContent);
      }
      log(`  ↻ updated:   ${entry.target}/${relFile}`);
      stats.updated++;
      skillInstalled++;
    } else {
      warn(`differs: ${entry.target}/${relFile} (use --force to overwrite)`);
    }
  }

  if (skillInstalled === 0 && skillCurrent === files.length && !quiet) {
    // All files current — summary already logged per-file
  }
}

// --- Cartridge directory install (recursive) ---
function walkDirRel(baseDir, relBase = '') {
  const out = [];
  const absDir = path.join(baseDir, relBase);
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const rel = relBase ? path.join(relBase, e.name) : e.name;
    if (e.isDirectory()) {
      out.push(...walkDirRel(baseDir, rel));
    } else if (e.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

function installCartridgeDir(entry) {
  const sourceBase = path.join(sourceDir, entry.source);
  const targetBase = path.join(projectRoot, entry.target);

  if (!fs.existsSync(sourceBase)) {
    warn(`Cartridge source directory missing: ${entry.source}`);
    return;
  }

  ensureDirPath(targetBase);
  const files = walkDirRel(sourceBase);

  for (const rel of files) {
    const sourcePath = path.join(sourceBase, rel);
    const targetPath = path.join(targetBase, rel);
    const sourceContent = readFileSafe(sourcePath);
    if (sourceContent === null) {
      warn(`Cartridge file unreadable: ${entry.source}/${rel}`);
      continue;
    }
    const targetContent = readFileSafe(targetPath);
    if (targetContent === null) {
      if (!dryRun) {
        ensureDir(targetPath);
        fs.writeFileSync(targetPath, sourceContent);
      }
      log(`  + installed: ${entry.target}/${rel}`);
      stats.installed++;
    } else if (sha256(sourceContent) === sha256(targetContent)) {
      if (!quiet) log(`  = current:   ${entry.target}/${rel}`);
      stats.current++;
    } else if (force) {
      if (!dryRun) fs.writeFileSync(targetPath, sourceContent);
      log(`  ↻ updated:   ${entry.target}/${rel}`);
      stats.updated++;
    } else {
      warn(`differs: ${entry.target}/${rel} (use --force to overwrite)`);
    }
  }
}

// --- Hook script install (with chmod +x on Unix) ---
function chmodSafe(filePath, mode) {
  if (process.platform !== 'win32') {
    try { fs.chmodSync(filePath, mode); } catch { /* ignore on platforms without chmod */ }
  }
}

function installHookScript(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);

  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`Hook source missing: ${entry.source}`);
    return;
  }

  const targetContent = readFileSafe(targetPath);

  if (targetContent === null) {
    if (!dryRun) {
      ensureDir(targetPath);
      fs.writeFileSync(targetPath, sourceContent);
      chmodSafe(targetPath, 0o755);
    }
    log(`  + installed: ${entry.target} (executable)`);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    // Ensure executable even if content matches
    if (!dryRun) {
      try { chmodSafe(targetPath, 0o755); } catch { /* ignore */ }
    }
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
  } else if (force) {
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
      chmodSafe(targetPath, 0o755);
    }
    log(`  ↻ updated:   ${entry.target} (executable)`);
    stats.updated++;
  } else {
    warn(`differs: ${entry.target} (use --force to overwrite)`);
  }
}

// --- CLAUDE.md install (with legacy backup) ---
function installClaudeMd(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  const legacyThreshold = entry.legacyThreshold || 100;

  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) {
    warn(`CLAUDE.md source missing: ${entry.source}`);
    return;
  }

  const targetContent = readFileSafe(targetPath);

  if (targetContent === null) {
    // No existing CLAUDE.md — fresh install
    if (!dryRun) {
      ensureDir(targetPath);
      fs.writeFileSync(targetPath, sourceContent);
    }
    log(`  + installed: ${entry.target}`);
    stats.installed++;
    return;
  }

  // Check if content matches
  if (sha256(sourceContent) === sha256(targetContent)) {
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
    return;
  }

  // Content differs. CLAUDE.md is a template seed, not a managed file:
  // it's meant to be customized per project (live numbers, local sections).
  // Only overwrite on --force, matching the rest of the installer's policy.
  if (!force) {
    warn(`differs: ${entry.target} (use --force to overwrite)`);
    return;
  }

  // --force path: archive existing as legacy if large, then deploy source
  const lineCount = targetContent.split('\n').length;
  if (lineCount > legacyThreshold) {
    const legacyPath = path.join(projectRoot, 'CLAUDE.md.legacy');
    if (!fs.existsSync(legacyPath)) {
      if (!dryRun) {
        fs.writeFileSync(legacyPath, targetContent);
      }
      log(`  ~ backup:    CLAUDE.md.legacy (${lineCount} lines archived)`);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(targetPath, sourceContent);
  }
  log(`  ↻ updated:   ${entry.target} (slim version deployed)`);
  stats.updated++;
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

  // Merge non-hook top-level keys (e.g., statusLine)
  if (sourceSettings.statusLine && !targetSettings.statusLine) {
    targetSettings.statusLine = sourceSettings.statusLine;
    changed = true;
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
      chmodSafe(targetPath, 0o755);
    }
    log('  ↻ updated:   .git/hooks/post-commit');
    stats.updated++;
  } else {
    // Target does not exist — fresh install
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
      chmodSafe(targetPath, 0o755);
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
    // Agents
    { name: 'observer agent', path: '.claude/agents/observer.md' },
    { name: 'gsd-executor agent', path: '.claude/agents/gsd-executor.md' },
    { name: 'gsd-verifier agent', path: '.claude/agents/gsd-verifier.md' },
    { name: 'gsd-planner agent', path: '.claude/agents/gsd-planner.md' },
    // Skills
    { name: 'gsd-workflow skill', path: '.claude/skills/gsd-workflow/SKILL.md' },
    { name: 'skill-integration skill', path: '.claude/skills/skill-integration/SKILL.md' },
    { name: 'session-awareness skill', path: '.claude/skills/session-awareness/SKILL.md' },
    { name: 'security-hygiene skill', path: '.claude/skills/security-hygiene/SKILL.md' },
    // Hook scripts
    { name: 'session-state hook', path: '.claude/hooks/session-state.cjs' },
    { name: 'validate-commit hook', path: '.claude/hooks/validate-commit.cjs' },
    { name: 'phase-boundary-check hook', path: '.claude/hooks/phase-boundary-check.cjs' },
    // Dashboard
    { name: 'gsd-dashboard', path: '.claude/commands/gsd-dashboard.md' },
    // Config
    { name: 'integration config', path: '.planning/skill-creator.json' },
    // CLAUDE.md
    { name: 'CLAUDE.md', path: 'CLAUDE.md' },
    // Dogfood cartridge
    { name: 'gsd-skill-creator cartridge', path: '.claude/cartridges/gsd-skill-creator/cartridge.yaml' },
    // Core GSD cartridge
    { name: 'get-shit-done cartridge', path: '.claude/cartridges/get-shit-done/cartridge.yaml' },
    // Release engine cartridge
    { name: 'release-engine cartridge', path: '.claude/cartridges/release-engine/cartridge.yaml' },
    // Housekeeping cartridge
    { name: 'housekeeping cartridge', path: '.claude/cartridges/housekeeping/cartridge.yaml' },
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

  // Check hook scripts exist (executable check only on Unix)
  const hookScripts = [
    '.claude/hooks/session-state.cjs',
    '.claude/hooks/validate-commit.cjs',
    '.claude/hooks/phase-boundary-check.cjs',
  ];
  for (const hookScript of hookScripts) {
    const fullPath = path.join(projectRoot, hookScript);
    if (fs.existsSync(fullPath)) {
      if (process.platform === 'win32') {
        log(`  ✓ ${hookScript}`);
        ok++;
      } else {
        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          log(`  ✓ ${hookScript} (executable)`);
          ok++;
        } catch {
          log(`  ✗ ${hookScript} — not executable`);
          missing++;
        }
      }
    } else {
      log(`  ✗ ${hookScript} — missing`);
      missing++;
    }
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
      '.claude/skills/gsd-workflow',
      '.claude/skills/skill-integration',
      '.claude/skills/session-awareness',
      '.claude/skills/security-hygiene',
      '.claude/cartridges/gsd-skill-creator',
      '.claude/cartridges/get-shit-done',
      '.claude/cartridges/release-engine',
      '.claude/cartridges/housekeeping',
    ],
    files: [
      '.claude/agents/observer.md',
      '.claude/agents/gsd-executor.md',
      '.claude/agents/gsd-verifier.md',
      '.claude/agents/gsd-planner.md',
      '.claude/hooks/session-state.cjs',
      '.claude/hooks/validate-commit.cjs',
      '.claude/hooks/phase-boundary-check.cjs',
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
  // Show install target
  const scope = isGlobal ? 'GLOBAL' : 'LOCAL';
  log(`Target: ${projectRoot} (${scope})`);
  log(`Claude dir: ${claudeDir}`);
  log('');

  // Verify .claude/ exists, or create it
  if (!fs.existsSync(claudeDir)) {
    if (isGlobal || isLocal) {
      // When explicitly scoped, create .claude/ if missing
      if (!dryRun) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }
      log(`Created: ${claudeDir}`);
    } else {
      console.error('Error: .claude/ directory not found.');
      console.error('Run with --global to install to ~/.claude/ or --local to install to ./.claude/');
      console.error('Or install GSD first: npx get-shit-done-cc --claude --global');
      process.exit(1);
    }
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

  // Install skill directories
  if (manifest.files.skills) {
    log('Skills:');
    for (const entry of manifest.files.skills) {
      installSkillDir(entry);
    }
    log('');
  }

  // Auto-discover: enumerate agents + skills not listed in the manifest.
  // This lets new files under project-claude/agents/*.md and
  // project-claude/skills/<name>/SKILL.md flow to .claude/ without
  // editing manifest.json.
  if (manifest.files.autoDiscover) {
    log('Auto-discovery:');
    for (const block of manifest.files.autoDiscover) {
      installAutoDiscover(block, manifest);
    }
    log('');
  }

  // Install hook scripts (with executable permissions)
  if (manifest.files.hookScripts) {
    log('Hook scripts:');
    for (const entry of manifest.files.hookScripts) {
      installHookScript(entry);
    }
    log('');
  }

  // Install CLAUDE.md (with legacy backup)
  if (manifest.files.claudeMd) {
    log('CLAUDE.md:');
    installClaudeMd(manifest.files.claudeMd);
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

  // Install settings (primary settings.json)
  if (manifest.files.settings) {
    log('Settings:');
    installSettings(manifest.files.settings);
    log('');
  }

  // Install settings hooks (merge additional hook config)
  if (manifest.files.settingsHooks) {
    log('Settings hooks:');
    installSettings(manifest.files.settingsHooks);
    log('');
  }

  // Install cartridges (recursive directory copy)
  if (manifest.files.cartridges) {
    log('Cartridges:');
    for (const entry of manifest.files.cartridges) {
      installCartridgeDir(entry);
    }
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

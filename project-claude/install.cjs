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

// --only <target> (repeatable): when non-empty, only process per-file installs
// whose target path matches one of these values (forward-slash normalized).
// Section-level handlers (CLAUDE.md, extensions, settings, settingsHooks,
// integration config, patterns dir, gitignore, git hook, final validation)
// are skipped entirely in targeted mode.
const onlyTargets = (() => {
  const targets = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--only' && i + 1 < args.length) {
      targets.push(args[i + 1].replace(/\\/g, '/'));
      i++;
    }
  }
  return targets;
})();
const hasOnlyFilter = onlyTargets.length > 0;

// Normalize a target path to forward-slash form for --only comparison.
function normalizeTarget(t) {
  return t.replace(/\\/g, '/');
}

// Returns true if the given target (forward-slash normalized) matches the --only filter.
function matchesOnly(target) {
  if (!hasOnlyFilter) return true;
  const norm = normalizeTarget(target);
  return onlyTargets.some(t => t === norm);
}

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
  npx gsd-skill-creator --only <target>  Only deploy matching target(s); repeatable.
                         Target is a relative path like .claude/skills/team-control/SKILL.md.
                         Skips section-level handlers (CLAUDE.md, settings, git hook, etc.).
                         Combine with --force and/or --dry-run.
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
// SC_INSTALL_SOURCE_DIR overrides the project-claude source root — tests inject a
// synthetic manifest + sources here. Defaults to this script's own directory.
const sourceDir = process.env.SC_INSTALL_SOURCE_DIR
  ? path.resolve(process.env.SC_INSTALL_SOURCE_DIR)
  : __dirname;
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

// --- Path-traversal guard ---
// The install manifest is first-party, but a malformed or hostile entry.target
// must never let a write escape the project root. gsd-init.ts enforces the same
// invariant (assertContained); install.cjs now matches it. See INT-2.
function assertContained(absPath, root) {
  const normalizedRoot = path.resolve(root) + path.sep;
  const normalizedTarget = path.resolve(absPath);
  if (normalizedTarget !== path.resolve(root) && !normalizedTarget.startsWith(normalizedRoot)) {
    throw new Error(`Path traversal blocked: ${absPath} escapes ${root}`);
  }
}

// --- Install ledger (INT-3) ---
// Records every file this installer copies into .claude/ so --uninstall removes
// exactly what was installed (including auto-discovered files) instead of a
// hand-maintained hardcoded subset that drifts from the install surface. The
// ledger is persisted to LEDGER_REL; paths are project-root-relative + forward-slash.
const LEDGER_REL = '.claude/.skill-creator-install.json';
const ledgerFiles = new Set();

function recordManaged(targetPath) {
  const rel = normalizeTarget(path.relative(projectRoot, targetPath));
  if (rel && !rel.startsWith('..')) ledgerFiles.add(rel);
}

// Persist the ledger, union-merged with any prior one so idempotent re-installs
// (which report files as 'current' and don't rewrite them) never shrink the
// tracked set. Skipped for --dry-run and --only (a partial deploy must not
// clobber the full ledger).
function writeLedger() {
  const ledgerPath = path.join(projectRoot, LEDGER_REL);
  const merged = new Set(ledgerFiles);
  const existing = readFileSafe(ledgerPath);
  if (existing) {
    try {
      const prev = JSON.parse(existing);
      if (prev && Array.isArray(prev.files)) {
        for (const f of prev.files) merged.add(normalizeTarget(f));
      }
    } catch { /* ignore a corrupt prior ledger — overwrite with current */ }
  }
  const payload = {
    version: 1,
    generatedBy: 'project-claude/install.cjs',
    files: [...merged].sort(),
  };
  ensureDir(ledgerPath);
  fs.writeFileSync(ledgerPath, JSON.stringify(payload, null, 2) + '\n');
  log(`  ledger:      ${LEDGER_REL} (${merged.size} tracked)`);
}

// Remove directories left empty after their files were unlinked, walking up from
// each touched dir but never past .claude/ (and never .claude/ itself).
function pruneEmptyDirs(dirs) {
  const claudeAbs = path.resolve(claudeDir);
  for (const start of dirs) {
    let dir = path.resolve(start);
    while (dir !== claudeAbs && dir.startsWith(claudeAbs + path.sep)) {
      try {
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
          if (!dryRun) fs.rmdirSync(dir);
          log(`  - pruned:    ${normalizeTarget(path.relative(projectRoot, dir))}/`);
          dir = path.dirname(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

// --- Standalone file install ---
function installStandalone(entry) {
  if (!matchesOnly(entry.target)) return;
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);

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
    recordManaged(targetPath);
    log(`  + installed: ${entry.target}`);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    // Already current
    recordManaged(targetPath);
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
  } else if (force) {
    // Differs but --force
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
    }
    recordManaged(targetPath);
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
  //
  // A2 dedupe fix: manifest.files.skills entries have DIRECTORY sources
  // (e.g. "skills/skill-integration") but autoDiscover candidates are FILE
  // paths (e.g. "skills/skill-integration/SKILL.md") — so the directory-level
  // add never matched. Fix: for each skills entry also add the per-file paths.
  const claimed = new Set();
  for (const s of (manifest.files.standalone || [])) claimed.add(s.source);
  for (const s of (manifest.files.skills || [])) {
    claimed.add(s.source); // keep dir-level add for future-proofing
    for (const relFile of (s.files || [])) {
      claimed.add(s.source + '/' + relFile); // posix join — consistent with enumerateMatches
    }
  }
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
  assertContained(targetBase, projectRoot);

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
    const fileTarget = `${entry.target}/${relFile}`;
    if (!matchesOnly(fileTarget)) continue;
    const sourcePath = path.join(sourceBase, relFile);
    const targetPath = path.join(targetBase, relFile);
    assertContained(targetPath, projectRoot);

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
      recordManaged(targetPath);
      log(`  + installed: ${fileTarget}`);
      stats.installed++;
      skillInstalled++;
    } else if (sha256(sourceContent) === sha256(targetContent)) {
      recordManaged(targetPath);
      if (!quiet) log(`  = current:   ${fileTarget}`);
      stats.current++;
      skillCurrent++;
    } else if (force) {
      if (!dryRun) {
        fs.writeFileSync(targetPath, sourceContent);
      }
      recordManaged(targetPath);
      log(`  ↻ updated:   ${fileTarget}`);
      stats.updated++;
      skillInstalled++;
    } else {
      warn(`differs: ${fileTarget} (use --force to overwrite)`);
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
  assertContained(targetBase, projectRoot);

  if (!fs.existsSync(sourceBase)) {
    warn(`Cartridge source directory missing: ${entry.source}`);
    return;
  }

  ensureDirPath(targetBase);
  const files = walkDirRel(sourceBase);

  for (const rel of files) {
    const fileTarget = `${entry.target}/${rel}`;
    if (!matchesOnly(fileTarget)) continue;
    const sourcePath = path.join(sourceBase, rel);
    const targetPath = path.join(targetBase, rel);
    assertContained(targetPath, projectRoot);
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
      recordManaged(targetPath);
      log(`  + installed: ${fileTarget}`);
      stats.installed++;
    } else if (sha256(sourceContent) === sha256(targetContent)) {
      recordManaged(targetPath);
      if (!quiet) log(`  = current:   ${fileTarget}`);
      stats.current++;
    } else if (force) {
      if (!dryRun) fs.writeFileSync(targetPath, sourceContent);
      recordManaged(targetPath);
      log(`  ↻ updated:   ${fileTarget}`);
      stats.updated++;
    } else {
      warn(`differs: ${fileTarget} (use --force to overwrite)`);
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
  if (!matchesOnly(entry.target)) return;
  const sourcePath = path.join(sourceDir, entry.source);
  const targetPath = path.join(projectRoot, entry.target);
  assertContained(targetPath, projectRoot);

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
    recordManaged(targetPath);
    log(`  + installed: ${entry.target} (executable)`);
    stats.installed++;
  } else if (sha256(sourceContent) === sha256(targetContent)) {
    // Ensure executable even if content matches
    if (!dryRun) {
      try { chmodSafe(targetPath, 0o755); } catch { /* ignore */ }
    }
    recordManaged(targetPath);
    if (!quiet) log(`  = current:   ${entry.target}`);
    stats.current++;
  } else if (force) {
    if (!dryRun) {
      fs.writeFileSync(targetPath, sourceContent);
      chmodSafe(targetPath, 0o755);
    }
    recordManaged(targetPath);
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
  assertContained(targetPath, projectRoot);
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
  assertContained(targetPath, projectRoot);
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
  assertContained(targetPath, projectRoot);

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
    // No existing settings — copy as-is, MINUS the gsd-skill-creator scope: the
    // harness settings schema rejects unknown top-level keys, and that scope is
    // propagated separately to .claude/gsd-skill-creator.json by
    // installDedicatedConfig (CC-6). The merge branch below already drops it.
    if (!dryRun) {
      const harnessSettings = { ...sourceSettings };
      delete harnessSettings['gsd-skill-creator'];
      ensureDir(targetPath);
      fs.writeFileSync(targetPath, JSON.stringify(harnessSettings, null, 2) + '\n');
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

// --- Dedicated gsd-skill-creator config (CC-6) ---
// The harness settings.json is validated against a strict schema that rejects
// unknown top-level keys, so gsd-skill-creator opt-in flags live under a
// `gsd-skill-creator` scope in a dedicated sibling file
// `.claude/gsd-skill-creator.json` (read first by src/settings/read-settings.ts).
// installSettings only carries hooks + statusLine, so it would drop the
// `gsd-skill-creator` scope from the source settings entirely. Propagate that
// scope into the dedicated file with a NON-CLOBBERING deep merge: add missing
// keys, but NEVER overwrite an existing hand-set value (a user-enabled feature
// flag, or a hand-authored `sensoria`/`orchestration`/etc. block that has no
// tracked source). Like .planning/skill-creator.json, the dedicated file is NOT
// ledgered — it is preserved on uninstall.
function mergeMissingDeep(target, source) {
  let changed = false;
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
        changed = true;
      }
      if (mergeMissingDeep(target[key], value)) changed = true;
    } else if (!(key in target)) {
      target[key] = value;
      changed = true;
    }
  }
  return changed;
}

function installDedicatedConfig(entry) {
  const sourcePath = path.join(sourceDir, entry.source);
  const sourceContent = readFileSafe(sourcePath);
  if (sourceContent === null) return;

  let sourceSettings;
  try {
    sourceSettings = JSON.parse(sourceContent);
  } catch {
    return; // installSettings already warned about invalid source JSON
  }

  const scope = sourceSettings['gsd-skill-creator'];
  if (!scope || typeof scope !== 'object') return;

  const targetPath = path.join(projectRoot, '.claude', 'gsd-skill-creator.json');
  assertContained(targetPath, projectRoot);

  let dedicated = {};
  const existing = readFileSafe(targetPath);
  if (existing !== null) {
    try {
      dedicated = JSON.parse(existing);
    } catch {
      warn('Existing .claude/gsd-skill-creator.json is not valid JSON — leaving it untouched');
      return;
    }
  }
  if (!dedicated['gsd-skill-creator'] || typeof dedicated['gsd-skill-creator'] !== 'object') {
    dedicated['gsd-skill-creator'] = {};
  }

  const changed = mergeMissingDeep(dedicated['gsd-skill-creator'], scope);
  if (!changed) {
    if (!quiet) log('  = current:   .claude/gsd-skill-creator.json');
    stats.current++;
    return;
  }
  if (!dryRun) {
    ensureDir(targetPath);
    fs.writeFileSync(targetPath, JSON.stringify(dedicated, null, 2) + '\n');
  }
  log('  ↻ updated:   .claude/gsd-skill-creator.json (gsd-skill-creator scope merged)');
  stats.updated++;
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
      capture_corrections: true,
      // Mine active skill names from the session transcript so co-activation /
      // `agents suggest` has real input (5.1c). On by default; set false to opt out.
      mine_active_skills: true
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
function uninstallIntegration(manifest) {
  const prefix = dryRun ? '[DRY RUN] ' : '';
  log(`${prefix}Uninstalling integration components...\n`);

  let removed = 0;
  let notFound = 0;
  let skipped = 0;
  const dirsTouched = new Set();

  // Prefer the install ledger — it records exactly what install wrote (including
  // auto-discovered files), so uninstall never lags the install surface (INT-3).
  const ledgerPath = path.join(projectRoot, LEDGER_REL);
  const ledgerRaw = readFileSafe(ledgerPath);
  let ledger = null;
  if (ledgerRaw) {
    try { ledger = JSON.parse(ledgerRaw); } catch { ledger = null; }
  }

  if (ledger && Array.isArray(ledger.files)) {
    for (const rel of ledger.files) {
      const fullPath = path.join(projectRoot, rel);
      try {
        assertContained(fullPath, projectRoot);
      } catch {
        log(`  ~ skipped:   ${rel} (escapes project root)`);
        skipped++;
        continue;
      }
      if (fs.existsSync(fullPath)) {
        if (!dryRun) fs.unlinkSync(fullPath);
        log(`  - removed:   ${rel}`);
        removed++;
        dirsTouched.add(path.dirname(fullPath));
      } else {
        notFound++;
      }
    }
  } else {
    // Legacy fallback: pre-ledger hosts. A partial hardcoded subset — the best
    // we can do without a receipt of what was written.
    const legacyDirs = [
      '.claude/commands/sc', '.claude/commands/wrap',
      '.claude/skills/gsd-workflow', '.claude/skills/skill-integration',
      '.claude/skills/session-awareness', '.claude/skills/security-hygiene',
      '.claude/cartridges/gsd-skill-creator', '.claude/cartridges/get-shit-done',
      '.claude/cartridges/release-engine', '.claude/cartridges/housekeeping',
    ];
    const legacyFiles = [
      '.claude/agents/gsd-executor.md', '.claude/agents/gsd-verifier.md',
      '.claude/agents/gsd-planner.md', '.claude/hooks/session-state.cjs',
      '.claude/hooks/validate-commit.cjs', '.claude/hooks/phase-boundary-check.cjs',
    ];
    for (const dir of legacyDirs) {
      const fullPath = path.join(projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        if (!dryRun) fs.rmSync(fullPath, { recursive: true, force: true });
        log(`  - removed:   ${dir}/`);
        removed++;
      } else {
        notFound++;
      }
    }
    for (const file of legacyFiles) {
      const fullPath = path.join(projectRoot, file);
      if (fs.existsSync(fullPath)) {
        if (!dryRun) fs.unlinkSync(fullPath);
        log(`  - removed:   ${file}`);
        removed++;
        dirsTouched.add(path.dirname(fullPath));
      } else {
        notFound++;
      }
    }
  }

  // Remove the install-owned integration config (written by installIntegrationConfig,
  // outside the .claude/ ledger).
  const configPath = path.join(projectRoot, '.planning', 'skill-creator.json');
  if (fs.existsSync(configPath)) {
    if (!dryRun) fs.unlinkSync(configPath);
    log('  - removed:   .planning/skill-creator.json');
    removed++;
  }

  // Remove our merged hooks from settings.json so the host doesn't keep
  // invoking hook scripts we just deleted (mirror of installSettings + the
  // gsd-init.ts teardown). Filters only the hook groups whose command we own.
  const settingsEntries = [manifest && manifest.files && manifest.files.settings,
    manifest && manifest.files && manifest.files.settingsHooks].filter(Boolean);
  if (settingsEntries.length > 0) {
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    const settingsContent = readFileSafe(settingsPath);
    if (settingsContent === null) {
      log('  . not found: .claude/settings.json');
      notFound++;
    } else {
      try {
        const settings = JSON.parse(settingsContent);
        let changed = false;

        // Collect the hook commands we install + whether we own a statusLine.
        const ourCommands = new Set();
        let ourStatusLine = false;
        for (const entry of settingsEntries) {
          const srcContent = readFileSafe(path.join(sourceDir, entry.source));
          if (!srcContent) continue;
          try {
            const src = JSON.parse(srcContent);
            for (const groups of Object.values(src.hooks || {})) {
              if (!Array.isArray(groups)) continue;
              for (const group of groups) {
                const cmd = group.hooks && group.hooks[0] && group.hooks[0].command;
                if (cmd) ourCommands.add(cmd);
              }
            }
            if (src.statusLine) ourStatusLine = true;
          } catch { /* ignore malformed source */ }
        }

        // Strip our hook groups; drop events that empty out; drop empty hooks.
        const targetHooks = settings.hooks;
        if (targetHooks && typeof targetHooks === 'object') {
          for (const [event, groups] of Object.entries(targetHooks)) {
            if (!Array.isArray(groups)) continue;
            const filtered = groups.filter((group) => {
              const cmd = group.hooks && group.hooks[0] && group.hooks[0].command;
              return !cmd || !ourCommands.has(cmd);
            });
            if (filtered.length !== groups.length) {
              changed = true;
              if (filtered.length === 0) {
                delete targetHooks[event];
              } else {
                targetHooks[event] = filtered;
              }
            }
          }
          if (Object.keys(targetHooks).length === 0) {
            delete settings.hooks;
          }
        }

        // Remove the statusLine only if it was one we installed.
        if (ourStatusLine && settings.statusLine) {
          delete settings.statusLine;
          changed = true;
        }

        if (changed) {
          if (!dryRun) {
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
          }
          log('  - cleaned:   .claude/settings.json (hooks removed)');
          removed++;
        } else {
          log('  = current:   .claude/settings.json (no matching hooks)');
        }
      } catch {
        log('  ~ skipped:   .claude/settings.json (invalid JSON)');
        skipped++;
      }
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

  // Prune directories emptied by the removals (skills/<name>, commands/sc,
  // hooks/lib, hooks/__tests__, cartridges/<name>, ...).
  pruneEmptyDirs(dirsTouched);

  // Remove the ledger itself, last.
  if (ledger && fs.existsSync(ledgerPath)) {
    if (!dryRun) fs.unlinkSync(ledgerPath);
    log(`  - removed:   ${LEDGER_REL}`);
    removed++;
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
      console.error('Or install GSD first: npx @opengsd/gsd-core@latest');
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
    uninstallIntegration(manifest);
    return;
  }

  const prefix = dryRun ? '[DRY RUN] ' : '';

  if (hasOnlyFilter) {
    log(`Scope: ${onlyTargets.length} target(s) via --only`);
    log('');
  }

  log(`${prefix}Installing project-claude files...\n`);

  // Install standalone files
  if (manifest.files.standalone) {
    if (!hasOnlyFilter) log('Standalone files:');
    for (const entry of manifest.files.standalone) {
      installStandalone(entry);
    }
    if (!hasOnlyFilter) log('');
  }

  // Install skill directories
  if (manifest.files.skills) {
    if (!hasOnlyFilter) log('Skills:');
    for (const entry of manifest.files.skills) {
      installSkillDir(entry);
    }
    if (!hasOnlyFilter) log('');
  }

  // Auto-discover: enumerate agents + skills not listed in the manifest.
  // This lets new files under project-claude/agents/*.md and
  // project-claude/skills/<name>/SKILL.md flow to .claude/ without
  // editing manifest.json.
  if (manifest.files.autoDiscover) {
    if (!hasOnlyFilter) log('Auto-discovery:');
    for (const block of manifest.files.autoDiscover) {
      installAutoDiscover(block, manifest);
    }
    if (!hasOnlyFilter) log('');
  }

  // Install hook scripts (with executable permissions)
  if (manifest.files.hookScripts) {
    if (!hasOnlyFilter) log('Hook scripts:');
    for (const entry of manifest.files.hookScripts) {
      installHookScript(entry);
    }
    if (!hasOnlyFilter) log('');
  }

  // Section-level handlers skipped entirely in targeted (--only) mode:
  // CLAUDE.md, extensions, settings, settingsHooks, cartridges,
  // integration config, patterns dir, gitignore, git hook, validation.
  if (!hasOnlyFilter) {
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
      // Propagate the gsd-skill-creator scope (dropped by the settings merge)
      // into the dedicated .claude/gsd-skill-creator.json (CC-6).
      installDedicatedConfig(manifest.files.settings);
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
  }

  // Persist the install ledger so --uninstall removes exactly what we wrote
  // (INT-3). Skipped for --only (a partial deploy must not clobber it).
  if (!dryRun && !hasOnlyFilter) {
    writeLedger();
  }

  // Summary
  const total = stats.installed + stats.updated + stats.current + stats.warnings;
  log('─'.repeat(50));
  log(`Installed: ${stats.installed} | Updated: ${stats.updated} | Current: ${stats.current} | Warnings: ${stats.warnings}`);

  if (dryRun) {
    log('\n(Dry run — no files were modified)');
  }

  // Validation (skip during dry-run or --only targeted mode)
  if (!dryRun && !hasOnlyFilter) {
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

// Run when invoked as a script (bin / `node install.cjs` / spawned by gsd-init).
// Guarded so the module can be `require`d in tests without triggering an install.
if (require.main === module) {
  main();
}

module.exports = { assertContained };

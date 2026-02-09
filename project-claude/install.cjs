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

  // Summary
  const total = stats.installed + stats.updated + stats.current + stats.warnings;
  log('─'.repeat(50));
  log(`Installed: ${stats.installed} | Updated: ${stats.updated} | Current: ${stats.current} | Warnings: ${stats.warnings}`);

  if (dryRun) {
    log('\n(Dry run — no files were modified)');
  }

  if (stats.warnings > 0) {
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
// examples/tools/install.mjs
//
// Copy artifacts from examples/ into a target .claude/ directory.
// Zero dependencies — pure Node standard library.
//
// Usage:
//   node examples/tools/install.mjs --help
//   node examples/tools/install.mjs --dry-run
//   node examples/tools/install.mjs --name audio-engineer --type agent
//   node examples/tools/install.mjs --type skills --category media
//   node examples/tools/install.mjs --all --confirm
//   node examples/tools/install.mjs --name research-engine --target ~/.claude
//   node examples/tools/install.mjs --name old-pattern --include-deprecated

import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { argv, exit } from 'node:process';

const HELP = `
examples/tools/install.mjs — copy artifacts from examples/ into a target .claude/

Usage:
  node examples/tools/install.mjs [options]

Options:
  --name <name>           Install a single named artifact
  --type <type>           Filter by type (skills|agents|teams|chipsets)
  --category <cat>        Filter by category (e.g., media, gsd)
  --target <path>         Target directory (default: ~/.claude)
  --all                   Install everything matching filters (requires --confirm)
  --confirm               Required with --all
  --dry-run               Show what would be installed, don't write
  --include-experimental  Include status: experimental artifacts (default: stable only)
  --include-deprecated    Include status: deprecated artifacts
  --overwrite             Overwrite existing files in target (default: fail if exists)
  --help, -h              Show this help

Examples:
  node examples/tools/install.mjs --dry-run
  node examples/tools/install.mjs --name audio-engineer --type agent
  node examples/tools/install.mjs --type skills --category media
  node examples/tools/install.mjs --all --confirm --target ./my-project/.claude
`;

function parseArgs(args) {
  const parsed = {
    name: null, type: null, category: null,
    target: null, all: false, confirm: false,
    dryRun: false, includeExperimental: false,
    includeDeprecated: false, overwrite: false, help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => args[++i];
    switch (a) {
      case '--help': case '-h': parsed.help = true; break;
      case '--name': parsed.name = next(); break;
      case '--type': parsed.type = next(); break;
      case '--category': parsed.category = next(); break;
      case '--target': parsed.target = next(); break;
      case '--all': parsed.all = true; break;
      case '--confirm': parsed.confirm = true; break;
      case '--dry-run': parsed.dryRun = true; break;
      case '--include-experimental': parsed.includeExperimental = true; break;
      case '--include-deprecated': parsed.includeDeprecated = true; break;
      case '--overwrite': parsed.overwrite = true; break;
      default: console.error(`Unknown arg: ${a}`); exit(2);
    }
  }
  return parsed;
}

function expandTarget(t) {
  if (!t) return join(homedir(), '.claude');
  if (t.startsWith('~/')) return join(homedir(), t.slice(2));
  return resolve(t);
}

async function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const block = content.slice(4, end);
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (v === 'null' || v === '') v = null;
    fm[m[1]] = v;
  }
  return fm;
}

async function walkArtifacts(examplesRoot) {
  // Returns [{ type, category, name, path, isDir, frontmatter }]
  const types = ['skills', 'agents', 'teams', 'chipsets'];
  const artifacts = [];

  for (const type of types) {
    const typeDir = join(examplesRoot, type);
    if (!existsSync(typeDir)) continue;

    const categories = await readdir(typeDir, { withFileTypes: true });
    for (const catEnt of categories) {
      if (!catEnt.isDirectory()) continue;
      const category = catEnt.name;
      const catDir = join(typeDir, category);

      const entries = await readdir(catDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'README.md') continue;
        const fullPath = join(catDir, e.name);

        if (e.isDirectory()) {
          // Skills: dir with SKILL.md. Agents: dir with AGENT.md.
          // Teams: dir with config.json. Chipsets: dir with chipset.yaml.
          const skillMd = join(fullPath, 'SKILL.md');
          const agentMd = join(fullPath, 'AGENT.md');
          const chipsetYaml = join(fullPath, 'chipset.yaml');
          const teamCfg = join(fullPath, 'config.json');

          let metaPath = null;
          if (existsSync(skillMd)) metaPath = skillMd;
          else if (existsSync(agentMd)) metaPath = agentMd;
          else if (existsSync(chipsetYaml)) metaPath = chipsetYaml;
          else if (existsSync(teamCfg)) metaPath = teamCfg;

          if (!metaPath) continue;
          const content = await readFile(metaPath, 'utf8');
          const fm = metaPath.endsWith('.md') ? await parseFrontmatter(content) : null;
          artifacts.push({
            type, category, name: e.name, path: fullPath,
            isDir: true, metaPath, frontmatter: fm || {},
          });
        } else if (e.isFile() && e.name.endsWith('.md')) {
          // Agents: flat .md file
          const content = await readFile(fullPath, 'utf8');
          const fm = await parseFrontmatter(content);
          artifacts.push({
            type, category, name: e.name.replace(/\.md$/, ''), path: fullPath,
            isDir: false, metaPath: fullPath, frontmatter: fm || {},
          });
        }
      }
    }
  }
  return artifacts;
}

function filterArtifacts(all, args) {
  return all.filter(a => {
    if (args.name && a.name !== args.name) return false;
    if (args.type) {
      const typeNorm = args.type.endsWith('s') ? args.type : args.type + 's';
      if (a.type !== typeNorm) return false;
    }
    if (args.category && a.category !== args.category) return false;

    const status = a.frontmatter.status || 'stable';
    if (status === 'deprecated' && !args.includeDeprecated) return false;
    if (status === 'experimental' && !args.includeExperimental) return false;

    return true;
  });
}

async function copyDir(src, dst) {
  await mkdir(dst, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = join(src, e.name);
    const d = join(dst, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (e.isFile()) await copyFile(s, d);
  }
}

async function installArtifact(art, targetRoot, opts) {
  // Target structure in .claude:
  //   skills/<name>/SKILL.md  (unchanged)
  //   agents/<name>.md         (unchanged)
  //   teams/<name>/            (unchanged)
  //   chipsets/<name>/         (unchanged)
  // Categories are a source-tree concept only.
  let dst;
  if (art.type === 'agents' && !art.isDir) {
    dst = join(targetRoot, 'agents', `${art.name}.md`);
  } else {
    dst = join(targetRoot, art.type, art.name);
  }

  const exists = existsSync(dst);
  if (exists && !opts.overwrite) {
    return { art, dst, skipped: 'already exists (use --overwrite)' };
  }

  if (opts.dryRun) return { art, dst, dryRun: true };

  await mkdir(dirname(dst), { recursive: true });
  if (art.isDir) await copyDir(art.path, dst);
  else await copyFile(art.path, dst);

  return { art, dst, installed: true };
}

async function writeInstallLog(results, targetRoot) {
  const logPath = join(targetRoot, '.gsd-install-log.jsonl');
  const now = new Date().toISOString();
  const lines = results
    .filter(r => r.installed)
    .map(r => JSON.stringify({
      ts: now, name: r.art.name, type: r.art.type,
      category: r.art.category, dst: r.dst,
    }));
  if (!lines.length) return;
  try {
    await mkdir(targetRoot, { recursive: true });
    const existing = existsSync(logPath) ? await readFile(logPath, 'utf8') : '';
    await writeFile(logPath, existing + lines.join('\n') + '\n');
  } catch (e) {
    console.warn(`Could not write install log: ${e.message}`);
  }
}

async function main() {
  const args = parseArgs(argv.slice(2));
  if (args.help) { console.log(HELP); return; }

  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);
  const targetRoot = expandTarget(args.target);

  if (!args.name && !args.type && !args.category && !args.all) {
    console.error('Must specify at least one of: --name, --type, --category, --all');
    console.error('Try --help or --dry-run to explore.');
    exit(2);
  }
  if (args.all && !args.confirm && !args.dryRun) {
    console.error('--all requires --confirm (to avoid accidents). Use --dry-run to preview.');
    exit(2);
  }

  console.log(`Scanning ${examplesRoot} ...`);
  const all = await walkArtifacts(examplesRoot);
  const matched = filterArtifacts(all, args);

  if (!matched.length) {
    console.log('No artifacts matched. Check --name, --type, --category.');
    return;
  }

  console.log(`\nTarget: ${targetRoot}`);
  console.log(`Matched: ${matched.length} artifact(s)\n`);

  const results = [];
  for (const art of matched) {
    results.push(await installArtifact(art, targetRoot, args));
  }

  for (const r of results) {
    const status = r.dryRun ? 'DRY ' : r.skipped ? 'SKIP' : 'OK  ';
    const suffix = r.skipped ? `  (${r.skipped})` : '';
    console.log(`  ${status}  ${r.art.type}/${r.art.category}/${r.art.name}${suffix}`);
  }

  if (!args.dryRun) await writeInstallLog(results, targetRoot);

  const installed = results.filter(r => r.installed).length;
  const skipped = results.filter(r => r.skipped).length;
  const dryRunCount = results.filter(r => r.dryRun).length;
  console.log(`\n${installed} installed, ${skipped} skipped, ${dryRunCount} dry-run.`);
}

main().catch(e => { console.error(e); exit(1); });

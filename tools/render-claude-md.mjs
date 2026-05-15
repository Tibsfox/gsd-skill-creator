#!/usr/bin/env node
/**
 * render-claude-md.mjs — render auto-generated sections of CLAUDE.md from
 * source-of-truth manifests, replacing prose-only drift surfaces with a
 * deterministic single-source pipeline.
 *
 * Marker syntax in CLAUDE.md:
 *
 *   <!-- AUTO:<section>:START -->
 *   ...rendered body...
 *   <!-- AUTO:<section>:END -->
 *
 * Sections currently auto-rendered:
 *   - file-locations  → tools/render-claude-md/file-locations.json
 *                       (one entry uses kind="agents-composite", which
 *                        composes its body from agents.json + filesystem
 *                        scan of .claude/agents/)
 *   - env-vars        → tools/render-claude-md/env-vars.json
 *   - disciplines     → tools/render-claude-md/disciplines.json
 *                       (v1.49.653 L-04 — operative disciplines checklist
 *                        linking to canonical docs; closes CONCERNS §23.4)
 *
 * Modes:
 *   (default)         render in place, write CLAUDE.md
 *   --check           render, exit 1 if differs from on-disk
 *   --dry-run         render, print to stdout, do not write
 *   --diff            report source-of-truth vs on-disk agent-count drift only;
 *                     does not render CLAUDE.md (independent of its presence)
 *   --root <path>     override repo root (for hermetic tests)
 *
 * Exit codes: 0 = OK (or absent-and-check, see below);
 *             1 = drift detected (--check / --diff) OR validation failure;
 *             2 = CLAUDE.md absent in non-check modes.
 *
 * Absent CLAUDE.md handling (post-2026-05-10 untrack):
 *   --check          → exit 0 with "skipped: CLAUDE.md absent" message;
 *                       the file is gitignored, so absence is valid state
 *                       in CI / fresh clones; the gate becomes informational
 *   --dry-run, write → exit 2 with "CLAUDE.md not found" (developer needs a
 *                       template; auto-bootstrap not supported because the
 *                       AUTO markers must be embedded in user-authored prose)
 *
 * Authored 2026-05-02 in the post-v1.49.596 CLAUDE.md compaction phase
 * (Tier 1 of the four-tier promotion plan; ships with the next milestone).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

function readManifest(repoRoot, name) {
  const p = join(repoRoot, 'tools', 'render-claude-md', name);
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ----- Agents composite body -----

function listAgentNames(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -'.md'.length))
    .sort();
}

function classifyAgents(manifest, agentsOnDisk) {
  const claimed = manifest.categories.map(() => []);
  const orphans = [];

  for (const name of agentsOnDisk) {
    let categoryIdx = -1;
    for (let i = 0; i < manifest.categories.length; i++) {
      const cat = manifest.categories[i];
      if (cat.members && cat.members.includes(name)) { categoryIdx = i; break; }
      if (cat.match_prefix && name.startsWith(cat.match_prefix)) { categoryIdx = i; break; }
    }
    if (categoryIdx === -1) orphans.push(name);
    else claimed[categoryIdx].push(name);
  }

  if (orphans.length > 0) {
    throw new Error(
      `Orphaned agents in .claude/agents/ (no matching category in agents.json): ` +
      `${orphans.join(', ')}. Update tools/render-claude-md/agents.json.`,
    );
  }

  for (const cat of manifest.categories) {
    if (cat.members) {
      const missing = cat.members.filter((m) => !agentsOnDisk.includes(m));
      if (missing.length > 0) {
        throw new Error(
          `Category "${cat.label}" lists members not present on disk: ` +
          `${missing.join(', ')}. Either add the agent or update agents.json.`,
        );
      }
    }
  }

  return claimed;
}

function composeAgentsBody(repoRoot) {
  const manifest = readManifest(repoRoot, 'agents.json');
  const agentsDir = join(repoRoot, '.claude', 'agents');
  const sourceDir = join(repoRoot, manifest.source_of_truth_dir);

  const agentsOnDisk = listAgentNames(agentsDir);
  const sourceCount = listAgentNames(sourceDir).length;
  const total = agentsOnDisk.length;

  const claimed = classifyAgents(manifest, agentsOnDisk);

  let pausedCount = 0;
  for (let i = 0; i < manifest.categories.length; i++) {
    if (manifest.categories[i].is_paused) pausedCount += claimed[i].length;
  }

  const fillTemplate = (tpl) =>
    tpl
      .replace(/\{TOTAL\}/g, String(total))
      .replace(/\{SOURCE_COUNT\}/g, String(sourceCount))
      .replace(/\{PAUSED_COUNT\}/g, String(pausedCount));

  const preamble = fillTemplate(manifest.preamble_template);
  const trailer = fillTemplate(manifest.trailer_template);

  const categoryStrs = manifest.categories.map((cat, i) => {
    const count = claimed[i].length;
    let detail;
    if (cat.label_detail) {
      detail = cat.label_detail;
    } else if (cat.label_detail_format === 'members') {
      const order = cat.members ? cat.members : claimed[i];
      detail = order.join(', ');
    } else {
      throw new Error(`Category "${cat.label}" missing label_detail or label_detail_format`);
    }
    return `**${count} ${cat.label}** (${detail})`;
  });

  return `${preamble}: ${categoryStrs.join(', ')}. ${trailer}`;
}

// ----- Section renderers -----

function renderFileLocations(repoRoot) {
  const manifest = readManifest(repoRoot, 'file-locations.json');
  return manifest
    .map((entry) => {
      const path = entry.path;
      let body;
      if (entry.kind === 'agents-composite') {
        body = composeAgentsBody(repoRoot);
      } else {
        body = entry.description;
      }
      return `- \`${path}\` -- ${body}`;
    })
    .join('\n');
}

function renderEnvVars(repoRoot) {
  const manifest = readManifest(repoRoot, 'env-vars.json');
  const header = '| Var | Default behavior | Override behavior |\n|---|---|---|';
  const rows = manifest.map((row) => {
    const nameCell = `\`${row.name}\`${row.name_suffix || ''}`;
    return `| ${nameCell} | ${row.default_behavior} | ${row.override_behavior} |`;
  });
  return [header, ...rows].join('\n');
}

// L-04: discipline-as-data (CONCERNS §23.4). Reads disciplines.json and emits
// a markdown checklist linking to canonical docs per discipline domain.
function renderDisciplines(repoRoot) {
  const manifest = readManifest(repoRoot, 'disciplines.json');
  const lines = [
    'When making changes that touch the listed surfaces, consult the named canonical docs BEFORE writing.',
    '',
  ];
  for (const d of manifest) {
    const docs = d.canonical_docs.map((p) => `[\`${p}\`](${p})`).join(' · ');
    const lessons = d.key_lessons.length > 0 ? ` *(${d.key_lessons.join(', ')})*` : '';
    lines.push(`- **${d.domain}** — _${d.trigger}_${lessons}`);
    lines.push(`  - ${d.summary}`);
    lines.push(`  - ${docs}`);
  }
  return lines.join('\n');
}

// ----- Marker engine -----

const SECTION_RENDERERS = {
  'file-locations': renderFileLocations,
  'env-vars': renderEnvVars,
  'disciplines': renderDisciplines,
};

const MARKER_RE = /(<!-- AUTO:([\w-]+):START -->)\n[\s\S]*?\n(<!-- AUTO:\2:END -->)/g;

function render(input, repoRoot) {
  return input.replace(MARKER_RE, (_match, startTag, section, endTag) => {
    const renderer = SECTION_RENDERERS[section];
    if (!renderer) {
      throw new Error(`Unknown AUTO section: "${section}". Known: ${Object.keys(SECTION_RENDERERS).join(', ')}`);
    }
    const body = renderer(repoRoot);
    return `${startTag}\n${body}\n${endTag}`;
  });
}

// ----- CLI -----

function parseMode(argv) {
  if (argv.includes('--check')) return 'check';
  if (argv.includes('--dry-run')) return 'dry-run';
  if (argv.includes('--diff')) return 'diff';
  return 'write';
}

/**
 * --diff mode: report drift between source-of-truth and on-disk reality
 * without rendering CLAUDE.md.
 *
 * The expected invariant (from CLAUDE.md auto-rendered preamble):
 *   total_on_disk == source_count + paused_count
 *
 * If this breaks, an agent was added to `.claude/agents/` without being
 * promoted to `project-claude/agents/` (or vice versa) — the kind of drift
 * that `--check` would catch only when CLAUDE.md is rendered. This mode
 * surfaces it directly.
 *
 * Addresses CONCERNS §21.2 — recommendation 2026-05-15.
 */
function diffMode(repoRoot, { stdout, stderr }) {
  let manifest;
  try {
    manifest = readManifest(repoRoot, 'agents.json');
  } catch (err) {
    stderr.write(`agents.json missing or invalid: ${err.message}\n`);
    return 1;
  }
  const installedDir = join(repoRoot, '.claude', 'agents');
  const sourceDir = join(repoRoot, manifest.source_of_truth_dir);
  const installed = listAgentNames(installedDir);
  const source = listAgentNames(sourceDir);

  const total = installed.length;
  const sourceCount = source.length;

  // Compute expected paused count from agents.json categories.
  // Categories may use either `members` (explicit list) or `match_prefix`
  // (prefix match against on-disk agent names).
  let expectedPaused = 0;
  for (const cat of manifest.categories) {
    if (!cat.is_paused) continue;
    if (cat.members) {
      expectedPaused += cat.members.length;
    } else if (cat.match_prefix) {
      expectedPaused += installed.filter((n) => n.startsWith(cat.match_prefix)).length;
    }
  }
  const expected = sourceCount + expectedPaused;

  // Set-difference for diagnostic detail
  const installedSet = new Set(installed);
  const sourceSet = new Set(source);
  const onDiskNotInSource = installed.filter((n) => !sourceSet.has(n));
  const inSourceNotOnDisk = source.filter((n) => !installedSet.has(n));

  stdout.write(
    `agents-source-of-truth: ${sourceCount} in ${manifest.source_of_truth_dir}\n` +
      `agents-on-disk:         ${total} in .claude/agents/\n` +
      `expected-paused:        ${expectedPaused} (from agents.json is_paused categories)\n` +
      `expected-total:         ${expected} (source + paused)\n`,
  );

  if (total === expected) {
    stdout.write('agents-count: in sync.\n');
    return 0;
  }

  stderr.write('\nagents-count: DRIFT.\n');
  if (onDiskNotInSource.length > 0) {
    const sample = onDiskNotInSource.slice(0, 10);
    stderr.write(
      `  ${onDiskNotInSource.length} agent(s) on disk NOT in source-of-truth: ` +
        `${sample.join(', ')}${onDiskNotInSource.length > 10 ? ', ...' : ''}\n`,
    );
  }
  if (inSourceNotOnDisk.length > 0) {
    const sample = inSourceNotOnDisk.slice(0, 10);
    stderr.write(
      `  ${inSourceNotOnDisk.length} agent(s) in source-of-truth NOT on disk: ` +
        `${sample.join(', ')}${inSourceNotOnDisk.length > 10 ? ', ...' : ''}\n`,
    );
  }
  stderr.write(
    `  Fix: either run \`node project-claude/install.cjs --force\` to install missing,\n` +
      `       or promote drifted agents into project-claude/agents/ + update agents.json.\n`,
  );
  return 1;
}

function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  const repoRoot = resolveRoot(argv);
  const mode = parseMode(argv);

  // --diff mode runs independently of CLAUDE.md presence; it inspects
  // source-of-truth manifests + on-disk reality only.
  if (mode === 'diff') {
    return diffMode(repoRoot, { stdout, stderr });
  }

  const claudeMdPath = join(repoRoot, 'CLAUDE.md');

  if (!existsSync(claudeMdPath)) {
    if (mode === 'check') {
      stdout.write(
        `CLAUDE.md not present at ${claudeMdPath}; skipping drift check ` +
        `(file is gitignored — local-only post-2026-05-10 untrack).\n`,
      );
      return 0;
    }
    stderr.write(`CLAUDE.md not found at ${claudeMdPath}\n`);
    return 2;
  }

  const original = readFileSync(claudeMdPath, 'utf8');
  let rendered;
  try {
    rendered = render(original, repoRoot);
  } catch (err) {
    stderr.write(`render failed: ${err.message}\n`);
    return 1;
  }

  if (mode === 'dry-run') {
    stdout.write(rendered);
    return 0;
  }

  if (mode === 'check') {
    if (rendered === original) {
      stdout.write('CLAUDE.md is up to date.\n');
      return 0;
    }
    stderr.write(
      'CLAUDE.md is out of date with source-of-truth manifests.\n' +
      'Run: node tools/render-claude-md.mjs   # then commit the diff.\n',
    );
    return 1;
  }

  // write mode
  if (rendered === original) {
    stdout.write('CLAUDE.md unchanged.\n');
    return 0;
  }
  writeFileSync(claudeMdPath, rendered);
  stdout.write('CLAUDE.md updated.\n');
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exit(main());
}

export {
  render,
  renderFileLocations,
  renderEnvVars,
  renderDisciplines,
  composeAgentsBody,
  classifyAgents,
  listAgentNames,
  diffMode,
  main,
};

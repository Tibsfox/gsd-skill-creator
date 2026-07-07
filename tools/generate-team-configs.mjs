#!/usr/bin/env node
// Generate config.json for example teams that ship as README-only.
//
// Academic (department) teams under examples/teams/<dept>/<team>/ historically
// shipped as README.md documentation with no config.json, so they could not be
// schema/topology validated or spawned the way the operational teams (which all
// carry config.json) can. Each README has uniform frontmatter plus a
// "## Composition" member table (| Role | Agent | Method | Model |). This tool
// extracts that table into a config.json matching the proven operational schema
// ({ name, description, topology, members:[{ name, role, description, tools, model }] }).
//
// Idempotent: never overwrites an existing config.json. Pass --dry-run to preview.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const TEAMS = join(REPO, 'examples', 'teams');
const AGENTS = join(REPO, 'examples', 'agents');
const dryRun = process.argv.includes('--dry-run');

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function normModel(s) {
  const t = (s || '').toLowerCase().replace(/[`*]/g, '').trim();
  if (t.includes('opus')) return 'opus';
  if (t.includes('sonnet')) return 'sonnet';
  if (t.includes('haiku')) return 'haiku';
  return 'sonnet';
}

function isLeaderRole(role) {
  return /chair|router|lead|coordinator|director|orchestrat/i.test(role);
}

// Pull tools from the agent's own file frontmatter; fall back by role.
const toolsCache = new Map();
function agentTools(category, agent, leader) {
  const key = `${category}/${agent}`;
  if (toolsCache.has(key)) return toolsCache.get(key);
  let tools = null;
  const dir = join(AGENTS, category, agent);
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      const fm = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
      if (fm.tools) {
        tools = fm.tools.replace(/[[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
        break;
      }
    }
  }
  if (!tools || tools.length === 0) {
    tools = leader ? ['Read', 'Glob', 'Grep', 'Bash', 'Write'] : ['Read', 'Glob', 'Grep'];
  }
  toolsCache.set(key, tools);
  return tools;
}

// Known agent names for a category, used to identify the agent cell when the
// table does not wrap names in backticks (some departments use a bare
// "| Agent | Role | Model |" layout instead of "| Role | Agent | Method | Model |").
const agentSetCache = new Map();
function agentSet(category) {
  if (agentSetCache.has(category)) return agentSetCache.get(category);
  const dir = join(AGENTS, category);
  const set = new Set();
  if (existsSync(dir)) for (const e of readdirSync(dir)) if (statSync(join(dir, e)).isDirectory()) set.add(e.toLowerCase());
  agentSetCache.set(category, set);
  return set;
}

// Extract the first member table after a "## Composition" / "## Team Composition"
// heading. Format-agnostic: locates the agent cell (backtick-wrapped or a bare
// name matching a known agent) and the model cell (opus/sonnet/haiku) per row.
function parseComposition(md, category) {
  const lines = md.split('\n');
  let i = lines.findIndex((l) => /^##\s+(team\s+)?composition/i.test(l));
  if (i < 0) return [];
  const known = agentSet(category);
  const rows = [];
  let started = false;
  for (i++; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^##\s/.test(lines[i])) break; // next section
    if (!l.startsWith('|')) { if (started) break; else continue; }
    if (/^\|[\s|:-]+\|?$/.test(l)) { started = true; continue; } // separator row
    const cells = l.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    // header row (Role/Agent/Member/Method/Model with no data) — skip
    if (cells.every((c) => /^(role|agent|member|method|model|dimension)$/i.test(c.replace(/[*`]/g, '')))) { started = true; continue; }
    let agent = null;
    const bt = cells.find((c) => /`[a-z0-9-]+`/i.test(c));
    if (bt) agent = bt.match(/`([a-z0-9-]+)`/i)[1];
    if (!agent) agent = cells.map((c) => c.replace(/[*`]/g, '').trim().toLowerCase()).find((c) => known.has(c));
    if (!agent) continue;
    const modelCell = cells.find((c) => /\b(opus|sonnet|haiku)\b/i.test(c));
    const model = normModel(modelCell);
    // role/method = descriptive cells that are not the agent or the model
    const desc = cells
      .map((c) => c.replace(/`/g, '').trim())
      .filter((c) => c.toLowerCase() !== agent && !/^\**(opus|sonnet|haiku)\**$/i.test(c) && c.length > 0)
      .join(' — ') || agent;
    rows.push({ agent, role: desc, method: desc, model });
    started = true;
  }
  return rows;
}

function build(dir) {
  const readme = join(dir, 'README.md');
  if (!existsSync(readme)) return { skip: 'no-readme' };
  if (existsSync(join(dir, 'config.json'))) return { skip: 'has-config' };
  const md = readFileSync(readme, 'utf8');
  const fm = parseFrontmatter(md);
  const category = fm.category || dir.split('/').slice(-2, -1)[0];
  const rows = parseComposition(md, category);
  if (rows.length === 0) return { skip: 'no-table' };
  const leaderIdx = Math.max(0, rows.findIndex((r) => isLeaderRole(r.role)));
  const members = rows.map((r, idx) => ({
    name: r.agent,
    role: idx === leaderIdx ? 'leader' : 'worker',
    description: r.method,
    tools: agentTools(category, r.agent, idx === leaderIdx),
    model: r.model,
  }));
  const config = {
    name: fm.name || dir.split('/').pop(),
    description: fm.description || `${fm.name || 'Team'} — generated from README composition.`,
    topology: 'leader-worker',
    members,
  };
  return { config };
}

let written = 0, skipped = 0, notable = [];
function walk() {
  for (const dept of readdirSync(TEAMS)) {
    const dp = join(TEAMS, dept);
    if (!statSync(dp).isDirectory()) continue;
    for (const team of readdirSync(dp)) {
      const td = join(dp, team);
      if (!statSync(td).isDirectory()) continue;
      const r = build(td);
      if (r.skip === 'has-config') { skipped++; continue; }
      if (r.skip) { if (r.skip === 'no-table') notable.push(td.replace(REPO + '/', '')); continue; }
      const out = join(td, 'config.json');
      if (!dryRun) writeFileSync(out, JSON.stringify(r.config, null, 2) + '\n');
      written++;
      if (written <= 3) console.log(`  ${dryRun ? 'would write' : 'wrote'}: ${out.replace(REPO + '/', '')} (${r.config.members.length} members)`);
    }
  }
}

walk();
console.log(`\n${dryRun ? '[dry-run] ' : ''}config.json ${dryRun ? 'to write' : 'written'}: ${written} | already-had: ${skipped} | no-table (skipped): ${notable.length}`);
if (notable.length) console.log('  no-table:', notable.join(', '));

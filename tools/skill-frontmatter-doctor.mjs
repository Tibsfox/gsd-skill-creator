#!/usr/bin/env node
// skill-frontmatter-doctor.mjs — ADVISORY linter for skill/agent frontmatter.
// Reports the four #1 defect classes and ALWAYS exits 0 (not a gate).
//   1. trigger that echoes the description (substring either direction)
//   2. trigger truncated (ends mid-word / at conjunction / open paren)
//   3. tools: in YAML-array form (must be a comma-separated string)
//   4. description length outside 1-1024 chars
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CONJ = new Set(['and', 'or', 'but', 'with', 'for', 'to', 'of', 'the', 'a', 'an', 'in', 'on']);

function walk(dir, match, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, match, out);
    else if (match(p)) out.push(p);
  }
  return out;
}

function collect() {
  const files = [];
  for (const base of ['.claude/skills', 'project-claude/skills']) {
    walk(join(ROOT, base), (p) => p.endsWith('/SKILL.md') || p.endsWith('\\SKILL.md'), files);
  }
  for (const base of ['.claude/agents', 'project-claude/agents']) {
    const dir = join(ROOT, base);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.md')) files.push(join(dir, name));
    }
  }
  return files;
}

// Extract the YAML frontmatter block (raw lines) between the first two `---`.
function frontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  return lines.slice(1, end);
}

// Pull a scalar `key: value` (single line). Returns undefined if absent.
function scalar(fm, key) {
  const re = new RegExp('^' + key + ':\\s*(.*)$');
  for (const l of fm) {
    const m = l.match(re);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

// Collect YAML block-sequence items for a key ( `key:` then `  - item` lines ).
function blockItems(fm, key) {
  const items = [];
  let inside = false;
  for (const l of fm) {
    if (new RegExp('^' + key + ':\\s*$').test(l)) { inside = true; continue; }
    if (inside) {
      const m = l.match(/^\s+-\s+(.*)$/);
      if (m) { items.push(m[1].trim().replace(/^["']|["']$/g, '')); continue; }
      if (/^\S/.test(l)) inside = false; // dedent to a new key ends the block
    }
  }
  return items;
}

function toolsIsArray(fm) {
  for (let i = 0; i < fm.length; i++) {
    const l = fm[i];
    if (/^tools:\s*\[.*\]\s*$/.test(l)) return true;          // inline array
    if (/^tools:\s*$/.test(l) && /^\s+-\s+/.test(fm[i + 1] || '')) return true; // block seq
  }
  return false;
}

function badTrigger(trig, desc) {
  const t = trig.trim();
  if (!t) return 'empty';
  const tl = t.toLowerCase(), dl = (desc || '').toLowerCase();
  if (dl && (dl.includes(tl) || tl.includes(dl))) return 'echoes description';
  if (t.endsWith('(')) return 'ends at open paren';
  const words = t.replace(/[.,;:"')\]]+$/, '').split(/\s+/);
  const last = words[words.length - 1].toLowerCase().replace(/[^a-z-]/g, '');
  if (CONJ.has(last)) return 'ends at conjunction/preposition';
  // mid-word truncation: no terminal punctuation AND last word has no vowel-ish close / very short fragment
  if (/[a-z]-$/.test(t)) return 'ends mid-word (hyphen)';
  return null;
}

const files = collect();
const findings = [];

for (const f of files) {
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  const fm = frontmatter(text);
  const rel = relative(ROOT, f);
  if (!fm) { findings.push([rel, 'no valid frontmatter block']); continue; }

  const desc = scalar(fm, 'description');
  if (desc === undefined) findings.push([rel, 'description: missing']);
  else {
    const n = desc.length;
    if (n < 1 || n > 1024) findings.push([rel, `description length ${n} outside 1-1024`]);
  }

  if (toolsIsArray(fm)) findings.push([rel, 'tools: is a YAML array (must be comma-separated string)']);

  const triggers = blockItems(fm, 'triggers');
  for (const trig of triggers) {
    const why = badTrigger(trig, desc);
    if (why) findings.push([rel, `trigger ${why}: "${trig.slice(0, 60)}"`]);
  }
}

console.log(`skill-frontmatter-doctor (advisory): scanned ${files.length} file(s)`);
if (findings.length === 0) {
  console.log('No frontmatter defects detected.');
} else {
  for (const [rel, msg] of findings) console.log(`  [warn] ${rel}: ${msg}`);
}
console.log(`Summary: ${findings.length} finding(s) across ${files.length} file(s).`);
process.exit(0);

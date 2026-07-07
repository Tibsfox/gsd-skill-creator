#!/usr/bin/env node
// Advisory linter: flag @-include directives in agent and skill bodies that do
// not resolve against the working tree.
//
// Agents and skills pull reference material in via `@path` include directives,
// which are expanded into the model's context at runtime. When a refactor moves
// or renames the target (e.g. the machine-absolute-path cleanup, or
// src/platform/observation -> src/observation), the include silently rots: the
// agent loads nothing where it expected a reference document. This scans the
// tracked project-claude/ source and the installed .claude/ tree for @-includes
// and reports any that do not resolve.
//
// Scope is deliberately limited to @-includes. Free-form `src/...` / `scripts/...`
// path literals in agent prose are overwhelmingly illustrative example paths
// (e.g. src/auth/routes.ts in a demo) or skill-relative script references, which
// cannot be distinguished from real references without instruction-context
// parsing — so flagging them produces mostly false positives. @-includes carry
// no such ambiguity: every one must resolve.
//
// Advisory only: always exits 0. Run: node tools/artifact-path-linter.mjs

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

// @-include: `@` at a word boundary followed by a path (repo-relative or absolute).
// Skip @-mentions that are clearly not paths (no slash, or an email).
const INCLUDE_RE = /(?:^|\s)@((?:\/|\.{0,2}\/|[\w.-]+\/)[\w./-]+)/g;

function walk(dir, filter, out) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, filter, out);
    else if (filter(p)) out.push(p);
  }
}

const targets = [];
walk(join(REPO, 'project-claude', 'agents'), (p) => p.endsWith('.md'), targets);
walk(join(REPO, 'project-claude', 'skills'), (p) => p.endsWith('.md'), targets);
walk(join(REPO, '.claude', 'agents'), (p) => p.endsWith('.md'), targets);
walk(join(REPO, '.claude', 'skills'), (p) => p.endsWith('.md'), targets);

let dangling = 0;
const seen = new Set();
for (const file of targets) {
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = INCLUDE_RE.exec(text)) !== null) {
    let ref = m[1];
    if (ref.includes('@')) continue; // stray email-like match
    // Skip npm scoped-package names (@scope/pkg): not a path prefix and no file
    // extension — these are dependency mentions, not file includes.
    if (!ref.startsWith('.') && !ref.startsWith('/') && !/\.[a-z]{1,5}$/i.test(ref)) continue;
    const abs = ref.startsWith('/') ? ref : join(REPO, ref);
    if (existsSync(abs)) continue;
    const key = `${file}::${ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dangling++;
    console.log(`  [dangling @-include] ${file.replace(REPO + '/', '')}: @${ref}`);
  }
}

console.log(`\nScanned ${targets.length} agent/skill files. Dangling @-includes: ${dangling}.`);
if (dangling === 0) console.log('All @-include directives resolve.');
process.exit(0);

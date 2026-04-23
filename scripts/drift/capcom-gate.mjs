#!/usr/bin/env node
// scripts/drift/capcom-gate.mjs
// Permanent repo utility shipped by Phase 684 (v1.49.569 Drift in LLM Systems mission).
//
// CAPCOM go/no-go gate. Callable from any wave boundary (W0->W1, W1->W2, W2->W3, W3->release).
// Reads sources/meta.json + modules/<wave>.tex, runs four checks, emits gates/<wave>_gate.md
// structured report + exit code.
//
// Severity policy (0684-CONTEXT.md §D-08):
//   Mid-wave (W0, W1A, W1B, W1C, W2) : non-zero exit = WARN, --force override permitted
//   Publication wave (W3)            : non-zero exit = BLOCK, no --force
//
// Checks (0684-CONTEXT.md §D-07):
//   1. cite-resolution      — every \cite{key} in module .tex resolves in meta.json
//   2. numeric-attribution  — every numeric pattern (%, AUROC, pp, x) has inline citation <=50 chars away
//   3. quote-length         — no direct quote exceeds 15 words
//   4. quote-uniqueness     — at most one direct quote per cite_key
//
// Exit codes:
//   0 = pass
//   1 = WARN  (mid-wave only; --force permitted)
//   2 = BLOCK (publication wave only; no override)
//
// CLI:
//   node scripts/drift/capcom-gate.mjs \
//     --wave <W0|W1A|W1B|W1C|W2|W3> \
//     --mission-dir <path-to-mission-work-root> \
//     [--force]   (only valid mid-wave; BLOCK still exits 2 regardless)

import fs from 'node:fs';
import path from 'node:path';

const WAVES = new Set(['W0', 'W1A', 'W1B', 'W1C', 'W2', 'W3']);
const PUBLICATION_WAVE = 'W3';

// ----------------------------------------------------------------------------
// Check implementations
// ----------------------------------------------------------------------------

export function checkCiteResolution(texContent, metaEntries) {
  const known = new Set(metaEntries.map((e) => e.cite_key));
  const cited = new Set();
  for (const m of texContent.matchAll(/\\cite[tp]?\*?(?:\[[^\]]*\])?\{([^}]+)\}/g)) {
    m[1].split(',').forEach((k) => cited.add(k.trim()));
  }
  // also match our custom macro if it exists
  for (const m of texContent.matchAll(/\\citedrift\{([^}]+)\}/g)) {
    cited.add(m[1].trim());
  }
  const unresolved = [...cited].filter((k) => !known.has(k));
  return {
    name: 'cite-resolution',
    pass: unresolved.length === 0,
    cited_count: cited.size,
    unresolved,
    detail: unresolved.length ? `${unresolved.length} unresolved cite_key(s): ${unresolved.join(', ')}` : 'all cite keys resolve',
  };
}

// Numeric-claim detector. Word-boundaries (\b) are tricky here because "30pp" has
// no boundary between "0" and "p" (both are word chars). We anchor to the digit
// run and then require specific unit/flag suffixes, with explicit trailing
// boundaries where safe (letter words) and none where the digit touches the unit.
const NUMERIC_RE = /(?:\d+(?:[.,]\d+)?)\s*(?:%|pp(?![a-z])|AUROC\b|F1\b|×|(?<!\w)x(?!\w))/gi;

export function checkNumericAttribution(texContent) {
  const lines = texContent.split('\n');
  const violations = [];
  lines.forEach((line, i) => {
    for (const m of line.matchAll(NUMERIC_RE)) {
      const start = Math.max(0, m.index - 50);
      const end = Math.min(line.length, m.index + m[0].length + 50);
      const window = line.slice(start, end);
      const hasCite = /\\cite[tp]?\*?(?:\[[^\]]*\])?\{[^}]+\}|\\citedrift\{[^}]+\}/.test(window);
      if (!hasCite) {
        violations.push({ line: i + 1, match: m[0], snippet: line.trim().slice(0, 140) });
      }
    }
  });
  return {
    name: 'numeric-attribution',
    pass: violations.length === 0,
    violation_count: violations.length,
    violations: violations.slice(0, 25),
    detail: violations.length
      ? `${violations.length} numeric claim(s) without citation within ±50 chars (showing first 25)`
      : 'every numeric claim has inline citation',
  };
}

const QUOTE_RE = /``([^'`]{3,500})''|"([^"]{3,500})"/g;

export function checkQuoteLength(texContent, maxWords = 15) {
  const violations = [];
  for (const m of texContent.matchAll(QUOTE_RE)) {
    const body = (m[1] || m[2] || '').trim();
    const words = body.split(/\s+/).length;
    if (words > maxWords) {
      violations.push({ quote: body.slice(0, 120), words });
    }
  }
  return {
    name: 'quote-length',
    pass: violations.length === 0,
    violation_count: violations.length,
    violations,
    detail: violations.length ? `${violations.length} direct quote(s) > ${maxWords} words` : `all direct quotes <= ${maxWords} words`,
  };
}

export function checkQuoteUniqueness(texContent) {
  // Pair each direct quote with the nearest preceding \cite{...} within the same paragraph.
  const paragraphs = texContent.split(/\n{2,}/);
  const quotesByCite = {};
  for (const para of paragraphs) {
    const quotes = [...para.matchAll(QUOTE_RE)].map((m) => (m[1] || m[2] || '').trim());
    if (!quotes.length) continue;
    const citeMatch = para.match(/\\cite[tp]?\*?(?:\[[^\]]*\])?\{([^}]+)\}|\\citedrift\{([^}]+)\}/);
    const cite = citeMatch ? (citeMatch[1] || citeMatch[2]).split(',')[0].trim() : '__anonymous__';
    quotesByCite[cite] = (quotesByCite[cite] || 0) + quotes.length;
  }
  const violations = Object.entries(quotesByCite).filter(([k, n]) => k !== '__anonymous__' && n > 1);
  return {
    name: 'quote-uniqueness',
    pass: violations.length === 0,
    violation_count: violations.length,
    violations: violations.map(([cite, n]) => ({ cite, count: n })),
    detail: violations.length ? `${violations.length} source(s) quoted >1 time` : 'at most one direct quote per source',
  };
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--wave') args.wave = argv[++i];
    else if (a === '--mission-dir') args.missionDir = argv[++i];
    else if (a === '--force') args.force = true;
  }
  return args;
}

function waveFiles(missionDir, wave) {
  const modulesDir = path.join(missionDir, 'modules');
  const tablesDir = path.join(missionDir, 'tables');
  const map = {
    W0:  [],
    W1A: [path.join(modulesDir, 'module_a.tex')],
    W1B: [path.join(modulesDir, 'module_b.tex'), path.join(tablesDir, 'alignment_scorecard.tex')],
    W1C: [path.join(modulesDir, 'module_c.tex'), path.join(tablesDir, 'ssot_checklist.tex')],
    W2:  [path.join(modulesDir, 'module_d.tex'), path.join(tablesDir, 'unified_taxonomy.tex')],
    W3:  [
      path.join(modulesDir, 'module_a.tex'),
      path.join(modulesDir, 'module_b.tex'),
      path.join(modulesDir, 'module_c.tex'),
      path.join(modulesDir, 'module_d.tex'),
      path.join(tablesDir, 'alignment_scorecard.tex'),
      path.join(tablesDir, 'ssot_checklist.tex'),
      path.join(tablesDir, 'unified_taxonomy.tex'),
    ],
  };
  return map[wave] ?? [];
}

export async function runGate({ wave, missionDir, force = false, stdout = console, now = () => new Date().toISOString() }) {
  if (!WAVES.has(wave)) throw new Error(`unknown wave ${wave}; must be one of ${[...WAVES].join(', ')}`);
  const metaPath = path.join(missionDir, 'sources', 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { entries: [] };
  const files = waveFiles(missionDir, wave);

  // W0 has no modules yet; gate only confirms scaffold sanity
  let combined = '';
  const existing = [];
  const missing = [];
  for (const f of files) {
    if (fs.existsSync(f)) { combined += '\n\n' + fs.readFileSync(f, 'utf8'); existing.push(f); }
    else missing.push(f);
  }

  const checks = wave === 'W0'
    ? [{ name: 'scaffold-sanity', pass: meta.entries.length >= 29, detail: `meta.json has ${meta.entries.length} entries (need >=29)` }]
    : [
        checkCiteResolution(combined, meta.entries),
        checkNumericAttribution(combined),
        checkQuoteLength(combined),
        checkQuoteUniqueness(combined),
      ];

  const allPass = checks.every((c) => c.pass);
  const isPublication = wave === PUBLICATION_WAVE;
  const severity = allPass ? 'PASS' : (isPublication ? 'BLOCK' : 'WARN');
  const exitCode = allPass ? 0 : (isPublication ? 2 : 1);

  // write report
  const gatesDir = path.join(missionDir, 'gates');
  fs.mkdirSync(gatesDir, { recursive: true });
  const report = renderReport({ wave, timestamp: now(), severity, exitCode, force, existing, missing, checks });
  const reportPath = path.join(gatesDir, `${wave}_gate.md`);
  fs.writeFileSync(reportPath, report);

  stdout.log(`\nCAPCOM ${wave}: ${severity} -> ${reportPath}`);
  if (exitCode === 1 && force) {
    stdout.log(`  (--force applied: orchestrator may proceed, but the WARN is logged in the gate report)`);
    // Preserve raw exitCode (1) so callers can see the severity happened; effectiveExit is 0.
    return { exitCode, severity, effectiveExit: 0, forced: true, reportPath };
  }
  return { exitCode, severity, effectiveExit: exitCode, forced: false, reportPath };
}

function renderReport({ wave, timestamp, severity, exitCode, force, existing, missing, checks }) {
  const lines = [];
  lines.push('---');
  lines.push(`wave: ${wave}`);
  lines.push(`timestamp: ${timestamp}`);
  lines.push(`severity: ${severity}`);
  lines.push(`exit_code: ${exitCode}`);
  lines.push(`force_applied: ${force}`);
  lines.push('---');
  lines.push('');
  lines.push(`# CAPCOM Gate — Wave ${wave}`);
  lines.push('');
  if (missing.length) {
    lines.push('## Missing files');
    for (const f of missing) lines.push(`- \`${f}\` (not yet created — expected for this wave)`);
    lines.push('');
  }
  if (existing.length) {
    lines.push('## Files checked');
    for (const f of existing) lines.push(`- \`${f}\``);
    lines.push('');
  }
  for (const c of checks) {
    lines.push(`### ${c.name} — ${c.pass ? 'PASS' : 'FAIL'}`);
    lines.push('');
    lines.push(c.detail || '');
    lines.push('');
    if (c.violations?.length) {
      lines.push('<details><summary>violations</summary>');
      lines.push('');
      for (const v of c.violations) lines.push(`- ${JSON.stringify(v)}`);
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
    if (c.unresolved?.length) {
      lines.push('<details><summary>unresolved cite keys</summary>');
      lines.push('');
      for (const u of c.unresolved) lines.push(`- \`${u}\``);
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');
  lines.push('_Generated by scripts/drift/capcom-gate.mjs — see 0684-CONTEXT.md §D-07/D-08 for policy._');
  return lines.join('\n');
}

export async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.wave || !args.missionDir) {
    console.error('Usage: capcom-gate.mjs --wave <W0|W1A|W1B|W1C|W2|W3> --mission-dir <path> [--force]');
    process.exit(1);
  }
  const result = await runGate({ wave: args.wave, missionDir: args.missionDir, force: args.force });
  process.exit(result.effectiveExit);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(3); });
}

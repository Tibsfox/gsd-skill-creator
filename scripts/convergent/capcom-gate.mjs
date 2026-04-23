#!/usr/bin/env node
// scripts/convergent/capcom-gate.mjs
// Permanent repo utility shipped by Phase 701 (v1.49.570 Convergent Substrate mission).
//
// CAPCOM go/no-go gate. Callable from any wave boundary (W0->W1, W1->W2, W2->W3, W3->release).
// Reads sources/meta.json + modules/<wave>.tex + schema/convergent_mapping.json, runs five
// checks, emits gates/<wave>_gate.md structured report + exit code.
//
// Severity policy (0701-CONTEXT.md §D-08):
//   Mid-wave (W0, W1A, W1B, W1C, W2) : non-zero exit = WARN, --force override permitted
//   Publication wave (W3)            : non-zero exit = BLOCK, no --force
//
// Checks (0701-CONTEXT.md §D-07):
//   1. cite-resolution      — every \cite{key} in module .tex resolves in meta.json
//   2. numeric-attribution  — every numeric pattern (%, AUROC, pp, x) has inline citation <=50 chars away
//   3. quote-length         — no direct quote exceeds 15 words
//   4. quote-uniqueness     — at most one direct quote per cite_key
//   5. mapping-coverage     — every row in convergent_mapping.json has >=1 Tier-S or Tier-A
//                             cite_key that resolves in meta.json (NEW for this milestone)
//
// Exit codes:
//   0 = pass
//   1 = WARN  (mid-wave only; --force permitted)
//   2 = BLOCK (publication wave only; no override)
//
// CLI:
//   node scripts/convergent/capcom-gate.mjs \
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
  // also match our custom macro
  for (const m of texContent.matchAll(/\\citeconv\{([^}]+)\}/g)) {
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

const NUMERIC_TRAILING_UNIT_RE =
  /(?:\d+(?:[.,]\d+)?)\s*(?:%|pp(?![a-z])|AUROC\b|F1\b|×|(?<!\w)x(?!\w))/gi;

const NUMERIC_LEADING_METRIC_RE =
  /\b(?:AUROC|F1|BLEU|FActScore|accuracy|precision|recall|(?:Cohen(?:'|')s\s+d)|SD\s+score)\b(?:\s+(?:of|score|=|:))?\s+\d+(?:[.,]\d+)?/gi;

const LEADING_METRIC_DROP_SUFFIX_RE = /^\s*(?:\\%|%|pp(?![a-z])|×|x\b)/;

const NUMERIC_NX_RE = /\d+(?:[.,]\d+)?x\b/gi;

export const NUMERIC_RE = NUMERIC_TRAILING_UNIT_RE; // backward-compat

export function checkNumericAttribution(texContent) {
  const lines = texContent.split('\n');
  const violations = [];
  const CITE_WINDOW = 50;
  lines.forEach((line, i) => {
    const matches = [];
    for (const m of line.matchAll(NUMERIC_TRAILING_UNIT_RE)) {
      matches.push({ index: m.index, match: m[0], anchorEnd: m.index + m[0].length });
    }
    for (const m of line.matchAll(NUMERIC_LEADING_METRIC_RE)) {
      const afterIdx = m.index + m[0].length;
      const tail = line.slice(afterIdx, afterIdx + 8);
      if (LEADING_METRIC_DROP_SUFFIX_RE.test(tail)) continue;
      matches.push({ index: m.index, match: m[0], anchorEnd: afterIdx });
    }
    for (const m of line.matchAll(NUMERIC_NX_RE)) {
      matches.push({ index: m.index, match: m[0], anchorEnd: m.index + m[0].length });
    }
    matches.sort((a, b) => a.index - b.index);
    const kept = [];
    let lastEnd = -1;
    for (const m of matches) {
      const end = m.index + m.match.length;
      if (m.index >= lastEnd) {
        kept.push(m);
        lastEnd = end;
      }
    }
    for (const m of kept) {
      const winStart = Math.max(0, m.anchorEnd - CITE_WINDOW);
      const winEnd = Math.min(line.length, m.anchorEnd + CITE_WINDOW);
      const window = line.slice(winStart, winEnd);
      const hasCite = /\\cite[tp]?\*?(?:\[[^\]]*\])?\{[^}]+\}|\\citeconv\{[^}]+\}/.test(window);
      if (!hasCite) {
        violations.push({ line: i + 1, match: m.match, snippet: line.trim().slice(0, 140) });
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
  const paragraphs = texContent.split(/\n{2,}/);
  const quotesByCite = {};
  for (const para of paragraphs) {
    const quotes = [...para.matchAll(QUOTE_RE)].map((m) => (m[1] || m[2] || '').trim());
    if (!quotes.length) continue;
    const citeMatch = para.match(/\\cite[tp]?\*?(?:\[[^\]]*\])?\{([^}]+)\}|\\citeconv\{([^}]+)\}/);
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
// NEW: mapping-coverage check
// Every row in schema/convergent_mapping.json must carry >=1 Tier-S or Tier-A
// cite_key that resolves in meta.json. Tier-B-only rows are a coverage failure.
// ----------------------------------------------------------------------------

export function checkMappingCoverage(mapping, metaEntries) {
  if (!mapping || !Array.isArray(mapping.rows)) {
    return {
      name: 'mapping-coverage',
      pass: false,
      violation_count: 1,
      violations: [{ detail: 'mapping schema missing or malformed (no rows array)' }],
      detail: 'convergent_mapping.json is missing or malformed',
    };
  }
  const known = new Set(metaEntries.map((e) => e.cite_key));
  const violations = [];
  let coveredRows = 0;
  for (const row of mapping.rows) {
    const papers = Array.isArray(row.primary_papers) ? row.primary_papers : [];
    const saOrA = papers.filter((p) => (p.tier === 'tier_s' || p.tier === 'tier_a') && known.has(p.cite_key));
    if (saOrA.length === 0) {
      const listed = papers.map((p) => `${p.cite_key}(${p.tier})`).join(', ') || '(empty)';
      violations.push({
        component: row.component,
        detail: `no resolved Tier-S/Tier-A papers; listed: ${listed}`,
      });
    } else {
      coveredRows++;
    }
  }
  return {
    name: 'mapping-coverage',
    pass: violations.length === 0,
    violation_count: violations.length,
    violations,
    row_count: mapping.rows.length,
    covered_rows: coveredRows,
    detail: violations.length
      ? `${violations.length}/${mapping.rows.length} GSD-component row(s) lack >=1 Tier-S/A resolved paper`
      : `all ${mapping.rows.length} rows carry >=1 Tier-S/A resolved paper`,
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
  const tiersDir = path.join(missionDir, 'tiers');
  const map = {
    W0:  [],
    W1A: [path.join(tiersDir, 'tier_s_all.tex')],
    W1B: [path.join(modulesDir, 'cluster_memory_context.tex'), path.join(modulesDir, 'cluster_orchestration.tex'), path.join(modulesDir, 'cluster_bounded_learning.tex'), path.join(modulesDir, 'cluster_deterministic_protocols.tex'), path.join(modulesDir, 'cluster_adapter_routing.tex'), path.join(modulesDir, 'cluster_evaluation.tex')],
    W1C: [path.join(modulesDir, 'tier_b_pointers.tex')],
    W2:  [path.join(modulesDir, 'mapping.tex'), path.join(modulesDir, 'convergence.tex'), path.join(modulesDir, 'gap_closure.tex')],
    W3:  [
      path.join(tiersDir, 'tier_s_all.tex'),
      path.join(modulesDir, 'cluster_memory_context.tex'),
      path.join(modulesDir, 'cluster_orchestration.tex'),
      path.join(modulesDir, 'cluster_bounded_learning.tex'),
      path.join(modulesDir, 'cluster_deterministic_protocols.tex'),
      path.join(modulesDir, 'cluster_adapter_routing.tex'),
      path.join(modulesDir, 'cluster_evaluation.tex'),
      path.join(modulesDir, 'tier_b_pointers.tex'),
      path.join(modulesDir, 'mapping.tex'),
      path.join(modulesDir, 'convergence.tex'),
      path.join(modulesDir, 'gap_closure.tex'),
    ],
  };
  return map[wave] ?? [];
}

export async function runGate({ wave, missionDir, force = false, stdout = console, now = () => new Date().toISOString() }) {
  if (!WAVES.has(wave)) throw new Error(`unknown wave ${wave}; must be one of ${[...WAVES].join(', ')}`);
  const metaPath = path.join(missionDir, 'sources', 'meta.json');
  const mappingPath = path.join(missionDir, 'schema', 'convergent_mapping.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { entries: [] };
  const mapping = fs.existsSync(mappingPath) ? JSON.parse(fs.readFileSync(mappingPath, 'utf8')) : null;
  const files = waveFiles(missionDir, wave);

  let combined = '';
  const existing = [];
  const missing = [];
  for (const f of files) {
    if (fs.existsSync(f)) { combined += '\n\n' + fs.readFileSync(f, 'utf8'); existing.push(f); }
    else missing.push(f);
  }

  const checks = wave === 'W0'
    ? [
        { name: 'scaffold-sanity', pass: meta.entries.length >= 50, detail: `meta.json has ${meta.entries.length} entries (need >=50)` },
        checkMappingCoverage(mapping, meta.entries),
      ]
    : [
        checkCiteResolution(combined, meta.entries),
        checkNumericAttribution(combined),
        checkQuoteLength(combined),
        checkQuoteUniqueness(combined),
        checkMappingCoverage(mapping, meta.entries),
      ];

  const allPass = checks.every((c) => c.pass);
  const isPublication = wave === PUBLICATION_WAVE;
  const severity = allPass ? 'PASS' : (isPublication ? 'BLOCK' : 'WARN');
  const exitCode = allPass ? 0 : (isPublication ? 2 : 1);

  const gatesDir = path.join(missionDir, 'gates');
  fs.mkdirSync(gatesDir, { recursive: true });
  const report = renderReport({ wave, timestamp: now(), severity, exitCode, force, existing, missing, checks });
  const reportPath = path.join(gatesDir, `${wave}_gate.md`);
  fs.writeFileSync(reportPath, report);

  stdout.log(`\nCAPCOM ${wave}: ${severity} -> ${reportPath}`);
  if (exitCode === 1 && force) {
    stdout.log(`  (--force applied: orchestrator may proceed, but the WARN is logged in the gate report)`);
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
  lines.push('_Generated by scripts/convergent/capcom-gate.mjs — see 0701-CONTEXT.md §D-07/D-08 for policy._');
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

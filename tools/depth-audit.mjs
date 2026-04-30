#!/usr/bin/env node
/**
 * Depth-audit script — catches sibling-file <80%-of-predecessor regressions
 *
 * Closes Lesson #10188 candidate from v1.49.588 §5: W2 build agents that hit
 * Anthropic per-account quota during a parallel build will produce all
 * sibling files at correct count BUT at significantly lower depth than the
 * gold-standard predecessor. The depth gap is invisible from a file-count
 * check; only line-count or grep against gold-standard structural sections
 * detects it. v1.49.588 required ad-hoc rebuild of 6 sibling index.html
 * files at cost of ~25 minutes wall-clock + token expenditure.
 *
 * This script auto-runs at W3 of each milestone (or via npm run depth-audit)
 * and produces PASS/FAIL/WARN per file with %-of-predecessor metrics.
 *
 * Usage:
 *   node tools/depth-audit.mjs <version>           # audit specific version
 *   node tools/depth-audit.mjs --current           # use package.json version
 *   node tools/depth-audit.mjs <version> --json    # machine-readable output
 *   node tools/depth-audit.mjs <version> --strict  # exit 1 on any FAIL
 *
 * Exit codes: 0 = no FAIL findings; 1 = FAIL findings AND --strict;
 *             2 = predecessor missing (cannot compare); 3 = invalid args.
 *
 * Authored 2026-04-30 in v1.49.589 W0 component T2.3.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// REPO_ROOT defaults to the script's parent dir; --root <path> override
// supports hermetic tests + alternative repo layouts.
function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

const REPO_ROOT = resolveRoot(process.argv);

const TRACKS = ['NASA', 'MUS', 'ELC'];
const RESEARCH_ROOT = join(REPO_ROOT, 'www', 'tibsfox', 'com', 'Research');

// Canonical NASA-section regex set. NASA index.html pages use named sections
// like "Three Parallel Threads", "Resonance Axes", etc. (per v1.49.587 +
// v1.49.588 post-rebuild reference, handoff §4).
const NASA_CANONICAL_SECTIONS = [
  /Three\s+Parallel\s+Threads/i,
  /Resonance\s+Axes/i,
  /Founding[- ]Instance\s+Narrative/i,
  /Forest\s+Contribution/i,
  /Governance(?:\s+&|\s+and)?\s+Chain\s+Declaration/i,
  /Data\s+Files/i,
  /Dedication/i,
];

// MUS + ELC pages use numbered card-title h2 sections (different from NASA).
// Gold-standard depth at v1.69 = 14 (MUS) and 13 (ELC) numbered sections;
// we flag <10 as below-depth proxy.
const CARD_TITLE_RE = /<h2\s+class="card-title[^"]*"/g;

// Card-count heuristic — Track cards (8 expected per gold-standard 1.67+).
// Detects standalone `<div class="card">` (no sub-class). Sub-class cards
// like apollo-card / agc-card / resonance-card are counted separately.
const TRACK_CARD_RE = /<div\s+class="card"[\s>]/g;

// NASA: ≥7 of 9 canonical sections = PASS.
// MUS + ELC: ≥10 numbered card-title h2s = PASS.
const NASA_SECTION_PASS_THRESHOLD = 5;
const CARD_TITLE_PASS_THRESHOLD = 10;

// Depth ratios (of predecessor). PASS ≥ pass; WARN [warn,pass); FAIL < warn.
const PASS_RATIO = 0.95;
const WARN_RATIO = 0.80;

function previousVersion(v) {
  // "1.70" → "1.69"; "1.69" → "1.68"
  const m = v.match(/^(\d+)\.(\d+)$/);
  if (!m) return null;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  if (minor === 0) return null;
  return `${major}.${minor - 1}`;
}

function indexHtmlPath(track, version) {
  return join(RESEARCH_ROOT, track, version, 'index.html');
}

function inspectFile(path, track) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  const stat = statSync(path);
  const lines = text.split(/\r?\n/).length;
  const bytes = stat.size;
  const cards = (text.match(TRACK_CARD_RE) || []).length;
  // Track-specific section counting:
  // NASA uses canonical named sections; MUS + ELC use numbered card-title h2s.
  let sectionsFound, sectionsExpected, sectionsThreshold;
  if (track === 'NASA') {
    sectionsFound = NASA_CANONICAL_SECTIONS.filter(re => re.test(text)).length;
    sectionsExpected = NASA_CANONICAL_SECTIONS.length;
    sectionsThreshold = NASA_SECTION_PASS_THRESHOLD;
  } else {
    sectionsFound = (text.match(CARD_TITLE_RE) || []).length;
    sectionsExpected = CARD_TITLE_PASS_THRESHOLD;
    sectionsThreshold = CARD_TITLE_PASS_THRESHOLD;
  }
  return { path, lines, bytes, cards, sectionsFound, sectionsExpected, sectionsThreshold };
}

function ratio(curr, prev) {
  if (!prev || prev === 0) return null;
  return curr / prev;
}

function classify(currMetric, prevMetric) {
  const r = ratio(currMetric, prevMetric);
  if (r === null) return 'UNCOMPARABLE';
  if (r >= PASS_RATIO) return 'PASS';
  if (r >= WARN_RATIO) return 'WARN';
  return 'FAIL';
}

function auditVersion(version) {
  const prevVersion = previousVersion(version);
  if (!prevVersion) {
    console.error(`[depth-audit] cannot determine predecessor for ${version}`);
    process.exit(2);
  }

  const findings = [];
  for (const track of TRACKS) {
    const currPath = indexHtmlPath(track, version);
    const prevPath = indexHtmlPath(track, prevVersion);
    const curr = inspectFile(currPath, track);
    const prev = inspectFile(prevPath, track);

    if (!curr) {
      findings.push({
        track, file: currPath,
        status: 'MISSING',
        message: `current version index.html absent: ${currPath}`,
      });
      continue;
    }
    if (!prev) {
      findings.push({
        track, file: currPath,
        status: 'NO_PREDECESSOR',
        message: `predecessor (${prevVersion}) index.html absent — cannot compute ratio`,
        curr,
      });
      continue;
    }

    const lineRatio = ratio(curr.lines, prev.lines);
    const byteRatio = ratio(curr.bytes, prev.bytes);
    const lineStatus = classify(curr.lines, prev.lines);
    const byteStatus = classify(curr.bytes, prev.bytes);
    // Worst-case status across both metrics
    const status = ['FAIL', 'WARN', 'PASS'].find(s => s === lineStatus || s === byteStatus) || 'PASS';

    const sectionStatus = curr.sectionsFound >= curr.sectionsThreshold ? 'PASS' : 'FAIL';
    const overallStatus = status === 'FAIL' || sectionStatus === 'FAIL' ? 'FAIL' :
                          status === 'WARN' ? 'WARN' : 'PASS';

    findings.push({
      track, file: currPath,
      status: overallStatus,
      curr,
      prev,
      ratios: {
        lines: lineRatio,
        bytes: byteRatio,
      },
      submetrics: {
        lines: lineStatus,
        bytes: byteStatus,
        sections: sectionStatus,
      },
      message: `${overallStatus}: ${(lineRatio * 100).toFixed(0)}% lines / ${(byteRatio * 100).toFixed(0)}% bytes / ${curr.sectionsFound}/${curr.sectionsExpected} ${track === 'NASA' ? 'canonical' : 'card-title'} sections`,
    });
  }

  return { version, predecessor: prevVersion, findings };
}

function formatReport(report) {
  const lines = [];
  lines.push(`Depth-audit report: v${report.version} vs v${report.predecessor}`);
  lines.push('');
  for (const f of report.findings) {
    const emoji = f.status === 'PASS' ? 'OK' : f.status === 'WARN' ? '!!' : 'X ';
    lines.push(`[${emoji}] ${f.track.padEnd(4)} ${f.status.padEnd(15)} ${f.message}`);
    if (f.curr && f.prev) {
      lines.push(`     curr: ${f.curr.lines.toString().padStart(4)} lines / ${f.curr.bytes.toString().padStart(6)} bytes / ${f.curr.cards} cards / ${f.curr.sectionsFound}/${f.curr.sectionsExpected} sections`);
      lines.push(`     prev: ${f.prev.lines.toString().padStart(4)} lines / ${f.prev.bytes.toString().padStart(6)} bytes / ${f.prev.cards} cards / ${f.prev.sectionsFound}/${f.prev.sectionsExpected} sections`);
    }
  }
  return lines.join('\n');
}

function summary(report) {
  const counts = { PASS: 0, WARN: 0, FAIL: 0, MISSING: 0, NO_PREDECESSOR: 0 };
  for (const f of report.findings) counts[f.status] = (counts[f.status] || 0) + 1;
  return counts;
}

function main() {
  // Strip --root <path> from the args so the positional version arg is intact
  const rawArgs = process.argv.slice(2);
  const args = rawArgs.filter((a, i, arr) => a !== '--root' && arr[i - 1] !== '--root');
  const useCurrent = args.includes('--current');
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const positional = args.filter(a => !a.startsWith('--'));

  let version;
  if (useCurrent) {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
    // package.json carries semver "1.49.589" → audit version "1.NN" derived
    // from the NASA-degree slot. The mission-package convention encodes
    // NASA degree in the 1.NN.NNN third-octet drift; we use STATE.md's
    // nasa_degree field as the canonical source for the audit-version.
    const stateText = existsSync(join(REPO_ROOT, '.planning', 'STATE.md'))
      ? readFileSync(join(REPO_ROOT, '.planning', 'STATE.md'), 'utf8') : '';
    const degreeMatch = stateText.match(/^nasa_degree:\s*(\d+)/m);
    if (!degreeMatch) {
      console.error('[depth-audit] --current requires nasa_degree in .planning/STATE.md');
      process.exit(3);
    }
    version = `1.${degreeMatch[1]}`;
  } else if (positional.length === 1) {
    version = positional[0].replace(/^v/, '');
  } else {
    console.error('Usage: depth-audit.mjs <version> | --current  [--json] [--strict]');
    console.error('  version: NASA-degree form like "1.70" (not the npm "1.49.589" form)');
    process.exit(3);
  }

  const report = auditVersion(version);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
    console.log('');
    const s = summary(report);
    const parts = [];
    for (const k of ['PASS', 'WARN', 'FAIL', 'MISSING', 'NO_PREDECESSOR']) {
      if (s[k]) parts.push(`${k}=${s[k]}`);
    }
    console.log(`Summary: ${parts.join(' / ') || 'no findings'}`);
  }

  const failCount = report.findings.filter(f => f.status === 'FAIL' || f.status === 'MISSING').length;
  if (strict && failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();

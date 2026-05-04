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

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
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

// Composite-pass thresholds (added v1.49.593 W0.3 per Lesson #10207).
// When --composite-pass flag is on AND lines ≥ 0.95 AND sections meet threshold,
// relax bytes thresholds to capture "concise but complete" cases (e.g. v1.71/1.72/1.73
// MUS+ELC bytes-WARN that v1.49.592 close found were legitimate density variance).
const COMPOSITE_BYTES_PASS_RATIO = 0.75;
const COMPOSITE_BYTES_WARN_RATIO = 0.60;

// NASA artifacts/ canonical 13-file suite (added v1.49.593 W0.2b per #10213).
// Per gold standard v1.69 + v1.70: 13 files across 5 categories.
// Each category = 1 expected subdirectory under artifacts/.
const NASA_ARTIFACT_CATEGORIES = ['story', 'shaders', 'audio', 'sims', 'circuits'];
const ARTIFACT_PASS_THRESHOLD = 10;     // ≥10 files = PASS
const ARTIFACT_WARN_THRESHOLD = 4;      // 4-9 files = WARN; <4 = FAIL
const ARTIFACT_CATEGORY_PASS_THRESHOLD = 5; // 5/5 categories = PASS; 4/5 = WARN; <4 = FAIL

// Cross-link coverage thresholds (added v1.49.594 W0 per #10222 candidate).
// Per gold standard v1.69 + v1.70: every artifact file on disk is referenced
// at least once via `<a href="artifacts/...">` from index.html (Creative
// Artifacts + Runnable Simulations + track-card sections). v1.72/v1.73/v1.74
// shipped with thin/empty/missing card-population — artifacts existed but
// were invisible from the page. coverage = distinct-paths-referenced / files-on-disk.
const CROSSLINK_PASS_RATIO = 0.80;      // ≥80% of artifacts referenced = PASS
const CROSSLINK_WARN_RATIO = 0.50;      // 50-80% = WARN; <50% = FAIL
// Soak mode: at v1.49.594 introduction, FAIL is downgraded to WARN in the
// overall_status rollup unless `--cross-link-strict` is set. Flip the
// pre-tag-gate.sh invocation to add `--cross-link-strict` at v1.49.595+ ship
// (soak-then-harden pattern matching v1.49.591 depth-audit BLOCKER cutover).

// NASA Research Track cards canonical 8-card grid (added v1.49.603 — closes
// post-v602 operator-discovered drift class across degrees 1.76-1.81 where
// Track 1a/1b/2/3/4/5/6/7 cards were missing or partial). Per gold-standard
// v1.74 (Apollo 10): 8 unique cards (Track 1a Mission Narrative + Track 1b
// Wall-Clock Papers + Track 2 Organism + Track 3 Mathematics + Track 4
// Curriculum + Track 5 Simulation & Arts + Track 6 MUS cross-track + Track 7
// ELC cross-track). Per #10244 ESTABLISHED counter-cadence pattern (3rd
// instance = v585 self-mod-guard + v601 catalog-index + v603 track-cards).
const NASA_TRACK_CARD_VARIANTS = [
  /Track\s+1a\b/i,
  /Track\s+1b\b/i,
  /Track\s+2\b/i,
  /Track\s+3\b/i,
  /Track\s+4\b/i,
  /Track\s+5\b/i,
  /Track\s+6\b/i,
  /Track\s+7\b/i,
];
const TRACK_CARDS_PASS_THRESHOLD = 8;   // 8/8 unique cards = PASS
const TRACK_CARDS_WARN_THRESHOLD = 6;   // 6-7 = WARN; <6 = FAIL/BLOCKER

// NASA bottom-of-content nav-card (added v1.49.603). Per gold standard v1.69
// + v1.70 + v1.74: at least one occurrence of `nav-card` class (typically
// rendered as a div with prev/index/next anchor links before the <footer>).
// PASS at ≥1; FAIL at 0.
const NAV_CARD_RE = /\bnav-card\b/g;
const NAV_CARD_PASS_THRESHOLD = 1;

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

/**
 * Inspect NASA artifacts/ directory for v1.49.593+ artifact-suite enforcement.
 * Returns { totalFiles, categoriesFound: Set, categoriesExpected: 5, status }.
 *
 * status: 'PASS' (≥10 files AND 5/5 categories) /
 *         'WARN' (4-9 files OR 4/5 categories) /
 *         'FAIL' (<4 files OR <4 categories) /
 *         'MISSING' (artifacts/ dir absent)
 *
 * Per Lesson #10213 candidate (USER-FLAGGED 2026-05-01): v1.71 + v1.72 + v1.73
 * NASA artifacts shipped at 13/4/4 files respectively (vs 13-file gold). Drift
 * was structurally invisible to the BLOCKER gate because index.html-only
 * checks didn't see the artifacts/ directory.
 */
function inspectArtifacts(track, version) {
  if (track !== 'NASA') return null; // Only NASA enforces the 13-file suite
  const artifactsDir = join(RESEARCH_ROOT, track, version, 'artifacts');
  if (!existsSync(artifactsDir)) {
    return {
      path: artifactsDir,
      totalFiles: 0,
      categoriesFound: new Set(),
      categoriesExpected: NASA_ARTIFACT_CATEGORIES.length,
      status: 'MISSING',
    };
  }

  let totalFiles = 0;
  const categoriesFound = new Set();
  for (const cat of NASA_ARTIFACT_CATEGORIES) {
    const catDir = join(artifactsDir, cat);
    if (!existsSync(catDir)) continue;
    let entries;
    try {
      entries = readdirSync(catDir, { withFileTypes: true });
    } catch {
      continue;
    }
    const files = entries.filter(e => e.isFile()).length;
    if (files > 0) {
      categoriesFound.add(cat);
      totalFiles += files;
    }
  }

  let status;
  if (totalFiles >= ARTIFACT_PASS_THRESHOLD &&
      categoriesFound.size >= ARTIFACT_CATEGORY_PASS_THRESHOLD) {
    status = 'PASS';
  } else if (totalFiles >= ARTIFACT_WARN_THRESHOLD &&
             categoriesFound.size >= 4) {
    status = 'WARN';
  } else {
    status = 'FAIL';
  }

  return {
    path: artifactsDir,
    totalFiles,
    categoriesFound: [...categoriesFound].sort(),
    categoriesExpected: NASA_ARTIFACT_CATEGORIES.length,
    status,
  };
}

/**
 * Inspect index.html cross-links to artifacts/ files (added v1.49.594 W0 #10222).
 * Returns { count, distinctReferenced, totalOnDisk, coverage, status, missingPaths }
 * or null if track is not NASA or there are no artifacts on disk.
 *
 * The check counts `<a href="artifacts/...">` references (any anchor — track-card,
 * Creative Artifacts list, Runnable Simulations list, Forest Contribution prose),
 * deduplicates by href path, then computes coverage = distinctReferenced / totalOnDisk.
 *
 * Status: PASS (≥80%) / WARN (50-80%) / FAIL (<50%) — per #10222 carry-forward fix.
 */
function inspectCrossLinks(track, version, artifactsInfo) {
  if (track !== 'NASA') return null;
  if (!artifactsInfo || artifactsInfo.status === 'MISSING') return null;
  if (artifactsInfo.totalFiles === 0) return null;

  const indexPath = indexHtmlPath(track, version);
  if (!existsSync(indexPath)) return null;
  const text = readFileSync(indexPath, 'utf8');

  // Match every `href="artifacts/<path>"` reference. Capture the path so we
  // can deduplicate. Tolerates surrounding attributes/spaces/single-quotes.
  const hrefRe = /href=["']artifacts\/([^"'#?]+)["'#?]/g;
  const distinct = new Set();
  let count = 0;
  let m;
  while ((m = hrefRe.exec(text)) !== null) {
    count++;
    distinct.add(m[1]);
  }

  // Enumerate the artifact files on disk (relative to artifacts/) so we can
  // identify which specific files lack a cross-link.
  const artifactsDir = join(RESEARCH_ROOT, track, version, 'artifacts');
  const onDiskPaths = new Set();
  for (const cat of NASA_ARTIFACT_CATEGORIES) {
    const catDir = join(artifactsDir, cat);
    if (!existsSync(catDir)) continue;
    let entries;
    try {
      entries = readdirSync(catDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isFile()) onDiskPaths.add(`${cat}/${e.name}`);
    }
  }

  const totalOnDisk = onDiskPaths.size;
  // Count how many on-disk files have at least one matching reference. Use
  // prefix-match so href="artifacts/circuits/foo.cir" counts foo.cir as
  // referenced; href="artifacts/circuits/" alone does not.
  let coveredOnDisk = 0;
  const missingPaths = [];
  for (const p of onDiskPaths) {
    if (distinct.has(p)) {
      coveredOnDisk++;
    } else {
      missingPaths.push(p);
    }
  }
  const coverage = totalOnDisk > 0 ? coveredOnDisk / totalOnDisk : 1.0;

  let status;
  if (coverage >= CROSSLINK_PASS_RATIO) status = 'PASS';
  else if (coverage >= CROSSLINK_WARN_RATIO) status = 'WARN';
  else status = 'FAIL';

  return {
    count,
    distinctReferenced: distinct.size,
    coveredOnDisk,
    totalOnDisk,
    coverage,
    status,
    missingPaths: missingPaths.sort(),
  };
}

/**
 * Inspect NASA Research Track cards (added v1.49.603 — closes #10244-pattern
 * silent-drift class surfaced across degrees 1.76-1.81). Counts unique
 * Track 1a/1b/2/3/4/5/6/7 occurrences in index.html.
 *
 * status: 'PASS' (8/8 unique cards) /
 *         'WARN' (6-7 unique cards) /
 *         'FAIL' (<6 unique cards)
 *
 * MUS + ELC: not enforced (their pages use numbered card-title h2s instead).
 */
function inspectTrackCards(track, version) {
  if (track !== 'NASA') return null;
  const indexPath = indexHtmlPath(track, version);
  if (!existsSync(indexPath)) return null;
  const text = readFileSync(indexPath, 'utf8');

  const found = [];
  const missing = [];
  for (const re of NASA_TRACK_CARD_VARIANTS) {
    if (re.test(text)) {
      found.push(re.source.replace(/\\s\+/g, ' ').replace(/\\b/g, ''));
    } else {
      missing.push(re.source.replace(/\\s\+/g, ' ').replace(/\\b/g, ''));
    }
  }

  const uniqueFound = found.length;
  let status;
  if (uniqueFound >= TRACK_CARDS_PASS_THRESHOLD) status = 'PASS';
  else if (uniqueFound >= TRACK_CARDS_WARN_THRESHOLD) status = 'WARN';
  else status = 'FAIL';

  return {
    found: uniqueFound,
    expected: NASA_TRACK_CARD_VARIANTS.length,
    foundCards: found,
    missingCards: missing,
    status,
  };
}

/**
 * Inspect NASA bottom-of-content nav-card (added v1.49.603 — closes the same
 * silent-drift class as inspectTrackCards). Verifies ≥1 occurrence of
 * `nav-card` class in index.html.
 *
 * status: 'PASS' (≥1) / 'FAIL' (0)
 */
function inspectNavCard(track, version) {
  if (track !== 'NASA') return null;
  const indexPath = indexHtmlPath(track, version);
  if (!existsSync(indexPath)) return null;
  const text = readFileSync(indexPath, 'utf8');

  const matches = text.match(NAV_CARD_RE) || [];
  const count = matches.length;

  return {
    count,
    status: count >= NAV_CARD_PASS_THRESHOLD ? 'PASS' : 'FAIL',
  };
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

function classify(currMetric, prevMetric, opts = {}) {
  const r = ratio(currMetric, prevMetric);
  if (r === null) return 'UNCOMPARABLE';
  const passRatio = opts.passRatio !== undefined ? opts.passRatio : PASS_RATIO;
  const warnRatio = opts.warnRatio !== undefined ? opts.warnRatio : WARN_RATIO;
  if (r >= passRatio) return 'PASS';
  if (r >= warnRatio) return 'WARN';
  return 'FAIL';
}

function auditVersion(version, opts = {}) {
  const compositePass = opts.compositePass === true;
  const crossLinkStrict = opts.crossLinkStrict === true;
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
    const sectionPreCheck = curr.sectionsFound >= curr.sectionsThreshold;

    // Composite-pass: when --composite-pass flag is on AND lines ≥ 95% AND
    // sections meet threshold, relax bytes threshold (per Lesson #10207).
    const useComposite = compositePass && lineStatus === 'PASS' && sectionPreCheck;
    const byteStatus = useComposite
      ? classify(curr.bytes, prev.bytes, { passRatio: COMPOSITE_BYTES_PASS_RATIO, warnRatio: COMPOSITE_BYTES_WARN_RATIO })
      : classify(curr.bytes, prev.bytes);

    // Worst-case status across both metrics
    const status = ['FAIL', 'WARN', 'PASS'].find(s => s === lineStatus || s === byteStatus) || 'PASS';

    const sectionStatus = curr.sectionsFound >= curr.sectionsThreshold ? 'PASS' : 'FAIL';

    // NASA-only: inspect artifacts/ directory for 13-file canonical suite (v1.49.593+).
    const artifacts = inspectArtifacts(track, version);
    const artifactStatus = artifacts ? artifacts.status : 'PASS'; // MUS+ELC always PASS

    // NASA-only: inspect cross-links from index.html → artifacts/ (v1.49.594+, #10222).
    // During v1.49.594 soak: FAIL is downgraded to WARN unless --cross-link-strict is set.
    const crossLinks = inspectCrossLinks(track, version, artifacts);
    const crossLinkRawStatus = crossLinks ? crossLinks.status : 'PASS';
    const crossLinkStatus = (!crossLinkStrict && crossLinkRawStatus === 'FAIL')
      ? 'WARN'
      : crossLinkRawStatus;

    // NASA-only: inspect Research Track cards (8/8 unique) and bottom-of-content
    // nav-card presence (v1.49.603+; closes post-v602 operator-discovered drift
    // class across 1.76-1.81). Both gates BLOCKER mode at introduction since
    // all 6 affected degrees were hot-fixed pre-v603 (no soak phase needed).
    // SC_SKIP_TRACK_CARDS_GATE=1 environment variable downgrades FAIL → WARN
    // for the rollup (emergency override; mirrors SC_SKIP_DEPTH_AUDIT pattern).
    const trackCards = inspectTrackCards(track, version);
    const navCard = inspectNavCard(track, version);
    const trackCardsRawStatus = trackCards ? trackCards.status : 'PASS';
    const navCardRawStatus = navCard ? navCard.status : 'PASS';
    const skipTrackCardsGate = process.env.SC_SKIP_TRACK_CARDS_GATE === '1';
    const trackCardsStatus = (skipTrackCardsGate && trackCardsRawStatus === 'FAIL')
      ? 'WARN' : trackCardsRawStatus;
    const navCardStatus = (skipTrackCardsGate && navCardRawStatus === 'FAIL')
      ? 'WARN' : navCardRawStatus;

    // Roll up worst-case across all submetrics. MISSING (artifacts/ dir absent)
    // is treated as FAIL — the artifacts/ directory is mandatory for NASA tracks.
    const allSignals = [status, sectionStatus, artifactStatus, crossLinkStatus, trackCardsStatus, navCardStatus];
    const overallStatus =
      allSignals.some(s => s === 'FAIL' || s === 'MISSING') ? 'FAIL' :
      allSignals.includes('WARN') ? 'WARN' : 'PASS';

    const baseMsg = `${(lineRatio * 100).toFixed(0)}% lines / ${(byteRatio * 100).toFixed(0)}% bytes / ${curr.sectionsFound}/${curr.sectionsExpected} ${track === 'NASA' ? 'canonical' : 'card-title'} sections`;
    const artifactMsg = artifacts ? ` / ${artifacts.totalFiles} artifacts ${artifacts.categoriesFound.length}/${artifacts.categoriesExpected} cat` : '';
    const crossLinkMsg = crossLinks ? ` / ${crossLinks.coveredOnDisk}/${crossLinks.totalOnDisk} linked` : '';
    const trackCardsMsg = trackCards ? ` / ${trackCards.found}/${trackCards.expected} track-cards` : '';
    const navCardMsg = navCard ? ` / ${navCard.count}× nav-card` : '';
    findings.push({
      track, file: currPath,
      status: overallStatus,
      curr,
      prev,
      artifacts,
      crossLinks,
      trackCards,
      navCard,
      ratios: {
        lines: lineRatio,
        bytes: byteRatio,
      },
      submetrics: {
        lines: lineStatus,
        bytes: byteStatus,
        sections: sectionStatus,
        artifacts: artifactStatus,
        crossLinks: crossLinkStatus,
        crossLinksRaw: crossLinkRawStatus,
        trackCards: trackCardsStatus,
        trackCardsRaw: trackCardsRawStatus,
        navCard: navCardStatus,
        navCardRaw: navCardRawStatus,
      },
      compositePassActive: useComposite,
      crossLinkStrictActive: crossLinkStrict,
      trackCardsGateSkipped: skipTrackCardsGate,
      message: `${overallStatus}${useComposite ? ' (composite)' : ''}: ${baseMsg}${artifactMsg}${crossLinkMsg}${trackCardsMsg}${navCardMsg}`,
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
    if (f.artifacts && f.artifacts.status !== 'PASS') {
      const cats = f.artifacts.categoriesFound.join(',') || 'none';
      lines.push(`     artifacts: ${f.artifacts.status} — ${f.artifacts.totalFiles} files / ${f.artifacts.categoriesFound.length}/${f.artifacts.categoriesExpected} categories (have: ${cats})`);
    }
    if (f.crossLinks && f.crossLinks.status !== 'PASS') {
      const pct = (f.crossLinks.coverage * 100).toFixed(0);
      const softNote = f.submetrics && f.submetrics.crossLinks !== f.submetrics.crossLinksRaw
        ? ` (soft-mode: ${f.submetrics.crossLinksRaw} downgraded to ${f.submetrics.crossLinks})`
        : '';
      lines.push(`     cross-links: ${f.crossLinks.status} — ${f.crossLinks.coveredOnDisk}/${f.crossLinks.totalOnDisk} artifacts referenced (${pct}% coverage)${softNote}`);
      if (f.crossLinks.missingPaths.length > 0 && f.crossLinks.missingPaths.length <= 6) {
        lines.push(`     missing: ${f.crossLinks.missingPaths.join(', ')}`);
      } else if (f.crossLinks.missingPaths.length > 6) {
        lines.push(`     missing: ${f.crossLinks.missingPaths.slice(0, 5).join(', ')}, ... +${f.crossLinks.missingPaths.length - 5} more`);
      }
    }
    if (f.trackCards && f.trackCards.status !== 'PASS') {
      const skipNote = f.trackCardsGateSkipped && f.submetrics && f.submetrics.trackCards !== f.submetrics.trackCardsRaw
        ? ` (override: SC_SKIP_TRACK_CARDS_GATE=1; ${f.submetrics.trackCardsRaw} downgraded to ${f.submetrics.trackCards})`
        : '';
      lines.push(`     track-cards: ${f.trackCards.status} — ${f.trackCards.found}/${f.trackCards.expected} unique Track 1a/1b/2/3/4/5/6/7${skipNote}`);
      if (f.trackCards.missingCards.length > 0) {
        lines.push(`     missing tracks: ${f.trackCards.missingCards.join(', ')}`);
      }
    }
    if (f.navCard && f.navCard.status !== 'PASS') {
      const skipNote = f.trackCardsGateSkipped && f.submetrics && f.submetrics.navCard !== f.submetrics.navCardRaw
        ? ` (override: SC_SKIP_TRACK_CARDS_GATE=1; ${f.submetrics.navCardRaw} downgraded to ${f.submetrics.navCard})`
        : '';
      lines.push(`     nav-card: ${f.navCard.status} — ${f.navCard.count} occurrence(s) of nav-card class (gold pattern: ≥1 bottom-of-content nav block)${skipNote}`);
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
  const compositePass = args.includes('--composite-pass');
  const crossLinkStrict = args.includes('--cross-link-strict');
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
    console.error('Usage: depth-audit.mjs <version> | --current  [--json] [--strict] [--composite-pass] [--cross-link-strict]');
    console.error('  version: NASA-degree form like "1.70" (not the npm "1.49.589" form)');
    console.error('  --composite-pass: when lines ≥ 95% AND sections meet threshold, relax bytes thresholds (per #10207)');
    console.error('  --cross-link-strict: cross-link FAIL contributes FAIL to overall status (default: soak-mode WARN; per #10222)');
    console.error('  Env: SC_SKIP_TRACK_CARDS_GATE=1 — downgrades track-card-coverage + nav-card-presence FAIL → WARN (emergency override; per v1.49.603)');
    process.exit(3);
  }

  const report = auditVersion(version, { compositePass, crossLinkStrict });

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

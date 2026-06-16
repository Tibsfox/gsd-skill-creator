#!/usr/bin/env node
/**
 * nasa-consistency-audit.mjs — deterministic corpus consistency audit for the
 * NASA Mission Series, implementing the 2026-06-12 canonical amendments
 * (NASA-DEGREE-CANONICAL.md §3.A, §3.B, §14.0, §18, §19).
 *
 * Measures, per mission directory www/tibsfox/com/Research/NASA/1.N/:
 *   shell          — layout shell variant (content-sidebar | wrap-main | other)
 *   cards          — <h2> headings found in index.html
 *   navcard        — pair count, inner-markup style, dead prev/next targets
 *   header         — badge text length, longest span, h1 length, breadcrumb length
 *   organism       — organism-card / ASCII glyph / SVG pairing diagram / plant card
 *   artifacts      — file count on disk, artifact hrefs in index, dead hrefs
 *   forest         — module dir state (js | not-applicable | empty | missing) + manifest row
 *   retro          — retrospective chain pair presence
 *   papers         — external literature links in papers.html (excludes font/CDN)
 *   jsons          — knowledge-nodes / data-sources parse + floor counts
 *   tracks         — presence of the 6 track pages + index
 *
 * Output: .planning/nasa-audit/findings.json + console summary.
 * Read-only: never writes inside www/.
 *
 * Usage: node tools/nasa-consistency-audit.mjs [--root <repo-root>] [--quiet] [--gate]
 *
 * --gate: corpus mode exits 1 if ANY mission has findings (else 0), so the
 *   ship gate (tools/nasa-canonical-layout-gate.sh, invoked by pre-tag-gate
 *   step 15) can BLOCK on the consistency invariants. Without --gate the
 *   corpus run always exits 0 (report-only), preserving legacy callers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argRoot = process.argv.indexOf('--root');
if (argRoot > -1 && !process.argv[argRoot + 1]) {
  console.error('--root requires a path value');
  process.exit(2);
}
const ROOT = argRoot > -1 ? process.argv[argRoot + 1] : path.resolve(__dirname, '..');
const QUIET = process.argv.includes('--quiet');
const GATE = process.argv.includes('--gate');
const NASA = path.join(ROOT, 'www/tibsfox/com/Research/NASA');
const OUT_DIR = path.join(ROOT, '.planning/nasa-audit');

// §3.A thresholds
const BADGE_TOTAL_MAX = 450;     // chars of rendered badge text before "wall" flag
const BADGE_SPAN_MAX = 140;      // chars per badge span
const H1_MAX = 200;
const BREADCRUMB_MAX = 160;
// §18 floor
const PAPERS_LINK_FLOOR = 5;

const TRACK_PAGES = ['research.html', 'papers.html', 'organism.html', 'mathematics.html', 'curriculum.html', 'simulation.html'];

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function listMissions() {
  return fs.readdirSync(NASA)
    .filter((d) => /^1\.\d+$/.test(d) && fs.statSync(path.join(NASA, d)).isDirectory())
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
}

function loadManifestVersions() {
  const m = path.join(NASA, '_harness/v1.0.0/forest-module-manifest.json');
  try {
    const j = JSON.parse(fs.readFileSync(m, 'utf8'));
    const vers = new Set();
    for (const rel of j.modules || []) {
      const mm = /\.\.\/\.\.\/(1\.\d+)\//.exec(rel);
      if (mm) vers.add(mm[1]);
    }
    return vers;
  } catch {
    return new Set();
  }
}

function auditMission(ver, allDirs, manifestVers) {
  const dir = path.join(NASA, ver);
  const f = { version: ver, issues: [] };
  const issue = (code, detail) => f.issues.push(detail ? `${code}: ${detail}` : code);

  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    issue('NO_INDEX');
    return f;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  f.index_bytes = html.length;

  // ---- shell ----
  if (html.includes('class="content"') && html.includes('class="sidebar"')) f.shell = 'content-sidebar';
  else if (html.includes('class="wrap"') && html.includes('class="main"')) f.shell = 'wrap-main';
  else if (html.includes('class="sidebar"')) f.shell = 'main-sidebar';
  else f.shell = 'other';

  // ---- cards ----
  f.cards = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)].map((m) => stripTags(m[1]).slice(0, 60));

  // ---- nav-card ----
  const navCount = (html.match(/<div class="nav-card"/g) || []).length;
  f.nav = { count: navCount, canonicalCells: html.includes('nav-cell'), dead: [] };
  if (navCount < 2) issue('NAV_PAIR_MISSING', `count=${navCount}`);
  for (const m of html.matchAll(/href="\.\.\/(1\.\d+)\/index\.html"/g)) {
    if (!allDirs.has(m[1])) f.nav.dead.push(m[1]);
  }
  f.nav.dead = [...new Set(f.nav.dead)];
  if (f.nav.dead.length) issue('NAV_DEAD_TARGET', f.nav.dead.join(','));

  // ---- header / badge discipline (§3.A) ----
  const badgeBlock = /<div class="mission-badge">([\s\S]*?)<\/div>/.exec(html);
  let badgeText = '';
  let longestSpan = 0;
  if (badgeBlock) {
    const spans = [...badgeBlock[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => stripTags(m[1]));
    badgeText = spans.join(' ');
    longestSpan = spans.reduce((a, s) => Math.max(a, s.length), 0);
  }
  const h1m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  const h1len = h1m ? stripTags(h1m[1]).length : 0;
  const bcm = /<div class="breadcrumb">([\s\S]*?)<\/div>/.exec(html);
  const bclen = bcm ? stripTags(bcm[1]).length : 0;
  f.header = { badge_chars: badgeText.length, longest_span: longestSpan, h1_chars: h1len, breadcrumb_chars: bclen };
  if (badgeText.length > BADGE_TOTAL_MAX || longestSpan > BADGE_SPAN_MAX) issue('BADGE_WALL', `total=${badgeText.length} longest=${longestSpan}`);
  if (h1len > H1_MAX) issue('H1_LONG', `${h1len}`);
  if (bclen > BREADCRUMB_MAX) issue('BREADCRUMB_LONG', `${bclen}`);

  // ---- organism pairing card (§3.B) ----
  f.organism = {
    card: html.includes('organism-card'),
    ascii_glyph: html.includes('organism-glyph'),
    svg_diagram: /<svg[^>]*class="[^"]*pairing-diagram/.test(html),
    plant_card: /organism-card plant|class="card plant|Plant companion/i.test(html),
  };
  if (!f.organism.card) issue('NO_ORGANISM_CARD');
  if (f.organism.ascii_glyph) issue('ASCII_GLYPH');
  if (!f.organism.svg_diagram) issue('NO_SVG_PAIRING_DIAGRAM');

  // ---- artifacts + link integrity (§3 card 8) ----
  const artDir = path.join(dir, 'artifacts');
  let artFiles = [];
  if (fs.existsSync(artDir)) {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (!/\.bak\d*$/.test(e.name)) artFiles.push(path.relative(dir, p));
      }
    };
    walk(artDir);
  }
  const artHrefs = [...html.matchAll(/href="(artifacts\/[^"#?]+)"/g)].map((m) => m[1]);
  const deadArt = [...new Set(artHrefs.filter((h) => !fs.existsSync(path.join(dir, h))))];
  const linkedSet = new Set(artHrefs);
  const unlinked = artFiles.filter((p) => !linkedSet.has(p) && /\.(html|frag|dsp|md|py|cir|tex)$/.test(p));
  f.artifacts = { files: artFiles.length, links: artHrefs.length, dead_links: deadArt, unlinked: unlinked.length };
  if (deadArt.length) issue('ARTIFACT_DEAD_LINKS', deadArt.slice(0, 5).join(','));
  if (artFiles.length > 0 && artHrefs.length === 0) issue('ARTIFACTS_UNLINKED_ALL', `${artFiles.length} files, 0 links`);
  if (artFiles.length < 11) issue('ARTIFACT_COLLAPSE', `${artFiles.length} files (spec: 21)`);

  // ---- page-wide internal dead links (index.html) ----
  // Catches stale references the nav/artifact checks miss (e.g. sidebar links
  // to discoveries.html, wrong-version axis links like ../1.708/).
  // Only the Research/ subtree is mirrored locally; links elsewhere within the
  // web root (e.g. the site homepage) are assumed live. Links resolving ABOVE
  // the web root are always bugs.
  const WEB_ROOT = path.join(ROOT, 'www/tibsfox/com');
  const RESEARCH_ROOT = path.join(WEB_ROOT, 'Research');
  const deadInternal = [];
  const escapes = [];
  for (const m of html.matchAll(/href="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:|ftp:|javascript:|data:|\/\/)/.test(h)) continue;
    if (h.startsWith('artifacts/')) continue; // covered by artifact check
    const target = h.startsWith('/') ? path.join(WEB_ROOT, h) : path.resolve(dir, h);
    // target === WEB_ROOT (a link to the site root) is in-root, not an escape.
    if (target !== WEB_ROOT && !target.startsWith(WEB_ROOT + path.sep)) { escapes.push(h); continue; }
    if (!target.startsWith(RESEARCH_ROOT + path.sep)) continue; // not mirrored locally
    const candidates = h.endsWith('/') ? [path.join(target, 'index.html'), target] : [target];
    if (!candidates.some((c) => fs.existsSync(c))) deadInternal.push(h);
  }
  f.dead_internal = [...new Set(deadInternal)];
  if (f.dead_internal.length) issue('DEAD_INTERNAL_LINKS', f.dead_internal.slice(0, 6).join(','));
  if (escapes.length) issue('LINK_ESCAPES_WEBROOT', [...new Set(escapes)].slice(0, 4).join(','));

  // ---- shader references (JS-fetched .frag paths; v1.49.1043 carryover #3) ----
  // The artifact-href check above only catches <a href="artifacts/..."> links.
  // Shaders are loaded by JavaScript via fetch('<name>.frag') (e.g. the
  // standalone artifacts/shaders/viewer.html), a reference the href regex is
  // blind to: a renamed shader whose fetch path was not updated breaks the
  // screensaver at runtime while the audit stays green (the v1039–v1042
  // "verified by hand" gap). Scan every quoted string literal ending in .frag
  // across the degree's .html/.js files and assert each resolves to a file on
  // disk, relative to the referencing file. Static literals only (interpolated
  // / concatenated paths are skipped — not statically checkable). Degrees with
  // no shader carry no such references and are naturally exempt.
  const shaderRefs = [];
  const deadShaderRefs = [];
  const scanForFrag = (fileAbs) => {
    let txt;
    try { txt = fs.readFileSync(fileAbs, 'utf8'); } catch { return; }
    for (const m of txt.matchAll(/(['"`])([^'"`\n]*\.frag)\1/g)) {
      const ref = m[2];
      if (/^(https?:|\/\/)/.test(ref)) continue;     // external URL, not local
      if (ref.includes('${') || ref.includes('+')) continue; // dynamic, not statically checkable
      const resolved = ref.startsWith('/')
        ? path.join(WEB_ROOT, ref)
        : path.resolve(path.dirname(fileAbs), ref);
      const relFrom = path.relative(dir, fileAbs);
      shaderRefs.push(`${relFrom}:${ref}`);
      if (!fs.existsSync(resolved)) deadShaderRefs.push(`${relFrom} -> ${ref}`);
    }
  };
  const walkScan = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkScan(p);
      else if (/\.(html|js)$/.test(e.name) && !/\.bak\d*$/.test(e.name)) scanForFrag(p);
    }
  };
  walkScan(dir);
  f.shaders = {
    frag_on_disk: artFiles.filter((p) => p.endsWith('.frag')).length,
    refs: [...new Set(shaderRefs)].length,
    dead_refs: [...new Set(deadShaderRefs)],
  };
  if (f.shaders.dead_refs.length) issue('SHADER_REF_DEAD', f.shaders.dead_refs.slice(0, 5).join(' ; '));

  // ---- forest (§14.0) ----
  const fmDir = path.join(dir, 'forest-module');
  let forest = 'missing';
  if (fs.existsSync(fmDir)) {
    const entries = fs.readdirSync(fmDir).filter((e) => !/\.bak\d*$/.test(e));
    if (entries.some((e) => e.endsWith('.js'))) forest = 'module';
    else if (entries.some((e) => e === 'NOT_APPLICABLE.md')) forest = 'not-applicable';
    else forest = 'empty';
  }
  f.forest = { state: forest, in_manifest: manifestVers.has(ver) };
  if (forest === 'missing') issue('FOREST_MISSING');
  if (forest === 'empty') issue('FOREST_EMPTY_DIR');
  if (forest === 'not-applicable') issue('FOREST_NA_SPECIES_GAP'); // §14.0: species coupling always applicable
  if (forest === 'module' && !f.forest.in_manifest) issue('FOREST_NOT_IN_MANIFEST');

  // ---- retrospective chain (§15) ----
  f.retro = {
    carryover: fs.existsSync(path.join(dir, 'retrospective/lessons-carryover.json')),
    deltas: fs.existsSync(path.join(dir, 'retrospective/corpus-deltas.md')),
  };
  if (!f.retro.carryover || !f.retro.deltas) issue('RETRO_CHAIN_MISSING');

  // ---- papers (§18) ----
  const papersPath = path.join(dir, 'papers.html');
  if (fs.existsSync(papersPath)) {
    const ph = fs.readFileSync(papersPath, 'utf8');
    const ext = [...ph.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !/fonts\.googleapis|fonts\.gstatic|googletagmanager/.test(u));
    const lit = ext.filter((u) => /doi\.org|adsabs|ntrs\.nasa|arxiv\.org|nature\.com|science\.org|sciencedirect|springer|wiley|iopscience|agupubs|journals\./.test(u));
    f.papers = { external_links: ext.length, literature_links: lit.length };
    if (ext.length < PAPERS_LINK_FLOOR) issue('PAPERS_LINKS_THIN', `${ext.length} external (floor ${PAPERS_LINK_FLOOR})`);
  } else {
    f.papers = { external_links: 0, literature_links: 0 };
    issue('NO_PAPERS_PAGE');
  }

  // ---- JSON data files (§5) ----
  // Key aliases across eras: knowledge-nodes uses concept_mappings (canonical)
  // or nodes (1.100/1.220 eras); data-sources uses primary_sources (canonical),
  // sources (1.100 era), or primary_archives+mission_papers (1.220 era).
  f.jsons = {};
  const KEYS = [
    ['knowledge-nodes.json', ['concept_mappings', 'nodes'], 8],
    ['data-sources.json', ['primary_sources', 'sources', 'primary_archives', 'mission_papers'], 5],
  ];
  for (const [name, keys, floor] of KEYS) {
    const p = path.join(dir, name);
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      const n = keys.reduce((a, k) => a + (Array.isArray(j[k]) ? j[k].length : 0), 0);
      f.jsons[name] = n;
      if (n < floor) issue('JSON_BELOW_FLOOR', `${name} ${keys.join('|')}=${n} (floor ${floor})`);
    } catch {
      f.jsons[name] = null;
      issue('JSON_MISSING_OR_INVALID', name);
    }
  }

  // ---- track pages ----
  const missingTracks = TRACK_PAGES.filter((t) => !fs.existsSync(path.join(dir, t)));
  if (missingTracks.length) issue('TRACKS_MISSING', missingTracks.join(','));

  return f;
}

function main() {
  if (!fs.existsSync(NASA)) {
    console.error(`NASA dir not found: ${NASA}`);
    process.exit(2);
  }
  const missions = listMissions();
  const allDirs = new Set(missions);
  const manifestVers = loadManifestVersions();

  // --mission 1.N : audit one mission, print findings to stdout, write nothing.
  const argMission = process.argv.indexOf('--mission');
  if (argMission > -1) {
    const v = process.argv[argMission + 1];
    if (!allDirs.has(v)) {
      console.error(`unknown mission: ${v}`);
      process.exit(2);
    }
    const one = auditMission(v, allDirs, manifestVers);
    console.log(JSON.stringify(one, null, 1));
    process.exit(one.issues.length ? 1 : 0);
  }

  const findings = missions.map((v) => auditMission(v, allDirs, manifestVers));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, 'findings.json');
  fs.writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), missions: findings }, null, 1));

  // summary
  const tally = {};
  for (const f of findings) for (const i of f.issues) {
    const code = i.split(':')[0];
    tally[code] = (tally[code] || 0) + 1;
  }
  const clean = findings.filter((f) => f.issues.length === 0).length;
  const dirty = findings.filter((f) => f.issues.length > 0);
  if (!QUIET) {
    console.log(`missions audited: ${findings.length}  clean: ${clean}`);
    for (const [code, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${code.padEnd(28)} ${n}`);
    }
    console.log(`findings written: ${outPath}`);
  }
  // --gate: BLOCK (exit 1) if any mission has findings. Even under --quiet,
  // print the offending missions to stderr so the gate output is actionable.
  if (GATE && dirty.length) {
    console.error(`[nasa-consistency-audit] GATE FAIL: ${dirty.length} mission(s) with findings:`);
    for (const f of dirty) {
      console.error(`  ${f.version}: ${f.issues.join('; ')}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main();

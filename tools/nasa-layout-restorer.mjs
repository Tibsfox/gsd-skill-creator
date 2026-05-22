#!/usr/bin/env node
// nasa-layout-restorer.mjs — restore v1.0 canonical cards to a NASA mission
// index.html WITHOUT removing substrate-form additions. Cards-additive.
//
// Usage:
//   node tools/nasa-layout-restorer.mjs <missionDir> [--dry-run|--apply]
//   node tools/nasa-layout-restorer.mjs --all-deviating [--dry-run|--apply]
//
// Sources for restored cards (per card):
//   Creative Artifacts      <- artifacts/ tree listing
//   Runnable Simulations    <- artifacts/sims/ + artifacts/simulations/ listing
//   Interactive Lab         <- artifacts/audio/*.html + spice/*.html + screensaver/viewer.html
//   Forest Contribution     <- forest-module/{slug}.js OR forest-module/NOT_APPLICABLE.md
//   Data Files              <- knowledge-nodes.json + data-sources.json
//   What to Build           <- TODO MARKER (needs sub-agent generation)
//   TRY Sessions            <- TODO MARKER (needs sub-agent generation)
//   DIY Projects            <- TODO MARKER (needs sub-agent generation)
//
// Strategy:
//   1. Parse existing index.html h2 cards in order.
//   2. For each missing canonical card, insert it in v1.0 position by anchoring
//      to the nearest existing canonical card (after Resonance Axes if present,
//      otherwise after Mission Tracks).
//   3. Write to .bak then overwrite original (--apply only).

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

// ─── canonical card definitions ────────────────────────────────────────────
const CANONICAL_CARDS = [
  { id: 'Summary',        h2re: /<h2[^>]*>(Mission (Summary|Success|Failure|Loss|Recovery|Outcome|Identity)|In Memoriam|Program Complete)/ },
  { id: 'Tracks',         h2re: /<h2[^>]*>(Mission|Research) Tracks/ },
  { id: 'Resonance',      h2re: /<h2[^>]*>Resonance/ },
  { id: 'WhatToBuild',    h2re: /<h2[^>]*>What to Build/ },
  { id: 'TRY',            h2re: /<h2[^>]*>(TRY (Sessions|:)|TRY [^<]*DIY)/ },
  { id: 'DIY',            h2re: /<h2[^>]*>(DIY (Projects|:)|TRY [^<]*DIY)/ },
  { id: 'Creative',       h2re: /<h2[^>]*>Creative Artifacts/ },
  { id: 'Sims',           h2re: /<h2[^>]*>Runnable Simulations/ },
  { id: 'InteractiveLab', h2re: /<h2[^>]*>Interactive Lab/ },
  { id: 'Forest',         h2re: /<h2[^>]*>Forest (Contribution|Sim Contribution)/ },
  { id: 'DataFiles',      h2re: /<h2[^>]*>(Data Files|References)/ },
  { id: 'Dedication',     h2re: /<h2[^>]*>Dedication/ },
];

function detectExistingCards(html) {
  const present = new Set();
  for (const c of CANONICAL_CARDS) {
    if (c.h2re.test(html)) present.add(c.id);
  }
  return present;
}

// ─── card generators (mechanical, from sibling files) ──────────────────────
function genDataFilesCard() {
  return `<div class="card">
<h2>Data Files</h2>
<ul>
<li><a href="knowledge-nodes.json" style="color: var(--text-dim);">knowledge-nodes.json</a> &mdash; Theory concepts mapped to College departments</li>
<li><a href="data-sources.json" style="color: var(--text-dim);">data-sources.json</a> &mdash; Open dataset links for this mission</li>
</ul>
</div>`;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function genCreativeArtifactsCard(missionDir) {
  const artDir = join(missionDir, 'artifacts');
  if (!existsSync(artDir)) return null;
  const items = [];
  // Stories — v1.0 uses "stories/", substrate-era uses "story/"
  for (const subdir of ['stories','story']) {
    const stories = walk(join(artDir, subdir)).filter(p => p.endsWith('.html'));
    for (const s of stories) {
      const slug = basename(s, '.html');
      const tex  = s.replace(/\.html$/, '.tex');
      items.push(`<li><strong>Story:</strong> <a href="${relative(missionDir, s)}">${slug} (HTML)</a>${existsSync(tex) ? ` &middot; <a href="${relative(missionDir, tex)}">LaTeX source</a>` : ''} &mdash; story artifact</li>`);
    }
  }
  for (const dsp of walk(join(artDir, 'audio')).filter(p => p.endsWith('.dsp'))) {
    const slug = basename(dsp, '.dsp');
    items.push(`<li><strong>Audio:</strong> <a href="${relative(missionDir, dsp)}">${slug} (Faust DSP)</a> &mdash; synthesis source.</li>`);
  }
  for (const cir of walk(join(artDir, 'circuits')).filter(p => p.endsWith('.md'))) {
    const slug = basename(cir, '.md');
    items.push(`<li><strong>Circuit:</strong> <a href="${relative(missionDir, cir)}">${slug}</a> &mdash; schematic, BOM, calibration.</li>`);
  }
  // Shaders — v1.0 uses "screensaver/" + viewer.html, substrate-era uses "shaders/"
  for (const subdir of ['screensaver','shaders']) {
    const sdir = join(artDir, subdir);
    if (!existsSync(sdir)) continue;
    for (const f of readdirSync(sdir)) {
      if (f.endsWith('.frag')) {
        const slug = basename(f, '.frag');
        const viewer = join(sdir, 'viewer.html');
        items.push(`<li><strong>Shader:</strong> <a href="artifacts/${subdir}/${f}">${slug} (GLSL fragment)</a>${existsSync(viewer) ? ` &middot; <a href="artifacts/${subdir}/viewer.html">interactive viewer</a>` : ''} &mdash; shader artifact.</li>`);
      }
    }
  }
  if (items.length === 0) return null;
  return `<div class="card">
<h2>Creative Artifacts</h2>
<ul>
${items.join('\n')}
</ul>
</div>`;
}

function genRunnableSimulationsCard(missionDir) {
  const artDir = join(missionDir, 'artifacts');
  if (!existsSync(artDir)) return null;
  const items = [];
  // Python sims — v1.0 uses simulations/python/, substrate-era uses sims/ (flat)
  for (const sub of [['simulations','python'], ['sims','python'], ['sims']]) {
    const dir = join(artDir, ...sub);
    for (const py of walk(dir).filter(p => p.endsWith('.py'))) {
      const slug = basename(py, '.py');
      items.push(`<li><strong>Python:</strong> <a href="${relative(missionDir, py)}">${slug}</a> &mdash; Python simulation.</li>`);
    }
  }
  // Web sims
  for (const sub of [['simulations','web'], ['sims']]) {
    const dir = join(artDir, ...sub);
    for (const html of walk(dir).filter(p => p.endsWith('.html'))) {
      const slug = basename(html, '.html');
      items.push(`<li><strong>Web:</strong> <a href="${relative(missionDir, html)}">${slug}</a> &mdash; interactive web sim.</li>`);
    }
  }
  // SPICE netlists — v1.0 simulations/spice/, substrate-era circuits/
  for (const sub of [['simulations','spice'], ['circuits']]) {
    const dir = join(artDir, ...sub);
    for (const cir of walk(dir).filter(p => p.endsWith('.cir'))) {
      const slug = basename(cir, '.cir');
      items.push(`<li><strong>SPICE:</strong> <a href="${relative(missionDir, cir)}">${slug}</a> &mdash; ngspice netlist.</li>`);
    }
  }
  for (const sub of ['screensaver','shaders']) {
    const viewer = join(artDir, sub, 'viewer.html');
    if (existsSync(viewer)) {
      items.push(`<li><strong>Shader viewer:</strong> <a href="artifacts/${sub}/viewer.html">viewer.html</a> &mdash; per-mission WebGL2 fragment shader viewer.</li>`);
      break;
    }
  }
  if (items.length === 0) return null;
  // Dedup by href to avoid double-counting flat-sims/ directory hits.
  const seen = new Set();
  const uniq = items.filter(li => {
    const m = li.match(/href="([^"]+)"/);
    if (!m) return true;
    if (seen.has(m[1])) return false;
    seen.add(m[1]); return true;
  });
  return `<div class="card">
<h2>Runnable Simulations</h2>
<ul>
${uniq.join('\n')}
</ul>
</div>`;
}

function genInteractiveLabCard(missionDir) {
  const artDir = join(missionDir, 'artifacts');
  if (!existsSync(artDir)) return null;
  const items = [];
  // Faust audio runners — v1.0 artifacts/audio/*.html
  for (const html of walk(join(artDir, 'audio')).filter(p => p.endsWith('.html'))) {
    const slug = basename(html, '.html');
    items.push(`<li><a href="${relative(missionDir, html)}">${slug}</a> &mdash; in-browser Faust synth.</li>`);
  }
  // SPICE runners — v1.0 artifacts/simulations/spice/*.html, substrate-era artifacts/circuits/*.html
  for (const sub of [['simulations','spice'], ['circuits']]) {
    const dir = join(artDir, ...sub);
    for (const html of walk(dir).filter(p => p.endsWith('.html'))) {
      const slug = basename(html, '.html');
      items.push(`<li><a href="${relative(missionDir, html)}">${slug}</a> &mdash; live SPICE sim.</li>`);
    }
  }
  // Web sims that run in-browser (substrate-era artifacts/sims/*.html that aren't .py)
  for (const html of walk(join(artDir, 'sims')).filter(p => p.endsWith('.html'))) {
    const slug = basename(html, '.html');
    items.push(`<li><a href="${relative(missionDir, html)}">${slug}</a> &mdash; in-browser interactive runner.</li>`);
  }
  // Shader viewer runner
  for (const sub of ['screensaver','shaders']) {
    const viewer = join(artDir, sub, 'viewer.html');
    if (existsSync(viewer)) {
      items.push(`<li><a href="artifacts/${sub}/viewer.html">shader viewer</a> &mdash; WebGL2 fragment shader runner.</li>`);
      break;
    }
  }
  if (items.length === 0) return null;
  // Dedup
  const seen = new Set();
  const uniq = items.filter(li => {
    const m = li.match(/href="([^"]+)"/);
    if (!m) return true;
    if (seen.has(m[1])) return false;
    seen.add(m[1]); return true;
  });
  return `<div class="card">
<h2>Interactive Lab</h2>
<p>In-browser runners. Real Faust synthesis, real SPICE simulation, WebGL shader viewer.</p>
<ul>
${uniq.join('\n')}
</ul>
</div>`;
}

function genForestContributionCard(missionDir, ver) {
  const fmDir = join(missionDir, 'forest-module');
  if (!existsSync(fmDir)) return null;
  const notApplicable = join(fmDir, 'NOT_APPLICABLE.md');
  if (existsSync(notApplicable)) {
    return `<div class="card">
<h2>Forest Contribution</h2>
<p>This mission does not contribute an experimental module to the shared forest sim. <a href="forest-module/NOT_APPLICABLE.md">Read the reasoning &rarr;</a></p>
</div>`;
  }
  const js = readdirSync(fmDir).find(f => f.endsWith('.js'));
  if (!js) return null;
  const slug = basename(js, '.js');
  return `<div class="card">
<h2>Forest Contribution</h2>
<p>This mission&rsquo;s experimental module couples to the shared forest sim: <strong>${slug}</strong>. See <a href="forest-module/${js}">forest-module/${js}</a>.</p>
<p><a href="../../forest/index.html?mission=${ver}">Run in forest sim &rarr;</a></p>
</div>`;
}

// ─── TODO placeholder cards (need sub-agent generation later) ──────────────
function genTodoCard(id, label, note) {
  return `<div class="card" data-restored-stub="${id}">
<h2>${label}</h2>
<p style="color: var(--text-dim); font-style: italic;">${note}</p>
<!-- TODO: sub-agent to generate ${id} content from research.md / research.html -->
</div>`;
}

// ─── insertion logic ───────────────────────────────────────────────────────
// Find the closing </div> of an existing card matched by h2 regex.
function findCardEnd(html, h2re) {
  const m = html.match(h2re);
  if (!m) return -1;
  const h2Idx = m.index;
  // Walk forward, balancing <div> / </div>, starting from the card-open <div class="card"...
  // that contains this h2.
  // Find the <div class="card" right before this h2.
  const before = html.slice(0, h2Idx);
  const cardOpenIdx = before.lastIndexOf('<div class="card');
  if (cardOpenIdx < 0) return -1;
  // Now walk forward from cardOpenIdx, counting <div> and </div>.
  let depth = 0;
  const tagRe = /<\/?div\b/g;
  tagRe.lastIndex = cardOpenIdx;
  let last = -1;
  let mm;
  while ((mm = tagRe.exec(html)) !== null) {
    if (mm[0] === '<div') depth++;
    else depth--;
    if (depth === 0) { last = mm.index + '</div>'.length; break; }
  }
  return last;
}

// Insert `payload` after the closing </div> of the card with h2 matching `anchorRe`.
// Returns the new html string, or null if anchor not found.
function insertAfter(html, anchorRe, payload) {
  const idx = findCardEnd(html, anchorRe);
  if (idx < 0) return null;
  return html.slice(0, idx) + '\n' + payload + '\n' + html.slice(idx);
}

// Insertion-order strategy: try canonical predecessors in reverse.
function insertCard(html, cardId, payload) {
  // ordering with predecessors
  const order = ['Summary','Tracks','Resonance','WhatToBuild','TRY','DIY','Creative','Sims','InteractiveLab','Forest','DataFiles','Dedication'];
  const targetIdx = order.indexOf(cardId);
  if (targetIdx < 0) return null;
  // Try each predecessor (reverse) until one exists in the html.
  for (let i = targetIdx - 1; i >= 0; i--) {
    const pred = CANONICAL_CARDS.find(c => c.id === order[i]);
    if (!pred) continue;
    const res = insertAfter(html, pred.h2re, payload);
    if (res !== null) return res;
  }
  return null;
}

// ─── main per-mission patch ────────────────────────────────────────────────
function patchMission(missionDir, opts={}) {
  const indexPath = join(missionDir, 'index.html');
  if (!existsSync(indexPath)) return { ok: false, error: 'no-index' };
  const ver = basename(missionDir);
  let html = readFileSync(indexPath, 'utf8');
  const orig = html;
  const existing = detectExistingCards(html);

  const inserted = [];
  const skipped = [];

  // Generator map; null payload means "skip with reason"
  const gens = {
    Creative:       () => genCreativeArtifactsCard(missionDir),
    Sims:           () => genRunnableSimulationsCard(missionDir),
    InteractiveLab: () => genInteractiveLabCard(missionDir),
    Forest:         () => genForestContributionCard(missionDir, ver),
    DataFiles:      () => genDataFilesCard(),
    WhatToBuild:    () => genTodoCard('WhatToBuild', 'What to Build', 'Hands-on builds for this mission — pending content (sub-agent rebuild scheduled).'),
    TRY:            () => genTodoCard('TRY', 'TRY Sessions', 'Time-bounded active-engagement exercises — pending content (sub-agent rebuild scheduled).'),
    DIY:            () => genTodoCard('DIY', 'DIY Projects', 'Build-it-yourself projects with BOM and cost estimates — pending content (sub-agent rebuild scheduled).'),
  };

  // Cards we currently support inserting (do NOT auto-insert Summary or Dedication —
  // those are high-risk content decisions and belong to a sub-agent rebuild).
  const insertable = ['DataFiles','Forest','InteractiveLab','Sims','Creative','WhatToBuild','TRY','DIY'];

  for (const cardId of insertable) {
    if (existing.has(cardId)) continue;
    const gen = gens[cardId];
    if (!gen) { skipped.push({ cardId, reason: 'no-generator' }); continue; }
    const payload = gen();
    if (!payload) { skipped.push({ cardId, reason: 'no-source-content' }); continue; }
    const next = insertCard(html, cardId, payload);
    if (next === null) { skipped.push({ cardId, reason: 'no-anchor' }); continue; }
    html = next;
    inserted.push(cardId);
  }

  const result = { ok: true, ver, inserted, skipped, missing_after: [], orig_kb: (orig.length/1024).toFixed(1), new_kb: (html.length/1024).toFixed(1) };
  // Re-detect to confirm
  const afterCards = detectExistingCards(html);
  for (const c of CANONICAL_CARDS) {
    if (!afterCards.has(c.id)) result.missing_after.push(c.id);
  }

  if (opts.apply && html !== orig) {
    copyFileSync(indexPath, indexPath + '.bak');
    writeFileSync(indexPath, html);
    result.applied = true;
  } else if (opts.dryRun) {
    result.diffPreview = html.slice(0, 0) + ` (dry-run, ${html.length - orig.length} bytes added)`;
  }
  return result;
}

// ─── CLI ───────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run') || !apply;
  const all = args.includes('--all-deviating');
  const target = args.find(a => !a.startsWith('--'));

  let missionDirs;
  if (all) {
    const base = 'www/tibsfox/com/Research/NASA';
    missionDirs = readdirSync(base)
      .filter(d => /^\d+\.\d+$/.test(d))
      .map(d => join(base, d))
      .filter(d => existsSync(join(d, 'index.html')));
  } else if (target) {
    missionDirs = [target];
  } else {
    console.error('Usage: nasa-layout-restorer.mjs <missionDir> [--dry-run|--apply]');
    console.error('       nasa-layout-restorer.mjs --all-deviating [--dry-run|--apply]');
    process.exit(2);
  }

  const results = [];
  for (const md of missionDirs) {
    const r = patchMission(md, { dryRun, apply });
    results.push(r);
  }
  for (const r of results) {
    if (!r.ok) {
      console.log(`${r.ver || '???'}: ERROR ${r.error}`);
      continue;
    }
    const status = r.applied ? 'APPLIED' : 'DRYRUN';
    console.log(`${r.ver} ${status} inserted=[${r.inserted.join(',')}] skipped=[${r.skipped.map(s=>s.cardId+'('+s.reason+')').join(',')}] missing_after=[${r.missing_after.join(',')}] kb ${r.orig_kb}->${r.new_kb}`);
  }
}

main();

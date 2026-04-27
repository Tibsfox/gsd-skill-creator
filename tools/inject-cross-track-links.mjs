#!/usr/bin/env node
/**
 * Inject Track 6 (MUS) + Track 7 (ELC) cross-track cards into NASA degree pages
 * 1.0–1.62. NASA 1.63 already has them; pre-1.63 NASA pages were built before the
 * three-track parallel cadence existed.
 *
 * Idempotent: skips any NASA page that already contains "Track 6 &mdash;".
 *
 * Reads:
 *   www/tibsfox/com/Research/MUS/catalog/mus-master-subject-catalog.csv
 *   www/tibsfox/com/Research/ELC/catalog/elc-master-subject-catalog.csv
 *
 * Mutates each NASA/1.X/index.html where MUS/1.X and ELC/1.X both exist:
 *   - Inserts Track 6 + Track 7 track-cards in the main Research Tracks block,
 *     immediately after the Track 5 card.
 *   - Inserts a "Cross-Track 1.X Links" sidebar card after the Mission Tracks
 *     sidebar.
 *
 * Usage: node tools/inject-cross-track-links.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NASA_DIR = resolve(REPO, 'www/tibsfox/com/Research/NASA');
const MUS_DIR = resolve(REPO, 'www/tibsfox/com/Research/MUS');
const ELC_DIR = resolve(REPO, 'www/tibsfox/com/Research/ELC');
const DRY = process.argv.includes('--dry-run');

function parseCsv(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter(l => l.trim().length);
  const header = lines[0].split(',').map(s => s.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = []; let cur = ''; let inQ = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQ = !inQ; cur += ch; }
      else if (ch === ',' && !inQ) { cells.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cells.push(cur);
    if (cells.length < header.length) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cells[j].replace(/^"|"$/g, '');
    }
    rows.push(obj);
  }
  return rows;
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const musRows = parseCsv(resolve(MUS_DIR, 'catalog/mus-master-subject-catalog.csv'));
const elcRows = parseCsv(resolve(ELC_DIR, 'catalog/elc-master-subject-catalog.csv'));
const musByDeg = new Map(musRows.map(r => [r.degree, r]));
const elcByDeg = new Map(elcRows.map(r => [r.degree, r]));

const nasaDirs = readdirSync(NASA_DIR)
  .filter(n => /^1\.\d+$/.test(n))
  .sort((a, b) => parseFloat(a) - parseFloat(b));

let changed = 0, skipped = 0, missing = 0;

for (const deg of nasaDirs) {
  if (deg === '1.63') { skipped++; continue; }  // already has Track 6/7
  const indexPath = resolve(NASA_DIR, deg, 'index.html');
  if (!existsSync(indexPath)) { missing++; continue; }
  const mus = musByDeg.get(deg);
  const elc = elcByDeg.get(deg);
  if (!mus || !elc) { missing++; continue; }
  const musExists = existsSync(resolve(MUS_DIR, deg, 'index.html'));
  const elcExists = existsSync(resolve(ELC_DIR, deg, 'index.html'));
  if (!musExists || !elcExists) { missing++; continue; }

  let html = readFileSync(indexPath, 'utf8');
  if (/Track 6 &mdash;|Track 6 —/.test(html)) { skipped++; continue; }

  const musTopic = mus.topic.replace(/^"|"$/g, '');
  const elcTopic = elc.topic.replace(/^"|"$/g, '');

  // Build the two new track-cards (mirror NASA 1.63 v1.49.581 pattern)
  const musCard = `<div class="track-card"><a href="../../MUS/${deg}/index.html">
<div class="track-num">Track 6 &mdash; Music Theory (cross-track)</div>
<div class="track-title">MUS ${deg} &mdash; ${htmlEscape(musTopic.split(':')[0])}</div>
<div class="track-desc">Domain ${mus.domain} entry in the parallel MUS catalog: ${htmlEscape(musTopic)}. S36 = ${htmlEscape(mus.s36_artist || 'see catalog')}; SPS = ${htmlEscape(mus.sps_species || 'see catalog')}. Cluster-10 concept ${htmlEscape(mus.concept_id || `mus-${deg}`)} registered.</div>
</a></div>`;

  const elcCard = `<div class="track-card"><a href="../../ELC/${deg}/index.html">
<div class="track-num">Track 7 &mdash; Electronics (cross-track)</div>
<div class="track-title">ELC ${deg} &mdash; ${htmlEscape(elcTopic.split(':')[0])}</div>
<div class="track-desc">Domain ${elc.domain} entry in the parallel ELC catalog: ${htmlEscape(elcTopic)}. Era: ${htmlEscape(elc.era || 'see catalog')}. Flight subset cross-references the NASA mission's actual electronics; SPICE renderer mounted via spice-viewer custom element.</div>
</a></div>`;

  // Insertion strategy: find the Track 5 track-card and inject after its closing </a></div>.
  // Older NASA degrees use `<div class="track-card t5">` (with t5 suffix) and split
  // the </a></div> across two lines; newer ones use `<div class="track-card">` and
  // collapse them. The pattern accommodates both.
  const track5Re = /(<div class="track-card[^"]*">[^]*?Track 5[^]*?<\/a>\s*<\/div>)/;
  const m = html.match(track5Re);
  if (!m) {
    console.warn(`${deg}: no Track 5 card found, skipping main-body injection`);
  } else {
    html = html.replace(track5Re, `$1\n${musCard}\n${elcCard}`);
  }

  // Sidebar Cross-Track card — insert after the Mission Tracks sidebar (or before "Open Data Sources" / data-links)
  const sidebarCard = `
<div class="tracks-card">
<h3>Cross-Track ${deg} Links</h3>
<div class="track-item"><a href="../../MUS/${deg}/index.html">Track 6 &mdash; MUS ${deg} (Music Theory)</a></div>
<div class="track-item"><a href="../../ELC/${deg}/index.html">Track 7 &mdash; ELC ${deg} (Electronics)</a></div>
</div>
`;
  // Pin to before the data-links sidebar card if present, else before <footer>
  if (/<div class="data-links">/.test(html)) {
    html = html.replace(/<div class="data-links">/, `${sidebarCard}<div class="data-links">`);
  } else if (/<footer/.test(html)) {
    html = html.replace(/<footer/, `${sidebarCard}<footer`);
  } else {
    console.warn(`${deg}: no insertion point for sidebar Cross-Track card`);
  }

  if (DRY) {
    console.log(`${deg}: would patch (main: ${m ? 'yes' : 'NO'} | sidebar: yes)`);
  } else {
    writeFileSync(indexPath, html);
    console.log(`${deg}: patched (${html.length} bytes)`);
  }
  changed++;
}

console.log(`\nDone. changed=${changed} skipped=${skipped} missing-mus-or-elc=${missing}`);

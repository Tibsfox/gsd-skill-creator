#!/usr/bin/env node
/**
 * Regenerate the MUS + ELC landing pages with shipped-degree data.
 *
 * Reads:
 *   www/tibsfox/com/Research/MUS/catalog/mus-master-subject-catalog.csv
 *   www/tibsfox/com/Research/MUS/catalog/mus-domain-coverage.json
 *   www/tibsfox/com/Research/ELC/catalog/elc-master-subject-catalog.csv
 *   www/tibsfox/com/Research/ELC/catalog/elc-domain-coverage.json
 *
 * Rewrites the in-place landing index.html for each track:
 *   - stat-num "degrees shipped" → actual count
 *   - domain-coverage cards → actual current/target
 *   - era-row counts (ELC only) → actual era totals
 *   - empty-state placeholder → hidden
 *   - degrees-grid → populated with one card per shipped degree (sorted by degree number)
 *
 * Idempotent: running twice produces the same output. Safe to re-run after every backfill wave.
 *
 * Usage: node tools/populate-mus-elc-landing.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseCsv(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter(l => l.trim().length);
  const header = lines[0].split(',').map(s => s.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted fields with embedded commas
    const cells = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; cur += ch; }
      else if (ch === ',' && !inQ) { cells.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cells.push(cur);
    if (cells.length < header.length) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cells[j].replace(/^"|"$/g, '').replace(/^"+|"+$/g, '');
    }
    rows.push(obj);
  }
  return rows;
}

function degreeNum(d) {
  const [, frac] = d.split('.');
  return parseFloat(d);
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ------------------------------------------------------------------
// MUS
// ------------------------------------------------------------------

function buildMus() {
  const indexPath = resolve(REPO, 'www/tibsfox/com/Research/MUS/index.html');
  const catalog = parseCsv(resolve(REPO, 'www/tibsfox/com/Research/MUS/catalog/mus-master-subject-catalog.csv'));
  const cov = JSON.parse(readFileSync(resolve(REPO, 'www/tibsfox/com/Research/MUS/catalog/mus-domain-coverage.json'), 'utf8'));

  const rows = catalog
    .filter(r => r.degree && /^1\.\d+$/.test(r.degree))
    .sort((a, b) => degreeNum(a.degree) - degreeNum(b.degree));

  const cardsHtml = rows.map(r => {
    const degSlug = r.degree;
    const topic = htmlEscape(r.topic.replace(/^"|"$/g, ''));
    const artist = htmlEscape(r.s36_artist.replace(/^"|"$/g, ''));
    const sps = htmlEscape(r.sps_species.replace(/^"|"$/g, ''));
    const mission = htmlEscape(r.nasa_mission.replace(/^"|"$/g, ''));
    const dom = r.domain;
    const domName = cov.domains[dom]?.name ?? `Domain ${dom}`;
    return `        <div class="degree-card domain-${dom}"><a href="${degSlug}/index.html">
          <div class="degree-num">MUS ${degSlug} &middot; D${dom} ${htmlEscape(domName)}</div>
          <div class="degree-title">${topic}</div>
          <div class="degree-meta"><strong>S36:</strong> ${artist}</div>
          <div class="degree-meta"><strong>SPS:</strong> ${sps}</div>
          <div class="degree-meta"><strong>NASA:</strong> ${mission}</div>
        </a></div>`;
  }).join('\n');

  const domHtml = Object.entries(cov.domains).map(([num, d]) => {
    return `        <div class="dom domain-${num}"><div class="dom-name">${num}. ${htmlEscape(d.name)}</div><div class="dom-count">${d.current}<span class="dom-count-target">/${d.target}</span></div></div>`;
  }).join('\n');

  let html = readFileSync(indexPath, 'utf8');

  // Update shipped count
  html = html.replace(
    /<span class="stat-num" id="stat-completed">\d+<\/span>/,
    `<span class="stat-num" id="stat-completed">${rows.length}</span>`,
  );

  // Replace domain-coverage block
  html = html.replace(
    /<div class="domain-coverage" id="domain-coverage">[\s\S]*?<\/div>\s*<\/section>/,
    `<div class="domain-coverage" id="domain-coverage">\n${domHtml}\n      </div>\n    </section>`,
  );

  // Replace existing degrees-grid block (idempotent across reruns).
  // First-run path: empty-state + empty grid → populated grid.
  // Rerun path: existing populated grid → updated populated grid.
  const populated = `      <div class="degrees-grid" id="degrees-grid">\n${cardsHtml}\n      </div>`;
  if (/<div class="empty-state">/.test(html)) {
    html = html.replace(
      /<div class="empty-state">[\s\S]*?<\/div>\s*<div class="degrees-grid"[^>]*>[\s\S]*?<\/div>/,
      populated,
    );
  } else {
    // Match existing populated grid: opens with "<div class="degrees-grid"", closes
    // with "</div>" followed by whitespace + "</section>".
    html = html.replace(
      /<div class="degrees-grid"[^>]*>[\s\S]*?<\/div>(\s*<\/section>)/,
      `${populated}$1`,
    );
  }

  writeFileSync(indexPath, html);
  console.log(`MUS landing: ${rows.length} degrees, ${html.length} bytes`);
}

// ------------------------------------------------------------------
// ELC
// ------------------------------------------------------------------

function buildElc() {
  const indexPath = resolve(REPO, 'www/tibsfox/com/Research/ELC/index.html');
  const catalog = parseCsv(resolve(REPO, 'www/tibsfox/com/Research/ELC/catalog/elc-master-subject-catalog.csv'));
  const cov = JSON.parse(readFileSync(resolve(REPO, 'www/tibsfox/com/Research/ELC/catalog/elc-domain-coverage.json'), 'utf8'));

  const rows = catalog
    .filter(r => r.degree && /^1\.\d+$/.test(r.degree))
    .sort((a, b) => degreeNum(a.degree) - degreeNum(b.degree));

  const cardsHtml = rows.map(r => {
    const degSlug = r.degree;
    const topic = htmlEscape(r.topic.replace(/^"|"$/g, ''));
    const era = htmlEscape(r.era);
    const flightSubset = htmlEscape((r.flight_subset || '').slice(0, 200) + (r.flight_subset && r.flight_subset.length > 200 ? '…' : ''));
    const mission = htmlEscape(r.nasa_mission.replace(/^"|"$/g, ''));
    const dom = r.domain;
    const domName = cov.domains[dom]?.name ?? `Domain ${dom}`;
    return `        <div class="degree-card domain-${dom}"><a href="${degSlug}/index.html">
          <div class="degree-num">ELC ${degSlug} &middot; D${dom} ${htmlEscape(domName)} &middot; ${era}</div>
          <div class="degree-title">${topic}</div>
          <div class="degree-meta"><strong>NASA:</strong> ${mission}</div>
          <div class="degree-meta"><strong>Flight subset:</strong> ${flightSubset}</div>
        </a></div>`;
  }).join('\n');

  const domHtml = Object.entries(cov.domains).map(([num, d]) => {
    return `        <div class="dom domain-${num}"><div class="dom-name">${num}. ${htmlEscape(d.name)}</div><div class="dom-count">${d.current}<span class="dom-count-target">/${d.target}</span></div></div>`;
  }).join('\n');

  // Era counts in display order (matches the static rows in the file)
  const eraOrder = ['tube-ge', 'si-discrete', 'op-amp', 'cmos-up', 'mixed-ic', 'dsp-fpga', 'modern'];
  const eraDisplay = {
    'tube-ge': { name: '1957&ndash;1962', tech: 'Vacuum tubes, germanium transistors' },
    'si-discrete': { name: '1962&ndash;1968', tech: 'Silicon BJT, JFET, early bipolar IC (µA702/µA709)' },
    'op-amp': { name: '1968&ndash;1975', tech: 'Op-amp era (µA741), 7400 TTL' },
    'cmos-up': { name: '1975&ndash;1985', tech: 'CMOS, microprocessors, switching power supplies' },
    'mixed-ic': { name: '1985&ndash;1995', tech: 'Mixed-signal IC, low-V CMOS, RF integration' },
    'dsp-fpga': { name: '1995&ndash;2010', tech: 'DSPs, FPGAs, system-on-chip' },
    'modern': { name: '2010&ndash;now', tech: 'Modern SoC, GaN/SiC power' },
  };
  const eraHtml = eraOrder.map(k => {
    const e = eraDisplay[k];
    const count = cov.eras?.[k]?.current ?? 0;
    return `      <div class="era-row"><span class="era-name">${e.name}</span><span class="era-tech">${e.tech}</span><span class="era-count">${count}</span></div>`;
  }).join('\n');

  let html = readFileSync(indexPath, 'utf8');

  html = html.replace(
    /<span class="stat-num" id="stat-completed">\d+<\/span>/,
    `<span class="stat-num" id="stat-completed">${rows.length}</span>`,
  );
  // ELC may not yet have id="stat-completed"; fall back: the first stat-num wraps the count
  if (!/stat-completed/.test(html)) {
    html = html.replace(
      /<span class="stat-num">0<\/span>\s*<span class="stat-label">degrees shipped<\/span>/,
      `<span class="stat-num" id="stat-completed">${rows.length}</span>\n        <span class="stat-label">degrees shipped</span>`,
    );
  }

  html = html.replace(
    /<div class="domain-coverage" id="domain-coverage">[\s\S]*?<\/div>\s*<\/section>/,
    `<div class="domain-coverage" id="domain-coverage">\n${domHtml}\n      </div>\n    </section>`,
  );

  html = html.replace(
    /<section class="era-timeline">[\s\S]*?<\/section>/,
    `<section class="era-timeline">\n      <h2 style="font-family: 'Libre Baskerville', Georgia, serif;">Era Navigator</h2>\n${eraHtml}\n    </section>`,
  );

  // Replace existing block (idempotent across reruns; mirrors MUS strategy)
  const populated = `      <div class="degrees-grid" id="degrees-grid">\n${cardsHtml}\n      </div>`;
  if (/<div class="empty-state">/.test(html)) {
    if (/<div class="degrees-grid"/.test(html)) {
      html = html.replace(
        /<div class="empty-state">[\s\S]*?<\/div>\s*<div class="degrees-grid"[^>]*>[\s\S]*?<\/div>/,
        populated,
      );
    } else {
      html = html.replace(
        /<div class="empty-state">[\s\S]*?<\/div>/,
        populated,
      );
    }
  } else {
    html = html.replace(
      /<div class="degrees-grid"[^>]*>[\s\S]*?<\/div>(\s*<\/section>)/,
      `${populated}$1`,
    );
  }

  writeFileSync(indexPath, html);
  console.log(`ELC landing: ${rows.length} degrees, ${html.length} bytes`);
}

buildMus();
buildElc();
console.log('Done. Re-run after each backfill wave.');

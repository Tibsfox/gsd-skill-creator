#!/usr/bin/env node
// tools/nasa-nav-and-track-css-patcher.mjs
//
// Patches every www/.../NASA/1.X/index.html so that:
//   1. A unified <div class="nav-card">prev | series-hub | next</div> exists
//      at BOTH top (right after <main>) and bottom (right before </main>).
//      Replaces any existing nav-card blocks with the unified form.
//   2. Track-grid CSS is present whenever <div class="track-grid"> markup is.
//      Injects the gold-standard v1.0 CSS rules into the page's <style> block.
//
// Authored v1.49.716 alongside the canonical-layout gate.
//
// Usage:
//   node tools/nasa-nav-and-track-css-patcher.mjs              # patch all
//   node tools/nasa-nav-and-track-css-patcher.mjs 1.168 1.167  # specific
//   DRY_RUN=1 node tools/nasa-nav-and-track-css-patcher.mjs    # report only

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NASA_ROOT = path.join(REPO_ROOT, 'www/tibsfox/com/Research/NASA');
const DRY_RUN = process.env.DRY_RUN === '1';

// ---- helpers --------------------------------------------------------------

function listMissions() {
  return fs.readdirSync(NASA_ROOT)
    .filter(n => /^1\.\d+$/.test(n))
    .sort((a, b) => {
      const an = Number(a.split('.')[1]);
      const bn = Number(b.split('.')[1]);
      return an - bn;
    });
}

// Extract a short, human-readable mission name from the page <title>.
// Pattern: "v1.X &mdash; <SHORTNAME> [+ ... | / ... | &mdash; ...]"
function extractShortName(html, ver) {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return '';
  let t = m[1];
  // Strip "v1.X — " or "v1.X &mdash; " prefix
  t = t.replace(new RegExp(`^v${ver.replace('.', '\\.')}\\s*(?:&mdash;|—|-)\\s*`), '');
  // Trim trailing " | NASA Mission Series"
  t = t.replace(/\s*\|\s*NASA Mission Series\s*$/, '');
  // Cut at the FIRST of these segment separators
  const seps = [' + ', ' &mdash; ', ' — ', ' / ', ' (', ': '];
  let cut = t.length;
  for (const sep of seps) {
    const i = t.indexOf(sep);
    if (i > 0 && i < cut) cut = i;
  }
  t = t.slice(0, cut).trim();
  // Substrate-era titles start with mission name then agency name; cut at agency.
  const agencies = [' NASA ', ' ISRO ', ' ESA ', ' JAXA ', ' CNES ', ' DLR ',
                    ' ROSCOSMOS ', ' RSA ', ' CNSA ', ' ISA ', ' ESA-NASA ',
                    ' NASA-ESA ', ' NASA-ISRO ', ' ISRO-NASA '];
  let agencyCut = t.length;
  for (const a of agencies) {
    const i = t.indexOf(a);
    if (i > 0 && i < agencyCut) agencyCut = i;
  }
  t = t.slice(0, agencyCut).trim();
  // Decode the few entities we routinely see in titles
  t = t.replace(/&amp;/g, '&').replace(/&rarr;/g, '→').replace(/&larr;/g, '←');
  // Cap at 28 chars + ellipsis
  if (t.length > 28) t = t.slice(0, 26).trimEnd() + '…';
  return t;
}

// Build the unified nav-card markup.
function buildNavCard(prev, next, total) {
  // prev / next are { ver, name } or null for edge missions.
  const left = prev
    ? `<div>
        <div class="nav-label">Previous Mission</div>
        <a href="../${prev.ver}/index.html">&larr; v${prev.ver}${prev.name ? ' ' + prev.name : ''}</a>
      </div>`
    : `<div>
        <div class="nav-label">Series Hub</div>
        <a href="../index.html">&larr; NASA Mission Series</a>
      </div>`;

  const center = `<div style="text-align: center;">
        <div class="nav-label">Series Hub</div>
        <a href="../index.html">NASA Mission Series</a>
      </div>`;

  const right = next
    ? `<div style="text-align: right;">
        <div class="nav-label">Next Mission</div>
        <a href="../${next.ver}/index.html">v${next.ver}${next.name ? ' ' + next.name : ''} &rarr;</a>
      </div>`
    : `<div style="text-align: right;">
        <div class="nav-label">Series Hub</div>
        <a href="../index.html">NASA Mission Series &rarr;</a>
      </div>`;

  return `<div class="nav-card">
      ${left}
      ${center}
      ${right}
    </div>`;
}

// Track-card CSS pulled from v1.0 gold standard (lines 107-124, 163).
const TRACK_CSS = `
  .track-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 600px) { .track-grid { grid-template-columns: 1fr; } }
  .track-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 1rem; transition: border-color 0.2s, background 0.2s; }
  .track-card:hover { border-color: var(--mycelium, #c4a35a); background: rgba(196,163,90,0.04); }
  .track-card a { text-decoration: none; display: block; color: inherit; }
  .track-card .track-num { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--text-dim, #888); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.3rem; }
  .track-card .track-title { font-family: 'Libre Baskerville', serif; font-size: 1rem; color: var(--mycelium, #c4a35a); margin-bottom: 0.4rem; font-weight: 600; }
  .track-card .track-desc { font-size: 0.85rem; color: var(--text-dim, #888); line-height: 1.5; }
  .track-card.t1 .track-title { color: var(--mycelium-light, #d4b87a); }
  .track-card.t2 .track-title { color: var(--honey, #e8a838); }
  .track-card.t3 .track-title { color: var(--mycelium, #c4a35a); }
  .track-card.t4 .track-title { color: var(--mycelium-light, #d4b87a); }
  .track-card.t5 .track-title { color: var(--mycelium, #c4a35a); }
  .track-card.t6 .track-title { color: var(--honey, #e8a838); }
`;

const NAV_CSS = `
  .nav-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 1rem; margin: 1.5rem 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; align-items: center; }
  .nav-card a { color: var(--mycelium, #c4a35a); text-decoration: none; font-size: 0.9rem; font-weight: 500; }
  .nav-card a:hover { color: var(--mycelium-light, #d4b87a); }
  .nav-card .nav-label { font-size: 0.75rem; color: var(--text-dim, #888); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.25rem; }
  @media (max-width: 600px) { .nav-card { grid-template-columns: 1fr; text-align: left !important; } .nav-card > div { text-align: left !important; } }
`;

// Grid-column-span rule: when nav-card sits inside a grid container (most v1.0-
// v1.165 pages use `main { display: grid }`), the auto-placed nav-card otherwise
// fills only col 1 and shifts the content card into the narrow sidebar slot.
// This rule forces nav-card to span all columns regardless of container.
const NAV_GRID_SPAN_CSS = `
  main > .nav-card, .grid > .nav-card, .content > .nav-card { grid-column: 1 / -1; }
`;

// Body-scoped override for the top/bottom nav-card pair. Many v1.0–v1.165 pages
// pre-defined `.nav-card` as a `display: block` content-link styling (e.g.,
// `<a class="nav-card" href="./degree-sync.json">`) which makes the patched
// `<div class="nav-card">` render as a vertical stack of labels instead of the
// v1.166-style compact 3-column grid. `body > .nav-card` targets ONLY direct
// children of <body> — exactly the patched top/bottom pair — and matches the
// v1.166 visual style (grid, low contrast, tight padding).
const BODY_NAV_CARD_CSS = `
  body > .nav-card { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border, rgba(255,255,255,0.18)); border-radius: 6px; padding: 0.75rem 1rem; margin: 0; font-family: 'DM Mono', monospace; }
  body > .nav-card > div { display: block; }
  body > .nav-card a { color: var(--gold, #c4a35a); text-decoration: none; font-size: 0.85rem; font-weight: 500; }
  body > .nav-card a:hover { text-decoration: underline; }
  body > .nav-card .nav-label { font-size: 0.7rem; color: var(--text-dim, #888); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.2rem; font-weight: 400; }
  @media (max-width: 600px) { body > .nav-card { grid-template-columns: 1fr; text-align: left !important; } body > .nav-card > div { text-align: left !important; } }
`;

// Remove every existing <div class="nav-card"> ... </div> block.
// Uses a simple stateful scan because we can't trust HTML to be regular.
function stripNavCards(html) {
  let result = '';
  let i = 0;
  const openRe = /<div\s+class="nav-card"\s*>/g;
  let m;
  let lastEnd = 0;
  while ((m = openRe.exec(html))) {
    result += html.slice(lastEnd, m.index);
    // walk forward to the matching </div> by counting div nesting
    let depth = 1;
    let j = m.index + m[0].length;
    const len = html.length;
    while (j < len && depth > 0) {
      const nextOpen = html.indexOf('<div', j);
      const nextClose = html.indexOf('</div>', j);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        j = nextOpen + 4;
      } else {
        depth -= 1;
        j = nextClose + 6;
      }
    }
    lastEnd = j;
  }
  result += html.slice(lastEnd);
  return result;
}

// Ensure .nav-card, .track-grid, and the nav-card grid-span rule are present.
function ensureCSS(html) {
  let changed = false;
  if (!/\.nav-card\s*\{/.test(html)) {
    html = html.replace(/<style>/, `<style>${NAV_CSS}`);
    changed = true;
  }
  if (/class="track-grid"/.test(html) && !/\.track-grid\s*\{/.test(html)) {
    html = html.replace(/<style>/, `<style>${TRACK_CSS}`);
    changed = true;
  }
  // Inject span rule whenever <main> uses display:grid and the rule is missing.
  const mainIsGrid = /\bmain\s*\{[^}]*display:\s*grid/i.test(html);
  const hasSpan = /main\s*>\s*\.nav-card[^{]*\{[^}]*grid-column\s*:\s*1\s*\/\s*-1/i.test(html);
  if (mainIsGrid && !hasSpan) {
    html = html.replace(/<style>/, `<style>${NAV_GRID_SPAN_CSS}`);
    changed = true;
  }
  // Inject body-scoped nav-card styling so the patched top/bottom pair gets
  // the compact v1.166 look on every page, regardless of any pre-existing
  // .nav-card content-link styling.
  if (!/body\s*>\s*\.nav-card\s*\{/i.test(html)) {
    html = html.replace(/<style>/, `<style>${BODY_NAV_CARD_CSS}`);
    changed = true;
  }
  return { html, cssChanged: changed };
}

// Insert nav-card at top (right after <body> open) and bottom (right before
// </body> close). Body-level placement matches v1.166+ substrate-era page
// layout (top nav above the title block) and avoids the grid-shift bug that
// occurred when the top nav-card was a direct child of a grid-display <main>.
function injectNavCards(html, navCard) {
  const topAnchor = html.match(/<body\b[^>]*>/);
  if (!topAnchor) return { html, inserted: 0 };
  const topPos = topAnchor.index + topAnchor[0].length;
  html = html.slice(0, topPos) + '\n    ' + navCard + '\n' + html.slice(topPos);

  const bottomPos = html.lastIndexOf('</body>');
  if (bottomPos === -1) return { html, inserted: 1 };
  html = html.slice(0, bottomPos) + '    ' + navCard + '\n  ' + html.slice(bottomPos);

  return { html, inserted: 2 };
}

// ---- main -----------------------------------------------------------------

const argMissions = process.argv.slice(2).filter(a => /^1\.\d+$/.test(a));
const missions = argMissions.length > 0 ? argMissions : listMissions();
const all = listMissions();
const total = all.length;

// Pre-extract short names for the full catalog (so prev/next can reference them).
const shortNames = {};
for (const v of all) {
  const f = path.join(NASA_ROOT, v, 'index.html');
  if (!fs.existsSync(f)) continue;
  shortNames[v] = extractShortName(fs.readFileSync(f, 'utf8'), v);
}

let patched = 0;
let cssOnly = 0;
let skipped = 0;
const report = [];

for (const ver of missions) {
  const file = path.join(NASA_ROOT, ver, 'index.html');
  if (!fs.existsSync(file)) {
    skipped++;
    report.push(`SKIP ${ver}: file not found`);
    continue;
  }
  const idx = all.indexOf(ver);
  const prev = idx > 0 ? { ver: all[idx - 1], name: shortNames[all[idx - 1]] } : null;
  const next = idx < all.length - 1 ? { ver: all[idx + 1], name: shortNames[all[idx + 1]] } : null;

  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // 1) Strip all existing nav-cards
  html = stripNavCards(html);

  // 2) Build and inject the unified nav-card at top + bottom
  const navCard = buildNavCard(prev, next, total);
  const { html: html2, inserted } = injectNavCards(html, navCard);
  html = html2;

  // 3) Ensure CSS is present
  const { html: html3, cssChanged } = ensureCSS(html);
  html = html3;

  if (html === before) {
    skipped++;
    report.push(`NOOP ${ver}: already canonical`);
    continue;
  }

  if (DRY_RUN) {
    report.push(`DRY  ${ver}: would inject ${inserted} nav-card(s)${cssChanged ? ' + CSS' : ''}`);
  } else {
    // Backup suffix bumped per follow-on (.bak / .bak2 / .bak3 / .bak4 / .bak5
    // / .bak6) so each campaign's rollback snapshot stays intact.
    fs.writeFileSync(file + '.bak6', before);
    fs.writeFileSync(file, html);
    if (cssChanged && inserted === 0) {
      cssOnly++;
      report.push(`CSS  ${ver}: CSS-only patch`);
    } else {
      patched++;
      report.push(`PATCH ${ver}: ${inserted} nav-card(s)${cssChanged ? ' + CSS' : ''}`);
    }
  }
}

console.log(report.slice(0, 20).join('\n'));
if (report.length > 20) console.log(`... ${report.length - 20} more entries`);
console.log('\nSummary:');
console.log(`  patched:   ${patched}`);
console.log(`  CSS-only:  ${cssOnly}`);
console.log(`  skipped:   ${skipped}`);
console.log(`  total:     ${missions.length}`);
if (DRY_RUN) console.log('\n(DRY_RUN=1 — no files written)');

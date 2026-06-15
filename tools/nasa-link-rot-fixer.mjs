#!/usr/bin/env node
/**
 * nasa-link-rot-fixer.mjs — deterministic repair of the dead-internal-link
 * classes found by nasa-consistency-audit.mjs (DEAD_INTERNAL_LINKS /
 * LINK_ESCAPES_WEBROOT), per the canonical link-integrity rule (§3 card 8).
 *
 * Classes fixed (verified targets only — see .planning/nasa-audit):
 *   A. MUS/ELC scaffold-pending cross-series links → series hub
 *   B. ../catalog/index.html breadcrumb → ../index.html (NASA hub)
 *   C. bare viewer.html → artifacts/shaders/viewer.html (when it exists)
 *   D. discoveries.html (never built) → deferred-note / drop nav anchor
 *   E. milestone-number nav-cards on 1.164 → correct degree dirs
 *   F. ELC/1.34, ELC/1.36 (no index.html in target) → ELC hub
 *   G. SPS/1.N numeric links → slug page when it exists, else SPS hub
 *   H. data/{json} prefix on 1.85 → root-level json files
 *   I. ../forest/ depth on 1.109 → ../../forest/
 *   J. ../../_harness/ depth from mission root → ../_harness/
 *   K. ../../../../index.html overshoot on 1.75 → ../../../index.html
 *
 * Usage: node tools/nasa-link-rot-fixer.mjs [--dry-run] [--skip 1.209,1.210,...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NASA = path.join(ROOT, 'www/tibsfox/com/Research/NASA');
const DRY = process.argv.includes('--dry-run');
const skipArg = process.argv.indexOf('--skip');
const SKIP = new Set(skipArg > -1 ? (process.argv[skipArg + 1] || '').split(',').filter(Boolean) : []);

const missions = fs.readdirSync(NASA)
  .filter((d) => /^1\.\d+$/.test(d))
  .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));

let totalFiles = 0;
const changes = {};
const note = (v, msg) => (changes[v] = changes[v] || []).push(msg);

for (const v of missions) {
  if (SKIP.has(v)) continue;
  const idx = path.join(NASA, v, 'index.html');
  if (!fs.existsSync(idx)) continue;
  let html = fs.readFileSync(idx, 'utf8');
  const orig = html;

  // A. MUS/ELC scaffold-pending → series hub (ONLY when the target page is
  // missing — links to built 1.0–1.129 sister pages stay untouched)
  html = html.replace(/href="\.\.\/\.\.\/(MUS|ELC)\/(1\.\d+)\/index\.html"/g, (m, series, deg) => {
    if (fs.existsSync(path.join(NASA, '..', series, deg, 'index.html'))) return m;
    note(v, `${series}/${deg} scaffold-pending → hub`);
    return `href="../../${series}/index.html"`;
  });

  // B. catalog breadcrumb
  html = html.replace(/href="\.\.\/catalog\/index\.html"/g, () => {
    note(v, 'catalog → NASA hub');
    return 'href="../index.html"';
  });

  // C. bare viewer.html → shaders path (only when target exists)
  if (html.includes('href="viewer.html"') && fs.existsSync(path.join(NASA, v, 'artifacts/shaders/viewer.html'))) {
    html = html.replaceAll('href="viewer.html"', 'href="artifacts/shaders/viewer.html"');
    note(v, 'viewer.html → artifacts/shaders/viewer.html');
  }

  // D. discoveries.html (never built)
  if (html.includes('href="discoveries.html"')) {
    html = html.replace(/<a class="nav-card" href="discoveries\.html">[^<]*<\/a>\s*/g, () => {
      note(v, 'dropped discoveries nav-card anchor');
      return '';
    });
    html = html.replace(/<a href="discoveries\.html">[^<]*<\/a>/g, () => {
      note(v, 'discoveries inline link → deferred note');
      return '<em>(discoveries page deferred to restoration wave W6)</em>';
    });
    // any leftover form: point at research.html? No — strip href, keep text.
    html = html.replace(/<a([^>]*) href="discoveries\.html"([^>]*)>/g, (m, a, b) => {
      note(v, 'generic discoveries anchor unstyled');
      return `<a${a} href="research.html"${b} title="discoveries content deferred to W6; see research">`;
    });
  }

  // E. milestone-number nav-cards (1.164): v1.708 JUICE = degree 1.161, v1.706 JWST = degree 1.159
  html = html.replace(/href="\/Research\/NASA\/1\.708\/"/g, () => {
    note(v, '1.708 milestone-ref → ../1.161/');
    return 'href="../1.161/index.html"';
  });
  html = html.replace(/href="\/Research\/NASA\/1\.706\/"/g, () => {
    note(v, '1.706 milestone-ref → ../1.159/');
    return 'href="../1.159/index.html"';
  });

  // F. ELC/1.34, ELC/1.36 — target dirs lack index.html
  html = html.replace(/href="\.\.\/\.\.\/ELC\/1\.3[46]\/index\.html"/g, () => {
    note(v, 'ELC degree page (no index) → ELC hub');
    return 'href="../../ELC/index.html"';
  });

  // G. SPS numeric/legacy links → slug page when it exists, else hub
  const spsMap = {
    '1.68': 'northern-spotted-owl',
    '1.69': 'stellers-jay',
    '95-dungeness-crab': 'dungeness-crab',
  };
  html = html.replace(/href="\.\.\/\.\.\/SPS\/(1\.\d+|95-dungeness-crab)\/index\.html"/g, (m, key) => {
    const slug = spsMap[key];
    if (slug && fs.existsSync(path.join(NASA, '../SPS', slug, 'index.html'))) {
      note(v, `SPS ${key} → ${slug}`);
      return `href="../../SPS/${slug}/index.html"`;
    }
    note(v, `SPS ${key} → hub`);
    return 'href="../../SPS/index.html"';
  });

  // H. data/ prefix (1.85)
  html = html.replace(/href="data\/(knowledge-nodes\.json|data-sources\.json)"/g, (m, f) => {
    note(v, `data/${f} → ${f}`);
    return `href="${f}"`;
  });

  // I. ../forest/ depth (1.109) — keep query strings
  html = html.replace(/href="\.\.\/forest\/index\.html/g, () => {
    note(v, '../forest → ../../forest');
    return 'href="../../forest/index.html';
  });

  // J. _harness depth from mission root (index.html lives at Research/NASA/1.N/)
  html = html.replace(/href="\.\.\/\.\.\/_harness\//g, () => {
    note(v, '../../_harness → ../_harness');
    return 'href="../_harness/';
  });

  // K. homepage overshoot (1.75)
  html = html.replace(/href="\.\.\/\.\.\/\.\.\/\.\.\/index\.html"/g, () => {
    note(v, '4-up overshoot → 3-up homepage');
    return 'href="../../../index.html"';
  });

  if (html !== orig) {
    totalFiles += 1;
    if (!DRY) fs.writeFileSync(idx, html);
  }
}

for (const [v, msgs] of Object.entries(changes)) {
  const tally = {};
  for (const m of msgs) tally[m] = (tally[m] || 0) + 1;
  console.log(`${v}: ${Object.entries(tally).map(([m, n]) => (n > 1 ? `${m} ×${n}` : m)).join('; ')}`);
}
console.log(`${DRY ? '[dry-run] ' : ''}files ${DRY ? 'would be ' : ''}modified: ${totalFiles}`);

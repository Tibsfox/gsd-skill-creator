#!/usr/bin/env node
// Add Track 6 (MUS cross-track) + Track 7 (ELC cross-track) to a mission's
// existing Mission Tracks card.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const target = process.argv[2];
const ver = process.argv[3];   // e.g. "1.34"
if (!target || !ver) { console.error('usage: add-mus-elc-tracks.mjs <index.html> <ver>'); process.exit(2); }

const orig = readFileSync(target, 'utf8');
let html = orig;

// Skip if either track-card already present
if (/Track 6/.test(html) && /Track 7/.test(html)) {
  console.log(`${target}: Track 6/7 already present, no change`);
  process.exit(0);
}

// Find the track-grid closing div. Anchor: locate the LAST track-card in the file
// and walk forward to its parent's closing </div>.
// Simpler heuristic: find "</div>\s*</div>" (the per-card and the grid close) after the LAST track-card.
const lastTrackIdx = html.lastIndexOf('class="track-card');
if (lastTrackIdx < 0) {
  console.log(`${target}: no track-card found, skipping`);
  process.exit(0);
}
// Walk forward from lastTrackIdx, balancing <div>/</div>.
// Find the </div> that closes the LAST <div class="track-card"> (depth-0 close from cardOpen).
// Then the NEXT </div> after that closes the track-grid.
const tagRe = /<\/?div\b/g;
tagRe.lastIndex = lastTrackIdx;
let depth = 0;
let cardClose = -1;
let m;
while ((m = tagRe.exec(html)) !== null) {
  if (m[0] === '<div') depth++;
  else depth--;
  if (depth === 0) { cardClose = m.index + '</div>'.length; break; }
}
if (cardClose < 0) { console.log(`${target}: failed to find last-card close`); process.exit(1); }

// Insert MUS + ELC track-cards right after the last track-card's </div>.
const newCards = `
<div class="track-card"><a href="../../MUS/${ver}/index.html">
<div class="track-num">Track 6 &mdash; Music Theory (cross-track)</div>
<div class="track-title">MUS ${ver}</div>
<div class="track-desc">Parallel MUS catalog entry for degree ${ver} — music-theory cross-track substrate-form companion to this NASA mission.</div>
</a></div>
<div class="track-card"><a href="../../ELC/${ver}/index.html">
<div class="track-num">Track 7 &mdash; Electronics (cross-track)</div>
<div class="track-title">ELC ${ver}</div>
<div class="track-desc">Parallel ELC catalog entry for degree ${ver} — electronics cross-track substrate-form companion to this NASA mission.</div>
</a></div>
`;

html = html.slice(0, cardClose) + newCards + html.slice(cardClose);
writeFileSync(target, html);
console.log(`${target}: added Track 6 + Track 7 cross-program links (${ver})`);

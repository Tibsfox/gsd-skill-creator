#!/usr/bin/env node
/**
 * Tiny utility used at test setup time (and to seed the on-disk fixture)
 * that synthesizes a research.md with the correct word count + a
 * Pedagogical Takeaway section in the 50–250 word window.
 *
 * Usage:  node tests/scoring/fixtures/_make-research.mjs <output-path> [<words>] [--track MUS|ELC]
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const FILLER_PARA =
  'The pedagogical primitive considered here demonstrates how the chosen subject\n' +
  'expresses across the triad of NASA mission narrative, S36 artist signature, and\n' +
  'SPS species acoustic feature. Each axis contributes a concrete exemplar that\n' +
  'illustrates the abstract concept, and the cross-track links propagate this\n' +
  'illustration into the matching ELC and NASA degrees so that the reader can\n' +
  'follow the same idea through three distinct pedagogical surfaces.\n\n';

async function main() {
  const args = process.argv.slice(2);
  const out = args[0];
  let words = 4000;
  let track = 'MUS';
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--track') track = args[++i];
    else if (/^\d+$/.test(args[i])) words = parseInt(args[i], 10);
  }
  if (!out) { console.error('usage: _make-research.mjs <out> [<words>] [--track MUS|ELC]'); process.exit(2); }

  const header = `# ${track} Research — ${track === 'MUS' ? 'Album-as-thesis closure form' : 'Era-appropriate analog conditioning'}\n\n## Overview\n\n`;
  const takeaway =
    '\n## Pedagogical Takeaway\n\n' +
    'The closure-form thesis demonstrates how form-level structure can encode\n' +
    'authorial intent at scales larger than a single song or movement. By placing\n' +
    'the cadential gesture at the album-pair scale rather than the phrase scale,\n' +
    'Grand Archives makes the act of stopping itself the subject of the music.\n' +
    'Students should leave this degree able to articulate the difference between\n' +
    'phrase-level cadence, song-level closure, and catalog-level thesis-completion,\n' +
    'and to identify analogous structures in their own listening across other\n' +
    'two-album indie-folk catalogs of the late 2000s era.\n\n';

  // Build body up to target word count, leaving room for takeaway (~120 words)
  const body = [];
  let count = 0;
  while (count < words - 150) {
    body.push(FILLER_PARA);
    count += FILLER_PARA.split(/\s+/).filter(Boolean).length;
  }
  const refs = '\n## References\n\n- Schubert, Winterreise D.911 (1827)\n- Aldwell/Schachter (2011)\n';
  const text = header + body.join('') + takeaway + refs;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, text, 'utf8');
  const wc = text.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  console.log(`wrote ${out} (~${wc} words gross)`);
}

main().catch((e) => { console.error(e); process.exit(1); });

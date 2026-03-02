/**
 * Module 02: ANSI Art interactive labs.
 *
 * Lab 1: CP437 decode and SAUCE extract — loads the real .ans binary fixture,
 * decodes through the CP437 lookup table, and extracts SAUCE metadata from the tail.
 *
 * Lab 2: ANSI rendering pipeline — tokenizes the fixture through the ANSI CSI
 * parser, verifying SGR color codes and text content.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BbsLab } from '../../shared/types.js';
import { decodeCp437 } from '../../shared/cp437.js';
import { extractSauce } from '../../shared/sauce.js';
import { tokenizeAnsi } from '../../shared/ansi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, '../../../../data/bbs/fixtures/test-artwork.ans');

const lab01: BbsLab = {
  id: 'bbs-m2-lab-01',
  title: 'CP437 Decode and SAUCE Extract',
  steps: [
    {
      instruction:
        'Load the real .ans binary fixture using readFileSync (no encoding argument) to get a raw Buffer. ' +
        'Pass the buffer to decodeCp437() to convert CP437 byte values to Unicode code points. ' +
        'Then pass the same buffer to extractSauce() to read the 128-byte SAUCE metadata record ' +
        'appended to the file tail.',
      expected_observation:
        'The CP437-decoded output contains "BBS TEST ART" and the Unicode light shade character ' +
        '(U+2591, \u2591) which maps from CP437 byte 0xB0. The SAUCE record has title "Test Artwork".',
      learn_note:
        'CP437 is the IBM PC character set — bytes 0x80-0xFF map to box-drawing, block elements, ' +
        'and accented characters that have no ASCII equivalent. The decodeCp437 function uses a ' +
        '256-entry lookup table to map each byte to its Unicode code point. SAUCE (Standard Architecture ' +
        'for Universal Comment Extensions) occupies the last 128 bytes of an ANSI art file, storing ' +
        'metadata like title, author, dimensions, and creation date. The "SAUCE" magic string at offset 0 ' +
        'identifies the record.',
    },
  ],
  verify(): boolean {
    const raw = readFileSync(fixturePath);
    const decoded = decodeCp437(raw);
    if (!decoded.includes('BBS TEST ART')) return false;
    if (!decoded.includes('\u2591')) return false;

    const sauce = extractSauce(raw);
    if (sauce === null) return false;
    if (sauce.title.trim() !== 'Test Artwork') return false;

    return true;
  },
};

const lab02: BbsLab = {
  id: 'bbs-m2-lab-02',
  title: 'ANSI Rendering Pipeline',
  steps: [
    {
      instruction:
        'Load the binary fixture, convert to a latin1 string (which preserves ESC bytes as 0x1B), ' +
        'and pass to tokenizeAnsi(). The tokenizer splits the input into typed tokens: "text" for ' +
        'literal characters, "sgr" for color/style sequences (ESC[...m), "cursor" for positioning, ' +
        'and "erase" for screen clearing.',
      expected_observation:
        'The token array has more than 3 entries. At least one token has type "sgr" (ANSI color codes) ' +
        'and at least one has type "text" (visible content). The text tokens contain "BBS TEST ART".',
      learn_note:
        'ANSI escape sequences follow the CSI (Control Sequence Introducer) format: ESC [ params final_byte. ' +
        'SGR (Select Graphic Rendition) sequences end with "m" and control text color and style — for example, ' +
        'ESC[1;33m sets bold yellow. The tokenizer uses a regex to find CSI sequences and classifies them by ' +
        'final byte. BBS terminals like ANSI.SYS on DOS interpreted these sequences in real time as bytes ' +
        'arrived over the modem.',
    },
  ],
  verify(): boolean {
    const raw = readFileSync(fixturePath);
    const asString = raw.toString('latin1');
    const tokens = tokenizeAnsi(asString);

    if (tokens.length < 3) return false;

    const hasSgr = tokens.some((t) => t.type === 'sgr');
    const hasText = tokens.some((t) => t.type === 'text');
    if (!hasSgr || !hasText) return false;

    const allText = tokens
      .filter((t) => t.type === 'text')
      .map((t) => t.raw)
      .join('');
    if (!allText.includes('BBS TEST ART')) return false;

    return true;
  },
};

export const labs: BbsLab[] = [lab01, lab02];

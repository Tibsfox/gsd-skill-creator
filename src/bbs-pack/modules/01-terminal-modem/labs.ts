/**
 * Module 01: Terminal/Modem interactive labs.
 *
 * Lab 1: UART framing calculator — computes effective throughput from baud rate
 * and framing overhead (start/stop bits).
 *
 * Lab 2: XMODEM block structure — constructs and verifies a 132-byte XMODEM
 * transfer block with SOH, block numbering, 128-byte payload, and checksum.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import type { BbsLab } from '../../shared/types.js';

const lab01: BbsLab = {
  id: 'bbs-m1-lab-01',
  title: 'UART Framing Calculator',
  steps: [
    {
      instruction:
        'Calculate effective throughput for 8N1 framing at 2400 bps. ' +
        '8N1 means 1 start bit + 8 data bits + 0 parity bits + 1 stop bit = 10 bits per character. ' +
        'Divide the baud rate by bits-per-character to get characters per second (CPS).',
      expected_observation:
        '2400 bps / 10 bits-per-char = 240 CPS. At 9600 bps the same framing yields 960 CPS.',
      learn_note:
        'UART serial framing adds start and stop bits around every data byte. ' +
        'The overhead means effective throughput is always less than the raw baud rate. ' +
        'With 8N1 framing the overhead is 20% — only 8 of every 10 bits carry payload. ' +
        'Higher baud rates (9600, 14400, 28800) scale linearly but the 20% tax remains.',
    },
  ],
  verify(): boolean {
    const bitsPerChar8N1 = 1 + 8 + 0 + 1; // start + data + parity + stop
    const cps2400 = 2400 / bitsPerChar8N1;
    const cps9600 = 9600 / bitsPerChar8N1;
    return cps2400 === 240 && cps9600 === 960;
  },
};

const lab02: BbsLab = {
  id: 'bbs-m1-lab-02',
  title: 'XMODEM Block Structure',
  steps: [
    {
      instruction:
        'Construct a 132-byte XMODEM block: SOH (0x01) + block number (1 byte) + ' +
        'complement of block number (1 byte) + 128 bytes of data + checksum (1 byte). ' +
        'The checksum is the sum of all 128 data bytes modulo 256.',
      expected_observation:
        'A block with block number 1 has complement 0xFE. ' +
        'If data bytes are filled with a repeating pattern, the checksum is the sum mod 256. ' +
        'The total block is exactly 132 bytes: 1 + 1 + 1 + 128 + 1.',
      learn_note:
        'XMODEM was the first widely-used file transfer protocol on BBS systems (Ward Christensen, 1977). ' +
        'Error detection uses a simple 8-bit checksum — the sum of data bytes mod 256. ' +
        'Fixed 128-byte blocks simplify receiver buffering. Block numbering (1-255, wrapping) ' +
        'detects sequence errors and duplicate retransmissions. The complement byte provides ' +
        'a quick sanity check that the block number was received correctly.',
    },
  ],
  verify(): boolean {
    // All allocations inside verify() for isolation
    const SOH = 0x01;
    const blockNum = 1;
    const complement = (~blockNum) & 0xFF;
    const block = new Uint8Array(132);

    // Header
    block[0] = SOH;
    block[1] = blockNum;
    block[2] = complement;

    // Fill 128 data bytes with a known pattern (byte index mod 256)
    let expectedChecksum = 0;
    for (let i = 0; i < 128; i++) {
      const val = (i * 7 + 3) & 0xFF; // deterministic pattern
      block[3 + i] = val;
      expectedChecksum = (expectedChecksum + val) & 0xFF;
    }

    // Write checksum
    block[131] = expectedChecksum;

    // Verify: SOH byte correct
    if (block[0] !== SOH) return false;
    // Verify: complement is bitwise NOT of block number
    if (block[2] !== ((~block[1]) & 0xFF)) return false;
    // Verify: recompute checksum from data bytes
    let actualChecksum = 0;
    for (let i = 3; i < 131; i++) {
      actualChecksum = (actualChecksum + block[i]) & 0xFF;
    }
    if (actualChecksum !== block[131]) return false;
    // Verify: total block size
    if (block.length !== 132) return false;

    return true;
  },
};

export const labs: BbsLab[] = [lab01, lab02];

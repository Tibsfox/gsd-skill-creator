/**
 * Tests for the AGC assembler.
 *
 * Verifies two-pass assembly with label resolution, bank directives,
 * all 38 instruction mnemonics, and round-trip with the decoder.
 */

import { describe, it, expect } from 'vitest';
import { assemble, assembleLine } from '../tools/assembler.js';
import { decode } from '../decoder.js';
import { disassembleWord } from '../tools/disassembler.js';

/**
 * Helper: find the last assembled word (skipping auto-EXTEND).
 * For extracode instructions, the assembler emits EXTEND + instruction,
 * so the actual instruction is always the last word.
 */
function getLastWord(source: string) {
  const result = assemble(source);
  return { result, word: result.words[result.words.length - 1] };
}

describe('AGC Assembler', () => {
  // ─── Basic Instructions ────────────────────────────────────────────────

  describe('basic instructions', () => {
    it('assembles TC', () => {
      const { word } = getLastWord('  SETLOC 04000\n  TC 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('TC');
      expect(decoded.address).toBe(0o100);
    });

    it('assembles CCS (erasable)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  CCS 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('CCS');
    });

    it('assembles TCF (fixed)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  TCF 04000');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('TCF');
    });

    it('assembles DAS (quarter-code 0)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DAS 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('DAS');
    });

    it('assembles LXCH (quarter-code 1)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  LXCH 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('LXCH');
    });

    it('assembles INCR (quarter-code 2)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  INCR 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('INCR');
    });

    it('assembles ADS (quarter-code 3)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  ADS 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('ADS');
    });

    it('assembles CA', () => {
      const { word } = getLastWord('  SETLOC 04000\n  CA 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('CA');
      expect(decoded.address).toBe(0o100);
    });

    it('assembles CS', () => {
      const { word } = getLastWord('  SETLOC 04000\n  CS 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('CS');
    });

    it('assembles INDEX', () => {
      const { word } = getLastWord('  SETLOC 04000\n  INDEX 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('INDEX');
    });

    it('assembles DXCH (quarter-code 1)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DXCH 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('DXCH');
    });

    it('assembles TS (quarter-code 2)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  TS 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('TS');
    });

    it('assembles XCH (quarter-code 3)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  XCH 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('XCH');
    });

    it('assembles AD', () => {
      const { word } = getLastWord('  SETLOC 04000\n  AD 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('AD');
    });

    it('assembles MASK', () => {
      const { word } = getLastWord('  SETLOC 04000\n  MASK 00100');
      const decoded = decode(word.word, false);
      expect(decoded.mnemonic).toBe('MASK');
    });
  });

  // ─── Extracode Instructions ────────────────────────────────────────────

  describe('extracode instructions with auto-EXTEND', () => {
    it('assembles READ with auto-EXTEND', () => {
      const { result, word } = getLastWord('  SETLOC 04000\n  READ 010');
      // Should emit EXTEND + READ = 2 words
      expect(result.words).toHaveLength(2);
      expect(result.words[0].word).toBe(0o00006); // EXTEND
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('READ');
      expect(decoded.address).toBe(0o10);
    });

    it('assembles WRITE with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  WRITE 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('WRITE');
    });

    it('assembles RAND with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  RAND 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('RAND');
    });

    it('assembles WAND with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  WAND 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('WAND');
    });

    it('assembles ROR with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  ROR 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('ROR');
    });

    it('assembles WOR with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  WOR 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('WOR');
    });

    it('assembles RXOR with auto-EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  RXOR 010');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('RXOR');
    });

    it('assembles DV (erasable)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DV 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('DV');
    });

    it('assembles BZF (fixed)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  BZF 04000');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('BZF');
    });

    it('assembles MSU', () => {
      const { word } = getLastWord('  SETLOC 04000\n  MSU 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('MSU');
    });

    it('assembles QXCH', () => {
      const { word } = getLastWord('  SETLOC 04000\n  QXCH 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('QXCH');
    });

    it('assembles AUG', () => {
      const { word } = getLastWord('  SETLOC 04000\n  AUG 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('AUG');
    });

    it('assembles DIM', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DIM 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('DIM');
    });

    it('assembles DCA', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DCA 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('DCA');
    });

    it('assembles DCS', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DCS 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('DCS');
    });

    it('assembles SU (erasable)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  SU 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('SU');
    });

    it('assembles BZMF (fixed)', () => {
      const { word } = getLastWord('  SETLOC 04000\n  BZMF 04000');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('BZMF');
    });

    it('assembles MP', () => {
      const { word } = getLastWord('  SETLOC 04000\n  MP 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('MP');
    });
  });

  // ─── Special Instructions ──────────────────────────────────────────────

  describe('special instructions', () => {
    it('assembles INHINT', () => {
      const { word } = getLastWord('  SETLOC 04000\n  INHINT');
      expect(word.word).toBe(0o00004);
    });

    it('assembles RELINT', () => {
      const { word } = getLastWord('  SETLOC 04000\n  RELINT');
      expect(word.word).toBe(0o00003);
    });

    it('assembles EXTEND', () => {
      const { word } = getLastWord('  SETLOC 04000\n  EXTEND');
      expect(word.word).toBe(0o00006);
    });

    it('assembles RESUME', () => {
      const { word } = getLastWord('  SETLOC 04000\n  RESUME');
      expect(word.word).toBe(0o50017);
    });

    it('assembles NOOP', () => {
      const { word } = getLastWord('  SETLOC 04000\n  NOOP');
      expect(word.word).toBe(0o30000);
    });
  });

  // ─── Quarter-Code Instructions ─────────────────────────────────────────

  describe('quarter-code instructions', () => {
    const qcBasic = [
      ['DAS', 0], ['LXCH', 1], ['INCR', 2], ['ADS', 3],
    ] as const;

    for (const [mnem, qc] of qcBasic) {
      it(`assembles ${mnem} with qc=${qc} and decodes correctly`, () => {
        const { word } = getLastWord(`  SETLOC 04000\n  ${mnem} 00100`);
        const decoded = decode(word.word, false);
        expect(decoded.mnemonic).toBe(mnem);
        expect(decoded.quarterCode).toBe(qc);
      });
    }

    const qcExt = [
      ['MSU', 0], ['QXCH', 1], ['AUG', 2], ['DIM', 3],
    ] as const;

    for (const [mnem, qc] of qcExt) {
      it(`assembles ${mnem} with qc=${qc} and decodes correctly`, () => {
        const { word } = getLastWord(`  SETLOC 04000\n  ${mnem} 00100`);
        const decoded = decode(word.word, true);
        expect(decoded.mnemonic).toBe(mnem);
        expect(decoded.quarterCode).toBe(qc);
      });
    }
  });

  // ─── I/O Instructions ─────────────────────────────────────────────────

  describe('I/O instructions with channel numbers', () => {
    const ioInstructions = [
      ['READ', 0], ['WRITE', 1], ['RAND', 2], ['WAND', 3],
      ['ROR', 4], ['WOR', 5], ['RXOR', 6],
    ] as const;

    for (const [mnem, subcode] of ioInstructions) {
      it(`assembles ${mnem} with correct subcode ${subcode}`, () => {
        const { word } = getLastWord(`  SETLOC 04000\n  ${mnem} 010`);
        const decoded = decode(word.word, true);
        expect(decoded.mnemonic).toBe(mnem);
        expect(decoded.address).toBe(0o10);
      });
    }
  });

  // ─── Label Resolution ─────────────────────────────────────────────────

  describe('label resolution', () => {
    it('resolves forward references', () => {
      const source = [
        '  SETLOC 04000',
        '  TC TARGET',
        '  NOOP',
        'TARGET  CA A',
      ].join('\n');

      const result = assemble(source);
      expect(result.errors).toHaveLength(0);

      // TC is the first word
      const tcWord = result.words[0];
      const decoded = decode(tcWord.word, false);
      expect(decoded.mnemonic).toBe('TC');

      const targetAddr = result.labels.get('TARGET');
      expect(targetAddr).toBeDefined();
      expect(decoded.address).toBe(targetAddr);
    });

    it('resolves backward references', () => {
      const source = [
        '  SETLOC 04000',
        'LOOP  CA A',
        '  TC LOOP',
      ].join('\n');

      const result = assemble(source);
      expect(result.errors).toHaveLength(0);

      // TC is the second word
      const tcWord = result.words[1];
      const decoded = decode(tcWord.word, false);
      expect(decoded.address).toBe(0o4000);
    });
  });

  // ─── Directives ────────────────────────────────────────────────────────

  describe('directives', () => {
    it('SETLOC sets location counter', () => {
      const { word } = getLastWord('  SETLOC 05000\n  CA A');
      expect(word.address).toBe(0o5000);
    });

    it('BANK sets bank and adjusts location', () => {
      const { word } = getLastWord('  BANK 05\n  CA A');
      expect(word.bank).toBe(5);
      expect(word.address).toBe(5 * 1024);
    });

    it('OCT produces correct raw words', () => {
      const { word } = getLastWord('  SETLOC 04000\n  OCT 77777');
      expect(word.word).toBe(0o77777);
    });

    it('DEC produces correct words', () => {
      const { word } = getLastWord('  SETLOC 04000\n  DEC 100');
      expect(word.word).toBe(100);
    });

    it('EQUALS defines symbol alias', () => {
      const source = [
        'MYVAL  EQUALS 00100',
        '  SETLOC 04000',
        '  CA MYVAL',
      ].join('\n');

      const result = assemble(source);
      expect(result.labels.get('MYVAL')).toBe(0o100);
      const caWord = result.words[0];
      const decoded = decode(caWord.word, false);
      expect(decoded.address).toBe(0o100);
    });
  });

  // ─── Error Handling ────────────────────────────────────────────────────

  describe('error handling', () => {
    it('reports unknown mnemonic', () => {
      const result = assemble('  SETLOC 04000\n  BOGUS 00100');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Unknown mnemonic');
    });
  });

  // ─── Multi-Line Program ────────────────────────────────────────────────

  describe('multi-line program', () => {
    it('assembles a complete program', () => {
      const source = [
        '# Add two values and store result',
        '  SETLOC 04000',
        '  CA 00100     # load first value',
        '  AD 00101     # add second value',
        '  TS 00102     # store result',
        '  TC 04000     # loop back',
      ].join('\n');

      const result = assemble(source);
      expect(result.errors).toHaveLength(0);
      expect(result.words).toHaveLength(4);

      const mnemonics = result.words.map(w => decode(w.word, false).mnemonic);
      expect(mnemonics).toEqual(['CA', 'AD', 'TS', 'TC']);
    });

    it('assigns sequential addresses', () => {
      const source = [
        '  SETLOC 04000',
        '  CA A',
        '  AD A',
        '  TS 00100',
      ].join('\n');

      const result = assemble(source);
      expect(result.words[0].address).toBe(0o4000);
      expect(result.words[1].address).toBe(0o4001);
      expect(result.words[2].address).toBe(0o4002);
    });
  });

  // ─── Round-Trip Test ───────────────────────────────────────────────────

  describe('round-trip (assemble -> decode)', () => {
    it('basic instructions round-trip correctly', () => {
      const instructions = ['TC', 'CA', 'CS', 'AD', 'MASK'];

      for (const mnem of instructions) {
        const { word } = getLastWord(`  SETLOC 04000\n  ${mnem} 00200`);
        const decoded = decode(word.word, false);
        const disasm = disassembleWord(word.word, false, word.address);
        expect(disasm.mnemonic).toBe(decoded.mnemonic);
      }
    });

    it('extracode instructions round-trip correctly', () => {
      const { word } = getLastWord('  SETLOC 04000\n  MP 00100');
      const decoded = decode(word.word, true);
      expect(decoded.mnemonic).toBe('MP');
      const disasm = disassembleWord(word.word, true, word.address);
      expect(disasm.mnemonic).toBe('MP');
    });
  });

  // ─── Bank Map Output ──────────────────────────────────────────────────

  describe('bank map output', () => {
    it('produces correct bank map for loadFixed', () => {
      const source = [
        '  SETLOC 04000',
        '  CA 00100',
        '  AD 00101',
      ].join('\n');

      const result = assemble(source);
      // 0o4000 = 2048 decimal, 2048/1024 = 2 => bank 2
      const bank = result.banks.get(2);
      expect(bank).toBeDefined();
      expect(bank![0]).toBe(result.words[0].word);
      expect(bank![1]).toBe(result.words[1].word);
    });
  });

  // ─── assembleLine ─────────────────────────────────────────────────────

  describe('assembleLine', () => {
    it('assembles a single instruction', () => {
      const result = assembleLine('  CA 00100');
      expect(result).not.toBeNull();
      expect(result!.needsExtend).toBe(false);
      const decoded = decode(result!.word, false);
      expect(decoded.mnemonic).toBe('CA');
    });

    it('returns needsExtend for extracode', () => {
      const result = assembleLine('  MP 00100');
      expect(result).not.toBeNull();
      expect(result!.needsExtend).toBe(true);
    });

    it('returns null for comments', () => {
      expect(assembleLine('# comment')).toBeNull();
    });

    it('returns null for blank lines', () => {
      expect(assembleLine('')).toBeNull();
    });

    it('uses provided symbol table', () => {
      const symbols = new Map([['TARGET', 0o4100]]);
      const result = assembleLine('  TC TARGET', symbols);
      expect(result).not.toBeNull();
      const decoded = decode(result!.word, false);
      expect(decoded.address).toBe(0o4100);
    });
  });
});

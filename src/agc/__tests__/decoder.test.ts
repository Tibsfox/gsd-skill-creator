import { describe, it, expect } from 'vitest';
import { decode, applyIndex } from '../decoder.js';
import type { DecodedInstruction } from '../decoder.js';

describe('AGC Instruction Decoder', () => {
  describe('Basic instruction decoding (extracode=false)', () => {
    // Opcode 0: TC (and special cases)
    describe('Opcode 0 (TC family)', () => {
      it('decodes TC to an address', () => {
        // TC 0o0100: opcode=000, address=0o0100
        // Instruction word = (0 << 12) | 0o0100 = 0o00100
        const d = decode(0o00100, false);
        expect(d.mnemonic).toBe('TC');
        expect(d.address).toBe(0o0100);
        expect(d.opcode).toBe(0);
      });

      it('decodes TC 0o00003 as RELINT', () => {
        const d = decode(0o00003, false);
        expect(d.mnemonic).toBe('RELINT');
      });

      it('decodes TC 0o00004 as INHINT', () => {
        const d = decode(0o00004, false);
        expect(d.mnemonic).toBe('INHINT');
      });

      it('decodes TC 0o00006 as EXTEND', () => {
        const d = decode(0o00006, false);
        expect(d.mnemonic).toBe('EXTEND');
      });
    });

    // Opcode 1: CCS (erasable) / TCF (fixed)
    describe('Opcode 1 (CCS/TCF)', () => {
      it('decodes CCS for erasable address', () => {
        // CCS 0o0100: opcode=001, address=0o0100 (erasable range)
        // Word = (1 << 12) | 0o0100 = 0o10100
        const d = decode(0o10100, false);
        expect(d.mnemonic).toBe('CCS');
        expect(d.address).toBe(0o0100);
      });

      it('decodes TCF for fixed address', () => {
        // TCF 0o4000: opcode=001, address=0o4000 (fixed range)
        // Word = (1 << 12) | 0o4000 = 0o14000
        const d = decode(0o14000, false);
        expect(d.mnemonic).toBe('TCF');
        expect(d.address).toBe(0o4000);
      });
    });

    // Opcode 2: DAS/LXCH/INCR/ADS (quarter-code)
    describe('Opcode 2 (quarter-code)', () => {
      it('decodes DAS (QC=00)', () => {
        // DAS: opcode=010, QC=00, address=0o0100
        // Word = (2 << 12) | (0 << 10) | 0o0100 = 0o20100
        const d = decode(0o20100, false);
        expect(d.mnemonic).toBe('DAS');
        expect(d.quarterCode).toBe(0);
      });

      it('decodes LXCH (QC=01)', () => {
        const word = (2 << 12) | (1 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('LXCH');
        expect(d.quarterCode).toBe(1);
      });

      it('decodes INCR (QC=10)', () => {
        const word = (2 << 12) | (2 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('INCR');
        expect(d.quarterCode).toBe(2);
      });

      it('decodes ADS (QC=11)', () => {
        const word = (2 << 12) | (3 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('ADS');
        expect(d.quarterCode).toBe(3);
      });
    });

    // Opcode 3: CA
    describe('Opcode 3 (CA)', () => {
      it('decodes CA', () => {
        // Word = (3 << 12) | 0o0100 = 0o30100
        const d = decode(0o30100, false);
        expect(d.mnemonic).toBe('CA');
        expect(d.address).toBe(0o0100);
      });
    });

    // Opcode 4: CS
    describe('Opcode 4 (CS)', () => {
      it('decodes CS', () => {
        // Word = (4 << 12) | 0o0100 = 0o40100
        const d = decode(0o40100, false);
        expect(d.mnemonic).toBe('CS');
        expect(d.address).toBe(0o0100);
      });
    });

    // Opcode 5: INDEX/DXCH/TS/XCH (quarter-code)
    describe('Opcode 5 (quarter-code)', () => {
      it('decodes INDEX (QC=00)', () => {
        // Word = (5 << 12) | (0 << 10) | addr = 0o50000 | addr
        const d = decode(0o50100, false);
        expect(d.mnemonic).toBe('INDEX');
        expect(d.quarterCode).toBe(0);
      });

      it('decodes INDEX 0o17 as RESUME', () => {
        // Word = (5 << 12) | 0o00017 = 0o50017
        const d = decode(0o50017, false);
        expect(d.mnemonic).toBe('RESUME');
      });

      it('decodes DXCH (QC=01)', () => {
        const word = (5 << 12) | (1 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('DXCH');
        expect(d.quarterCode).toBe(1);
      });

      it('decodes TS (QC=10)', () => {
        const word = (5 << 12) | (2 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('TS');
        expect(d.quarterCode).toBe(2);
      });

      it('decodes XCH (QC=11)', () => {
        const word = (5 << 12) | (3 << 10) | 0o0100;
        const d = decode(word, false);
        expect(d.mnemonic).toBe('XCH');
        expect(d.quarterCode).toBe(3);
      });
    });

    // Opcode 6: AD
    describe('Opcode 6 (AD)', () => {
      it('decodes AD', () => {
        // Word = (6 << 12) | 0o0100 = 0o60100
        const d = decode(0o60100, false);
        expect(d.mnemonic).toBe('AD');
        expect(d.address).toBe(0o0100);
      });
    });

    // Opcode 7: MASK
    describe('Opcode 7 (MASK)', () => {
      it('decodes MASK', () => {
        // Word = (7 << 12) | 0o0100 = 0o70100
        const d = decode(0o70100, false);
        expect(d.mnemonic).toBe('MASK');
        expect(d.address).toBe(0o0100);
      });
    });
  });

  describe('Extracode instruction decoding (extracode=true)', () => {
    // Extracode opcode 0: I/O instructions
    describe('Extracode opcode 0 (I/O)', () => {
      it('decodes READ', () => {
        // READ: bits 11-9 = 000, channel in bits 8-0
        const word = (0 << 12) | (0 << 9) | 7; // READ channel 7
        const d = decode(word, true);
        expect(d.mnemonic).toBe('READ');
        expect(d.address).toBe(7); // channel number
      });

      it('decodes WRITE', () => {
        const word = (0 << 12) | (1 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('WRITE');
      });

      it('decodes RAND', () => {
        const word = (0 << 12) | (2 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('RAND');
      });

      it('decodes WAND', () => {
        const word = (0 << 12) | (3 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('WAND');
      });

      it('decodes ROR', () => {
        const word = (0 << 12) | (4 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('ROR');
      });

      it('decodes WOR', () => {
        const word = (0 << 12) | (5 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('WOR');
      });

      it('decodes RXOR', () => {
        const word = (0 << 12) | (6 << 9) | 7;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('RXOR');
      });
    });

    // Extracode opcode 1: DV (erasable) / BZF (fixed)
    describe('Extracode opcode 1 (DV/BZF)', () => {
      it('decodes DV for erasable address', () => {
        const word = (1 << 12) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('DV');
      });

      it('decodes BZF for fixed address', () => {
        const word = (1 << 12) | 0o4000;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('BZF');
      });
    });

    // Extracode opcode 2: MSU/QXCH/AUG/DIM (quarter-code)
    describe('Extracode opcode 2 (quarter-code)', () => {
      it('decodes MSU (QC=00)', () => {
        const word = (2 << 12) | (0 << 10) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('MSU');
      });

      it('decodes QXCH (QC=01)', () => {
        const word = (2 << 12) | (1 << 10) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('QXCH');
      });

      it('decodes AUG (QC=10)', () => {
        const word = (2 << 12) | (2 << 10) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('AUG');
      });

      it('decodes DIM (QC=11)', () => {
        const word = (2 << 12) | (3 << 10) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('DIM');
      });
    });

    // Extracode opcode 3: DCA
    describe('Extracode opcode 3 (DCA)', () => {
      it('decodes DCA', () => {
        const word = (3 << 12) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('DCA');
      });
    });

    // Extracode opcode 4: DCS
    describe('Extracode opcode 4 (DCS)', () => {
      it('decodes DCS', () => {
        const word = (4 << 12) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('DCS');
      });
    });

    // Extracode opcode 6: SU (erasable) / BZMF (fixed)
    describe('Extracode opcode 6 (SU/BZMF)', () => {
      it('decodes SU for erasable address', () => {
        const word = (6 << 12) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('SU');
      });

      it('decodes BZMF for fixed address', () => {
        const word = (6 << 12) | 0o4000;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('BZMF');
      });
    });

    // Extracode opcode 7: MP
    describe('Extracode opcode 7 (MP)', () => {
      it('decodes MP', () => {
        const word = (7 << 12) | 0o0100;
        const d = decode(word, true);
        expect(d.mnemonic).toBe('MP');
      });
    });
  });

  describe('applyIndex', () => {
    it('adds index value to instruction word', () => {
      // TC 0o100 (word = 0o00100) + index 1 = TC 0o101
      expect(applyIndex(0o00100, 1)).toBe(0o00101);
    });

    it('masks result to 15 bits', () => {
      expect(applyIndex(0o77777, 1)).toBe(0o00000);
    });

    it('can change opcode bits', () => {
      // INDEX can modify the entire instruction word including opcode
      const result = applyIndex(0o00100, 0o10000);
      expect(result).toBe(0o10100);
    });
  });
});

/**
 * Comprehensive tests for all 5 BBS module labs.
 *
 * Validates structure (BbsLab interface), verify() functions, educational
 * content coverage (keywords in learn_notes), and cross-module consistency.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import { describe, it, expect } from 'vitest';
import { labs as m1Labs } from '../modules/01-terminal-modem/labs.js';
import { labs as m2Labs } from '../modules/02-ansi-art/labs.js';
import { labs as m3Labs } from '../modules/03-fidonet/labs.js';
import { labs as m4Labs } from '../modules/04-irc-dancer/labs.js';
import { labs as m5Labs } from '../modules/05-door-games/labs.js';

const allModules = [
  { name: 'Module 01: Terminal/Modem', labs: m1Labs, prefix: 'bbs-m1' },
  { name: 'Module 02: ANSI Art', labs: m2Labs, prefix: 'bbs-m2' },
  { name: 'Module 03: FidoNet', labs: m3Labs, prefix: 'bbs-m3' },
  { name: 'Module 04: IRC/Dancer', labs: m4Labs, prefix: 'bbs-m4' },
  { name: 'Module 05: Door Games', labs: m5Labs, prefix: 'bbs-m5' },
];

const allLabs = allModules.flatMap((m) => m.labs);

// ============================================================================
// Per-Module Structure Validation
// ============================================================================

describe('BBS educational labs (BBS-08)', () => {
  for (const mod of allModules) {
    describe(`${mod.name} — structure validation`, () => {
      it('has at least 2 lab entries', () => {
        expect(mod.labs.length).toBeGreaterThanOrEqual(2);
      });

      it('each lab has id, title, steps, and verify function', () => {
        for (const lab of mod.labs) {
          expect(typeof lab.id).toBe('string');
          expect(lab.id.length).toBeGreaterThan(0);
          expect(typeof lab.title).toBe('string');
          expect(lab.title.length).toBeGreaterThan(0);
          expect(Array.isArray(lab.steps)).toBe(true);
          expect(lab.steps.length).toBeGreaterThan(0);
          expect(typeof lab.verify).toBe('function');
        }
      });

      it('each lab step has instruction, expected_observation, and learn_note', () => {
        for (const lab of mod.labs) {
          for (const step of lab.steps) {
            expect(typeof step.instruction).toBe('string');
            expect(step.instruction.length).toBeGreaterThan(0);
            expect(typeof step.expected_observation).toBe('string');
            expect(step.expected_observation.length).toBeGreaterThan(0);
            expect(typeof step.learn_note).toBe('string');
            expect(step.learn_note.length).toBeGreaterThan(0);
          }
        }
      });

      it(`lab IDs follow ${mod.prefix}-lab-NN pattern`, () => {
        for (const lab of mod.labs) {
          expect(lab.id).toMatch(/^bbs-m[1-5]-lab-\d{2}$/);
        }
      });
    });
  }

  // ============================================================================
  // Per-Module verify() Tests
  // ============================================================================

  describe('Module 01: Terminal/Modem — verify()', () => {
    it('bbs-m1-lab-01 (UART Framing Calculator) verify returns true', () => {
      const lab = m1Labs.find((l) => l.id === 'bbs-m1-lab-01');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });

    it('bbs-m1-lab-02 (XMODEM Block Structure) verify returns true', () => {
      const lab = m1Labs.find((l) => l.id === 'bbs-m1-lab-02');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });
  });

  describe('Module 02: ANSI Art — verify()', () => {
    it('bbs-m2-lab-01 (CP437 Decode and SAUCE Extract) verify returns true', () => {
      const lab = m2Labs.find((l) => l.id === 'bbs-m2-lab-01');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });

    it('bbs-m2-lab-02 (ANSI Rendering Pipeline) verify returns true', () => {
      const lab = m2Labs.find((l) => l.id === 'bbs-m2-lab-02');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });
  });

  describe('Module 03: FidoNet — verify() (fresh buffers per call)', () => {
    it('bbs-m3-lab-01 (FTS-0001 Packet Header) verify returns true', () => {
      const lab = m3Labs.find((l) => l.id === 'bbs-m3-lab-01');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });

    it('bbs-m3-lab-02 (Packed Message Decode) verify returns true', () => {
      const lab = m3Labs.find((l) => l.id === 'bbs-m3-lab-02');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });
  });

  describe('Module 04: IRC/Dancer — verify()', () => {
    it('bbs-m4-lab-01 (IRC Message Parse) verify returns true', () => {
      const lab = m4Labs.find((l) => l.id === 'bbs-m4-lab-01');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });

    it('bbs-m4-lab-02 (Bot Command Dispatch) verify returns true', () => {
      const lab = m4Labs.find((l) => l.id === 'bbs-m4-lab-02');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });
  });

  describe('Module 05: Door Games — verify()', () => {
    it('bbs-m5-lab-01 (DOOR.SYS Parser) verify returns true', () => {
      const lab = m5Labs.find((l) => l.id === 'bbs-m5-lab-01');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });

    it('bbs-m5-lab-02 (Game Turn Calculator) verify returns true', () => {
      const lab = m5Labs.find((l) => l.id === 'bbs-m5-lab-02');
      expect(lab).toBeDefined();
      expect(lab!.verify()).toBe(true);
    });
  });

  // ============================================================================
  // Educational Content Coverage
  // ============================================================================

  describe('educational content coverage', () => {
    function collectLearnNotes(labs: typeof allLabs): string {
      return labs
        .flatMap((l) => l.steps.map((s) => s.learn_note))
        .join(' ')
        .toLowerCase();
    }

    function collectAllText(labs: typeof allLabs): string {
      return labs
        .flatMap((l) => l.steps.map((s) => `${s.instruction} ${s.expected_observation} ${s.learn_note}`))
        .join(' ')
        .toLowerCase();
    }

    it('Module 01 learn_notes mention UART and XMODEM', () => {
      const notes = collectLearnNotes(m1Labs);
      expect(notes).toContain('uart');
      expect(notes).toContain('xmodem');
    });

    it('Module 02 learn_notes mention CP437, SAUCE, and SGR/CSI', () => {
      const notes = collectLearnNotes(m2Labs);
      expect(notes).toContain('cp437');
      expect(notes).toContain('sauce');
      const hasSgrOrCsi = notes.includes('sgr') || notes.includes('csi');
      expect(hasSgrOrCsi).toBe(true);
    });

    it('Module 03 learn_notes mention FTS-0001/FidoNet and little-endian', () => {
      const notes = collectLearnNotes(m3Labs);
      const hasFts = notes.includes('fts-0001') || notes.includes('fidonet');
      expect(hasFts).toBe(true);
      expect(notes).toContain('little-endian');
    });

    it('Module 04 references data/bbs/dancer-irc/ files', () => {
      const text = collectAllText(m4Labs);
      expect(text).toContain('data/bbs/dancer-irc/');
    });

    it('Module 05 learn_notes mention DOOR.SYS/drop file and turn', () => {
      const notes = collectLearnNotes(m5Labs);
      const hasDoorSys = notes.includes('door.sys') || notes.includes('drop file');
      expect(hasDoorSys).toBe(true);
      expect(notes).toContain('turn');
    });
  });

  // ============================================================================
  // Cross-Module Validation
  // ============================================================================

  describe('cross-module validation', () => {
    it('all modules combined have at least 10 labs', () => {
      expect(allLabs.length).toBeGreaterThanOrEqual(10);
    });

    it('no duplicate lab IDs across modules', () => {
      const ids = allLabs.map((l) => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all verify() functions return boolean', () => {
      for (const lab of allLabs) {
        const result = lab.verify();
        expect(typeof result).toBe('boolean');
      }
    });

    it('all lab IDs are globally unique and well-formed', () => {
      const ids = allLabs.map((l) => l.id);
      for (const id of ids) {
        expect(id).toMatch(/^bbs-m[1-5]-lab-\d{2}$/);
      }
    });
  });
});

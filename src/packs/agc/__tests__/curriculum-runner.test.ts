/**
 * Curriculum runner infrastructure tests.
 *
 * Tests the simplified assembler and program runner for AGC curriculum
 * starter programs. Validates assembly, execution, I/O logging, and
 * halt detection.
 *
 * Phase 221 -- AGC Curriculum & Exercises.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleProgramSource,
  runProgram,
  CHAPTERS,
  EXERCISES,
  PROGRAMS,
} from '../curriculum/index.js';

// ─── Assembly Tests ──────────────────────────────────────────────────────────

describe('assembleProgramSource', () => {
  it('assembles a minimal CA + AD + TS program into correct machine code', () => {
    const source = `
# Minimal add program
SETLOC   4000
START    CA     VAL1
         AD     VAL2
         TS     RESULT
         TC     DONE
DONE     TC     DONE
VAL1     DEC    10
VAL2     DEC    20
RESULT   ERASE
`;
    const words = assembleProgramSource(source);

    // CA VAL1: opcode 3 (bits 14-12) | address of VAL1
    // VAL1 is at 4005, so CA VAL1 = (3 << 12) | 0o4005
    expect(words[0o4000]).toBe((3 << 12) | 0o4005);

    // AD VAL2: opcode 6 | address of VAL2
    expect(words[0o4001]).toBe((6 << 12) | 0o4006);

    // Words array should be non-empty (has data)
    expect(words.some(w => w !== 0)).toBe(true);
  });

  it('assembles OCT directive to produce literal values', () => {
    const source = `
SETLOC   4000
MYVAL    OCT    12345
`;
    const words = assembleProgramSource(source);
    expect(words[0o4000]).toBe(0o12345);
  });

  it('assembles DEC directive to produce correct ones-complement values', () => {
    const source = `
SETLOC   4000
POS      DEC    42
`;
    const words = assembleProgramSource(source);
    expect(words[0o4000]).toBe(42);
  });

  it('places code at correct address with SETLOC', () => {
    const source = `
SETLOC   4010
START    CA     START
`;
    const words = assembleProgramSource(source);
    // Code at 0o4010, not 0o4000
    expect(words[0o4000]).toBe(0); // nothing at default start
    expect(words[0o4010]).not.toBe(0); // code here
  });

  it('resolves forward references via labels', () => {
    const source = `
SETLOC   4000
         TC     TARGET
         TC     TARGET
TARGET   TC     TARGET
`;
    const words = assembleProgramSource(source);
    // TC TARGET: opcode 0 | address of TARGET (0o4002)
    expect(words[0o4000]).toBe((0 << 12) | 0o4002);
    expect(words[0o4001]).toBe((0 << 12) | 0o4002);
    // TARGET itself: TC TARGET (self-loop)
    expect(words[0o4002]).toBe((0 << 12) | 0o4002);
  });

  it('throws on unknown mnemonic', () => {
    const source = `
SETLOC   4000
         BOGUS  123
`;
    expect(() => assembleProgramSource(source)).toThrow(/unknown mnemonic/i);
  });

  it('assembles EXTEND + WRITE as two words', () => {
    const source = `
SETLOC   4000
         CA     VAL
         EXTEND
         WRITE  10
DONE     TC     DONE
VAL      OCT    77777
`;
    const words = assembleProgramSource(source);
    // CA VAL at 0o4000
    expect(words[0o4000]).not.toBe(0);
    // EXTEND at 0o4001 = TC 6 = 0o00006
    expect(words[0o4001]).toBe(0o6);
    // WRITE 10 at 0o4002: subcode 1 in bits 11-9, channel 8 (octal 10) in bits 8-0
    expect(words[0o4002]).toBe((1 << 9) | 8); // WRITE subcode=1, channel=8 (decimal of octal 10)
  });

  it('assembles ERASE directive to allocate erasable memory', () => {
    const source = `
SETLOC   4000
         CA     MYVAR
DONE     TC     DONE
MYVAR    ERASE
`;
    const words = assembleProgramSource(source);
    // MYVAR should resolve to an erasable address (< 0o2000)
    // CA MYVAR: opcode 3 | address of MYVAR
    const caWord = words[0o4000];
    const address = caWord & 0o7777;
    expect(address).toBeLessThan(0o2000); // erasable range
  });
});

// ─── Execution Tests ─────────────────────────────────────────────────────────

describe('runProgram', () => {
  it('executes a simple load-add-store program and halts at TC self', () => {
    const source = `
SETLOC   4000
         CA     VAL1
         AD     VAL2
         TS     RESULT
DONE     TC     DONE
VAL1     DEC    5
VAL2     DEC    3
RESULT   ERASE
`;
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 100 });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('TC to self');
    expect(result.steps).toBeGreaterThan(0);
    expect(result.steps).toBeLessThan(100);
  });

  it('respects maxSteps limit', () => {
    // Infinite loop without TC to self detection point
    const source = `
SETLOC   4000
LOOP     CA     VAL
         AD     VAL
         TC     LOOP
VAL      DEC    1
`;
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 50 });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('maxSteps');
    expect(result.steps).toBe(50);
  });

  it('captures I/O write operations in ioLog', () => {
    const source = `
SETLOC   4000
         CA     DISPVAL
         EXTEND
         WRITE  10
DONE     TC     DONE
DISPVAL  OCT    12345
`;
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 100 });

    expect(result.halted).toBe(true);

    // Should have at least one I/O write to channel 10 (decimal 8 = octal 10)
    const ch10Writes = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
    expect(ch10Writes.length).toBeGreaterThanOrEqual(1);
    expect(ch10Writes[0].value).toBe(0o12345);
  });

  it('handles a program that uses CCS for counting', () => {
    const source = `
SETLOC   4000
START    CA     THREE
         TS     COUNT
LOOP     CCS    COUNT
         TC     CONT
         TC     DONE
         TC     DONE
         TC     DONE
CONT     TS     COUNT
         TC     LOOP
DONE     TC     DONE
THREE    DEC    3
COUNT    ERASE
`;
    const program = assembleProgramSource(source);
    const result = runProgram(program, { maxSteps: 200 });

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('TC to self');
  });
});

// ─── Curriculum Metadata Tests ───────────────────────────────────────────────

describe('Curriculum metadata arrays', () => {
  it('CHAPTERS has exactly 11 entries with sequential chapter numbers', () => {
    expect(CHAPTERS).toHaveLength(11);
    for (let i = 0; i < CHAPTERS.length; i++) {
      expect(CHAPTERS[i].chapter).toBe(i + 1);
    }
  });

  it('EXERCISES has exactly 8 entries', () => {
    expect(EXERCISES).toHaveLength(8);
    for (let i = 0; i < EXERCISES.length; i++) {
      expect(EXERCISES[i].exercise).toBe(i + 1);
    }
  });

  it('PROGRAMS has exactly 8 entries', () => {
    expect(PROGRAMS).toHaveLength(8);
    for (let i = 0; i < PROGRAMS.length; i++) {
      expect(PROGRAMS[i].program).toBe(i + 1);
    }
  });

  it('every exercise references a valid program slug', () => {
    const programSlugs = new Set(PROGRAMS.map(p => p.slug));
    for (const ex of EXERCISES) {
      expect(programSlugs.has(ex.programSlug)).toBe(true);
    }
  });

  it('every exercise references a valid chapter number', () => {
    const chapterNums = new Set(CHAPTERS.map(c => c.chapter));
    for (const ex of EXERCISES) {
      expect(chapterNums.has(ex.chapter)).toBe(true);
    }
  });

  it('every chapter has at least one learning objective', () => {
    for (const ch of CHAPTERS) {
      expect(ch.learningObjectives.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every chapter has at least one archive reference', () => {
    for (const ch of CHAPTERS) {
      expect(ch.archiveRefs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('chapter slugs are unique', () => {
    const slugs = CHAPTERS.map(c => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('exercise slugs are unique', () => {
    const slugs = EXERCISES.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

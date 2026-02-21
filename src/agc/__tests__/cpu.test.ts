import { describe, it, expect } from 'vitest';
import { RegisterId, WORD15_MASK, ADDRESS12_MASK } from '../types.js';
import { getRegister, setRegister } from '../registers.js';
import { loadFixed, writeMemory, readMemory } from '../memory.js';
import { onesNegate } from '../alu.js';
import { createCpuState, step } from '../cpu.js';
import type { CpuState } from '../cpu.js';

/** Helper: set a register in CPU state. */
function withReg(state: CpuState, id: RegisterId, value: number): CpuState {
  return { ...state, registers: setRegister(state.registers, id, value) };
}

/** Helper: load program words into fixed memory bank 2 (addresses 0o2000+). */
function loadProgram(state: CpuState, words: number[], startBank = 2): CpuState {
  const bankData = new Array(1024).fill(0);
  for (let i = 0; i < words.length; i++) {
    bankData[i] = words[i];
  }
  return {
    ...state,
    memory: loadFixed(state.memory, startBank, bankData),
  };
}

/** Helper: write to erasable memory. */
function withErasable(state: CpuState, addr: number, value: number): CpuState {
  return {
    ...state,
    memory: writeMemory(state.memory, addr, 0, 0, value),
  };
}

describe('AGC CPU', () => {
  describe('createCpuState', () => {
    it('returns initial state with Z=0o4000', () => {
      const state = createCpuState();
      expect(getRegister(state.registers, RegisterId.Z)).toBe(0o4000);
      expect(state.extracode).toBe(false);
      expect(state.indexValue).toBe(0);
      expect(state.inhibitInterrupt).toBe(false);
    });
  });

  describe('Single-step tests', () => {
    it('executes TC instruction', () => {
      // TC 0o2100: opcode 0, address 0o2100
      // Instruction word = 0o02100
      let state = createCpuState();
      // Load TC 0o2100 at address 0o4000 (fixed-fixed bank 2, offset 0)
      // Fixed-fixed bank 2 starts at 0o2000
      // Z starts at 0o4000 which is FBANK-switched region
      // Let's use bank 2 (fixed-fixed) instead: set Z to 0o2000
      state = withReg(state, RegisterId.Z, 0o2000);
      state = loadProgram(state, [0o00100]); // TC 0o0100 -- but address must be valid
      // Actually, TC 0o2100 = instruction word (0 << 12) | 0o2100 = 0o02100
      state = loadProgram(state, [0o02100]); // TC 0o2100
      const result = step(state);
      expect(getRegister(result.state.registers, RegisterId.Q)).toBe(0o2001); // return addr
      expect(getRegister(result.state.registers, RegisterId.Z)).toBe(0o2100); // jumped
    });

    it('executes CA instruction', () => {
      // CA 0o0100: opcode 3, address 0o0100
      // Instruction word = (3 << 12) | 0o0100 = 0o30100
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withErasable(state, 0o0100, 0o12345);
      state = loadProgram(state, [0o30100]); // CA 0o0100
      const result = step(state);
      expect(getRegister(result.state.registers, RegisterId.A)).toBe(0o12345);
      expect(result.mctsUsed).toBe(2);
    });

    it('executes AD instruction', () => {
      // AD 0o0100: opcode 6, address 0o0100
      // Instruction word = (6 << 12) | 0o0100 = 0o60100
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withReg(state, RegisterId.A, 5);
      state = withErasable(state, 0o0100, 3);
      state = loadProgram(state, [0o60100]); // AD 0o0100
      const result = step(state);
      expect(getRegister(result.state.registers, RegisterId.A)).toBe(8);
    });

    it('executes MASK instruction', () => {
      // MASK 0o0100: opcode 7, address 0o0100
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withReg(state, RegisterId.A, 0o77700);
      state = withErasable(state, 0o0100, 0o07777);
      state = loadProgram(state, [0o70100]); // MASK 0o0100
      const result = step(state);
      expect(getRegister(result.state.registers, RegisterId.A)).toBe(0o07700);
    });

    it('executes CS instruction', () => {
      // CS 0o0100: opcode 4, address 0o0100
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withErasable(state, 0o0100, 0o12345);
      state = loadProgram(state, [0o40100]); // CS 0o0100
      const result = step(state);
      expect(getRegister(result.state.registers, RegisterId.A)).toBe(onesNegate(0o12345));
    });

    it('executes INDEX + CA (two steps)', () => {
      // INDEX 0o0100 followed by CA 0o0200
      // INDEX: opcode 5, QC=00, addr=0o0100 -> word = (5 << 12) | 0o0100 = 0o50100
      // CA: opcode 3, addr=0o0200 -> word = 0o30200
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withErasable(state, 0o0100, 3); // INDEX value = 3
      state = withErasable(state, 0o0203, 0o77777); // Value at addr 0o0200 + 3
      state = loadProgram(state, [0o50100, 0o30200]); // INDEX 0o0100, CA 0o0200
      // Step 1: INDEX
      const result1 = step(state);
      expect(result1.state.indexValue).toBe(3);
      // Step 2: CA 0o0200 + index 3 = CA 0o0203
      const result2 = step(result1.state);
      // The index value (3) is added to the FULL instruction word 0o30200
      // 0o30200 + 3 = 0o30203 -> CA 0o0203
      expect(getRegister(result2.state.registers, RegisterId.A)).toBe(0o77777);
    });
  });

  describe('Multi-step program', () => {
    it('executes a load-add-store-loop program', () => {
      // Program at 0o2000:
      //   CA 0o0100    ; Load value from erasable 0o0100 into A
      //   AD 0o0101    ; Add value from erasable 0o0101
      //   TS 0o0102    ; Store result in erasable 0o0102
      //   TC 0o2000    ; Loop back
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withErasable(state, 0o0100, 5);
      state = withErasable(state, 0o0101, 3);
      state = loadProgram(state, [
        0o30100,   // CA 0o0100
        0o60101,   // AD 0o0101
        (5 << 12) | (2 << 10) | 0o0102, // TS 0o0102
        0o02000,   // TC 0o2000
      ]);

      // Step 1: CA -- A = 5
      const s1 = step(state);
      expect(getRegister(s1.state.registers, RegisterId.A)).toBe(5);

      // Step 2: AD -- A = 5 + 3 = 8
      const s2 = step(s1.state);
      expect(getRegister(s2.state.registers, RegisterId.A)).toBe(8);

      // Step 3: TS -- store 8 to 0o0102
      const s3 = step(s2.state);
      const ebank = getRegister(s3.state.registers, RegisterId.EBANK);
      const fbank = getRegister(s3.state.registers, RegisterId.FBANK);
      expect(readMemory(s3.state.memory, 0o0102, ebank, fbank, 0)).toBe(8);

      // Step 4: TC -- loop back to 0o2000
      const s4 = step(s3.state);
      expect(getRegister(s4.state.registers, RegisterId.Z)).toBe(0o2000);
    });
  });

  describe('EXTEND + extracode test', () => {
    it('EXTEND sets extracode flag, next instruction decodes as extracode', () => {
      // EXTEND = TC 6 = instruction word 0o00006
      // MP 0o0100 = extracode opcode 7, addr 0o0100: word (7 << 12) | 0o0100 = 0o70100
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withReg(state, RegisterId.A, 0o10000);
      state = withErasable(state, 0o0100, 0o10000);
      state = loadProgram(state, [
        0o00006,   // EXTEND
        0o70100,   // MP 0o0100 (extracode)
      ]);

      // Step 1: EXTEND
      const s1 = step(state);
      expect(s1.state.extracode).toBe(true);

      // Step 2: MP 0o0100 (decoded as extracode because flag is set)
      const s2 = step(s1.state);
      expect(s2.state.extracode).toBe(false); // consumed
      // Check multiplication result
      expect(getRegister(s2.state.registers, RegisterId.A)).toBe(0o02000);
      expect(getRegister(s2.state.registers, RegisterId.L)).toBe(0);
    });
  });

  describe('MCT timing', () => {
    it('tracks MCTs for a multi-instruction sequence', () => {
      // CA (2 MCT) + AD (2 MCT) + TC (1 MCT) = 5 MCT total
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withErasable(state, 0o0100, 1);
      state = loadProgram(state, [
        0o30100,   // CA 0o0100 = 2 MCT
        0o60100,   // AD 0o0100 = 2 MCT
        0o02000,   // TC 0o2000 = 1 MCT
      ]);

      let totalMCTs = 0;
      let s = state;
      for (let i = 0; i < 3; i++) {
        const result = step(s);
        totalMCTs += result.mctsUsed;
        s = result.state;
      }
      expect(totalMCTs).toBe(5);
    });
  });

  describe('State immutability', () => {
    it('step does not mutate input state', () => {
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = loadProgram(state, [0o30100]); // CA 0o0100
      state = withErasable(state, 0o0100, 42);

      const originalZ = getRegister(state.registers, RegisterId.Z);
      const originalA = getRegister(state.registers, RegisterId.A);

      step(state);

      expect(getRegister(state.registers, RegisterId.Z)).toBe(originalZ);
      expect(getRegister(state.registers, RegisterId.A)).toBe(originalA);
    });
  });

  describe('I/O test', () => {
    it('EXTEND + WRITE captures I/O operation', () => {
      // EXTEND + WRITE channel 7
      // WRITE: extracode opcode 0, subcode 001, channel 7
      // Word = (0 << 12) | (1 << 9) | 7 = 0o01007
      let state = createCpuState();
      state = withReg(state, RegisterId.Z, 0o2000);
      state = withReg(state, RegisterId.A, 0o54321);
      state = loadProgram(state, [
        0o00006,   // EXTEND
        0o01007,   // WRITE channel 7
      ]);

      const s1 = step(state);
      expect(s1.state.extracode).toBe(true);

      const s2 = step(s1.state);
      expect(s2.ioOp).toBeDefined();
      expect(s2.ioOp?.type).toBe('write');
      expect(s2.ioOp?.channel).toBe(7);
      expect(s2.ioOp?.value).toBe(0o54321);
    });
  });
});

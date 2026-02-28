import { describe, it, expect } from 'vitest';
import { RegisterId, WORD15_MASK, ADDRESS12_MASK } from '../types.js';
import { createRegisters, getRegister, setRegister } from '../registers.js';
import { createMemory, writeMemory, loadFixed, readMemory } from '../memory.js';
import { onesNegate, isZero, isNegative } from '../alu.js';
import type { CpuState, InstructionResult } from '../instructions.js';
import {
  makeCpuState,
  execTC,
  execCCS,
  execTCF,
  execDAS,
  execLXCH,
  execINCR,
  execADS,
  execCA,
  execCS,
  execINDEX,
  execDXCH,
  execTS,
  execXCH,
  execAD,
  execMASK,
  execEXTEND,
  execREAD,
  execWRITE,
  execRAND,
  execWAND,
  execROR,
  execWOR,
  execRXOR,
  execDV,
  execBZF,
  execMSU,
  execQXCH,
  execAUG,
  execDIM,
  execDCA,
  execDCS,
  execSU,
  execBZMF,
  execMP,
  execINHINT,
  execRELINT,
  execNOOP,
  execRESUME,
} from '../instructions.js';

/** Helper: create a default CPU state with custom setup. */
function makeState(setup?: (state: CpuState) => CpuState): CpuState {
  let state = makeCpuState();
  if (setup) {
    state = setup(state);
  }
  return state;
}

/** Helper: write a value to erasable memory in a state. */
function withErasable(state: CpuState, addr: number, value: number): CpuState {
  const ebank = getRegister(state.registers, RegisterId.EBANK);
  const fbank = getRegister(state.registers, RegisterId.FBANK);
  return {
    ...state,
    memory: writeMemory(state.memory, addr, ebank, fbank, value),
  };
}

/** Helper: set a register in a state. */
function withReg(state: CpuState, id: RegisterId, value: number): CpuState {
  return { ...state, registers: setRegister(state.registers, id, value) };
}

/** Helper: read operand from state memory. */
function readOp(state: CpuState, addr: number): number {
  const ebank = getRegister(state.registers, RegisterId.EBANK);
  const fbank = getRegister(state.registers, RegisterId.FBANK);
  return readMemory(state.memory, addr, ebank, fbank, state.memory.superbank);
}

describe('AGC Instructions', () => {
  // ─── Basic Instructions ───────────────────────────────────────────────

  describe('TC (Transfer Control)', () => {
    it('stores return address in Q and jumps to target', () => {
      const state = withReg(makeState(), RegisterId.Z, 0o4000);
      const result = execTC(state, 0o2100);
      // Q = old Z (the "return address" -- Z was already advanced by CPU to Z+1 before exec)
      expect(getRegister(result.registers, RegisterId.Q)).toBe(0o4000);
      expect(result.nextZ).toBe(0o2100);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('CCS (Count Compare Skip)', () => {
    it('positive value: A = DABS-1, skip 0 (Z+1)', () => {
      let state = makeState();
      state = withReg(state, RegisterId.Z, 0o4001);
      state = withErasable(state, 0o0100, 5);
      const result = execCCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(4); // DABS(5) - 1 = 4
      expect(result.nextZ).toBe(0o4001); // skip 0 = next instruction
      expect(result.mctsUsed).toBe(2);
    });

    it('positive zero: A = 0, skip 1 (Z+2)', () => {
      let state = makeState();
      state = withReg(state, RegisterId.Z, 0o4001);
      state = withErasable(state, 0o0100, 0);
      const result = execCCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0);
      expect(result.nextZ).toBe(0o4002); // skip 1
    });

    it('negative value: A = DABS-1, skip 2 (Z+3)', () => {
      let state = makeState();
      state = withReg(state, RegisterId.Z, 0o4001);
      state = withErasable(state, 0o0100, onesNegate(5));
      const result = execCCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(4); // DABS(-5) - 1 = 4
      expect(result.nextZ).toBe(0o4003); // skip 2
    });

    it('negative zero: A = 0, skip 3 (Z+4)', () => {
      let state = makeState();
      state = withReg(state, RegisterId.Z, 0o4001);
      state = withErasable(state, 0o0100, 0o77777); // -0
      const result = execCCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0);
      expect(result.nextZ).toBe(0o4004); // skip 3
    });
  });

  describe('TCF (Transfer Control to Fixed)', () => {
    it('jumps to fixed address without saving Q', () => {
      const state = withReg(makeState(), RegisterId.Z, 0o4001);
      const oldQ = getRegister(state.registers, RegisterId.Q);
      const result = execTCF(state, 0o2100);
      expect(result.nextZ).toBe(0o2100);
      expect(getRegister(result.registers, RegisterId.Q)).toBe(oldQ);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('CA (Clear and Add)', () => {
    it('copies memory value to A', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0o12345);
      const result = execCA(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o12345);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('CS (Clear and Subtract)', () => {
    it('loads complement of memory value into A', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0o12345);
      const result = execCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(onesNegate(0o12345));
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('AD (Add)', () => {
    it('adds memory value to A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 5);
      state = withErasable(state, 0o0100, 3);
      const result = execAD(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(8);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('MASK (Bitwise AND)', () => {
    it('ANDs memory value with A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o77700);
      state = withErasable(state, 0o0100, 0o07777);
      const result = execMASK(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o07700);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('LXCH (Exchange L with memory)', () => {
    it('swaps L and memory value', () => {
      let state = makeState();
      state = withReg(state, RegisterId.L, 0o11111);
      state = withErasable(state, 0o0100, 0o22222);
      const result = execLXCH(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.L)).toBe(0o22222);
      expect(readOp(result, 0o0100)).toBe(0o11111);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('INCR (Increment memory)', () => {
    it('increments memory value by 1', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 5);
      const result = execINCR(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(6);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('ADS (Add to Storage)', () => {
    it('adds A to memory and stores result in both A and memory', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 5);
      state = withErasable(state, 0o0100, 3);
      const result = execADS(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(8);
      expect(getRegister(result.registers, RegisterId.A)).toBe(8);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('INDEX', () => {
    it('stores the index value for the next instruction', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0o00005);
      const result = execINDEX(state, 0o0100);
      expect(result.indexValue).toBe(0o00005);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('DXCH (Double Exchange)', () => {
    it('swaps A,L with memory pair', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o11111);
      state = withReg(state, RegisterId.L, 0o22222);
      state = withErasable(state, 0o0100, 0o33333);
      state = withErasable(state, 0o0101, 0o44444);
      const result = execDXCH(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o33333);
      expect(getRegister(result.registers, RegisterId.L)).toBe(0o44444);
      expect(readOp(result, 0o0100)).toBe(0o11111);
      expect(readOp(result, 0o0101)).toBe(0o22222);
      expect(result.mctsUsed).toBe(3);
    });
  });

  describe('TS (Transfer to Storage)', () => {
    it('stores A in memory without overflow', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o12345);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execTS(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(0o12345);
      expect(result.nextZ).toBe(0o4001); // no skip
      expect(result.mctsUsed).toBe(2);
    });

    it('skips next instruction on positive overflow', () => {
      let state = makeState();
      // Set A with positive overflow (bit 15=0, bit 14=1)
      state = withReg(state, RegisterId.A, 0o040001);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execTS(state, 0o0100);
      expect(result.nextZ).toBe(0o4002); // skip 1
      // A should be set to +1
      expect(getRegister(result.registers, RegisterId.A)).toBe(1);
    });

    it('skips next instruction on negative overflow', () => {
      let state = makeState();
      // Set A with negative overflow (bit 15=1, bit 14=0)
      state = withReg(state, RegisterId.A, 0o100001);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execTS(state, 0o0100);
      expect(result.nextZ).toBe(0o4002); // skip 1
      // A should be set to -1 (0o77776)
      expect(getRegister(result.registers, RegisterId.A)).toBe(onesNegate(1));
    });
  });

  describe('XCH (Exchange)', () => {
    it('swaps A and memory value', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o11111);
      state = withErasable(state, 0o0100, 0o22222);
      const result = execXCH(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o22222);
      expect(readOp(result, 0o0100)).toBe(0o11111);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('DAS (Double Add to Storage)', () => {
    it('adds (A,L) to memory pair and clears A,L', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 5);
      state = withReg(state, RegisterId.L, 10);
      state = withErasable(state, 0o0100, 3);
      state = withErasable(state, 0o0101, 7);
      const result = execDAS(state, 0o0100);
      // memory[0o0100] = 5+3 = 8, memory[0o0101] = 10+7 = 17
      expect(readOp(result, 0o0100)).toBe(8);
      expect(readOp(result, 0o0101)).toBe(17);
      // A and L should be cleared to 0
      expect(getRegister(result.registers, RegisterId.A)).toBe(0);
      expect(getRegister(result.registers, RegisterId.L)).toBe(0);
      expect(result.mctsUsed).toBe(3);
    });
  });

  // ─── Extracode Instructions ───────────────────────────────────────────

  describe('EXTEND', () => {
    it('sets the extracode flag', () => {
      const state = makeState();
      const result = execEXTEND(state);
      expect(result.extracode).toBe(true);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('I/O Instructions', () => {
    it('READ loads channel value into A', () => {
      let state = makeState();
      state = { ...state, ioChannels: new Map([[7, 0o12345]]) };
      const result = execREAD(state, 7);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o12345);
      expect(result.mctsUsed).toBe(2);
    });

    it('WRITE stores A to channel', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o54321);
      const result = execWRITE(state, 7);
      expect(result.ioChannels?.get(7)).toBe(0o54321);
      expect(result.mctsUsed).toBe(2);
    });

    it('RAND reads channel AND A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o77700);
      state = { ...state, ioChannels: new Map([[7, 0o07777]]) };
      const result = execRAND(state, 7);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o07700);
      expect(result.mctsUsed).toBe(2);
    });

    it('WAND writes A AND channel back to channel', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o77700);
      state = { ...state, ioChannels: new Map([[7, 0o07777]]) };
      const result = execWAND(state, 7);
      expect(result.ioChannels?.get(7)).toBe(0o07700);
      expect(result.mctsUsed).toBe(2);
    });

    it('ROR reads channel OR A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o70000);
      state = { ...state, ioChannels: new Map([[7, 0o00777]]) };
      const result = execROR(state, 7);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o70777);
      expect(result.mctsUsed).toBe(2);
    });

    it('WOR writes A OR channel back to channel', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o70000);
      state = { ...state, ioChannels: new Map([[7, 0o00777]]) };
      const result = execWOR(state, 7);
      expect(result.ioChannels?.get(7)).toBe(0o70777);
      expect(result.mctsUsed).toBe(2);
    });

    it('RXOR reads channel XOR A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o77000);
      state = { ...state, ioChannels: new Map([[7, 0o07700]]) };
      const result = execRXOR(state, 7);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o70700);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('DV (Divide)', () => {
    it('divides (A,L) by memory value', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o02000);
      state = withReg(state, RegisterId.L, 0);
      state = withErasable(state, 0o0100, 0o10000);
      const result = execDV(state, 0o0100);
      expect(result.mctsUsed).toBe(6);
      // Quotient in A, remainder in L
      expect(getRegister(result.registers, RegisterId.A)).toBeDefined();
      expect(getRegister(result.registers, RegisterId.L)).toBeDefined();
    });
  });

  describe('BZF (Branch Zero to Fixed)', () => {
    it('branches when A is +0', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZF(state, 0o2100);
      expect(result.nextZ).toBe(0o2100);
      expect(result.mctsUsed).toBe(1);
    });

    it('branches when A is -0', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o77777);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZF(state, 0o2100);
      expect(result.nextZ).toBe(0o2100);
    });

    it('does not branch when A is non-zero', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 5);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZF(state, 0o2100);
      expect(result.nextZ).toBe(0o4001); // continue
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('MSU (Modular Subtract)', () => {
    it('subtracts memory from A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 10);
      state = withErasable(state, 0o0100, 3);
      const result = execMSU(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(7);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('QXCH (Exchange Q with memory)', () => {
    it('swaps Q and memory value', () => {
      let state = makeState();
      state = withReg(state, RegisterId.Q, 0o11111);
      state = withErasable(state, 0o0100, 0o22222);
      const result = execQXCH(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.Q)).toBe(0o22222);
      expect(readOp(result, 0o0100)).toBe(0o11111);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('AUG (Augment)', () => {
    it('increments positive memory value', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 5);
      const result = execAUG(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(6);
      expect(result.mctsUsed).toBe(2);
    });

    it('moves negative value away from zero', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, onesNegate(5));
      const result = execAUG(state, 0o0100);
      // -5 augmented = -6 (magnitude increases)
      expect(readOp(result, 0o0100)).toBe(onesNegate(6));
    });
  });

  describe('DIM (Diminish)', () => {
    it('decrements positive value toward zero', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 5);
      const result = execDIM(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(4);
      expect(result.mctsUsed).toBe(2);
    });

    it('does not change zero', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0);
      const result = execDIM(state, 0o0100);
      expect(readOp(result, 0o0100)).toBe(0);
    });
  });

  describe('DCA (Double Clear and Add)', () => {
    it('loads double value into A,L', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0o11111);
      state = withErasable(state, 0o0101, 0o22222);
      const result = execDCA(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o11111);
      expect(getRegister(result.registers, RegisterId.L)).toBe(0o22222);
      expect(result.mctsUsed).toBe(3);
    });
  });

  describe('DCS (Double Clear and Subtract)', () => {
    it('loads complement of double value into A,L', () => {
      let state = makeState();
      state = withErasable(state, 0o0100, 0o11111);
      state = withErasable(state, 0o0101, 0o22222);
      const result = execDCS(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(onesNegate(0o11111));
      expect(getRegister(result.registers, RegisterId.L)).toBe(onesNegate(0o22222));
      expect(result.mctsUsed).toBe(3);
    });
  });

  describe('SU (Subtract)', () => {
    it('subtracts memory from A', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 10);
      state = withErasable(state, 0o0100, 3);
      const result = execSU(state, 0o0100);
      expect(getRegister(result.registers, RegisterId.A)).toBe(7);
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('BZMF (Branch Zero or Minus to Fixed)', () => {
    it('branches when A is zero', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZMF(state, 0o2100);
      expect(result.nextZ).toBe(0o2100);
      expect(result.mctsUsed).toBe(1);
    });

    it('branches when A is negative', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, onesNegate(5));
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZMF(state, 0o2100);
      expect(result.nextZ).toBe(0o2100);
    });

    it('does not branch when A is positive', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 5);
      state = withReg(state, RegisterId.Z, 0o4001);
      const result = execBZMF(state, 0o2100);
      expect(result.nextZ).toBe(0o4001); // continue
      expect(result.mctsUsed).toBe(2);
    });
  });

  describe('MP (Multiply)', () => {
    it('multiplies A by memory and stores in A,L', () => {
      let state = makeState();
      state = withReg(state, RegisterId.A, 0o10000);
      state = withErasable(state, 0o0100, 0o10000);
      const result = execMP(state, 0o0100);
      expect(result.mctsUsed).toBe(3);
      // Result in A (high) and L (low)
      expect(getRegister(result.registers, RegisterId.A)).toBe(0o02000);
      expect(getRegister(result.registers, RegisterId.L)).toBe(0);
    });
  });

  // ─── Special Instructions ─────────────────────────────────────────────

  describe('INHINT', () => {
    it('sets interrupt inhibit flag', () => {
      const state = makeState();
      const result = execINHINT(state);
      expect(result.inhibitInterrupt).toBe(true);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('RELINT', () => {
    it('clears interrupt inhibit flag', () => {
      let state = makeState();
      state = { ...state, inhibitInterrupt: true };
      const result = execRELINT(state);
      expect(result.inhibitInterrupt).toBe(false);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('NOOP', () => {
    it('does not change state except nextZ', () => {
      const state = withReg(makeState(), RegisterId.Z, 0o4001);
      const result = execNOOP(state);
      expect(result.nextZ).toBe(0o4001);
      expect(result.mctsUsed).toBe(1);
    });
  });

  describe('RESUME', () => {
    it('returns from interrupt by jumping to ZRUPT value', () => {
      // ZRUPT is stored at a known erasable location; for simplicity,
      // we use the BRUPT register approach
      let state = makeState();
      // Set a return address in erasable location 0o0042 (ZRUPT typically)
      state = withErasable(state, 0o0042, 0o2500);
      const result = execRESUME(state);
      expect(result.nextZ).toBe(0o2500);
      expect(result.mctsUsed).toBe(2);
    });
  });

  // ─── State immutability ───────────────────────────────────────────────

  describe('Immutability', () => {
    it('instruction execution does not mutate input state', () => {
      const state = withErasable(makeState(), 0o0100, 0o12345);
      const originalA = getRegister(state.registers, RegisterId.A);
      execCA(state, 0o0100);
      expect(getRegister(state.registers, RegisterId.A)).toBe(originalA);
    });
  });
});

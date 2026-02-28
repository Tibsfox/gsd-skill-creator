/**
 * AGC Block II instruction implementations.
 *
 * Each instruction is a pure function from CpuState to InstructionResult.
 * 15 basic, 18 extracode, 4 special instructions.
 *
 * No mutation: all functions return new state objects.
 */

import { RegisterId, WORD15_MASK, WORD16_MASK, ADDRESS12_MASK } from './types.js';
import { type AgcRegisters, createRegisters, getRegister, setRegister } from './registers.js';
import { type AgcMemory, createMemory, readMemory, writeMemory } from './memory.js';
import {
  onesAdd,
  onesSub,
  onesNegate,
  onesComplement,
  onesAbs,
  onesIncrement,
  onesDecrement,
  diminish,
  onesMultiply,
  onesDivide,
  onesDoubleAdd,
  overflow,
  overflowCorrect,
  isNegative,
  isZero,
} from './alu.js';

// ─── State Types ────────────────────────────────────────────────────────────

export interface CpuState {
  readonly registers: AgcRegisters;
  readonly memory: AgcMemory;
  readonly ioChannels: ReadonlyMap<number, number>;
  readonly extracode: boolean;
  readonly indexValue: number;
  readonly inhibitInterrupt: boolean;
}

export interface InstructionResult {
  readonly registers: AgcRegisters;
  readonly memory: AgcMemory;
  readonly ioChannels: ReadonlyMap<number, number>;
  readonly nextZ: number;
  readonly mctsUsed: number;
  readonly extracode: boolean;
  readonly indexValue: number;
  readonly inhibitInterrupt: boolean;
  readonly ioOp?: { channel: number; value: number; type: 'read' | 'write' };
}

/** Create a default CPU state. */
export function makeCpuState(): CpuState {
  return {
    registers: createRegisters(),
    memory: createMemory(),
    ioChannels: new Map(),
    extracode: false,
    indexValue: 0,
    inhibitInterrupt: false,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the current bank registers for memory access. */
function getBanks(regs: AgcRegisters) {
  return {
    ebank: getRegister(regs, RegisterId.EBANK),
    fbank: getRegister(regs, RegisterId.FBANK),
  };
}

/** Read a value from memory at the given address using current bank registers. */
function readOp(state: CpuState, address: number): number {
  const { ebank, fbank } = getBanks(state.registers);
  // Check if address is a register
  if (address <= 0o17) {
    return getRegister(state.registers, address as RegisterId);
  }
  return readMemory(state.memory, address, ebank, fbank, state.memory.superbank);
}

/** Write a value to memory, returning new memory state. */
function writeOp(state: CpuState, address: number, value: number): { registers: AgcRegisters; memory: AgcMemory } {
  const { ebank, fbank } = getBanks(state.registers);
  // Check if address is a register
  if (address <= 0o17) {
    return {
      registers: setRegister(state.registers, address as RegisterId, value),
      memory: state.memory,
    };
  }
  return {
    registers: state.registers,
    memory: writeMemory(state.memory, address, ebank, fbank, value),
  };
}

/** Build a result with default field values from state. */
function result(state: CpuState, overrides: Partial<InstructionResult>): InstructionResult {
  return {
    registers: overrides.registers ?? state.registers,
    memory: overrides.memory ?? state.memory,
    ioChannels: overrides.ioChannels ?? state.ioChannels,
    nextZ: overrides.nextZ ?? getRegister(state.registers, RegisterId.Z),
    mctsUsed: overrides.mctsUsed ?? 1,
    extracode: overrides.extracode ?? false,
    indexValue: overrides.indexValue ?? 0,
    inhibitInterrupt: overrides.inhibitInterrupt ?? state.inhibitInterrupt,
    ioOp: overrides.ioOp,
  };
}

// ─── Basic Instructions ─────────────────────────────────────────────────────

/** TC: Transfer Control. Save return address in Q, jump to address. */
export function execTC(state: CpuState, address: number): InstructionResult {
  const z = getRegister(state.registers, RegisterId.Z);
  let regs = setRegister(state.registers, RegisterId.Q, z);
  return result(state, {
    registers: regs,
    nextZ: address & ADDRESS12_MASK,
    mctsUsed: 1,
  });
}

/** CCS: Count, Compare, Skip. */
export function execCCS(state: CpuState, address: number): InstructionResult {
  const z = getRegister(state.registers, RegisterId.Z);
  const operand = readOp(state, address);

  let newA: number;
  let skip: number;

  if (isZero(operand)) {
    if (isNegative(operand)) {
      // -0: skip 3
      newA = 0;
      skip = 3;
    } else {
      // +0: skip 1
      newA = 0;
      skip = 1;
    }
  } else if (isNegative(operand)) {
    // Negative: DABS - 1, skip 2
    newA = onesAbs(operand) - 1;
    skip = 2;
  } else {
    // Positive: DABS - 1, skip 0
    newA = operand - 1;
    skip = 0;
  }

  const regs = setRegister(state.registers, RegisterId.A, newA & WORD15_MASK);
  return result(state, {
    registers: regs,
    nextZ: (z + skip) & ADDRESS12_MASK,
    mctsUsed: 2,
  });
}

/** TCF: Transfer Control to Fixed. Jump without saving Q. */
export function execTCF(state: CpuState, address: number): InstructionResult {
  return result(state, {
    nextZ: address & ADDRESS12_MASK,
    mctsUsed: 1,
  });
}

/** DAS: Double Add to Storage. */
export function execDAS(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A);
  const l = getRegister(state.registers, RegisterId.L);
  const memH = readOp(state, address);
  const memL = readOp(state, address + 1);

  const dResult = onesDoubleAdd(a & WORD15_MASK, l, memH, memL);

  // Write results to memory pair
  let { registers: regs, memory: mem } = writeOp(state, address, dResult.high);
  const w2 = writeOp({ ...state, registers: regs, memory: mem }, address + 1, dResult.low);
  regs = w2.registers;
  mem = w2.memory;

  // Clear A and L
  regs = setRegister(regs, RegisterId.A, 0);
  regs = setRegister(regs, RegisterId.L, 0);

  return result(state, {
    registers: regs,
    memory: mem,
    mctsUsed: 3,
  });
}

/** LXCH: Exchange L with memory. */
export function execLXCH(state: CpuState, address: number): InstructionResult {
  const lVal = getRegister(state.registers, RegisterId.L);
  const memVal = readOp(state, address);

  const { registers: regs, memory: mem } = writeOp(state, address, lVal);
  const newRegs = setRegister(regs, RegisterId.L, memVal);

  return result(state, {
    registers: newRegs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** INCR: Increment memory value. */
export function execINCR(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);
  const incremented = onesIncrement(memVal);
  const { registers: regs, memory: mem } = writeOp(state, address, incremented.value);

  return result(state, {
    registers: regs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** ADS: Add to Storage. A += memory, result also stored in memory. */
export function execADS(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A);
  const memVal = readOp(state, address);
  const sum = onesAdd(a & WORD15_MASK, memVal);

  const { registers: regs, memory: mem } = writeOp(state, address, sum.value);
  const newRegs = setRegister(regs, RegisterId.A, sum.value);

  return result(state, {
    registers: newRegs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** CA: Clear and Add. A = memory[addr]. */
export function execCA(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);
  const regs = setRegister(state.registers, RegisterId.A, memVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** CS: Clear and Subtract. A = complement of memory[addr]. */
export function execCS(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);
  const regs = setRegister(state.registers, RegisterId.A, onesNegate(memVal));

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** INDEX: Store value for adding to next instruction word. */
export function execINDEX(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);

  return result(state, {
    indexValue: memVal,
    mctsUsed: 2,
  });
}

/** DXCH: Double Exchange. A <-> mem[addr], L <-> mem[addr+1]. */
export function execDXCH(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const l = getRegister(state.registers, RegisterId.L);
  const memH = readOp(state, address);
  const memL = readOp(state, address + 1);

  // Write A to mem[addr], L to mem[addr+1]
  let { registers: regs, memory: mem } = writeOp(state, address, a);
  const w2 = writeOp({ ...state, registers: regs, memory: mem }, address + 1, l);
  regs = w2.registers;
  mem = w2.memory;

  // Load memory values into A, L
  regs = setRegister(regs, RegisterId.A, memH);
  regs = setRegister(regs, RegisterId.L, memL);

  return result(state, {
    registers: regs,
    memory: mem,
    mctsUsed: 3,
  });
}

/** TS: Transfer to Storage. Store A in memory. Skip if overflow. */
export function execTS(state: CpuState, address: number): InstructionResult {
  const z = getRegister(state.registers, RegisterId.Z);
  const a = getRegister(state.registers, RegisterId.A);
  const corrected = overflowCorrect(a);
  const ov = overflow(a);

  const { registers: regs, memory: mem } = writeOp(state, address, corrected);
  let newRegs = regs;
  let nextZ = z;

  if (ov !== 'none') {
    // Overflow: skip next instruction, set A to +1 or -1
    nextZ = (z + 1) & ADDRESS12_MASK;
    newRegs = setRegister(newRegs, RegisterId.A, ov === 'positive' ? 1 : onesNegate(1));
  }

  return result(state, {
    registers: newRegs,
    memory: mem,
    nextZ,
    mctsUsed: 2,
  });
}

/** XCH: Exchange A and memory. */
export function execXCH(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const memVal = readOp(state, address);

  const { registers: regs, memory: mem } = writeOp(state, address, a);
  const newRegs = setRegister(regs, RegisterId.A, memVal);

  return result(state, {
    registers: newRegs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** AD: Add memory to A. */
export function execAD(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A);
  const memVal = readOp(state, address);
  const sum = onesAdd(a & WORD15_MASK, memVal);
  const regs = setRegister(state.registers, RegisterId.A, sum.value);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** MASK: Bitwise AND of A and memory. */
export function execMASK(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const memVal = readOp(state, address);
  const regs = setRegister(state.registers, RegisterId.A, a & memVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

// ─── Special Instructions ───────────────────────────────────────────────────

/** EXTEND: Set extracode flag for next instruction. */
export function execEXTEND(state: CpuState): InstructionResult {
  return result(state, {
    extracode: true,
    mctsUsed: 1,
  });
}

/** INHINT: Inhibit interrupts. */
export function execINHINT(state: CpuState): InstructionResult {
  return result(state, {
    inhibitInterrupt: true,
    mctsUsed: 1,
  });
}

/** RELINT: Release interrupts. */
export function execRELINT(state: CpuState): InstructionResult {
  return result(state, {
    inhibitInterrupt: false,
    mctsUsed: 1,
  });
}

/** NOOP: No operation. */
export function execNOOP(state: CpuState): InstructionResult {
  return result(state, {
    mctsUsed: 1,
  });
}

/** RESUME: Return from interrupt. Jump to address stored at ZRUPT (0o0042). */
export function execRESUME(state: CpuState): InstructionResult {
  const zruptAddr = 0o0042;
  const returnAddr = readOp(state, zruptAddr);

  return result(state, {
    nextZ: returnAddr & ADDRESS12_MASK,
    mctsUsed: 2,
  });
}

// ─── Extracode Instructions ─────────────────────────────────────────────────

/** READ: Load I/O channel value into A. */
export function execREAD(state: CpuState, channel: number): InstructionResult {
  const chVal = state.ioChannels.get(channel) ?? 0;
  const regs = setRegister(state.registers, RegisterId.A, chVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
    ioOp: { channel, value: chVal, type: 'read' },
  });
}

/** WRITE: Store A to I/O channel. */
export function execWRITE(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const newChannels = new Map(state.ioChannels);
  newChannels.set(channel, a);

  return result(state, {
    ioChannels: newChannels,
    mctsUsed: 2,
    ioOp: { channel, value: a, type: 'write' },
  });
}

/** RAND: Read channel AND A. */
export function execRAND(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const chVal = state.ioChannels.get(channel) ?? 0;
  const regs = setRegister(state.registers, RegisterId.A, a & chVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** WAND: Write A AND channel back to channel. */
export function execWAND(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const chVal = state.ioChannels.get(channel) ?? 0;
  const andVal = a & chVal;
  const newChannels = new Map(state.ioChannels);
  newChannels.set(channel, andVal);

  return result(state, {
    ioChannels: newChannels,
    mctsUsed: 2,
  });
}

/** ROR: Read channel OR A. */
export function execROR(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const chVal = state.ioChannels.get(channel) ?? 0;
  const regs = setRegister(state.registers, RegisterId.A, a | chVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** WOR: Write A OR channel back to channel. */
export function execWOR(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const chVal = state.ioChannels.get(channel) ?? 0;
  const orVal = a | chVal;
  const newChannels = new Map(state.ioChannels);
  newChannels.set(channel, orVal);

  return result(state, {
    ioChannels: newChannels,
    mctsUsed: 2,
  });
}

/** RXOR: Read channel XOR A. */
export function execRXOR(state: CpuState, channel: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const chVal = state.ioChannels.get(channel) ?? 0;
  const regs = setRegister(state.registers, RegisterId.A, a ^ chVal);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** DV: Divide (A,L) by memory. Quotient->A, Remainder->L. */
export function execDV(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const l = getRegister(state.registers, RegisterId.L);
  const divisor = readOp(state, address);

  const divResult = onesDivide(a, l, divisor);

  let regs = setRegister(state.registers, RegisterId.A, divResult.quotient);
  regs = setRegister(regs, RegisterId.L, divResult.remainder);

  return result(state, {
    registers: regs,
    mctsUsed: 6,
  });
}

/** BZF: Branch to fixed if A is zero. */
export function execBZF(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const z = getRegister(state.registers, RegisterId.Z);

  if (isZero(a)) {
    return result(state, {
      nextZ: address & ADDRESS12_MASK,
      mctsUsed: 1,
    });
  }

  return result(state, {
    nextZ: z,
    mctsUsed: 2,
  });
}

/** MSU: Modular Subtract. A = A - memory[addr]. */
export function execMSU(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const memVal = readOp(state, address);

  // MSU: A - mem, using ones' complement. If result underflows, add 2^15 (modular)
  const subResult = onesSub(a, memVal);
  const regs = setRegister(state.registers, RegisterId.A, subResult.value);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** QXCH: Exchange Q with memory. */
export function execQXCH(state: CpuState, address: number): InstructionResult {
  const qVal = getRegister(state.registers, RegisterId.Q);
  const memVal = readOp(state, address);

  const { registers: regs, memory: mem } = writeOp(state, address, qVal);
  const newRegs = setRegister(regs, RegisterId.Q, memVal);

  return result(state, {
    registers: newRegs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** AUG: Augment. If positive, increment. If negative, move away from zero. */
export function execAUG(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);

  let newVal: number;
  if (isNegative(memVal)) {
    // Negative: move away from zero (decrement in ones' complement = add -1)
    newVal = onesAdd(memVal, onesNegate(1)).value;
  } else {
    // Positive or zero: increment
    newVal = onesIncrement(memVal).value;
  }

  const { registers: regs, memory: mem } = writeOp(state, address, newVal);

  return result(state, {
    registers: regs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** DIM: Diminish. Move toward zero. */
export function execDIM(state: CpuState, address: number): InstructionResult {
  const memVal = readOp(state, address);
  const newVal = diminish(memVal);
  const { registers: regs, memory: mem } = writeOp(state, address, newVal);

  return result(state, {
    registers: regs,
    memory: mem,
    mctsUsed: 2,
  });
}

/** DCA: Double Clear and Add. A=mem[addr], L=mem[addr+1]. */
export function execDCA(state: CpuState, address: number): InstructionResult {
  const memH = readOp(state, address);
  const memL = readOp(state, address + 1);

  let regs = setRegister(state.registers, RegisterId.A, memH);
  regs = setRegister(regs, RegisterId.L, memL);

  return result(state, {
    registers: regs,
    mctsUsed: 3,
  });
}

/** DCS: Double Clear and Subtract. A=~mem[addr], L=~mem[addr+1]. */
export function execDCS(state: CpuState, address: number): InstructionResult {
  const memH = readOp(state, address);
  const memL = readOp(state, address + 1);

  let regs = setRegister(state.registers, RegisterId.A, onesNegate(memH));
  regs = setRegister(regs, RegisterId.L, onesNegate(memL));

  return result(state, {
    registers: regs,
    mctsUsed: 3,
  });
}

/** SU: Subtract. A = A - memory[addr]. */
export function execSU(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const memVal = readOp(state, address);
  const subResult = onesSub(a, memVal);
  const regs = setRegister(state.registers, RegisterId.A, subResult.value);

  return result(state, {
    registers: regs,
    mctsUsed: 2,
  });
}

/** BZMF: Branch if A is zero or negative. */
export function execBZMF(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const z = getRegister(state.registers, RegisterId.Z);

  if (isZero(a) || isNegative(a)) {
    return result(state, {
      nextZ: address & ADDRESS12_MASK,
      mctsUsed: 1,
    });
  }

  return result(state, {
    nextZ: z,
    mctsUsed: 2,
  });
}

/** MP: Multiply. (A,L) = A * memory[addr]. */
export function execMP(state: CpuState, address: number): InstructionResult {
  const a = getRegister(state.registers, RegisterId.A) & WORD15_MASK;
  const memVal = readOp(state, address);
  const product = onesMultiply(a, memVal);

  let regs = setRegister(state.registers, RegisterId.A, product.high);
  regs = setRegister(regs, RegisterId.L, product.low);

  return result(state, {
    registers: regs,
    mctsUsed: 3,
  });
}

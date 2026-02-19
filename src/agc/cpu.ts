/**
 * AGC Block II CPU -- fetch-decode-execute cycle.
 *
 * Ties together registers, memory, ALU, decoder, and instructions
 * into a functioning computer that can execute programs from fixed memory.
 *
 * Pure functional: step() returns new state, never mutates.
 */

import { RegisterId, ADDRESS12_MASK } from './types.js';
import { createRegisters, getRegister, setRegister } from './registers.js';
import { createMemory, readMemory } from './memory.js';
import { decode, applyIndex } from './decoder.js';
import type { DecodedInstruction } from './decoder.js';
import {
  type CpuState,
  type InstructionResult,
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
} from './instructions.js';

// Re-export CpuState for external consumers
export type { CpuState } from './instructions.js';

/** Result of a single CPU step. */
export interface StepResult {
  state: CpuState;
  mctsUsed: number;
  ioOp?: { channel: number; value: number; type: 'read' | 'write' };
}

/**
 * Create the initial CPU state.
 * Z = 0o4000 (start of FBANK-switched fixed memory).
 * All other registers zeroed.
 */
export function createCpuState(): CpuState {
  const regs = setRegister(createRegisters(), RegisterId.Z, 0o4000);
  return {
    registers: regs,
    memory: createMemory(),
    ioChannels: new Map(),
    extracode: false,
    indexValue: 0,
    inhibitInterrupt: false,
  };
}

/**
 * Execute a single CPU step: fetch, decode, execute.
 *
 * 1. FETCH instruction word from memory at Z
 * 2. Apply INDEX if active (add stored value to instruction word)
 * 3. DECODE instruction word (basic or extracode based on EXTEND flag)
 * 4. Advance Z to Z+1 (default next PC)
 * 5. EXECUTE the decoded instruction
 * 6. Return new state
 */
export function step(state: CpuState): StepResult {
  // 1. FETCH: read instruction word from memory at Z
  const z = getRegister(state.registers, RegisterId.Z);
  const ebank = getRegister(state.registers, RegisterId.EBANK);
  const fbank = getRegister(state.registers, RegisterId.FBANK);
  const superbank = state.memory.superbank;
  let instructionWord = readMemory(state.memory, z, ebank, fbank, superbank);

  // 2. Apply INDEX if active
  if (state.indexValue !== 0) {
    instructionWord = applyIndex(instructionWord, state.indexValue);
  }

  // 3. DECODE
  const decoded = decode(instructionWord, state.extracode);

  // 4. Advance Z to Z+1 (instructions that branch will override)
  const advancedZ = (z + 1) & ADDRESS12_MASK;
  const stateWithAdvancedZ: CpuState = {
    ...state,
    registers: setRegister(state.registers, RegisterId.Z, advancedZ),
    indexValue: 0, // consumed
  };

  // 5. EXECUTE
  const instrResult = dispatchInstruction(decoded, stateWithAdvancedZ);

  // 6. Build the new CPU state from instruction result
  const newRegisters = setRegister(instrResult.registers, RegisterId.Z, instrResult.nextZ);

  return {
    state: {
      registers: newRegisters,
      memory: instrResult.memory,
      ioChannels: instrResult.ioChannels,
      extracode: instrResult.extracode,
      indexValue: instrResult.indexValue,
      inhibitInterrupt: instrResult.inhibitInterrupt,
    },
    mctsUsed: instrResult.mctsUsed,
    ioOp: instrResult.ioOp,
  };
}

/** Dispatch decoded instruction to the appropriate executor. */
function dispatchInstruction(
  decoded: DecodedInstruction,
  state: CpuState,
): InstructionResult {
  switch (decoded.mnemonic) {
    // Basic instructions
    case 'TC': return execTC(state, decoded.address);
    case 'CCS': return execCCS(state, decoded.address);
    case 'TCF': return execTCF(state, decoded.address);
    case 'DAS': return execDAS(state, decoded.address);
    case 'LXCH': return execLXCH(state, decoded.address);
    case 'INCR': return execINCR(state, decoded.address);
    case 'ADS': return execADS(state, decoded.address);
    case 'CA': return execCA(state, decoded.address);
    case 'CS': return execCS(state, decoded.address);
    case 'INDEX': return execINDEX(state, decoded.address);
    case 'DXCH': return execDXCH(state, decoded.address);
    case 'TS': return execTS(state, decoded.address);
    case 'XCH': return execXCH(state, decoded.address);
    case 'AD': return execAD(state, decoded.address);
    case 'MASK': return execMASK(state, decoded.address);

    // Special instructions
    case 'EXTEND': return execEXTEND(state);
    case 'INHINT': return execINHINT(state);
    case 'RELINT': return execRELINT(state);
    case 'RESUME': return execRESUME(state);

    // Extracode instructions
    case 'READ': return execREAD(state, decoded.address);
    case 'WRITE': return execWRITE(state, decoded.address);
    case 'RAND': return execRAND(state, decoded.address);
    case 'WAND': return execWAND(state, decoded.address);
    case 'ROR': return execROR(state, decoded.address);
    case 'WOR': return execWOR(state, decoded.address);
    case 'RXOR': return execRXOR(state, decoded.address);
    case 'DV': return execDV(state, decoded.address);
    case 'BZF': return execBZF(state, decoded.address);
    case 'MSU': return execMSU(state, decoded.address);
    case 'QXCH': return execQXCH(state, decoded.address);
    case 'AUG': return execAUG(state, decoded.address);
    case 'DIM': return execDIM(state, decoded.address);
    case 'DCA': return execDCA(state, decoded.address);
    case 'DCS': return execDCS(state, decoded.address);
    case 'SU': return execSU(state, decoded.address);
    case 'BZMF': return execBZMF(state, decoded.address);
    case 'MP': return execMP(state, decoded.address);

    // NOOP and unknown
    default: return execNOOP(state);
  }
}

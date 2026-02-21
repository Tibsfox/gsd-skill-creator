/**
 * AGC Block II CPU -- fetch-decode-execute cycle.
 *
 * Ties together registers, memory, ALU, decoder, and instructions
 * into a functioning computer that can execute programs from fixed memory.
 *
 * Phase 214 additions: integrated stepAgc() wraps the inner step() with
 * interrupt checking, I/O channel routing, counter advancement, and timing.
 *
 * Pure functional: step() and stepAgc() return new state, never mutate.
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
import {
  type InterruptState,
  InterruptId,
  createInterruptState,
  isInterruptPending,
  serviceNextInterrupt,
  completeInterrupt,
  setInhibit,
  requestInterrupt,
} from './interrupts.js';
import {
  type IoChannelState,
  createIoChannelState,
  readChannel,
  writeChannel,
} from './io-channels.js';
import {
  type CounterState,
  createCounterState,
  tickCounters,
} from './counters.js';
import {
  type TimingState,
  createTimingState,
  advanceTiming,
} from './timing.js';

// Re-export CpuState for external consumers
export type { CpuState } from './instructions.js';

/** Result of a single inner CPU step. */
export interface StepResult {
  state: CpuState;
  mctsUsed: number;
  mnemonic: string;
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
 * 6. Return new state with mnemonic
 */
export function step(state: CpuState, ioChannelState?: IoChannelState): StepResult {
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

  // If this is a READ instruction and we have IoChannelState, pre-populate
  // the channel value so the instruction can read it.
  let cpuIoChannels: ReadonlyMap<number, number> = state.ioChannels;
  if (ioChannelState && (decoded.mnemonic === 'READ' || decoded.mnemonic === 'RAND' ||
      decoded.mnemonic === 'ROR' || decoded.mnemonic === 'RXOR' ||
      decoded.mnemonic === 'WAND' || decoded.mnemonic === 'WOR')) {
    const channelNum = decoded.address;
    const channelValue = readChannel(ioChannelState, channelNum);
    const mutableMap = new Map(cpuIoChannels);
    mutableMap.set(channelNum, channelValue);
    cpuIoChannels = mutableMap;
  }

  const stateWithAdvancedZ: CpuState = {
    ...state,
    registers: setRegister(state.registers, RegisterId.Z, advancedZ),
    indexValue: 0, // consumed
    ioChannels: cpuIoChannels,
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
    mnemonic: decoded.mnemonic,
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

// ─── Integrated AGC State (Phase 214) ────────────────────────────────────────

/** Complete AGC state including all subsystems. */
export interface AgcState {
  readonly cpu: CpuState;
  readonly interrupts: InterruptState;
  readonly ioChannels: IoChannelState;
  readonly counters: CounterState;
  readonly timing: TimingState;
}

/** Result of one complete AGC cycle via stepAgc. */
export interface AgcStepResult {
  readonly state: AgcState;
  readonly mctsUsed: number;
  readonly mnemonic: string;
  readonly interruptServiced?: InterruptId;
  readonly ioOps: readonly { channel: number; value: number; type: 'read' | 'write' }[];
}

/**
 * Create the initial full AGC state.
 * CPU starts at Z=0o4000. All subsystems at initial state.
 */
export function createAgcState(): AgcState {
  return {
    cpu: createCpuState(),
    interrupts: createInterruptState(),
    ioChannels: createIoChannelState(),
    counters: createCounterState(),
    timing: createTimingState(),
  };
}

/**
 * Execute one complete AGC cycle: interrupt check -> instruction execution ->
 * I/O routing -> counter advancement -> timing update.
 *
 * 1. Check for pending interrupts BEFORE fetching the next instruction
 * 2. If interrupt pending and not inhibited: service it (save Z/BB, jump to vector)
 * 3. Otherwise: fetch-decode-execute the next instruction
 * 4. If the instruction produced an I/O write: route it to the I/O channel state
 * 5. Handle INHINT/RELINT: sync interrupt inhibit state with CPU
 * 6. Handle RESUME: complete the interrupt
 * 7. Advance involuntary counters by MCTs consumed
 * 8. If counters overflowed: add interrupt requests
 * 9. Advance timing by MCTs consumed
 * 10. Return new complete state + step metadata
 */
export function stepAgc(state: AgcState): AgcStepResult {
  let { cpu, interrupts, ioChannels, counters, timing } = state;
  let mctsUsed = 0;
  let mnemonic = '';
  let interruptServiced: InterruptId | undefined;
  const ioOps: { channel: number; value: number; type: 'read' | 'write' }[] = [];

  // 1. CHECK FOR PENDING INTERRUPTS
  if (isInterruptPending(interrupts)) {
    const ruptResult = serviceNextInterrupt(interrupts, cpu.registers);
    if (ruptResult) {
      cpu = { ...cpu, registers: ruptResult.registers };
      interrupts = ruptResult.interruptState;
      interruptServiced = ruptResult.interruptId;
      mnemonic = 'RUPT';
      mctsUsed = 2; // RUPT entry takes approximately 2 MCTs
    }
  }

  // 2. If no interrupt was serviced, execute the next instruction
  if (!interruptServiced) {
    const stepResult = step(cpu, ioChannels);
    cpu = stepResult.state;
    mctsUsed = stepResult.mctsUsed;
    mnemonic = stepResult.mnemonic;

    // 3. ROUTE I/O OPERATIONS
    if (stepResult.ioOp) {
      ioOps.push(stepResult.ioOp);
      if (stepResult.ioOp.type === 'write') {
        ioChannels = writeChannel(
          ioChannels,
          stepResult.ioOp.channel,
          stepResult.ioOp.value,
          timing.totalMCTs,
        );
      }
    }

    // 4. Handle INHINT/RELINT: sync interrupt inhibit state with CPU
    if (cpu.inhibitInterrupt !== state.cpu.inhibitInterrupt) {
      interrupts = setInhibit(interrupts, cpu.inhibitInterrupt);
    }

    // 5. Handle RESUME: if the instruction was RESUME, complete the interrupt
    if (mnemonic === 'RESUME') {
      const resumeResult = completeInterrupt(interrupts, cpu.registers);
      cpu = { ...cpu, registers: resumeResult.registers };
      interrupts = resumeResult.interruptState;
    }
  }

  // 6. ADVANCE INVOLUNTARY COUNTERS
  const counterResult = tickCounters(counters, mctsUsed);
  counters = counterResult.counterState;

  // 7. If counters triggered interrupts, request them
  for (const intId of counterResult.interruptRequests) {
    interrupts = requestInterrupt(interrupts, intId);
  }

  // 8. ADVANCE TIMING
  timing = advanceTiming(timing, mctsUsed);

  return {
    state: { cpu, interrupts, ioChannels, counters, timing },
    mctsUsed,
    mnemonic,
    interruptServiced,
    ioOps,
  };
}

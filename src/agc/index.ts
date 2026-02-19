/**
 * AGC Block II simulator -- barrel index.
 *
 * Re-exports all public types and functions from the AGC module.
 * Covers Phase 213 (CPU & Memory), Phase 214 (Interrupts & Timing),
 * and Phase 216 (Executive, Waitlist, Restart Protection).
 * Downstream phases (217 DSKY, 218 Executive Monitor) import from here.
 */

// Types
export type { Word15, Word16, Address12, OctalDigit } from './types.js';
export {
  WORD15_MASK,
  WORD16_MASK,
  ADDRESS12_MASK,
  EBANK_MASK,
  FBANK_MASK,
  REGISTER_MASKS,
  RegisterId,
  toWord15,
  toWord16,
  toAddress12,
} from './types.js';

// Registers
export type { AgcRegisters } from './registers.js';
export { createRegisters, getRegister, setRegister } from './registers.js';

// Memory
export type { AgcMemory, ResolvedAddress } from './memory.js';
export { createMemory, readMemory, writeMemory, loadFixed, resolveAddress } from './memory.js';

// ALU
export type { ArithResult, DoubleWord, DivResult, DoubleAddResult } from './alu.js';
export {
  onesAdd,
  onesSub,
  onesNegate,
  onesAbs,
  onesComplement,
  onesIncrement,
  onesDecrement,
  diminish,
  onesMultiply,
  onesDivide,
  onesDoubleAdd,
  overflow,
  overflowCorrect,
  isNegative,
  isPositiveZero,
  isNegativeZero,
  isZero,
} from './alu.js';

// Decoder
export type { DecodedInstruction } from './decoder.js';
export { decode, applyIndex } from './decoder.js';

// Instructions
export type { InstructionResult } from './instructions.js';
export {
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
} from './instructions.js';

// CPU (Phase 213 inner step + Phase 214 integrated step)
export type { CpuState, StepResult, AgcState, AgcStepResult } from './cpu.js';
export { createCpuState, step, createAgcState, stepAgc } from './cpu.js';

// Interrupts (Phase 214)
export type { InterruptState, ServiceResult, CompleteResult } from './interrupts.js';
export {
  InterruptId,
  INTERRUPT_VECTORS,
  getVectorAddress,
  createInterruptState,
  requestInterrupt,
  clearInterrupt,
  isInterruptPending,
  getHighestPriorityPending,
  serviceNextInterrupt,
  completeInterrupt,
  setInhibit,
} from './interrupts.js';

// Counters (Phase 214)
export type { CounterState, IncrementResult, TickResult } from './counters.js';
export {
  CounterId,
  COUNTER_ADDRESSES,
  COUNTER_INTERRUPTS,
  createCounterState,
  incrementCounter,
  tickCounters,
  getCounterValue,
  setCounterValue,
  setTime6Enable,
  pulseCounter,
} from './counters.js';

// I/O Channels (Phase 214)
export type { IoChannelState, IoWriteEntry, BitwiseResult } from './io-channels.js';
export {
  createIoChannelState,
  readChannel,
  writeChannel,
  readAnd,
  writeAnd,
  readOr,
  writeOr,
  readXor,
  ChannelGroup,
  getChannelGroup,
  configureDsky,
  configureImu,
  configureRadar,
  getDownlinkLog,
} from './io-channels.js';

// Timing (Phase 214)
export type { TimingState } from './timing.js';
export {
  CLOCK_MHZ,
  MCT_PERIOD_US,
  INSTRUCTION_MCTS,
  getInstructionMCTs,
  createTimingState,
  advanceTiming,
  mctsToMicroseconds,
  mctsToMilliseconds,
  mctsToSeconds,
  secondsToMCTs,
} from './timing.js';

// Executive (Phase 216)
export type { ExecutiveState, CoreSet } from './executive.js';
export {
  JobState,
  createExecutiveState,
  novac,
  findvac,
  endofjob,
  scheduleNext,
  changePriority,
  jobSleep,
  jobWake,
  saveContext,
  restoreContext,
  CORE_SET_COUNT,
  MAX_PRIORITY,
  VAC_AREA_COUNT,
  VAC_AREA_SIZE,
  ALARM_1202,
  ALARM_1201,
} from './executive.js';

// Waitlist (Phase 216)
export type { WaitlistState, WaitlistEntry, DispatchResult } from './waitlist.js';
export {
  createWaitlistState,
  addWaitlistEntry,
  advanceWaitlistTime,
  dispatchWaitlist,
  cancelWaitlistEntry,
  getNextFireTime,
  getActiveEntryCount,
  MAX_WAITLIST_ENTRIES,
  ALARM_1203,
} from './waitlist.js';

// Restart Protection (Phase 216)
export type { RestartState, RestartPoint, BailoutResult } from './restart.js';
export {
  RestartGroup,
  RESTART_GROUP,
  createRestartState,
  registerRestartPoint,
  getRestartGroup,
  getRestartTable,
  bailout,
} from './restart.js';

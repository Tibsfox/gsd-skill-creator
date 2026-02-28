/**
 * AGC Curriculum program runner.
 *
 * Provides a simplified assembler for curriculum programs and a runner that
 * executes assembled programs on the AGC simulator. The assembler handles
 * the subset of AGC assembly syntax used by the 8 curriculum starter programs:
 * basic instructions, labels, SETLOC, OCT, DEC, BANK, ERASE, EQUALS.
 *
 * Phase 221 -- AGC Curriculum & Exercises.
 */

import type { Word15, AgcState, AgcStepResult } from '../index.js';
import { WORD15_MASK, RegisterId, getRegister, createAgcState, stepAgc, loadFixed } from '../index.js';

// ─── Assembler Types ─────────────────────────────────────────────────────────

/** A single I/O operation captured during program execution. */
export interface IoEntry {
  readonly step: number;
  readonly channel: number;
  readonly value: number;
  readonly type: 'read' | 'write';
}

/** Options for running an assembled program. */
export interface RunOpts {
  readonly maxSteps?: number;
}

/** Result of running a program on the simulator. */
export interface RunResult {
  readonly steps: number;
  readonly finalState: AgcState;
  readonly ioLog: readonly IoEntry[];
  readonly alarms: readonly number[];
  readonly halted: boolean;
  readonly haltReason: string;
}

// ─── Instruction Encoding ────────────────────────────────────────────────────

/**
 * Mnemonic-to-encoding table for Block II instructions.
 *
 * Basic instructions: opcode in bits 14-12, address in bits 11-0.
 * Quarter-code instructions (opcodes 2 and 5): QC in bits 11-10, addr in bits 9-0.
 * Extracode instructions: preceded by EXTEND (opcode 0, address 6).
 * I/O instructions: subcode in bits 11-9, channel in bits 8-0.
 */

interface InstrEncoding {
  readonly opcode: number;
  readonly isExtracode: boolean;
  readonly isQuarterCode?: boolean;
  readonly quarterCode?: number;
  readonly isIo?: boolean;
  readonly ioSubcode?: number;
}

const INSTRUCTION_TABLE: Readonly<Record<string, InstrEncoding>> = {
  // Basic instructions
  TC:     { opcode: 0, isExtracode: false },
  CCS:    { opcode: 1, isExtracode: false },  // erasable address
  TCF:    { opcode: 1, isExtracode: false },  // fixed address
  DAS:    { opcode: 2, isExtracode: false, isQuarterCode: true, quarterCode: 0 },
  LXCH:   { opcode: 2, isExtracode: false, isQuarterCode: true, quarterCode: 1 },
  INCR:   { opcode: 2, isExtracode: false, isQuarterCode: true, quarterCode: 2 },
  ADS:    { opcode: 2, isExtracode: false, isQuarterCode: true, quarterCode: 3 },
  CA:     { opcode: 3, isExtracode: false },
  CS:     { opcode: 4, isExtracode: false },
  INDEX:  { opcode: 5, isExtracode: false },  // uses full 12-bit address, QC=0
  DXCH:   { opcode: 5, isExtracode: false, isQuarterCode: true, quarterCode: 1 },
  TS:     { opcode: 5, isExtracode: false, isQuarterCode: true, quarterCode: 2 },
  XCH:    { opcode: 5, isExtracode: false, isQuarterCode: true, quarterCode: 3 },
  AD:     { opcode: 6, isExtracode: false },
  MASK:   { opcode: 7, isExtracode: false },

  // Special instructions (TC with special addresses)
  EXTEND:  { opcode: 0, isExtracode: false },  // TC 6
  INHINT:  { opcode: 0, isExtracode: false },  // TC 4
  RELINT:  { opcode: 0, isExtracode: false },  // TC 3
  RESUME:  { opcode: 5, isExtracode: false },  // INDEX 17

  // Extracode instructions
  READ:   { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 0 },
  WRITE:  { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 1 },
  RAND:   { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 2 },
  WAND:   { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 3 },
  ROR:    { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 4 },
  WOR:    { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 5 },
  RXOR:   { opcode: 0, isExtracode: true, isIo: true, ioSubcode: 6 },
  DV:     { opcode: 1, isExtracode: true },  // erasable address
  BZF:    { opcode: 1, isExtracode: true },  // fixed address
  MSU:    { opcode: 2, isExtracode: true, isQuarterCode: true, quarterCode: 0 },
  QXCH:   { opcode: 2, isExtracode: true, isQuarterCode: true, quarterCode: 1 },
  AUG:    { opcode: 2, isExtracode: true, isQuarterCode: true, quarterCode: 2 },
  DIM:    { opcode: 2, isExtracode: true, isQuarterCode: true, quarterCode: 3 },
  DCA:    { opcode: 3, isExtracode: true },
  DCS:    { opcode: 4, isExtracode: true },
  SU:     { opcode: 6, isExtracode: true },  // erasable address
  BZMF:   { opcode: 6, isExtracode: true },  // fixed address
  MP:     { opcode: 7, isExtracode: true },
};

// ─── Assembler ───────────────────────────────────────────────────────────────

/**
 * Assemble AGC assembly source text into a flat array of 15-bit words.
 *
 * Supported syntax:
 * - Labels (word at start of line, followed by instructions)
 * - Instructions: all 38 Block II mnemonics
 * - Directives: SETLOC, OCT, DEC, ERASE, EQUALS, BANK
 * - Comments: # or ; to end of line
 *
 * Returns a sparse Word15 array indexed by address. Addresses without
 * content are 0.
 */
export function assembleProgramSource(source: string): Word15[] {
  const lines = source.split('\n');
  const symbolTable = new Map<string, number>();
  const erasableCounter = { value: 0o0100 }; // Start ERASE allocations in unswitched erasable
  let locationCounter = 0o4000; // Default start in fixed-fixed
  const maxAddr = 0o10000; // 12-bit address space
  const words: Word15[] = new Array(maxAddr).fill(0);

  // Built-in register symbols (Block II AGC register addresses)
  symbolTable.set('A',    0o0);
  symbolTable.set('L',    0o1);
  symbolTable.set('Q',    0o2);
  symbolTable.set('EB',   0o3);
  symbolTable.set('FB',   0o4);
  symbolTable.set('Z',    0o5);
  symbolTable.set('BB',   0o6);
  symbolTable.set('ZERO', 0o7);

  // Track which addresses need the EXTEND prefix
  const needsExtend = new Set<number>();

  // Parsed instructions awaiting label resolution
  interface PendingInstruction {
    address: number;
    mnemonic: string;
    operand: string;
    line: number;
  }
  const pending: PendingInstruction[] = [];

  // ─── Pass 1: collect labels, SETLOC, ERASE, EQUALS, OCT, DEC ──────────

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    let line = lines[lineNum];

    // Strip comments (# or ;)
    const commentIdx = Math.min(
      line.indexOf('#') >= 0 ? line.indexOf('#') : Infinity,
      line.indexOf(';') >= 0 ? line.indexOf(';') : Infinity,
    );
    if (commentIdx < Infinity) {
      line = line.substring(0, commentIdx);
    }
    line = line.trimEnd();
    if (line.trim() === '') continue;

    // Tokenize
    const tokens = line.trim().split(/\s+/);
    if (tokens.length === 0) continue;

    // Check if first token is a label (not a known mnemonic or directive)
    const firstToken = tokens[0].toUpperCase();
    const isLabelLine = !isKnownToken(firstToken) && tokens.length >= 1;

    let label: string | undefined;
    let mnemonic: string;
    let operand: string | undefined;

    if (isLabelLine) {
      label = tokens[0].toUpperCase();
      mnemonic = tokens.length > 1 ? tokens[1].toUpperCase() : '';
      operand = tokens.length > 2 ? tokens.slice(2).join(' ').toUpperCase() : undefined;
    } else {
      mnemonic = firstToken;
      operand = tokens.length > 1 ? tokens.slice(1).join(' ').toUpperCase() : undefined;
    }

    // Handle directives
    if (mnemonic === 'SETLOC') {
      const val = parseNumeric(operand ?? '0');
      locationCounter = val;
      if (label) symbolTable.set(label, locationCounter);
      continue;
    }

    if (mnemonic === 'BANK') {
      const bankNum = parseNumeric(operand ?? '0');
      locationCounter = 0o4000 + bankNum * 0o2000;
      if (label) symbolTable.set(label, locationCounter);
      continue;
    }

    if (mnemonic === 'ERASE') {
      if (label) {
        symbolTable.set(label, erasableCounter.value);
      }
      erasableCounter.value++;
      continue;
    }

    if (mnemonic === 'EQUALS') {
      if (label && operand !== undefined) {
        symbolTable.set(label, parseNumeric(operand));
      }
      continue;
    }

    if (mnemonic === 'OCT') {
      if (label) symbolTable.set(label, locationCounter);
      const val = parseInt(operand ?? '0', 8) & WORD15_MASK;
      words[locationCounter] = val;
      locationCounter++;
      continue;
    }

    if (mnemonic === 'DEC') {
      if (label) symbolTable.set(label, locationCounter);
      const val = parseDec(operand ?? '0');
      words[locationCounter] = val;
      locationCounter++;
      continue;
    }

    // For empty mnemonics (label-only lines), register label at current location
    if (mnemonic === '') {
      if (label) symbolTable.set(label, locationCounter);
      continue;
    }

    // Instruction: register label and queue for pass 2
    if (label) symbolTable.set(label, locationCounter);

    // Handle EXTEND: it occupies one word itself
    if (mnemonic === 'EXTEND') {
      words[locationCounter] = encodeSpecial('EXTEND');
      locationCounter++;
      continue;
    }

    if (mnemonic === 'INHINT') {
      words[locationCounter] = encodeSpecial('INHINT');
      locationCounter++;
      continue;
    }

    if (mnemonic === 'RELINT') {
      words[locationCounter] = encodeSpecial('RELINT');
      locationCounter++;
      continue;
    }

    if (mnemonic === 'RESUME') {
      words[locationCounter] = encodeSpecial('RESUME');
      locationCounter++;
      continue;
    }

    // Verify mnemonic is known
    const encoding = INSTRUCTION_TABLE[mnemonic];
    if (!encoding) {
      throw new Error(`Unknown mnemonic '${mnemonic}' at line ${lineNum + 1}`);
    }

    // NOTE: EXTEND must be written explicitly by the programmer before
    // extracode instructions. The assembler does NOT auto-insert EXTEND.
    // This matches real AGC assembly syntax.

    pending.push({
      address: locationCounter,
      mnemonic,
      operand: operand ?? '',
      line: lineNum + 1,
    });
    locationCounter++;
  }

  // ─── Pass 2: resolve labels and encode instructions ────────────────────

  for (const instr of pending) {
    const encoding = INSTRUCTION_TABLE[instr.mnemonic];
    if (!encoding) {
      throw new Error(`Unknown mnemonic '${instr.mnemonic}' at line ${instr.line}`);
    }

    // Resolve operand to address
    let address = resolveOperand(instr.operand, symbolTable, instr.line);

    // Encode the instruction word
    let word: number;

    if (encoding.isIo) {
      // I/O instructions: subcode in bits 11-9, channel in bits 8-0
      const subcode = encoding.ioSubcode ?? 0;
      word = (subcode << 9) | (address & 0o777);
    } else if (encoding.isQuarterCode) {
      // Quarter-code: opcode in bits 14-12, QC in bits 11-10, addr in bits 9-0
      const qc = encoding.quarterCode ?? 0;
      word = (encoding.opcode << 12) | (qc << 10) | (address & 0o1777);
    } else {
      // Standard: opcode in bits 14-12, address in bits 11-0
      word = (encoding.opcode << 12) | (address & 0o7777);
    }

    words[instr.address] = word & WORD15_MASK;
  }

  return words;
}

// ─── Assembler Helpers ───────────────────────────────────────────────────────

/** Known mnemonics and directives. */
function isKnownToken(token: string): boolean {
  return token in INSTRUCTION_TABLE ||
    ['SETLOC', 'BANK', 'OCT', 'DEC', 'ERASE', 'EQUALS', 'EXTEND', 'INHINT', 'RELINT', 'RESUME'].includes(token);
}

/** Parse a numeric literal (octal if starts with 0 or has no prefix, decimal with DEC). */
function parseNumeric(s: string): number {
  const trimmed = s.trim();
  if (trimmed === '') return 0;
  // Try octal
  return parseInt(trimmed, 8);
}

/** Parse a decimal value into ones' complement 15-bit word. */
function parseDec(s: string): Word15 {
  const trimmed = s.trim();
  const val = parseInt(trimmed, 10);
  if (val < 0) {
    // Ones' complement negative: invert all 15 bits
    return (~(-val) & WORD15_MASK);
  }
  return val & WORD15_MASK;
}

/** Encode special instructions that have fixed encodings. */
function encodeSpecial(mnemonic: string): Word15 {
  switch (mnemonic) {
    case 'EXTEND': return (0 << 12) | 0o6;    // TC 6
    case 'INHINT': return (0 << 12) | 0o4;    // TC 4
    case 'RELINT': return (0 << 12) | 0o3;    // TC 3
    case 'RESUME': return (5 << 12) | 0o17;   // INDEX 17
    default: return 0;
  }
}

/** Resolve an operand string to a numeric address. */
function resolveOperand(
  operand: string,
  symbolTable: Map<string, number>,
  line: number,
): number {
  const trimmed = operand.trim();
  if (trimmed === '') return 0;

  // Try symbol lookup first
  const sym = symbolTable.get(trimmed);
  if (sym !== undefined) return sym;

  // Try numeric parsing (octal)
  const parsed = parseInt(trimmed, 8);
  if (!isNaN(parsed)) return parsed;

  throw new Error(`Unresolved symbol '${trimmed}' at line ${line}`);
}

// ─── Program Runner ──────────────────────────────────────────────────────────

/**
 * Load an assembled program into an AGC state and run it.
 *
 * Creates a fresh AGC via createAgcState(), loads the program into fixed memory
 * using loadFixed(), then steps the CPU until a halt condition is reached.
 *
 * Halt conditions:
 * - TC to self (busy loop detected: Z does not change after a step)
 * - maxSteps exceeded
 *
 * @param program Flat Word15 array from assembleProgramSource()
 * @param opts Run options (maxSteps defaults to 10000)
 * @returns RunResult with final state, I/O log, alarms, and halt info
 */
export function runProgram(program: Word15[], opts?: RunOpts): RunResult {
  const maxSteps = opts?.maxSteps ?? 10000;
  let state = createAgcState();

  // Load program into fixed memory banks.
  //
  // The program array is indexed by 12-bit flat address (0-0o7777).
  // The AGC memory model maps these addresses to banks:
  //   0o2000-0o2777 -> fixed bank 2 (always visible)
  //   0o3000-0o3777 -> fixed bank 3 (always visible)
  //   0o4000-0o7777 -> FBANK-switched (1024-word window, FBANK selects bank)
  //
  // Curriculum programs use SETLOC 4000, meaning bank 0 (FBANK=0 default).
  // We load each 1024-word slice that has data into the corresponding bank.
  const BANK_SIZE = 1024;

  // Fixed-fixed banks 2 and 3 (addresses 0o2000-0o3777)
  for (const bank of [2, 3]) {
    const base = bank * BANK_SIZE; // 0o2000 or 0o3000
    const data: number[] = [];
    let hasData = false;
    for (let i = 0; i < BANK_SIZE; i++) {
      const val = program[base + i] ?? 0;
      data.push(val);
      if (val !== 0) hasData = true;
    }
    if (hasData) {
      state = { ...state, cpu: { ...state.cpu, memory: loadFixed(state.cpu.memory, bank, data) } };
    }
  }

  // FBANK-switched bank 0 (addresses 0o4000-0o4777 in program array -> bank 0)
  // Curriculum programs all use SETLOC 4000, so only bank 0 is needed.
  // We also support up to bank 3 for larger programs using addresses up to 0o7777.
  for (let bank = 0; bank < 4; bank++) {
    const programBase = 0o4000 + bank * BANK_SIZE;
    const data: number[] = [];
    let hasData = false;
    for (let i = 0; i < BANK_SIZE; i++) {
      const addr = programBase + i;
      const val = addr < program.length ? (program[addr] ?? 0) : 0;
      data.push(val);
      if (val !== 0) hasData = true;
    }
    if (hasData) {
      state = { ...state, cpu: { ...state.cpu, memory: loadFixed(state.cpu.memory, bank, data) } };
    }
  }

  // Also load erasable data (ERASE/DEC/OCT values in erasable address range)
  // Erasable range: 0o0020-0o1777
  for (let addr = 0o0020; addr <= 0o1777; addr++) {
    if (program[addr] !== undefined && program[addr] !== 0) {
      const newErasable = new Uint16Array(state.cpu.memory.erasable);
      newErasable[addr] = program[addr] & WORD15_MASK;
      state = {
        ...state,
        cpu: {
          ...state.cpu,
          memory: {
            ...state.cpu.memory,
            erasable: newErasable,
          },
        },
      };
    }
  }

  // Run the program
  const ioLog: IoEntry[] = [];
  const alarms: number[] = [];
  let steps = 0;
  let halted = false;
  let haltReason = '';

  while (steps < maxSteps) {
    // Get current Z before stepping
    const prevZ = getZ(state);

    let result: AgcStepResult;
    try {
      result = stepAgc(state);
    } catch (err) {
      halted = true;
      haltReason = `error: ${err instanceof Error ? err.message : String(err)}`;
      break;
    }

    state = result.state;
    steps++;

    // Log I/O operations
    for (const op of result.ioOps) {
      ioLog.push({
        step: steps,
        channel: op.channel,
        value: op.value,
        type: op.type,
      });
    }

    // Check halt: TC to self (Z unchanged and not a special instruction)
    const currentZ = getZ(state);
    if (currentZ === prevZ && result.mnemonic === 'TC') {
      halted = true;
      haltReason = 'TC to self (busy loop)';
      break;
    }
  }

  if (!halted && steps >= maxSteps) {
    halted = true;
    haltReason = `maxSteps exceeded (${maxSteps})`;
  }

  return {
    steps,
    finalState: state,
    ioLog,
    alarms,
    halted,
    haltReason,
  };
}

/** Extract Z (program counter) from AGC state. */
function getZ(state: AgcState): number {
  return getRegister(state.cpu.registers, RegisterId.Z);
}

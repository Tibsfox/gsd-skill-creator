/**
 * AGC Block II assembler.
 *
 * Two-pass assembler for yaYUL-format AGC assembly source.
 * Pass 1: collect symbols and assign addresses.
 * Pass 2: generate 15-bit instruction words.
 *
 * Supports all 38 Block II instructions, bank directives,
 * label resolution with forward references, and pseudo-ops.
 */

import { WORD15_MASK } from '../types.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/** An error encountered during assembly. */
export interface AssemblerError {
  line: number;
  message: string;
  source: string;
}

/** A single assembled word with metadata. */
export interface AssembledWord {
  address: number;
  bank: number;
  offset: number;
  word: number;
  source: string;
  label?: string;
}

/** Complete assembly result. */
export interface AssemblerResult {
  words: AssembledWord[];
  labels: ReadonlyMap<string, number>;
  errors: AssemblerError[];
  banks: ReadonlyMap<number, Uint16Array>;
}

// ─── Register Names ────────────────────────────────────────────────────────

const REGISTER_MAP: Record<string, number> = {
  A: 0, L: 1, Q: 2, Z: 3,
  EBANK: 4, FBANK: 5, BB: 6,
  ZRUPT: 7, BRUPT: 8,
  CYR: 9, SR: 10, CYL: 11, EDOP: 12,
};

// ─── Mnemonic Encoding Tables ──────────────────────────────────────────────

interface Encoding {
  opcode: number;
  quarterCode?: number;
  isExtracode: boolean;
  isIO?: boolean;
  subcode?: number;
  addressType?: 'erasable' | 'fixed' | 'any';
}

const BASIC_ENCODINGS: Record<string, Encoding> = {
  TC:    { opcode: 0, isExtracode: false },
  CCS:   { opcode: 1, isExtracode: false, addressType: 'erasable' },
  TCF:   { opcode: 1, isExtracode: false, addressType: 'fixed' },
  DAS:   { opcode: 2, quarterCode: 0, isExtracode: false },
  LXCH:  { opcode: 2, quarterCode: 1, isExtracode: false },
  INCR:  { opcode: 2, quarterCode: 2, isExtracode: false },
  ADS:   { opcode: 2, quarterCode: 3, isExtracode: false },
  CA:    { opcode: 3, isExtracode: false },
  CS:    { opcode: 4, isExtracode: false },
  INDEX: { opcode: 5, quarterCode: 0, isExtracode: false },
  DXCH:  { opcode: 5, quarterCode: 1, isExtracode: false },
  TS:    { opcode: 5, quarterCode: 2, isExtracode: false },
  XCH:   { opcode: 5, quarterCode: 3, isExtracode: false },
  AD:    { opcode: 6, isExtracode: false },
  MASK:  { opcode: 7, isExtracode: false },
};

const EXTRACODE_ENCODINGS: Record<string, Encoding> = {
  READ:  { opcode: 0, isExtracode: true, isIO: true, subcode: 0 },
  WRITE: { opcode: 0, isExtracode: true, isIO: true, subcode: 1 },
  RAND:  { opcode: 0, isExtracode: true, isIO: true, subcode: 2 },
  WAND:  { opcode: 0, isExtracode: true, isIO: true, subcode: 3 },
  ROR:   { opcode: 0, isExtracode: true, isIO: true, subcode: 4 },
  WOR:   { opcode: 0, isExtracode: true, isIO: true, subcode: 5 },
  RXOR:  { opcode: 0, isExtracode: true, isIO: true, subcode: 6 },
  DV:    { opcode: 1, isExtracode: true, addressType: 'erasable' },
  BZF:   { opcode: 1, isExtracode: true, addressType: 'fixed' },
  MSU:   { opcode: 2, quarterCode: 0, isExtracode: true },
  QXCH:  { opcode: 2, quarterCode: 1, isExtracode: true },
  AUG:   { opcode: 2, quarterCode: 2, isExtracode: true },
  DIM:   { opcode: 2, quarterCode: 3, isExtracode: true },
  DCA:   { opcode: 3, isExtracode: true },
  DCS:   { opcode: 4, isExtracode: true },
  SU:    { opcode: 6, isExtracode: true, addressType: 'erasable' },
  BZMF:  { opcode: 6, isExtracode: true, addressType: 'fixed' },
  MP:    { opcode: 7, isExtracode: true },
};

/** Special pseudo-instructions that map to fixed words. */
const SPECIAL_WORDS: Record<string, number> = {
  INHINT:  0o00004,
  RELINT:  0o00003,
  EXTEND:  0o00006,
  RESUME:  0o50017,
  NOOP:    0o30000, // CA A
};

/** Directives that do NOT produce code words. */
const DIRECTIVES = new Set([
  'SETLOC', 'BANK', 'EBANK=', 'FBANK=', 'EQUALS', '=', 'ERASE', 'BLOCK',
]);

/** Directives that produce data words. */
const DATA_DIRECTIVES = new Set(['OCT', 'DEC', '2DEC', 'CADR', 'ADRES']);

// ─── Parsing ───────────────────────────────────────────────────────────────

interface ParsedLine {
  label?: string;
  opcode?: string;
  operand?: string;
  comment?: string;
  raw: string;
}

function parseLine(line: string): ParsedLine {
  const raw = line;

  // Strip comments
  const commentIdx = line.indexOf('#');
  let comment: string | undefined;
  if (commentIdx >= 0) {
    comment = line.slice(commentIdx + 1).trim();
    line = line.slice(0, commentIdx);
  }

  line = line.trimEnd();
  if (line.length === 0) {
    return { raw, comment };
  }

  let label: string | undefined;
  let opcode: string | undefined;
  let operand: string | undefined;

  // If line starts with non-whitespace, the first token is a label
  if (line.length > 0 && line[0] !== ' ' && line[0] !== '\t') {
    const tokens = line.trim().split(/\s+/);
    label = tokens[0];
    opcode = tokens[1];
    operand = tokens.slice(2).join(' ').trim() || undefined;
  } else {
    const tokens = line.trim().split(/\s+/);
    opcode = tokens[0];
    operand = tokens.slice(1).join(' ').trim() || undefined;
  }

  return { label, opcode, operand, comment, raw };
}

/**
 * Resolve an operand to a numeric value.
 * Supports: register names, octal literals (leading 0), decimal literals, labels.
 */
function resolveOperand(
  operand: string,
  symbols: ReadonlyMap<string, number>,
): number | undefined {
  if (operand === undefined || operand === '') return undefined;

  // Register names
  if (REGISTER_MAP[operand] !== undefined) {
    return REGISTER_MAP[operand];
  }

  // Numeric literals
  const numStr = operand.trim();

  // Octal: starts with 0 and has no non-octal digits (but not just "0")
  if (/^0[0-7]+$/.test(numStr)) {
    return parseInt(numStr, 8);
  }

  // Plain decimal (including just "0")
  if (/^-?\d+$/.test(numStr)) {
    return parseInt(numStr, 10);
  }

  // Label reference
  return symbols.get(operand);
}

// ─── Encoding ──────────────────────────────────────────────────────────────

function encodeInstruction(
  encoding: Encoding,
  address: number,
): number {
  const { opcode, quarterCode, isIO, subcode } = encoding;

  if (isIO && subcode !== undefined) {
    // I/O: (opcode << 12) | (subcode << 9) | (channel & 0o777)
    return ((opcode << 12) | (subcode << 9) | (address & 0o777)) & WORD15_MASK;
  }

  if (quarterCode !== undefined) {
    // Quarter-code: (opcode << 12) | (qc << 10) | (address & 0o1777)
    return ((opcode << 12) | (quarterCode << 10) | (address & 0o1777)) & WORD15_MASK;
  }

  // Standard: (opcode << 12) | (address & 0o7777)
  return ((opcode << 12) | (address & 0o7777)) & WORD15_MASK;
}

// ─── Address/Bank Helpers ──────────────────────────────────────────────────

function addressToBank(address: number): number {
  return Math.floor(address / 1024);
}

function addressToOffset(address: number): number {
  return address % 1024;
}

// ─── Two-Pass Assembly ─────────────────────────────────────────────────────

/**
 * Assemble yaYUL-format AGC assembly source into binary words.
 */
export function assemble(source: string): AssemblerResult {
  const lines = source.split('\n');
  const errors: AssemblerError[] = [];
  const symbols = new Map<string, number>();
  const words: AssembledWord[] = [];

  // ─── Pass 1: Symbol Collection ─────────────────────────────────────────

  let locCounter = 0o4000; // Default start at FBANK-switched fixed
  let currentBank = 0;
  let _ebank = 0;
  let _fbank = 0;

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (!parsed.opcode) {
      // Label on empty line or pure comment
      if (parsed.label) {
        symbols.set(parsed.label, locCounter);
      }
      continue;
    }

    const { label, opcode, operand } = parsed;

    // Handle directives
    if (opcode === 'SETLOC') {
      if (operand) {
        const addr = resolveOperand(operand, symbols);
        if (addr !== undefined) {
          locCounter = addr;
          currentBank = addressToBank(locCounter);
        }
      }
      if (label) symbols.set(label, locCounter);
      continue;
    }

    if (opcode === 'BANK') {
      if (operand) {
        const bankNum = resolveOperand(operand, symbols);
        if (bankNum !== undefined) {
          currentBank = bankNum;
          locCounter = bankNum * 1024;
        }
      }
      if (label) symbols.set(label, locCounter);
      continue;
    }

    if (opcode === 'EBANK=') {
      if (operand) {
        const val = resolveOperand(operand, symbols);
        if (val !== undefined) _ebank = val & 0o7;
      }
      if (label) symbols.set(label, locCounter);
      continue;
    }

    if (opcode === 'FBANK=') {
      if (operand) {
        const val = resolveOperand(operand, symbols);
        if (val !== undefined) _fbank = val & 0o37;
      }
      if (label) symbols.set(label, locCounter);
      continue;
    }

    if (opcode === 'EQUALS' || opcode === '=') {
      if (label && operand) {
        const val = resolveOperand(operand, symbols);
        if (val !== undefined) {
          symbols.set(label, val);
        }
      }
      continue;
    }

    if (opcode === 'ERASE') {
      if (label) symbols.set(label, locCounter);
      const count = operand ? (resolveOperand(operand, symbols) ?? 1) : 1;
      locCounter += count;
      continue;
    }

    if (opcode === 'BLOCK') {
      if (operand) {
        const blockNum = resolveOperand(operand, symbols);
        if (blockNum !== undefined) {
          currentBank = blockNum;
          locCounter = blockNum * 1024;
        }
      }
      if (label) symbols.set(label, locCounter);
      continue;
    }

    // Data directives occupy word(s)
    if (DATA_DIRECTIVES.has(opcode)) {
      if (label) symbols.set(label, locCounter);
      if (opcode === '2DEC') {
        locCounter += 2;
      } else {
        locCounter += 1;
      }
      continue;
    }

    // Regular instruction or special
    if (label) symbols.set(label, locCounter);

    // Extracode instructions auto-inject EXTEND (occupies 1 word)
    if (EXTRACODE_ENCODINGS[opcode]) {
      locCounter += 1; // EXTEND word
    }

    if (SPECIAL_WORDS[opcode] !== undefined || BASIC_ENCODINGS[opcode] || EXTRACODE_ENCODINGS[opcode]) {
      locCounter += 1;
    } else {
      errors.push({ line: i + 1, message: `Unknown mnemonic: ${opcode}`, source: lines[i] });
    }
  }

  // ─── Pass 2: Code Generation ───────────────────────────────────────────

  locCounter = 0o4000;
  currentBank = 0;

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (!parsed.opcode) continue;

    const { label, opcode, operand } = parsed;

    // Handle directives (adjust location counter but emit no code)
    if (opcode === 'SETLOC') {
      if (operand) {
        const addr = resolveOperand(operand, symbols);
        if (addr !== undefined) {
          locCounter = addr;
          currentBank = addressToBank(locCounter);
        }
      }
      continue;
    }

    if (opcode === 'BANK') {
      if (operand) {
        const bankNum = resolveOperand(operand, symbols);
        if (bankNum !== undefined) {
          currentBank = bankNum;
          locCounter = bankNum * 1024;
        }
      }
      continue;
    }

    if (opcode === 'EBANK=' || opcode === 'FBANK=') {
      continue;
    }

    if (opcode === 'EQUALS' || opcode === '=') {
      continue;
    }

    if (opcode === 'ERASE') {
      const count = operand ? (resolveOperand(operand, symbols) ?? 1) : 1;
      locCounter += count;
      continue;
    }

    if (opcode === 'BLOCK') {
      if (operand) {
        const blockNum = resolveOperand(operand, symbols);
        if (blockNum !== undefined) {
          currentBank = blockNum;
          locCounter = blockNum * 1024;
        }
      }
      continue;
    }

    // Data directives
    if (opcode === 'OCT') {
      const val = operand ? parseInt(operand, 8) & WORD15_MASK : 0;
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: val,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    if (opcode === 'DEC') {
      let val = operand ? parseInt(operand, 10) : 0;
      // Convert negative to ones' complement
      if (val < 0) {
        val = (-val) ^ WORD15_MASK;
      }
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: val & WORD15_MASK,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    if (opcode === '2DEC') {
      // Double-precision: just emit two words (high and low)
      let val = operand ? parseFloat(operand) : 0;
      const neg = val < 0;
      val = Math.abs(val);
      const high = Math.floor(val) & 0o37777;
      const low = Math.round((val - Math.floor(val)) * 0o37777) & 0o37777;
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: neg ? (high ^ WORD15_MASK) : high,
        source: lines[i],
        label,
      });
      words.push({
        address: locCounter + 1,
        bank: currentBank,
        offset: addressToOffset(locCounter + 1),
        word: neg ? (low ^ WORD15_MASK) : low,
        source: lines[i],
      });
      locCounter += 2;
      continue;
    }

    if (opcode === 'CADR') {
      const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: addr & WORD15_MASK,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    if (opcode === 'ADRES') {
      const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: addr & 0o7777,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    // Special pseudo-instructions
    if (SPECIAL_WORDS[opcode] !== undefined) {
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: SPECIAL_WORDS[opcode],
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    // Basic instructions
    const basicEnc = BASIC_ENCODINGS[opcode];
    if (basicEnc) {
      const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
      const word = encodeInstruction(basicEnc, addr);
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    // Extracode instructions: auto-inject EXTEND first
    const extEnc = EXTRACODE_ENCODINGS[opcode];
    if (extEnc) {
      // Emit EXTEND word
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word: 0o00006,
        source: `  EXTEND  # auto-injected for ${opcode}`,
      });
      locCounter += 1;

      const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
      const word = encodeInstruction(extEnc, addr);
      words.push({
        address: locCounter,
        bank: currentBank,
        offset: addressToOffset(locCounter),
        word,
        source: lines[i],
        label,
      });
      locCounter += 1;
      continue;
    }

    // Unknown opcode (already reported in pass 1)
  }

  // Build bank map
  const bankMap = new Map<number, Uint16Array>();
  for (const w of words) {
    if (!bankMap.has(w.bank)) {
      bankMap.set(w.bank, new Uint16Array(1024));
    }
    const bankData = bankMap.get(w.bank)!;
    bankData[w.offset] = w.word;
  }

  return { words, labels: symbols, errors, banks: bankMap };
}

/**
 * Assemble a single instruction line (for REPL/debugger use).
 * Returns null for directives/comments/blanks.
 */
export function assembleLine(
  line: string,
  symbolTable?: ReadonlyMap<string, number>,
): { word: number; needsExtend: boolean } | null {
  const parsed = parseLine(line);
  if (!parsed.opcode) return null;

  const symbols = symbolTable ?? new Map<string, number>();
  const { opcode, operand } = parsed;

  // Skip directives
  if (DIRECTIVES.has(opcode) || DATA_DIRECTIVES.has(opcode)) {
    if (opcode === 'OCT' && operand) {
      return { word: parseInt(operand, 8) & WORD15_MASK, needsExtend: false };
    }
    return null;
  }

  // Special words
  if (SPECIAL_WORDS[opcode] !== undefined) {
    return { word: SPECIAL_WORDS[opcode], needsExtend: false };
  }

  // Basic
  const basicEnc = BASIC_ENCODINGS[opcode];
  if (basicEnc) {
    const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
    return { word: encodeInstruction(basicEnc, addr), needsExtend: false };
  }

  // Extracode
  const extEnc = EXTRACODE_ENCODINGS[opcode];
  if (extEnc) {
    const addr = operand ? (resolveOperand(operand, symbols) ?? 0) : 0;
    return { word: encodeInstruction(extEnc, addr), needsExtend: true };
  }

  return null;
}

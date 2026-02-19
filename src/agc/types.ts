/**
 * AGC Block II type definitions.
 *
 * Word sizes:
 *   - Word15: 15-bit data word (standard AGC word)
 *   - Word16: 16-bit word with overflow bit (Accumulator)
 *   - Address12: 12-bit address field from instruction word
 */

// Branded types for documentation (structurally just numbers)
export type Word15 = number;
export type Word16 = number;
export type Address12 = number;
export type OctalDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Bit masks
export const WORD15_MASK = 0o77777;   // 15 bits: 0x7FFF = 32767
export const WORD16_MASK = 0o177777;  // 16 bits: 0xFFFF = 65535
export const ADDRESS12_MASK = 0o7777; // 12 bits: 0xFFF = 4095
export const EBANK_MASK = 0o7;        // 3 bits
export const FBANK_MASK = 0o37;       // 5 bits

// Register identifiers matching AGC Block II addresses
export enum RegisterId {
  A = 0,
  L = 1,
  Q = 2,
  Z = 3,
  EBANK = 4,
  FBANK = 5,
  BB = 6,    // Both Banks (composite of FBANK and EBANK)
  // Gap: addresses 7 is unused here
  ZRUPT = 7,  // Z save during interrupt
  BRUPT = 8,
  CYR = 9,   // Cycle Right
  SR = 10,   // Shift Right
  CYL = 11,  // Cycle Left
  EDOP = 12, // Edit Opcode
}

// Masks per register
export const REGISTER_MASKS: Record<RegisterId, number> = {
  [RegisterId.A]: WORD16_MASK,
  [RegisterId.L]: WORD15_MASK,
  [RegisterId.Q]: WORD15_MASK,
  [RegisterId.Z]: ADDRESS12_MASK,
  [RegisterId.EBANK]: EBANK_MASK,
  [RegisterId.FBANK]: FBANK_MASK,
  [RegisterId.BB]: WORD15_MASK,
  [RegisterId.ZRUPT]: ADDRESS12_MASK,
  [RegisterId.BRUPT]: WORD15_MASK,
  [RegisterId.CYR]: WORD15_MASK,
  [RegisterId.SR]: WORD15_MASK,
  [RegisterId.CYL]: WORD15_MASK,
  [RegisterId.EDOP]: WORD15_MASK,
};

/** Mask a number to 15 bits. */
export function toWord15(n: number): Word15 {
  return n & WORD15_MASK;
}

/** Mask a number to 16 bits (with overflow). */
export function toWord16(n: number): Word16 {
  return n & WORD16_MASK;
}

/** Mask a number to 12 bits. */
export function toAddress12(n: number): Address12 {
  return n & ADDRESS12_MASK;
}

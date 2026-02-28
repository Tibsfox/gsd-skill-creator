/**
 * AGC Block II interrupt controller.
 *
 * Priority-based interrupt system with 10 hardware vectors.
 * RUPT entry saves Z/BB to ZRUPT/BRUPT and jumps to vector address.
 * RUPT exit (RESUME) restores Z/BB from ZRUPT/BRUPT.
 * INHINT/RELINT control interrupt inhibition.
 *
 * All functions are pure (no mutation of input state).
 */

import { RegisterId } from './types.js';
import { type AgcRegisters, getRegister, setRegister } from './registers.js';

// ─── Interrupt Definitions ──────────────────────────────────────────────────

/** All 10 AGC hardware interrupts, numbered by priority (lower = higher priority). */
export enum InterruptId {
  BOOT = 1,
  T6RUPT = 2,
  T5RUPT = 3,
  T3RUPT = 4,
  T4RUPT = 5,
  KEYRUPT1 = 6,
  KEYRUPT2 = 7,
  UPRUPT = 8,
  DOWNRUPT = 9,
  RADARRUPT = 10,
}

/** Interrupt vector addresses (octal, in FBANK-switched fixed memory). */
export const INTERRUPT_VECTORS: Record<InterruptId, number> = {
  [InterruptId.BOOT]: 0o4000,
  [InterruptId.T6RUPT]: 0o4004,
  [InterruptId.T5RUPT]: 0o4010,
  [InterruptId.T3RUPT]: 0o4014,
  [InterruptId.T4RUPT]: 0o4020,
  [InterruptId.KEYRUPT1]: 0o4024,
  [InterruptId.KEYRUPT2]: 0o4030,
  [InterruptId.UPRUPT]: 0o4034,
  [InterruptId.DOWNRUPT]: 0o4040,
  [InterruptId.RADARRUPT]: 0o4044,
};

/** Get the vector address for an interrupt. */
export function getVectorAddress(id: InterruptId): number {
  return INTERRUPT_VECTORS[id];
}

// ─── Interrupt State ────────────────────────────────────────────────────────

/** Immutable interrupt controller state. */
export interface InterruptState {
  /** 10-bit bitmask of pending interrupts (bit 0 = BOOT, bit 9 = RADARRUPT). */
  readonly pending: number;
  /** True when INHINT is active -- prevents interrupt servicing. */
  readonly inhibited: boolean;
  /** True when currently inside an ISR -- prevents nested interrupts. */
  readonly servicing: boolean;
}

/** Create initial interrupt state: no pending, not inhibited, not servicing. */
export function createInterruptState(): InterruptState {
  return {
    pending: 0,
    inhibited: false,
    servicing: false,
  };
}

// ─── Request / Clear ────────────────────────────────────────────────────────

/** Request an interrupt by setting its pending bit. Idempotent. */
export function requestInterrupt(state: InterruptState, id: InterruptId): InterruptState {
  const bit = 1 << (id - 1);
  const newPending = state.pending | bit;
  if (newPending === state.pending) return state; // no change
  return { ...state, pending: newPending };
}

/** Clear a specific interrupt's pending bit. */
export function clearInterrupt(state: InterruptState, id: InterruptId): InterruptState {
  const bit = 1 << (id - 1);
  const newPending = state.pending & ~bit;
  if (newPending === state.pending) return state; // no change
  return { ...state, pending: newPending };
}

// ─── Query ──────────────────────────────────────────────────────────────────

/**
 * Check if any interrupt is actionable (pending AND not inhibited AND not servicing).
 */
export function isInterruptPending(state: InterruptState): boolean {
  return state.pending !== 0 && !state.inhibited && !state.servicing;
}

/**
 * Get the highest-priority pending interrupt (lowest InterruptId number).
 * Returns null if no interrupts are pending.
 */
export function getHighestPriorityPending(state: InterruptState): InterruptId | null {
  if (state.pending === 0) return null;

  // Find the lowest set bit position
  for (let bit = 0; bit < 10; bit++) {
    if (state.pending & (1 << bit)) {
      return (bit + 1) as InterruptId;
    }
  }
  return null;
}

// ─── RUPT Entry / Exit ──────────────────────────────────────────────────────

/** Result of servicing an interrupt. */
export interface ServiceResult {
  readonly interruptState: InterruptState;
  readonly registers: AgcRegisters;
  readonly interruptId: InterruptId;
}

/**
 * Service the highest-priority pending interrupt (RUPT entry sequence).
 *
 * 1. Save Z to ZRUPT
 * 2. Save BB to BRUPT
 * 3. Set Z to vector address
 * 4. Clear pending bit
 * 5. Set servicing=true, inhibited=true
 *
 * Returns null if no interrupt is actionable.
 */
export function serviceNextInterrupt(
  state: InterruptState,
  registers: AgcRegisters,
): ServiceResult | null {
  if (!isInterruptPending(state)) return null;

  const id = getHighestPriorityPending(state);
  if (id === null) return null;

  // Save Z to ZRUPT
  let regs = setRegister(registers, RegisterId.ZRUPT, getRegister(registers, RegisterId.Z));
  // Save BB to BRUPT
  regs = setRegister(regs, RegisterId.BRUPT, getRegister(registers, RegisterId.BB));
  // Set Z to vector address
  regs = setRegister(regs, RegisterId.Z, getVectorAddress(id));

  // Clear pending bit, set servicing and inhibited
  const newState: InterruptState = {
    pending: state.pending & ~(1 << (id - 1)),
    inhibited: true,
    servicing: true,
  };

  return {
    interruptState: newState,
    registers: regs,
    interruptId: id,
  };
}

/** Result of completing an interrupt. */
export interface CompleteResult {
  readonly interruptState: InterruptState;
  readonly registers: AgcRegisters;
}

/**
 * Complete the current interrupt (RUPT exit / RESUME sequence).
 *
 * 1. Restore Z from ZRUPT
 * 2. Restore BB from BRUPT
 * 3. Set servicing=false, inhibited=false
 */
export function completeInterrupt(
  state: InterruptState,
  registers: AgcRegisters,
): CompleteResult {
  // Restore Z from ZRUPT
  let regs = setRegister(registers, RegisterId.Z, getRegister(registers, RegisterId.ZRUPT));
  // Restore BB from BRUPT
  regs = setRegister(regs, RegisterId.BB, getRegister(registers, RegisterId.BRUPT));

  const newState: InterruptState = {
    pending: state.pending,
    inhibited: false,
    servicing: false,
  };

  return {
    interruptState: newState,
    registers: regs,
  };
}

// ─── Inhibit Control ────────────────────────────────────────────────────────

/** Set or clear the interrupt inhibit flag (INHINT/RELINT). */
export function setInhibit(state: InterruptState, inhibit: boolean): InterruptState {
  if (state.inhibited === inhibit) return state;
  return { ...state, inhibited: inhibit };
}

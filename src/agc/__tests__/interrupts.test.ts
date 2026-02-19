/**
 * AGC interrupt controller tests.
 *
 * Covers: interrupt vector table, state management, priority ordering,
 * RUPT entry/exit sequences, INHINT/RELINT interaction, edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../interrupts.js';
import { createRegisters, getRegister, setRegister } from '../registers.js';
import { RegisterId } from '../types.js';

describe('interrupt vector table', () => {
  it('defines all 10 interrupts', () => {
    expect(InterruptId.BOOT).toBe(1);
    expect(InterruptId.T6RUPT).toBe(2);
    expect(InterruptId.T5RUPT).toBe(3);
    expect(InterruptId.T3RUPT).toBe(4);
    expect(InterruptId.T4RUPT).toBe(5);
    expect(InterruptId.KEYRUPT1).toBe(6);
    expect(InterruptId.KEYRUPT2).toBe(7);
    expect(InterruptId.UPRUPT).toBe(8);
    expect(InterruptId.DOWNRUPT).toBe(9);
    expect(InterruptId.RADARRUPT).toBe(10);
  });

  it('maps each interrupt to correct vector address', () => {
    expect(INTERRUPT_VECTORS[InterruptId.BOOT]).toBe(0o4000);
    expect(INTERRUPT_VECTORS[InterruptId.T6RUPT]).toBe(0o4004);
    expect(INTERRUPT_VECTORS[InterruptId.T5RUPT]).toBe(0o4010);
    expect(INTERRUPT_VECTORS[InterruptId.T3RUPT]).toBe(0o4014);
    expect(INTERRUPT_VECTORS[InterruptId.T4RUPT]).toBe(0o4020);
    expect(INTERRUPT_VECTORS[InterruptId.KEYRUPT1]).toBe(0o4024);
    expect(INTERRUPT_VECTORS[InterruptId.KEYRUPT2]).toBe(0o4030);
    expect(INTERRUPT_VECTORS[InterruptId.UPRUPT]).toBe(0o4034);
    expect(INTERRUPT_VECTORS[InterruptId.DOWNRUPT]).toBe(0o4040);
    expect(INTERRUPT_VECTORS[InterruptId.RADARRUPT]).toBe(0o4044);
  });

  it('getVectorAddress returns correct address for each interrupt', () => {
    expect(getVectorAddress(InterruptId.BOOT)).toBe(0o4000);
    expect(getVectorAddress(InterruptId.T3RUPT)).toBe(0o4014);
    expect(getVectorAddress(InterruptId.RADARRUPT)).toBe(0o4044);
  });
});

describe('interrupt state', () => {
  it('createInterruptState returns initial state with no pending, not inhibited, not servicing', () => {
    const state = createInterruptState();
    expect(state.pending).toBe(0);
    expect(state.inhibited).toBe(false);
    expect(state.servicing).toBe(false);
  });
});

describe('request and service', () => {
  it('requestInterrupt sets the pending bit for T3RUPT', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    // T3RUPT id=4, bit index = 4-1 = 3
    expect(state.pending & (1 << 3)).not.toBe(0);
  });

  it('requestInterrupt on already-pending interrupt is idempotent', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    const pending1 = state.pending;
    state = requestInterrupt(state, InterruptId.T3RUPT);
    expect(state.pending).toBe(pending1);
  });

  it('multiple interrupts can be pending simultaneously', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = requestInterrupt(state, InterruptId.T4RUPT);
    // T3RUPT bit 3, T4RUPT bit 4
    expect(state.pending & (1 << 3)).not.toBe(0);
    expect(state.pending & (1 << 4)).not.toBe(0);
  });

  it('isInterruptPending returns true when pending bits set and not inhibited/servicing', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    expect(isInterruptPending(state)).toBe(true);
  });

  it('isInterruptPending returns false when inhibited even with pending bits', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = setInhibit(state, true);
    expect(isInterruptPending(state)).toBe(false);
  });

  it('isInterruptPending returns false when servicing (already in ISR)', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    // Simulate being in an ISR
    state = { ...state, servicing: true };
    expect(isInterruptPending(state)).toBe(false);
  });
});

describe('priority ordering', () => {
  it('getHighestPriorityPending returns lowest-numbered pending interrupt', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT); // 4
    state = requestInterrupt(state, InterruptId.T6RUPT); // 2
    expect(getHighestPriorityPending(state)).toBe(InterruptId.T6RUPT);
  });

  it('with T4RUPT and KEYRUPT1 pending, returns T4RUPT (lower number)', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T4RUPT);  // 5
    state = requestInterrupt(state, InterruptId.KEYRUPT1); // 6
    expect(getHighestPriorityPending(state)).toBe(InterruptId.T4RUPT);
  });

  it('returns null when no interrupts are pending', () => {
    const state = createInterruptState();
    expect(getHighestPriorityPending(state)).toBeNull();
  });
});

describe('RUPT entry sequence (serviceNextInterrupt)', () => {
  it('saves Z to ZRUPT, BB to BRUPT, sets Z to vector, clears pending, sets servicing', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);

    let regs = createRegisters();
    regs = setRegister(regs, RegisterId.Z, 0o2500);
    regs = setRegister(regs, RegisterId.BB, 0o34007);

    const result = serviceNextInterrupt(state, regs);
    expect(result).not.toBeNull();
    if (!result) return;

    // Z should now be vector address for T3RUPT
    expect(getRegister(result.registers, RegisterId.Z)).toBe(0o4014);
    // ZRUPT should have saved old Z
    expect(getRegister(result.registers, RegisterId.ZRUPT)).toBe(0o2500);
    // BRUPT should have saved old BB
    expect(getRegister(result.registers, RegisterId.BRUPT)).toBe(0o34007);
    // T3RUPT bit should be cleared
    expect(result.interruptState.pending & (1 << 3)).toBe(0);
    // Should be servicing and inhibited
    expect(result.interruptState.servicing).toBe(true);
    expect(result.interruptState.inhibited).toBe(true);
  });

  it('returns null when no pending interrupts', () => {
    const state = createInterruptState();
    const regs = createRegisters();
    const result = serviceNextInterrupt(state, regs);
    expect(result).toBeNull();
  });

  it('returns null when inhibited', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = setInhibit(state, true);
    const regs = createRegisters();
    const result = serviceNextInterrupt(state, regs);
    expect(result).toBeNull();
  });

  it('returns the InterruptId that was serviced', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    const regs = createRegisters();
    const result = serviceNextInterrupt(state, regs);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.interruptId).toBe(InterruptId.T3RUPT);
  });
});

describe('RUPT exit (completeInterrupt / RESUME)', () => {
  it('restores Z from ZRUPT, BB from BRUPT, clears servicing and inhibit', () => {
    // Set up as if we are in an ISR
    let state = createInterruptState();
    state = { ...state, servicing: true, inhibited: true };

    let regs = createRegisters();
    regs = setRegister(regs, RegisterId.ZRUPT, 0o2500);
    regs = setRegister(regs, RegisterId.BRUPT, 0o34007);

    const result = completeInterrupt(state, regs);
    expect(getRegister(result.registers, RegisterId.Z)).toBe(0o2500);
    expect(getRegister(result.registers, RegisterId.BB)).toBe(0o34007);
    expect(result.interruptState.servicing).toBe(false);
    expect(result.interruptState.inhibited).toBe(false);
  });
});

describe('INHINT/RELINT interaction', () => {
  it('when inhibited, isInterruptPending returns false even with pending bits', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = setInhibit(state, true);
    expect(isInterruptPending(state)).toBe(false);
    // But pending bit is still set
    expect(state.pending & (1 << 3)).not.toBe(0);
  });

  it('setting inhibited=false (RELINT) allows pending interrupts to be serviced', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = setInhibit(state, true);
    expect(isInterruptPending(state)).toBe(false);
    state = setInhibit(state, false);
    expect(isInterruptPending(state)).toBe(true);
  });

  it('requesting interrupt while inhibited still sets pending bit', () => {
    let state = createInterruptState();
    state = setInhibit(state, true);
    state = requestInterrupt(state, InterruptId.T3RUPT);
    expect(state.pending & (1 << 3)).not.toBe(0);
  });
});

describe('edge cases', () => {
  it('requesting BOOT interrupt (id=1) sets pending bit', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.BOOT);
    expect(state.pending & (1 << 0)).not.toBe(0);
  });

  it('all 10 interrupts can be pending simultaneously', () => {
    let state = createInterruptState();
    for (let id = 1; id <= 10; id++) {
      state = requestInterrupt(state, id as InterruptId);
    }
    // All 10 bits should be set (bits 0-9)
    expect(state.pending).toBe(0b1111111111);
  });

  it('after servicing and completing one interrupt, next highest-priority can be serviced', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT); // 4
    state = requestInterrupt(state, InterruptId.T6RUPT); // 2

    let regs = createRegisters();
    regs = setRegister(regs, RegisterId.Z, 0o2500);

    // Service T6RUPT (highest priority)
    const result1 = serviceNextInterrupt(state, regs);
    expect(result1).not.toBeNull();
    if (!result1) return;
    expect(result1.interruptId).toBe(InterruptId.T6RUPT);

    // Complete the interrupt
    const resumed = completeInterrupt(result1.interruptState, result1.registers);

    // Now service the next one -- should be T3RUPT
    const result2 = serviceNextInterrupt(resumed.interruptState, resumed.registers);
    expect(result2).not.toBeNull();
    if (!result2) return;
    expect(result2.interruptId).toBe(InterruptId.T3RUPT);
  });

  it('clearInterrupt removes a specific pending bit', () => {
    let state = createInterruptState();
    state = requestInterrupt(state, InterruptId.T3RUPT);
    state = requestInterrupt(state, InterruptId.T4RUPT);
    state = clearInterrupt(state, InterruptId.T3RUPT);
    expect(state.pending & (1 << 3)).toBe(0);
    expect(state.pending & (1 << 4)).not.toBe(0);
  });
});

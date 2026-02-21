/**
 * Tests for the AGC debugger.
 *
 * Verifies step execution, breakpoints, watchpoints,
 * state inspection, and history tracking.
 */

import { describe, it, expect } from 'vitest';
import { AgcDebugger } from '../tools/debugger.js';
import { createAgcState } from '../cpu.js';
import { RegisterId } from '../types.js';
import { loadFixed } from '../memory.js';
import { setRegister } from '../registers.js';

/**
 * Helper: create an AGC state with a program loaded at bank 2 (address 0o4000).
 * Sets Z to 0o4000 so the CPU fetches from the start of the program.
 * Bank 2 at offset 0 maps to absolute address 0o2000 in fixed memory,
 * but the CPU sees it at address 0o4000 via FBANK=0.
 *
 * Actually, for simplicity, we load into bank 0 (FBANK=0) at fixed absolute 0.
 * The CPU starts at Z=0o4000 which maps to FBANK-switched area.
 * With FBANK=0, address 0o4000 -> bank 0, offset 0.
 */
function createDebugState(program: number[]) {
  let state = createAgcState();
  state = {
    ...state,
    cpu: {
      ...state.cpu,
      memory: loadFixed(state.cpu.memory, 0, program),
    },
  };
  return state;
}

describe('AGC Debugger', () => {
  // ─── Single Step ─────────────────────────────────────────────────────

  describe('single step', () => {
    it('step() advances Z and returns correct mnemonic', () => {
      // CA A at address 0o4000 (bank 0, offset 0)
      // CA A = opcode 3, address 0 -> (3 << 12) | 0 = 0o30000
      const program = [0o30000];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      const event = dbg.step();
      expect(event.mnemonic).toBe('CA');
      expect(event.address).toBe(0o4000);
      expect(event.step).toBe(1);

      // Z should have advanced
      const regs = dbg.getRegisters();
      expect(regs.Z).toBe(0o4001);
    });
  });

  // ─── Multi-Step Program ──────────────────────────────────────────────

  describe('multi-step program', () => {
    it('executes 4 instructions and tracks register state', () => {
      // Program: CA 0o100, AD 0o100, TS 0o100, NOOP
      // CA 0o100: A = mem[0o100]
      const program = [
        (3 << 12) | 0o100,       // CA 0o100
        (6 << 12) | 0o100,       // AD 0o100
        (5 << 12) | (2 << 10) | 0o100, // TS 0o100
        0o30000,                   // NOOP (CA A)
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      // Write a value to erasable address 0o100
      dbg.writeMemory(0o100, 5);

      // Step 1: CA 0o100 -> A = 5
      dbg.step();
      expect(dbg.getRegisters().A).toBe(5);

      // Step 2: AD 0o100 -> A = 5 + 5 = 10
      dbg.step();
      expect(dbg.getRegisters().A).toBe(10);

      // Step 3: TS 0o100 -> mem[0o100] = 10
      dbg.step();
      expect(dbg.readMemory(0o100)).toBe(10);

      // Step 4: NOOP
      const ev4 = dbg.step();
      expect(ev4.mnemonic).toBe('CA');
    });
  });

  // ─── Breakpoints ─────────────────────────────────────────────────────

  describe('breakpoints', () => {
    it('stops at breakpoint address', () => {
      // Program: CA A, AD A, TS 0o100, NOOP
      const program = [
        0o30000,  // CA A
        0o60000,  // AD A
        (5 << 12) | (2 << 10) | 0o100, // TS 0o100
        0o30000,  // NOOP
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      // Set breakpoint at address 0o4002 (third instruction)
      dbg.addBreakpoint(0o4002);
      const event = dbg.run();

      expect(event.breakReason?.type).toBe('breakpoint');
      if (event.breakReason?.type === 'breakpoint') {
        expect(event.breakReason.address).toBe(0o4002);
      }
      expect(dbg.getRegisters().Z).toBe(0o4002);
    });

    it('handles multiple breakpoints -- stops at first encountered', () => {
      const program = [
        0o30000,  // CA A (0o4000)
        0o60000,  // AD A (0o4001)
        0o30000,  // CA A (0o4002)
        0o30000,  // CA A (0o4003)
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      dbg.addBreakpoint(0o4001);
      dbg.addBreakpoint(0o4003);
      const event = dbg.run();

      expect(event.breakReason?.type).toBe('breakpoint');
      if (event.breakReason?.type === 'breakpoint') {
        expect(event.breakReason.address).toBe(0o4001);
      }
    });

    it('remove breakpoint allows execution past address', () => {
      const program = [
        0o30000,  // CA A (0o4000)
        0o30000,  // CA A (0o4001)
        0o30000,  // CA A (0o4002)
        // TC to self at 0o4003
        (0 << 12) | 0o4003, // TC 0o4003
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      dbg.addBreakpoint(0o4001);
      dbg.removeBreakpoint(0o4001);

      // Should run past 0o4001 and eventually halt at TC self
      const event = dbg.run(100);
      expect(event.breakReason?.type).not.toBe('breakpoint');
    });
  });

  // ─── Watchpoints ─────────────────────────────────────────────────────

  describe('watchpoints', () => {
    it('stops on write to watched address', () => {
      // Program: CA 0o101, TS 0o100, CA A, TC self
      const program = [
        (3 << 12) | 0o101,       // CA 0o101
        (5 << 12) | (2 << 10) | 0o100, // TS 0o100 (writes to 0o100)
        0o30000,                   // CA A
        (0 << 12) | 0o4003,       // TC self
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      // Put a value at 0o101 to load
      dbg.writeMemory(0o101, 42);

      // Watch address 0o100 for writes
      dbg.addWatchpoint(0o100, 'write');
      const event = dbg.run();

      expect(event.breakReason?.type).toBe('watchpoint');
      if (event.breakReason?.type === 'watchpoint') {
        expect(event.breakReason.address).toBe(0o100);
        expect(event.breakReason.access).toBe('write');
      }
    });
  });

  // ─── Run with maxSteps ────────────────────────────────────────────────

  describe('run with maxSteps', () => {
    it('stops after maxSteps', () => {
      // Two-instruction loop that prevents halt detection:
      // 0o4000: CA A
      // 0o4001: TCF 0o4000 (jump back without saving Q, Z changes each step)
      const program = [
        0o30000,                  // CA A
        (1 << 12) | 0o4000,      // TCF 0o4000
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      const event = dbg.run(10);
      expect(event.breakReason?.type).toBe('maxSteps');
      if (event.breakReason?.type === 'maxSteps') {
        expect(event.breakReason.count).toBe(10);
      }
    });
  });

  // ─── Halt Detection ──────────────────────────────────────────────────

  describe('halt detection', () => {
    it('detects TC to self as halt', () => {
      // TC self at 0o4000: word = TC 0o4000
      // But TC saves return addr to Q, then Z->target. Next step fetches from target again.
      // If target == current address, Z stays stable -> halt.
      // TC 0o4000 at 0o4000: Z=0o4000, fetch TC 0o4000, Q=0o4001, Z=0o4000
      // Next: fetch TC 0o4000 again. Z stays 0o4000 for 3 steps -> halt.
      const program = [(0 << 12) | 0o4000]; // TC 0o4000
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      const event = dbg.run(100);
      expect(event.breakReason?.type).toBe('halt');
    });
  });

  // ─── State Inspection ─────────────────────────────────────────────────

  describe('state inspection', () => {
    it('getRegisters returns correct values', () => {
      const state = createDebugState([0o30000]); // CA A
      const dbg = new AgcDebugger(state);

      const regs = dbg.getRegisters();
      expect(regs.Z).toBe(0o4000);
      expect(regs.A).toBe(0);
    });

    it('readMemory returns correct value', () => {
      const state = createDebugState([0o30000]);
      const dbg = new AgcDebugger(state);

      dbg.writeMemory(0o100, 42);
      expect(dbg.readMemory(0o100)).toBe(42);
    });

    it('readMemoryRange returns correct range', () => {
      const state = createDebugState([0o30000]);
      const dbg = new AgcDebugger(state);

      dbg.writeMemory(0o100, 10);
      dbg.writeMemory(0o101, 20);
      dbg.writeMemory(0o102, 30);

      const range = dbg.readMemoryRange(0o100, 3);
      expect(range).toEqual([10, 20, 30]);
    });
  });

  // ─── History ──────────────────────────────────────────────────────────

  describe('history', () => {
    it('records execution events', () => {
      const program = [
        0o30000,  // CA A
        0o60000,  // AD A
        0o30000,  // CA A
        0o60000,  // AD A
        0o30000,  // CA A
      ];
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      for (let i = 0; i < 5; i++) dbg.step();

      const history = dbg.getHistory(3);
      expect(history).toHaveLength(3);
      // Should be the last 3 events
      expect(history[0].step).toBe(3);
      expect(history[1].step).toBe(4);
      expect(history[2].step).toBe(5);
    });

    it('getStepCount returns total steps', () => {
      const state = createDebugState([0o30000, 0o30000]);
      const dbg = new AgcDebugger(state);

      dbg.step();
      dbg.step();
      expect(dbg.getStepCount()).toBe(2);
    });
  });

  // ─── getCurrentInstruction ────────────────────────────────────────────

  describe('getCurrentInstruction', () => {
    it('disassembles instruction at current Z', () => {
      const program = [0o30000]; // CA A
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      const instr = dbg.getCurrentInstruction();
      expect(instr.mnemonic).toBe('CA');
      expect(instr.address).toBe(0o4000);
    });
  });

  // ─── getSnapshot ──────────────────────────────────────────────────────

  describe('getSnapshot', () => {
    it('returns full debug state', () => {
      const state = createDebugState([0o30000]);
      const dbg = new AgcDebugger(state);

      const snap = dbg.getSnapshot();
      expect(snap.step).toBe(0);
      expect(snap.registers.Z).toBe(0o4000);
      expect(snap.currentInstruction.mnemonic).toBe('CA');
      expect(snap.interruptState.pending).toBe(0);
      expect(snap.timing.totalMCTs).toBe(0);
    });
  });

  // ─── loadProgram ──────────────────────────────────────────────────────

  describe('loadProgram', () => {
    it('loads words into fixed memory and they are executable', () => {
      const state = createAgcState();
      const dbg = new AgcDebugger(state);

      // Load a program into bank 0 (FBANK=0 -> address 0o4000)
      dbg.loadProgram(0, [
        (3 << 12) | 0o100,  // CA 0o100
      ]);

      // Verify the instruction is correct
      const instr = dbg.getCurrentInstruction();
      expect(instr.mnemonic).toBe('CA');

      // Write a value and step
      dbg.writeMemory(0o100, 99);
      dbg.step();
      expect(dbg.getRegisters().A).toBe(99);
    });
  });

  // ─── setState / setRegister ───────────────────────────────────────────

  describe('state modification', () => {
    it('setRegister modifies register and affects next step', () => {
      // Program: TS 0o100 (store A to erasable 0o100)
      const program = [(5 << 12) | (2 << 10) | 0o100]; // TS 0o100
      const state = createDebugState(program);
      const dbg = new AgcDebugger(state);

      // Set A to 42, then step (TS stores A)
      dbg.setRegister(RegisterId.A, 42);
      dbg.step();
      expect(dbg.readMemory(0o100)).toBe(42);
    });

    it('setState replaces full state', () => {
      const state1 = createDebugState([0o30000]);
      const state2 = createDebugState([(6 << 12) | 0o100]); // AD 0o100
      const dbg = new AgcDebugger(state1);

      expect(dbg.getCurrentInstruction().mnemonic).toBe('CA');
      dbg.setState(state2);
      expect(dbg.getCurrentInstruction().mnemonic).toBe('AD');
    });
  });

  // ─── Event Callback ───────────────────────────────────────────────────

  describe('onEvent callback', () => {
    it('calls onEvent for each step', () => {
      const events: string[] = [];
      const state = createDebugState([0o30000, 0o60000]);
      const dbg = new AgcDebugger(state, {
        onEvent: (e) => events.push(e.mnemonic),
      });

      dbg.step();
      dbg.step();
      expect(events).toEqual(['CA', 'AD']);
    });
  });
});

/**
 * AGC Block II debugger.
 *
 * Provides step-through execution with breakpoints, watchpoints,
 * and comprehensive state inspection. Uses the immutable AGC state
 * pattern with mutable debugger bookkeeping.
 */

import type { AgcState, AgcStepResult } from '../cpu.js';
import { createAgcState, stepAgc } from '../cpu.js';
import { RegisterId } from '../types.js';
import { getRegister, setRegister } from '../registers.js';
import { readMemory, writeMemory, loadFixed } from '../memory.js';
import type { InterruptState } from '../interrupts.js';
import { InterruptId } from '../interrupts.js';
import type { DisassembledInstruction } from './disassembler.js';
import { disassembleWord } from './disassembler.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/** Reason execution stopped. */
export type BreakReason =
  | { type: 'breakpoint'; address: number }
  | { type: 'watchpoint'; address: number; access: 'read' | 'write'; value: number }
  | { type: 'step' }
  | { type: 'interrupt'; id: InterruptId }
  | { type: 'maxSteps'; count: number }
  | { type: 'halt' };

/** A single debug event (one step of execution). */
export interface DebugEvent {
  step: number;
  mnemonic: string;
  address: number;
  mctsUsed: number;
  breakReason?: BreakReason;
  interruptServiced?: InterruptId;
}

/** Snapshot of all registers. */
export interface RegisterSnapshot {
  A: number;
  L: number;
  Q: number;
  Z: number;
  EBANK: number;
  FBANK: number;
  BB: number;
  ZRUPT: number;
  BRUPT: number;
}

/** Full debug state snapshot. */
export interface DebugSnapshot {
  step: number;
  registers: RegisterSnapshot;
  currentInstruction: DisassembledInstruction;
  interruptState: { pending: number; inhibited: boolean; servicing: boolean };
  timing: { totalMCTs: number; elapsedMs: number };
}

// ─── Debugger Class ────────────────────────────────────────────────────────

/**
 * AGC debugger providing step-through execution with breakpoints,
 * watchpoints, and state inspection.
 *
 * This is a stateful class (the ONE exception to the pure functional
 * pattern in the AGC module). The AGC state itself remains immutable
 * via stepAgc(); the debugger maintains mutable bookkeeping.
 */
export class AgcDebugger {
  private state: AgcState;
  private breakpoints: Set<number>;
  private watchpoints: Map<number, 'read' | 'write' | 'readwrite'>;
  private history: DebugEvent[];
  private maxHistory: number;
  private stepCount: number;
  private onEvent?: (event: DebugEvent) => void;

  constructor(
    initialState: AgcState,
    options?: { maxHistory?: number; onEvent?: (e: DebugEvent) => void },
  ) {
    this.state = initialState;
    this.breakpoints = new Set();
    this.watchpoints = new Map();
    this.history = [];
    this.maxHistory = options?.maxHistory ?? 1000;
    this.stepCount = 0;
    this.onEvent = options?.onEvent;
  }

  // ─── Execution Control ───────────────────────────────────────────────

  /** Execute a single instruction step. */
  step(): DebugEvent {
    const prevZ = getRegister(this.state.cpu.registers, RegisterId.Z);

    // Snapshot watched memory before step
    const watchedBefore = this.snapshotWatched();

    // Execute one step
    const result = stepAgc(this.state);
    this.state = result.state;
    this.stepCount++;

    // Build event
    const event: DebugEvent = {
      step: this.stepCount,
      mnemonic: result.mnemonic,
      address: prevZ,
      mctsUsed: result.mctsUsed,
      breakReason: { type: 'step' },
      interruptServiced: result.interruptServiced,
    };

    this.recordEvent(event);
    return event;
  }

  /**
   * Step over a TC instruction (run until the return address).
   * If the current instruction is not TC, just single-step.
   */
  stepOver(): DebugEvent[] {
    const events: DebugEvent[] = [];
    const z = getRegister(this.state.cpu.registers, RegisterId.Z);
    const returnAddr = z + 1;

    // First step
    const first = this.step();
    events.push(first);

    // If it was TC, run until we return
    if (first.mnemonic === 'TC') {
      const maxSteps = 10000;
      for (let i = 0; i < maxSteps; i++) {
        const currentZ = getRegister(this.state.cpu.registers, RegisterId.Z);
        if (currentZ === returnAddr) break;

        const ev = this.step();
        events.push(ev);
      }
    }

    return events;
  }

  /**
   * Run until breakpoint, watchpoint, or maxSteps reached.
   */
  run(maxSteps: number = 100000): DebugEvent {
    let lastEvent: DebugEvent | null = null;
    const recentZ: number[] = [];

    for (let i = 0; i < maxSteps; i++) {
      const prevZ = getRegister(this.state.cpu.registers, RegisterId.Z);

      // Snapshot watched memory before step
      const watchedBefore = this.snapshotWatched();

      // Execute step
      const result = stepAgc(this.state);
      this.state = result.state;
      this.stepCount++;

      const newZ = getRegister(this.state.cpu.registers, RegisterId.Z);

      // Check watchpoints
      const watchHit = this.checkWatchpoints(watchedBefore, result, prevZ);

      const event: DebugEvent = {
        step: this.stepCount,
        mnemonic: result.mnemonic,
        address: prevZ,
        mctsUsed: result.mctsUsed,
        interruptServiced: result.interruptServiced,
      };

      if (watchHit) {
        event.breakReason = watchHit;
        this.recordEvent(event);
        return event;
      }

      // Check breakpoints (at new Z)
      if (this.breakpoints.has(newZ)) {
        event.breakReason = { type: 'breakpoint', address: newZ };
        this.recordEvent(event);
        return event;
      }

      // Halt detection: Z hasn't changed for 3 consecutive steps
      recentZ.push(newZ);
      if (recentZ.length > 3) recentZ.shift();
      if (recentZ.length === 3 && recentZ[0] === recentZ[1] && recentZ[1] === recentZ[2]) {
        event.breakReason = { type: 'halt' };
        this.recordEvent(event);
        return event;
      }

      this.recordEvent(event);
      lastEvent = event;
    }

    // Max steps reached
    const event: DebugEvent = lastEvent ?? {
      step: this.stepCount,
      mnemonic: '',
      address: 0,
      mctsUsed: 0,
    };
    event.breakReason = { type: 'maxSteps', count: maxSteps };
    return event;
  }

  /** Run until PC reaches a specific address. */
  runToAddress(address: number): DebugEvent {
    this.addBreakpoint(address);
    const event = this.run();
    this.removeBreakpoint(address);
    return event;
  }

  // ─── Breakpoint Management ────────────────────────────────────────────

  addBreakpoint(address: number): void {
    this.breakpoints.add(address);
  }

  removeBreakpoint(address: number): boolean {
    return this.breakpoints.delete(address);
  }

  listBreakpoints(): number[] {
    return Array.from(this.breakpoints);
  }

  clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  // ─── Watchpoint Management ────────────────────────────────────────────

  addWatchpoint(address: number, access: 'read' | 'write' | 'readwrite'): void {
    this.watchpoints.set(address, access);
  }

  removeWatchpoint(address: number): boolean {
    return this.watchpoints.delete(address);
  }

  listWatchpoints(): Map<number, string> {
    return new Map(this.watchpoints);
  }

  clearWatchpoints(): void {
    this.watchpoints.clear();
  }

  // ─── State Inspection ─────────────────────────────────────────────────

  getState(): AgcState {
    return this.state;
  }

  getRegisters(): RegisterSnapshot {
    const regs = this.state.cpu.registers;
    return {
      A: getRegister(regs, RegisterId.A),
      L: getRegister(regs, RegisterId.L),
      Q: getRegister(regs, RegisterId.Q),
      Z: getRegister(regs, RegisterId.Z),
      EBANK: getRegister(regs, RegisterId.EBANK),
      FBANK: getRegister(regs, RegisterId.FBANK),
      BB: getRegister(regs, RegisterId.BB),
      ZRUPT: getRegister(regs, RegisterId.ZRUPT),
      BRUPT: getRegister(regs, RegisterId.BRUPT),
    };
  }

  getRegister(id: RegisterId): number {
    return getRegister(this.state.cpu.registers, id);
  }

  readMemory(address: number): number {
    const ebank = getRegister(this.state.cpu.registers, RegisterId.EBANK);
    const fbank = getRegister(this.state.cpu.registers, RegisterId.FBANK);
    const superbank = this.state.cpu.memory.superbank;

    // Check if register address
    if (address <= 0o17) {
      return getRegister(this.state.cpu.registers, address as RegisterId);
    }
    return readMemory(this.state.cpu.memory, address, ebank, fbank, superbank);
  }

  readMemoryRange(start: number, count: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.readMemory(start + i));
    }
    return result;
  }

  getSnapshot(): DebugSnapshot {
    return {
      step: this.stepCount,
      registers: this.getRegisters(),
      currentInstruction: this.getCurrentInstruction(),
      interruptState: {
        pending: this.state.interrupts.pending,
        inhibited: this.state.interrupts.inhibited,
        servicing: this.state.interrupts.servicing,
      },
      timing: {
        totalMCTs: this.state.timing.totalMCTs,
        elapsedMs: this.state.timing.totalMCTs * 0.01172,
      },
    };
  }

  getCurrentInstruction(): DisassembledInstruction {
    const z = getRegister(this.state.cpu.registers, RegisterId.Z);
    const ebank = getRegister(this.state.cpu.registers, RegisterId.EBANK);
    const fbank = getRegister(this.state.cpu.registers, RegisterId.FBANK);
    const superbank = this.state.cpu.memory.superbank;
    const word = readMemory(this.state.cpu.memory, z, ebank, fbank, superbank);
    return disassembleWord(word, this.state.cpu.extracode, z, ebank, fbank);
  }

  // ─── History ──────────────────────────────────────────────────────────

  getHistory(count?: number): DebugEvent[] {
    if (count === undefined) return [...this.history];
    return this.history.slice(-count);
  }

  getStepCount(): number {
    return this.stepCount;
  }

  // ─── State Modification ───────────────────────────────────────────────

  setState(state: AgcState): void {
    this.state = state;
  }

  setRegister(id: RegisterId, value: number): void {
    this.state = {
      ...this.state,
      cpu: {
        ...this.state.cpu,
        registers: setRegister(this.state.cpu.registers, id, value),
      },
    };
  }

  writeMemory(address: number, value: number): void {
    const ebank = getRegister(this.state.cpu.registers, RegisterId.EBANK);
    const fbank = getRegister(this.state.cpu.registers, RegisterId.FBANK);
    this.state = {
      ...this.state,
      cpu: {
        ...this.state.cpu,
        memory: writeMemory(this.state.cpu.memory, address, ebank, fbank, value),
      },
    };
  }

  loadProgram(bank: number, data: readonly number[]): void {
    this.state = {
      ...this.state,
      cpu: {
        ...this.state.cpu,
        memory: loadFixed(this.state.cpu.memory, bank, data),
      },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  private recordEvent(event: DebugEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    if (this.onEvent) {
      this.onEvent(event);
    }
  }

  /** Snapshot watched memory addresses. */
  private snapshotWatched(): Map<number, number> {
    const snapshot = new Map<number, number>();
    for (const [addr] of Array.from(this.watchpoints)) {
      snapshot.set(addr, this.readMemory(addr));
    }
    return snapshot;
  }

  /** Check if any watchpoint was triggered. */
  private checkWatchpoints(
    before: Map<number, number>,
    result: AgcStepResult,
    prevZ: number,
  ): BreakReason | null {
    for (const [addr, access] of Array.from(this.watchpoints)) {
      // Write watchpoint: memory value changed
      if (access === 'write' || access === 'readwrite') {
        const oldVal = before.get(addr) ?? 0;
        const newVal = this.readMemory(addr);
        if (oldVal !== newVal) {
          return { type: 'watchpoint', address: addr, access: 'write', value: newVal };
        }
      }

      // Read watchpoint: instruction addressed this location
      if (access === 'read' || access === 'readwrite') {
        // Simple check: see if the instruction word at prevZ referenced this address
        const ebank = getRegister(this.state.cpu.registers, RegisterId.EBANK);
        const fbank = getRegister(this.state.cpu.registers, RegisterId.FBANK);
        const superbank = this.state.cpu.memory.superbank;
        // Check ioOps for read operations
        for (const op of result.ioOps) {
          if (op.type === 'read' && op.channel === addr) {
            return { type: 'watchpoint', address: addr, access: 'read', value: op.value };
          }
        }
      }
    }
    return null;
  }
}

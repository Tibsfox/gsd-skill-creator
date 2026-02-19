/**
 * AGC validation test harness.
 *
 * Provides infrastructure for running instruction-level validation tests
 * against the AGC emulator. Each test case assembles a small program,
 * executes it, and checks assertions against the resulting state.
 *
 * Produces diagnostic output on failure using the disassembler.
 */

import type { AgcState, AgcStepResult } from '../cpu.js';
import { createAgcState, stepAgc } from '../cpu.js';
import { RegisterId, WORD15_MASK } from '../types.js';
import { getRegister, setRegister } from '../registers.js';
import { loadFixed, readMemory, writeMemory } from '../memory.js';
import { readChannel } from '../io-channels.js';
import { type CounterId, getCounterValue } from '../counters.js';
import { assemble } from './assembler.js';
import { disassembleWord } from './disassembler.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/** A single test assertion. */
export interface TestAssertion {
  type: 'register' | 'memory' | 'channel' | 'counter' | 'interrupt' | 'z_at';
  target: string | number;
  expected: number;
  description: string;
}

/** A complete test case definition. */
export interface TestCase {
  name: string;
  category: 'basic' | 'extracode' | 'special' | 'interrupt' | 'counter' | 'bank' | 'sequence';
  description: string;
  program: string;
  setup?: (state: AgcState) => AgcState;
  assertions: TestAssertion[];
  maxSteps?: number;
}

/** Result of checking one assertion. */
interface AssertionCheckResult {
  assertion: TestAssertion;
  actual: number;
  passed: boolean;
}

/** Result of running one test case. */
export interface TestResult {
  name: string;
  passed: boolean;
  assertions: AssertionCheckResult[];
  stepsExecuted: number;
  error?: string;
  diagnostics?: string;
}

/** Aggregated results from a full validation run. */
export interface ValidationResult {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  results: TestResult[];
  duration: number;
}

// ─── Register Name Lookup ──────────────────────────────────────────────────

const REGISTER_NAME_MAP: Record<string, RegisterId> = {
  A: RegisterId.A,
  L: RegisterId.L,
  Q: RegisterId.Q,
  Z: RegisterId.Z,
  EBANK: RegisterId.EBANK,
  FBANK: RegisterId.FBANK,
  BB: RegisterId.BB,
  ZRUPT: RegisterId.ZRUPT,
  BRUPT: RegisterId.BRUPT,
};

// ─── Completion Detection ──────────────────────────────────────────────────

/**
 * Detect if the program has completed by checking if Z is stable
 * (repeating for 3 consecutive steps = TC-to-self idle loop).
 */
function isComplete(recentZ: number[]): boolean {
  if (recentZ.length < 3) return false;
  const last3 = recentZ.slice(-3);
  return last3[0] === last3[1] && last3[1] === last3[2];
}

// ─── Test Execution ────────────────────────────────────────────────────────

/**
 * Execute a single test case and check assertions.
 */
export function runTestCase(testCase: TestCase): TestResult {
  const maxSteps = testCase.maxSteps ?? 1000;

  try {
    // 1. Assemble the program
    const assembled = assemble(testCase.program);
    if (assembled.errors.length > 0) {
      return {
        name: testCase.name,
        passed: false,
        assertions: [],
        stepsExecuted: 0,
        error: `Assembly errors: ${assembled.errors.map(e => e.message).join('; ')}`,
      };
    }

    // 2. Create fresh AGC state and load the program
    let state = createAgcState();
    for (const [bank, data] of Array.from(assembled.banks)) {
      state = {
        ...state,
        cpu: {
          ...state.cpu,
          memory: loadFixed(state.cpu.memory, bank, Array.from(data)),
        },
      };
    }

    // 3. Set Z to the first instruction address
    const firstAddr = assembled.words.length > 0 ? assembled.words[0].address : 0o4000;
    state = {
      ...state,
      cpu: {
        ...state.cpu,
        registers: setRegister(state.cpu.registers, RegisterId.Z, firstAddr),
      },
    };

    // 4. Apply setup function
    if (testCase.setup) {
      state = testCase.setup(state);
    }

    // 5. Execute program
    const recentZ: number[] = [];
    const executionTrace: { z: number; mnemonic: string }[] = [];
    let stepsExecuted = 0;

    for (let i = 0; i < maxSteps; i++) {
      const z = getRegister(state.cpu.registers, RegisterId.Z);
      recentZ.push(z);

      const result = stepAgc(state);
      state = result.state;
      stepsExecuted++;

      executionTrace.push({ z, mnemonic: result.mnemonic });

      // Check completion
      const newZ = getRegister(state.cpu.registers, RegisterId.Z);
      recentZ.push(newZ);
      if (recentZ.length > 6) recentZ.splice(0, recentZ.length - 6);

      if (isComplete(recentZ.slice(-3))) {
        break;
      }
    }

    // 6. Check assertions
    const assertionResults = testCase.assertions.map(assertion =>
      checkAssertion(assertion, state),
    );

    const allPassed = assertionResults.every(r => r.passed);

    // 7. Generate diagnostics on failure
    let diagnostics: string | undefined;
    if (!allPassed) {
      const lastSteps = executionTrace.slice(-10);
      const lines = lastSteps.map(s =>
        `  ${s.z.toString(8).padStart(5, '0')}: ${s.mnemonic}`,
      );
      diagnostics = `Last ${lastSteps.length} instructions:\n${lines.join('\n')}`;
    }

    return {
      name: testCase.name,
      passed: allPassed,
      assertions: assertionResults,
      stepsExecuted,
      diagnostics,
    };
  } catch (err) {
    return {
      name: testCase.name,
      passed: false,
      assertions: [],
      stepsExecuted: 0,
      error: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Check a single assertion against the AGC state.
 */
function checkAssertion(assertion: TestAssertion, state: AgcState): AssertionCheckResult {
  let actual: number;

  switch (assertion.type) {
    case 'register': {
      const regId = typeof assertion.target === 'string'
        ? REGISTER_NAME_MAP[assertion.target]
        : assertion.target;
      if (regId === undefined) {
        return { assertion, actual: -1, passed: false };
      }
      actual = getRegister(state.cpu.registers, regId);
      break;
    }
    case 'memory': {
      const addr = typeof assertion.target === 'number' ? assertion.target : 0;
      const ebank = getRegister(state.cpu.registers, RegisterId.EBANK);
      const fbank = getRegister(state.cpu.registers, RegisterId.FBANK);
      actual = readMemory(state.cpu.memory, addr, ebank, fbank, state.cpu.memory.superbank);
      break;
    }
    case 'channel': {
      const ch = typeof assertion.target === 'number' ? assertion.target : 0;
      actual = readChannel(state.ioChannels, ch);
      break;
    }
    case 'counter': {
      const cId = assertion.target as CounterId;
      actual = getCounterValue(state.counters, cId);
      break;
    }
    case 'interrupt': {
      actual = state.interrupts.pending;
      break;
    }
    case 'z_at': {
      actual = getRegister(state.cpu.registers, RegisterId.Z);
      break;
    }
    default:
      actual = -1;
  }

  return {
    assertion,
    actual,
    passed: actual === assertion.expected,
  };
}

// ─── Suite Runner ──────────────────────────────────────────────────────────

/**
 * Run all test cases and aggregate results.
 */
export function runValidationSuite(testCases: TestCase[]): ValidationResult {
  const start = Date.now();
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const tc of testCases) {
    const result = runTestCase(tc);
    results.push(result);

    if (result.error) {
      errors++;
    } else if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  return {
    totalTests: testCases.length,
    passed,
    failed,
    errors,
    results,
    duration: Date.now() - start,
  };
}

// ─── Test Program Helper ───────────────────────────────────────────────────

/**
 * Create a minimal yaYUL program from instruction lines.
 * Wraps with SETLOC and adds a terminating TC-to-self loop.
 */
export function createTestProgram(
  instructions: string[],
  options?: { bank?: number; startAddress?: number },
): string {
  const start = options?.startAddress ?? 0o4000;
  const lines: string[] = [];

  lines.push(`  SETLOC ${start.toString(8).padStart(5, '0')}`);
  for (const instr of instructions) {
    lines.push(`  ${instr}`);
  }

  // Calculate the address of the DONE label
  // (instructions + auto-EXTEND words advance the counter)
  lines.push('DONE  TC DONE');

  return lines.join('\n');
}

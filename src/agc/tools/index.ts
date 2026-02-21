/**
 * AGC tools barrel index.
 *
 * Re-exports all public types and functions from tool modules.
 * Phase 219: disassembler, assembler, debugger, validation, rope-loader.
 */

// Disassembler
export type { DisassembledInstruction } from './disassembler.js';
export {
  disassembleWord,
  disassembleBank,
  disassembleRope,
  formatAddress,
  formatListing,
} from './disassembler.js';

// Assembler
export type { AssembledWord, AssemblerResult, AssemblerError } from './assembler.js';
export { assemble, assembleLine } from './assembler.js';

// Debugger
export type { BreakReason, DebugEvent, RegisterSnapshot, DebugSnapshot } from './debugger.js';
export { AgcDebugger } from './debugger.js';

// Validation
export type { TestCase, TestAssertion, TestResult, ValidationResult } from './validation.js';
export { runTestCase, runValidationSuite, createTestProgram } from './validation.js';

// Rope Loader
export type { RopeMetadata, LoadedRope } from './rope-loader.js';
export { loadRopeImage, loadRopeFromBuffer, getRopeBankData } from './rope-loader.js';

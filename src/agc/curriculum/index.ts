/**
 * AGC Curriculum module -- barrel index.
 *
 * Re-exports curriculum types, constant arrays, and runner infrastructure.
 * Phase 221 -- AGC Curriculum & Exercises.
 */

// Types
export type { ChapterMeta, ExerciseMeta, ProgramMeta, CurriculumIndex } from './types.js';

// Constant arrays (curriculum table of contents)
export { CHAPTERS, EXERCISES, PROGRAMS } from './types.js';

// Runner infrastructure
export type { IoEntry, RunOpts, RunResult } from './runner.js';
export { assembleProgramSource, runProgram } from './runner.js';

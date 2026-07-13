/**
 * Persists a dogfood refinement pass to a run directory so `dogfood promote`
 * can consume it end-to-end.
 *
 * `assembleRefinementResult` folds `refineSkills()` output into a full
 * RefinementResult (skill updates + statistics; the patch/ticket phases are
 * left empty for a skills-only refine). `writeRefinementRun` writes it as
 * `<runDir>/skill-updates.json` — the exact file `dogfood promote` reads.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LearnedConcept } from '../learning/types.js';
import type { GapRecord } from '../verification/types.js';
import { refineSkills } from './skill-refiner.js';
import type { RefinementResult } from './types.js';

/** Filename `dogfood promote` looks for inside a run directory. */
export const SKILL_UPDATES_FILENAME = 'skill-updates.json';

/**
 * Run the refinement pass over `concepts`/`gaps` and wrap the resulting
 * SkillUpdates in a RefinementResult with matching statistics.
 */
export function assembleRefinementResult(
  concepts: LearnedConcept[],
  gaps: GapRecord[],
): RefinementResult {
  const skillUpdates = refineSkills(concepts, gaps);
  return {
    patches: [],
    tickets: [],
    skillUpdates,
    statistics: {
      gapsProcessed: gaps.length,
      patchesGenerated: 0,
      ticketsGenerated: 0,
      skillsUpdated: skillUpdates.length,
      skippedGaps: 0,
    },
  };
}

/**
 * Write `result` to `<runDir>/skill-updates.json`, creating `runDir` if needed.
 * Returns the absolute path written.
 */
export function writeRefinementRun(runDir: string, result: RefinementResult): string {
  mkdirSync(runDir, { recursive: true });
  const file = join(runDir, SKILL_UPDATES_FILENAME);
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return file;
}

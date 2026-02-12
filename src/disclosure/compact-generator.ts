/**
 * Compact mode skill generation with @references/ links.
 * Produces minimal SKILL.md with separate reference files.
 * Addresses DISC-06 requirement.
 */

import type { ReferenceFile, ScriptFile } from './content-decomposer.js';

export interface CompactSkillOutput {
  compacted: boolean;
  skillMd: string;
  references: ReferenceFile[];
  scripts: ScriptFile[];
}

export class CompactGenerator {
  generateCompact(
    _name: string,
    _metadata: Record<string, unknown>,
    _body: string,
  ): CompactSkillOutput {
    throw new Error('not implemented');
  }
}

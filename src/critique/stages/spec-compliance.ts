/**
 * spec-compliance stage — dispatches the spec reviewer subagent.
 *
 * Stamps `stage: 'spec-compliance'` on all returned findings.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CritiqueStage, CritiqueFinding, SkillDraft, SubagentClient } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = join(__dirname, '../prompts/spec-reviewer.md');

// Memoized prompt loader
let cachedSpecPrompt: string | null = null;

async function loadSpecPrompt(): Promise<string> {
  if (cachedSpecPrompt === null) {
    cachedSpecPrompt = await readFile(PROMPT_PATH, 'utf-8');
  }
  return cachedSpecPrompt;
}

/**
 * Factory: returns a CritiqueStage that uses the spec reviewer prompt.
 */
export function specComplianceStage(client: SubagentClient): CritiqueStage {
  return {
    name: 'spec-compliance',

    async run(draft: SkillDraft): Promise<CritiqueFinding[]> {
      const prompt = await loadSpecPrompt();
      const { findings } = await client.review(prompt, draft.body);

      // Stamp stage name on all findings
      return findings.map((f) => ({ ...f, stage: 'spec-compliance' }));
    },
  };
}

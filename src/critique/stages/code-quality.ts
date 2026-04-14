/**
 * code-quality stage — dispatches the code quality reviewer subagent.
 *
 * Stamps `stage: 'code-quality'` on all returned findings.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CritiqueStage, CritiqueFinding, SkillDraft, SubagentClient } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = join(__dirname, '../prompts/quality-reviewer.md');

// Memoized prompt loader
let cachedQualityPrompt: string | null = null;

async function loadQualityPrompt(): Promise<string> {
  if (cachedQualityPrompt === null) {
    cachedQualityPrompt = await readFile(PROMPT_PATH, 'utf-8');
  }
  return cachedQualityPrompt;
}

/**
 * Factory: returns a CritiqueStage that uses the code quality reviewer prompt.
 */
export function codeQualityStage(client: SubagentClient): CritiqueStage {
  return {
    name: 'code-quality',

    async run(draft: SkillDraft): Promise<CritiqueFinding[]> {
      const prompt = await loadQualityPrompt();
      const { findings } = await client.review(prompt, draft.body);

      // Stamp stage name on all findings
      return findings.map((f) => ({ ...f, stage: 'code-quality' }));
    },
  };
}

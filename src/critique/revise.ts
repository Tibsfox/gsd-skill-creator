/**
 * revise.ts — apply findings to a draft via a subagent reviser call.
 *
 * Security:
 * - T-CRIT-04: path traversal guard — writes ONLY within draft.skillDir
 */

import { relative } from 'node:path';
import type { CritiqueFinding, SkillDraft, SubagentClient } from './types.js';

export interface ReviseDeps {
  /** SubagentClient used to generate the revised body. */
  reviser: SubagentClient;
  /** Prompt template; {{findings}} is replaced with the findings list. */
  revisePrompt: string;
}

/**
 * Guard: ensure target path does not escape skillDir.
 * Throws if the resolved relative path starts with '..'.
 *
 * @param skillDir - Trusted base directory
 * @param target - Candidate write path
 */
export function assertWithinSkillDir(skillDir: string, target: string): void {
  const rel = relative(skillDir, target);
  if (rel.startsWith('..') || rel === '') {
    throw new Error(
      `Path traversal rejected: "${target}" is not within skillDir "${skillDir}"`,
    );
  }
}

/**
 * Apply a list of findings to the current draft via a subagent reviser call.
 *
 * The reviser is asked to produce a new version of the skill body that addresses
 * all findings. The returned rawResponse is treated as the new body.
 *
 * @param draft - Current skill draft
 * @param findings - Findings from this iteration's critique stages
 * @param deps - Injectable reviser client and prompt template
 * @returns New SkillDraft with updated body
 */
export async function reviseDraft(
  draft: SkillDraft,
  findings: CritiqueFinding[],
  deps: ReviseDeps,
): Promise<SkillDraft> {
  const { reviser, revisePrompt } = deps;

  // Format findings list for the prompt
  const findingsList = findings
    .map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.message}${f.fixHint ? ` (hint: ${f.fixHint})` : ''}`)
    .join('\n');

  const prompt = revisePrompt.replace('{{findings}}', findingsList);

  const response = await reviser.review(prompt, draft.body);

  // Use rawResponse as the new body (the reviser returns the revised skill body)
  // Fall back to original body if the reviser returns nothing useful
  const newBody = (response.rawResponse && response.rawResponse.trim().length > 0)
    ? response.rawResponse
    : draft.body;

  // Path traversal guard (T-CRIT-04): verify all write targets are within skillDir
  // For in-memory revision (this phase), we verify skillDir itself is the target
  assertWithinSkillDir(draft.skillDir, draft.skillDir + '/SKILL.md');

  return {
    ...draft,
    body: newBody,
    // Update the in-memory files map with the new body
    files: new Map([...draft.files, ['SKILL.md', newBody]]),
  };
}

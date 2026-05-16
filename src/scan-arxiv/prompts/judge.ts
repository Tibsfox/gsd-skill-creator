// === Judge prompt construction ===
//
// Builds the LLM prompt that scores a single arxiv paper against the four
// fixed relevance domains. Returns JSON in a fixed shape so the ranker can
// parse the response deterministically.

import type { ArxivPaper } from '../types.js';
import { AGENT_ORCHESTRATION_DOMAIN_BLOCK } from './agent-orchestration.js';
import { SKILL_DESIGN_DOMAIN_BLOCK } from './skill-design.js';
import { CODE_GEN_DOMAIN_BLOCK } from './code-gen.js';
import { MEMORY_RETRIEVAL_DOMAIN_BLOCK } from './memory-retrieval.js';

export const ALL_FOUR_DOMAIN_BLOCKS = [
  AGENT_ORCHESTRATION_DOMAIN_BLOCK,
  SKILL_DESIGN_DOMAIN_BLOCK,
  CODE_GEN_DOMAIN_BLOCK,
  MEMORY_RETRIEVAL_DOMAIN_BLOCK,
].join('\n\n');

export function buildJudgePrompt(paper: ArxivPaper): string {
  return `
You are scoring an arxiv paper for relevance to four research domains.

Paper:
  Title:    ${paper.title}
  Abstract: ${paper.abstract}
  Categories: ${paper.categories.join(', ')}

Domains:
${ALL_FOUR_DOMAIN_BLOCKS}

For each domain, return a score in [0, 1] (two decimals) based on the rubric.
Also return a one-sentence rationale (no more than 30 words) that cites specific terms
from the abstract.

Respond in this exact JSON shape, nothing else:

{
  "subscores": {
    "agent-orchestration": <float>,
    "skill-design": <float>,
    "code-gen": <float>,
    "memory-retrieval": <float>
  },
  "rationale": "<one sentence>"
}
`.trim();
}

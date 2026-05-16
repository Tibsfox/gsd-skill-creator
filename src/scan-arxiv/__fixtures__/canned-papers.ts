// === Canned arxiv papers fixture ===
//
// Hand-curated set of `ArxivPaper` objects used by ranker.test.ts and
// ranker.live.test.ts. Each entry encodes a boundary condition that the
// four-domain ranker MUST hold (e.g. a LoRA-for-code paper must score high
// on code-gen and low on agent-orchestration). The `expectedScores` field is
// the boundary assertion the test runner checks.

import type { ArxivPaper, RelevanceDomain } from '../types.js';

export interface ExpectedBound {
  atLeast?: number;
  atMost?: number;
}

export type ExpectedScores = Partial<Record<RelevanceDomain, ExpectedBound>> & {
  aggregateAtMost?: number;
  aggregateAtLeast?: number;
  maxSubscoreAtMost?: number;
};

export interface CannedPaper {
  paper: ArxivPaper;
  expectedScores: ExpectedScores;
  /** Free-form key used to look up the fixture in tests. */
  key:
    | 'multiAgentCoord'
    | 'lora'
    | 'objectDetection'
    | 'longContext'
    | 'toolUse'
    | 'mixedCase';
}

const ISO_NOW = '2026-05-01T00:00:00.000Z';

// 1. Clear multi-agent coordination paper.
const multiAgentCoord: CannedPaper = {
  key: 'multiAgentCoord',
  paper: {
    arxivId: '2605.10001',
    title:
      'SwarmCoord: A Hierarchical Multi-Agent Orchestration Framework with MCP-Style Inter-Agent Messaging',
    authors: ['A. Chen', 'B. Patel', 'C. Iwasaki'],
    abstract:
      'We present SwarmCoord, a hierarchical multi-agent orchestration framework that coordinates dozens of LLM agents through a structured message-passing protocol inspired by Model Context Protocol (MCP). SwarmCoord introduces a dispatch layer that routes tasks to specialist agents based on a learned role-assignment policy, and a peer-to-peer swarm topology for parallel sub-tasks. Experiments on three multi-agent benchmarks (LangGraph-Bench, CrewAI-Eval, AutoGen-Battle) show that SwarmCoord outperforms single-agent baselines by 18-34% on task completion rate while reducing inter-agent communication overhead by 41%. We additionally provide an ablation isolating the contribution of the role-assignment policy from the dispatch topology.',
    categories: ['cs.MA', 'cs.AI', 'cs.LG'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10001',
    absUrl: 'https://arxiv.org/abs/2605.10001',
  },
  expectedScores: {
    'agent-orchestration': { atLeast: 0.7 },
  },
};

// 2. LoRA fine-tuning for code generation (code-gen=high, agent-orch=low).
const lora: CannedPaper = {
  key: 'lora',
  paper: {
    arxivId: '2605.10002',
    title:
      'CodeLoRA: Parameter-Efficient Fine-Tuning of Language Models for Repository-Scale Code Generation',
    authors: ['D. Singh', 'E. Vargas'],
    abstract:
      'We study LoRA-based parameter-efficient fine-tuning for code generation tasks at repository scale. Our CodeLoRA approach attaches low-rank adapters to a 7B base model and trains them on a curated corpus of Python and Rust repositories, achieving a 12.4-point improvement on SWE-bench-Lite and a 9.8-point improvement on HumanEval-Plus while updating less than 0.6% of the parameters. We compare against full fine-tuning and find LoRA matches within 1.2 points at one-tenth the GPU cost. We additionally analyze the rank vs. quality trade-off and identify rank-16 as the practical sweet spot for code-generation tasks on consumer GPUs.',
    categories: ['cs.SE', 'cs.LG', 'cs.CL'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10002',
    absUrl: 'https://arxiv.org/abs/2605.10002',
  },
  expectedScores: {
    'agent-orchestration': { atMost: 0.3 },
    'code-gen': { atLeast: 0.5 },
  },
};

// 3. Object detection — all subscores should be low.
const objectDetection: CannedPaper = {
  key: 'objectDetection',
  paper: {
    arxivId: '2605.10003',
    title: 'DETR-XL: Scaling Detection Transformers for Aerial Imagery',
    authors: ['F. Brown', 'G. Kim'],
    abstract:
      'We extend the DETR detection transformer architecture to aerial imagery with very small object instances. By introducing a hierarchical query mechanism and a multi-scale feature pyramid, our DETR-XL model improves small-object detection mAP by 7.3 points on the iSAID benchmark and 5.1 points on DOTA-v2. We also analyze the trade-off between query count and latency on edge devices. The model is purely vision-based and does not interact with language models, agents, retrieval, or external tools of any kind.',
    categories: ['cs.CV'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10003',
    absUrl: 'https://arxiv.org/abs/2605.10003',
  },
  expectedScores: {
    maxSubscoreAtMost: 0.4,
    aggregateAtMost: 0.4,
  },
};

// 4. Long-context modeling.
const longContext: CannedPaper = {
  key: 'longContext',
  paper: {
    arxivId: '2605.10004',
    title:
      'MillionFormer: Sparse Hierarchical Attention for Million-Token Context Windows',
    authors: ['H. Watanabe', 'I. Ng'],
    abstract:
      'We introduce MillionFormer, a transformer architecture with a learned sparse hierarchical attention pattern that scales to one-million-token context windows on a single A100 GPU. MillionFormer combines local block attention with a learned global router that allocates a small budget of cross-segment attention heads. On four long-context benchmarks (BookSum, NarrativeQA, RULER-1M, and our new CodeRepo-1M retrieval task) MillionFormer outperforms RWKV, Mamba, and standard sliding-window attention by 4-9 points at 256K and 7-14 points at 1M context. We additionally show that the same architecture supports retrieval-augmented generation without an external vector store.',
    categories: ['cs.CL', 'cs.LG'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10004',
    absUrl: 'https://arxiv.org/abs/2605.10004',
  },
  expectedScores: {
    'memory-retrieval': { atLeast: 0.7 },
  },
};

// 5. LLM tool-use (skill-design=high).
const toolUse: CannedPaper = {
  key: 'toolUse',
  paper: {
    arxivId: '2605.10005',
    title:
      'SkillRouter: Learning to Discover and Activate Tools for Language-Model Agents',
    authors: ['J. Romero', 'K. Aoki'],
    abstract:
      'We present SkillRouter, a framework for skill discovery and activation in language-model agents that invoke external tools via structured function-calling. SkillRouter trains a lightweight router head that predicts which skill to activate given the current context, including slash-command-style invocations and sub-agent dispatch. On the ToolBench-2 benchmark, SkillRouter improves tool-selection accuracy by 14% over zero-shot prompting and reduces redundant tool calls by 38%. We also study prompt-as-program patterns for agentic decomposition and find that explicit skill manifests improve out-of-distribution generalization.',
    categories: ['cs.AI', 'cs.CL'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10005',
    absUrl: 'https://arxiv.org/abs/2605.10005',
  },
  expectedScores: {
    'skill-design': { atLeast: 0.6 },
  },
};

// 6. Mixed-case: multi-agent code review.
const mixedCase: CannedPaper = {
  key: 'mixedCase',
  paper: {
    arxivId: '2605.10006',
    title:
      'CodeCouncil: A Multi-Agent System for Autonomous Code Review and Pull-Request Generation',
    authors: ['L. Park', 'M. Goldberg', 'N. Oduya'],
    abstract:
      'CodeCouncil is a multi-agent system that coordinates three specialist LLM agents — a reviewer, a fixer, and a verifier — to autonomously review and patch pull requests on real GitHub repositories. The agents communicate via a structured A2A message bus and dispatch work according to a learned role-assignment policy. On SWE-bench-Verified, CodeCouncil resolves 38.1% of issues end-to-end (vs. 26.4% for a single-agent baseline) and produces pull requests that humans accept at a 71% rate. We ablate the contribution of each agent and find the verifier accounts for half of the end-to-end gain.',
    categories: ['cs.SE', 'cs.MA', 'cs.AI'],
    publishedAt: ISO_NOW,
    updatedAt: ISO_NOW,
    pdfUrl: 'https://arxiv.org/pdf/2605.10006',
    absUrl: 'https://arxiv.org/abs/2605.10006',
  },
  expectedScores: {
    'agent-orchestration': { atLeast: 0.6 },
    'code-gen': { atLeast: 0.6 },
  },
};

export const CANNED_PAPERS: readonly CannedPaper[] = [
  multiAgentCoord,
  lora,
  objectDetection,
  longContext,
  toolUse,
  mixedCase,
] as const;

export function getCannedPaper(key: CannedPaper['key']): CannedPaper {
  const found = CANNED_PAPERS.find((p) => p.key === key);
  if (!found) throw new Error(`No canned paper with key: ${key}`);
  return found;
}

/**
 * Bounded-Learning Empirical Harness — 20-task scaffold.
 *
 * Provides the harness shape for the 20-task / 15-sub-domain evaluation
 * scaffold per SkillLearnBench (arXiv:2604.20087 §3.1 task design, §3.2
 * sub-domain taxonomy / Zhong et al. 2026).
 *
 * IMPORTANT: this file provides the scaffold shape only. The 20 tasks below
 * are synthetic harness fixtures — they are NOT the actual SkillLearnBench
 * task descriptions (which are in the paper). They instantiate the
 * SkillLearnBench structural design (20 tasks across 15 sub-domains) against
 * GSD's own skill-update context, as described in the Phase 766 forward
 * handoff in `module_1.tex` §sec:m1-slb.
 *
 * Sub-domain distribution follows SkillLearnBench §3.2: the 15 sub-domains
 * are represented, with some sub-domains hosting 2 tasks (6 sub-domains have
 * 2 tasks; 9 sub-domains have 1 task; total = 12 + 9 = 21 — we use exactly
 * 20 tasks by giving 5 sub-domains 2 tasks and 10 sub-domains 1 task, with
 * the extra task dropped from the least-represented sub-domain).
 *
 * Actual distribution used here (20 tasks, 15 sub-domains):
 *   5 sub-domains × 2 tasks = 10
 *   10 sub-domains × 1 task = 10
 *   Total = 20 tasks
 *
 * Tasks are pluggable: callers may substitute their own TaskSet by passing it
 * directly to `runBenchmark()` / `validateConstraint()`. The DEFAULT_TASK_SET
 * is the harness default.
 *
 * Phase 766, v1.49.573.
 *
 * @module bounded-learning-empirical/task-scaffold
 */

import type { TaskSet, TaskSpec } from './types.js';

// ---------------------------------------------------------------------------
// Scaffold tasks
// ---------------------------------------------------------------------------

const TASKS: ReadonlyArray<TaskSpec> = [
  // ---- skill-composition (2 tasks) ----------------------------------------
  {
    id: 'SC-01',
    subDomain: 'skill-composition',
    description: 'Compose two orthogonal skills into a compound skill',
    input: 'skill_a=retrieval skill_b=formatting compose=sequential',
    referenceOutput: 'compound_skill{steps:[retrieval,formatting]}',
    feedbackSource: 'self',
  },
  {
    id: 'SC-02',
    subDomain: 'skill-composition',
    description: 'Detect circular composition in a skill graph',
    input: 'skill_graph={a->b, b->c, c->a}',
    referenceOutput: 'circular_dependency_detected: [a,b,c]',
    feedbackSource: 'external',
  },

  // ---- skill-retrieval (2 tasks) ------------------------------------------
  {
    id: 'SR-01',
    subDomain: 'skill-retrieval',
    description: 'Retrieve the closest skill by semantic embedding',
    input: 'query="format JSON output" top_k=3',
    referenceOutput: 'skills:[output-structuring,json-formatter,schema-validator]',
    feedbackSource: 'self',
  },
  {
    id: 'SR-02',
    subDomain: 'skill-retrieval',
    description: 'Retrieve skill by exact name match with disambiguation',
    input: 'query="code-review" disambiguation=strict',
    referenceOutput: 'skill:code-review version:latest',
    feedbackSource: 'external',
  },

  // ---- skill-editing (2 tasks) --------------------------------------------
  {
    id: 'SE-01',
    subDomain: 'skill-editing',
    description: 'Apply a bounded update within the 20% content-change cap',
    input: 'skill_content_tokens=100 update_tokens=18',
    referenceOutput: 'update_accepted change_ratio=0.18',
    feedbackSource: 'self',
  },
  {
    id: 'SE-02',
    subDomain: 'skill-editing',
    description: 'Reject an update that exceeds the 20% content-change cap',
    input: 'skill_content_tokens=100 update_tokens=25',
    referenceOutput: 'update_rejected reason=cap_exceeded change_ratio=0.25',
    feedbackSource: 'external',
  },

  // ---- skill-evaluation (2 tasks) -----------------------------------------
  {
    id: 'EV-01',
    subDomain: 'skill-evaluation',
    description: 'Score a skill against a reference rubric',
    input: 'skill=output-structuring rubric=frontmatter_completeness',
    referenceOutput: 'score=0.92 missing_fields=[]',
    feedbackSource: 'self',
  },
  {
    id: 'EV-02',
    subDomain: 'skill-evaluation',
    description: 'Compare two skill versions and select the higher-quality one',
    input: 'skill_v1=output-structuring@1.0 skill_v2=output-structuring@2.0 metric=rubric',
    referenceOutput: 'selected=v2 delta=+0.08',
    feedbackSource: 'external',
  },

  // ---- skill-generation (1 task) ------------------------------------------
  {
    id: 'GEN-01',
    subDomain: 'skill-generation',
    description: 'Generate a minimal valid SKILL.md stub',
    input: 'name=my-skill description="does X"',
    referenceOutput: '---\nname: my-skill\ndescription: does X\n---',
    feedbackSource: 'external',
  },

  // ---- tool-use (1 task) --------------------------------------------------
  {
    id: 'TU-01',
    subDomain: 'tool-use',
    description: 'Invoke a skill via the cartridge chipset CLI',
    input: 'cartridge=math op=evaluate expr="2+2"',
    referenceOutput: 'result=4 chip=algebrus',
    feedbackSource: 'self',
  },

  // ---- planning (1 task) --------------------------------------------------
  {
    id: 'PL-01',
    subDomain: 'planning',
    description: 'Produce a wave execution plan for a 3-phase milestone',
    input: 'phases=3 budget_tokens=50000',
    referenceOutput: 'waves:[W1:25000,W2:15000,W3:10000]',
    feedbackSource: 'external',
  },

  // ---- code-synthesis (1 task) --------------------------------------------
  {
    id: 'CS-01',
    subDomain: 'code-synthesis',
    description: 'Synthesise a TypeScript function from a docstring',
    input: 'docstring="adds two numbers" return_type=number',
    referenceOutput: 'function add(a: number, b: number): number { return a + b; }',
    feedbackSource: 'self',
  },

  // ---- knowledge-transfer (1 task) ----------------------------------------
  {
    id: 'KT-01',
    subDomain: 'knowledge-transfer',
    description: 'Transfer a skill from one domain to an adjacent domain',
    input: 'source_domain=audio target_domain=video skill=spectral-analysis',
    referenceOutput: 'adapted_skill:spectral-analysis-video confidence=0.81',
    feedbackSource: 'external',
  },

  // ---- error-correction (1 task) ------------------------------------------
  {
    id: 'EC-01',
    subDomain: 'error-correction',
    description: 'Apply 3 external corrections to a candidate skill update',
    input: 'corrections=[c1,c2,c3] candidate=v2',
    referenceOutput: 'update_committed corrections_met=3',
    feedbackSource: 'external',
  },

  // ---- feedback-integration (1 task) --------------------------------------
  {
    id: 'FI-01',
    subDomain: 'feedback-integration',
    description: 'Merge two conflicting feedback signals into one update',
    input: 'signal_a=add_section signal_b=remove_section priority=a',
    referenceOutput: 'update_merged conflict_resolved=true',
    feedbackSource: 'self',
  },

  // ---- context-adaptation (1 task) ----------------------------------------
  {
    id: 'CA-01',
    subDomain: 'context-adaptation',
    description: 'Adapt a skill for a new context after 7-day cooldown',
    input: 'skill=code-review days_since_commit=7 context=rust',
    referenceOutput: 'adaptation_allowed cooldown_satisfied=true',
    feedbackSource: 'external',
  },

  // ---- multi-step-reasoning (1 task) --------------------------------------
  {
    id: 'MSR-01',
    subDomain: 'multi-step-reasoning',
    description: 'Resolve a 4-step skill dependency chain',
    input: 'chain=[a,b,c,d] resolve=topological',
    referenceOutput: 'order:[a,b,c,d] cycles=0',
    feedbackSource: 'self',
  },

  // ---- output-structuring (1 task) ----------------------------------------
  {
    id: 'OS-01',
    subDomain: 'output-structuring',
    description: 'Validate frontmatter against the output-structure schema',
    input: 'frontmatter={name:"x" version:"1.0"}',
    referenceOutput: 'valid=true missing_fields=[]',
    feedbackSource: 'external',
  },

  // ---- self-improvement (2 tasks) -----------------------------------------
  {
    id: 'SI-01',
    subDomain: 'self-improvement',
    description: 'Measure skill-quality improvement over 5 self-feedback iterations',
    input: 'iterations=5 feedback_source=self initial_quality=0.60',
    referenceOutput: 'quality_trajectory=[0.60,0.57,0.55,0.53,0.51] verdict=drift_detected',
    feedbackSource: 'self',
  },
  {
    id: 'SI-02',
    subDomain: 'self-improvement',
    description: 'Confirm quality stabilises after 3 external corrections interrupt self-feedback',
    input: 'self_rounds=3 external_corrections=3 initial_quality=0.58',
    referenceOutput: 'quality_trajectory=[0.58,0.56,0.54,0.59,0.62,0.65] verdict=drift_arrested',
    feedbackSource: 'external',
  },
] as const;

// ---------------------------------------------------------------------------
// Default TaskSet
// ---------------------------------------------------------------------------

/**
 * Default 20-task / 15-sub-domain scaffold matching the SkillLearnBench
 * structural design (arXiv:2604.20087 §3.1, §3.2).
 *
 * Tasks are pluggable: pass a custom TaskSet to override.
 */
export const DEFAULT_TASK_SET: TaskSet = {
  name: 'SkillLearnBench-GSD-v1 (Phase 766 scaffold)',
  createdAt: '2026-04-24T00:00:00.000Z',
  tasks: TASKS,
};

/**
 * Serialize a TaskSet to a compact JSON string.
 *
 * Round-trips through `deserializeTaskSet` for the TaskSet round-trip test.
 */
export function serializeTaskSet(taskSet: TaskSet): string {
  return JSON.stringify(taskSet);
}

/**
 * Deserialize a TaskSet from the JSON string produced by `serializeTaskSet`.
 *
 * Throws if the payload is not a valid TaskSet shape.
 */
export function deserializeTaskSet(json: string): TaskSet {
  const parsed = JSON.parse(json) as unknown;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('name' in parsed) ||
    !('createdAt' in parsed) ||
    !('tasks' in parsed)
  ) {
    throw new Error('Invalid TaskSet JSON: missing required fields');
  }
  return parsed as TaskSet;
}

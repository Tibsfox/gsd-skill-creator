/**
 * Task-Specific Knowledge Localization concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.27237 (2026).
 *
 * @module departments/ai-computation/concepts/task-specific-knowledge-localization
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 2 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const taskSpecificKnowledgeLocalization: RosettaConcept = {
  id: 'ai-computation-task-specific-knowledge-localization',
  name: 'Task-Specific Knowledge Localization',
  domain: 'ai-computation',
  description: 'Task-Specific Knowledge Localization is the interpretability finding that a language model does not store a fact once in a shared, query-agnostic "knowledge base" but re-encodes the same fact in distinct, task-conditioned parameter subsets, so that what the model knows and how it is asked become entangled in parameter space. arXiv:2606.27237 (2026) establishes this both behaviorally and mechanistically: facts a model acquires while training on one task frequently fail to co-emerge on other tasks that query the same fact, and parameter-localization experiments — activation patching that causally traces which parameters carry a fact for a given task — reveal separate parameter subsets underlying different tasks for a single fact rather than one canonical source of truth. The paper further shows that chain-of-thought reasoning draws part of its effectiveness from recruiting task-specific parameters beyond those tied to the evaluation task, meaning CoT partly works by engaging additional task-conditioned storage. This directly undermines the classic knowledge-base analogy, whose defining property is that different queries for one fact return consistent results from a single locus. Distinct from Distributed Attribute Retrieval, which shows a single fact is recalled along multiple redundant, layer-skipping paths within one task, this concept concerns cross-task fragmentation: the partition is indexed by the task or framing, not by intra-task path redundancy, so the same nominal fact can be present under one prompt form and absent under another. For agent systems, the implication is that factual reliability and controllability are prompt-form dependent: editing, unlearning, or verifying a fact against one task or query template gives no guarantee for another, so knowledge audits and fact-edits must be evaluated across the full space of task framings an agent will actually use, and grounded retrieval should be treated as primary rather than backup for facts that must hold uniformly.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'The mechanistic half of this finding is produced by activation/patching localization probes: identifying which parameter subset underlies a fact for a given task is exactly the delta-probe methodology applied per task, so the task-specific-subset result depends on that probing technique to distinguish one task\'s parameters from another\'s.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-distributed-attribute-retrieval',
      description: 'Both localize where a fact lives, but on orthogonal axes: distributed attribute retrieval shows one fact travels several redundant, layer-skipping paths within a single task, whereas this concept shows the same fact occupies different parameter subsets across different tasks — intra-task redundancy versus cross-task fragmentation.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-unlearning-suppression-reversal',
      description: 'Unlearning and suppression assume that editing the locus of a fact removes it; task-specific storage predicts that suppressing a fact as queried by one task can leave the same fact intact under another task\'s parameter subset, so cross-task fragmentation is a concrete mechanism by which apparent unlearning fails to generalize across framings.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

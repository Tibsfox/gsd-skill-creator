/**
 * Workflow Convertibility Taxonomy -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/integration-evaluation/workflow-convertibility
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 131 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const workflowConvertibility: RosettaConcept = {
  id: "agent-workflow-convertibility",
  name: "Workflow Convertibility Taxonomy",
  domain: 'agent-systems',
  description:
    "Workflow Convertibility Taxonomy addresses the migration of active, expert-validated \"LLM + script\" workflows — which encode hard-won domain knowledge but remain static and cannot adapt execution to feedback — into adaptive agents (arXiv 2606.24598, 2026). Its distinct contribution is a reversible, Strangler-Fig migration path that incrementally refactors a legacy workflow into composable, typed, and auditable stages while the original keeps running. Central is a three-tier convertibility taxonomy (A/B/C), implemented as a routing stage inside the system harness, that diagnoses each workflow's readiness for conversion and routes it to the appropriate tier. Unlike greenfield-agent and synthetic-benchmark research, it targets legacy systems already in production. For agent builders, the implication is that adaptivity can be introduced conservatively and reversibly, gating each stage's promotion on measured readiness rather than a risky wholesale rewrite.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-harness-as-substrate",
      description: "The convertibility taxonomy runs as a diagnostic routing stage embedded in the system harness, depending on the harness-as-substrate view that treats the harness as the execution fabric hosting such routing and refactoring stages.",
    },
    {
      type: "cross-reference",
      targetId: "agent-critique-and-route",
      description: "Both classify an item then dispatch it: convertibility diagnoses a workflow's A/B/C readiness and routes it accordingly, mirroring critique-and-route's evaluate-then-dispatch control pattern applied to legacy migration.",
    },
    {
      type: "analogy",
      targetId: "agent-governance-taxonomy",
      description: "Like a governance taxonomy that sorts artifacts into tiers determining how each is handled, the A/B/C convertibility tiers form a diagnostic classification that fixes a legacy workflow's migration treatment.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

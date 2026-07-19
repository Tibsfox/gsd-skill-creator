/**
 * Same Capability Risk Retrieval -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/same-capability-risk-retrieval
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 76 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const sameCapabilityRiskRetrieval: RosettaConcept = {
  id: "agent-same-capability-risk-retrieval",
  name: "Same Capability Risk Retrieval",
  domain: 'agent-systems',
  description:
    "Skill retrievers are usually scored on whether they return the right capability family, but SkillResolve-Bench (arXiv 2606.10388) shows that family-correct retrieval can still be unsafe: among siblings that all offer the same capability, the retriever may surface one that points at a stale resource, assumes an unmet precondition, or encodes the wrong procedure. Execution then fails or silently drifts even though the \"right skill\" was found. The insight is to score retrieval by the execution risk of the returned sibling, not family match alone — pushing disambiguation past name and embedding similarity toward preconditions, resource freshness, and procedural fit. SkillResolve, the reference method, resolves the active capability families and then selects a single representative per family before assembling the top-K list — and that within-family representative choice, not the scorer, is the lever: it drives the harmful-sibling rate HSR@3 (top-K exposure of the risky sibling) to 0 while holding Recall@3 at 0.766 and NDCG@3 at 0.699, whereas dropping representative selection under the same scorer lets HSR@3 climb to 0.236. It matters because agents route real work through whichever sibling wins retrieval, so a benign-looking ranking error becomes an execution hazard.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "typed-skill-graph-selection",
      description: "Specializes the typed skill graph's disambiguation: even a correct capability-family match can hide a risky same-capability sibling, so typed edges must encode precondition, freshness, and procedure risk rather than only depends-on and conflicts-with relations.",
    },
    {
      type: "cross-reference",
      targetId: "agent-constraint-compatible-retrieval",
      description: "The missing-precondition failure mode is precisely a constraint-compatibility miss; retrieval should filter out siblings whose preconditions the current agent state cannot satisfy before they ever reach execution.",
    },
    {
      type: "cross-reference",
      targetId: "agent-execution-grounded-selection",
      description: "Execution-grounded signals are what let you distinguish a safe sibling from a risky one when embedding similarity treats the same-capability candidates as interchangeable and cannot see procedural fit.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "Surfacing a family-correct but wrong-procedure or stale-resource sibling is a silent failure: no retrieval error is raised while downstream execution quietly drifts toward the wrong outcome.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

/**
 * Cost Aware Speculation -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/cost-aware-speculation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 53 * 2 * Math.PI / 85;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const costAwareSpeculation: RosettaConcept = {
  id: "agent-cost-aware-speculation",
  name: "Cost Aware Speculation",
  domain: 'agent-systems',
  description:
    "Agent pipelines stall while a downstream step waits for an upstream step's output, leaving compute idle and inflating wall-clock. Cost-Aware Speculative Execution (arXiv 2606.07846) reclaims that idle time by predicting the likely upstream input and launching the downstream operation early — but only when an expected-value rule clears: it prices each speculative call in real dollars and fires only if predicted latency savings exceed the per-token cost, weighted by a misprediction probability — estimated with a Bayesian Beta-Binomial posterior whose prior is keyed to a dependency-type taxonomy — and a user preference for speed versus spend. Crucially, the rule fires only on admissible edges (side-effect-free, idempotent, or stageable behind a commit barrier), because a wrong speculation is rolled back by re-execution, which refunds tokens but cannot un-send an irreversible side effect. This turns latency hiding into an explicit, priced scheduling decision inside the harness rather than an always-on gamble; a five-stage calibration pipeline guards it with a drift-triggered kill-switch, and the rule provably self-limits as the upstream branching factor grows, letting agent systems trade money for wall-clock deliberately.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-harness-as-substrate",
      description: "Specializes the harness-as-substrate view: it treats the harness scheduler as a surface where idle windows between pipeline stages can be filled with speculative downstream work, adding an economic gate that the generic substrate lacks.",
    },
    {
      type: "analogy",
      targetId: "agent-semantic-concurrency-control",
      description: "Both borrow optimistic-concurrency thinking — begin an operation before its input is confirmed, then reconcile or discard on misprediction. Speculation is the temporal, cost-priced dual of managing concurrent writes that may conflict.",
    },
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-utility",
      description: "The expected-value gate prices a speculation by its counterfactual payoff; both reason about the utility of an action before committing resources, here reducing that reasoning to a dollar-versus-latency threshold weighted by failure probability.",
    },
    {
      type: "cross-reference",
      targetId: "agent-dynamic-autonomy",
      description: "The failure-weighted, preference-adjusted dollar threshold is a cost-and-preference gate on autonomous action, echoing how dynamic autonomy modulates how freely an agent acts based on risk and user tolerance rather than acting unconditionally.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

/**
 * Infrastructure-Aware Orchestration -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/infrastructure-aware-orchestration
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 125 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const infrastructureAwareOrchestration: RosettaConcept = {
  id: "agent-infrastructure-aware-orchestration",
  name: "Infrastructure-Aware Orchestration",
  domain: 'agent-systems',
  description:
    "Infrastructure-Aware Orchestration makes the whole multi-agent LLM stack respond to the live state of the serving infrastructure rather than to task and model features alone (arXiv 2606.11440, 2026). Prior routers are infrastructure-blind: preferred models accumulate deep request queues while equally capable alternatives idle, and in sequential pipelines these delays compound across every downstream call. INFRAMIND drives three coupled decisions from noisy runtime signals — queue depths, KV-cache pressure, latencies. An infra-aware planner biases toward simpler graphs under congestion and richer ones at low load; an infra-aware executor picks which model to call and how deeply to reason per step; a budget-aware scheduler reorders each model's queue so urgent requests go first. Cast as a hierarchical constrained MDP and learned end-to-end by reinforcement learning, it trades accuracy against latency automatically. The lesson: agent routing must read cluster telemetry, not just model fit.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-critique-and-route",
      description: "Both route each pipeline step to a model, but critique-and-route selects on output-quality signals whereas infrastructure-aware orchestration conditions the same choice on live queue depths and cache pressure.",
    },
    {
      type: "cross-reference",
      targetId: "agent-spectral-topology",
      description: "The infra-aware planner chooses a topology under congestion; spectral-topology preflight scores a candidate graph's coordination quality, supplying a structural metric the planner can weigh against runtime load.",
    },
    {
      type: "analogy",
      targetId: "agent-cost-aware-speculation",
      description: "Both spend a variable compute budget against a latency target — cost-aware-speculation gambles extra decoding, this framework gambles a richer graph and deeper reasoning only when the infrastructure is idle.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

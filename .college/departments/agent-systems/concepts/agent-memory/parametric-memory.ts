/**
 * Agent Parametric Memory concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.04536 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/parametric-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 10 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const parametricMemory: RosettaConcept = {
  id: 'agent-parametric-memory',
  name: 'Agent Parametric Memory',
  domain: 'agent-systems',
  description: 'Agent Parametric Memory is a design in which an LLM agent updates its own model parameters mid-episode rather than only editing its prompt, so experience literally changes the policy that generates subsequent actions. TMEM, introduced in arXiv:2606.04536 (2026), instantiates this: alongside compressing history into explicit textual memory, the agent absorbs distilled supervision into fast, low-rank LoRA weight deltas Delta_t through lightweight online updates within a single rollout. Actions are sampled from the adapted policy pi(theta_0 + Delta_t), while dedicated extraction actions produce the supervision that updates Delta_t for later decisions. The authors formalize this as an agentic decision process with fast-weight rollout dynamics, which makes the extraction policy directly optimizable by reinforcement learning: training the base weights theta_0 improves both the task actions and the quality of the data used for online adaptation, and an SVD-based initialization of the LoRA subspace accelerates online convergence. The result is an agent that can learn from what it has seen, not merely look it up: information dropped from the context window is no longer permanently lost, because its effect persists in the weight delta. Across LoCoMo, LongMemEval-S, multi-objective search, and CL-Bench, TMEM consistently outperforms summary-based and retrieval-based memory baselines at multiple model scales. Distinct from Memory Consolidation, which compresses trajectories into denser textual records while keeping model parameters frozen, parametric memory moves the learned residue into the weights themselves, changing the agent\'s disposition rather than its retrievable notes. For agent systems this reframes long-horizon memory as an online-learning problem: a runtime must budget a small trainable adapter per episode, checkpoint and roll back weight deltas as safely as it snapshots context, and treat the extraction and compression policy as a first-class RL-trainable component rather than a fixed prompt template.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Fast-weight rollout loop: hold a per-episode adapter delta = lora_init_svd(theta_0); at each step sample the action from policy(theta_0 + delta, context), and when an extraction action fires, compute distilled supervision from the trajectory and apply one lightweight online update delta = delta - lr * grad(loss, delta). Snapshot delta alongside the context checkpoint so a bad update can be rolled back, and cap the adapter rank to bound per-episode compute.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-memory-consolidation',
      description: 'TMEM still performs textual consolidation of history, but goes further by absorbing that distilled supervision into fast weights; consolidation is the prompt-space step parametric memory extends past.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-experience-internalization-collapse',
      description: 'Both concern moving experience from prompt space into parameters; this names the degradation mode that per-episode parametric internalization must guard against when weight updates hurt generalization.',
    },
    {
      type: 'analogy',
      targetId: 'agent-in-weight-skill',
      description: 'Both store learned behavior in the weights rather than the context; in-weight skill bakes durable capability offline, whereas parametric memory performs transient per-episode online adaptation.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

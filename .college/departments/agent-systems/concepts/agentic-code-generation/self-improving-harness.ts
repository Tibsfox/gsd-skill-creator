/**
 * Agent Self-Improving Harness concept — agent-systems agentic-code-generation wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.09498 (2026).
 *
 * @module departments/agent-systems/concepts/agentic-code-generation/self-improving-harness
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 5 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const selfImprovingHarness: RosettaConcept = {
  id: 'agent-self-improving-harness',
  name: 'Agent Self-Improving Harness',
  domain: 'agent-systems',
  description: 'Agent Self-Improving Harness is a paradigm in which an LLM agent rewrites its own model-specific operating harness — the scaffolding of prompts, tool wiring, and control flow that mediates its interaction with the environment — instead of relying on human engineers or a stronger external agent to hand-tune it. Introduced in Self-Harness (arXiv:2606.09498 (2026)), the mechanism is an iterative three-stage loop: Weakness Mining inspects execution traces to surface model-specific failure patterns; Harness Proposal generates diverse yet minimal harness edits, each tied to a specific mined failure; and Proposal Validation accepts a candidate edit only if it survives regression testing against prior tasks. Starting from a deliberately minimal harness on Terminal-Bench-2.0, the loop lifts held-out pass rates across three unrelated base models — MiniMax M2.5 from 40.5% to 61.9%, Qwen3.5-35B-A3B from 23.8% to 38.1%, and GLM-5 from 42.9% to 57.1% — and qualitative analysis shows the edits are concrete, executable changes targeting each model\'s idiosyncratic weaknesses rather than generic boilerplate instructions. Distinct from Harness as Substrate, which treats the harness as a fixed, human-authored layer that unidirectionally shapes the agent, this concept closes the loop: the agent participates in reshaping the very substrate that shapes it, making the harness a mutable artifact under the agent\'s own control. For building agent systems, the implication is that harness engineering need not be redone by hand for every new or updated model — a self-improvement loop with a regression gate can specialize one minimal harness to each model\'s quirks — but only if you invest in trace capture and a held-out validation set, since without the regression gate the loop would happily overfit or silently regress.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'The core loop is small: run the current harness over a task batch, log traces, then mine → propose → validate. A sketch: while True: traces = run(agent, harness, train_tasks); weaknesses = mine_failures(traces); proposals = propose_edits(harness, weaknesses); harness = max((apply(harness, p) for p in proposals), key=lambda h: regression_score(h, holdout_tasks), default=harness) — but only keep a proposal if regression_score(candidate) >= regression_score(current), i.e. the gate is a hard non-regression check, not a bare argmax. The load-bearing engineering pieces are (1) durable trace capture keyed by task, (2) a stable held-out set the mining loop never trains on, and (3) constraining Harness Proposal to minimal diffs so each accepted edit maps back to one mined failure, keeping the harness auditable.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-harness-as-substrate',
      description: 'The explicit contrast: Harness as Substrate frames the harness as a fixed, human-authored layer that shapes the agent one way, whereas Self-Improving Harness lets the agent rewrite that substrate from its own execution traces, closing the loop between agent and harness.',
    },
    {
      type: 'dependency',
      targetId: 'agent-held-out-evolution-gate',
      description: 'The Proposal Validation stage is exactly a held-out evolution gate: candidate harness edits are accepted only after passing regression testing, and improvement is measured on held-out pass rates, so the self-improvement loop depends on a held-out acceptance gate to avoid overfitting or silent regression.',
    },
    {
      type: 'analogy',
      targetId: 'agent-trace-to-skill-induction',
      description: 'Weakness Mining is analogous to trace-to-skill induction: both segment captured execution traces to distill reusable improvements — here concrete harness edits rather than skills — turning observed failure patterns into structured, executable artifacts.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-capability-controlled-self-evolution',
      description: 'Both concepts are self-evolving agents governed by an acceptance criterion; Self-Improving Harness evolves the operating harness under a regression gate rather than evolving skills or weights under a capability bound, sharing the pattern of gated, autonomous self-modification.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

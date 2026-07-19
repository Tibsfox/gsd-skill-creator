/**
 * Agent Code Uncertainty Axes concept — agent-systems agentic-code-generation wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.09577 (2026).
 *
 * @module departments/agent-systems/concepts/agentic-code-generation/code-uncertainty-axes
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 23 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const codeUncertaintyAxes: RosettaConcept = {
  id: 'agent-code-uncertainty-axes',
  name: 'Agent Code Uncertainty Axes',
  domain: 'agent-systems',
  description: 'Agent Code Uncertainty Axes is a code-specific uncertainty estimation (UE) method that rejects the common practice of porting natural-language UE signals directly onto code generation. It decomposes a code generator\'s uncertainty into three orthogonal axes, each reflecting a property that makes code distinct from prose: lexical uncertainty (Top-K token entropy), which captures token fragility, since a single wrong token can break an entire program; algorithmic uncertainty (pseudo-code consistency), which captures the intent-code gap, since a model\'s stated algorithmic intent and its concrete implementation can disagree independently; and functional uncertainty (behavioral consistency), which captures executability, since programs, unlike sentences, can be run and their outputs compared. Ensembling the three axes, arXiv:2606.09577 (2026) reports average AUROC for selective prediction rising from 0.696 for the strongest NL-derived baseline to 0.776 (+8.1 points) across five code LLMs; notably, on Qwen3-14B a single-pass Top-K token entropy matches the strongest multi-pass baseline while being over 3x cheaper. Distinct from Execution-Grounded Selection, which runs multiple candidate programs and clusters them by behavioral fingerprint to PICK the best output, this mechanism scores the uncertainty of one generation so an agent can abstain, defer to human review, or gate a downstream tool call; it answers "should I trust this program?" rather than "which of these programs is best?". For agent systems the payoff is a cheap, decomposable abstention signal: a code-writing agent can run the lexical axis as a near-free early filter and reserve the expensive functional axis for high-stakes edits, wiring selective prediction into human-in-the-loop review and autonomous accept/reject decisions instead of silently shipping wrong code.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Implement the ensemble as three independent scorers over one generation. Lexical: from the per-token logits, take Top-K softmax and average token-level entropy H = -sum(p*log p) across the emitted sequence (single forward pass, near-free). Algorithmic: prompt the model to emit pseudo-code for the same task, then measure agreement between pseudo-code and concrete implementation (e.g., embedding or judge consistency over multiple samples). Functional: execute the program on generated or fuzzed inputs and measure output/behavioral consistency across samples. Normalize each axis to a comparable scale, then combine (mean or learned weights) into one uncertainty score; threshold it for selective prediction — abstain or route to human review when uncertainty exceeds the operating point that maximizes AUROC on a held-out set.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-execution-grounded-selection',
      description: 'Both use behavioral/executability signals over generated code, but this concept scores the uncertainty of a single generation for abstention whereas Execution-Grounded Selection clusters multiple candidates to pick a winner; the functional axis here is the measurement analogue of that selection\'s behavioral fingerprint.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-silent-failure-taxonomy',
      description: 'Silently-wrong programs are exactly the failure mode this three-axis UE aims to surface; a well-calibrated abstention signal is the detection layer that lets an agent catch the silent-failure classes the taxonomy enumerates before they reach production.',
    },
    {
      type: 'analogy',
      targetId: 'agent-cost-aware-speculation',
      description: 'Like cost-aware speculation, this method exploits a cheap fast path — single-pass Top-K token entropy at over 3x lower cost — reserving the expensive multi-pass functional axis for cases where the cheap lexical signal is inconclusive or the edit is high-stakes.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

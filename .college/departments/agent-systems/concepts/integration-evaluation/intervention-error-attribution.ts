/**
 * Agent Intervention Error Attribution concept — agent-systems integration-evaluation wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.09071 (2026).
 *
 * @module departments/agent-systems/concepts/integration-evaluation/intervention-error-attribution
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 16 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const interventionErrorAttribution: RosettaConcept = {
  id: 'agent-intervention-error-attribution',
  name: 'Agent Intervention Error Attribution',
  domain: 'agent-systems',
  description: 'Agent Intervention Error Attribution is a technique for locating the single step responsible for a silent failure in a long plan-and-execute LLM agent trace — a trace that ran to completion and returned a plausible-looking answer that is nonetheless wrong. Rather than treating attribution as a one-shot prediction, it runs a closed loop: it diagnoses a candidate error step, constructs a diagnosis-specific patch for exactly that step, replays the trace with the patch applied, and then reads the outcome. If patching the suspected step flips the task result from wrong to right, that verified outcome-flip becomes contrastive evidence that is fed back to refine the attribution itself — sharpening or moving the blame — instead of merely confirming a guess. Introduced as REFLECT in arXiv:2606.09071 (2026), which reports the highest localization accuracy among same-auditor methods across all four localization benchmarks it tested (multi-hop reasoning across domains), with the largest gains on structured tool-use traces, and crucially remains actionable even when a ground-truth answer is unavailable, because the outcome-flip is self-verifying. Distinct from Counterfactual Utility, which measures a step\'s marginal contribution by removing or ablating it to score value; here the intervention is a corrective patch whose measured effect is looped back to revise where blame is assigned, not to rank steps by importance. The implication for agent systems is that error attribution should be an active, intervention-grounded procedure wired into the execution harness — replay-with-patch as a first-class debugging primitive — so that post-hoc auditors produce verified, self-checking localizations rather than confident but unfalsifiable accusations against a step.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Implement the loop as a replay-with-patch primitive over a recorded trace: diagnose(trace) -> candidate_step; patched = trace.replace_step(candidate_step, make_patch(diagnosis)); result = replay(patched); if result.flipped_to_correct(): attribution = refine(attribution, evidence=(trace.outcome, result.outcome)). The harness must support deterministic replay from a step boundary (pin tool responses / RNG upstream of the patch) so the observed flip is attributable to the patch alone, and the flip check works even with no ground-truth answer because a self-consistent success signal suffices.',
    }],
  ]),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-silent-failure-taxonomy',
      description: 'Operates specifically in the silent-failure regime this taxonomy defines — completed traces that return plausible-but-wrong answers — using it to characterize the failure class it must localize.',
    },
    {
      type: 'analogy',
      targetId: 'agent-counterfactual-utility',
      description: 'Both intervene on a single step and read the downstream effect, but this one applies a corrective patch and feeds the verified outcome-flip back to refine blame, whereas Counterfactual Utility ablates a step to score its marginal value.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Shares the contrastive-trace-pair idea for auditing, generating the patched-versus-original replay pair as the evidence that sharpens attribution.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

/**
 * Inherited Circuit Evasion concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.27091 (2026).
 *
 * @module departments/ai-computation/concepts/inherited-circuit-evasion
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const inheritedCircuitEvasion: RosettaConcept = {
  id: 'ai-computation-inherited-circuit-evasion',
  name: 'Inherited Circuit Evasion',
  domain: 'ai-computation',
  description: 'Inherited Circuit Evasion names a fine-tuning failure mode in which task-specialization sharpens an attention circuit the model already inherited from its base, collapsing distributed semantic classification into brittle token-level indicator rules that pass in-distribution evaluation yet shatter under behavior-preserving input transformations. In arXiv:2606.27091 (2026), causal interventions on Foundation-Sec-8B-Instruct and its base Llama-3.1-8B-Instruct localize PowerShell malicious-command classification to a late-attention route that fine-tuning did not create but concentrated and semantically specialized: baseline accuracy rises while the model becomes sensitive to surface rewrites. A three-tier evasion benchmark shows Foundation-Sec, but not Llama, misses on PowerShell alias substitution (iwr), Invoke-Expression command reconstruction, and case-mutated Invoke-Expression/IEX variants — transformations that preserve behavior but flip the token indicators the fine-tune learned to key on. The paper derives a pre-deployment monitor from canonical inputs alone: a linear probe at the classification boundary plus an indicator-token sign test flag command families where canonical indicators change role after fine-tuning, prioritizing red-team variant generation without needing the attack variants in advance. Distinct from Alignment Drift, which tracks a model\'s safety degrading across training or deployment, Inherited Circuit Evasion is a case where measured task accuracy improves while the evasion surface silently expands — the danger is invisible precisely because held-out accuracy looks better. For agent systems, the implication is that any small task-specific fine-tune used as a security or safety classifier must be evaluated against the full behavior-preserving transformation space of its task, not just held-out samples, and its inherited circuits monitored for semantic drift; treating a specialized fine-tune as straightforwardly safer than its base is unjustified.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'ai-computation-lineage-inherited-truthful-heads',
      description: 'Both describe functional circuitry inherited from the base model that fine-tuning specializes rather than creates; here the inherited late-attention route is concentrated into brittle indicator rules instead of preserving truthful-head behavior.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-activation-delta-probe',
      description: 'The pre-deployment monitor — a linear probe at the classification boundary plus an indicator-token sign test — is a same-family activation-based detector of fine-tuning-induced representational change, operating on canonical inputs alone.',
    },
    {
      type: 'dependency',
      targetId: 'ai-computation-task-specific-knowledge-localization',
      description: 'Diagnosing the evasion surface depends on causal-intervention localization to pin the classification decision to a specific late-attention circuit, the same localization machinery this concept relies on.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'Contrast case: unlike alignment drift where safety degrades, task accuracy here improves while the attack surface expands, making the vulnerability invisible to standard held-out evaluation.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

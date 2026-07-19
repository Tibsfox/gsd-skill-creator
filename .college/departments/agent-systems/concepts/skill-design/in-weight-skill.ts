/**
 * In Weight Skill -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/in-weight-skill
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 59 * 2 * Math.PI / 85;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const inWeightSkill: RosettaConcept = {
  id: "agent-in-weight-skill",
  name: "In Weight Skill",
  domain: 'agent-systems',
  description:
    "Prompt-injected skills cost tokens every step, sit in context as plaintext, and enlarge the exposed surface. The in-weight skill approach (arXiv:2606.06087) stores each reusable skill not as text but as a plug-and-play LoRA adapter generated on demand by a pretrained hypernetwork. Loading a skill becomes attaching its adapter to the base model rather than prepending instructions, so behavior lives in weight space: no per-step skill tokens, no plaintext exposure, yet adapters stay modular—loadable, scalable, and composable. Composition here is concrete: the generated skill LoRAs form a structured semantic geometry, are controlled through the LoRA scaling coefficient, and combine through parameter-space arithmetic when their components are aligned—weight-space composition rather than text concatenation. The efficiency is measured, not asserted: on ALFWorld this beats the in-context skill baseline by +21.4 and +13.4 points on the seen and unseen splits while using 64.1% fewer prefill tokens, and lifts Search-QA exact match by +3.0 at 72.2% lower skill-token overhead. This decouples a skill's runtime cost and confidentiality from its content while preserving the artifact model of skills.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Specializes the skill-as-artifact idea: the loadable, composable artifact becomes a weight-space LoRA adapter rather than a text or prompt bundle, so it is attached to the model instead of read into context.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-internalization",
      description: "Both move skill behavior out of the prompt and into the model, but in-weight skill keeps the behavior in a detachable hypernetwork-generated adapter rather than baking it irreversibly into the base weights.",
    },
    {
      type: "analogy",
      targetId: "agent-skill-ir-compilation",
      description: "Analogous compilation move: a text skill is transformed into a compact non-prompt form executed instead of re-read—an intermediate representation there, adapter weights here—trading readability for cheaper, repeatable invocation.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-kv-cache",
      description: "Both remove the cost of re-injecting skill tokens each step; the KV-cache approach caches the skill's in-context representation, while in-weight skill drops it from context entirely by encoding the skill in adapter weights.",
    },
    {
      type: "cross-reference",
      targetId: "agent-federated-skill-evolution",
      description: "Federated skill evolution defines a non-text skill unit (the shareable diff-patch) that parallels this concept's weight-adapter unit; the two together frame the design axis of how a skill is represented when it moves between agents. Reciprocates the sibling pairing.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

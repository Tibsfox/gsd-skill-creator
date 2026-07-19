/**
 * Skill Resource Supply-Chain Attack -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/skill-resource-supply-chain
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 103 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillResourceSupplyChain: RosettaConcept = {
  id: "agent-skill-resource-supply-chain",
  name: "Skill Resource Supply-Chain Attack",
  domain: 'agent-systems',
  description:
    "A skill bundles a natural-language spec (SKILL.md) with executable scripts, data, and tool bindings, opening a supply-chain attack surface that lives in the AUXILIARY RESOURCES, not the prose. The spine here is PhantomSkill (arXiv 2606.19191, 2026), which hides malice in a skill's scripts rather than its description: its VulMask technique rewrites overt malicious scripts into vulnerability-shaped implementations whose behavior activates only under attacker-controlled trigger conditions, shifting the visible signal from explicit malicious intent to ordinary-looking insecure code and thereby preserving benign utility while reducing both warning- and malware-level detection versus overt payloads. A separate, companion study — SkillMutator (arXiv 2606.14154, 2026) — independently frames the paired language-and-code cross-modal surface, where an ostensibly benign SKILL.md conceals implicit directives that steer harmless-looking scripts to exfiltrate sensitive data; it reports that open-source skill scanners detect only 2-8% of such attacks and commercial scanners only 9-17%. Together these argue that assessing skill safety requires cross-modal reasoning over prose AND code, plus resource-level vetting and execution-time containment that treat exploitable vulnerabilities in a skill as potential payloads. Distinct from prompt-injection-only and static-code-only views, and from temporal benign-then-mutates poisoning.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-self-mutating-poisoning",
      description: "The temporal benign-then-mutates poisoning threat and this resource/cross-modal install-surface vector are distinct attacks that both defeat static-text inspection of the SKILL.md.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-permission-dual-plane",
      description: "Resource-level vetting is precisely what the dual-plane permission manifest must cover — the code and data plane of a skill, not only its prose.",
    },
    {
      type: "cross-reference",
      targetId: "skill-injection-guardian",
      description: "The shipped static-inspection defense operates on text; cross-modal language-and-code attacks require it to reason over a skill's auxiliary scripts and resources as well.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

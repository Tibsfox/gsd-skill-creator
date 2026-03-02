import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const argumentStructure: RosettaConcept = {
  id: 'crit-argument-structure', name: 'Argument Structure', domain: 'critical-thinking',
  description: 'A logical argument has premises (supporting reasons) and a conclusion (claim being supported). Identifying the structure means asking: What is being concluded? What reasons are given? Mapping arguments visually (premise-conclusion diagrams) clarifies structure and reveals hidden premises. Most everyday arguments are missing premises (enthymemes) that must be made explicit to evaluate.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-deductive-reasoning', description: 'Argument structure is evaluated differently for deductive versus inductive arguments' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};

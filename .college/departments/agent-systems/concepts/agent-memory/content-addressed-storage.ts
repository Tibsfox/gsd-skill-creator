import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const contentAddressedStorage: RosettaConcept = {
  id: 'agent-content-addressed-storage',
  name: 'Content-Addressed Storage',
  domain: 'agent-systems',
  description:
    'Records are keyed by the hash of their content rather than by a mutable name or auto-generated id. The Grove ' +
    'format (`docs/GROVE-FORMAT.md`) is the substrate used by gsd-skill-creator; the 2026 Zhou et al. survey of ' +
    'agent-skill artifacts (arxiv `2605.07358v1`) reinforces content addressing as the right base for skills, agents, ' +
    'teams, and chipsets. Three properties matter operationally: (a) byte-identity — same content always hashes to ' +
    'the same record, enabling natural deduplication across machines and tools; (b) immutability — once a record is ' +
    'in the store, edits become new records with parent_hashes linking to the predecessor; (c) verifiability — every ' +
    'reference can be checked against its target by recomputing the hash. The substrate is what makes typed manifests, ' +
    'audit history, and cross-tool sharing tractable.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-skill-as-artifact',
      description: 'A skill artifact is a typed content-addressed record on this substrate',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-engram-maturation',
      description: 'Memory engrams are content-addressed records with activation/tier metadata',
    },
    {
      type: 'analogy',
      targetId: 'git-content-addressing',
      description: 'Grove records are to skills/agents/teams as git blobs are to source-tree content',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, -0.4),
  },
};

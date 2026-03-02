import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const computerArchitecture: RosettaConcept = {
  id: 'tech-computer-architecture',
  name: 'Computer Architecture',
  domain: 'technology',
  description:
    'Computer architecture describes how hardware components work together to execute programs. ' +
    'Von Neumann architecture: CPU (fetch-decode-execute cycle), memory (RAM + storage), and I/O. ' +
    'CPU components: ALU (arithmetic), control unit, registers, and cache. ' +
    'Clock speed (GHz), core count, instruction set (x86, ARM), and memory bandwidth determine performance. ' +
    'Understanding architecture explains why some operations are fast (register operations) and others slow (disk I/O).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-binary-data',
      description: 'Computer architecture is the physical system that processes binary data at hardware level',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};

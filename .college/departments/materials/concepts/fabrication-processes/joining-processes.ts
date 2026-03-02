import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const joiningProcesses: RosettaConcept = {
  id: 'mfab-joining-processes',
  name: 'Joining Processes',
  domain: 'materials',
  description:
    'Joining connects separate components into assemblies. ' +
    'Welding uses heat or pressure to fuse metals; MIG, TIG, and spot welding are common processes. ' +
    'Brazing and soldering use lower-temperature filler metals. ' +
    'Adhesive bonding distributes loads over large areas and joins dissimilar materials. ' +
    'Mechanical fasteners (bolts, rivets) allow disassembly. ' +
    'The correct joining method depends on material compatibility, strength requirements, accessibility, cost, and whether the joint must be disassembled.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-metals-alloys',
      description: 'Welding metallurgy requires understanding how heat affects microstructure in the heat-affected zone',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};

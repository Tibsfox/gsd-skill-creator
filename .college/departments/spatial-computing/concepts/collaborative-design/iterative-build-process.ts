import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const iterativeBuildProcess: RosettaConcept = {
  id: 'spatial-iterative-build-process',
  name: 'Iterative Build Process',
  domain: 'spatial-computing',
  description:
    'The iterative build process mirrors agile engineering development: build a minimal version, ' +
    'evaluate it, tear it down or modify it, and rebuild better. ' +
    'Version 0 (prototype): place the rough shape in dirt or cobblestone to test scale and proportion. ' +
    'Stand back (shift + moving away, or switching to spectator mode) to view at realistic scale. ' +
    'Version 1 (functional): replace prototype blocks with final materials, add doors and windows, ' +
    'ensure the space is functional before decoration. ' +
    'Version 2 (detailed): add depth (recessed windows, protruding ledges), lighting, vegetation, ' +
    'and environmental details. Version 3+ (polish): player feedback informs further refinement. ' +
    'The willingness to demolish and rebuild is the hallmark of experienced builders -- ' +
    '"Build. Evaluate. Improve." is the Minecraft engineering mindset. ' +
    'World backups between major iterations function as save states enabling fearless experimentation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'spatial-blueprint-design',
      description: 'Iterative process starts with blueprint design and proceeds through progressive refinement',
    },
    {
      type: 'cross-reference',
      targetId: 'spatial-role-specialization',
      description: 'Iteration cycles require coordination between roles -- architect reviews trigger builder revision cycles',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.72,
    magnitude: Math.sqrt(0.45 ** 2 + 0.72 ** 2),
    angle: Math.atan2(0.72, 0.45),
  },
};

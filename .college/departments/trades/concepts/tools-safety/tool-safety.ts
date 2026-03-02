import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const toolSafety: RosettaConcept = {
  id: 'trade-tool-safety',
  name: 'Tool Safety',
  domain: 'trades',
  description:
    'Tool safety is not about following rules -- it is about understanding why each rule exists ' +
    'as codified wisdom from injuries. Hand tool safety: always cut away from your body; ' +
    'keep tools sharp (dull tools require more force and slip more); store tools with edges ' +
    'covered or pointed away from hands. Power tool safety: disconnect from power before ' +
    'blade/bit changes; wear appropriate PPE for each tool; never bypass safety guards. ' +
    'Personal protective equipment hierarchy: eye protection (safety glasses) for all power tool ' +
    'use; hearing protection above 85 dB sustained (circular saw = 110 dB at operator position); ' +
    'dust mask (N95 minimum) for wood dust and drywall; gloves for rough materials but NEVER ' +
    'with rotating equipment (gloves can be caught). ' +
    'Workshop organization: clear pathways, labeled storage, fire extinguisher accessible, ' +
    'first aid kit stocked. Safety culture: speak up when something feels wrong; ' +
    'the expert who never had an accident is still learning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-woodworking-basics',
      description: 'Tool safety is the prerequisite for all woodworking and trades work',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.25 + 0.01),
    angle: Math.atan2(0.1, 0.5),
  },
};

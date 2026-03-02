import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const corporationsLlcs: RosettaConcept = {
  id: 'bus-corporations-llcs',
  name: 'Corporations & LLCs',
  domain: 'business',
  description:
    'Corporations are legal entities separate from their owners, providing limited liability protection. ' +
    'Shareholders own shares but are not personally liable for business debts. ' +
    'C-corporations face double taxation (corporate + dividend); S-corporations and LLCs avoid this through pass-through taxation. ' +
    'Limited Liability Companies (LLCs) combine partnership flexibility with corporate liability protection. ' +
    'Choice of entity affects taxes, liability, governance, and ability to raise investment capital.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-sole-proprietorship',
      description: 'Corporations and LLCs were created to solve the unlimited liability problem of sole proprietorships',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};

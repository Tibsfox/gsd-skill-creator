import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const plumbingBasics: RosettaConcept = {
  id: 'trade-plumbing-basics',
  name: 'Plumbing Basics',
  domain: 'trades',
  description:
    'Residential plumbing has two systems: supply (pressurized, delivers fresh water) and ' +
    'drain-waste-vent (DWV, gravity-fed, removes waste). Supply pipes: copper, CPVC, or PEX; ' +
    'typically 3/4" main line reducing to 1/2" branch lines. ' +
    'DWV pipes: ABS or PVC; slope at 1/4" per foot minimum for proper drainage. ' +
    'P-traps hold water that blocks sewer gases; they must always remain filled. ' +
    'Common repairs: dripping faucet (worn washer or cartridge), running toilet ' +
    '(flapper not sealing; fill valve not shutting off), slow drain (partial clog -- ' +
    'plunger first, drain snake second, chemical last due to pipe damage risk). ' +
    'Water shutoff: know the location of main shutoff and individual fixture shutoffs ' +
    'before any repair -- turn off water before loosening any fitting. ' +
    'Water pressure: residential target 40-80 PSI; above 80 PSI causes wear on fixtures; ' +
    'pressure reducing valve (PRV) regulates it. ' +
    'Hot water heater maintenance: flush sediment annually (extends life), set to 120°F ' +
    '(prevents scalding and reduces energy use).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-tool-safety',
      description: 'Plumbing repairs require the tool safety mindset applied to water and pipe work',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const contractBasics: RosettaConcept = {
  id: 'bus-contract-basics',
  name: 'Contract Basics',
  domain: 'business',
  description:
    'A contract is a legally enforceable agreement between parties. ' +
    'Essential elements: offer, acceptance, consideration (exchange of value), mutual assent, capacity, and legality. ' +
    'Contracts may be oral or written, though many types (real estate, year-plus performance) require writing. ' +
    'Breach occurs when a party fails to perform; remedies include damages, specific performance, and rescission. ' +
    'Understanding contract basics is foundational for every business activity.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};

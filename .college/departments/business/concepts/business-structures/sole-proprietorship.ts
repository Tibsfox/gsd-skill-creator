import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const soleProprietorship: RosettaConcept = {
  id: 'bus-sole-proprietorship',
  name: 'Sole Proprietorships & Partnerships',
  domain: 'business',
  description:
    'Sole proprietorships are businesses owned and operated by one person — the simplest form with no ' +
    'legal separation between owner and business. Unlimited personal liability: business debts are the owner\'s debts. ' +
    'Partnerships involve two or more owners sharing profits, losses, and management. ' +
    'General partners have unlimited liability; limited partners have liability only up to their investment. ' +
    'Both forms avoid corporate tax but expose owners to personal risk.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};

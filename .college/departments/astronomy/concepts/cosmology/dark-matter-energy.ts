import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const darkMatterEnergy: RosettaConcept = {
  id: 'astro-dark-matter-energy',
  name: 'Dark Matter & Dark Energy',
  domain: 'astronomy',
  description:
    'The standard cosmological model (ΛCDM) holds that ordinary (baryonic) matter comprises only ' +
    '5% of the universe\'s energy content. Dark matter (27%) is inferred from multiple independent ' +
    'observations: galaxy rotation curves (Vera Rubin: outer stars orbit too fast for visible mass), ' +
    'gravitational lensing (mass bending light exceeds visible matter), cluster dynamics (Zwicky, ' +
    '1933: Coma Cluster galaxies move too fast), and large-scale structure formation (simulations ' +
    'require dark matter to produce observed filament structures). Dark matter candidates include ' +
    'WIMPs (weakly interacting massive particles), axions, and sterile neutrinos — none confirmed. ' +
    'Dark energy (68%) is inferred from the accelerating expansion of the universe (Perlmutter, ' +
    'Riess, Schmidt — 2011 Nobel Prize), most simply modeled as the cosmological constant (Λ) — ' +
    'a uniform energy density of space itself. The nature of both dark matter and dark energy ' +
    'remain the most pressing open problems in fundamental physics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-big-bang',
      description: 'Dark matter and energy are required components of the Big Bang cosmological model to match observed structure formation and expansion rates',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-nuclear-physics',
      description: 'Particle physics provides the theoretical framework for dark matter candidate particles',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.04 + 0.64),
    angle: Math.atan2(0.8, 0.2),
  },
};

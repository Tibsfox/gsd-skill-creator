import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const handTools: RosettaConcept = {
  id: 'tech-hand-tools',
  name: 'Hand Tools',
  domain: 'technology',
  description:
    'Hand tools are powered by the user\'s physical effort and amplify, direct, or transform that effort. ' +
    'Categories: cutting tools (saws, chisels, scissors), fastening tools (hammers, screwdrivers, wrenches), ' +
    'measuring tools (rules, calipers, squares), and finishing tools (planes, rasps, sandpaper). ' +
    'Safe and effective hand tool use requires understanding force vectors, leverage, cutting geometry, ' +
    'and wood/material grain direction. Hand tool competence is foundational for all fabrication work.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};

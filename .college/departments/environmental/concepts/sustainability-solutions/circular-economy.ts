import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const circularEconomy: RosettaConcept = {
  id: 'envr-circular-economy',
  name: 'Circular Economy and Sustainability',
  domain: 'environmental',
  description: 'The circular economy reimagines the linear "take-make-dispose" model as a circular system of reuse and regeneration. ' +
    'Linear economy: extract resources → manufacture → use → discard. Inherently wasteful. ' +
    'Circular principles: design out waste, keep products and materials in use, regenerate natural systems. ' +
    'Product life extension: repair, remanufacture, refurbish -- keeping products in use longer reduces material demand. ' +
    'Industrial symbiosis: one industry\'s waste becomes another\'s input (Kalundborg, Denmark). ' +
    'Cradle-to-cradle design (McDonough & Braungart): products designed from the start for disassembly and reuse. ' +
    'Degrowth debate: can sustainability be achieved with economic growth? Or does material throughput always scale with GDP? ' +
    'Personal circular practices: secondhand clothing, repair, food waste reduction, product sharing -- aggregate effects can be significant. ' +
    'Policy tools: extended producer responsibility, deposit-refund systems, landfill taxes -- make linear economy more costly.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-pollution',
      description: 'Circular economy directly addresses waste and pollution -- closing loops prevents linear disposal externalities',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-capitalism-market-economy',
      description: 'Circular economy challenges the growth imperative of capitalism -- it proposes value creation through resource productivity rather than throughput',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

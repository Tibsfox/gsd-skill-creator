import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const climateChangeEvidence: RosettaConcept = {
  id: 'envr-climate-change-evidence',
  name: 'Climate Change Evidence and Attribution',
  domain: 'environmental',
  description: 'The evidence for anthropogenic climate change converges across multiple independent lines of inquiry. ' +
    'Temperature records: global average surface temperature has risen ~1.1°C since pre-industrial times (IPCC AR6, 2021). ' +
    'Ice cores: trapped air bubbles provide 800,000 years of CO₂ and temperature records -- clear correlation. ' +
    'Sea level rise: 20 cm since 1900, accelerating -- from thermal expansion and ice melt. ' +
    'Arctic sea ice: September minimum extent has declined ~13% per decade since 1979. ' +
    'Ocean heat content: oceans have absorbed ~90% of excess heat from the enhanced greenhouse effect. ' +
    'Attribution science: climate models can detect human fingerprints -- without anthropogenic forcing, observed warming cannot be explained. ' +
    'Scientific consensus: 97%+ of actively publishing climate scientists agree that humans are causing current warming. ' +
    'Tipping points: nonlinear thresholds beyond which changes become self-sustaining -- West Antarctic Ice Sheet, Amazon dieback, permafrost thaw.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-atmosphere-layers',
      description: 'Climate change evidence confirms the greenhouse effect predictions from atmospheric physics',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Climate attribution uses statistical hypothesis testing to determine whether observed changes are consistent with natural variability or require human forcing',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

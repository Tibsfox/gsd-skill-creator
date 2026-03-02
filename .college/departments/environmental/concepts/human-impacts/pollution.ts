import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pollution: RosettaConcept = {
  id: 'envr-pollution',
  name: 'Pollution and Environmental Health',
  domain: 'environmental',
  description: 'Pollution is the introduction of harmful substances or contaminants into the environment at rates that cause harm. ' +
    'Air pollution: particulate matter (PM2.5), ozone, NO₂, SO₂ from vehicles, industry, agriculture. 7 million premature deaths/year globally (WHO). ' +
    'Water pollution: nutrients (nitrogen, phosphorus) from agriculture cause algal blooms and hypoxic zones. Industrial chemicals, pharmaceuticals, microplastics. ' +
    'Microplastics: plastic particles <5mm found in ocean water, deep sea sediments, Arctic ice, human blood, and breast milk. ' +
    'Soil contamination: heavy metals, pesticides, industrial chemicals persist and bioaccumulate up food chains. ' +
    'Bioaccumulation and biomagnification: persistent chemicals accumulate in organisms and concentrate up the food chain (DDT, mercury in tuna). ' +
    'Point source vs. non-point source pollution: factory discharge (point) vs. agricultural runoff (non-point) -- different regulatory approaches. ' +
    'Environmental justice: pollution facilities are disproportionately located in low-income communities and communities of color. ' +
    'Noise pollution: underappreciated environmental stressor affecting wildlife behavior and human health.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-ecosystem-structure',
      description: 'Pollution disrupts ecosystem structure -- toxic chemicals alter species interactions, kill off populations, and trigger cascade effects',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Pollution is the classic negative externality -- polluters impose costs on society that are not reflected in market prices',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const atmosphericChemistry: RosettaConcept = {
  id: 'chem-atmospheric-chemistry',
  name: 'Atmospheric Chemistry',
  domain: 'chemistry',
  description: 'Atmospheric chemistry studies reactions occurring in the air. The stratospheric ozone layer absorbs UV radiation via a natural photochemical cycle; CFCs catalytically destroy ozone. Greenhouse gases (CO₂, CH₄, N₂O) trap infrared radiation causing climate change. Air pollutants (NOₓ, SO₂) cause acid rain and photochemical smog through complex reaction chains.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-reaction-types', description: 'Atmospheric reactions include photochemical, free-radical, and catalytic reaction types' },
    { type: 'cross-reference', targetId: 'geo-climate-change-science', description: 'Atmospheric chemistry underlies the greenhouse effect and climate change science' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.55, magnitude: Math.sqrt(0.36 + 0.3025), angle: Math.atan2(0.55, 0.6) },
};

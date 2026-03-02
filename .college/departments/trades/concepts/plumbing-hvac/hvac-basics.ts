import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hvacBasics: RosettaConcept = {
  id: 'trade-hvac-basics',
  name: 'HVAC Basics',
  domain: 'trades',
  description:
    'Heating, Ventilation, and Air Conditioning (HVAC) systems control thermal comfort and air ' +
    'quality. Forced-air systems: furnace heats air; air handler distributes through ductwork; ' +
    'filter removes particulates (MERV rating indicates efficiency). Heat pumps: refrigeration ' +
    'cycle run in reverse extracts heat from outdoor air (even at low temperatures) and moves it ' +
    'indoors — highly efficient, especially in moderate climates. Refrigeration cycle: compressor ' +
    '→ condenser (heat rejection outside) → expansion valve → evaporator (heat absorption inside). ' +
    'SEER (Seasonal Energy Efficiency Ratio) and AFUE (Annual Fuel Utilization Efficiency) rate ' +
    'cooling and heating efficiency. Ductwork design: supply and return balance is critical — ' +
    'blocked returns cause negative pressure and back-drafting. Maintenance tasks homeowners can ' +
    'perform: filter replacement (every 1-3 months), condensate drain cleaning (prevents water ' +
    'damage), clearing outdoor condenser of debris. HVAC work beyond filters and thermostat ' +
    'replacement requires certification (EPA 608 for refrigerant handling).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-plumbing-basics',
      description: 'HVAC and plumbing share condensate lines, hydronic heating systems, and code inspection requirements',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-waves-sound-light',
      description: 'Heat transfer principles (conduction, convection, radiation) from physics underlie HVAC thermal dynamics',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};

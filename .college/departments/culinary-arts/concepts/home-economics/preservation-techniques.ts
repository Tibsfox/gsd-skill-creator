import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const preservationTechniques: RosettaConcept = {
  id: 'cook-preservation-techniques',
  name: 'Preservation Techniques',
  domain: 'culinary-arts',
  description: 'Four primary preservation methods extend food safety beyond normal storage times. ' +
    'Canning: heat processing combined with vacuum sealing kills pathogens; low-acid foods require ' +
    'pressure canning to prevent botulism (Clostridium botulinum thrives in anaerobic, low-acid ' +
    'environments). Freezing: halts bacterial growth at 0F (-18C); texture changes from ice ' +
    'crystal formation are minimized by flash-freezing (smaller crystals). Dehydrating: removes ' +
    'the moisture bacteria need to survive, typically at 125-135F (52-57C) for most foods. ' +
    'Fermenting: controlled bacterial or yeast cultures produce acids that preserve food -- ' +
    'sauerkraut, kimchi, yogurt, and pickles all rely on lactic acid fermentation creating an ' +
    'environment hostile to harmful bacteria.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-fermentation',
      description: 'Fermentation IS a preservation technique -- controlled microbial activity produces preserving acids',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-temperature-danger-zone',
      description: 'Preservation methods extend safe food life well beyond the 2-hour danger zone rule',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const foodSystemsSustainability: RosettaConcept = {
  id: 'nutr-food-sources-systems',
  name: 'Food Systems and Sustainability',
  domain: 'nutrition',
  description: 'Our food choices have profound environmental consequences -- the food system is responsible for ~30% of global greenhouse gas emissions. ' +
    'Food system: production → processing → distribution → retail → consumption → waste. Environmental impacts occur at every stage. ' +
    'Animal products: require 5-10x more land and produce 5-10x more GHG emissions per gram of protein than plant equivalents. ' +
    'EAT-Lancet Planetary Health Diet: a global dietary recommendation optimized for both human health and planetary boundaries. ' +
    'Food miles: the distance food travels from farm to consumer -- less important than what you eat (a local beefburger has higher emissions than imported tofu). ' +
    'Food waste: ~1/3 of all food produced globally is lost or wasted -- if food waste were a country, it would be the 3rd largest GHG emitter. ' +
    'Seasonal and local eating: reduces some emissions; supports regional food systems; improves freshness. ' +
    'Agroecology: farming practices that work with ecological processes -- intercropping, cover crops, reduced tillage, integrated pest management. ' +
    'Food sovereignty: the right of peoples to define their own food systems -- a critique of industrial food monocultures.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-whole-foods-processing',
      description: 'Whole foods are often less processed and therefore less resource-intensive -- processing adds energy cost at every step',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-deforestation-land-use',
      description: 'Food systems are the primary driver of land use change -- agriculture drives deforestation and habitat loss globally',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

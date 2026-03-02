import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pilgrimage: RosettaConcept = {
  id: 'theo-pilgrimage',
  name: 'Pilgrimage',
  domain: 'theology',
  description:
    'Pilgrimage — sacred journey to a holy site — appears across all major religious traditions ' +
    'as a transformative spiritual practice. Islamic hajj to Mecca is one of the Five Pillars, ' +
    'obligatory for able Muslims once in a lifetime: circumambulation of the Kaaba, standing at ' +
    'Arafat, and symbolic stoning of the devil. Hindu pilgrimage (yatra) to Varanasi, Vrindavan, ' +
    'and the Kumbh Mela involves ritual bathing in sacred rivers and circumambulation of temples. ' +
    'Christian pilgrimage routes: Santiago de Compostela (Camino), Rome (Via Francigena), Jerusalem ' +
    '(Holy Land), Lourdes (Marian apparition site). Jewish aliyah l\'regel — three festival ' +
    'pilgrimages to Jerusalem Temple (Pesach, Shavuot, Sukkot) — continued in modified form today. ' +
    'Buddhist pilgrimage to Bodh Gaya (site of enlightenment), Lumbini (birth), Sarnath (first ' +
    'teaching), and Kushinagar (death). Turner\'s anthropological concept of liminality explains ' +
    'pilgrimage as transition from ordinary to sacred time, marked by stripping social roles.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-ritual-practice',
      description: 'Pilgrimage is an extended ritual practice embodying the journey structure present in many religious ceremonies',
    },
    {
      type: 'analogy',
      targetId: 'theo-world-religions',
      description: 'Sacred journey practices reveal both universal religious patterns and tradition-specific meanings across world religions',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};

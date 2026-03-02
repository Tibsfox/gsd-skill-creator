import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const meaningPurpose: RosettaConcept = {
  id: 'theo-meaning-purpose',
  name: 'Meaning & Purpose',
  domain: 'theology',
  description:
    'The theological question of meaning asks why human existence matters and what gives life ' +
    'direction. Teleological frameworks ground meaning in divine purpose: humans are created for ' +
    'a specific end (telos) — for Aquinas, the beatific vision (union with God); for Islam, ' +
    'khalifah (stewardship/vice-regency on earth). Buddhist meaning involves liberation from ' +
    'suffering (dukkha) through the Eightfold Path — the absence of craving, not the presence of ' +
    'permanent happiness. Jewish meaning centers on covenant (brit) — being part of a chosen ' +
    'people with responsibilities toward God and humanity. Existentialist theology (Tillich, Buber) ' +
    'engages modern anxiety directly: ultimate concern (whatever functions as god for a person) ' +
    'and I-Thou relationship as the ground of authentic existence. Logotherapy (Viktor Frankl, ' +
    'Holocaust survivor): meaning is found even in unavoidable suffering through attitude. ' +
    'Religious meaning-making does not require certainty — doubt, questioning, and "dark nights of ' +
    'the soul" are documented as phases of deepening rather than loss of meaning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-theodicy',
      description: 'Questions of meaning are intensified by suffering — theodicy is the theological attempt to reconcile meaning with evil',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.04 + 0.64),
    angle: Math.atan2(0.8, 0.2),
  },
};

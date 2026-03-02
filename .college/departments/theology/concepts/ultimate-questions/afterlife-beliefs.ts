import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const afterlifeBeliefs: RosettaConcept = {
  id: 'theo-afterlife-beliefs',
  name: 'Afterlife Beliefs',
  domain: 'theology',
  description:
    'Eschatology encompasses beliefs about death, afterlife, and ultimate cosmic destiny. ' +
    'Christianity\'s range: bodily resurrection at final judgment (physical continuity), ' +
    'immediate soul survival and heaven/purgatory/hell, and universalism (all eventually saved). ' +
    'Islam: barzakh (waiting period after death), yawm al-qiyama (Day of Resurrection), Jannah ' +
    '(paradise) and Jahannam (hellfire) — determined by deeds and divine mercy. Hinduism: ' +
    'reincarnation (samsara) driven by karma; moksha (liberation from the cycle) as the ultimate ' +
    'goal — variously conceived as union with Brahman, dwelling with Vishnu, or blissful awareness. ' +
    'Buddhism: rebirth without a permanent self (anatman) — mental continuity carries karma; ' +
    'nirvana is cessation of craving and rebirth, not annihilation. Judaism: less doctrinal, ' +
    'with range from olam ha-ba (world to come) resurrection to focus on this-worldly ethics. ' +
    'Near-death experience research raises empirical questions about consciousness that traditional ' +
    'afterlife frameworks engage from different angles.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-theodicy',
      description: 'Afterlife beliefs often function as theological responses to suffering — promising future justice or liberation',
    },
    {
      type: 'analogy',
      targetId: 'theo-meaning-purpose',
      description: 'Conceptions of afterlife shape and are shaped by the meaning frameworks each tradition provides',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.0625 + 0.5625),
    angle: Math.atan2(0.75, 0.25),
  },
};

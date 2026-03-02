import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const abrahamicFaiths: RosettaConcept = {
  id: 'theo-abrahamic-faiths',
  name: 'Abrahamic Faiths',
  domain: 'theology',
  description:
    'Judaism, Christianity, and Islam share the patriarch Abraham as a common ancestor of faith, ' +
    'monotheism, and scriptural revelation. Judaism: covenantal relationship with YHWH through ' +
    'Torah; emphasis on this-worldly ethics, mitzvot (commandments), and communal memory; movements ' +
    'range from Orthodox to Reform. Christianity: Jesus of Nazareth as Messiah and incarnate Son ' +
    'of God; salvation through grace and faith; Trinitarian theology; sacramental life; Protestant, ' +
    'Catholic, and Orthodox branches. Islam: complete and final revelation through Muhammad; Quran ' +
    'as divine speech (not merely inspired); Five Pillars as core practice; Sunni-Shia division ' +
    'traced to succession dispute. Shared concepts: monotheism (though Christianity\'s Trinity is ' +
    'disputed by the others), prophetic revelation, moral accountability, prayer, fasting, almsgiving. ' +
    'Historical interactions include centuries of shared scholarship in the medieval Islamic world ' +
    '(Averroes, Maimonides, Aquinas read each other) alongside periods of conflict (Crusades, ' +
    'Inquisition). Interreligious dialogue today focuses on shared ethical concerns.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'theo-world-religions',
      description: 'The Abrahamic faiths constitute the largest family within comparative world religion study',
    },
    {
      type: 'analogy',
      targetId: 'theo-eastern-religions',
      description: 'Studying Abrahamic and Eastern religious families together reveals both shared human religious patterns and profound theological divergences',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};

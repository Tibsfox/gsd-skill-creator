/**
 * Loving-Kindness (Metta) -- training the emotional dimension.
 *
 * Directed well-wishing toward self, loved ones, neutral people,
 * difficult people, and all beings. Trains the emotional dimension
 * that purely attentional practices can miss.
 *
 * @module departments/mind-body/concepts/meditation/loving-kindness-metta
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const mettaTerm = renderTerminology('Metta', 'loving-kindness, goodwill', 'Pali, one of the four Brahmaviharas (divine abodes) in Buddhist teaching');
const karunaTerm = renderTerminology('Karuna', 'compassion', 'Pali/Sanskrit, the companion practice to metta');

const theravadaCredit = creditTradition({
  id: 'chan-zen',
  name: 'Theravada Buddhist Tradition',
  region: 'India, Sri Lanka, Southeast Asia',
  period: 'c. 500 BCE -- present',
  description: 'Metta practice originates in the Metta Sutta, adapted by Sharon Salzberg and used in clinical settings',
  keyTexts: ['Metta Sutta (Karaniya Metta Sutta)', 'Visuddhimagga'],
  modernContext: 'Research by Barbara Fredrickson et al. demonstrates metta practice increases positive emotions and social connection',
});

export const lovingKindnessMetta: RosettaConcept = {
  id: 'mb-med-metta',
  name: 'Loving-Kindness (Metta)',
  domain: 'mind-body',
  description:
    `${mettaTerm}: directed well-wishing toward self, loved ones, neutral people, difficult ` +
    `people, and all beings. This practice trains the emotional dimension that purely ` +
    `attentional practices like vipassana and samatha can miss. ` +
    `\n\nHow to practice: Sit comfortably. Bring to mind an image of yourself. Silently ` +
    `repeat phrases: "May I be happy. May I be healthy. May I be safe. May I live with ` +
    `ease." Then bring to mind someone you love -- direct the same phrases to them: "May ` +
    `you be happy..." Then a neutral person (a cashier, a neighbor you have seen but ` +
    `never spoken to). Same phrases. If ready: someone difficult. Same phrases. Finally, ` +
    `expand to all beings everywhere: "May all beings be happy..." ` +
    `\n\nScientific evidence: Research by Barbara Fredrickson et al. demonstrates that ` +
    `metta practice increases positive emotions, reduces self-criticism, and builds ` +
    `social connection. Sharon Salzberg's loving-kindness framework has been adapted ` +
    `into clinical protocols. The practice counterbalances the potential emotional ` +
    `dryness of purely attentional meditation. The companion practice ${karunaTerm} ` +
    `focuses specifically on compassion toward suffering. ` +
    `\n\nCultural lineage: ${theravadaCredit} Metta is one of the four Brahmaviharas ` +
    `(divine abodes) in Buddhist teaching, alongside compassion (karuna), empathetic ` +
    `joy (mudita), and equanimity (upekkha). The Metta Sutta is among the most ` +
    `widely chanted texts in the Theravada tradition.`,
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Metta complements vipassana by training the emotional dimension alongside the attentional dimension',
    },
    {
      type: 'analogy',
      targetId: 'mb-med-body-scan',
      description: 'Both practices move attention systematically through a sequence -- body scan through body regions, metta through circles of connection',
    },
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Calm diaphragmatic breathing supports the emotional openness cultivated in metta practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-samatha',
      description: 'Metta uses a concentration-like focus on phrases and images, sharing the single-pointed quality of samatha',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, -0.5),
  },
};

/**
 * Body Scan -- systematic interoceptive awareness.
 *
 * Systematic attention to each part of the body, from feet to crown.
 * Builds interoception and bridges seated meditation to movement practices.
 * The first formal practice taught in the MBSR 8-week curriculum.
 *
 * @module departments/mind-body/concepts/meditation/body-scan
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const vedanaTerm = renderTerminology('Vedana', 'feeling, sensation', 'Pali, one of the four foundations of mindfulness');

const mbsrCredit = creditTradition({
  id: 'modern-mindfulness',
  name: 'Modern Mindfulness',
  region: 'Global',
  period: 'Late 20th century -- present',
  description: 'The body scan is the first formal practice in MBSR, developed by Jon Kabat-Zinn at UMass (1979)',
  keyTexts: ['Full Catastrophe Living', 'Wherever You Go, There You Are'],
  modernContext: 'Standard practice in clinical mindfulness, rehabilitation, and therapeutic settings worldwide',
});

export const bodyScan: RosettaConcept = {
  id: 'mb-med-body-scan',
  name: 'Body Scan',
  domain: 'mind-body',
  description:
    `Systematic attention to each part of the body, typically from feet to crown. Builds ` +
    `interoception -- the awareness of internal bodily sensations. This is the bridge ` +
    `between seated meditation and movement practices like yoga and tai chi. ` +
    `\n\nHow to practice: Lie down or sit comfortably. Bring attention to the toes of the ` +
    `left foot. Notice any sensations -- warmth, tingling, pressure, or nothing at all. ` +
    `Gradually move attention up: sole of foot, ankle, calf, knee, thigh, hip. Repeat ` +
    `on the right side. Continue through pelvis, lower back, abdomen, chest, upper back, ` +
    `shoulders. Down each arm: upper arm, elbow, forearm, wrist, palm, fingers. Then ` +
    `neck, jaw, face, scalp, crown. Finally, expand awareness to the body as a whole. ` +
    `A full scan takes 20-45 minutes; abbreviated versions focusing on major regions ` +
    `can be done in 10 minutes. ` +
    `\n\nWhy it works: The body scan trains ${vedanaTerm} -- awareness of bodily ` +
    `sensation, one of the four foundations of mindfulness in the Buddhist tradition. ` +
    `Regular practice builds the interoceptive sensitivity that supports movement awareness ` +
    `in yoga, martial arts, and daily life. Research in the MBSR program shows body scan ` +
    `practice reduces stress reactivity and improves body awareness. ` +
    `\n\nCultural lineage: ${mbsrCredit} While the systematic body scan format is ` +
    `primarily associated with Kabat-Zinn's MBSR program, awareness of bodily sensation ` +
    `is ancient -- the Satipatthana Sutta (the Buddha's discourse on foundations of ` +
    `mindfulness) includes contemplation of the body as the first foundation.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Body scan begins with awareness of the breath in the belly -- diaphragmatic breathing provides the starting anchor',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Body scan applies vipassana-style non-judgmental observation systematically through the body',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-kinhin',
      description: 'Both body scan and walking meditation bridge stillness and movement -- body scan through internal awareness, kinhin through external motion',
    },
    {
      type: 'analogy',
      targetId: 'mb-med-metta',
      description: 'Both body scan and metta practice move attention systematically through a sequence -- body scan through body regions, metta through circles of connection',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.04 + 0.01),
    angle: Math.atan2(0.1, -0.2),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const stressCoping: RosettaConcept = {
  id: 'psych-stress-coping',
  name: 'Stress and Coping',
  domain: 'psychology',
  description: 'Stress is the physiological and psychological response to demands exceeding perceived resources. ' +
    'Fight-or-flight response (Cannon): sympathetic nervous system activation -- cortisol and adrenaline released, heart rate increases, digestion pauses. ' +
    'Tend-and-befriend (Taylor): an additional stress response pattern more common in women -- seeking social support. ' +
    'Allostatic load: the cumulative wear on the body from chronic stress -- links stress to cardiovascular disease, immune suppression, and memory impairment. ' +
    'Primary appraisal: "Is this situation threatening?" Secondary appraisal: "Can I cope?" -- stress is a function of both. ' +
    'Problem-focused coping: addressing the stressor directly. Emotion-focused coping: managing emotional response. ' +
    'Mindfulness: non-judgmental attention to present-moment experience -- reduces emotional reactivity and cortisol. ' +
    'Social support: the most robust buffer against stress effects -- belonging and connection are physiologically protective. ' +
    'Post-traumatic growth: some people emerge from severe adversity with enhanced resilience, relationships, and life appreciation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-basic-emotions',
      description: 'Stress involves emotional responses -- the physiological stress response is inseparable from negative emotional experience',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-health-integration',
      description: 'Chronic stress affects nutrition -- cortisol drives cravings for calorie-dense foods and disrupts sleep, which affects appetite hormones',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

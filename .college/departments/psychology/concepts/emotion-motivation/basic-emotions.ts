import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const basicEmotions: RosettaConcept = {
  id: 'psych-basic-emotions',
  name: 'Emotions and Emotional Processing',
  domain: 'psychology',
  description: 'Emotions are complex psychophysiological responses that motivate behavior and communicate social information. ' +
    'Paul Ekman\'s basic emotions: six universally recognized facial expressions -- happiness, sadness, anger, fear, disgust, surprise. ' +
    'Constructionist view (Lisa Feldman Barrett): emotions are not discrete biological programs but are constructed by the brain from core affect (valence + arousal) and conceptual knowledge. ' +
    'The two-dimension model: emotions vary on valence (pleasant/unpleasant) and arousal (high/low). ' +
    'Physiological arousal: the same arousal can be experienced as different emotions depending on context (Schachter-Singer two-factor theory). ' +
    'Amygdala\'s role: rapid threat detection and emotional salience tagging -- damage impairs fear responses. ' +
    'Emotion regulation: cognitive strategies to modify emotional experience (reappraisal, suppression, distraction). ' +
    'Emotional granularity: people who can precisely distinguish between emotional states (anxiety vs. frustration vs. irritation) are better at emotional regulation. ' +
    'Alexithymia: difficulty identifying and describing one\'s own emotions -- associated with psychosomatic symptoms and relationship difficulties.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-neurons-brain-structure',
      description: 'Emotions are processed in specific brain circuits -- limbic system and amygdala are central to emotional experience',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-motivation-needs',
      description: 'Emotions and motivation are deeply linked -- emotions signal what matters and motivate approach or avoidance behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};

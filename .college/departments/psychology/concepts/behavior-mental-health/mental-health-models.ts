import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mentalHealthModels: RosettaConcept = {
  id: 'psych-mental-health-models',
  name: 'Mental Health and Psychological Models',
  domain: 'psychology',
  description: 'Mental health exists on a spectrum -- the boundary between psychological distress and disorder is one of severity, duration, and impairment. ' +
    'Biopsychosocial model: mental disorders arise from biological (genetics, neurobiology), psychological (thinking patterns, trauma), and social (relationships, poverty, discrimination) factors. ' +
    'DSM-5 and ICD-11: the two major diagnostic classification systems -- descriptive, based on symptom clusters, not etiology. ' +
    'Most common disorders: depression (major depressive disorder), anxiety disorders, ADHD, substance use disorders. ' +
    'Cognitive-behavioral therapy (CBT): gold-standard treatment for anxiety and depression -- targets cognitive distortions and maladaptive behaviors. ' +
    'Cognitive distortions: all-or-nothing thinking, catastrophizing, mind-reading, emotional reasoning -- patterns that maintain depression and anxiety. ' +
    'Psychopharmacology: SSRIs for depression/anxiety, stimulants for ADHD, antipsychotics for schizophrenia -- treat biological dimension. ' +
    'Stigma: the biggest barrier to mental health treatment seeking -- psychoeducation reduces stigma. ' +
    'Prevention: social connection, exercise, sleep, meaning -- the foundations of mental health that often go unaddressed.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-neurons-brain-structure',
      description: 'Mental health disorders have neurobiological correlates -- understanding brain structure grounds the biological dimension of the biopsychosocial model',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-health-integration',
      description: 'Nutrition affects mental health through multiple pathways -- gut-brain axis, inflammation, micronutrient deficiencies all influence mood and cognition',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

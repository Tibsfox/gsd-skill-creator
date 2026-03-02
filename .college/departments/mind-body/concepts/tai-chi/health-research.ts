import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Tai Chi Health Research
 *
 * Evidence-based health benefits of tai chi practice, citing peer-reviewed
 * sources including systematic reviews, meta-analyses, and research from
 * Harvard Medical School, Cochrane reviews, and the Canadian Family Physician.
 *
 * Cultural attribution: Research conducted globally on Chinese tai chi
 * and qigong practices.
 */
export const healthResearch: RosettaConcept = {
  id: 'mb-tc-health-research',
  name: 'Tai Chi Health Research',
  domain: 'mind-body',
  description:
    'Tai chi has an unusually strong evidence base among mind-body practices, with over 500 clinical trials ' +
    'and 120+ systematic reviews published over 45 years. The following summarizes findings from major ' +
    'peer-reviewed sources. ' +
    'Balance and Fall Prevention: A comprehensive review in the Canadian Family Physician (PMC 9844554) ' +
    'assessed evidence across 25 health conditions and rated the evidence for fall prevention in older adults ' +
    'as "excellent." Multiple Cochrane systematic reviews confirm that tai chi significantly reduces fall ' +
    'rates in elderly populations. Harvard Medical School research (Dr. Peter Wayne, Osher Center for ' +
    'Integrative Medicine) identifies "eight active ingredients" that contribute to fall prevention: ' +
    'awareness, intention, structural integration, active relaxation, strengthening and flexibility, ' +
    'natural breathing, social support, and a meditative component. These ingredients work synergistically -- ' +
    'improved muscular strength, better proprioception, enhanced posture, and increased confidence all ' +
    'contribute to reduced fall risk. ' +
    'Osteoarthritis: The Canadian Family Physician review rates the evidence as "excellent." A Cochrane ' +
    'systematic review found that tai chi reduces pain and improves physical function in knee osteoarthritis ' +
    'patients. ' +
    'Cardiovascular Health: Research published in peer-reviewed journals shows tai chi practice is associated ' +
    'with modest reductions in blood pressure, comparable to moderate-intensity aerobic exercise. A systematic ' +
    'review found benefits for cardiac and stroke rehabilitation rated as having "good evidence." ' +
    'Mental Health: Multiple systematic reviews document reductions in anxiety and depression symptoms. ' +
    'The Canadian Family Physician review rates the evidence for depression as "good." Harvard Health ' +
    'publications note improvements in mood and self-efficacy. ' +
    'Fibromyalgia: The review rates the evidence as "fair." Studies show improvements in pain, fatigue, ' +
    'and quality of life measures for fibromyalgia patients practicing tai chi regularly. ' +
    'Cognitive Health: Evidence rated "excellent" for cognitive capacity in older adults. Research suggests ' +
    'tai chi may slow cognitive decline, with benefits attributed to the combination of physical activity, ' +
    'sustained attention, and sequential memory required by form practice. ' +
    'COPD Rehabilitation: Evidence rated "excellent." Tai chi improves exercise capacity and quality of ' +
    'life in COPD patients, likely through its emphasis on coordinated breathing with gentle movement. ' +
    'In fall 2023, Harvard hosted the inaugural international conference on "The Science of Tai Chi and ' +
    'Qigong for Whole Person Health," producing a two-part white paper summarizing evidence across falls, ' +
    'balance, cognition, mental health, sleep, cardiorespiratory health, musculoskeletal health, cancer, ' +
    'and neurophysiological mechanisms. ' +
    'Sources: PMC 9844554; Cochrane systematic reviews; Harvard Health / Osher Center publications; ' +
    'Dr. Peter Wayne, "The Harvard Medical School Guide to Tai Chi."',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'The health benefits arise from the synergistic application of all five tai chi principles during regular practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-zhan-zhuang',
      description: 'Standing meditation contributes to balance, proprioception, and leg strength -- key factors in fall prevention research',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Natural breathing coordinated with movement is one of the "eight active ingredients" identified by Harvard research',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, -0.4),
  },
};

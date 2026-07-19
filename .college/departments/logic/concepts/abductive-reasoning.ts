/**
 * Abductive Reasoning concept -- inference to the best explanation.
 *
 * Methodological logic: from a surprising observation, conjecture the
 * hypothesis that, if assumed, would best account for it. C. S. Peirce's
 * third mode of inference beside deduction and induction -- ampliative,
 * defeasible, and selected by explanatory virtue rather than by
 * entailment or statistical projection.
 *
 * @module departments/logic/concepts/abductive-reasoning
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 3*2pi/23, radius 0.78
const theta = 3 * 2 * Math.PI / 23;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const abductiveReasoning: RosettaConcept = {
  id: 'logic-abductive-reasoning',
  name: 'Abductive Reasoning',
  domain: 'logic',
  description: 'Abductive reasoning is inference to the best explanation: from a ' +
    'surprising observation, one conjectures the hypothesis that, if assumed, would ' +
    'best account for it. C. S. Peirce introduced abduction as the third mode of ' +
    'inference beside deduction and induction -- deduction proves that something must ' +
    'be, induction shows that something actually is operative, and abduction merely ' +
    'suggests that something may be, completing the triad. Unlike truth-preserving ' +
    'deduction, abduction is ampliative and defeasible: its conclusion can be ' +
    'overturned by a better explanation or by new evidence. The "best" explanation is ' +
    'chosen by explanatory virtues -- simplicity, scope, coherence, and explanatory ' +
    'power -- rather than by deductive entailment or by projecting a regularity from ' +
    'cases. It is the everyday engine of medical diagnosis, scientific hypothesis ' +
    'formation, and forensic inference, and it grounds the philosophical debate over ' +
    'whether inference to the best explanation is itself a rational rule.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python frames abduction as ranking candidate explanations: a list-comprehension `[h for h in hypotheses if entails(h, obs)]` gathers the ones that would account for the observation, then `max(candidates, key=explanatory_score)` selects the best. ' +
        'A scikit-learn-style scorer weighs each hypothesis on prior plausibility and explanatory power. ' +
        'See Douven 2011.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'In C++ abduction is a scored search over a contiguous `std::vector<Hypothesis>`: a template `best_explanation<Score>` runs `std::max_element` across the candidates, comparing an explanatory-loss functor while RAII scopes own each hypothesis\'s evidence buffer. ' +
        'The comparator weighs coverage against simplicity, and backward inference compiles into one tight loop with no copy. ' +
        'See Douven 2011.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison models abduction as an ability: `Abduce.best : Observation ->{Abduce} Hypothesis` is discharged by a handler ranking immutable candidate terms by explanatory power and tracking which effects the scorer may perform. ' +
        'Each hypothesis is content-addressed, so the #hash of the chosen explanation IS its identity, and two runs over the same inputs land on byte-identical results. ' +
        'See Douven 2011.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'log-deductive-reasoning',
      description: 'Abduction is the third mode beside deduction (truth-preserving) and induction (generalizing): it runs an inference backward from a conclusion to a candidate premise that would explain it',
    },
    {
      type: 'cross-reference',
      targetId: 'log-inductive-reasoning',
      description: 'Like induction it is ampliative and defeasible, but abduction selects an explanatory hypothesis rather than projecting a regularity forward from observed cases',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

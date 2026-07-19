/**
 * Abductive Reasoning try-session -- inference to the best explanation.
 *
 * Walk a learner through Peirce's third mode of inference: from a
 * surprising observation, conjecture the hypothesis that would best
 * account for it. The session derives abduction by contrast with
 * deduction and induction, ranks candidate explanations by explanatory
 * virtue, confronts the underdetermination problem, and closes on the
 * philosophical question of whether inference to the best explanation is
 * a rational rule.
 *
 * @module departments/logic/try-sessions/abductive-reasoning
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const abductiveReasoningSession: TrySessionDefinition = {
  id: 'logic-abductive-reasoning-first-steps',
  title: 'Abductive Reasoning: Inference to the Best Explanation',
  description:
    'A guided first pass through abductive reasoning -- Peirce\'s third ' +
    'mode of inference beside deduction and induction. The learner ' +
    'reconstructs a surprising observation, generates candidate ' +
    'hypotheses, ranks them by explanatory virtue, confronts the ' +
    'underdetermination and survivorship problems, contrasts abduction ' +
    'with the other two modes, and weighs whether inference to the best ' +
    'explanation is itself a rational rule.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Start from a surprising observation: you walk outside and the lawn is wet. Write down the observation as a proposition O. Now ask the abductive question -- not "what follows from O?" but "what, if it were true, would make O unsurprising?" List at least three hypotheses H1, H2, H3 that would each account for a wet lawn.',
      expectedOutcome:
        'You separate the observation (O = "the lawn is wet") from the candidate explanations, and you generate a candidate set such as H1 = "it rained overnight," H2 = "the sprinkler ran," H3 = "a pipe burst." You notice that abduction runs the inference backward: from a conclusion (O) toward a premise (some H) that would entail or make it probable.',
      hint: 'Deduction asks what O forces to be true; abduction asks what would explain O being true. The arrow points the opposite way -- from effect to a conjectured cause.',
      conceptsExplored: ['logic-abductive-reasoning', 'log-deductive-reasoning'],
    },
    {
      instruction:
        'For each hypothesis, check the entailment: if Hi were true, would O be expected? Score each Hi on two axes -- how well it would account for O (explanatory power) and how plausible it is on its own (prior plausibility). Which single hypothesis is the "best explanation," and by what criterion did you rank it above the others?',
      expectedOutcome:
        'You compute an informal argmax over the candidate set: you might rank H1 ("it rained") highest if the sky is grey and neighbouring lawns are wet too, because it explains more of the scene at lower cost than H3 ("a pipe burst"), which would predict extra evidence you do not observe. You articulate that "best" is chosen by explanatory virtue, not by deductive proof.',
      hint: 'The explanatory virtues are simplicity, scope, coherence with background knowledge, and explanatory power. The best explanation typically covers the most observation for the least assumption.',
      conceptsExplored: ['logic-abductive-reasoning'],
    },
    {
      instruction:
        'Confront the underdetermination problem. Your chosen H entails O, but so do the rivals. Deductively, O does not prove H -- inferring H from "H entails O, and O" is the fallacy of affirming the consequent. So why is abduction not just a fallacy? State what abduction adds beyond bare entailment that makes it a defeasible-but-rational inference.',
      expectedOutcome:
        'You recognise that abduction is formally invalid as deduction (affirming the consequent) yet defensible as ampliative inference: it does not claim H is proven, only that H is the best available explanation and therefore the most reasonable to provisionally accept. You note the conclusion is defeasible -- a better explanation or new evidence can overturn it.',
      hint: 'Abduction never claims truth-preservation. It claims the hypothesis is warranted as a working conjecture -- open to defeat -- which is exactly why Peirce called it the mode that only "suggests that something may be."',
      conceptsExplored: ['logic-abductive-reasoning', 'log-deductive-reasoning'],
    },
    {
      instruction:
        'Now contrast abduction with induction directly. Suppose instead of one wet lawn you observe a hundred mornings and see the lawn wet after every grey sky. What inference is that -- and how does projecting "grey sky is followed by wet lawn" differ from conjecturing "it rained last night explains this wet lawn"?',
      expectedOutcome:
        'You distinguish the two ampliative modes: induction projects a regularity forward from many cases (grey-sky -> wet-lawn as a general pattern), whereas abduction reaches backward from a single observation to an explanatory cause. Both are defeasible and go beyond the premises, but induction generalises a pattern while abduction selects an explanation.',
      hint: 'Induction and abduction are both ampliative and both defeasible -- the difference is direction and product: induction outputs a generalization over cases, abduction outputs an explanatory hypothesis for a case.',
      conceptsExplored: ['logic-abductive-reasoning', 'log-inductive-reasoning'],
    },
    {
      instruction:
        'See abduction in a real diagnostic setting. A physician observes fever, cough, and a chest-X-ray opacity (the observation O). Rather than deduce, they abduce: pneumonia would best explain all three findings at once. Trace how a differential diagnosis is an abduction -- and identify the survivorship risk if only the confirmed diagnoses are ever recorded.',
      expectedOutcome:
        'You map diagnosis onto the propose/rank pipeline: candidate diseases are hypotheses, the symptom cluster is O, and the physician selects the disease whose assumption best accounts for the whole cluster. You flag the survivorship concern: if only correct diagnoses are logged, the record overstates abduction\'s hit rate because the denominator of ruled-out hypotheses is invisible.',
      hint: 'A good differential ranks hypotheses by how much of the symptom cluster each covers and how prior-plausible each is -- the same argmax-by-explanatory-virtue you applied to the wet lawn.',
      conceptsExplored: ['logic-abductive-reasoning'],
    },
    {
      instruction:
        'Model the ranking computationally. Represent the candidate set as an immutable list and derive the winner as `max(candidates, key=explanatory_score)`. What does the score function have to encode, and why does making the candidate set and its scoring content-addressed (Unison-style) matter for two people reconstructing the same abduction?',
      expectedOutcome:
        'You define explanatory_score as a function combining coverage of O with prior plausibility and a simplicity penalty, and you see the best explanation as the argmax over that score. You note that if the observation, candidate set, and scorer are content-addressed, two reasoners land on byte-identical results -- the abduction is reproducible rather than a matter of private judgment.',
      hint: 'The score must trade explanatory power against cost; otherwise the "explanation that assumes everything" always wins. Content-addressing pins the inputs so the ranking is auditable and reproducible.',
      conceptsExplored: ['logic-abductive-reasoning'],
    },
    {
      instruction:
        'State the concept in one sentence, then take a position on the standing philosophical question: is inference to the best explanation a genuine rule of rationality, or merely a heuristic that happens to work? Finally, place abduction on the complex plane of experience near theta = 3*2pi/23 on the radius-0.78 circle, and say what that location signals about the concept.',
      expectedOutcome:
        'You state something like: "Abductive reasoning conjectures, from a surprising observation, the hypothesis that would best account for it -- the third mode of inference beside deduction and induction." You defend a view on IBE\'s rational status (e.g. it is truth-conducive when the candidate set is rich, but unreliable when the true explanation was never generated), and you note the concept sits at moderate radius (0.78) and low angle -- foundational and methodological, of moderate abstractness.',
      hint: 'The strongest objection to IBE is the "bad lot" problem: the best of a bad set of candidates may still be false. A defence has to argue that the candidate set is usually good enough -- which is exactly the survivorship worry from step five.',
      conceptsExplored: ['logic-abductive-reasoning', 'log-inductive-reasoning'],
    },
  ],
};

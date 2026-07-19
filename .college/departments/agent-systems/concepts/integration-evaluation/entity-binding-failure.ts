/**
 * Entity Binding Failure concept — agent-systems integration-evaluation wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.30531 (2026).
 *
 * @module departments/agent-systems/concepts/integration-evaluation/entity-binding-failure
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 24 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const entityBindingFailure: RosettaConcept = {
  id: 'agent-entity-binding-failure',
  name: 'Entity Binding Failure',
  domain: 'agent-systems',
  description: 'Entity Binding Failure is the failure mode in which a tool-augmented agent selects the correct tool and emits well-formed API arguments yet acts on the wrong real-world entity — emailing the wrong Alex, attaching the wrong launch deck, replying in the wrong thread, or updating the wrong customer account. arXiv:2606.30531 (2026) formalizes the separation between tool correctness and entity correctness, gives a taxonomy of wrong-entity failures in enterprise workflows, and evaluates four entity-aware execution mechanisms: entity-resolution preconditions (resolve every natural-language referent to a concrete record before acting), confidence-gated binding (act only when the resolution is unambiguous), clarification under ambiguity (ask the user which entity is meant), and provenance tracking (attach the resolved entity\'s origin to the action). In a controlled diagnostic across 60 tasks, five model backends, and six tool-use methods, all methods scored 0.0 percent wrong-tool error, yet action-oriented baselines still produced wrong-entity actions in 24.0 to 26.0 percent of runs; entity-aware methods eliminated wrong-entity actions and risk-weighted wrong-entity exposure, at the cost of lower direct task completion because they defer under ambiguity. Distinct from the Silent-Failure Taxonomy, which catalogs the broad class of agent failures that raise no error signal, this concept isolates a single mechanism — reference-to-entity binding — and supplies binding-time preconditions and gates rather than a post-hoc catalog. For agent systems the implication is that tool-selection accuracy is not a safety metric: any agent that writes to shared enterprise state must interpose an entity-resolution and confidence-gate step between reference and action, and should prefer deferring to a user over a low-confidence bind whenever the target action is destructive or irreversible.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Wrap each state-mutating tool in a resolve then gate then act pipeline. (1) An entity-resolution precondition maps every natural-language referent in the arguments (recipient, document, thread, account) to a scored set of candidate records. (2) A confidence gate proceeds only if the top candidate clears a margin threshold over the runner-up; otherwise it raises ClarificationNeeded, which the agent surfaces to the user instead of acting. (3) The executed action records the resolved entity id plus its provenance. Destructive or irreversible tools use a stricter margin than read-only ones, encoding the paper\'s finding that safety requires deferring under ambiguity even at the cost of lower direct task completion.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-silent-failure-taxonomy',
      description: 'Wrong-entity actions are a specific silent-failure class: the tool call succeeds, no error is raised, and the task appears complete while the wrong real-world entity is affected. Entity Binding Failure names and mitigates one entry that a general silent-failure catalog only enumerates.',
    },
    {
      type: 'analogy',
      targetId: 'agent-building-to-the-test',
      description: 'Scoring 0.0 percent wrong-tool error on tool-selection benchmarks while still corrupting 24-26 percent of runs is building-to-the-test in the reliability register: the agent optimizes the measured dimension (tool correctness) while an unmeasured one (entity correctness) silently fails.',
    },
    {
      type: 'dependency',
      targetId: 'agent-artifact-provenance-gap',
      description: 'Provenance tracking, one of the four entity-aware mechanisms, closes the provenance gap by binding each executed action to the resolved entity\'s origin record, so a wrong-entity action becomes auditable and attributable after the fact.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-goal-state-inference',
      description: 'The clarification-under-ambiguity mitigation is goal-state inference applied at the referent level: rather than acting on an assumed binding, the agent resolves which entity the natural-language reference denotes before committing an irreversible action.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

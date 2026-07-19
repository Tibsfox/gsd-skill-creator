/**
 * Definite Descriptions -- logic concept (June-2026 arXiv cohort, T2).
 * @module departments/logic/concepts/definite-descriptions
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 4 * 2 * Math.PI / 6;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const definiteDescriptions: RosettaConcept = {
  id: "logic-definite-descriptions",
  name: "Definite Descriptions",
  domain: 'logic',
  description:
    "Definite descriptions are phrases of the form 'the F' -- 'the author of Waverley', 'the present King of France'. Treating them as singular terms breaks classical logic: 'The present King of France is bald' has no truth value if the name denotes nothing. Russell's theory of definite descriptions (1905) instead eliminates 'the F' by contextual definition: 'The F is G' abbreviates the three-conjunct formula ∃x(Fx ∧ ∀y(Fy→y=x) ∧ Gx) -- existence, uniqueness, and predication. 'The F' is an incomplete symbol, meaningful only inside a whole sentence and carrying no denotation of its own. An empty description makes the sentence plainly false, preserving bivalence with no third truth value. Because the description unpacks into quantifiers, its scope matters: negating 'The F is G' is ambiguous between the narrow ¬∃x(…∧Gx) and the wide ∃x(…∧¬Gx). Whitehead and Russell mark this with the iota operator ℩x.Fx and explicit scope brackets. (arXiv:2606.11750v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Model the domain as an array and let predicates be boolean masks. 'The F is G' is a reduction over a comprehension: Fs = [x for x in domain if F(x)]; the_F_is_G = len(Fs) == 1 and G(Fs[0]). Existence and uniqueness collapse into len(Fs) == 1; an empty Fs yields False, never None -- bivalence for free. Scope is where you place the not: not the_F_is_G (narrow) versus recomputing with G swapped for its complement (wide). See Russell 1905.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "A std::vector<T> owns the domain by RAII; template over the predicates. Filter the F-satisfiers into a contiguous buffer, then the description holds iff sats.size() == 1 && G(sats.front()). Existence plus uniqueness is one size() == 1 check; an empty buffer returns false with no null-term hazard. Scope is bracket placement: !theFisG negates the whole package (narrow), while filtering on G's complement asserts the unique F lacks G (wide). See Russell 1905.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Model 'the F is G' as a pure function over an immutable List. Being content-addressed, the term's #hash IS its identity, so the same description evaluated anywhere is literally the same node in the Merkle-DAG. Existence-or-uniqueness failure is not a null but an {Abort} ability surfaced to a handler, keeping the core effect-free. The narrow and wide scope readings compile to two distinct terms with two distinct hashes -- scope ambiguity becomes a hash inequality. See Russell 1905.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "log-predicate-logic",
      description: "The entire analysis is written in first-order predicate logic: nested quantifiers, the identity relation, and scope brackets are the only machinery into which 'the F' unpacks, so the theory presupposes quantifier scope and binding.",
    },
    {
      type: "cross-reference",
      targetId: "logic-kuratowski-ordered-pair",
      description: "Both are eliminative contextual definitions: just as Kuratowski defines away the ordered pair into pure set primitives, Russell defines away 'the F' into pure quantifier-and-identity primitives, leaving no residual undefined notion.",
    },
    {
      type: "analogy",
      targetId: "logic-many-valued-logic",
      description: "An opposing response to reference failure -- Russell keeps exactly two truth values by pushing the empty-description case into falsity via scope, whereas many-valued logic instead admits a third, undefined value for the same sentences.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

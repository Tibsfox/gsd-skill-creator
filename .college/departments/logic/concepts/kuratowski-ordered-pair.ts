/**
 * Kuratowski Ordered Pair -- logic concept (June-2026 arXiv cohort, T2).
 * @module departments/logic/concepts/kuratowski-ordered-pair
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 6;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const kuratowskiOrderedPair: RosettaConcept = {
  id: "logic-kuratowski-ordered-pair",
  name: "Kuratowski Ordered Pair",
  domain: 'logic',
  description:
    "Pure set theory has only one primitive relation, membership, and its sets are unordered: {a,b}={b,a}. Yet mathematics needs ordered pairs with (a,b)≠(b,a), so that relations and functions can be built. The Kuratowski ordered pair encodes order using sets alone: define (a,b) := {{a},{a,b}}. Its characteristic property — (a,b)=(c,d) iff a=c and b=d — is a theorem provable from extensionality by splitting on a=b versus a≠b; the first coordinate is recovered as the element common to both members, the second as the remaining element. In the degenerate a=b case the pair collapses to {{a}}, since {a,a}={a}: both members then share the single element a and there is no distinct remaining element, so recovery reads both coordinates as a, exactly (a,a). Iterating, (a₁,…,aₙ):=((a₁,…,aₙ₋₁),aₙ) yields n-tuples, and the encoding embeds into the hierarchy of simple types. This matters because A×B ⊆ P(P(A∪B)), so Cartesian products, relations (sets of pairs), and functions (single-valued relations) all reduce to membership — set theory becomes a foundation for mathematics without new primitives. A modern treatment generalizes the encoding to defining ordered tuples as sets throughout the hierarchy of simple types, of which Kuratowski's {{a},{a,b}} is one special case (arXiv:2606.18474v1, 2026).",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Model a pair as nested frozensets — Python's only hashable set: `pair = lambda a,b: frozenset({frozenset({a}), frozenset({a,b})})`. Recover the first coord as the element of `set.intersection(*pair(a,b))`; the second from `set.union(*p)` minus that (empty ⇒ a==b). A NumPy object-array of such pairs is a relation; a dict-comprehension `{a:b for a,b in rel}` is the functional case. See Kuratowski 1921.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Kuratowski is set-theoretic, so model the pair as `std::vector<std::set<T>>{ {a}, {a,b} }` — RAII owns the nested buffers and the inner set dedups to a singleton when a==b. Recover `.first` by intersecting the members, `.second` from the two-element member. Wrap it in a `template<class T> struct KPair` with value semantics; a contiguous `std::vector<KPair<T>>` then IS a relation. See Kuratowski 1921.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "In Unison a value's #hash IS its identity, so every structurally-equal rebuild of `{{a},{a,b}}` collapses to one Merkle node — pair-uniqueness holds by content-addressing, not by proof. Model it immutably: `pair a b = Set.fromList [Set.singleton a, Set.fromList [a, b]]`. Decoding is a total, pure function over the DAG; no ability handler is needed since there is no effect. See Kuratowski 1921.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "log-logic-in-mathematics",
      description: "The pair {{a},{a,b}} is definable only inside the first-order set theory that logic-in-mathematics frames: it presupposes membership as the sole primitive and extensionality as the law that makes the encoding well-defined and its coordinates recoverable.",
    },
    {
      type: "cross-reference",
      targetId: "logic-definite-descriptions",
      description: "Coordinate projection is a definite description: the first coordinate is 'the unique x belonging to every member of the pair', so recovering fst and snd is the iota-operator applied to witnesses whose uniqueness the pairing lemma guarantees.",
    },
    {
      type: "cross-reference",
      targetId: "logic-ai-verified-proof",
      description: "The characteristic property (a,b)=(c,d) iff a=c and b=d, with its case split on a=b versus a≠b, is a canonical lemma for mechanized proof and a clean target for the ai-verified-proof pipeline.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

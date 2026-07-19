/**
 * Kuratowski Ordered Pair try-session -- logic (June-2026 arXiv cohort, T2).
 * @module departments/logic/try-sessions/kuratowski-ordered-pair
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const kuratowskiOrderedPairSession: TrySessionDefinition = {
  id: 'logic-kuratowski-ordered-pair-first-steps',
  title: "Building Order from Unordered Sets: The Kuratowski Pair",
  description:
    "Build Kuratowski's pair {{a},{a,b}} from scratch, recover both coordinates, prove pair-uniqueness, and watch relations and functions fall out as pure sets. A hands-on derivation, not a summary.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write out (a,b) := {{a},{a,b}} for the concrete values a=0, b=1, then separately expand (b,a)=(1,0) and compare the two sets element by element to decide whether they are equal.",
      expectedOutcome:
        "You should see {{0},{0,1}} differs from {{1},{0,1}} because their singletons differ, so the encoding genuinely records order even though raw sets are unordered.",
      hint: "Two sets are equal only if they have exactly the same members; compare the singleton parts first.",
      conceptsExplored: ["logic-kuratowski-ordered-pair"],
    },
    {
      instruction:
        "Compute the degenerate pair (a,a) by substituting b=a into {{a},{a,b}}, then apply extensionality to simplify {a,a} and record how many members the resulting set has.",
      expectedOutcome:
        "You should find (a,a)={{a}} — a singleton of a singleton — because {a,a}={a}, showing the encoding stays well-defined but visibly collapses when the coordinates coincide.",
      hint: "Extensionality says a set is fixed by its members, so listing a twice adds nothing new.",
      conceptsExplored: ["logic-kuratowski-ordered-pair", "log-logic-in-mathematics"],
    },
    {
      instruction:
        "Given p={{0},{0,1}}, compute the intersection of all members of p (that is, the set-intersection over p) and identify the first coordinate as the unique element living inside that intersection.",
      expectedOutcome:
        "You should recover a=0 as the element of the intersection {0}, understanding that the first coordinate is exactly the object belonging to every member of the pair.",
      hint: "Intersect the singleton {0} with the doubleton {0,1}; ask what survives in both.",
      conceptsExplored: ["logic-kuratowski-ordered-pair"],
    },
    {
      instruction:
        "Now recover the second coordinate: compute the union of all members of p, take the element of that union which fails to lie in the intersection, and separately state what this recipe does in the degenerate case a=b.",
      expectedOutcome:
        "You should get b=1 as the element of union-minus-intersection {1}, and realize the recipe needs a special case when a=b, where union and intersection coincide, resolved by declaring b=a.",
      hint: "Union gives {0,1}; subtract the intersection you found in the previous step.",
      conceptsExplored: ["logic-kuratowski-ordered-pair", "logic-definite-descriptions"],
    },
    {
      instruction:
        "Prove the characteristic property: assume {{a},{a,b}}={{c},{c,d}} and derive a=c and b=d by splitting into the two cases a=b and a not equal to b, tracking which members must match in each.",
      expectedOutcome:
        "You should produce a complete uniqueness proof, seeing that the a=b case forces all three sets to coincide while the a not equal to b case pins down the singleton and the doubleton separately by size.",
      hint: "When a differs from b the two members have different sizes, so equal pairs must match members of the same size.",
      conceptsExplored: ["logic-kuratowski-ordered-pair", "logic-ai-verified-proof"],
    },
    {
      instruction:
        "Show that for a in A and b in B the pair {{a},{a,b}} is a member of P(P(A union B)), then conclude that the Cartesian product A times B exists as a subset carved out by Separation.",
      expectedOutcome:
        "You should see {a} and {a,b} are subsets of A union B hence members of P(A union B), so the pair is a subset of P(A union B) hence a member of P(P(A union B)) — the product needs no new axiom beyond Power Set.",
      hint: "Chase the membership up two power-set levels: element, then subset of A union B, then member of P(A union B).",
      conceptsExplored: ["logic-kuratowski-ordered-pair", "log-logic-in-mathematics"],
    },
    {
      instruction:
        "Encode the relation < on {0,1,2} as an explicit set of Kuratowski pairs, then extract the successor function by keeping only pairs whose first coordinate is unique, and verify single-valuedness.",
      expectedOutcome:
        "You should build {(0,1),(0,2),(1,2)} as nested sets, then see a function is just a relation in which no two pairs share a first coordinate — functions and relations are both pure sets.",
      hint: "Single-valued means each first coordinate appears in at most one pair; the projection from step three identifies it.",
      conceptsExplored: ["logic-kuratowski-ordered-pair", "logic-definite-descriptions"],
    },
  ],
};

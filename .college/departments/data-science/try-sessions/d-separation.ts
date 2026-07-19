/**
 * D-Separation try-session -- reading conditional independence off a DAG.
 *
 * Walk a learner from the three elementary path shapes (chain, fork, collider),
 * through the blocking rules and the d-separation test, to soundness against a
 * factorizing distribution, the semi-graphoid axioms, collider-conditioning
 * (Berkson's paradox), and why d-separation is what makes "correlation is not
 * causation" a checkable structural claim rather than a slogan.
 *
 * @module departments/data-science/try-sessions/d-separation
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const dSeparationSession: TrySessionDefinition = {
  id: 'data-science-d-separation-first-steps',
  title: 'D-Separation: Reading Conditional Independence Off a Graph',
  description:
    'A guided first pass through d-separation -- from the three elementary ' +
    'path shapes (chain, fork, collider), through the blocking rules and the ' +
    'd-separation test, to soundness against a factorizing distribution, the ' +
    'semi-graphoid axioms, collider-conditioning, and why d-separation makes ' +
    '"correlation is not causation" a checkable structural claim.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Draw the three elementary three-node paths on a sheet: a chain A -> B -> C, a fork A <- B -> C, and a collider A -> B <- C. For each, ask: with nothing conditioned, does information flow between A and C? Then trace the arrows to decide whether A and C are marginally associated in each shape.',
      expectedOutcome:
        'You see that in the chain and the fork, A and C are marginally associated (the chain passes influence through B; the fork shares the common cause B). In the collider, A and C are marginally independent: they only meet at the head-to-head node B, which does not pass association on its own. The collider is the shape that behaves opposite to intuition.',
      hint: 'A path is a route of edges regardless of arrow direction. The question is whether that route is "open" -- whether it conducts statistical association -- not whether you can walk it following the arrows.',
      conceptsExplored: ['data-science-d-separation', 'data-probability-basics'],
    },
    {
      instruction:
        'Now condition on the middle node B in each shape and re-trace. Put B into the conditioning set Z and decide, for the chain, the fork, and the collider, whether the path from A to C is now blocked or opened.',
      expectedOutcome:
        'You state the core blocking rule: conditioning on the middle node of a chain (A -> B -> C) or a fork (A <- B -> C) BLOCKS the path -- B "screens off" A from C. But conditioning on the middle node of a collider (A -> B <- C) OPENS the path -- it induces association between the two parents that was not there before. Conditioning helps for chains and forks, hurts for colliders.',
      hint: 'This flip is the whole subtlety of d-separation. The collider rule also fires if you condition on any descendant of B, not just B itself.',
      conceptsExplored: ['data-science-d-separation'],
    },
    {
      instruction:
        'Assemble the full d-separation criterion. Take a longer DAG and two node sets X and Y with a conditioning set Z. State the condition under which every path between X and Y is blocked, and therefore X and Y are d-separated given Z. Write the collider clause carefully: "and all of its descendants".',
      expectedOutcome:
        'You articulate: a path is blocked by Z if it contains a chain or fork whose middle node is in Z, OR a collider whose middle node and all of its descendants are outside Z. X and Y are d-separated by Z when EVERY path between them is blocked. If even one open path survives, X and Y are d-connected given Z.',
      hint: 'It is a universal quantifier over paths: d-separation requires all paths blocked; d-connection needs only one open path. Enumerate paths, test each with the blocking rule, and AND the results.',
      conceptsExplored: ['data-science-d-separation'],
    },
    {
      instruction:
        'Open networkx and build a small DAG, e.g. Rain -> WetGrass <- Sprinkler and Season -> Rain, Season -> Sprinkler. Call nx.is_d_separator(G, {"Rain"}, {"Sprinkler"}, set()) and then nx.is_d_separator(G, {"Rain"}, {"Sprinkler"}, {"WetGrass"}). Compare the two verdicts and connect them to the collider you drew earlier.',
      expectedOutcome:
        'You observe Rain and Sprinkler are d-separated given the empty set through the WetGrass collider (the head-to-head node blocks the path), but become d-connected once you condition on WetGrass -- conditioning on the collider opens the path. The library reproduces exactly the collider flip you traced by hand.',
      hint: 'This is Berkson\'s paradox / explaining-away: learning the grass is wet makes Rain and Sprinkler dependent, because either cause explains the effect. The Season fork gives a second path to reason about separately.',
      conceptsExplored: ['data-science-d-separation', 'data-correlation'],
    },
    {
      instruction:
        'Now test soundness numerically. Sample from a distribution that factorizes over your DAG, then estimate the partial correlation of Rain and Sprinkler given the empty set versus given WetGrass. Match each empirical number to the d-separation verdict from the previous step.',
      expectedOutcome:
        'You confirm soundness in action: the pair the graph declares d-separated shows near-zero partial correlation, and the pair it declares d-connected (conditioning on the collider) shows a clearly non-zero partial correlation. The purely graphical criterion predicted the numerical independence structure without your ever inspecting the parameters.',
      hint: 'Soundness is the theorem: d-separation in the graph IMPLIES conditional independence in every distribution that factorizes over it. Faithfulness is the converse assumption -- that the data hides no extra independences -- and it can fail on measure-zero parameter cancellations.',
      conceptsExplored: ['data-science-d-separation', 'data-probability-basics'],
    },
    {
      instruction:
        'Treat d-separation as an algebra. Verify the semi-graphoid axioms on your DAG: symmetry (X ind Y | Z iff Y ind X | Z), decomposition, weak union, and contraction. Pick concrete node sets and check that each axiom the graphoid promises actually holds for the d-separation relation you computed.',
      expectedOutcome:
        'You recognize d-separation is a graphoid: the independence relation it induces obeys the semi-graphoid axioms, so you can manipulate conditional-independence statements symbolically -- combining and splitting conditioning sets -- with the same confidence you manipulate the underlying probabilities. The graph is a sound proof system for independence.',
      hint: 'The semi-graphoid axioms are why d-separation is not just a lookup table but a calculus: they let you derive new independences from known ones without returning to the joint distribution.',
      conceptsExplored: ['data-science-d-separation'],
    },
    {
      instruction:
        'Close by placing d-separation on the complex plane of experience: an abstract, medium-high-complexity criterion sitting between graph topology, probability, and causal inference. State one line that captures why d-separation is what turns "correlation is not causation" from a slogan into a checkable claim.',
      expectedOutcome:
        'You state something like: "d-separation reads the conditional independencies a causal DAG must satisfy directly off its arrows -- chains and forks are blocked by conditioning, colliders are opened by it -- so soundness lets the graph certify X ind Y | Z before any data is seen. That is what makes correlation-is-not-causation a structural, testable statement rather than a caution."',
      hint: 'The obs-implied independences are the testable footprint of a causal hypothesis: if the data violate a d-separation the graph predicts, the graph is wrong -- this is the basis of constraint-based causal discovery.',
      conceptsExplored: ['data-science-d-separation', 'data-correlation'],
    },
  ],
};

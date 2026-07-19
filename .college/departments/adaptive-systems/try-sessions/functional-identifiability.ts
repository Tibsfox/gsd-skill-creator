/**
 * Functional Identifiability try-session -- adaptive-systems (June-2026 arXiv cohort, T2).
 * @module departments/adaptive-systems/try-sessions/functional-identifiability
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const functionalIdentifiabilitySession: TrySessionDefinition = {
  id: 'adaptive-systems-functional-identifiability-first-steps',
  title: "Functional Identifiability: Recover the Dynamics, Not Just the Numbers",
  description:
    "A guided first pass through functional identifiability -- the generalization of classical structural parameter identifiability to unknown FUNCTIONS (constitutive relations) in differential-equation models, which Loman, Browning & Baker assess with differential-algebra techniques and use to flag the model classes where unique functional recovery is provably impossible. You go from differential elimination of a scalar ODE, through a hand-built non-identifiable equivalence class you simulate to collision, to why no feedback update can recover dynamics the observations cannot distinguish -- the recoverability precondition sitting upstream of any data-driven model discovery. (arXiv:2606.30289v1, 2026)",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write down the general model dx/dt = f(x, u), y = h(x) and mark f (and possibly h) as unknown FUNCTIONS rather than a finite parameter vector. State, in one line each, what structural parameter identifiability asks versus what functional identifiability asks.",
      expectedOutcome:
        "You articulate that parameter identifiability asks whether a finite vector θ is uniquely fixed by the data, while functional identifiability asks whether an entire unknown function is; both reduce to injectivity of the map from unknowns to observed input-output behaviour, and only the domain differs (finite-dimensional R^n versus a function space).",
      hint: "The unknown is now a point in a function space, not in R^n -- but the identifiability question, injectivity of unknowns-to-observations, is identical.",
      conceptsExplored: ["adaptive-systems-functional-identifiability"],
    },
    {
      instruction:
        "Run differential elimination on the scalar model dx/dt = f(x) + u with full-state output y = x. Differentiate the output, substitute the state equation, and write the resulting input-output equation containing only measured signals y, ydot, and u.",
      expectedOutcome:
        "You obtain ydot = f(y) + u, so f(y) = ydot - u is fully determined by the measured trace: the map from f to the input-output relation is injective and f is functionally identifiable. Eliminating the unobserved state left an equation in measured quantities alone -- the core move of the differential-algebra test.",
      hint: "Because y = x, every occurrence of the hidden state becomes a measured quantity; there is nothing left to hide the function behind.",
      conceptsExplored: ["adaptive-systems-functional-identifiability", "math-systems-polynomials"],
    },
    {
      instruction:
        "Now break identifiability. Take dx/dt = f(x)*u, y = h(x) with BOTH f and h unknown and h invertible. Set x = h^{-1}(y), differentiate y, derive the input-output equation, and read off which single functional the data actually constrains.",
      expectedOutcome:
        "You derive ydot = phi(y)*u with phi(y) = h'(x) f(x) evaluated at x = h^{-1}(y): only the composite phi is recoverable, not f and h separately. Any (f, h) pair yielding the same phi produces an identical input-output map, so the model is functionally NON-identifiable -- an entire equivalence class collapses to one observation.",
      hint: "The chain rule fuses h' and f into one product; the observation never sees the factors, only their composite along the trajectory.",
      conceptsExplored: ["adaptive-systems-functional-identifiability"],
    },
    {
      instruction:
        "Make the collision concrete. Pick two distinct pairs (f1,h1) and (f2,h2) that share the same phi(y), integrate both with scipy.integrate.odeint over a bank of several input signals u(t), and compare the outputs with np.allclose.",
      expectedOutcome:
        "The two simulations coincide to numerical tolerance for every input in the bank: two genuinely different dynamics produce one output trace. You have exhibited the non-identifiable equivalence class empirically, confirming the ambiguity is a real observational collision and not an artifact of the algebra.",
      hint: "Construct the pair by choosing any h2, then solving h2' * f2 = phi for f2; both pairs then share phi by construction.",
      conceptsExplored: ["adaptive-systems-functional-identifiability"],
    },
    {
      instruction:
        "Restore identifiability by changing the OUTPUT, not the dynamics. Fix h = identity so you measure y = x directly, re-run the differential elimination on dx/dt = f(x)*u, and show what the equivalence class collapses to.",
      expectedOutcome:
        "With y = x you get phi(x) = f(x), so f is now uniquely recovered as f(x) = ydot/u and the equivalence class shrinks to a single point. Identifiability is revealed to be a property of the (model, output-map) pair: enriching the observation, not the dynamics, is what buys recoverability.",
      hint: "The non-identifiability lived entirely in the unknown h; remove that freedom and the composite phi becomes f itself.",
      conceptsExplored: ["adaptive-systems-functional-identifiability"],
    },
    {
      instruction:
        "Return to the non-identifiable model and run the parent's move: an error-driven feedback update on (f, h) against the observed y. Track which member of the equivalence class the update converges to across several different initializations.",
      expectedOutcome:
        "The update drives the output error to zero but lands on whichever equivalence-class member is nearest its initialization -- never reliably the true (f, h). You conclude that error-driven parameter adaptation can only tune within what the data distinguishes, so functional identifiability is a strict prerequisite sitting upstream of any adaptation.",
      hint: "Zero output error is not zero parameter error when the loss surface has a flat valley -- the equivalence class IS that valley.",
      conceptsExplored: ["adaptive-systems-functional-identifiability"],
    },
    {
      instruction:
        "Place functional identifiability beside its control-theoretic sibling. In one or two sentences, contrast the differential-elimination injectivity certificate with the spectral (top-Lyapunov-exponent) certificate of Lyapunov gradient stability, noting what each guarantees before any fitting begins.",
      expectedOutcome:
        "You state that both are pre-fit structural certificates read off the model itself: functional identifiability runs differential elimination to certify that the observations can recover the dynamics, while Lyapunov gradient stability reads a spectral quantity to certify that gradients survive depth. One guards recoverability, the other trainability -- complementary preconditions for successful adaptation.",
      hint: "Neither certificate looks at fitted values; both are computed from the model structure alone, before a single data point is fit.",
      conceptsExplored: ["adaptive-systems-functional-identifiability", "adaptive-systems-lyapunov-gradient-stability"],
    },
  ],
};

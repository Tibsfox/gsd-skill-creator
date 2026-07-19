/**
 * Bregman Projection try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/bregman-projection
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const bregmanProjectionSession: TrySessionDefinition = {
  id: 'math-bregman-projection-first-steps',
  title: "Deriving the Bregman Projection and its Pythagorean Theorem",
  description:
    "Build a Bregman divergence from a convex potential, project a reference point onto a linear constraint, and verify the generalized Pythagorean theorem numerically -- recovering least squares and KL divergence as two instances of one convex-geometry operation.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "In a numpy script define two convex potentials phi_sq(x)=0.5*x@x and phi_ent(p)=sum(p*log(p)), each with its gradient, then code D(phi, x, y) = phi(x) - phi(y) - grad_phi(y) @ (x - y) and evaluate both on random x and y.",
      expectedOutcome:
        "You observe D is always nonnegative and vanishes only at x=y, and that the identical three-term formula yields squared-Euclidean distance for phi_sq and (unnormalized) KL divergence for phi_ent.",
      hint: "The divergence is the vertical gap between phi and the tangent drawn at y; strict convexity forces that gap positive.",
      conceptsExplored: ["math-bregman-projection", "math-information-geometry"],
    },
    {
      instruction:
        "Compute D(phi_ent, x, y) and D(phi_ent, y, x) on the same pair and confirm they differ, then hold y fixed and separately minimize each of the two slots over a small convex set to locate two distinct minimizers.",
      expectedOutcome:
        "You understand that because the divergence is asymmetric it defines two projections -- the m-projection minimizing the first slot and the e-projection minimizing the second -- that generally land on different points.",
      hint: "Only phi = 0.5*x@x makes D symmetric; every other potential splits projection into a dual pair.",
      conceptsExplored: ["math-bregman-projection", "math-information-geometry"],
    },
    {
      instruction:
        "For phi_ent compute the Legendre conjugate phi*(theta)=logsumexp(theta) and round-trip a probability vector p -> theta = grad_phi(p) -> grad_phi*(theta), checking you get p back to numerical precision.",
      expectedOutcome:
        "You see grad_phi maps mean/moment coordinates to natural coordinates and grad_phi* inverts it, so an m-projection in primal coordinates equals the e-projection in dual coordinates -- duality by conjugation.",
      hint: "For negative entropy the natural coordinates are log-probabilities and the conjugate is the softmax log-partition.",
      conceptsExplored: ["math-bregman-projection", "math-information-geometry", "math-exponential-decay"],
    },
    {
      instruction:
        "Take a target y and a linear moment constraint set C = {x : A@x = b}; solve the m-projection x_star = argmin over x in C of D(phi_ent, x, y) with scipy.optimize.minimize under the equality constraint.",
      expectedOutcome:
        "You obtain the maximum-entropy I-projection: the closest point of the constraint plane to y under the divergence, recognizable as the exponential-family tilt of y matching the prescribed moments b.",
      hint: "With phi_ent this is exactly Jaynes maximum entropy -- projecting onto moment constraints tilts y into an exponential family.",
      conceptsExplored: ["math-bregman-projection", "math-information-geometry"],
    },
    {
      instruction:
        "Pick any third point z lying inside the affine set C and numerically compare D(z, y) against D(z, x_star) + D(x_star, y), reusing the projection x_star from the previous step.",
      expectedOutcome:
        "You confirm the equality D(z,y) = D(z,x_star) + D(x_star,y) holds to numerical precision when C is flat -- the Bregman generalization of the Pythagorean theorem with x_star as the foot of the perpendicular.",
      hint: "Flatness of C is what turns the general inequality into an equality; bend C into a curved set and watch a residual appear.",
      conceptsExplored: ["math-bregman-projection", "mathematics-cramer-wold-slicing"],
    },
    {
      instruction:
        "Rerun the projection and the Pythagorean check with phi_sq in place of phi_ent onto the same affine C, and compare x_star against the ordinary orthogonal least-squares projection of y onto C.",
      expectedOutcome:
        "You see the Bregman projection collapse to orthogonal projection and the generalized Pythagorean theorem become the classical one, confirming least squares and maximum entropy are two faces of a single operation.",
      hint: "phi_sq has constant Hessian equal to the identity, so its divergence is squared distance and its projection is plain linear algebra.",
      conceptsExplored: ["math-bregman-projection", "math-optimal-transport"],
    },
    {
      instruction:
        "Define two constraint sets -- an empirical data set and a model exponential family -- and alternately Bregman-project between them in a loop, logging the divergence value at every half-step.",
      expectedOutcome:
        "You watch the alternating e-/m-projections drive the divergence monotonically down to convergence, recognizing the loop as the geometry underlying EM and KL-minimizing variational inference.",
      hint: "Each half-step fixes one argument and projects the other; monotone decrease is guaranteed because each half is itself a divergence minimization.",
      conceptsExplored: ["math-bregman-projection", "math-information-geometry"],
    },
  ],
};

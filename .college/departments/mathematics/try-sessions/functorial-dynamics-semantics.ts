/**
 * Functorial Dynamics Semantics try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/functorial-dynamics-semantics
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const functorialDynamicsSemanticsSession: TrySessionDefinition = {
  id: 'math-functorial-dynamics-semantics-first-steps',
  title: "Two Readings of One Laplacian: Compositional Dynamics from Scratch",
  description:
    "Build a small graph, form its Laplacian, and watch the same potential drive both a heat flow and a wave — then see why a functorial, lens-based semantics makes wiring two boxes together give you exactly the composite dynamics.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Take the path graph on 4 nodes (0-1-2-3). Write out its adjacency matrix A and degree matrix D by hand, then form the graph Laplacian L = D - A as a 4x4 integer matrix, and verify that every row of L sums to zero.",
      expectedOutcome:
        "You should see that L is symmetric and positive-semidefinite with every row summing to zero, because each diagonal degree exactly cancels its off-diagonal edge entries — the discrete analogue of a divergence-free constant field.",
      hint: "An interior path node has degree 2 and an endpoint has degree 1; A carries a 1 exactly where an edge exists.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-discrete-nodal-domains"],
    },
    {
      instruction:
        "Diagonalize L (numerically, or by hand for path-4) to get eigenvalues 0 = λ0 < λ1 ≤ λ2 ≤ λ3 and orthonormal eigenvectors φk. Record the constant vector as the λ0 = 0 mode and count the sign changes of each higher φk.",
      expectedOutcome:
        "You should recognize the eigenvectors as an orthonormal basis where the sign-change count grows with λ, so each eigenmode is a discrete standing wave — the nodal-domain structure that both later dynamics will ride on.",
      hint: "The lowest nonconstant mode changes sign once; higher modes oscillate more, exactly like Fourier harmonics on an interval.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-discrete-nodal-domains", "math-cayley-graph-fourier-embedding"],
    },
    {
      instruction:
        "Pick a spiky initial condition u0 = (1,0,0,0) and iterate the first-order heat step u_{n+1} = u_n - dt·(L u_n) for a small dt over ~50 steps, tracking each node's value and the running total Σu.",
      expectedOutcome:
        "You should watch the spike diffuse and flatten toward the constant λ0 mode while Σu stays exactly constant, confirming heat flow is per-eigenmode decay at rate λk with conservation of the zero mode.",
      hint: "In the eigenbasis the coefficient c_k decays like (1 - dt·λk)^n, and the λ0 = 0 coefficient never moves.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-exponential-decay", "math-discrete-nodal-domains"],
    },
    {
      instruction:
        "Now reuse the SAME L to integrate the discrete wave equation ü = -Lu by leapfrog: v_{n+1/2} = v_{n-1/2} - dt·(L u_n) then u_{n+1} = u_n + dt·v_{n+1/2}. Start from the same u0 with v0 = 0 and watch one node's value over time.",
      expectedOutcome:
        "You should see oscillation instead of decay: each eigenmode now evolves as cos(√λk·t), so the identical potential produces standing waves and only the order of the time derivative distinguishes wave from heat.",
      hint: "Replace the first-order decay factor with an oscillator of frequency √λk; total energy is now conserved rather than dissipated.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-solitons", "math-trig-functions"],
    },
    {
      instruction:
        "Write the scalar potential V(u) = ½⟨u, L u⟩ and compute its gradient ∇V = L u. Show that heat is the gradient flow u̇ = -∇V while wave is the Hamiltonian flow of H = ½|v|² + V(u), and state which quantity each reading holds fixed.",
      expectedOutcome:
        "You should understand that one potential V yields two dynamical systems — descent (dissipates V, a learning step) and Hamiltonian (conserves H, a mechanics step) — which are literally two functors out of the same operad object.",
      hint: "Gradient flow always decreases V; Hamiltonian flow conserves total energy H; both are fed by the very same ∇V = Lu.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-wasserstein-gradient-flow-langevin", "mathematics-coherent-functor"],
    },
    {
      instruction:
        "Model each node-update as a lens box with an input port (incoming neighbor values) and an output port (its own value). Wire nodes 1 and 2 by identifying node 1's output with node 2's input, compose their update lenses, and compare the composite's one-step map to the direct L-based step on that 2-node subsystem.",
      expectedOutcome:
        "You should find the composite lens reproduces exactly the coupled Laplacian update, demonstrating that the semantics is functorial: wiring in the operad corresponds to lens composition in Poly, so the whole is fully determined by its parts.",
      hint: "A lens is a (get, put) pair; composing lenses threads one box's output into the next box's input — the wiring diagram made into algebra.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "mathematics-coherent-functor"],
    },
    {
      instruction:
        "Add one edge (0-3) to close the path into a 4-cycle, recompute L, and re-run both the heat and the wave steps without changing any other line of code. Note how the eigenvalues and the slowest nonconstant mode change.",
      expectedOutcome:
        "You should see that changing only the wiring — the operad diagram — automatically changes both dynamics through the single recomputed L, confirming the functorial semantics localizes all model-specific content in one composable operator.",
      hint: "Closing the cycle raises the algebraic connectivity λ1, so heat mixing speeds up and wave frequencies rise together.",
      conceptsExplored: ["math-functorial-dynamics-semantics", "math-perron-frobenius-centrality", "mathematics-coherent-functor"],
    },
  ],
};

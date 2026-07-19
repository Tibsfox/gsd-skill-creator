/**
 * Functorial Dynamics Semantics -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/functorial-dynamics-semantics
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 28 * 2 * Math.PI / 33;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const functorialDynamicsSemantics: RosettaConcept = {
  id: "math-functorial-dynamics-semantics",
  name: "Functorial Dynamics Semantics",
  domain: 'mathematics',
  description:
    "Classical mechanics, gradient-based learning, and lattice diffusion look like unrelated dynamical theories, yet each is an open system that composes: wire outputs to inputs and the whole evolves as the assembled parts dictate. The construction, functorial dynamics semantics (Spivak, 2026), fixes an operad Arr of smooth adaptive arrangements — boxes with typed ports and smooth update laws — and interprets it by a functor into Poly, the category of polynomial coalgebras (input-output dynamical systems), where a system is a state set S with a lens S → p(S): a readout that emits an output from the current state, and an update that consumes an input to move the state. Make this concrete with one graph node as a box. Its state set is S = ℝ (the node value u); its output port emits u; its input port reads a neighbour's value w. The lens is the pair (readout: u ↦ u; update: u̇ = -(u - w)) — exactly one edge's Laplacian term, compiling to the state-machine step u ← u - dt·(u - w). Now wire two such nodes by feeding each box's output into the other's input port. Functoriality forces the composite to be the composite of the two lenses: state set ℝ², joint law u̇ = -Lu with L = [[1,-1],[-1,1]], the two-node graph Laplacian. The network's dynamics is fixed by its components and its wiring, nothing added — and because such diagrams nest, whole networks compile to explicit state machines. The same operad admits two functors over the one potential E(u) = ½⟨u,Lu⟩, whose gradient is ∇E = Lu. The descent reading sets u̇ = -∇E = -Lu — the dissipative heat equation, and, for a neural box, gradient descent with backpropagation. The variational reading makes E the potential energy of an action; Euler–Lagrange then returns ü = -∇E = -Lu — the conservative discrete wave equation. Same L, same potential, two functor images: compositionality, not coincidence, unifies them. (arXiv:2606.28984v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Read a wired system as a fold over its ports. Build the graph Laplacian `L = D - A` with numpy, then the two dynamics sit one line apart: heat is `u += -dt * L @ u`, wave is a leapfrog `v += -dt * L @ u; u += dt * v`. The semantics functor is just `compose = lambda fs: reduce(lambda g,f: f @ g, fs)` folded over lens matrices, and wiring a network is `[step(box, s) for box, s in zip(boxes, states)]` — same `L`, two readings. See Spivak 2020.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Model each box as a `Lens<State,In,Out>` owning its buffers by RAII, with ports as `Eigen::VectorXd` views into one contiguous arena. Template the semantics functor `template<class F> auto interpret(Wiring, F)` so heat and wave instantiate the same composition over a `Eigen::SparseMatrix<double> L`. A step is `u.noalias() -= dt * L * u;` (heat) or a leapfrog pair (wave); `Lens::put` writes downstream in place, no allocation in the loop. See Spivak 2020.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "A wiring diagram *is* an s-expression: `(compose (box heat) (box wave))` is at once the network and the program that runs it — homoiconicity makes the operad literally code-as-data. The functor is a macro `(defmacro interpret (diagram reading) ...)` that expands a diagram into nested `lens` calls; `(reduce #'compose-lens (mapcar #'interp boxes))` folds the ports. `(laplacian g)` yields one operator L; `(heat L)` and `(wave L)` are two rewrites. See Spivak 2020.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "mathematics-coherent-functor",
      description: "Functorial dynamics semantics IS a coherent functor from the operad of smooth adaptive arrangements into Poly: composition of wiring diagrams must map coherently to composition of lenses, and the parent's coherence conditions are exactly what makes a wired network's dynamics well-defined and independent of how the diagram is bracketed.",
    },
    {
      type: "cross-reference",
      targetId: "math-discrete-nodal-domains",
      description: "The shared potential ½⟨u,Lu⟩ has Laplacian eigenvectors whose sign patterns are the discrete nodal domains; both the heat and wave readings diagonalize in this same eigenbasis, so the two dynamics differ only in how each nodal mode evolves in time (decay versus oscillation).",
    },
    {
      type: "analogy",
      targetId: "math-wasserstein-gradient-flow-langevin",
      description: "The descent reading of the operad is a gradient flow of the potential; Wasserstein gradient flow is the same 'dynamics as steepest descent of a functional' idiom lifted to the space of probability measures, giving a measure-valued analogue of the learning semantics recovered here.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

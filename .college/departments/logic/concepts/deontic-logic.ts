/**
 * Deontic Logic -- logic concept (June-2026 arXiv cohort, T2).
 * @module departments/logic/concepts/deontic-logic
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 5 * 2 * Math.PI / 6;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const deonticLogic: RosettaConcept = {
  id: "logic-deontic-logic",
  name: "Deontic Logic",
  domain: 'logic',
  description:
    "Legal and moral reasoning is about what agents *ought* to do, not what merely *is* — yet classical logic only has truth. Deontic logic repairs this by adding a modal operator O ('it is obligatory that'), with permission Pphi = not O(not phi) as its dual and prohibition Fphi = O(not phi) as obligation-of-the-negation; adding the optional (permitted and omissible) corner completes the deontic square of opposition over obligatory/permitted/forbidden/optional. Standard Deontic Logic (SDL) is the normal modal system KD: O is read over Kripke frames whose accessible worlds are the deontically ideal ones, so Ophi means phi holds in every acceptable world while phi may still be false in the actual world — a violated duty. Axiom D (seriality) forbids Ophi and O(not phi) together, which makes SDL explode on genuine moral dilemmas via obligation-aggregation. Conflict-tolerant (paraconsistent, non-adjunctive) deontic logics drop aggregation so clashing duties coexist without deriving triviality. One such construction (arXiv:2606.30297v1, 2026) builds bi-neighborhood modal extensions of CLoN — a paraconsistent sublogic of First-Degree Entailment — using two distinct neighborhood functions per operator to validate weak-negation axioms, yielding a deontic logic that accommodates the usual deontic principles alongside genuine moral dilemmas without trivializing the norm-base. It matters because legal norms, contracts, and AI-agent policies are exactly obligations, permissions, and prohibitions.",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Model a deontic frame on a boolean world-axis: `phi = np.array([...], bool)` valuations, `R` a 0/1 accessibility matrix giving each world its ideal worlds. Obligation is an all-reduce over the ideal slice: `O = lambda phi,w: phi[R[w].astype(bool)].all()`; then `P = lambda phi,w: not O(~phi,w)`, `F = O(~phi,w)`. The deontic square is one comprehension: `[(O(phi,w),F(phi,w),P(phi,w)) for w in worlds]`. A dilemma is `O(phi,w) and O(~phi,w)`. See von Wright 1951.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Hold each world's valuation in a contiguous `std::vector<uint8_t>`; R is an `Eigen::MatrixXi` of ideal-world indices in a `DeonticFrame` (RAII owns and frees the DAG). `template<class Prop> bool Ob(const Frame& f,int w)` reduces Prop over the ideal slice via `std::all_of`; `Perm = !Ob<Not<Prop>>`, `Forb = Ob<Not<Prop>>`. Aggregating into `Ob<And<P,Q>>` is where clashing duties explode — a conflict-tolerant frame never instantiates it. See von Wright 1951.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Each norm is an immutable, content-addressed term: the #hash of `Obligation phi` IS its identity, so two derivations of one duty dedupe in the Merkle-DAG norm-base. `Ob`, `Perm`, `Forb` are pure functions over a frame value. Raising a clash is an effect: `ability Deontic where dilemma : Prop -> Prop ->{Deontic} a`. A `handle` block catches the dilemma and logs it — a genuine conflict is a handled effect, not an exception that trivializes the run. See von Wright 1951.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "log-logic-in-law",
      description: "Deontic logic supplies the formal modal machinery — obligation, permission, and prohibition operators evaluated over Kripke frames — that logic-in-law reasons about informally; it specializes the parent by promoting the legal 'ought' to a first-class modal operator.",
    },
    {
      type: "analogy",
      targetId: "logic-many-valued-logic",
      description: "Conflict-tolerant deontic logic relaxes classical explosion so clashing duties can coexist, mirroring how many-valued logic abandons bivalence-driven triviality; both are non-classical routes to reasoning under contradiction without deriving everything.",
    },
    {
      type: "cross-reference",
      targetId: "logic-ai-verified-proof",
      description: "Normative systems and AI-agent policies expressed in deontic logic can be machine-checked; a verified proof can certify that a conflict-tolerant norm-base remains non-trivial even in the presence of a genuine, unresolved moral dilemma.",
    },
    {
      type: "cross-reference",
      targetId: "logic-defeasible-deontic-compilation",
      description: "Defeasible deontic compilation's SG-DT operationalizes the obligation/permission modalities defined here, turning the abstract deontic frame into executable defeasible rules; this closes the currently one-way dependency into a reciprocal link.",
    },
    {
      type: "cross-reference",
      targetId: "logic-instruction-autoformalization",
      description: "Instruction autoformalization compiles this deontic content (obligations, permissions, prohibitions) into Cedar policy-as-code, showing the downstream enforcement path from the modal logic to executable authorization policy.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

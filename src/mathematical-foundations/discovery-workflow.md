# SAT→LLM→Lean Discovery Workflow — Julia Parameter v1.49.577

**Phase:** 834 (JP-009, HIGH)
**Component:** proof-companion-prerequisites
**Anchor:** arXiv:2604.21187 — Doubly Saturated Ramsey Graphs (computer-assisted discovery)
**Depends on:** JP-001 (`lean-toolchain.md`)

---

## Overview

The SAT→LLM→Lean three-step pattern systematizes computer-assisted combinatorial discovery. Each step has a distinct role:

1. **SAT solver** — exhaustive enumeration over a bounded search space, pruning by constraint.
2. **LLM codegen** — conjecture formation, pattern lifting, and Lean proof sketch generation.
3. **Lean compiler** — formal verification of the candidate proof against a pinned Mathlib commit.

The pattern is drawn from the Doubly Saturated Ramsey graph construction in arXiv:2604.21187, where a SAT solver found graph witnesses too large for manual search, an LLM lifted the pattern to a general parameterized conjecture, and Lean (Mathlib4) confirmed the formal statement.

---

## Step 1 — SAT Solver: Constraint Encoding

**Tool selections:**
- **z3** (`z3-solver` Python package, or `z3` binary) — preferred for arithmetic-heavy constraints and small-to-medium instances (≤10^5 clauses). Exposes Python API for programmatic constraint generation.
- **kissat** — pure CDCL solver for large CNF instances (>10^5 clauses). Faster than z3 on purely propositional problems; no theory extensions.

**Encoding pattern (Ramsey-style):**

```python
# Example: encode the non-existence of a monochromatic K_3 in a 2-colored K_5
from z3 import Bool, Solver, Or, Not, sat

edges = {(i, j): Bool(f"e_{i}_{j}") for i in range(5) for j in range(i+1, 5)}
s = Solver()
# For every triangle, at least one edge has a different color
for i in range(5):
    for j in range(i+1, 5):
        for k in range(j+1, 5):
            s.add(Or(edges[(i,j)], edges[(i,k)], edges[(j,k)]))
            s.add(Or(Not(edges[(i,j)]), Not(edges[(i,k)]), Not(edges[(j,k)])))
result = s.check()  # unsat → no 2-coloring of K_5 avoids a mono K_3
```

**Output contract:** a satisfying assignment (witness) or `unsat` (certificate). The witness or certificate feeds Step 2.

---

## Step 2 — LLM Codegen: Conjecture Lifting

**Model selection:**
- **claude-sonnet-4-x** — conjecture formation from SAT witnesses, pattern generalization from small cases to parameterized families, initial Lean proof sketches.
- **claude-opus-4-x** — deeper mathematical reasoning for multi-step proofs, complex Mathlib namespace navigation, proof obligation decomposition.

**Prompt pattern:**

```
Given: SAT witness [W] for graph property P on K_n.
Task 1: Generalize to a conjecture over all K_{n+k} for k ≥ 0.
Task 2: Identify the relevant Mathlib4 namespace (e.g., Combinatorics.SimpleGraph.Ramsey).
Task 3: Sketch a Lean 4 proof using `sorry` placeholders for the non-trivial steps.
Constraint: Use only identifiers available in Mathlib4 at commit [MATHLIB_COMMIT_HASH].
```

**Output contract:** a Lean 4 file with the conjectured theorem statement and a proof sketch. The sorry count is the "proof debt" to be discharged in Step 3.

---

## Step 3 — Lean Compiler: Formal Verification

**Toolchain:** pinned per `lean-toolchain.md` → `leanprover/lean4:v4.15.0` + Mathlib4 at the documented commit hash.

**Verification procedure:**

```bash
# 1. Write the LLM-generated sketch to a .lean file
# 2. Run lake build to type-check (sorry is allowed; ill-typed terms are not)
lake build

# 3. Replace sorry stubs one-by-one using Lean's tactic mode
# 4. When sorry count = 0, the theorem is fully proven
```

**LEAN_AVAILABLE gate:** if `LEAN_AVAILABLE=1` is not set, Step 3 is deferred to CI. The SAT and LLM steps remain runnable locally. See `lean-toolchain.md §JP-001` for the gate rationale.

**Proof-term contract:** a complete `.lean` file with `#check` passing and zero `sorry` invocations is the deliverable. Partial proofs (sorry stubs present) are tracked as open obligations in the proof companion.

---

## Tool Selection Summary

| Step | Tool | Rationale |
|---|---|---|
| SAT | z3 (small/medium) or kissat (large CNF) | Exhaustive, sound, complete over bounded domain |
| LLM | Sonnet (conjecture) / Opus (proof debt) | arXiv:2604.21187 §4 uses GPT-4 class; Sonnet/Opus match capability bracket |
| Lean | leanprover/lean4:v4.15.0 + Mathlib4 (pinned) | Formal certificate; pin ensures reproducibility (lean-toolchain.md) |

---

## Mapping to gsd-skill-creator Subsystems

| Discovery step | gsd-skill-creator analog |
|---|---|
| SAT witness search | `src/branches/` fork/explore/commit (COW bounded search over skill variants) |
| LLM conjecture lift | `src/orchestration/` multi-turn retrieval + M5 selector |
| Lean formal proof | `src/mathematical-foundations/` proof-companion pipeline (JP-030 / JP-031) |

The SAT step's bounded enumeration directly maps to the bounded-learning cap documented in `src/bounded-learning/CITATION.md` (JP-003): both enforce a finite, checkable search before committing an update.

---

## Concrete Toy Example (JS-only, no Lean required)

The smoke test at `__tests__/discovery-workflow-smoke.test.ts` encodes the following minimal combinatorial fact in pure TypeScript:

**Fact:** There is no proper 2-coloring of the edges of K_3 (complete graph on 3 vertices) such that no monochromatic triangle exists — because K_3 *is* the triangle, so any 2-coloring has a monochromatic K_3.

The test:
1. Enumerates all 2-colorings of K_3 edges (2^3 = 8 cases).
2. Checks each for a monochromatic triangle.
3. Asserts all 8 colorings contain a monochromatic triangle (the "unsat" result).
4. Prints the Lean statement that would be the output of Step 3 (gated on `LEAN_AVAILABLE`).

---

## References

### arXiv:2604.21187 — Doubly Saturated Ramsey Graphs

Primary anchor. Demonstrates the SAT→LLM→Lean pattern on doubly saturated Ramsey graph construction. SAT solver (kissat) found witnesses; GPT-4 class LLM lifted pattern; Lean (Mathlib4) formalized the extremal bound. §4 gives the full pipeline trace.

### lean-toolchain.md (JP-001)

Source of truth for the pinned Lean version (`leanprover/lean4:v4.15.0`) and Mathlib commit hash. Step 3 of this workflow is non-reproducible without the pin.

### arXiv:2510.04070 — Markov kernels in Mathlib (Degenne et al.)

Demonstrates Lean 4 / Mathlib4 formalization of probability kernels — the namespace context for the bounded-learning KL cap proof (JP-030).

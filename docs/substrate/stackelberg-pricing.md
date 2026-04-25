# Stackelberg Drainability Pricing Reference

**Status:** canonical substrate documentation
**Implements:** UIP-21 (Phase 773, v1.49.573 W8 T3a)
**Module:** [`src/stackelberg-pricing/`](../../src/stackelberg-pricing/index.ts)
**Reference paper:** arXiv:2604.16802 — Yan et al., "Stackelberg Game Framework
with Drainability Guardrails for Pricing and Scaling in Multi-Tenant GPU Cloud
Platforms", CDC 2026.
**CAPCOM Gate:** None (T3a — reference implementation only, no CAPCOM gate surface)

---

## 1. Background

Multi-tenant shared infrastructure introduces a pricing problem that is
structurally a bilevel (Stackelberg) game: the platform operator sets prices
over shared resource pools; tenants independently respond by choosing
consumption levels that maximise their utility net of cost. Without constraints,
a large tenant responding to low per-unit prices can scale up to consume nearly
all available capacity — a phenomenon formalised as *drainability* in the
academic literature.

Yan et al. (arXiv:2604.16802, CDC 2026) formalised this structure and proposed
the **drainability guardrail**: a constraint added to the leader's price-setting
problem that prevents any price vector from being admissible if the tenants'
joint best responses could collectively drain any shared resource below a safety
floor δ. The paper proves existence of a guardrail-feasible Stackelberg
equilibrium under mild regularity conditions on tenant demand functions, and
characterises convergence of an iterative best-response algorithm to the
equilibrium.

This module is a **reference implementation** of that framework, implemented in
plain TypeScript with no new dependencies.

---

## 2. Problem Formulation

### 2.1 Stackelberg game structure

Let **p** ∈ ℝ^R be the price vector over R shared resources. The platform
operator (leader) announces **p** first. Each tenant k ∈ {1, ..., K} then
solves:

```
max_{xₖ}  Uₖ(xₖ) − p · xₖ
s.t.       0 ≤ xₖ ≤ x̄ₖ
```

where Uₖ is tenant k's utility function and x̄ₖ is their per-resource capacity
cap. The best-response demand dₖ(**p**) is the solution to this problem.

The leader anticipates all best responses and solves:

```
max_{p}  Σₖ Revenue(p, dₖ(p))
s.t.     Σₖ dₖᵣ(p) ≤ Cᵣ − δᵣ   for all r  (drainability guardrail)
         p ∈ [pₘᵢₙ, pₘₐₓ]
```

where Cᵣ is total capacity of resource r and δᵣ is the safety floor. The
guardrail ensures the aggregate demand cannot drain resource r below δᵣ.

### 2.2 Drainability guardrail

A resource r is *drainable* at price vector **p** if:
```
Σₖ dₖᵣ(p) > Cᵣ − δᵣ
```

The drainability guardrail is the constraint that no admissible price vector
produces a drainable resource. Setting δᵣ = 0 recovers the unconstrained
Stackelberg problem; setting δᵣ = αCᵣ reserves fraction α as a protected
buffer.

### 2.3 Existence and convergence (Yan et al.)

The paper proves:

1. **Existence** — A guardrail-feasible Stackelberg equilibrium exists under
   mild regularity (continuous, strictly concave utility functions with
   bounded demand).
2. **Convergence** — An iterative best-response algorithm converges to the
   equilibrium.
3. **Monotone scaling** — Under drainability guardrails, equilibrium prices
   are monotone non-decreasing in the number of tenants: adding a tenant
   tightens the guardrail constraint, which pushes prices up.

---

## 3. Supported Utility Models

The reference implementation provides three tenant utility models:

### 3.1 Quadratic

```
U(x) = a·x − (b/2)·x²   (a, b > 0)
```

Closed-form best response: x* = max(0, min(x̄, (a − p) / b)).
This is the most analytically tractable model and admits exact solutions.

### 3.2 CES (Constant Elasticity of Substitution)

```
U(x) = A · (Σᵢ αᵢ xᵢ^ρ)^(1/ρ)   (A, αᵢ > 0; ρ < 1)
```

Special cases: ρ → 0 gives Cobb-Douglas; ρ = 1 gives linear; ρ → −∞ gives
Leontief. Best response computed via coordinate-wise grid search (3-pass
Gauss-Seidel).

### 3.3 Cobb-Douglas

```
U(x) = A · Πᵢ xᵢ^αᵢ   (A, αᵢ > 0)
```

Best response computed via coordinate-wise grid search. When any xᵢ = 0,
U = 0 (convention: zero in any input → zero utility).

---

## 4. Implementation

### 4.1 Module structure

```
src/stackelberg-pricing/
  index.ts                          — public API (feature-flagged)
  types.ts                          — all types and interfaces
  utility-models.ts                 — CES, Cobb-Douglas, quadratic utilities
  stackelberg-solver.ts             — bilevel solver (grid search)
  drainability-guardrail-checker.ts — guardrail feasibility checker
  settings.ts                       — opt-in flag reader (fail-closed)
  __tests__/
    utility-models.test.ts          — utility model correctness
    drainability-guardrail.test.ts  — ALLOW / BLOCK verdicts
    stackelberg-solver.test.ts      — equilibrium convergence
    integration.test.ts             — end-to-end + flag-gating
```

### 4.2 Solver approach

The bilevel problem is solved by grid search over the price space (leader
problem). For each price candidate:

1. All tenants' best-response demands are computed (follower problems).
2. Guardrail feasibility is checked for all resources.
3. Infeasible candidates are discarded.
4. Among feasible candidates, the revenue-maximising price vector is returned.

Grid resolution is configurable via `StackelbergGame.gridSteps` (default 20
steps per resource). The inner best-response solver uses 50 grid steps for CES
and Cobb-Douglas utilities.

Total price candidates explored: `(gridSteps + 1)^numResources`. For 2
resources at the default resolution, this is 441 candidates — fast enough for
reference use.

### 4.3 Revenue models

- **Linear** (default): Revenue = Σᵣ pᵣ · Σₖ dₖᵣ(**p**)
- **Quadratic** (margin-based): Revenue = Σᵣ (pᵣ − cᵣ) · Σₖ dₖᵣ(**p**)

---

## 5. Public API

### 5.1 `solveStackelberg(game, options?)`

Solve a Stackelberg game. Returns `PricingSolution` when the flag is on, or
`{ disabled: true }` when off.

```typescript
import { solveStackelberg } from './src/stackelberg-pricing/index.js';

const solution = solveStackelberg(game, { forceEnabled: true });
if ('disabled' in solution) {
  // Flag is off — passthrough
} else {
  console.log(solution.prices);           // { compute: 4.5, bandwidth: 2.1 }
  console.log(solution.revenue);          // 283.4
  console.log(solution.guardrailFeasible); // true
}
```

### 5.2 `checkDrainability(usages, guardrails, options?)`

Check whether a set of tenant usages satisfies drainability guardrails. Returns
`GuardrailVerdict` when the flag is on, or `{ disabled: true }` when off.

```typescript
import { checkDrainability } from './src/stackelberg-pricing/index.js';

const verdict = checkDrainability(usages, guardrails, { forceEnabled: true });
if ('disabled' in verdict) return;
console.log(verdict.verdict);         // 'ALLOW' or 'BLOCK'
console.log(verdict.resourcesFailed); // 0 (ALLOW) or ≥1 (BLOCK)
```

### 5.3 Key types

```typescript
interface StackelbergGame {
  resources: ResourcePool[];   // shared resource pools with capacity + guardrailFloor
  tenants: Tenant[];           // followers with utility functions + maxConsumption
  revenueModel?: 'linear' | 'quadratic';
  platformCost?: Record<ResourceId, number>;
  gridSteps?: number;
}

interface PricingSolution {
  prices: Record<ResourceId, number>;
  tenantUsages: TenantUsage[];
  aggregateDemand: Record<ResourceId, number>;
  revenue: number;
  guardrailFeasible: boolean;
  guardrailSlack: Record<ResourceId, number>;
  solverIterations: number;
}

interface GuardrailVerdict {
  verdict: 'ALLOW' | 'BLOCK';
  details: GuardrailDetail[];
  resourcesChecked: number;
  resourcesFailed: number;
}
```

---

## 6. Feature Flag

The module is **default-off**. The opt-in flag is at:

```
gsd-skill-creator.upstream-intelligence.stackelberg-pricing.enabled
```

in `.claude/gsd-skill-creator.json`.

With the flag off, both `solveStackelberg` and `checkDrainability` return
`{ disabled: true }` with no computation (zero-side-effect passthrough). This
guarantees byte-identical behaviour relative to any prior baseline — no price
computations occur, no file I/O beyond the settings read.

Optional config fields:
- `gridSteps: number` — override default 20 steps per resource (leader grid)
- `innerGridSteps: number` — override default 50 steps (follower grid search)

---

## 7. Test Coverage

Tests are in `src/stackelberg-pricing/__tests__/` and cover:

| Test category | What is verified |
|---|---|
| Utility model correctness | CES/Cobb-Douglas/quadratic produce mathematically expected values |
| Quadratic best response | Closed-form x* = (a−p)/b; law of demand; clamping |
| CES best response | Non-negative demand; respects maxConsumption |
| Drainability ALLOW | Usage within safe limit → ALLOW verdict |
| Drainability BLOCK | Usage exceeding safe limit → BLOCK verdict |
| Drainability details | totalConsumption, slack, remainingCapacity fields |
| Equilibrium convergence | Feasible solution for ≥2 utility models |
| Monotone scaling | Prices non-decreasing as tenants increase |
| Default-off byte-identical | Flag false → `{ disabled: true }` only |
| Integration 3-tenant+2-resource | Feasible solution, correct aggregate demand, revenue > 0 |
| JSON round-trip | PricingSolution serialises/deserialises without data loss |
| Reference-only | No imports from orchestration/dacp paths |
| No IP leakage | No proprietary entity names in source files |

---

## 8. Convergent-Discovery Note

arXiv:2604.16802 (Yan et al., CDC 2026) independently arrived at the same
structural problem formulation required by general multi-tenant shared
infrastructure pricing: a bilevel Stackelberg game where a platform operator
maximises revenue and tenant demand is constrained by a drainability guardrail.
The paper's existence theorem, convergence characterisation, and monotone
scaling result provide the formal academic foundation for this reference
implementation.

---

## 9. Constraints and Limitations

- **Reference implementation only.** No commercial deployment in this milestone.
  This module validates the Stackelberg Drainability methodology.
- **Grid search.** The bilevel solver uses grid search, not gradient-based
  optimisation. For large resource counts (>4), the `(steps+1)^R` search
  space grows rapidly.
- **Single-pass follower.** The best-response computation for CES and Cobb-
  Douglas uses 3-pass coordinate descent (Gauss-Seidel), which is sufficient
  for reference use but not guaranteed to reach the global optimum for non-
  concave configurations.
- **No new dependencies.** Implementation is plain TypeScript with Node.js
  built-ins only.

---

## Integration target

The module's integration target is the **multi-tenant skill/compute pricing
layer** — a reference framework for how shared infrastructure pricing can
be formalised as a Stackelberg bilevel game with drainability guardrails.
In the v1.49.573 context it is a reference implementation only; no
production pricing paths call this module. Use `checkDrainability` to
validate that a proposed tenant-usage configuration respects resource-floor
guardrails before any capacity-allocation decision is made.

```typescript
import { checkDrainability, solveStackelberg } from './src/stackelberg-pricing/index.js';

// Guard against over-allocation before confirming a resource request.
const verdict = checkDrainability(proposedUsages, guardrails, { forceEnabled: false });
if (!('disabled' in verdict) && verdict.verdict === 'BLOCK') {
  throw new Error(`Resource floor violated: ${verdict.resourcesFailed} resource(s) drained`);
}
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.16802** — Yan et al., *Stackelberg Game Framework with
  Drainability Guardrails for Pricing and Scaling in Multi-Tenant GPU Cloud
  Platforms*, CDC 2026

---

*Reference: Yan et al., "Stackelberg Game Framework with Drainability Guardrails
for Pricing and Scaling in Multi-Tenant GPU Cloud Platforms", arXiv:2604.16802,
CDC 2026.*

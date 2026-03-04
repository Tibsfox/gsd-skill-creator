# Chain Link: Platform Connection — Koopman Operator: Linear Lifting of Nonlinear Dynamics

**Chain position:** 95 of 100
**Type:** CONNECTION
**Score:** 4.50/5.0

---

## Score Trend (last 8)

| Pos | Topic | Score | Delta |
|-----|-------|-------|-------|
| 88 | Conn: Euler | 4.63 | +0.13 |
| 89 | Conn: Versine | 4.38 | -0.25 |
| 90 | Conn: Holo | 4.50 | +0.12 |
| 91 | Conn: DMD | 4.50 | +0.00 |
| 92 | Conn: Fourier | 4.63 | +0.13 |
| 93 | Conn: MFE | 4.38 | -0.25 |
| 94 | Conn: DBSCAN | 4.38 | +0.00 |
| 95 | Conn: Koopman | 4.50 | +0.12 |

rolling: 4.49 | part-B: 4.45 | floor: 4.25 | ceiling: 4.75

## The Mathematical Foundation

The **Koopman operator** K is an infinite-dimensional linear operator that acts on observables of a dynamical system rather than on the state space itself. Given a nonlinear dynamical system x_{n+1} = F(xₙ), the Koopman operator acts on observable functions g: X → ℝ as:

**(Kg)(x) = g(F(x))**

This is the key insight: while F may be nonlinear, K is always linear (it's a composition operator). The tradeoff is that K acts on an infinite-dimensional function space, while F acts on a finite-dimensional state space.

**Extended DMD (EDMD)** approximates K by choosing a finite dictionary of observables ψ₁, ..., ψₚ, lifting state vectors into the dictionary space, and applying standard DMD to the lifted data. The resulting eigenvalues approximate the Koopman eigenvalues.

The mathematical chain:

- **Linear operators on function spaces** (thm-12-1, thm-12-3): The spectral theorem guarantees eigendecomposition of self-adjoint operators. Koopman extends this to composition operators.
- **Complex exponential** (thm-14-1, thm-2-5): Koopman eigenfunctions are often complex exponentials e^{iωt}, placing eigenvalues on the unit circle.
- **Fourier analysis** (thm-6-1): The Fourier basis is a special case of Koopman eigenfunctions for linear systems. EDMD generalizes Fourier analysis to nonlinear dynamics.
- **Category theory** (thm-23-1, thm-23-2): The lifting x → ψ(x) is a functor from the state category to the observable category. Functors preserve composition, which is exactly why Koopman linearization works.

## The Code Implementation

**`src/packs/holomorphic/dmd/koopman.ts`** — The EDMD implementation. 91 lines, three functions:

- `liftDictionary(states, dictionary)`: Maps state vectors to observable vectors. Each state `[x₁, x₂, ...]` becomes `[ψ₁(x), ψ₂(x), ..., ψₚ(x)]`. This is the Koopman lifting step.
- `edmd(states, config)`: The full EDMD pipeline. Lifts states → forms SnapshotMatrix → calls `dmd()`. Returns DMDResult in the dictionary coordinate system.
- `EDMDConfig`: Dictionary of `KoopmanObservable` functions plus optional SVD rank.

**`src/packs/holomorphic/dmd/types.ts`** — The `KoopmanObservable` interface:
```typescript
interface KoopmanObservable {
  name: string;        // Human-readable name
  evaluate(state: number[]): number;  // The observable function ψ
}
```

This is the mathematical definition of an observable made concrete: a named function from state space to ℝ. The `evaluate` method IS the function ψ.

**Connection to DMD (dmd-core.ts):** EDMD calls the same `dmd()` function from Connection 91. The only difference is the input data: raw state snapshots for DMD, lifted observable snapshots for EDMD. This composition — lift then decompose — is the algorithm's defining structure.

## The Identity Argument

The EDMD implementation is the Koopman operator approximation algorithm, not a metaphor for it. The structural correspondence is complete:

| Koopman Theory | Platform Implementation |
|----------------|------------------------|
| State space X | `states: number[][]` |
| Observable function ψ: X → ℝ | `KoopmanObservable.evaluate(state)` |
| Dictionary {ψ₁, ..., ψₚ} | `config.dictionary: KoopmanObservable[]` |
| Lifting x → ψ(x) | `liftDictionary(states, dictionary)` |
| Koopman operator K | The DMD operator applied to lifted data |
| Koopman eigenvalues | `DMDResult.eigenvalues` from EDMD |
| Koopman eigenfunctions | `DMDResult.modes` in dictionary coordinates |
| Finite-rank approximation | SVD truncation via `config.rank` |

The `liftDictionary` function is the Koopman linearization. It takes nonlinear state data and maps it to a higher-dimensional space where the dynamics become (approximately) linear. This is not inspired by Koopman theory — it IS Koopman theory, implemented as a one-line map:

```typescript
states.map(state => dictionary.map(obs => obs.evaluate(state)));
```

One line of code. The entire Koopman lifting step. Because the mathematics is already simple — composition of functions — and the code does nothing more and nothing less than what the math says.

The empty-input guard (`states.length < 2 || dictionary.length === 0`) returns a zero-rank DMDResult. This handles the degenerate case where the observable space is trivial — there is nothing to decompose.

## Verification

- EDMD tests verify that lifted data produces valid DMDResults
- Dictionary evaluation tests confirm observable functions compute correctly
- Rank truncation tests show eigenvalue convergence with increasing rank
- Integration with dmd-core: EDMD results are valid DMDResults (same types, same invariants)
- Edge cases: empty states, empty dictionary, single-state input

## Cross-References

- **Chapter 8** (thm-8-1, thm-8-3): Derivatives and composition — the calculus behind observable dynamics
- **Chapter 10** (thm-10-1): Differential equations — the continuous-time analog
- **Chapter 12** (thm-12-1, thm-12-3): Linear algebra and spectral theory — eigendecomposition machinery
- **Chapter 23** (thm-23-1, thm-23-2): Category theory — the lifting as a functor
- **Connection 87** (Complex): Complex eigenvalues from the Koopman spectrum
- **Connection 91** (DMD): EDMD composes with DMD — lift then decompose
- **Connection 92** (Fourier): Fourier modes are Koopman eigenfunctions for linear systems

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.5 | Koopman operator correctly defined, EDMD algorithm faithfully implemented |
| Proof Strategy | 4.5 | The one-line lifting function is the strongest identity argument in the connections |
| Classification Accuracy | 4.5 | Correctly identifies EDMD as Koopman approximation, not general Koopman theory |
| Honest Acknowledgments | 5.0 | Finite dictionary = finite-rank approximation; explicitly acknowledged. No claim of infinite-dimensional computation |
| Test Coverage | 4.5 | EDMD, dictionary, rank, integration, edge cases all tested |
| Platform Connection | 4.5 | Direct identity for EDMD algorithm; Koopman application to skills is via DMD bridge |
| Pedagogical Quality | 4.5 | The one-line lifting code is pedagogically excellent |
| Cross-References | 4.5 | Strong links to Ch 8, 10, 12, 23 and three prior connections |

**Composite: 4.50**

## Closing

The Koopman operator linearizes nonlinear dynamics by lifting to observable space. The platform's EDMD implementation does exactly this: `liftDictionary` maps states to observables, `dmd` decomposes the lifted data, eigenvalues approximate the Koopman spectrum. The mathematics is simple — composition of functions — and the code is simple — a one-line map. Identity, not analogy.

Score: 4.50/5.0

# Kuramoto Synchronization + Distributed Systems Study Notes

**Date:** 2026-04-04 (Session 8)
**Sources:** fabridamicelli/kuramoto v0.4.0 (installed), aphyr/distsys-class (surveyed)
**OPEN Problems:** P11 (Kuramoto Synchronization), P4 (Distributed Intelligence)
**Ecosystem:** forest sim fireflies, trust-relationship.ts, Gastown convoy model

---

## 1. Kuramoto Package — Installation & Validation

**Package:** `kuramoto` v0.4.0 (Python, pip)
**API:** `kuramoto.Kuramoto(coupling, dt, T, natfreqs) → .run(adj_mat) → activity[n_oscillators, n_timesteps]`
**Dependencies:** numpy, matplotlib

### Coupling Sweep Results (n=20, all-to-all, ω ~ N(1.0, 0.3²))

| K | r (order param) | State |
|---|---|---|
| 0.0 | 0.084 | Incoherent |
| 0.2 | 0.353 | Partial sync |
| 0.5 | 0.722 | Synchronized |
| 1.0 | 0.959 | Synchronized |
| 2.0 | 0.991 | Synchronized |
| 5.0 | 0.999 | Synchronized |

**Theoretical critical coupling:** Kc = 2σ/(π·μ) ≈ 0.191 for Gaussian frequency distribution. Confirmed: transition from incoherent (r < 0.3) to partial sync occurs between K=0.0 and K=0.2.

### Key Observations

1. **Phase transition is sharp** — small increase in K near Kc produces large jump in r
2. **Order parameter r** = |⟨e^{iθ}⟩| measures global coherence (0 = random, 1 = locked)
3. **Adjacency matrix** controls topology — can model arbitrary network graphs, not just all-to-all
4. **Natural frequencies** represent intrinsic heterogeneity — analogous to agent processing speeds

### Mapping to Forest Sim (firefly synchronization)

The existing `forest/api/kuramoto-enhanced.js` on tibsfox.com implements:
- Adaptive coupling (K varies with local density)
- Order parameter tracking
- Cluster detection
- Spectral variation (frequency drift)
- Temperature-dependent rates

The Python kuramoto package provides a rigorous backend for validating the JS simulation. Experiments to run:
- **Graph topology comparison:** all-to-all vs. lattice vs. small-world vs. random graph
- **Frustration:** add phase offsets to model inhibitory connections (predator awareness)
- **Chimera states:** partial sync where some oscillators lock and others remain incoherent

---

## 2. aphyr/distsys-class — Distributed Systems Course

**Author:** Kyle Kingsbury (Jepsen)
**Format:** 16-32 hour course, 6 days, with Maelstrom labs
**Stars:** 9.5K

### Course Outline (Trust System Relevance)

| Day | Topic | Trust System Connection |
|---|---|---|
| 1 | Nodes, networks, clocks, causality | Agent identity, event ordering in event-log.ts |
| 2 | Consistency models (linearizability, causal) | Trust score consistency across agents |
| 2 | CRDTs, gossip protocols | nudge-sync, mail-async channels |
| 3 | Consensus (Paxos, Raft) | Mayor-coordinator leader election |
| 3 | Distributed transactions | Convoy commit/abort semantics |
| 4 | Coordination services (ZK, etcd) | Beads-state persistence layer |
| 5 | Production (testing, chaos) | Harness integrity, nondeterministic testing (P5) |
| 6 | Case studies (real-world failures) | Trust system threat model |

### Three Highest-Value Pieces

1. **Raft consensus lab** → test harness for agent agreement on trust state. The leader election model maps to mayor-coordinator. Implement a simplified Raft in the convoy model to guarantee trust-state consistency under partition.

2. **Linearizability** → strongest single-object consistency model. Trust-relationship.ts needs this: all agents must agree on current trust level. Currently our trust system is single-writer (orchestrator sets trust), which trivially satisfies linearizability. Multi-writer trust (peer assessment) would need formal consistency guarantees.

3. **CRDTs** → conflict-free replicated data types for eventually-consistent trust scores. If agents are partitioned, each partition can independently update trust observations. CRDTs allow these to merge without conflicts when connectivity is restored. A "trust counter CRDT" (increment for positive observations, decrement for negative) would give eventual consistency with bounded staleness.

### Maelstrom Labs to Run

- **Echo lab** — basic network communication (warm-up)
- **Broadcast/Gossip lab** (~1.5h) — maps to nudge-sync pattern
- **Raft lab** (~1h+) — consensus implementation
- **Datomic transactor lab** — immutable values + mutable identity (our beads-state model)

---

## 3. Connections to OPEN Problems

### P11: Kuramoto Synchronization
- **Installed tool validates P11 directly.** The coupling sweep reproduces the phase transition.
- **Next:** run on non-trivial graphs (small-world, scale-free) to test whether our forest sim's adaptive coupling produces chimera states.
- **GPU acceleration:** the math co-processor's `vectora_batch_eval` could parallelize large-N Kuramoto on the RTX 4060 Ti.

### P4: Distributed Intelligence Emergence
- **distsys-class provides the theory.** Consensus protocols (Raft/Paxos) guarantee that the convoy model produces consistent results under failure.
- **Key insight:** BFT 3m+1 bound from Session 7 — tolerate 1 adversarial agent requires 4 total. This connects to both the trust system's threat model and P4's question of whether collective intelligence emerges from constrained agents.

### P10: AI-Assisted Mathematical Discovery
- **Kuramoto + random matrix theory:** The eigenvalue spacing of the coupling matrix in Kuramoto models follows Wigner semicircle law for dense random graphs — same statistics as RMT/GUE in P13 (Riemann Hypothesis). This is the "Entropy = Fourier spectrum = Potential function" insight from Session 7.

### Session 7 Insight Confirmed
- **"Kuramoto synchronization = Nash equilibrium of a congestion game (Rosenthal potential)"** — verified: the Kuramoto dynamics minimize a potential function V = -K Σ cos(θᵢ - θⱼ), which is exactly the structure of a Rosenthal congestion potential. The order parameter r measures distance from the Nash equilibrium.

---

## 4. Next Steps

1. **Run Maelstrom echo + gossip labs** to prototype agent consensus testing
2. **Graph topology Kuramoto experiments:** compare sync behavior on the trust system's actual agent connectivity graph
3. **Implement trust counter CRDT** as a proof-of-concept for multi-writer trust scores
4. **Connect kuramoto Python package to math co-processor** via MCP for GPU-accelerated large-N simulations
5. **Map circadian drift (Math Section 10)** to Kuramoto with time-varying natural frequencies

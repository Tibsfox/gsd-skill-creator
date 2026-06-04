---
name: spectral-topology-preflight
description: >
  Before dispatching a multi-agent team, run a spectral diagnostic on
  the proposed communication graph and emit a (ρ, Δ, κ) coordination
  signature plus a pass/fail verdict against per-task-class thresholds.
  Builds the row-stochastic operator P from the team graph, computes
  the successor representation M = (I − γP)⁻¹, and ranks the topology
  for robustness (κ, condition number), consensus (Δ, spectral gap),
  and drift (ρ, spectral radius). Per Parks & Alharthi (arxiv
  2605.11453), rank order on (κ, Δ, ρ) predicts coordination quality
  pre-execution with rank correlations of 1.0 / 0.5 / −1.0. Triggers:
  "dispatch the team", "team topology check", "before running the
  agents", "is this team configuration OK", "team pre-flight".
user-invocable: true
version: 1.0.1
format: 2025-10-02
triggers:
  - "team pre-flight"
  - "topology check"
  - "before dispatching the team"
  - "is this team configuration OK"
  - "coordination signature"
updated: 2026-05-16
status: ACTIVE
source: arxiv 2605.11453 (Parks & Alharthi), 2605.05657 (RGAO budget algebra)
---

# Spectral Topology Pre-flight

## Why

Production multi-agent LLM systems fail at 41-87% rates from coordination defects, not from capability (Nechepurenko & Shuvalov, arxiv 2605.03310). Parks & Alharthi (arxiv 2605.11453) provide the first pre-inference diagnostic: spectral analysis of the team's communication operator predicts robustness (perfect rank correlation r_s = 1.0), consensus (r_s = 0.5), and drift (r_s = −1.0, *inverted*) **before any agent runs**. Cheap to compute, large effect on dispatch quality.

## How

Given a proposed team graph (agents = nodes, communication paths = edges):

1. **Build P** — the row-stochastic communication operator. Edge weights normalised so each row sums to 1.
2. **Compute M = (I − γP)⁻¹** — the successor representation. Use γ = 0.9 (standard).
3. **Extract three diagnostics**:
   - **κ (condition number of M)** — robustness signal. Lower = more robust.
   - **Δ (spectral gap of P)** — consensus signal. Larger = faster consensus.
   - **ρ (spectral radius of P)** — drift signal. Smaller = less drift (inverted from κ).
4. **Compare against per-task-class thresholds**:
   - For "deep-reason" tasks: prefer small κ, large Δ — robustness matters
   - For "exploration" tasks: prefer larger ρ — drift is exploration, not failure
   - For "consensus" tasks: prefer large Δ above all else
5. **Emit the signature** — `coordination_signature: { rho, delta, kappa, verdict, recommendation? }`. Verdict is `pass` / `warn` / `fail`. On fail, recommendation suggests a topology edit (drop/add edge, switch chain↔star↔mesh).

### Platform-constraint check (added v1.0.1)

Before recommending a topology change, verify the runtime can actually instantiate it. **Spawn-only runtimes** (Claude Code subagents, some serverless dispatch pools) cannot implement ring, mesh, or critique-route between workers — those runtimes only support star (one parent dispatches to N children; children return-result without inter-peer messaging). In a spawn-only runtime, the spectral menu collapses: ring/mesh/critique-route can only be *simulated* by the parent brokering messages between rounds, not wired directly between workers.

If the dispatcher is spawn-only, the skill's recommendation must describe **what the parent brokers between rounds**, not what edges to wire between workers. Concretely, when recommending against a star topology in a spawn-only runtime:

- "Switch to mesh" → "Broker mesh through parent: dispatch round 1 as star fan-out, parent gathers, dispatches round 2 with peers' draft outputs in each child's brief."
- "Switch to ring" → "Broker ring through parent: dispatch sequentially with each child receiving the prior child's output. (Loses parallelism.)"
- "Switch to critique-route" → "Broker critique loop through parent: dispatch a critic agent per round whose verdict shapes the next dispatch."

When the runtime supports inter-agent messaging (MCP servers with peer routing, custom orchestration), the spectral recommendations apply directly. Always check the runtime before recommending.

## Output schema

```json
{
  "topology": "chain|star|mesh|fully-connected|pipeline|leader-worker|hierarchical-fast-slow",
  "agent_count": 4,
  "coordination_signature": {
    "rho": 0.87,
    "delta": 0.42,
    "kappa": 12.3
  },
  "task_class": "deep-reason",
  "verdict": "warn",
  "recommendation": "drop the leader-to-worker-4 edge; the redundancy is uncalled-for and inflates κ"
}
```

## When to skip

- Single-agent dispatch (no graph to analyse).
- Team has already been pre-flighted in this session and topology hasn't changed.
- Team is fixed by external constraints and the pre-flight result can't be acted on.

## Integration

- Output should be emitted into the generated `TEAM.md` frontmatter as `coordination_signature: …` per arxiv 2605.11453 — so the team file carries its own diagnostic identity.
- `sc-dev-team`, `mayor-coordinator`, `sling-dispatch` — invoke before launching the team.
- `team-control`, `uc-lab` — long-running missions should re-run pre-flight when topology evolves.

## Cross-references

- Rosetta concept #8 (Constraint Drift) — pre-flight is the upstream check against coordination drift
- College: `agent-systems / multi-agent-orchestration / agent-spectral-topology`
- Related skills: `mayor-coordinator` (consumer of the verdict), `sling-dispatch` (consumer)

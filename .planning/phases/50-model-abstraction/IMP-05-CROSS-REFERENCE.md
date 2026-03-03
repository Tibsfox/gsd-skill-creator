# IMP-05 Cross-Reference: v1.49.14 Deferred Items vs v1.49.15 Mesh Scope

**Requirement:** IMP-05 — Cross-reference v1.49.14 deferred items at planning time (Phase 50)
**Created:** 2026-03-03 (Phase 50, Plan 01 execution)
**Status:** Complete

---

## Overview

Three items were deferred from v1.49.14 with documented mesh relevance.
This document maps each deferred item to the specific v1.49.15 phase and
requirement that incorporates its lessons.

---

## Cross-Reference Table

| v1.49.14 ID | Description | v1.49.15 Relevance | Action |
|-------------|-------------|-------------------|--------|
| ADVN-03 | Dependency cost analysis | Directly informs cost-aware routing (MESH-05, Phase 53). Cost data from dependency analysis feeds the routing policy that selects which mesh node runs a given task. | Incorporated as input signal to cost routing logic in Phase 53. |
| ADVN-04 | Automated PR generation | Pattern for mesh artifact generation (CTXT-03/04, Phase 54). Git worktree branch creation reuses the automated commit pattern developed in ADVN-04. | Pattern adopted in Phase 54 git worktree implementation. |
| EREG-01 | Private registry auth | Mesh nodes accessing private packages need auth config (MCP-02, Phase 52). Connection pooling in the LLM Wrapper mirrors the registry auth pattern (config-injected credentials, not hardcoded). | Auth config pattern carried to Phase 52 MCP Wrapper. |

---

## Detail Notes

### ADVN-03 → MESH-05 (Phase 53)

ADVN-03 built tooling to analyze dependency cost across the supply chain.
In v1.49.15, the cost-aware router (MESH-05) needs to compare execution costs
across mesh nodes to decide where to dispatch tasks. The cost signal format
developed in ADVN-03 (per-dependency cost estimates) is directly reusable as
an input to the routing policy's cost dimension.

**Phase 53 implementation note:** Cost routing policy should accept
`dependencyCost: number` alongside `latencyMs` and `modelCapability` when
scoring nodes for task dispatch.

---

### ADVN-04 → CTXT-03/04 (Phase 54)

ADVN-04 automated PR generation by creating branches, applying commits,
and opening pull requests without human intervention. In Phase 54, the
Context Preservation work (CTXT-03/04) uses git worktrees to isolate
mesh task branches — the same automated git operations (branch creation,
commit sequencing, worktree management) are required.

**Phase 54 implementation note:** Reuse the git operation primitives from
ADVN-04 (branch naming conventions, commit format, worktree path schema)
rather than re-inventing them.

---

### EREG-01 → MCP-02 (Phase 52)

EREG-01 addressed private registry authentication (npm, pip behind auth).
The pattern — inject credentials from config at connection time, never
hardcode in code, validate key format on startup — directly applies to
the LLM Wrapper (MCP-02) in Phase 52, which needs to authenticate to
potentially private or API-key-gated model endpoints.

**Phase 52 implementation note:** The `AnthropicChip` constructor in Phase 50
already implements this pattern (`apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY`).
MCP-02 should follow the same resolution chain: explicit config > environment > error.

---

## Summary

All three deferred items have concrete reuse paths in v1.49.15. None require
their own implementation slots — they inform the design of later phases.
This cross-reference serves as the planning artifact satisfying IMP-05.

# v1.25 — Ecosystem Integration

**Shipped:** 2026-02-19
**Phases:** 231-235 (5 phases) | **Plans:** 14 | **Requirements:** 38 | **Spec documents:** 17 (~10,558 lines)

Make implicit cross-dependencies between 18 ecosystem vision documents explicit through 5 analytical deliverables — a dependency DAG, a shared EventDispatcher specification, a dependency philosophy by layer, an integration test strategy, and a partial-build compatibility matrix.

### Key Features

**Ecosystem Dependency Map (Phases 231-232):**
- 20-node dependency DAG with 48 typed edges (requires/enhances/extends/conflicts)
- Machine-readable YAML with Mermaid diagram rendering
- Critical path analysis identifying 4-hop longest chain
- 5-milestone build sequencing recommendation (chipset + dashboard-console + lcp as maximum downstream unblocking)
- Node inventory with implementation status and edge classification

**EventDispatcher Specification (Phase 232):**
- Canonical single-inotify watcher design with fan-out to 6 subscriber profiles
- 1,020 watch budget (25% of 4,096 system target) with per-subscriber allocation
- AMIGA EventEnvelope adopted as ecosystem-wide standard
- Migration plan for 2 existing filesystem watchers (dashboard refresh, staging)
- 9-factor inotify-over-fanotify rationale (fanotify requires CAP_SYS_ADMIN)

**Dependency Philosophy (Phase 233):**
- 4-tier layering: Core (zero deps), Middleware (lean npm), Platform (native), Educational (inherits)
- Per-layer provides/requires contracts with numbered decision tree
- Ready-to-paste ESLint 9+ flat config for import boundary enforcement
- Rust module visibility strategy with `pub(crate)` conventions
- 4-step exception process for justified boundary crossings

**Integration Test Strategy (Phase 234):**
- Zod `.toJSONSchema()` + Vitest contract testing (Pact rejected: HTTP-focused, wrong boundary type)
- 6 priority integration flows with specific input/output contracts
- 8 semantic test cases per boundary with pass/fail criteria
- 3-tier freshness policies (contract: CI, semantic: weekly, fixture: monthly)
- Fixture directory structure and EventDispatcher compliance audit

**Partial-Build Compatibility Matrix (Phase 235):**
- 48-edge compatibility matrix with 3-state degradation tables (full/degraded/unavailable)
- 99 known-issues cross-referenced: 51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved
- Per-component standalone mode specifications with graceful degradation behavior
- 3-tier capability probe protocol: filesystem presence (Tier 1), import check (Tier 2), structured probe (Tier 3)

### Spec Documents Produced

| Area | Documents | Lines |
|------|-----------|-------|
| Dependency Map | node-inventory, edge-inventory | ~2,400 |
| EventDispatcher | eventdispatcher-spec | ~1,200 |
| Dependency Philosophy | dependency-rules, enforcement-spec | ~1,100 |
| Integration Tests | contract-testing-approach, semantic-tests-and-freshness, fixture-strategy-and-audit | ~2,400 |
| Compatibility Matrix | compatibility-matrix, degradation-specs, standalone-modes, capability-probe-protocol, known-issues-cross-reference | ~3,500 |

## Retrospective

### What Worked
- **Making implicit dependencies explicit.** 20 nodes, 48 typed edges (requires/enhances/extends/conflicts), and a Mermaid-rendered DAG -- this is the first time the entire ecosystem's dependency structure was visible in one place. The 4-hop critical path analysis reveals bottlenecks that were previously invisible.
- **EventDispatcher specification as ecosystem-wide standard.** Adopting AMIGA EventEnvelope as the canonical event format and designing a single-inotify watcher with fan-out to 6 subscribers solves the "multiple watchers competing for inotify budget" problem before it becomes a production issue. The 1,020 watch budget (25% of 4,096 target) shows resource discipline.
- **4-tier dependency philosophy with enforcement.** Core (zero deps), Middleware (lean npm), Platform (native), Educational (inherits) -- with ready-to-paste ESLint 9+ flat config for import boundary enforcement. Philosophy without enforcement is aspiration; this release ships both.

### What Could Be Better
- **10,558 lines of specification with no implementation.** This release is entirely analytical -- 17 spec documents, zero code changes. The value is real (ecosystem clarity), but the gap between specification and enforcement means these specs could drift if not actively maintained.
- **99 known-issues cross-referenced but categorization may not age well.** The 51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved breakdown is a snapshot. Without a process to re-evaluate periodically, the categories become stale.

## Lessons Learned

1. **Dependency DAGs should be built early, not as a catch-up exercise.** At 20 nodes and 48 edges, the ecosystem is already complex enough that manual dependency tracking is unreliable. Building this DAG earlier would have informed build sequencing decisions throughout v1.16-v1.24.
2. **inotify budget is a real constraint on Linux systems.** The 9-factor rationale for inotify over fanotify and the per-subscriber allocation model show that filesystem watching at scale requires explicit resource planning, not just "add a watcher."
3. **Partial-build compatibility matrices enable incremental adoption.** The 3-state degradation tables (full/degraded/unavailable) and 3-tier capability probe protocol mean users can run subsets of the system without everything installed. This is essential for a project of this size.

---

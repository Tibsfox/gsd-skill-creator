# v1.49.820 — Retrospective

**Wall-clock:** ~25 min from chain-continuation to tag-push. Fifth ship of the v816-822 chain.

## What worked

**branch-manager's helper-pattern shape made wiring trivial.** Single internal `execGit(cmd, args, cwd)` helper used by all 4 public functions. Threading `ctx?` was: 1 modification to the helper + 4 public-function signature changes + 10 callsite ctx-passes. Mechanical and reviewable.

**The discipline-application alternation (first-chip vs batch) worked.** v819 batched 5 aminet siblings. v820 first-chip a single git/core file. The pattern: when a family is structurally homogeneous AND co-located in the ledger, batch; when establishing the shape for a different family, first-chip and document. Both have their place.

**Future-batch trajectory documented in the allowlist comment.** The 2-line comment naming "future batch: repo-manager, state-machine, sync-manager" tells the next ship-owner exactly what to do. Pairs with #10432 ledger discipline — the allowlist is not just debt, it's a roadmap.

**Pre-existing tests passed without modification.** The optional-ctx pattern means default callers (which pass nothing) behave identically. 22 branch-manager tests + 2047 audit tests all pass on first run.

## What surprised

**The internal-helper pattern is actually IDEAL for chokepoint wiring.** When a file routes ALL spawn calls through a single internal helper, the wiring touches exactly: 1 helper signature + 1 ensure call + N public-function signatures + M callsite ctx-passes. The factor that varies is N (public functions) — not the spawn count. branch-manager's 10 spawn calls reduced to 14 LOC delta because the helper centralizes the spawn.

**Files without a helper pattern would be more verbose.** If branch-manager had 10 separate execFile calls in 4 public functions (no helper), the ensure calls would be 10 separate lines. The helper pattern collapses this. v819's aminet files had this property too (mostly single-spawn-per-function); v820 confirms the pattern generalizes.

**The "first-chip" framing IS valuable even when the family is well-understood.** I considered batching all 4 git/core files in this ship (per v819's batch precedent). The operator's chain plan said "first chip" — I stayed within scope. The shape difference matters for chain-discipline: each ship has a clear stop point, the chain doesn't bloat, future operators can size based on the per-ship cost. First-chip + future-batch is a deliberate cost-shape choice.

## What to watch

- **The remaining 3 git/core files (repo-manager, state-machine, sync-manager) are now eligible for batch.** Their spawn-pattern is similar (single internal helper or direct execFile calls). A future ship could apply v819's 5-file batch pattern to these 3 + maybe 1-2 others for a 4-5 file batch.

- **Process KNOWN_UNWIRED is at 31 entries.** Continues asymptoting toward zero per #10432. The next obvious targets: dogfood family (3 entries), scribe/netlist-renderer (3 entries), terminal (2 entries), mesh (2 entries). Each could be a 1-3 file batch.

- **The ensure-call placement INSIDE the helper is the canonical pattern.** All 10 spawn calls now route through `execGit` which calls `ensureProcessAllowed` once per invocation. This means if a future caller adds an 11th spawn through `execGit`, it's automatically wired. Compare to per-spawn-site ensure calls which require remembering for each new spawn.

## Verdict on scope

Closed at the canonical first-chip shape: 1 file + 14 LOC + allowlist edit + 5 release-notes files. Resisted: batching the family (operator's chain plan said first-chip), adding default-context factory, defining a typed `GitCommand` union. The first-chip is exactly the minimum that establishes the shape + closes 1 allowlist entry.

After v820, KNOWN_UNWIRED Process = 31. The chain continues with v821 (discipline-coverage gate flip part 1).

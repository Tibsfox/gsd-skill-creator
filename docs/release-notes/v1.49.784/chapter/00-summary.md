> Following v1.49.783 — _STATE.md Normalizer Fix_, v1.49.784 ships as Codification: 8 v781-v783 lesson candidates → 3 new operative disciplines.

# v1.49.784 — Codification ship

**Shipped:** 2026-05-26

A ~45min discipline-codification ship closing the 8-lesson backlog accumulated across the v780-v783 series. Last codification was at v1.49.654 (7+ ships ago). The backlog itself was an escalated deferred-maintenance item per the discipline it codifies (#10415).

Three new domain entries in `tools/render-claude-md/disciplines.json`, each backed by a new canonical doc in `docs/`:

- **Ledger-driven work** — 5 lessons (#10409–#10413). Per-file recon precedes per-file code; classify by behavior not filename; 3-way interface-conformance verdicts; separate ledger fields for filename-vs-class collisions.
- **Architecture-retrofit patterns** — 2 lessons (#10414, #10416). Optional `ctx?` pattern for chokepoint retrofit; tolerant generators (skip-the-line over `UNKNOWN` sentinels).
- **Deferred-maintenance escalation** — 1 lesson (#10415). Close escalated wedges within 1-2 milestones.

Eight formal lesson IDs (#10409–#10416) formalize the candidate IDs L781-1, L781-2, L781-3, L782-1, L782-2, L782-3, L783-1, L783-2.

CLAUDE.md regenerated via `npm run render:claude-md`. Manifest: 10 → 13 domains; 49 → 57 lessons. All 21 render-claude-md tests pass.

Engine state unchanged (NASA 1.177); counter-cadence count unchanged at 5. Forward-cadence discipline-codification ship.

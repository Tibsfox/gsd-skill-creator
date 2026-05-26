> Following v1.49.777 — _Wave 1 Review BLOCKERs / Security + Correctness Counter-Cadence_, v1.49.778 ships as Wave 2 Review HIGHs / Security + Correctness Counter-Cadence.

# v1.49.778 — Wave 2 Review HIGHs / Security + Correctness Counter-Cadence

**Shipped:** 2026-05-26
_Parse confidence: 0.50 — source `docs/release-notes/v1.49.778/README.md`_

## Summary

Counter-cadence ship #4 — closes the 10 HIGH-severity findings from the v1.49.777 risk-tier sweep that were deferred to a Wave 2 ship. Four security (pty_open shell allowlist, dashboard JS injection + path traversal, dashboard server 127.0.0.1 + Origin allowlist, hooks fail-closed) and six correctness (walk.ts FD leak, commit.ts FD+lock leak, KB JSON.parse defense, arena.rs panic→Result, manifest-patcher escapeRegExp, mcp_host raw-pointer UB). Engine state UNCHANGED (NASA degree sustains at 1.177). Counter-cadence interval from v777 = 1 milestone (tightest yet). Fourth counter-cadence in the engine (parents: v1.49.585 + v1.49.776 + v1.49.777).

It also produced retrospective content (decisions, lessons_learned, surprises, what_could_be_better, what_worked); see `03-retrospective.md`.

5 lesson candidates extracted; see `04-lessons.md`.

---
**Prev:** [v1.49.777](../v1.49.777/00-summary.md) · _(current tip)_

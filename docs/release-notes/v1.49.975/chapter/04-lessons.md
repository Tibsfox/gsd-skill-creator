# v1.49.975 — Lessons

No new manifest lesson is promoted this ship (manifest count stays 152). Ship 2.3 applies several existing lessons and surfaces reusable observations.

## Applied (existing lessons)

- **Verify-the-plan-premise (the D1/D3/v974 pattern)** — the audit plan said relocate `gsd-orchestrator` + 3 "frozen" agents to `examples/`. Recon found all four are description-dispatched and load-bearing, and relocating breaks three ship gates. Executing a ledger entry includes verifying its named targets against the live tree; the relocation half was dropped, not forced.
- **Allowlist-the-scanner-blind-spot (adoption-scan discipline, #10420-era)** — a static dispatch-site scan cannot see description-dispatched or shell-invoked callers, exactly as the src/ import-graph scanner cannot see dynamic-`require()`/shell-CLI consumers (hence its `settings`/`initialization`/`retro` entries). The agent allowlist is the same mechanism: it documents *why* a zero-site result is expected and exempts it from the gate, without changing the reported status.
- **#10461 gate-enforce + drift-guard pairing** — the integration drift-guard is named `*.test.ts` so the root vitest project runs it every ship (Layer 1); its assertions pin allowlist↔source integrity, the no-un-allowlisted-dormant invariant, baseline freshness, the dated gate, and verdict-doc coverage (Layer 2). No new pre-tag-gate shell step / denominator bump — gate count stays 20.
- **#10409 scope discipline + dated-gate (D3 island-park pattern)** — the one genuine orphan (`gsd-intel-updater`) was parked with a dated 2027-06-04 retire-or-resume gate rather than retired on the spot, matching how the D3 control-theory island and the src/ `upstream` triage were handled. Conservative, reversible, and time-boxed so the exemption can't calcify.

## Process notes

- **Adding a `child_process` caller is a security-surface change.** The `ProcessContext` chokepoint audit (`src/security/process-context-audit.test.ts`) fails any new `src/` file that imports `child_process` without calling `ensureProcessAllowed()` (or a documented exemption). A CLI command that spawns a tool must thread the chokepoint — copy the `keystore.ts`/`terminal.ts` pattern. This trips on `dev` CI, not the targeted local suite, so run the security audit test locally when adding a spawn.
- **A static dispatch scan will false-positive the whole tier if the corpus is too narrow.** Restricting the grep to only `team-control`/`uc-observatory` would have read the entire `gsd-*` specialist tier as dormant; the corpus must include the GSD workflows + slash-commands where those agents are actually dispatched. Scope the corpus to the full installed runtime surface, not a subset.
- **Keep observability and decision surfaces separate.** The scanner + allowlist + baseline are observability; the per-agent WIRED/KEEP/PARKED verdicts live in `AGENT-ADOPTION-VERDICTS.md`. Mixing them makes the "what's the disposition" question harder to answer than the "what does the scan say" question.

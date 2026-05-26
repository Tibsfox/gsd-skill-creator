# 04 — Lessons Learned: v1.49.792 Fourth Shelfware Verdict

## 0 candidates emitted

This ship is a clean application of existing disciplines; no new pitfalls surfaced. The v791 candidate #10424 (adoption-refresh-after-bump) did NOT re-trip — successful application of the prose-in-handoff warning across one ship interval. (Still candidate; awaits second instance OR migration to a deterministic gate.)

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — applied. ~5 min reading `src/koopman-memory/{index,koopman-operator,invariants,settings,types}.ts` + `src/cli/commands/dacp-drift-check.ts` (template) + `src/cli/dispatch.ts` surfaced the structural similarity to v789's WIRE and the absence of a `memory` namespace, leading to the top-level-command decision. 5th consecutive application since v784 codification — recon-first remains the dominant pattern not the exception.
- **#10417 (Test harnesses use `spawnSync`, not `execSync`)** — applied prophylactically. The `koopman-check.test.ts` uses vitest's in-process mock-at-module-level pattern (no subprocess shell at all), which avoids the WARN-on-exit-0 trap by construction. Different mechanism, same defensive posture.
- **#10422 (Verdict-pattern surface separation)** — applied: 3 surfaces touched independently (CLI wire, decision ledger, project-state).
- **#10423 (Lightest wire that satisfies the verdict)** — applied: top-level CLI command (one dispatcher entry, no namespace) instead of a new `memory` namespace dispatcher (would have added ~30 lines for one subcommand).
- **#10424 candidate (Adoption-refresh AFTER bump)** — applied: did NOT trip the v791 anti-pattern. Prose-in-handoff signaling held across one ship interval; the candidate's promotion-to-ESTABLISHED still warrants the deterministic-gate migration but the immediate symptom did not recur this ship.

## What's now codified that wasn't before

Nothing in the manifest — this ship validates 5 existing disciplines and emits 0 new candidates. Verdict-pattern disciplines (#10422, #10423) now have second sequential application; recon-first (#10412) has 5th sequential application.

## Forward backlog (unchanged from v791 close)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10424 candidate | MEDIUM | Operational-sequencing constraints that have tripped 2+ ships | v791 adoption-refresh-before-bump re-trip |

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 64 → 64 (no formal ID emitted; #10424 still candidate)
Codified-vs-uncodified gap: unchanged

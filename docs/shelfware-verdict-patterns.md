# Shelfware Verdict Patterns Discipline

**Surface:** Authoring a per-module shelfware verdict (WIRED / RETIRED / ALLOWLISTED) for a module flagged by the adoption-scan as test-only; selecting the wire site that satisfies a WIRED verdict.

**Codified at:** v1.49.790 (lesson cluster from v1.49.789 — the first per-module shelfware verdict (`semantic-channel` WIRED) surfaced two distinct design pressures that apply to every future verdict ship).

**Related:** [`docs/SHELFWARE-VERDICTS.md`](SHELFWARE-VERDICTS.md) (the ledger of emitted verdicts) and [`docs/static-analysis-tool-discipline.md`](static-analysis-tool-discipline.md) (the observability surface that produces the candidate list).

## Why this discipline exists

The Tier 1 audit at v1.49.785 surfaced six Math Foundations Refresh modules with zero real callers ("test-only" status). The T1.2 trilogy (v786 scanner + v787 dashboard/automation/allowlist + v789 first verdict) converted the observability surface into a closed feedback loop:

```
scanner (v786) → dashboard (v787) → allowlist (v787) → SHELFWARE-VERDICTS.md (v789)
   data            visibility         intentional       per-module decision
                                      isolation         backed by artifact
```

The v789 ship was the first time an operator emitted a per-module verdict. Two design pressures showed up on that first attempt — both load-bearing for the five remaining candidate modules and for every future verdict-driven ship.

## Discipline patterns

### Verdict-pattern surface separation is load-bearing (Lesson #10422)

The observability surface (scanner + dashboard + allowlist) and the decision surface (per-module wire-or-retire verdicts) MUST live in separate files and evolve independently.

- **Observability** answers "which modules have no real callers?" — pure scan; no judgement.
- **Allowlist** answers "which modules' test-only status is intentional?" — operator judgement, but reversible without changing any code.
- **Verdict** answers "what did we do about a specific module?" — operator decision, backed by an artifact (commit SHA + wire site OR removal commit).

Surface separation lets each layer evolve independently:

- Operator can change verdict policy without touching the scanner.
- Scanner changes (new importer roots, new behavior signatures) don't invalidate prior verdicts.
- Allowlist edits are cheap (one-line markdown) and reversible.
- Verdict commits are durable (code change + ledger row).

**Anti-pattern.** A monolithic `adoption-status.md` that mixes scanner output, intentional-isolation reasoning, and per-module verdicts in one file. Every layer's edits churn the same file; rebases conflict on unrelated changes; the decision trail is hard to reconstruct.

**Reference implementation.**

- `tools/adoption-scan.mjs` + `docs/ADOPTION-BASELINE-v<N>.{md,json}` — observability.
- `docs/ADOPTION-ALLOWLIST.md` — intentional-isolation list.
- `docs/SHELFWARE-VERDICTS.md` — per-module verdict ledger.

Each surface has exactly one input source and exactly one author audience.

### The lightest wire that satisfies the verdict wins (Lesson #10423)

A WIRED verdict requires that the module move from `test-only` to `living` in the next adoption-scan. Many wires satisfy that requirement. Default to the cheapest wire that matches the verdict's intent; defer richer wires to follow-on ships if they prove necessary.

A "natural" wire often touches multi-consumer surfaces (e.g. `src/dacp/`, `src/interpreter/`, `src/exec/`). A "light" wire often touches a single CLI subcommand or a single test fixture. Both flip the adoption-scan status. The light wire:

- Has bounded blast radius.
- Preserves HARD-preservation invariants by not touching the surfaces those invariants protect.
- Is reversible if the verdict is later revisited.
- Ships in 1 ship-unit instead of 3.

**Anti-pattern.** Designing the verdict around the most architecturally pleasing wire site, then discovering mid-build that the wire requires touching HARD-preservation invariants or multi-consumer modules. The verdict ship balloons; reviewers can't separate the verdict decision from the architectural change.

**Reference implementation.** v789 `semantic-channel` WIRED — implemented as a single new CLI subcommand (`skill-creator dacp drift-check`), not as an in-loop wire into `src/dacp/` or `src/interpreter/`. Blast radius: 2 new files + 1 dispatcher edit. Adoption-scan flipped on the next run.

**Heuristic for "lightest wire that satisfies."** Ask: "What is the smallest unit of code that, if it imports this module's public API, flips the adoption-scan classification?" Usually the answer is one CLI subcommand or one tooling script. Reserve in-loop wires for cases where the verdict explicitly requires production use, not just adoption-scan flip.

## When this discipline kicks in

- About to author a new row in `docs/SHELFWARE-VERDICTS.md` (any verdict type).
- About to select the wire site for a WIRED verdict.
- About to design a new observability surface that produces operator-decision input.
- About to extend the adoption-allowlist or adoption-baseline with operator judgement that belongs in a different file.

## Anti-pattern summary

- ❌ Mixing observability output, intentional-isolation reasoning, and per-module verdicts in one file.
- ❌ Selecting the "most natural" wire site without checking blast radius against HARD-preservation invariants.
- ❌ Bundling a verdict decision with an architectural refactor in the same ship.
- ❌ Wiring a module into a multi-consumer surface when a single CLI subcommand suffices.

## Lesson references

- **#10422** — Verdict-pattern surface separation is load-bearing. Promoted from v789 candidate.
- **#10423** — The lightest wire that satisfies the verdict is preferable to the most natural wire. Promoted from v789 candidate.

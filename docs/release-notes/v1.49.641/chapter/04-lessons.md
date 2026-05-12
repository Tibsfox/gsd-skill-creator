# 04 — Lessons: v1.49.641 Housekeeping Cluster #8

## Summary

**1 forward lesson emitted** (#10205) + **2 lesson apply-to-self confirmations** (#10199 §1.4 first canonical application; #10204 codified into automation).

## Lesson #10199 §1.4 — first apply-to-self confirmation

### Origin

`docs/MISSION-PACKAGE-DISCIPLINE.md` §1.4 codified the re-framing review at v1.49.640 C2. The discipline:

> At any mission-package W0 where a CF has been routed through 4 or more predecessor clusters without closure, add an EXPLICIT W0 step: "Could the framing be wrong?"

The discipline had been authored but not yet applied. v1.49.641 was the first cluster to encounter a CF chain ≥4 clusters AFTER §1.4 codification — CF-11 had been routed through v1.49.636 → .637 → .638 → .639 → .640 → **.641** (5+ clusters).

### v1.49.641 W0 first application

Applied §1.4's mandated four-question framework to CF-11:

| Question | Probe | Finding |
|---|---|---|
| Q1: "Could the framing be wrong?" | `grep -rn 'loadCartridge' src/` to find runtime callsites for the 7 unfit chipsets | NONE — chipsets aren't loaded by runtime |
| Q2: "Has the cartridge architecture moved?" | Check `tools/render-claude-md/file-locations.json` + `src/cartridge/loader.ts` design | YES — math-coprocessor promoted out 2026-04-19; trajectory is "promote out" not "migrate within" |
| Q3: "Are the legacy chipsets actually USED?" | Reference grep + LOAD-callsite grep separation | YES at reference (108+) but NO at runtime LOAD level |
| Q4: "Shape-category vs root-mechanism framing?" | Explicit framing-error self-check per §1.4 | YES — original framing was category-level; root mechanism was "no enforcement" |

Verdict: **framing was wrong; CF-11 retired**.

### Confirmation

The §1.4 discipline worked exactly as designed:
- Caught a framing error at W0 (before authoring component spec)
- Used mechanical evidence (grep / file existence checks) not speculation
- Produced clear retire-vs-continue verdict
- Documented at `.planning/c0-cf11-reframing-review.md` for future reference

The cost-of-not-doing-it would have been ~30-60min of cartridge migration work (3 new adapters for shape families A/B/C/D) producing no operational value (no enforcement requires migration).

### Forward applicability

§1.4 is now PROVEN at scale. Future N+k cluster authors with ≥4-cluster CF chains have a canonical apply-to-self example at `.planning/c0-cf11-reframing-review.md`. The 4-question framework is reusable verbatim.

The §1.4 discipline pattern: **structured re-framing questions + mechanical evidence + clear verdict + documentation**.

## Lesson #10204 — codified into automation

### Origin

`docs/test-discipline/cf-closure-verification-templates.md` §"Hidden-transitive guard" codified Lesson #10204 (hidden-transitive guard pattern) as a copy-paste bash snippet at v1.49.640 C2.

### v1.49.641 codification into automation

The guard pattern is now `node scripts/closure-verify-cf.mjs hidden-transitive-guard <package>`. Mechanical: `npm ls <pkg> --depth=Infinity --json` to enumerate subtree → grep src/ for any direct imports satisfied by subtree packages → report hits.

Same output format as the manual snippet, same logic, but executable.

### Confirmation

The transition from "documented bash snippet" to "executable probe" is the natural lifecycle endpoint for many disciplines. Future path-d-style root-dep removals can:

```bash
node scripts/closure-verify-cf.mjs hidden-transitive-guard <pkg-to-remove>
```

before editing `package.json`, instead of manually pasting + customizing a bash snippet.

### Forward applicability

The Lesson #10204 pattern (pre-flight check before destructive ops) generalizes beyond hidden transitives. Future operations of similar shape (e.g., "before removing a chipset, check who imports it") could follow the same probe + record + auto-generated rationale flow.

## Lesson #10205 — Discipline-as-code in 3-cluster lifecycle

### Statement

A discipline emitted as a lesson can travel through three abstraction transitions in successive clusters:

1. **Lesson emitted** at retro time (chapter 04-lessons.md)
2. **Discipline codified** as a doc (e.g., `docs/MISSION-PACKAGE-DISCIPLINE.md`) at a later cluster's C2
3. **Discipline codified as automation** (e.g., `scripts/closure-verify-cf.mjs`) at another later cluster's C2

This 3-cluster lifecycle is the natural maturation path for disciplines that benefit from:
- Reasoning across teammates (lesson → doc)
- Execution speed / consistency (doc → automation)

Disciplines that don't benefit from automation (e.g., social conventions, judgment calls) stop at step 2. Disciplines that do benefit (e.g., mechanical probes, pre-flight checks) advance to step 3.

### Source incident

Lesson #10199 demonstrates the lifecycle:
- v1.49.639 retro: Lesson #10199 emitted
- v1.49.640 C2: codified at `docs/MISSION-PACKAGE-DISCIPLINE.md`
- v1.49.641 C2: codified at `scripts/closure-verify-cf.mjs`

The 3-cluster lifecycle is fast — a discipline emitted today can be automated within ~3 clusters at the current cluster velocity (1-2 days each).

### Mitigation

No mitigation is needed; this is a maturation pattern, not a problem. The forward-applicability is:

**For future lessons emitted**: at the retro-time emission, the author should briefly note whether the discipline is a candidate for:
- **Doc-only** (judgment calls, social conventions) — codify in next cluster
- **Code-eligible** (mechanical probes, pre-flight checks) — codify in next cluster, automate in subsequent

This forward-note discipline (per Lesson #10196) should mention the lifecycle target so future cluster authors can plan accordingly.

### Forward applicability

The pattern applies to any mechanical discipline. Candidates currently observable:
- Lesson #10180 (skip-guard pattern) — already auto-applied via `it.runIf(...)` — done
- Lesson #10192 (substrate-probe) — codified at SUBSTRATE-PROBE-DISCIPLINE.md; automation candidate: `scripts/substrate-probe.mjs` to generate evidence sections
- Lesson #10199 (closure-verification) — full lifecycle complete via v1.49.641 C2
- Lesson #10201 (git-add-blocker compound-command) — automation candidate: hook revision in git-add-blocker.js
- Lesson #10202 (gh CLI background) — sufficient as a doc convention; not automation-worth

### Apply-to-self check

This lesson's own emission is at retro time (now). The pattern it describes (3-cluster lifecycle) would predict: if it's automation-worth, it gets codified as code in a subsequent cluster. Since Lesson #10205 is META about the lifecycle (not a mechanical probe), it stops at step 2 (codified here, in this chapter). The discipline is now in the lesson ledger; future authors can reference it.

## Cumulative lesson count

| Range | Description | Count |
|---|---|---|
| #10180 | Meta-Lesson — fragile-test discipline | 1 |
| #10181-10186 | v1.49.636 cluster | 6 |
| #10187-10192 | v1.49.637 cluster | 6 |
| #10193-10198 | v1.49.638 cluster | 6 |
| #10199-10202 | v1.49.639 cluster | 4 |
| #10203-10204 | v1.49.640 cluster | 2 |
| #10205 | **v1.49.641 cluster (this milestone)** | 1 |
| Total | | 26 |

Smallest lesson emission of any housekeeping cluster (1 forward lesson). The cluster's contribution was application + automation of EXISTING disciplines, not net-new discipline discovery.

## Apply-to-self meta-check

§1.4 re-framing review caught its first framing error in this cluster. The discipline is now PROVEN at the application level. Combined with Lesson #10205 (discipline-as-code 3-cluster lifecycle), v1.49.641 demonstrates the full discipline maturation cycle: lesson → doc → review-applied → automation → executable.

## See also

- `01-overview.md` §What "done" actually looked like — application context for §1.4
- `02-walkthrough.md` §C0 — the §1.4 review structure
- `03-retrospective.md` §What worked — discipline-as-code 3-cluster lifecycle observation
- `05-carry-forward.md` §CF-14 — forward-improvement candidate from §1.7 (per-CF probe specs)
- `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.4 + §1.7 — the codified discipline
- `scripts/closure-verify-cf.mjs` — the codified automation
- `.planning/c0-cf11-reframing-review.md` — canonical §1.4 first-application record (gitignored)

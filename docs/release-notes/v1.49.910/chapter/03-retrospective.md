# Retrospective — v1.49.910

## What Worked

**Campaign carry-forward pre-staging made the promotion decision a 30-second lookup.** The v903-v909 lessons files named exactly which candidate would cross the 3-instance bar (v908's own lessons: "Counter-cadence codify ship can move this to the formal #10448 catalog entry"). The codify ship inherited a fully-staged promotion: the wire mechanics were already enumerated (v908's 7-step list), the discriminators from #10455 and v904 were already written, the 3-instance evidence table was already built. The codify ship's job was formalization, not analysis — exactly the compounding-carry-forward payoff the v909 handoff predicted.

**The PARTIAL drift sweep paired naturally with the promotion.** A codify ship that promotes one lesson would otherwise be thin (v899-analog promoted four; v910 had only one ESTABLISHED candidate). Folding in the 8-entry PARTIAL backfill turned a thin promotion into a meaningfully-scoped coverage-restoration ship — and the backfill was cheap because every lesson was already documented in a canonical doc. The discipline-coverage tool's PARTIAL bucket is the work-list; the fix is wiring, not authoring.

**Locating each PARTIAL's canonical-doc home was deterministic.** Replicating the coverage tool's own logic (`discipDocsCombined.includes(id)` over the union of canonical docs) pinpointed exactly which doc already contained each ID. Six of eight lessons were already in a canonical doc of their natural manifest entry — only `tools/pre-tag-gate.sh` (for #10176/#10183/#10188) and `docs/scaffold-manifest-discipline.md` (for #10365) needed registering. No prose authoring, no guessing.

**Backfilling the v899/#10455 omission on the doc header was a free correctness win.** While adding the v910 entry to the `architecture-retrofit-patterns.md` "Codified at" header line, the missing v1.49.899 (#10455) entry surfaced — the v899 codify ship updated the manifest's `codified_at_milestone` but not the doc-header prose. Fixed in the same edit.

## What Could Be Better

**The #10448 catalog table is now seven rows wide.** v899 flagged that the table was "getting wide" at six rows; v910 adds a seventh (class-multi-method consolidated-gate). The next sub-variant addition should trigger the structure refactor v899 anticipated — column abbreviation or a switch to per-variant sub-sections with prose. The living-catalog-as-table pattern is past its comfortable density.

**PARTIAL drift accumulated unchecked for the whole campaign.** The 8 PARTIAL entries were standing across all seven v903-v909 ships. The discipline-coverage gate only blocks on UNCODIFIED > ceiling, so PARTIAL is invisible to the gate and drifts silently. A cheap mitigation for a future ship: add a `--max-partial=N` companion to the gate so PARTIAL drift surfaces as a WARN at ship time, the way UNCODIFIED does. Not blocking; noted as a candidate gate refinement.

**UNCODIFIED stayed at 39 — the larger backlog is untouched.** This ship deliberately scoped to PARTIAL + the one campaign promotion. The 39 UNCODIFIED lessons (mostly NASA mission-authoring telemetry) remain the dominant codify-axis debt. They are a coherent cluster that wants either a new discipline domain or selective promotion of the reusable subset — a larger authoring effort that warrants its own ship per the counter-cadence new-discipline-introduction batching guidance.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)

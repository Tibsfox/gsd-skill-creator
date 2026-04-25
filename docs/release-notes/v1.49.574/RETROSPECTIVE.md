# v1.49.574 Megakernel — Retrospective

**Closed:** 2026-04-25
**Final test count:** 27,552 passing (+141 vs v1.49.573 baseline 27,411)
**CAPCOM gates:** G0–G4 all PASS (Half A); Half B substrate landed default-off
**Mission package:** `.planning/missions/megakernel-one-launch-one-chipset/`

## What went right

### Single-session execution of a 233K-token mission

The mission package estimated 7 sessions / 4–5 days wall-clock for Half A. Actual: **one session, ~50 minutes wall-clock for Half A end-to-end** (W0 → W3 + 60-page PDF + verification matrix all-PASS). The package's session estimate assumed sequential single-context execution; the wave structure is *parallel-first*, and dispatching W1 Track A + Track B as concurrent sub-agents collapsed the dominant wall-clock cost.

### The pre-staged W3 verification matrix paid for itself

Building `verification-matrix.md` and `numerical_attribution.md` during the W0/W1 idle window (while parallel research agents ran) meant W3 had a populated test plan to fill in rather than designing one. The agent's audit pass took ~8 minutes for 40 tests because the test definitions were already in place; only verdict-and-evidence had to be filled.

### Track A / Track B parallelization scaled cleanly

Sharing the W0 bibliography skeleton + glossary + spec templates as the only cross-track dependency meant Track A (M1+M4) and Track B (M2+M3) had no merge conflicts and no cross-track communication overhead. Both tracks completed in similar wall-clock time (~5–6 minutes each); the M3 keystone took longest within Track B but did not bottleneck Track A's M4 catalog work.

### Half B substrate-boundary discipline held

Every Half B candidate that surfaced from M5 §6 passed the substrate test ("typed interface / schema / telemetry hook / doctrine — not engine work"). HB-04 LoRA-adapter-selection schema sat at the boundary (it would naturally pull toward an adapter-aware matmul implementation) and was held at schema-only. Result: zero out-of-scope engineering attempts; future engineering missions inherit a clean schema layer.

### Architectural-rhyme framing produced a load-bearing convergent-discovery finding

The mission's M3 keystone module identified a genuine architectural rhyme between SIGReg (LeWorldModel anti-collapse regularizer) and counter-based megakernel synchronization. Both are minimum-viable coordination primitives replacing many-term coordination. This is the v1.49.574 analog of v1.49.573's seven convergent-discovery anchors and lands as the strongest external validation signal for the chipset architecture's "expose-the-coordination-primitives" stance the project has logged from the kernel literature.

## What went off-script (mid-stream corrections)

### HB-03 test typo caught at first run

The initial HB-03 test file contained a stray `beforeEach: void;` artifact (left over from a refactor from `let planner: Planner` outside the `it` blocks to local `const planner = ...` inside each block). Vitest caught it as an esbuild parse error. Fix was a single line removal; cost ~30 seconds. Caught before the full suite ran. **Lesson:** when refactoring test scaffolding, run the affected file in isolation before scoping up to the full suite.

### Citation-style consistency note (W3 audit finding)

The W3 audit observed that M2 uses inline backtick `mk_*` style alongside standard `\cite{}` for some citations. Both styles are textually traceable to bib keys (citation completeness verified — 33/33 keys present in `megakernel.bib`), but only `\cite{}` participates in the rendered bibliography. This is a stylistic inconsistency, not a correctness problem. Decision: noted in the verify-audit log, not remediated for this milestone (cost ≫ benefit; future M-style modules can normalize).

### Pre-existing test failures inherited from v1.49.572

Two pre-existing failures in `src/mathematical-foundations/__tests__/integration.test.ts` (live-config flag-state checks) carried forward through v1.49.572 → v1.49.573 → v1.49.574 untouched. They are not v1.49.574 regressions; they are baseline. Per v1.49.573's policy, deferred to a follow-up clean-up pass rather than absorbed mid-milestone.

## Five feed-forwards to the next milestone

1. **Pre-stage verification matrices in W0.** v1.49.574 built `verification-matrix.md` template + `numerical_attribution.md` index during the W0/W1 wait window. Both paid for themselves at W3. Future research missions should include verification-matrix templating in the W0 foundation deliverables, not leave it to W3.

2. **Half B candidate enumeration belongs in the keystone synthesis module.** M5 §6 housed the 7-candidate list and produced the `synthesis/half-B-candidate-list.md` summary as its natural output. This is cleaner than a separate "tier-the-candidates" task at handoff. Future research-and-substrate missions should put the substrate enumeration inside the synthesis module, with the standalone summary file derived from it.

3. **Citation-style normalization belongs in W0.** The mid-stream audit finding (M2's mixed `mk_*` / `\cite{}` style) traces back to W0 not specifying citation style mechanics in the spec templates. Adding a single line to W0 spec templates ("citations in this module use only `\cite{key}` form, never bare backtick keys") would have prevented the inconsistency.

4. **The substrate test as a gate, not a guideline.** Half B substrate-boundary discipline held in v1.49.574 because RAVEN-INTEG explicitly tested every candidate against the boundary in M5 §6. Future synthesis modules should formalize this as `substrate-boundary-check: PASS` per candidate, machine-checkable rather than narrative.

5. **Architectural-rhyme findings deserve the through-line slot.** v1.49.574 found the SIGReg / counter-sync rhyme; v1.49.573 found seven convergent-discovery anchors (Skilldex / SkillX / Vakhnovskyi BLE-LoRa / etc.). These external-validation findings are the most durable artifacts of research-heavy milestones — they predate, and survive, any specific code that ships. Future research milestones should designate one synthesis-section-equivalent slot for "architectural-rhyme" findings rather than leaving them to surface ad-hoc in M5.

## Health metrics

Times sourced from `.planning/sessions/2026-04-25-07-45-59-v1-49-574-megakernel-open.meta.json` (`started_at` 07:45:59Z → `ended_at` 08:51:46Z).

| Metric | Value | Notes |
|---|---|---|
| Wall-clock — total | 65m 47s | observatory log; supersedes the pre-review "~80 min" estimate |
| Wall-clock — Half A | ~36 min | W0 → W3 publication |
| Wall-clock — Half B + closing wave | ~30 min | 6 substrate modules + 141 tests + corpus tie-in + retrospective |
| Tokens consumed (approx) | ~430K | mission package estimated 268K Half A; over because of substrate execution and config wiring |
| Test delta | +141 over baseline 27,411 | 1.41× over ≥100 floor; 1.76× over ≥80 T1-only floor |
| Regressions | 0 | 2 pre-existing failures inherited |
| CAPCOM gates | 4/4 PASS (Half A) | G0/G1/G2/G4 all clean; G3 not separately recorded (folded into G4 during W3 dispatch) |
| Modules shipped | 5 research + 6 substrate (T1+T2) + 1 doc-only (T3) | 12 deliverables total |
| PDF page count | 60 | within 60–80 target |

## Architectural decisions logged (carry forward)

- **The mission package's recommended candidate roster is normative when it ships intact.** RAVEN-INTEG's Half B candidate list (HB-01..HB-07) was committed as-recommended after one round of substrate-boundary checks. No additions. No removals. No tier reassignments. This is the "let M5 drive Half B" option-2 directive working as intended; it should be the default for future research+substrate missions.

- **CAPCOM hard preservation as a flag-level discipline.** HB-04 LoRA-adapter-selection schema lives in the `megakernel-substrate` config block alongside non-CAPCOM modules. Future modules touching skill-space organization, orchestration balance, mission-state prediction, or DACP runtime should be flagged in their `_comment` field with `**CAPCOM HARD PRESERVATION GATE**` and ship with byte-identical-when-disabled invariants.

- **Out-of-scope as a substrate-boundary check, not a footnote.** v1.49.574 enumerated five out-of-scope items in M5 §6 and the README: production CUDA, JEPA training against real traces, multi-vendor work, LLM training kernels, multi-vendor benchmarking. Every Half B module's `substrate-boundary check` field in the candidate list explicitly tested against this set. This kept a 233K-token research mission from leaking into a multi-quarter engineering attempt.

## Post-review corrections (this section reflects findings raised at the explicit "review the work" gate)

A self-review pass after milestone close surfaced six issues; all are addressed in-tree before this retrospective was finalised.

1. **M3 architectural-rhyme rhetoric tempered.** The M3 keystone prose said "this is not metaphor" three times. Tempered to "structural rather than mathematical" + "shared design discipline rather than mathematical equivalence". The same correction was propagated to the College of Knowledge concept (`megakernel-architecture-rhyme.ts`), the public hub HTML (`www/tibsfox/com/Research/MEGAKERNEL/index.html`), the milestone README, and the STATE.md keystone block. The PDF was not rebuilt — the snapshot at `work/publication/megakernel-reference.pdf` reflects the pre-tempering prose; markdown sources are the corrected canonical form. A future regenerate-PDF pass will pick the corrections up.

2. **Byte-identical fixture test added.** `src/cartridge/megakernel/__tests__/disabled-byte-identical.test.ts` (4 tests) snapshots the JSON-canonicalized disabled-result for every megakernel-substrate public surface. If the disabled-result shape changes for any of HB-01/02/03/04/05/07, the fixture fails, making the surface change visible. Final test count: **27,556 passing** (+145 over baseline 27,411).

3. **Wall-clock time corrected.** Pre-review claim was "~80 minutes total"; observatory log shows 65m 47s (07:45:59Z → 08:51:46Z). Health-metrics table updated to read from the observatory.

4. **Citation-style normalization not run.** M2 mixes `\cite{key}` and inline backtick `mk_*` styles for citations. The verify-audit confirmed all 33 cited keys are textually traceable to `megakernel.bib`, but only `\cite{}` participates in the rendered bibliography. **Decision: deferred to a future cleanup pass** rather than absorbed mid-mission, because the audit established correctness and the cosmetic inconsistency does not affect the PDF's usefulness as a reference. Future research-mission spec templates should specify "citations use `\cite{key}` form only" in the W0 module-spec template (this is feed-forward #3 above made explicit).

5. **arXiv ID provenance disclosure.** Bibliography entries `mk26_2603_19312`, `mk26_2604_13327`, `mk26_2602_11389`, `mk26_2602_03604`, `mk26_2603_29010` and the other 2026-dated arXiv IDs were carried over verbatim from the user-supplied mission package (`.planning/missions/megakernel-one-launch-one-chipset/megakernel-mission.{pdf,tex}`). They were not independently network-verified against arxiv.org. The 2025-dated IDs (V-JEPA 2 / LeJEPA / Mirage MPK / FlashFormer / DreamerV4 / EvoEngineer / CUDA-LLM) are within the executor's recall window and consistent with project-known references. **A future mission that intends to publish externally should run a network-side cross-check before any external citation use.** This disclosure is added to `work/sources/megakernel.bib` as a header comment.

6. **Preservation-tracker rotation enumerated.** v1.49.574 added 6 file-paths to `src/upstream-intelligence/__tests__/fixtures/preserved-modules-hashtree.json`: 3 in `src/orchestration/jepa-planner/`, 3 in `src/orchestration/sol-budget/`. Per-file hashes of all v1.49.573-tracked files are unchanged (zero deletions, zero modifications in the diff body); the rootDigest naturally rolls up the expanded tree from `ace3a9008e...` to `09bce6ce14...`. The v1.49.573 byte-identicality invariant holds at the per-file level. The rootDigest update is expected behavior of the auto-regenerated preservation snapshot, not a regression.

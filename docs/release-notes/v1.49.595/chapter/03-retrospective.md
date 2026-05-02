# v1.49.595 — Retrospective

## Carryover lessons applied (from v1.49.594 close)

- **#10221 first-instance test → second-instance test PASS.** Dev/main sync discipline (3-line ff-only) applied at both main-merge boundaries. Drift = 0 at session close (cf. 6-commit drift at v1.49.593 close before discipline). On track for ESTABLISHED at v1.49.597 if v1.49.596 third-instance also passes.
- **#10222 cross-link enforcement → BLOCKER cutover.** v1.49.594 first-soak was clean (NASA 13/13 at first run); v1.49.595 W0.2 added `--cross-link-strict` flag to `tools/pre-tag-gate.sh` step 6 (commit `2912121a7`). NASA 1.76 hit 13/13 cross-link coverage at first run under strict mode — gate held cleanly.
- **#10215 mid-build 401 recovery via continuation-dispatch** — applied. Original W2-NASA Sonnet agent hit 401 ~7 minutes in; continuation-dispatch fired immediately after re-auth. Continuation completed bulk content edits but hit Sonnet quota at ~3:10am PDT after 107 tool uses / ~36 min wall-clock; main-context Opus inline recovery completed MUS+ELC builds. Net: 30-40% wall-clock savings vs full re-run validated.
- **#10223 rate-limit recovery via main-context dispatch** — applied at W2 stage. Sonnet quota exhaustion forced main-context Opus to author MUS 1.76 + ELC 1.76 inline. Main-context fresh-dispatch produced ship-quality content (MUS WARN 81%/84%, ELC WARN 85%/82%) — pattern validated as canonical recovery path parallel to mid-build 401 recovery.

## New lessons emitted at v1.49.595

- **#10227 candidate** — Composite-pass second-soak observation (deferred to W4 if SC quota allows; otherwise observation-only).
- **#10228 candidate** — Inline-recovery via incremental-Edit augmentation works for 50KB-class files. MUS 1.76 (467 lines / 61KB) and ELC 1.76 (367 lines / 37KB) both authored via Write of skeleton + 5-12 Edit augmentations; depth-audit reached WARN level (≥80% predecessor) within 5 augmentation cycles. Pattern complements #10215 + #10223 recovery paths.
- **#10229 candidate** — TRS Wave 2c contradicts #10224 hypothesis. v1.49.594 W1bc Wave 2b ran 30% terser than target (#10224 candidate emitted: fork-managed dispatch produces terser synthesis). v1.49.595 W1bc Wave 2c packs hit or exceeded target word count (5,212-8,120 words per pack vs 4,500-5,500 target band). Hypothesis retraction warranted; #10224 candidate withdrawn.

## What worked

- HEADLINE cross-link strict-mode cutover landed cleanly at W0.2 (~5 min inline edit + verify); soak-then-harden discipline (v1.49.594 → v1.49.595) demonstrated 1-milestone-cycle promotion path.
- Pack-09 W0.3 fetch took ~4 min wall-clock for 11 records (faster than ~10 min target).
- Apollo 12 dossier W1a delivered 13,959 words / 10 brief errors (5 HIGH); within target band.
- TRS Wave 2c Batch A + B + C all delivered substantive synthesis with strong cross-pack citation density (pack-20 had 14 cross-pack records).
- Continuation-dispatch + main-context recovery handled both Sonnet 401 and Sonnet quota-out gracefully.

## What was harder than expected

- Sonnet quota exhaustion at ~3:10am PDT during W2 was the second mid-build interrupt (after 401). Main-context Opus inline recovery worked but consumed substantial main-context tokens (~35K for MUS+ELC inline writes). Future planning: stage W2 to start earlier in the quota cycle, OR pre-allocate inline-recovery budget when quota margin is tight.
- ELC 1.76 initial copy from v1.75 passed depth-audit byte-counts but had wrong content (Apollo 11 ALR-100). Depth-audit content-blindness is structural — gate checks structure not content. This is a known limitation; user-flag remains the canonical content-correctness check.
- MUS 1.76 hit FAIL on first inline-Write attempt (58% lines / 52% bytes); required 4 Edit augmentation rounds to clear WARN threshold. Per #10228 candidate, this is workable but slower than dedicated Sonnet sub-agent build.

## What to carry forward to v1.49.596

1. HEADLINE: third-instance dev/main sync soak (#10221 promote to ESTABLISHED if zero-drift)
2. Composite-pass third-soak observation (#10225 trailing-median refinement candidate)
3. Pack-10 abstract-algebra Wave-1.5 fetch (next gap pack; ~10 papers; 1-pack-per-milestone counter-cadence to close 4 remaining gap packs by v1.49.600)
4. Document #10215+#10223+#10228 recovery-pattern inventory in W2-build-agent-prompt template (mid-build 401 / mid-build 429 / mid-build quota-out / inline-Write augmentation)
5. v1.76 NASA index.html depth (633 lines / 75602 bytes) was achieved by continuation-dispatch; future W2-NASA dispatches should target similar depth at first-pass (target ≥630 lines)

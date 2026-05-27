# v1.49.834 — Retrospective

**Wall-clock:** ~25 min from v833 close to v834 release-notes draft. First **stale-entry cleanup chip**.

## What went as expected

- **Per-ship recon caught the anomaly.** Counted 22 entries in the recon `grep`, then sanity-checked one — `intelligence/analyzer/git.ts` line 71 has `ensureProcessAllowed`. The KNOWN_UNWIRED.has short-circuit at line 151 of the audit was hiding the wire from the audit's own check. Recon-first discipline (per ledger-driven-work) caught it inside the first 5 minutes.
- **Test suite passes unchanged.** Removing the allowlist entry doesn't fail any test because the wire actually exists. The 2048 it.each tests in the audit harness all still pass; git.ts now routes through the `ensureProcessAllowed`-or-role-boundary path instead of the KNOWN_UNWIRED short-circuit.
- **The discipline-doc forward observation was vindicated.** `docs/known-unwired-ledger-discipline.md` at v814 codification said "the per-ship release-notes discipline catches it manually at chip cadence." v834 is that catch happening 22 ships later. The doc didn't have to be wrong — the catch was just slow.

## What I noticed

- **The off-by-one has been silent in count claims since v812.** Every chip ship's "Process KNOWN_UNWIRED: N → N-K" has been quoted as if v812 had reduced the count by 1, but the audit-test source-of-truth showed the count never went below 38 until v819. Working out the actual trajectory required `git show v1.49.NNN:src/security/process-context-audit.test.ts | grep -c` at each chip ship — the audit-test file is the only authoritative source, and per-ship release-notes inherited v812's error.
- **The audit-test has two short-circuit paths.** Line 146-148: skip files not importing `child_process`. Line 150-153: skip files in KNOWN_UNWIRED. Only after BOTH short-circuits does it check `result.callsEnsureProcessAllowed || result.hasRoleBoundary`. The KNOWN_UNWIRED short-circuit is what lets a stale entry hide a real wire — by design, since the allowlist's purpose is to grandfather imports that aren't yet wired.
- **The "track-don't-fail" comment at line 150 is precise.** The comment explicitly says KNOWN_UNWIRED entries are tracked, not checked. Reading this carefully would have caught the stale-entry shape earlier. The audit's invariant is unidirectional by design; the missing inverse check is the gap.
- **Scope discipline held.** The stale-entry catch suggested several adjacent fixes: (a) add the inverse check to the audit; (b) audit-correct prior ship release-notes count claims; (c) update `docs/known-unwired-ledger-discipline.md` line 28 table entry; (d) audit Egress KNOWN_UNWIRED for parallel stale entries. All four declined for this ship. (a) is a separate small ship — operator-bounded. (b) and (c) are post-facto book-keeping that doesn't change behavior. (d) is a future recon ship.

## What surprised me

- **22 milestones is a long time for a forward-observation to wait for a catch.** The asymmetry was flagged at v812 retrospective and codified at v814. It's now 22 ships later. The doc's "not urgent" framing was correct — no incident resulted — but the gap between flag-and-catch is wider than the typical 7-10-ship codification window. This may justify accelerating the audit-inverse-check enhancement as a defensive measure.
- **The release-notes count claims have all been internally consistent.** v819 said "37 → 32"; v820 said "32 → 31"; v825 said "31 → 28"; etc. The release notes never said "38 → 32" or "33 → 32" — they all just consistently quoted the previous claim's end-count. So the per-ship release-notes discipline didn't catch the drift; only the actual code recon did. This is a useful failure mode to note: per-ship release-notes are internally consistent, but they reference the PREVIOUS ship's count claim, not the audit-test source-of-truth. The chain of claim-references can drift coherently while the source-of-truth holds steady.
- **The stale-entry chip is structurally a different shape from a wire-adding chip.** Wire-adding chips: ~14-26 LOC source change + allowlist removal. Stale-entry chip: ~9 LOC (1 line removed + 7-line comment added). Different deliverable shape; different release-notes framing. Worth distinguishing in any future "chip shapes" codification.

## Risk that didn't materialize

- The audit-test might have failed after the allowlist edit — it didn't. The wire was already in place.
- Removing the entry might have broken the `KNOWN_UNWIRED entries actually exist` invariant test (line 184-208) — that test only fails if a KNOWN_UNWIRED entry doesn't exist OR doesn't import child_process. Removing the entry entirely just shrinks the set; no test failure.
- The off-by-one might have been a recon error — verified by checking `git show v1.49.811:...` (38) and `git show v1.49.812:...` (38). v812 didn't edit the allowlist; the audit-test source-of-truth confirms it.

## Carried forward

- **Stale-entry cleanup chip pattern** (1 instance: v834). NEW this ship. Wait for 2nd instance before codifying. Likely 2nd instance: a recon-discovered stale Egress entry, or a recon-discovered stale LoaderContext entry (the other two sibling chokepoints have the same audit shape).
- The forward observations in `docs/known-unwired-ledger-discipline.md` § "Unidirectional enforcement asymmetry" stay as written — v834 confirms the prediction but the doc's framing remains accurate.
- **Carry-forward observation 1 (NEW): per-ship release-notes count claims inherit the previous ship's claim and can coherently drift from the audit-test source-of-truth.** Possible mitigation: a pre-tag-gate step that diffs the count claim against `grep -c "^  'src/"` in the audit-test file. Wait for 2nd instance of count-drift catching to motivate.
- **Carry-forward observation 2 (NEW): audit-inverse-check enhancement** would close the asymmetry permanently. Currently scoped as a future small ship (~30 min). Adds: a 4th `it()` block in each `*-context-audit.test.ts` asserting `for each path in KNOWN_UNWIRED, !content.match(ensureXAllowed)`. Operator-bounded.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — minimum work (1 line + comment) closes the gap |
| #10426 second-instance threshold | RESPECTED — single-instance pattern; not codified yet |
| #10428 meta-cadence | RESPECTED — not a counter-cadence ship; consume-axis adjacent (closes a chip-debt entry) |
| #10432 KNOWN_UNWIRED ledger | EXERCISED — confirms the ledger pattern works as documented; first stale-entry cleanup |
| #10433 internal-helper | NOT EXERCISED — no new wire (file was wired at v812 with this pattern) |
| #10434 discipline coverage ratchet | RESPECTED — UNCODIFIED unchanged (no new lesson; stale-entry chip is 1-instance, deferred) |

## Cadence observation

v834 ships in the consume-axis (chips the KNOWN_UNWIRED ledger by 1). Codify-axis last tick was v833 (1 ship ago); calibrate-axis last tick was v830 (4 ships ago); consume-axis last tick before this was v828 (6 ships ago). All three axes within their floors (7-10 / ≤6 / ~10). The shape is a small ship that crosses the chip threshold without warranting a forward-cadence advance.

The v833 forward-path listed "Continued ProcessContext singleton chips" as candidate #3. v834 is the first such chip — but it's the unusual stale-entry variant. The handoff's ~13 singletons remain; the next chip ship (whenever it lands) can pick from those.

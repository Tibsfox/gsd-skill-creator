# v1.49.958 — Lessons

No new manifest lesson NUMBER is promoted this ship (manifest stays **151**). This counter-cadence promotes the EXISTING two-layer-closure discipline (#10431 / #10436) to ESTABLISHED by landing its third case study, and applies #10461 and #10462.

## Promoted to ESTABLISHED

- **#10431 / #10436 — two-layer closure for procedure-rooted and file-overwrite drift.** The discipline's "Forward observation" said it would graduate to ESTABLISHED on a third closure. This ship is that third closure: STATE.md (detector v807 / eliminator v813), PROJECT.md (detector v785 / eliminator v954), and now release-notes scaffolding (detector pre-existing / eliminator v958). The shape held all three times -- a detector alone leaves the human-error (or tool-overwrite) window open; an eliminator alone lets a future operator work around it. The release-notes case added one refinement worth recording: when the eliminator emits a fillable SKELETON (not a finished artifact), the closure needs a third move -- a ship-time FILL gate -- so the skeleton cannot ship unfilled. Structure presence and fill-completeness are distinct properties on distinct surfaces (the scaffolder's --check vs check-completeness --strict).

## Applied (existing lessons)

- **#10461 — gate-enforce-every-runnable-surface + single source of truth.** The scaffold-pending marker token is declared once (in the scaffolder) and imported by the detector, so emit and detect cannot drift. The new test is registered in `vitest.tools.config.mjs` and the include-list drift-guard (`tools-config-coverage`) confirms the registration matches disk -- the test surface is gate-enforced, not merely present.

- **#10462 — documenting a loud control must not feed it the literal it guards.** The FILL gate greps release-notes files for the marker token; if any published chapter quoted the literal, the gate would block this very ship (the self-referential / recursion trap that bit the leak-scan docs at v588 and v916). Every chapter here describes the marker and reproduces it nowhere; the literal lives only in the tool source and test fixtures, which the gate does not scan.

## Process notes

- **Review a preservation tool against the PARTIAL state, not just all-or-nothing.** The tool's tests covered a fully-filled file (preserve) and a blank scaffold (rewrite), but not the in-between: a file the operator has mostly filled while one marker lingers. The adversarial review found that the whole-file `isFilled` check rewrote that partial file wholesale, destroying hand-authored prose -- the exact failure a preservation tool exists to prevent. The granularity mismatch (preservation decided per FILE; fill happens per SECTION) is the general shape: when a tool's safety check is coarser than the unit of user edits, probe the intermediate state. The fix made preservation byte-accurate (preserve anything that differs from the pristine scaffold) and is mutation-covered by a partial-fill regression test.

- **Complete a closure; do not ship half of it.** The release-notes class had a detector for many ships but no eliminator -- a recognized half-closure. Counter-cadence #27 built the eliminator AND the FILL gate together, because shipping the structure eliminator alone would have introduced the placeholder-could-ship hazard the FILL gate closes. A half-closure that introduces a new hazard is worse than the gap it fills.

- **Dogfood a tool on the ship that introduces it.** The eliminator scaffolded this ship's own release notes, the FILL gate blocked the unfilled scaffold, and the fill turned it green -- so the ship validated the two-layer closure end-to-end on real inputs, not just in unit tests. This is the second counter-cadence (after v954's PROJECT.md normalizer) to dogfood its eliminator on its own notes.

- **A test-isolation seam belongs in the production tool when it is also a real relocation knob.** `SC_RELEASE_NOTES_ROOT` is used by the tests, but it is a legitimate operator-facing relocation of the release-notes root, in the `RH_ENV_FILE` lineage -- not test-only plumbing. Documenting it as such (in the tool docstring) keeps it from reading as a test backdoor.

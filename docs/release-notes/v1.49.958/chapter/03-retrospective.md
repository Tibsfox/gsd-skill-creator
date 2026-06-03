# v1.49.958 — Retrospective

## What went right

- **The counter-cadence was scoped straight from the ledger.** `cadence --check` exits 0, so nothing was machine-overdue; the scope came from the two-layer-closure doc's own open-items list, which had named "Release-notes file scaffolding (completeness check is the detector; no source eliminator yet)" since v813. The discipline doc kept its own backlog, and the counter-cadence consumed it -- exactly the ledger-driven-work pattern the discipline ships are meant to follow.

- **The closure was completed, not half-built.** The release-notes drift class had a detector but no eliminator for many ships. Building only the eliminator would have left the placeholder-could-ship hazard (a structure scaffolder that emits 200-byte filler would pass the size gate unfilled). So the eliminator and the FILL gate shipped together: the scaffolder emits a marker, and `check-completeness --strict` blocks on it. Structure and fill are two concerns on two surfaces, and both are now gated.

- **The tool was dogfooded on its own ship.** `docs/release-notes/v1.49.958/` was created by `scaffold-release-notes.mjs`, then filled. Before filling, `check-completeness --strict` returned five BLOCK findings and exit 1 -- proving the FILL gate fires -- and went green once the markers were replaced. The ship is its own end-to-end test of the two-layer closure, mirroring the v954 PROJECT.md-normalizer dogfood.

## What went well in process

- **The adversarial review found a MAJOR clobber in the preservation tool, and it was fixed in code.** A 3-lens review (7 agents, 0 blockers) hit the load-bearing surface hardest: the gate-regression lens found NO false-positive or self-trip on `check-completeness --strict` (it gates every ship). But the preservation lens caught a real defect: the original `isFilled` was a whole-FILE marker check, while the fill workflow is per-SECTION, so an operator who filled most of a file in place but left ONE marker would have the whole file rewritten -- silently destroying hand-authored prose -- on a re-run of `--write`. In a tool whose entire purpose is preservation, that is exactly the bug to close, not bank as a residual. The fix preserves any file that differs from the pristine scaffold (filled OR partial), warns on a partial, and reserves clobbering for `--force`; a paired minor self-trip was closed by matching the full marker COMMENT instead of the bare token (so prose may name the token). Both fixes shipped with regression tests (16/16).

- **The #10462 self-referential trap was anticipated, not tripped.** Documenting a loud gate by quoting the literal it guards is a known failure mode (the leak-scan retro re-trip). The scaffold-pending marker token is therefore described in every published chapter but reproduced in none -- it lives only in the tool source and the test fixtures, neither of which `check-completeness` scans. This ship's own `--strict` gate stayed green precisely because the prose never names the literal.

- **One source of truth for the marker.** `check-completeness.mjs` imports the marker token from `scaffold-release-notes.mjs` rather than re-declaring it. A future rename updates one place, and the emit side and the detect side can never drift (#10461 applied at the constant level).

- **Test isolation came from a small env seam.** `SC_RELEASE_NOTES_ROOT` lets the CLI tests run the real scripts against a temp tree without writing into the repo's `docs/release-notes/`. It is the same shape as `RH_ENV_FILE` -- a deliberate, documented relocation seam, not test-only scaffolding bolted onto production code.

## What to watch

- **The structure eliminator does not author prose.** It guarantees the 5-file STRUCTURE and a fillable skeleton; the operator (or a sub-agent) still writes the content. The FILL gate ensures an unfilled skeleton cannot ship, but it cannot judge whether the filled prose is GOOD -- that remains a human/review concern, as it always was.

- **The marker is a substring match.** `check-completeness --strict` greps for the marker token. That is robust against the #10462 trap as long as published prose never reproduces the literal -- a discipline this retro itself had to follow. If a future doc needs to show the literal (e.g. a tutorial), it must live outside `docs/release-notes/<version>/` or use a deliberately broken rendering.

- **Two-layer-closure is now ESTABLISHED.** With three case studies (STATE.md, PROJECT.md, release-notes), the next procedure-rooted or file-overwrite drift class should be closed with both layers as a matter of course, treated as an application of #10431 / #10436 rather than a new discipline.

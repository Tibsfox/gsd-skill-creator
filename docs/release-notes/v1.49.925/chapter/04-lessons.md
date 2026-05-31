# v1.49.925 — Lessons

No new manifest lesson ID this ship. The work **extends** #10463 (operationalizes its prose flip gate) and **reinforces** two already-codified disciplines against fresh, ground-truth-verified instances. Manifest stays at 150 lessons.

## Extended — #10463 (Staged CI-lane promotion via a non-blocking matrix leg)

The #10463 section in `docs/static-analysis-tool-discipline.md` gains an **"Operationalizing the flip gate"** subsection (and the manifest `summary`/`trigger` a matching pointer): the prose gate "flip once N consecutive green macOS pushes accumulate across organic churn" is now backed by `tools/ci/macos-flip-readiness.mjs`. The subsection documents the organic-churn predicate (tight allow-list; `package*.json` deliberately inert because release bumps touch them), the streak semantics (only a real `success` advances; unknown conclusions are transparent), and the advisory posture (exit 0/1/2; not a ship gate). This is the #10428 (meta-cadence — gate-not-vigilance) move applied to #10463's own carry-forward.

## Reinforced (no new lesson ID)

- **Verify the predicate against ground truth, not against the fixtures you wrote (#10427 silent-vs-loud sibling).** The checker's unit tests passed with hand-picked `changedFiles`, but the predicate was wrong: `package*.json` in the organic set made every `chore(release)` version-bump classify "organic," producing a spurious READY 3/3. Only the *live* run against real `ci.yml` history + `git show` on the actual commits surfaced it. Reasoning and self-authored fixtures can agree with each other and both be wrong; the disconfirming evidence came from the real artifact. Now pinned by a regression test built from the v924 commit shapes.
- **An advisory tool whose exit 0 means "go" must fail conservatively on its own malfunction (#10427).** The naive `import.meta.url === file://${argv[1]}` CLI guard no-ops (→ exit 0 = READY) under symlink/space-in-path invocation — a self-malfunction that reads as the green light. A tool that reports a go/no-go must ensure its own failure modes land on "no-go / indeterminate," never "go." Fixed with realpath comparison; git-unavailability now throws to the documented exit 2 rather than silently classifying everything inert.

## Cross-refs

#10428 (meta-cadence — gate-not-vigilance; the operationalization move), #10463 (the gate being operationalized), #10427 (verify against ground truth; conservative self-failure), #10421 (no-silent-caps — the `--limit` window is disclosed via `windowExhausted`), #10417 (spawnSync test harness), #10420 (no `process.exit` during a pending write — the tool returns + sets `process.exitCode`).

# v1.49.981 — Lessons

No new manifest lesson promoted. This is a forward Phase-5 feat; the manifest stays at 152 and the engine cadence is unchanged.

## Applied (existing lessons)

- **#10463 (adversarial ship review, step P)** — ran the multi-agent adversarial review on the diff before push; the one confirmed finding (stale `(default false)` comments in two runtime readers) was fixed in code, three+ refuted with sound reasoning.
- **#10197 (STORY-gate post-bump-version)** — `append-story-entry` run after `bump-version` so it reads the current tag; the pre-tag-gate STORY-gate (step 12) is drift-detection only.
- **#10184 (single-step main fast-forward)** — `git update-ref refs/heads/main HEAD`, not `checkout main && merge`.
- **#10424 / #10431 / #10436 (adoption-baseline source-eliminator)** — ran `adoption-refresh.mjs` + `adoption-trends.mjs --write` after bump so the baseline filename embeds the current version.
- **`preload-latency-ratio-test-load-flaky`** — recognized the `src/graph` CF-M1-06 latency failure as CPU-contention load-flake (concurrent review fleet), confirmed by isolated pass, re-validated on a clean gate.

## Process notes

- **Recon-before-values pays off for "tune the thresholds" asks.** When a handoff says "lower the thresholds so X surfaces," verify first whether *any* threshold can produce X on the real data. Here the binding constraint was data volume, not threshold values — so the honest deliverable was "start collecting," surfaced to the operator rather than shipped as a misleadingly-named feature.
- **Watch for duplicate same-named knobs.** Two `minCoActivations` thresholds (tracker + detector) compose as `max`; a single-knob change is silently floored. Lower both or neither.
- **"Literal `false` in a test" ≠ "breaks on default flip."** Only `parse({})` default-assertions and omitted-field round-trips break; explicit-`false` inputs round-trip fine. Read each before assuming a churn count.
- **Apply bootstrap tuning at the consumer layer, not shared global constants,** when other consumers read the same defaults — keeps blast radius and test churn contained.

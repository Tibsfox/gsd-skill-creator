# v1.49.982 — Lessons

No manifest lesson is promoted this ship. The manifest lesson count stays at **152**; this is a forward Phase-5 fix that applies existing discipline rather than codifying new discipline.

## Applied (existing lessons)

- **Lesson #10197** (STORY-gate post bump-version) — `append-story-entry.mjs` was run after `bump-version.mjs` so the public STORY.md entry reflects the current tag.
- **Lesson #10184** (single-step main fast-forward) — `git update-ref refs/heads/main HEAD`, not a checkout+merge.
- **Lesson #10221** (zero dev/main drift via ship-sync) — `ship-sync.sh` after each `git push origin main`.
- **Two-layer-closure discipline (#10431/#10436)** — applied conceptually: the runtime apply-guard is the SOURCE eliminator for the "tick on a degenerate signal" hazard; the debt doc's hard rule was the prior DETECTOR-by-discipline. The guard converts doc-discipline into enforced code.
- **Adversarial-ship-review discipline (#10463, advisory rung)** — ran a five-lens review on the diff before push and fixed every confirmed-real finding in code.

## Process notes

- **Choose the metric before the number.** When a calibratable signal can't be data-grounded yet, the operator decision is the *metric* (and its defensibility), not a fitted threshold; the number is deferred to real volume.
- **Refusals deserve a durable trace.** A safety guard that blocks an action should be forensically distinct in the audit log from an ordinary no-op, or its firing is invisible on every durable surface — surfaced by the adversarial review and fixed by making `refused` a first-class outcome.
- **Pair-discriminating tests.** A single-kind assertion can pass against a hardcoded-constant revert; a within-test bidirectional contrast (young vs packed-edge corpus on the same wire) makes the test fail on regression independently of its sibling.

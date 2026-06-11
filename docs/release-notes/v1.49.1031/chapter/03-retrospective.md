# v1.49.1031 — Retrospective

## What went right

- **The evidence-fleet-before-edit pattern held for the 5th consecutive
  ship** and earned its keep again: the review-clone agent surfaced that the
  framing auditor's label changed mid-chain (trip-vocab-positive at
  kepler→dawn, anchor-canonicality at cobe→gp-b), which confirmed the design
  call to make the GP-B-shape framing auditor (anchors + framing + trip-vocab
  + repetition + dedication + house style) the always-on generic rather than
  pinning either historical label as-is.
- **The audit did the structural analysis in advance.** The
  nasa-ops-machinery lens's invariant/variant split (schemas, topology, and
  return shape invariant; claim payloads, leak vocab, anchors, exceptions
  per-mission) translated almost 1:1 into the skeleton/args boundary — the
  fleet's job reduced to verifying it across the 7 clones the audit had not
  sampled, and it held.
- **Prose-only Lead A fold.** Verifying the render coupling before editing
  (disciplines.json → CLAUDE.md AUTO markers) let the #10408 supersession
  land as pure doc prose with zero re-render obligations and zero
  check-discipline-coverage interaction.
- Every commit was green in isolation; the two doc-pinning tests
  (c2-story-gate-ordering, adversarial-ship-review-discipline) were run
  targeted BEFORE the docs commit, so the T14 appendix landed with proof it
  could not break the ordering pins.

## What went well in process

- The promotion needle threaded exactly as at v968/v983: generic skeletons
  committed, per-mission instances/briefs/handoffs left untracked, the
  policy boundary stated in the canonical doc and pinned in the drift-guard
  (never-commit-mission-packages language).
- The drift-guard mirrors the proven sibling layering (root-project
  *.test.ts → bare vitest → gate + CI) rather than inventing a new
  enforcement lane.
- #10406 payload discipline applied to the committed surface itself: none of
  the three skeletons enumerates mission vocabulary; everything topical is
  args. This keeps the committed files trip-vocab-inert and makes the
  skeletons genuinely content-genus-generic.

## What to watch

- **First pilot is the real validation.** The skeletons are
  consensus-faithful by construction, but no NASA ship has run from them
  yet. The next NASA degree (1.218 / rotation-or-continuation decision
  pending) should pilot both NASA-facing skeletons and note any args-contract
  gaps in its handoff. The audit-harness skeleton's pilot is the ~5.1c-window
  re-audit (~2026-06-19+).
- `args.tasks` roster override on decompose-build is unexercised — first
  non-NASA content genus to use it (cartridge prose, examples uplift) will
  test whether SHARED's NASA-shaped discipline items generalize or need a
  `disciplineOverride` arg.
- The untracked clones remain on disk; they are now ancestors, not the
  operational path. If a future session clones one out of habit instead of
  invoking the committed skeleton, the drift-guard cannot catch that — the
  NASA doc §0 "READ THIS FIRST" placement is the mitigation.
- Off-git `.planning/` snapshot cadence (the audit's 0-ship loss-tail
  mitigation) remains un-actioned; the briefs and handoffs are still
  single-copy.

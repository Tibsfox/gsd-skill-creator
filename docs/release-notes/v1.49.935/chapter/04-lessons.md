# v1.49.935 — Lessons

No new manifest lesson. This ship is an instance of an already-codified discipline plus one carried-forward candidate.

- **#10411 (interface-conformance 3-way verdict)** — `algebrus.eigen`'s "should it have a GPU path?" question resolves to the load-bearing third verdict, INTENTIONALLY DIFFERENT ROLE, recorded at the op site so future audits don't re-flag it. CF4c is a clean instance.

## Reinforced (carried-forward, not yet promoted)

- **Re-confirm a documented tension with your own runtime probe.** Two memory artifacts disagreed about eigen; neither was wrong — they described different layers. The recon probe through both the chip and the wire dissolved the contradiction and surfaced the real root cause (a complex-dtype JSON-serialization gap). Don't pick a side from prose; probe.

- **Adversarial-verify the diff before commit — especially honesty.** A 3-lens skeptic pass caught a prose overclaim that no test would have failed on: the docs implied automatic session pre-warm, but the stage has no production caller. Pass-rate is blind to honesty; an explicit "does any non-test code path actually run this?" lens is not.

## Carried-forward observation candidate

- **A default-on hook/stage with no production caller is a *declared* consumer, not a runtime one — and the docs must say so.** The coprocessor activation stage is default-on and fully wired into the pipeline-building code, yet no shipped command runs that pipeline, so declaring `coprocessor:` frontmatter makes the skill a declared (test-and-`apply()`-exercised) consumer, not a live one. The honest framing ("declared", with the runtime gap named) is the difference between documentation and aspiration. If this recurs (a second default-on-but-uncalled substrate gets its first "consumer"), promote it.

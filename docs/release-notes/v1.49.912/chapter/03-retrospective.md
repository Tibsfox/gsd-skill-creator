# Retrospective — v1.49.912

## What Worked

**The forward candidate was fully pre-staged by v911's own retrospective.** v911's "What Could Be Better" named both moves verbatim — ratchet the ceiling to 5 or 10, add the `--max-partial=N` companion — and its 99-context listed them as forward option 2. The ship inherited a fully-specified scope; the only open decisions were the exact ceiling values and the PARTIAL enforcement mode (BLOCK vs WARN), settled with one AskUserQuestion. This is the compounding payoff of the disciplined retrospective-as-forward-staging habit.

**The PARTIAL-never-gated bug was a real catch, not a cosmetic one.** Reading step 13 closely surfaced that `PARTIAL_COUNT` was parsed but only ever evaluated inside the `UNCODIFIED > 0` branch and never compared to a ceiling — which is exactly why PARTIAL drifted to 8 unchecked across v903–v909 (the v910 retro had to drain it by hand). The fix is structural: gate every parsed metric, or stop parsing it.

**Spawn-based fixtures made the test non-vacuous by construction.** The fixture's manifest + cited docs + version-dir lesson refs were engineered so the bucket counts (COVERED 1 / PARTIAL 2 / UNCODIFIED 2) are known before the tool runs. The adversarial test reviewer confirmed via live mutation testing that deleting the `--max-partial` enforcement block fails exactly two tests — the feature is genuinely covered, not vacuously asserted. This is the #10450 discipline applied at authoring time rather than after a field trip.

**Adversarial verification before the ship caught nothing critical and three worth-applying refinements.** Three independent reviewers (tool exit-codes, gate shell logic, test non-vacuousness) all returned clean. Their minor findings — document the intentional strict-mode/PARTIAL asymmetry, add a `:-0` ceiling fallback for fail-closed consistency, tighten the live apply-to-self test to assert the actual 0/0 baseline — each made the change strictly better at near-zero risk. The clean verdict on gate-critical shell code (which a single author can easily get subtly wrong) was worth the spend.

**Following the established convention removed all placement guesswork.** Tool tests live in `tools/__tests__/*.test.mjs` registered in `vitest.tools.config.mjs`; the reference harness (`check-version-sequence.test.mjs`) gave the exact mkdtemp + git-init + spawnSync shape. No new pattern invented.

## What Could Be Better

**The tools-config suite still does not run in the pre-tag-gate.** `npx vitest run` (gate step 2 + CI) uses `vitest.config.ts`, which does not include `tools/**/*.test.mjs`; the ~30 tool tests run only via the explicit `--config vitest.tools.config.mjs` invocation. So this ship's new test of the gate-critical coverage tool is not itself gate-enforced — if the tool regresses, the gate's silent mis-parse would not be caught by the gate's own test step. Wiring the tools config into the gate is a larger, separate blast-radius decision (it pulls in ftp / network tool tests); flagged as a forward candidate, not done here (scope discipline).

**The two strict-greater implementations of the PARTIAL threshold now coexist.** The CLI `--max-partial` flag (exit 1) and the gate's own bash `-gt` comparison are independent implementations of the same comparison. They are consistent today; a future change to one operator (`>` → `>=`) in only one place would silently diverge. The duplication is intentional (the flag is reusable infrastructure; the gate prefers its grep-based combined reporting), but it is a latent drift surface noted for awareness.

**Number() arg coercion quirks carried forward unchanged.** `--max-partial=` (empty) coerces to 0 and hex/exponential forms are accepted — byte-identical to the existing `--max-uncodified` parser. Tightening only the new flag would create asymmetry worse than the shared quirk, so it was left alone. If ever tightened, both flags should change together.

## Decisions

- **Tight & symmetric 5/5, both BLOCK** (operator-selected via AskUserQuestion). UNCODIFIED ceiling 41→5, PARTIAL ceiling new=5; either exceeding its ceiling BLOCKs. Aligns the #10430 finer-grained ~5-ship maintenance cadence. Recent non-NASA cadence adds ~0 UNCODIFIED/ship, so a tight ceiling is safe; NASA-resume raises via env var.
- **PARTIAL gated independently, but exempt from legacy strict mode.** PARTIAL gets its own ceiling but is NOT escalated by `SC_PRE_TAG_GATE_REQUIRE` (which stays UNCODIFIED-only). Documented in the gate header so it is not mistaken for a gap.
- **No codification this ship.** A new candidate (#10460) is recorded in 04-lessons.md but NOT added to `disciplines.json` (1-instance candidate, below the promotion bar). Keeping it out of any cited canonical doc preserves the drained PARTIAL 0 state — the milestone's whole identity is the gate tightening AROUND the zero baseline, not adding a new PARTIAL entry.
- **No FTP sync, no GH release** — consistent with the v886–v911 pattern; git tags remain authoritative.

## Surprises

- **PARTIAL was structurally invisible to the gate, not just unconfigured.** It was not that the ceiling was set too high — there was no PARTIAL ceiling at all, and the parse result was dead-ended inside an UNCODIFIED-conditional branch. The v910 hand-drain treated the symptom; this ship closes the cause.
- **The gate-critical coverage tool had zero tests.** A tool whose output a BLOCK gate parses, with no test asserting its output format or exit codes — exactly the silent-mis-parse risk the static-analysis-tool discipline (#10417/#10450) exists to prevent. The first test landed alongside the feature.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail and the new #10460 candidate)

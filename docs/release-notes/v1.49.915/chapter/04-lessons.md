# Lessons Codified — v1.49.915

No manifest codification this ship (it is a flake-audit + latent-bug-fix maintenance ship, not a codify ship). No change to `tools/render-claude-md/disciplines.json`; CLAUDE.md unchanged; the live discipline-coverage state stays at UNCODIFIED 0 / PARTIAL 0. The one carry-forward candidate (#10461, opened v913) reaches its 3-instance bar below — recorded, but codification is deferred to an operator-authorized codify ship.

## Candidate reaches bar — #10461 (2-instance → 3-instance; BAR MET, codification deferred)

**A test/observability surface that runs nowhere enforced silently rots; gate-enforce every such surface, and pair the gate with a drift-guard so the enforced set / its reference data cannot silently drift.**

Opened at v913 (tools vitest suite) and advanced to 2-instance at v914 (node:test files). This ship is the **third instance**, and the first to extend the rule beyond *test suites* to a *static-analysis policy tool*: `atlas-deps-audit` ran in no gate since v1.49.607, and its `CROSS_TREE_ALLOW_PATTERNS` allowlist silently rotted out of sync with the v1.49.905 LoaderContext chokepoint wire — producing a false-positive violation that nothing surfaced. The remediation is the same shape: gate-enforce the surface (live-tree Case 6 in the gate+CI tools suite) and let that enforcement double as the drift-guard.

**Instance evidence:**

| Instance | Ship | Unenforced surface | How it rotted | Layer 1 (enforce) | Layer 2 (drift-guard) |
|---|---|---|---|---|---|
| 1 | v1.49.913 | `vitest.tools.config.mjs` (~40 tools/+scripts/ vitest tests) | ran nowhere → 8 files silently red ~2 weeks | pre-tag-gate step 2.5 `tools-suite` | `tools-config-coverage.test.mjs` explicit include-list (omission-drift) |
| 2 | v1.49.914 | 2 `tools/` `node:test` files (21 tests) | vitest can't run them, no other runner | pre-tag-gate step 2.7 `tools-node-test` + CI | `--print-node-test` exact-set `toEqual` (silent-addition-drift) |
| 3 | v1.49.915 | `atlas-deps-audit` policy tool (ADR-0003 acceptance test) | never gate-wired since v607 → allowlist drifted stale vs the v905 chokepoint wire | live-tree Case 6 in gate+CI tools suite | Case 6 IS the drift-guard (asserts the real tree passes; fails loudly on a new un-allowlisted import) |

**What the third instance adds (the generalization a 3rd instance should make):** the rule is not specific to *test suites*. Any surface whose correctness depends on being run — a test suite, a node:test runner, or a **static-analysis tool whose allowlist must track reality** — rots when nothing enforces it. Instances 1/2 rot as "tests don't run"; instance 3 rots as "reference data goes stale." Same disease (unenforced ⇒ silent rot), same cure (wire the surface's own check into the gated suite so the surface enforces itself). The drift-shape catalog now spans three forms: omission-drift (explicit include-list), silent-addition-drift (exact-set), and **reference-data-staleness** (allowlist vs disk).

**Promotion path (bar now MET — operator-authorized codify ship):** the 3-instance bar is reached (v913 + v914 + v915). Its natural home remains `docs/known-unwired-ledger-discipline.md` (the #10443 discipline), which already treats explicit allowlists as drift-bearing migration debt — instance 3 is literally an allowlist that drifted. A codify ship should: add the #10461 entry there with the three-form drift catalog above; append `#10461` to the relevant domain's `key_lessons` in `tools/render-claude-md/disciplines.json`; run `npm run render:claude-md`. **Not done this ship** — this is a maintenance ship and codification is operator-gated (the v914 handoff kept #10461 a candidate, operator-confirmed). Recorded here so the bar-met state is unambiguous for the next codify-ship scope discussion.

## #10448 carry-forward audit — verified no-op (handoff option 4)

The operator's option 4 was "continue carry-forward promotion of the v903–v909 sub-3-instance #10448 sub-variant candidates as they reach the bar." Audited against `docs/architecture-retrofit-patterns.md`, `tools/render-claude-md/disciplines.json`, and the v910–v914 lessons:

- Every #10448 sub-variant at the 3-instance bar is **already codified**: #10448 (catalog, v883), #10455 (class-stored hoist-at-top, v899), #10459 (class-multi-method consolidated-gate, v910).
- The five open carry-forward candidates are each at **1 instance**: module-singleton (v881 `intelligence/ipc.ts`), sync two-site hoisted-check (v903 `keystore.ts`), class-instance multi-method read-side (v904 `skill-event-store.ts`), module-function two-site mixed sync+async (v905 `pmtiles-reader.ts`), sync multi-site same-path (v906 `emulated-scanner.ts`).
- The LoaderContext KNOWN_UNWIRED ledger that fed these candidates is **drained (0/0/0)** — new instances can only arrive from future audit-scope expansions, not the current ledger.

**Verdict: nothing promotable.** No #10448 sub-variant sits at the bar uncodified. The standing forward-option ("continue carry-forward promotion as candidates reach the bar") remains correct and unchanged.

## Disciplines applied (existing — no new codification)

| Lesson | How it was applied this ship |
|---|---|
| #10461 (candidate) | Third instance — gate-enforced the atlas-deps-audit surface via the live-tree test; bar now met |
| #10427 (failure-mode contracts) | De-noise = quiet-on-success forensic surface; Case 6 = fail-loudly load-bearing policy check |
| #10450 (static-analysis robustness) | Stale-allowlist false-positive closed by wiring the tool's acceptance test into the gated suite |
| #10182 (skip-guard gitignored runtime artifacts) | `mus-smoke/build-template-instruction.test.mjs` reads a gitignored `.planning/` template — `describe.skipIf(!existsSync(...))` so it runs locally / skips in CI (fixed a real CI red v914's CI-wiring exposed) |
| entrypoint-guard discipline | `chapter.mjs` ran `main()` on import → PG query → CI `process.exit(2)`; wrapped in `if (… import.meta.url === pathToFileURL(process.argv[1]).href) main()` so it runs only as CLI (cf. the `src/cli.ts` main()-at-module-load fix; second instance of this shape in the project) |
| #10430 (counter-cadence) | Finer-grained ~5-ship maintenance cadence — this is counter-cadence #16 |

## Cross-references

- #10461 (the candidate this ship advances to 3-instance / bar met; opened v913, advanced v914)
- #10443 (KNOWN_UNWIRED ledger / inverse-audit — explicit allowlists as drift-bearing debt; #10461's promotion home)
- #10427 (failure-mode contracts — quiet-on-success vs fail-loudly; both halves of this ship)
- #10450 (static-analysis tool robustness — the stale-allowlist sibling)
- #10448 / #10455 / #10459 (the sub-variant catalog audited for option 4; all bar-reaching variants already codified)
- ADR-0003 (atlas clean-room policy — the allowlist's authority; §Verification is the now-enforced acceptance test)
- v1.49.913 / v1.49.914 (instances 1 and 2 of #10461)

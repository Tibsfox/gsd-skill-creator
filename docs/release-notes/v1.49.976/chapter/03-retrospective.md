# v1.49.976 — Retrospective

## What went right

- **Recon caught two imprecise plan premises before any code changed.** The
  parallel recon workflow refuted the handoff's "teams mostly closed" framing
  (`team validate --all` was actually 2/4 FAIL) and corrected the chipset
  premise ("says 9, lists 11" → the doc listed the *wrong* 9: `muse`/`forge`
  present, `voice`/`metrics` absent). Same verify-the-premise discipline that
  caught the D1/D3/Ship-2.3 corrections.
- **The validate fix was a relocation, not the premise.** `loadAnyCartridge`
  already accepted research-output; the real bug was `handleValidate` calling
  `loadCartridge`. Independent cross-checking located the true site, keeping the
  diff to a tight +10/-4 dispatch swap with zero loader behaviour change.
- **The teams migration was mechanical and faithful.** Deriving `agentId` from
  name, `agentType` from leader/worker, and `prompt` from description preserved
  all content; topology rules passed because the leader became `coordinator`.

## What went well in process

- One operator decision (AskUserQuestion) on the genuine teams fork; items
  B/C/D proceeded as unambiguous engineering calls.
- The new drift-guard was proven non-vacuous (old dialect rejected on the exact
  3 missing fields) before relying on it — the #10450 anti-vacuous discipline.
- Both new tests landed in existing suites, so the pre-tag-gate stayed at 20
  (no new shell step / denominator churn).
- step-P dogfooded clean (0 confirmed); the only gate hiccup was an unrelated
  timing flake, handled by confirming-in-isolation then re-running.

## What to watch

- **`src/cache` preload latency-ratio test (CF-M5-04) is load-flaky.** It
  asserts a wall-clock 10× ratio and missed under full-suite CPU contention
  (passed 10/10 ×3 in isolation; CI green on the same commit). A candidate for
  a tolerance/retry hardening if it recurs.
- The 22 `*-department` cartridges still carry known-validation-debt
  (`agent_affinity`/`domains_covered`), passing only via
  `--allow-validation-debt` — pre-existing, out of Ship 2.4 scope.
- The agent-teams primitive remains dormant (no `team run` runtime); the
  migrated demos are reference examples, not a revival.

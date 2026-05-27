# v1.49.822 — Retrospective

**Wall-clock:** ~20 min from chain-continuation to tag-push. Seventh ship of the v816-822 chain.

## What worked

**The v821 infrastructure made the v822 flip trivial.** v821 added the env var + flag + branching. v822 just changed the default value + removed one conditional. ~10 LOC delta. The two-ship infrastructure-then-flip pattern paid off — splitting let each ship be focused + reviewable.

**Smoke-test verification BEFORE the flip caught no issues.** Ran ceiling=30 forced-fail before the v822 commit; got expected exit 15 + FAIL message. Then ran default ceiling=41; got PASS. Then ran ceiling=100; got PASS. Three scenarios verified the policy + escape valves before the ship landed.

**The legacy `SC_PRE_TAG_GATE_REQUIRE=discipline-coverage` mode is preserved.** Backward compatibility: existing CI scripts or operator habits that use the env var still work as "strict mode" (FAIL on any UNCODIFIED). The new default-BLOCK is "ceiling mode" (FAIL on count > ceiling). Both decision surfaces coexist; the gate dispatches on env state.

**Buffer of 2 is operator-tunable.** The default 41 = 39 (current) + 2 (buffer). If chain ships in this session added 1-2 new UNCODIFIED entries, the gate still passes. If they add 3+, the gate fires; the operator can either codify some OR raise the ceiling explicitly. The 2-unit buffer is tight but not punitive.

**Audit's "2 ships" sizing was exactly right.** v821 (infrastructure, ~25 min) + v822 (flip, ~20 min) = ~45 min total wall-clock. Matches the audit's prediction within 10%.

## What surprised

**Removing the `gate_required` wrap was the surgical change.** I expected v822 to need bigger surgery (rewrite the step entirely). Reality: v821's structure already had the conditional in the right place; v822 just removes the conditional, leaving the FAIL unconditional on ceiling-exceed. The flip is structurally tiny.

**The legacy strict mode is more strict than the new default.** Strict mode (any UNCODIFIED fails) is HARDER to satisfy than ceiling mode (only ceiling-exceed fails). The two modes form a "strict ⊆ ceiling" hierarchy: strict is the special case where ceiling = 0. Operators wanting maximum enforcement can still use strict mode via env var.

**No new tests required.** The gate is shell + node; no vitest tests for the step. Smoke testing via shell invocations is the verification path. Future ship could add vitest tests for the step (mock the tool's output, verify gate's branching). Out of scope per #10416.

## What to watch

- **The 2-unit buffer is tight.** If the next 2-3 ships each add a tentative observation that promotes to a lesson within this chain, the next pre-tag-gate may fail. v823 (next ship) should produce ≤2 new tentative observations to stay under ceiling.

- **The ceiling is set in source (`pre-tag-gate.sh:681`).** Updating the ceiling requires a code change + commit. Alternative: move to a config file (e.g., `disciplines.json` could carry the ceiling). Future scope; not needed yet.

- **The smoke-test verification isn't repeatable in CI.** I ran it manually. Future ship could add a `tests/integration/c-pre-tag-gate-ceiling.test.ts` that invokes the gate with various ceiling settings and asserts exit codes. Out of scope per #10416.

## Verdict on scope

Closed at the canonical flip-ship shape: ~10 LOC delta + 5 release-notes files. Resisted: removing legacy mode (backward compat), auto-tuning the ceiling, adding vitest tests for the gate. The flip is exactly the v784 audit's plan.

After v822, the v816-822 chain has 1 ship remaining: v823 (T1.3 ObservationBridge wire, ~55 min estimate). Total chain wall-clock so far: ~165 min across 7 ships. v823 will push it to ~3.5 hours.

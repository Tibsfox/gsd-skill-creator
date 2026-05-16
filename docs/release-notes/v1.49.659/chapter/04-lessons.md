# Lessons — v1.49.659

Five lessons codified this milestone. Each links to its first-instance citation and the antecedent lesson (if any) that motivated it.

---

## #10335 — Counter-cadence milestones can be research-driven, not just operational-debt

**Antecedent:** #10168 (counter-cadence cleanup-mission pattern, productive every ~30 milestones, codified at v1.49.585).

**Why:** All six prior 2026 counter-cadence milestones (v1.49.585, .653, .654, .655, .656, .658) closed accumulated *operational debt* (gates not gating, regressions in shipped infrastructure). v1.49.659 demonstrates a second productive shape: a counter-cadence triggered by *external research input* (the 60-paper May 2026 arxiv synthesis), producing build-out rather than cleanup. Both flavors share the property "engine-state-invariant" but their failure modes differ — operational-debt counter-cadence prevents future incidents; research-driven counter-cadence imports frontier findings before they accumulate as a research-update-debt.

**How to apply:** When a research-mission output (`.planning/research/...-synthesis.md`) lands and the next milestone is queued as degree-advancing, evaluate whether the synthesis's "Phase 2" items represent enough engine-substrate work to justify a counter-cadence. Two back-to-back counter-cadence are tolerable; three would need explicit operator approval per the alternation review at v1.49.690 (forward-routed).

**First instance:** v1.49.659 (this milestone).

---

## #10336 — Pass-rate-blind audit machinery requires probe banks + runner + skill versioning together

**Antecedent:** none (new category).

**Why:** The CTA methodology (arxiv `2605.11946v1`) showed that pass-rate is blind to most skill effects (522 measurable behavioural changes vs +0.3% pass-rate movement across 49 tasks). The `skill-counterfactual-audit` skill in `.claude/skills/` documented the methodology. But without (a) probe banks, (b) a dispatcher that runs paired probes, (c) a skill version-bump discipline driven by audit findings, the methodology was inert — there was no operational way to surface SIP deltas. This milestone shipped all three pieces together; partial implementations (e.g. probes but no runner; or methodology but no probe banks) would not have produced the v2 audit findings.

**How to apply:** When introducing any pass-rate-blind methodology, ship the full triad (input bank + runner + skill versioning) in the same milestone OR forward-route the missing pieces explicitly. The bank without runner is unverifiable; the runner without bank is untestable; both without skill versioning are advisory at best.

**First instance:** v1.49.659 — `.planning/patterns/skill-audits/probes/` (bank) + `tools/skill-audit/run.mjs` (runner) + intent-router v1.0.0 → v1.0.2 and spectral-topology-preflight v1.0.0 → v1.0.1 (versioning).

---

## #10337 — Platform-constraint check is load-bearing for recommendation-emitting skills

**Antecedent:** #10193 (sub-agent dispatch discipline: SendMessage not in toolkit, spawn-and-return only).

**Why:** The v1.0.0 `spectral-topology-preflight` skill recommended topology changes (mesh, ring, critique-route) without checking whether the runtime could actually implement them. In Claude Code subagent dispatch (which the project uses extensively), all of those topologies collapse to star because there is no inter-agent SendMessage. The skill's quantitative recommendations were correct in the abstract but unactionable on this runtime. Two independent without-skill probes (STP-01 and STP-04) surfaced this in the v2 audit — sub-agents read MEMORY.md and applied the SendMessage constraint correctly, but the with-skill probes did not. The v1.0.1 supplement adds a platform-constraint check paragraph.

**How to apply:** Every skill that emits a *recommendation* (as opposed to merely a classification or summary) must include a platform-constraint check appropriate to its domain. For multi-agent skills, "spawn-only vs full-duplex" is the relevant axis. For skills that recommend tools or services, "is the tool installed / authenticated" is the relevant axis. The check should fire BEFORE the recommendation, and the recommendation text should reference the constraint either way (pass or fail).

**First instance:** v1.49.659 — spectral-topology-preflight v1.0.1 SKILL.md "Platform-constraint check (added v1.0.1)" section.

---

## #10338 — Skip-rule calibration is measurable via skip-path probes

**Antecedent:** #10336 (CTA machinery requires bank + runner + versioning together).

**Why:** A skill's "When to skip" section is a text claim about when the skill should not fire. Without a skip-path probe in the audit bank, the claim is unverified. With one, the audit either confirms the skip fires (calibrated) or surfaces ceremony when the skip should have suppressed it (refine signal). This milestone authored skip-path probes for 4 skill clauses (IR-01 scoped-lexical, EGS-03 deterministic-N=1, EGS-04 side-effectful, STP-03 single-agent) — all 4 fired correctly in v2. This is a structurally stronger signal than "the skill's text says it skips on X."

**How to apply:** Every "When to skip" bullet a skill claims must have a corresponding skip-path probe in its bank. The probe MUST be a case where the no-skill baseline produces a useful answer (so the with-skill agent is measurably opting OUT of the methodology, not just opting INTO inaction). Audit verdicts should weight skip-path probes double (per `.planning/patterns/skill-audits/probes/README.md` — `skip-path probes weighted double`); a skip-path failure is more diagnostic than a recovery-probe success.

**First instance:** v1.49.659 — see v2 audit report `.planning/patterns/skill-audits/2026-05-16-v2-broader-bank.md` §1-3 for the 4 skip-path verdicts.

---

## #10339 — Resolve apply-to-self false positives in-place; reserve allowlist for true bypasses

**Antecedent:** #10174 (allowlist exists for legitimate exception cases) + apply-to-self-allowlist.md note ("soft-discipline tool — review all entries at each ship").

**Why:** The 2 apply-to-self findings on `src/scan-arxiv/{bridge,fetcher.live}.test.ts` were both false positives from the pattern detector — `bridge.test.ts` had `'.planning/...'` as a fixture *string* (never actually used as a path), and `fetcher.live.test.ts` had a warm-up call that was simply unlabeled. The tempting fix was to add allowlist entries. The cleaner fix was in-place: rename the fixture string to a tmp marker (keeps production default in a comment), and add a "Warm-up" label to the existing warmup call. Both fixes are 2-line changes; the allowlist entries would have been permanent justifications for what's actually a pattern-detector false positive, and would have prevented the underlying signal from re-firing on real future issues in those files.

**How to apply:** Before adding any new allowlist entry, ask: is the underlying pattern-detector finding a TRUE positive (real bypass need) or a FALSE positive (pattern matched on incidental text)? If false positive, the fix lives in the source file (rename, label, restructure). If true positive (e.g. the meta-test fixture case which legitimately needs the perf-string in its test fixtures), use the allowlist with a permanent justification. The allowlist accumulates noise if every false positive becomes an entry.

**First instance:** v1.49.659 — commit `2ff8aac18` (scan-arxiv test apply-to-self fixes).

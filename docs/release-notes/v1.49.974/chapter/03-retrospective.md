# v1.49.974 — Retrospective

## What went right

- **Reading the actual consumer files caught a wrong wire target.** `skill-counterfactual-audit`'s own doc names `done-retirement` as the "gate before retiring a skill." But `done-retirement` in this repo is the **Gastown work-item retirement pipeline** (retiring polecat beads), not skill retirement — a naming collision. The correct home is `skill-integration` (the skill that manages the skill lifecycle this skill audits). Wiring into the literal-named consumer would have been a domain mismatch; the diff documents the correction so a future reader doesn't re-introduce it.
- **autoDiscover made promotion cheap.** The manifest's `*/SKILL.md` autoDiscover glob installs single-file skills with no manifest entry, so promotion was a `cp` of the seven dirs into source-of-truth — `install.cjs --dry-run` then reported them as `current` (byte-identical), confirming clean-install reproducibility without manifest churn.
- **The wires landed in semantically-correct, genuine consumers** (not forced references): a skill-lifecycle audit gate, a team-dispatch pre-flight, a dispatch-entry intent classifier, and a multi-candidate selector — each at the point its skill documents.

## What went well in process

- **Promotion surfaced the latent spec/security debt of the local-only skills, and the gates caught it.** The 3 keepers had `status: active` (lowercase) and no `triggers` — invisible while local-only, but `agentskills-spec-compliance` (CF-H-032) flagged them once they entered source-of-truth; fixed to the spec. Then CI's harness-integrity scanner flagged `adversarial-pr-review`'s guardrail line as a privilege-escalation pattern — a guardrail phrase containing the literal it guards (#10462) — reworded before main.
- **The drift-guard is mutation-proven and gate-enforced for free.** Named `*.test.ts` (not `.integration.test.ts`), it runs in the root vitest project every ship (pre-tag-gate step 2 + CI) with no new shell step / denominator bump (#10461). It pins the promoted set, the KEEP-LOCAL boundary, and every wire.
- **Adversarial review came back clean (0 confirmed)** on a multi-file diff; the 2 refuted findings (forward-dated version, UC-lab agent count) were both correct.

## What to watch

- **The skills-tier adoption answer is committed-inventory + drift-guard, not runtime telemetry.** A per-skill activation counter (extending `src/storage/skill-index.ts`, which manages the gitignored `.claude/skills/.skill-index.json`) is a scoped follow-on — sibling of the src/ adoption-scan and the agent-adoption scan (audit Ship 2.3). Documented in `docs/skills-source-of-truth.md`, intentionally out of scope here.
- **uc-observatory KEEP-LOCAL is pinned to D1.** If v1.50 is reactivated, the drift-guard's KEEP-LOCAL assertion will need a deliberate update — that is the intended forcing function.
- **`done-retirement`'s "before retiring a skill" doc line is still misleading** (it describes work-item retirement); a future skill-lifecycle ship could reconcile that wording. Out of scope for Ship 2.2.

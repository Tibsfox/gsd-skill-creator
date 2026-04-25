---
date: 2026-04-25
milestone: v1.49.575 CS25–26 Sweep → GSD Integration
phase: 805
satisfies: CS25-09 (SKILL.md draft additions — four-type ambiguity checklist + five-principle structural-completeness)
sources:
  - arXiv:2604.21505 (four-type ambiguity taxonomy)
  - arXiv:2604.21090 (five-principle structural completeness)
linter_specs:
  - .planning/missions/cs25-26-sweep/work/synthesis/specs/HB-05-five-principle-linter.md
  - .planning/missions/cs25-26-sweep/work/synthesis/specs/HB-06-ambiguity-checklist.md
---

# SKILL.md Quality Checks

Two complementary quality gates run on every authored `SKILL.md` before promotion out of `.planning/staging/inbox/`. Both ship default-off in v1.49.575 (warning-only) and flip to blocking after the v1.49.576+ corpus audit.

## §1 Four-Type Ambiguity Checklist (per `arXiv:2604.21505`)

The four-type taxonomy distinguishes failure modes by where the ambiguity lives. Author-side discipline is faster than reviewer-side discipline; the checklist runs at draft time.

### 1.1 Lexical ambiguity

A single word in the SKILL.md carries multiple meanings that downstream readers (human or LLM) can't disambiguate from context alone. The classic case is "model" — software model, statistical model, or LLM model? Resolve by naming the referent on first use ("the LoRA *adapter weights*" not "the model").

*Example.* "The skill loads the model and applies the kernel." → ambiguous (which model? which kernel?). Repair: "The skill loads the per-skill LoRA adapter weights and applies the megakernel scheduler."

### 1.2 Syntactic ambiguity

Sentence structure permits multiple parse trees. Often surfaces as dangling modifiers or coordination scope. LLMs frequently pick the wrong parse silently and proceed.

*Example.* "Validate the skill and the agent or the chipset." → does "or" bind tightly to "agent" or loosely across the whole list? Repair: split into two sentences or use parentheses: "Validate either (the skill and the agent) or the chipset."

### 1.3 Semantic ambiguity

The words and structure are clear, but the operational meaning isn't. "Appropriate", "reasonable", "best-practice", "high-quality", "as needed" all fail this check — they have no operationalized referent the agent can verify against.

*Example.* "Apply the skill when appropriate." → linter flag. Repair: "Apply the skill when the active phase has `requires_skill_creator: true` in its frontmatter."

### 1.4 Vagueness

Quantifier-free claims, missing thresholds, missing units. "Often", "usually", "many", "a few", "small" without a number. The agent cannot decide whether a given case satisfies the claim.

*Example.* "Process small batches first." → linter flag. Repair: "Process batches with N ≤ 32 items first."

The HB-06 linter at `src/cartridge/linter/ambiguity.ts` (CS25-18, Phase 811) implements heuristic detection of all four types. Acceptance: zero false positives on the v1.49.575 in-tree skill corpus.

## §2 Five-Principle Structural Completeness (per `arXiv:2604.21090`)

Five principles a SKILL.md must satisfy *for the kinds of claims it makes*. Principles only apply when the corresponding claim type is present — a SKILL.md that makes no quality claims is not required to ship an assessment rubric. The check is structural, not content-evaluative.

### 2.1 Computability-theory grounding (for computational claims)

If the skill claims to compute, decide, search, optimize, or otherwise produce an output deterministically, declare the computational class (decidable / semi-decidable / undecidable; polynomial / exponential; deterministic / randomised). Skills that wrap external LLM calls must declare the call's behavioural class, not just the wrapper's.

### 2.2 Proof-theoretic structure (for deductive claims)

If the skill claims a deductive guarantee ("when X then Y"), the proof or proof-pointer must be present. Acceptable forms: a citation to a theorem in `docs/substrate/`, an inline proof sketch with assumptions enumerated, or a runtime assertion that fails closed when the precondition is violated.

### 2.3 Bayesian-epistemology framing (for uncertainty claims)

If the skill claims confidence, probability, likelihood, or risk, declare the prior, the evidence model, and the update rule. "We are confident this works" without a calibration story fails this principle. Skills that score outputs must publish their score's distribution under the null.

### 2.4 Data-classification specification (for data-handling claims)

If the skill reads, writes, or transforms data, declare the data classes touched (public / project-internal / Fox Companies IP / personal / safety-critical) and the boundary rules (which classes can be read together, which cannot mix in output). Wasteland exclusion rules belong here.

### 2.5 Assessment-rubric specification (for quality claims)

If the skill claims its output is "good", "high-quality", "production-ready", "publishable", declare the rubric. CSO discipline (claim / source / observation) is the canonical GSD rubric; the five-principle check verifies that *some* operationalized rubric is named, not that it equals CSO.

The HB-05 linter at `src/cartridge/linter/structural-completeness.ts` (CS25-17, Phase 810) implements all five principles with positive and negative fixture corpora.

## §3 How both feed the cartridge linter

HB-05 (Five-Principle structural completeness) and HB-06 (Four-Type ambiguity) ship together as a single SKILL.md authoring discipline upgrade — see xmod CC-2 (ship-together discipline) and Phases 810 + 811 in the v1.49.575 roadmap. Spec details:

- `.planning/missions/cs25-26-sweep/work/synthesis/specs/HB-05-five-principle-linter.md` — full spec for the structural-completeness linter, including the GROUNDINGmd two-class taxonomy adoption (Hard Constraints / Convention Parameters per `arXiv:2604.21744`) as a structural criterion.
- `.planning/missions/cs25-26-sweep/work/synthesis/specs/HB-06-ambiguity-checklist.md` — full spec for the ambiguity linter, including positive and negative fixture corpora per ambiguity type.

Both linters gate promotion out of `.planning/staging/inbox/`. With flags off (`cs25-26-sweep.structural-completeness-lint`, `cs25-26-sweep.ambiguity-lint`), the gates emit warnings only and do not block. With flags on (the v1.49.576+ default after the corpus audit), failures block promotion.

### 3.1 Author workflow

1. Draft `SKILL.md` in `.planning/staging/inbox/<skill-name>/`.
2. Run `npx skill-creator lint <path>` — emits both linter reports.
3. Address each finding: ambiguity findings are usually one-line fixes; structural-completeness findings may require adding a frontmatter block declaring the relevant computational class, data classes, or rubric.
4. Promote with `npx skill-creator promote <path>` — the linters re-run and gate the promotion.

### 3.2 Convergent-discovery framing

The five principles in §2 are not novel to GSD: they are the published mirror of the CSO (claim / source / observation) discipline GSD has shipped since v1.49.500. The convergent-discovery framing is per `arXiv:2604.21744` — the same paper that gave the Hard Constraints / Convention Parameters taxonomy independently arrived at structural-completeness as the safety-critical SKILL.md authoring discipline. See `convergent-discovery.md §3` and Phase 810's cross-reference in `.planning/missions/cs25-26-sweep/work/synthesis/specs/HB-05-five-principle-linter.md`.

## §4 References

- `arXiv:2604.21505` — Four-Type Ambiguity Taxonomy (lexical / syntactic / semantic / vagueness)
- `arXiv:2604.21090` — Five-Principle Structural Completeness for technical specification documents
- `arXiv:2604.21744` — GROUNDINGmd (Hard Constraints / Convention Parameters; convergent-discovery anchor for §2)
- `convergent-discovery.md §2 §3` — full convergent-discovery analysis for the three citations above

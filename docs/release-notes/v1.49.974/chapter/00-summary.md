# v1.49.974 — Summary

## The ship

Ship 2.2 of the 2026-06-03 audit plan closes the skills-tier clean-install reproducibility gap and dispositions the 4 arxiv research skills. Seven skills that lived only in the gitignored `.claude/skills/` tree were promoted into `project-claude/skills/` (source-of-truth, installed via manifest `autoDiscover`); the 4 research skills were each wired into their semantically-correct documented consumer ("wire all 4"); `uc-observatory` stays KEEP-LOCAL per decision-gate D1. No runtime/src change.

## What shipped

- **Promoted 7 skills:** `adversarial-pr-review`, `image-to-mission`, `token-budget` (keepers); `execution-grounded-selection`, `intent-router`, `skill-counterfactual-audit`, `spectral-topology-preflight` (arxiv research). The 3 keepers' frontmatter was brought to the CF-H-032 spec (`status: ACTIVE` + `triggers`). `install.cjs --dry-run` reports 0 new.
- **Wired the 4 research skills:** `skill-counterfactual-audit` → `skill-integration` (skill-lifecycle audit gate — NOT the Gastown `done-retirement` work-item pipeline its doc mis-named); `spectral-topology-preflight` → `team-control` (team pre-flight); `intent-router` → `wrap:execute`+`wrap:verify`; `execution-grounded-selection` → `wrap:verify`. All advisory/best-effort.
- **`uc-observatory` KEEP-LOCAL** (D1) — drift-guard pins the exclusion.
- **`docs/skills-source-of-truth.md`** + **`tests/integration/skills-source-of-truth.test.ts`** drift-guard (Layer-1 vitest) pinning promotions + KEEP-LOCAL boundary + every wire.

## Verification

- Drift-guard 15/15; skill-schema + gastown + c12 (430+) green; `tsc` clean; pre-tag-gate all 20 PASS; dry-run 0 new.
- CI on dev caught a harness-integrity false-positive (promoted `adversarial-pr-review`'s guardrail "bypass security-hygiene" tripped the escalation scanner) → reworded to "circumvent" (#10462).
- Adversarial pre-push review: 0 confirmed findings.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (unchanged).

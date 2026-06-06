# v1.49.987 — Lessons

No new manifest lesson is promoted this ship (count stays **152**). The milestone applies existing discipline rather than discovering new doctrine.

## Applied (existing lessons)

- **"Wired, not allowlisted" (Ship 3.2/3.3 precedent).** When a parked/shelfware module gains a real production consumer, the correct disposition is to remove its adoption-scan allowlist entry — not to update its reason — and to assert it in the wired set. Applied to `amiga`, mirroring git/skill (v978) and commands/learn/scan-arxiv (v979).
- **Cross-platform path discipline (v985–v986 windows lessons).** With the windows CI leg load-bearing, an exact-path test assertion was rewritten to be separator-agnostic (`basename` + `join`-built expected) before push, pre-empting a `path.win32.join` normalization failure.
- **Adversarial pre-push review.** Ran the canonical 5-lens ship review on the diff before push; the one confirmed MAJOR (CLI.md `--json` schema completeness) was fixed in code and the commit amended while local.
- **Bounded-learning curation.** Detected candidates are left pending for human review via `sc:suggest`; nothing is auto-promoted to a skill.

## Process notes

- Promoting a `tools/` spike to a first-class command is cleanest as: extract pure libs → build the command on the libs → reduce the runner to a shim → reflect the new reachability in adoption hygiene, all in one atomic, green commit.
- Reasoning about a guard (here, the live reachability scanner) *before* editing the code it inspects converts an ambiguous "update the text" task into a precise, test-backed change.

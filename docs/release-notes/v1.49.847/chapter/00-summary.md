# v1.49.847 — Codification Ship: Promote #10438 + #10439 + #10440 + #10441 + #10442

**Released:** 2026-05-28

## Why this ship

Codification ship per #10428 meta-cadence (~7-10 forward ships per codify cadence). Last codify ship was v1.49.840 (#10436 + #10437 promotion); this is 7 ships later — at the lower bound of the cadence window. The v841-v846 cluster (operational-debt + substrate-wire) accumulated 3 net new tentative observations on top of the 2 deferred from v840, producing a **5-candidate eligible backlog** at v846 close. Operator decided to clear the full backlog in one ship rather than the typical 2-3-lesson scope.

## The 5 lessons

### #10438 — Verify axis as a first-class numbered lesson

The v844 canonical-doc-decision ship gave the verify axis a home in `docs/meta-cadence-discipline.md` but deferred the numbered-lesson promotion per #10426 (second-instance rule); v847 closes the promotion. Evidence: v829 + v832 — two cross-rootdir integration tests of different shapes (observation-bridge vs fallback-provider). The contrast across two unrelated wires was the load-bearing evidence: a distinct ship-shape that adds proof, not new substrate.

Codified into `docs/meta-cadence-discipline.md` as a new top-level section before Cross-references.

### #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)

A calibratable threshold's loop is structurally incomplete until BOTH write callers ship: a CLI manual recorder (operator-attributed events with explicit polarity) AND a substrate auto-recorder (traffic-attributed events with a default polarity that mirrors the CLI default). Plan THREE ships per threshold: observation-source registration → CLI manual recorder → substrate auto-recorder.

Evidence: v803 token-budget (CLI + `/sc:status` auto-recorder shipped same milestone) + v845/v846 predict-low-confidence (CLI v845, substrate auto-emit v846). Refines #10428's calibrate axis.

Codified into `docs/meta-cadence-discipline.md` as a sibling top-level section to #10438.

### #10440 — Production-caller scope-reduction via path-narrowing

When a forward-flag names a wrapper class but the underlying path is directly callable, call the path directly. Wrapper-class instantiation accretes peer-dependency surface (mock executors, lifecycle context, DI plumbing) that is not load-bearing for the path under test.

Evidence: v845 CLI bypassed ActivationSelector + PipelineActivationDispatch + v846 substrate auto-emit lived inside existing emitPredictions chain — both called the path directly. Refines architecture-retrofit patterns at the production-caller surface.

Codified into `docs/architecture-retrofit-patterns.md` as a new subsection under "## Discipline patterns".

### #10441 — DI-executor + tokenized-argv wire shape for ProcessContext

When a module exposes a factory with an optional injected executor for testability, the default executor closes over `ctx?`, tokenizes the cmd string to extract executable + argv, and calls `ensureProcessAllowed` before delegating. A sub-class of #10433 where the default executor IS the internal helper. Injected executors are NOT wrapped (caller responsibility).

Evidence: v825 `repo-manager.ts` + v843 `mesh-worktree.ts` + v843 `proxy-committer.ts` (3 instances). Codified into `docs/security-chokepoints.md` as a new section after the existing #10433 section.

### #10442 — Re-throw ProcessContextDenied from CLI swallow-catch

CLI surfaces that absorb ALL errors into structured JSON output must re-throw `ProcessContextDenied` as the first line of the catch block. Security denials are load-bearing per #10427 and must propagate even when operational errors are absorbed for UX. Hoisting `ensureProcessAllowed` OUTSIDE the try is preferred; the re-throw is for cases where the catch wraps user-input → spawn-command translation.

Evidence: v820 `branch-manager.ts` + v842 `terminal.ts` (2 instances). Codified into `docs/failure-mode-contracts.md` as a new section after the existing #10437 section.

## Surface delta

- 4 canonical-doc extensions (meta-cadence + architecture-retrofit + security-chokepoints + failure-mode-contracts)
- 4 manifest entry extensions in disciplines.json
- CLAUDE.md regenerated
- 0 source-code changes
- 0 new tests

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 83 |
| Open lesson candidate backlog | 5 | 0 |
| Tentative observations carried forward | ~12-14 | ~7-9 |

## Engine state

NASA degree at **1.178** (UNCHANGED — 65 consecutive ships at 1.178; was 64 entering this ship). New widest pressure margin record by 1.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 16.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).

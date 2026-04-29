# 00 — Summary: v1.49.585 Concerns Cleanup / Foundation Shoring

**Released:** 2026-04-29
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Closes:** five categories of social-rule operational debt → deterministic gates
**Opens:** counter-cadence cleanup-mission cadence (recurring at ~every 30 forward milestones)
**Engine forward-state:** UNCHANGED — degree remains 66/360 (18.3%)

## Structural firsts

- **First counter-cadence cleanup milestone in engine history.** v1.49.585 ships zero NASA / MUS / ELC / SPS forward-cadence content. Its purpose is to convert accumulated prose-only safety rules and operational debt into deterministic enforcement. Establishes the precedent that quality-of-foundation milestones are first-class ship-pipeline citizens.
- **First milestone where newly-installed gates fire against their own milestone's execution.** `self-mod-guard.js` BLOCK events fired ≥7× during W1-W3 work — the C01 hook caught real false-positives in the live harness while the milestone that installed it was still in flight. The milestone is its own integration test.
- **First milestone where the system meta-tests itself at ship time.** Phase 3 of the W4 ship pipeline runs `check-completeness.mjs --current --strict` against v1.49.585's own release-notes; runs `chapter.mjs` idempotent-write against v1.49.585's own chapters (must produce zero diff); fires the pre-push hook against v1.49.585's own push (must BLOCK on simulated-missing files; ALLOW on clean state).
- **First mid-mission architectural correction landed via option-C scope-expansion.** C08 was originally specced as env-var override + fail-fast (option B); user pivoted to full deprecation (option C) when the artemis-ii framing was found to be wrong. Wrapper rewrite delivered 30 lines shorter and structurally simpler than the original spec.
- **First `.gitattributes` in the repo.** Formalizes line-ending normalization + binary-file diff strategy. Was implicit-via-`.gitignore`-and-Git-defaults until v1.49.585.
- **First persisted citation-debt ledger.** `.planning/citation-debt.json` with 9 V-flag entries from v1.49.583-v1.49.584; `tools/citation-debt/list.mjs` makes the ledger queryable by status / mission / citation-target.
- **First milestone with both `project-claude/agents/` and `.claude/agents/` reconciled.** Source-of-truth at 49 entries (was 10) post-promotion of 39 ad-hoc runtime-only agents; install.cjs --dry-run reports zero new agents.

## Engine state at close

| Metric | Value at v1.49.585 close |
|---|---|
| Degree | 66 of 360 (UNCHANGED — no forward-cadence content) |
| Percent complete | 18.3% (UNCHANGED) |
| Pass | 2 (UNCHANGED) |
| Hard-gated forward-degree count | 8 (UNCHANGED — v1.59 through v1.66) |
| §6.6 register exemplars | 10 (UNCHANGED — 2 reproducibly-stable + 4 candidate variants) |
| MUS Pass-1 | COMPLETE (UNCHANGED — closed at v1.66) |
| ELC era state | si-discrete CLOSED at chronological boundary (UNCHANGED) |
| simulation.js block count | 68 (UNCHANGED) |
| Carryforward V-flags | 9 deferred (NOW PERSISTED to `.planning/citation-debt.json`) |

| Operational-debt category | Items closed | Gate installed |
|---|---|---|
| Self-modification safety | 1 (writes to `.claude/skills\|agents\|hooks/`) | `.claude/hooks/self-mod-guard.js` PreToolUse Write\|Edit\|MultiEdit\|Bash |
| Accidental commits to gitignored paths | 1 (git add of `.planning/` / `.claude/` / `.archive/` / `artifacts/`) | `.claude/hooks/git-add-blocker.js` PreToolUse Bash |
| Citation-anchor drift in src code | 4 invariants (cooldown=7d, threshold=0.20, max-corrections=3, small-data-floor=12) | `src/dead-zone/__tests__/citation-invariants.test.ts` (5 vitest) |
| Release-notes completeness drift | 1 (5-file structure + 200-byte minimum per file) | `.git/hooks/pre-push` calling `check-completeness.mjs --current --strict` |
| Hand-authored chapter overwrite | 1 (refresh.mjs writing over hand-authored release-notes) | `tools/release-history/chapter.mjs` checksum-skip + `--force-regenerate` flag |

## Threads closed / opened / extended

- **OPENED:** counter-cadence cleanup-mission cadence (origin at v1.49.585; recurrence target ~every 30 forward milestones; recommended trigger when CONCERNS audit surfaces ≥3 categories of social-rule debt).
- **OPENED:** deterministic operational-gate layer (5 gates installed; documented in CLAUDE.md "Operational Gates" subsection with override env-var registry).
- **EXTENDED:** `project-claude/agents/` source-of-truth (10 → 49 entries; 39 promoted; install.cjs schema-v2 autoDiscover handles the new entries automatically).
- **EXTENDED:** CLAUDE.md "Quick Reference" with new "Environment Variables" subsection (5 vars: `SC_SELF_MOD`, `SC_FORCE_ADD`, `SC_SKIP_PREPUSH`, `SC_INSTALL_CALLER`, `RH_ENV_FILE`; deprecated alias `ARTEMIS_REPO_ENV`).
- **CLOSED:** artemis-ii worktree-attached `.env` as canonical PG-credentials source (replaced by `<repo-root>/.env` with backward-compat deprecation notice for `ARTEMIS_REPO_ENV`).
- **CLOSED:** 13/16 dead branches pruned (3 worktree-attached refused — `artemis-ii` / `nasa` / `wasteland/skill-creator-integration` — left intact pending separate per-worktree decision).
- **CARRY-FORWARD:** all v1.49.584 thread states UNCHANGED — PCL 2-exemplar, GA 1-exemplar, ALL-UP COMMITMENT 1-exemplar, LIFT-AND-RESET 1-exemplar, PRINCIPLE-TRINITY 3-stable, CHANNEL-PARALLELISM 3-stable, SUCCESS-AFTER-FAILURE CLOSED.

## Component delivery summary

| Phase | Components | Status |
|---|---|---|
| W0 — Schemas + specs | citation-debt schema, branch-prune allowlist, citation-anchors spec, hook-conventions spec | 4/4 G0-locked |
| W1A — Hooks + invariants | C01 self-mod-guard.js + C02 git-add-blocker.js + C03 citation-invariants.test.ts | 3/3 LIVE |
| W1B — Pipeline robustness | C04 chapter.mjs idempotent + C05 pre-push gate + installer | 3/3 PASS |
| W1C — Scorer + template | C06 ELC scorer regex unify + C07 MUS Phase C template | 2/2 PASS |
| W1D — Cross-repo + git | C08 RH_ENV_FILE deprecation + C09 .gitattributes + C10 branch-prune | 3/3 PASS (option-C scope-expansion on C08) |
| W1E — Agent reconciliation | C12 audit + apply (39 promoted) | 1/1 PASS |
| W2 — CLAUDE.md updates | Operational Gates subsection + Environment Variables subsection + agent-count truth + artemis-ii deprecation framing | 1/1 G2-approved |
| W3 — Citation-debt persistence | C13 ledger seed (9 entries) + C14 list.mjs CLI | 2/2 G3-approved |
| W4 — Integration + ship | C15 verification matrix + 5-file release-notes + meta-test + bump + tag + push + GH release | IN PROGRESS |

**Total: 12 components landed; 64 new tests across 16 components (5 vitest in-glob + 22 vitest forward-ready in `tools/**` + 22 bash hook/installer self-test cases + 8 vitest C14 + 7 misc).**

## Watchlist for forward milestones

- **v1.49.586 small fixes (deferred from v1.49.585 known-issues §5.1, §5.2):** make `self-mod-guard.js` BASH detection proximity-aware (require write-operator within N tokens of protected-path token); refactor `.claude/hooks/__tests__/self-mod-guard.test.sh` to use `env -i` for fully-sterile invocation.
- **Counter-cadence cleanup-mission #2 (forward target ~v1.49.615 / +30 forward milestones):** re-run codebase audit against `.planning/codebase/CONCERNS.md`-shaped output; identify next 3+ categories of social-rule debt to gate.
- **Citation-debt cleanup sprint (forward target ~v1.49.595):** the 9 persisted V-flag entries (1 DEFERRED Sonics archive + 4 PARTIAL NPS I&M loon counts + 2 PARTIAL Pioneer 8 LNA pages + 3 COVERED paywalled BoW/J.Zool. table pages) — most should resolve via direct outreach (UW ethnoarc, NPS I&M IRMA portal, Wiley/BoW institutional access).

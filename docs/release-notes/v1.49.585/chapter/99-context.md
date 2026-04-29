# 99 — Context: v1.49.585 Engine State Tables

## Engine state at v1.49.585 close

| Metric | Value |
|---|---|
| Degree | 66 of 360 (UNCHANGED — no forward-cadence content) |
| Percent complete | 18.3% (UNCHANGED) |
| Pass | 2 (forward-cadence under retro-wired cumulative forest-sim layer; UNCHANGED) |
| Hard-gated forward-degree count | 8 (UNCHANGED — v1.59 through v1.66) |
| Forward-cadence under retro-wired forest-sim | 5 (UNCHANGED — v1.62 through v1.66) |
| Three-track forward-cadence | 4 (UNCHANGED — v1.63 through v1.66) |
| simulation.js block count | 68 (UNCHANGED) |

## Operational-gate layer at v1.49.585

| Gate | What it blocks | Override env-var | Self-test cases |
|---|---|---|---|
| `.claude/hooks/self-mod-guard.js` | Write/Edit/Bash to `.claude/{skills,agents,hooks}/` | `SC_SELF_MOD=1` OR `SC_INSTALL_CALLER=project-claude` | 6 (SC-01 through SC-05 + regression) |
| `.claude/hooks/git-add-blocker.js` | `git add` / `git commit -a` of `.planning/` / `.claude/` / `.archive/` / `artifacts/` | `SC_FORCE_ADD=1` | 10 (SC-06 through SC-10b + 4 regressions) |
| `.git/hooks/pre-push` | `git push origin main` if release-notes 5-file structure missing or any file <200 bytes | `SC_SKIP_PREPUSH=1` (emergency only) | 3 (BLOCK on missing + ALLOW on clean + non-main pass-through) |
| `src/dead-zone/__tests__/citation-invariants.test.ts` | (CI-test) FAILS if cooldown=7d / threshold=0.20 / max-corrections=3 / small-data-floor=12 silently changed | (must update spec + CITATION.md in same commit) | 5 (4 invariants + 1 cross-check against citation-anchors.md) |
| `tools/release-history/chapter.mjs` checksum-skip | Refresh.mjs overwriting hand-authored release-notes | `--force-regenerate` flag | 6 (SC-11 through SC-14 + 2 fixture-driven cases) |

**Total operational-gate self-test cases: 30 (22 bash + 8 vitest C03+C04 fixture-driven).**

## Component coverage at v1.49.585

| Component | Track | Files produced | Tests |
|---|---|---|---|
| C01 self-mod-guard.js | A — hooks | `.claude/hooks/self-mod-guard.js` (LIVE) + 6 self-test cases | 6 bash |
| C02 git-add-blocker.js | A — hooks | `.claude/hooks/git-add-blocker.js` (LIVE) + 10 self-test cases | 10 bash |
| C03 citation-invariants test | A — invariants | `src/dead-zone/__tests__/citation-invariants.test.ts` | 5 vitest in-glob |
| C04 chapter.mjs idempotent | B — pipeline | `tools/release-history/chapter.mjs` (modified) + idempotent fixture set | 6 vitest forward-ready |
| C05 pre-push gate + installer | B — pipeline | `tools/git-hooks/pre-push` + `tools/install-git-hooks.sh` + npm postinstall hook | 3 bash + 4 SC-cases |
| C06 ELC scorer regex unify | C — scorer | `tools/elc-smoke/score.mjs` (regex updated) + scorer-regex test fixtures | 5 vitest forward-ready |
| C07 MUS Phase C template | C — template | `.planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md` (11-field) + build-template-instruction test | 4 vitest forward-ready |
| C08 RH_ENV_FILE deprecation | D — cross-repo | `tools/release-history/run-with-pg.mjs` (rewritten) | 7 vitest forward-ready |
| C09 .gitattributes | D — git | `.gitattributes` (4 manifest declarations) | (manifest-decl smoke) |
| C10 branch-prune | D — git | `tools/branch-cleanup/prune-stale.sh` + 13/16 branches pruned | 3 bash |
| C12 agent reconciliation | E — sources | 39 agents promoted from `.claude/agents/` to `project-claude/agents/` | (install.cjs --dry-run zero-diff) |
| C13 citation-debt ledger | (W3) | `.planning/citation-debt.json` (9 entries, schema-validated) | (schema-validated against C13 schema) |
| C14 citation-debt list.mjs | (W3) | `tools/citation-debt/list.mjs` + 8 unit tests | 8 node:test |
| C15 integration + ship | (W4) | 5-file release-notes + meta-test + bump + tag + push + GH release | (meta-test = system gates itself) |

## Environment-variable registry at v1.49.585

| Var | Default behavior | Override behavior | Introduced |
|---|---|---|---|
| `SC_SELF_MOD` | unset → BLOCK self-mod writes | `=1` → allow `.claude/{skills,agents,hooks}/` writes | v1.49.585 (C01) |
| `SC_FORCE_ADD` | unset → BLOCK protected-path adds | `=1` → allow `git add` of `.planning/` / `.claude/` / `.archive/` / `artifacts/` | v1.49.585 (C02) |
| `SC_SKIP_PREPUSH` | unset → run completeness gate | `=1` → skip pre-push completeness check (emergency only) | v1.49.585 (C05) |
| `SC_INSTALL_CALLER` | (set by `project-claude/install.cjs` at process start) | `=project-claude` → install.cjs allowlist for self-mod-guard | v1.49.585 (C01) |
| `RH_ENV_FILE` | unset → use default `<repo-root>/.env` | `=<path>` → use override .env path for `tools/release-history/run-with-pg.mjs` | v1.49.585 (C08) |
| `ARTEMIS_REPO_ENV` *(deprecated)* | unset → ignored | `=<path>` → fallback alias for `RH_ENV_FILE`; emits deprecation notice | pre-v1.49.585 (deprecated v1.49.585) |

## Citation-debt ledger state at v1.49.585 close

| V-Flag | Status | Mission Origin | Citation Target | Reason |
|---|---|---|---|---|
| V-8 | DEFERRED | v1.49.583 | Sonics 1965 Kearney Barton session log | physical-archive (UW Suzzallo) |
| V-9-MTR | PARTIAL | v1.49.583 | Common Loon counts in Mt. Rainier NP | vendor-inquiry (NPS I&M) |
| V-9-NCSC | PARTIAL | v1.49.583 | Common Loon counts in North Cascades NPSC | vendor-inquiry (NPS I&M) |
| V-9-OLY | PARTIAL | v1.49.583 | Common Loon counts in Olympic Peninsula | vendor-inquiry (NPS I&M) |
| V-20 | PARTIAL | v1.49.584 | Pioneer 8 1995/1996 reactivation chapter pages | research-time-cost (Mudgway SP-4227) |
| V-21 | PARTIAL | v1.49.584 | Pioneer 8 LNA technology refresh chapter pages | research-time-cost (Mudgway SP-4227) |
| V-23 | COVERED | v1.49.584 | Tacha 1992 BNA No. 31 trachea-length table | paywalled (BoW) |
| V-24 | COVERED | v1.49.584 | Tacha 1992 BNA No. 31 call-frequency table | paywalled (BoW) |
| V-25 | COVERED | v1.49.584 | Fitch 1999 J. Zool. tracheal-elongation table | paywalled (Wiley) |

**Net debt: 9 deferred entries (UNCHANGED in count from v1.49.584; now PERSISTED to `.planning/citation-debt.json` and queryable via `tools/citation-debt/list.mjs`).**

## Source-of-truth reconciliation at v1.49.585

| Source | Pre-v1.49.585 count | Post-v1.49.585 count | Delta |
|---|---|---|---|
| `project-claude/agents/` (source-of-truth, tracked) | 10 | 49 | +39 (promoted) |
| `.claude/agents/` (runtime mirror, gitignored) | 52 | 52 | 0 (unchanged on disk) |
| Source-vs-runtime drift | 39 ad-hoc only-in-runtime | 3 v1.50a-* KEEP-LOCAL | -36 |
| install.cjs --dry-run new-agents reported | 39 | 0 | -39 (reconciled) |

## §6.6 Process Variant Register at v1.49.585 (UNCHANGED from v1.49.584)

| Variant | Status | Exemplars | Origin | Archive Threshold |
|---|---|---|---|---|
| PRINCIPLE-TRINITY | reproducibly-stable | 3 | v1.58, v1.61, v1.62 (closed) | n/a |
| CHANNEL-PARALLELISM | reproducibly-stable | 3 | v1.59, v1.61, v1.62 (closed) | n/a |
| LIFT-AND-RESET | candidate amendment | 1 | v1.63 | ~v1.80 |
| ALL-UP COMMITMENT | candidate amendment | 1 | v1.64 | ~v1.85 |
| PERSISTENT-CONSTELLATION-LISTENER | candidate amendment | 2 | v1.65 + v1.66 | ~v1.85 |
| GRACEFUL-ATTRITION | candidate origin | 1 | v1.66 | ~v1.86 |

**Total: 10 exemplars across 2 reproducibly-stable + 4 candidate variants (UNCHANGED at v1.49.585; engine forward-state preserved across the cleanup milestone).**

## Counter-cadence cleanup-mission cadence (NEW at v1.49.585)

| Cleanup-mission # | Version | Source vision | Categories | Components | Wall-clock |
|---|---|---|---|---|---|
| 1 (origin) | v1.49.585 | `.planning/codebase/CONCERNS.md` (same-day audit) | 5 (self-mod safety / accidental commits / citation drift / completeness drift / chapter overwrite) | 12 + integration | ~7-8 hours |
| 2 (forward target) | ~v1.49.615 | (future audit) | TBD | TBD | TBD |

## Engine Position Summary

v1.49.585 holds the engine at degree 66 (no forward advance) while:
- Installing 5 deterministic operational gates with documented override env-vars
- Reconciling `project-claude/agents/` source-of-truth to 49 entries (39 promoted)
- Persisting 9 V-flag entries to a queryable citation-debt ledger
- Updating CLAUDE.md with Operational Gates + Environment Variables subsections
- Pruning 13/16 dead branches (3 worktree-attached refused)
- Deprecating artemis-ii worktree-attached `.env` in favor of project-root `.env` with backward-compat
- Adding `.gitattributes` formalizing line-ending + diff strategy
- Producing 64 new tests across 16 components (5 vitest in-glob + 22 vitest forward-ready + 22 bash + 8 node:test + 7 misc)

The counter-cadence cleanup-mission pattern is registered as Lesson #10168 with forward-cadence target ~v1.49.615 (every ~30 forward milestones).

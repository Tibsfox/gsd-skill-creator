# 02 — Walkthrough: v1.49.639 Components

Per-component walkthrough with commit anchors, deliverables, and invariants. Commits are listed in dependency order; each section also lists the carry-forward it closes.

## C1 — Self-mod-guard CI divergence diagnostic

**Closes:** CF-1 + CF-2 (paired)
**Wave:** W1A (single track — longest pole)
**Risk:** HIGH at planning (5th iteration on same target with close-or-escalate enforcement)
**Outcome:** CLOSED via path (a); no patch needed; pre-existing skip-guard sufficient

### Stage 1 — Instrument

**Commit `9aeed0a7c`** — `feat(self-mod-guard): add CI-gated trace instrumentation for CF-1 diagnostic`

Added CI-gated TRACE blocks to `.claude/hooks/self-mod-guard.js` + mirror at `project-claude/hooks/self-mod-guard.js`:

- Hook entry: env vars (HOME / USER / PATH / PWD / XDG_CONFIG_HOME / GITHUB_ACTIONS / CI / NODE_ENV / SC_SELF_MOD / SC_INSTALL_CALLER / npm_lifecycle_event), proc state (cwd / argv / umask / pid / ppid / platform / node-version / __filename), self-stat (mode / uid / gid / size)
- stdin lifecycle: input length + first 200 chars + parsed payload
- decide() entry + per-branch marker (out-of-scope-tool / override-SC_SELF_MOD / override-SC_INSTALL_CALLER / override-npm_lifecycle / no-protected-match / block-protected-match) + decision result
- All 4 exit paths: allow / block-json / allow-on-error / allow-on-stdin-timeout

TRACE fires only when `process.env.GITHUB_ACTIONS === 'true'` OR `process.env.SC_TRACE === '1'`. Output to stderr (off the decision stdout channel). All trace operations wrapped in try/catch so instrumentation bugs can't break the hook's allow/block contract.

Local sanity check (with `SC_TRACE=1`) confirmed all TRACE labels emit; behavior unchanged when SC_TRACE not set.

### Stage 2 — Trigger CI

Push `9aeed0a7c` to `origin/dev`. CI run [25725466919](https://github.com/Tibsfox/gsd-skill-creator/actions/runs/25725466919) triggered automatically.

### Stage 3 — Trace diff analysis

CI logs revealed:
- ALL 30,285 vitest tests PASS (`30285 passed | 111 skipped | 7 todo`)
- ZERO `[TRACE` markers in entire test job log
- Security Audit job FAIL on npm audit (separate concern; routed to CF-7)

Investigation at `tests/integration/v1-49-634-meta-test.test.ts:116/135`:

```typescript
const HOOK_AVAILABLE = existsSync(HOOK_PATH);
it.runIf(HOOK_AVAILABLE)('C4 self-mod-guard BLOCKS on adjacent write to .claude/skills/', () => { /* ... */ });
it.runIf(HOOK_AVAILABLE)('C4 self-mod-guard ALLOWS non-adjacent write (regression for §4.1)', () => { /* ... */ });
```

Comment block at lines 28-36 explicitly documents skip-guard rationale per Lesson #10180 / fragile-test discipline doc Template-3.

### Stage 4 — Path determination

Operator AskUserQuestion: TRACE disposition (remove / retain / partial) + C5 routing per ambiguous divergence dimension. Decisions:

- TRACE: REMOVE (forward debugging value low; hook is critical infrastructure; +2861 bytes overhead)
- C5: Branch (ii) Disconfirm (classify as code-substrate; runtime-environment hypothesis not validated)

### Stage 5a — Patch (revert)

**Commit `955f0d755`** — `revert(self-mod-guard): remove C1 trace instrumentation post-CF-1 closure`

Reverted hook to original 9495 bytes / 255 lines. Mirror re-applied via `SC_INSTALL_CALLER=project-claude cp project-claude/hooks/self-mod-guard.js .claude/hooks/self-mod-guard.js`.

### Artifacts

- `.planning/c1-self-mod-guard-ci-diagnostic-design.md` — W0 design doc (Path A vs Path B + recommendation)
- `.planning/c1-self-mod-guard-ci-diagnostic-design-verdict.md` — W0 verdict (PASS-with-confidence)
- `.planning/c1-self-mod-guard-trace-record.md` — Stage 5 trace record per shared-types schema
- `.planning/c1-local-trace.log` — Stage 1 local trace sample

### Test surface

- 0 net new tests (instrumentation reverted; existing `tests/integration/v1-49-634-meta-test.test.ts` skip-guards still in place)

## C2 — Substrate-probe discipline v2

**Closes:** CF-4
**Wave:** W1B.T1 (parallel with C3)
**Risk:** LOW (doc revision + new companion artifact)

### Commit `60d7622bb` — `docs(test-discipline): substrate-probe v2 + audit-method-corrections`

Two deliverables:

1. **`docs/SUBSTRATE-PROBE-DISCIPLINE.md`** edited to add §2.4 "Grep adjacency check requirement" sub-section. Pattern + multi-form examples (hookTimeout / ORDER-BY / perf-assertion / skip-guard) + 33% false-positive rate observation from v1.49.638 W1C + mitigation pipeline + cross-reference to companion inventory.

2. **`docs/test-discipline/audit-method-corrections.md`** NEW companion inventory cataloguing 4 baseline concepts:
   - §2.1 hookTimeout (Vitest inline numeric vs object form)
   - §2.2 ORDER-BY tiebreaker (single-column vs comma-separated multi-column vs LIMIT 1 deterministic)
   - §2.3 perf-assertion threshold (additive constants per Lesson #10181)
   - §2.4 skip-guard env-var (positive vs negative vs runIf/skipIf)

Each concept: primary form, alternate forms, adjacency-check regex, false-positive example with source-incident citation.

### Test surface

- `tests/integration/c2-substrate-probe-discipline-v2.test.ts` (NEW)
  - Asserts §2.4 sub-section present + mentions 33% rate
  - Asserts inventory exists with ≥4 catalogued concepts
  - Asserts baseline 4 concepts catalogued
  - Asserts source-incident cited
- 4 invariant tests; all PASS

## C3 — pr-review-gate project-aware conversion

**Closes:** CF-5
**Wave:** W1B.T2 (parallel with C2; done first per operator W0 sequencing)
**Risk:** LOW (surgical hook modification; user-level config edit)

### Substrate correction at W0

The mission package assumed `pr-review-gate.sh` lived at `project-claude/hooks/pr-review-gate.sh` (project-level via install.cjs manifest). W0 substrate probe revealed the hook is USER-LEVEL Claude Code config:

- File: `/home/foxy/.claude/hooks/pr-review-gate.sh`
- Registration: `~/.claude/settings.json` PreToolUse hook chain
- NOT in project-claude/ at all

Operator chose modify-not-delete via AskUserQuestion: convert hook to project-aware behavior matching its original stated intent (`gsd-build` / `gsd-2` / `gsd-pi` only).

### Commit `16bee534e` — `test(c3): add pr-review-gate project-aware conversion invariant`

Test file added; the actual hook modification happened in user-level config (OUTSIDE this repo, captured at `.planning/pr-review-gate-conversion-record.md`).

5-line whitelist insertion at the user-level hook after line 25 (after IS_PR_CREATE/IS_GIT_PUSH detection, before BRANCH determination):

```bash
REPO_BASENAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)
PR_REVIEW_WHITELIST="gsd-build gsd-2 gsd-pi ${SC_PR_REVIEW_REPOS:-}"
IS_WHITELISTED=false
for repo in $PR_REVIEW_WHITELIST; do
  if [[ "$REPO_BASENAME" == "$repo" ]]; then
    IS_WHITELISTED=true; break
  fi
done
if [[ "$IS_WHITELISTED" == "false" ]]; then
  exit 0
fi
```

Closes the comment-vs-implementation bug at line 11 (comment: "Only gate ... gsd-build/gsd-2 repo branches"; implementation: previously blocked all repos).

Backward-compat preserved via `SC_PR_REVIEW_REPOS` env-var override (any future repo can be added without touching the hook).

### Artifacts

- `.planning/pr-review-gate-pre-conversion-proof.txt` — file metadata + checksum + settings entry pre-edit
- `.planning/pr-review-gate-post-conversion-proof.txt` — same post-edit + verifications
- `.planning/pr-review-gate-conversion-record.md` — full conversion record with rationale

### Test surface

- `tests/integration/c3-pr-review-gate-project-aware.test.ts` (NEW)
  - Asserts hook contains project-aware bypass marker (skip-guarded for environment portability)
  - Asserts gsd-skill-creator NOT in default whitelist (skip-guarded)
- 2 invariant tests; both PASS locally

## C4 — Source-side ORDER-BY tiebreakers

**Closes:** CF-6
**Wave:** W1C (single track)
**Risk:** MED at planning (per W0: revised down to LOW after adjacency probe)

### Substrate correction at W0

The v1.49.638 audit doc claimed 7 fix-needed sites in `src/kb/store.ts` (path was wrong) + 4 hookTimeout files. W0 adjacency probe in `src/intelligence/kb/store.ts`:

| Line | Pattern | Tiebreaker present? | Action needed? |
|---|---|---|---|
| 301 | `ORDER BY ${orderBy}` (var resolves to bare-column or partial-tiebreaker) | PARTIAL | YES — fix conditional |
| 362 | `ORDER BY generated_at DESC, rowid DESC LIMIT 1` | YES | NO |
| 563 | `ORDER BY started_at DESC, rowid DESC` | YES | NO |
| 871 | `ORDER BY b.emitted_at DESC` | NO | YES |
| 916 | `ORDER BY recorded_at ASC` | NO | YES |
| 948 | `ORDER BY taken_at DESC, rowid DESC` | YES | NO |
| 1147 | `ORDER BY started_at DESC LIMIT 1` | N/A (LIMIT 1) | NO |

**Actual fix surface: 3 sites (not 7).** Wider src/ surface (48 ORDER-BY total) verified canonical via spot-check of provenance.ts / symbols.ts / meetings.ts.

### Commit `17d5406cc` — `fix(kb): add ORDER-BY tiebreakers to 3 store.ts read paths`

Three surgical patches:

- **Site 301:** conditional `orderBy` variable now resolves to forms with trailing `id ASC` tiebreaker against `projects.id`:
  ```typescript
  const orderBy =
    opts?.sort === 'priority'
      ? 'priority ASC, last_activity_at DESC, id ASC'
      : 'last_activity_at DESC, id ASC';
  ```
- **Site 871:** `ORDER BY b.emitted_at DESC, b.id DESC` (bundles primary key)
- **Site 916:** `ORDER BY recorded_at ASC, id ASC` (meeting_log primary key)

154 existing kb tests PASS post-patch (no regression).

### Test surface

- `tests/__tests__/kb-orderby-tiebreaker.test.ts` (NEW)
  - Asserts all ORDER-BY clauses comply (multi-column tiebreaker OR LIMIT 1 OR dynamic-var)
  - Asserts baseline ORDER-BY count regression guard (≥7 sites)
- 2 invariant tests; both PASS

## C5 — Meta-Lesson #10197 promotion decision

**Closes:** CF-3
**Wave:** W2 (gated on C1 outcome)
**Risk:** LOW (meta-doc decision; mechanical 3-branch routing)

### Branch routed: (ii) Disconfirm

Per operator decision via AskUserQuestion at v1.49.639 C5 (with C1 outcome ingested):

- C1 `divergenceDimension` classified as `code-substrate` (file presence is code-substrate property; not env-var / $PATH / cwd / perms which are runtime-environment)
- Lesson #10197 stays as a regular lesson framing pipeline-position constraints
- Runtime-environment-substrate generalization NOT validated by this incident
- Disconfirmation note to be authored in `04-lessons.md`

### Artifacts

- `.planning/c5-meta-lesson-decision-tree-design.md` — W0 decision tree pre-confirmation
- `.planning/c5-meta-lesson-decision-tree-design-verdict.md` — W0 verdict (PASS)
- `.planning/c5-meta-lesson-decision.md` — Branch (ii) decision record + pre-drafted disconfirmation note

### Test surface

- 0 separate test (assertion folded into v1.49.639 meta-test as 1 of 7 invariants)

## C6 — Integration meta-test + 5+1 release-notes + ship

**Wave:** W3
**Status:** IN PROGRESS at this writing

### Meta-test

**Commit `fd47bb63e`** — `test(v1-49-639): integration meta-test for cluster #6 closures`

`tests/integration/v1-49-639-meta-test.test.ts` with 7 invariants:

1. C1 trace record documents path-a-close finding (skip-guarded; gitignored .planning/)
2. C2 SUBSTRATE-PROBE-DISCIPLINE.md has §2.4 adjacency-check sub-section
3. C2 audit-method-corrections.md exists with ≥4 catalogued concepts
4. C3 pr-review-gate hook contains project-aware whitelist (skip-guarded; user-level)
5. C4 kb store.ts ORDER-BY clauses have tiebreakers at sites 301/871/916
6. C5 meta-lesson decision records Branch (ii) Disconfirm (skip-guarded; gitignored)
7. counter-cadence engine state UNCHANGED (NASA degree 108 + counter_cadence true + no_engine_state_advance true)

7/7 PASS locally. Skip-guarded assertions (1, 4, 6) gracefully skip in CI rather than false-fail.

### Release-notes

This file (`02-walkthrough.md`) plus 6 sibling chapter files + version-root README.md. ~6-8K words total.

### Pre-tag-gate composite

11 steps unchanged from v1.49.638 (STORY-gate already in correct T14 position from v1.49.638 C5; no structural change needed at v1.49.639). To be verified at C6 mid-flight.

### T14 ship pipeline

OPERATOR-GATED. Awaits G3 authorization via team-lead AskUserQuestion. T14 atomic per Lesson #10191.

## Cross-component summary

| Component | Risk planned | Risk actual | Net new tests | Commits |
|---|---|---|---|---|
| C1 | HIGH | LOW (closure was already in place) | 0 | 2 (`9aeed0a7c`, `955f0d755`) |
| C2 | LOW | LOW | +4 | 1 (`60d7622bb`) |
| C3 | LOW | LOW | +2 | 1 (`16bee534e`) |
| C4 | MED | LOW (3 sites not 7) | +2 | 1 (`17d5406cc`) |
| C5 | LOW | LOW | 0 (folded into meta) | 0 separate |
| C6 | MED | (pending) | +7 (meta-test) | 1+ (`fd47bb63e` + release-notes) |
| **Total** | — | — | **+15** | **6 + release-notes** |

## See also

- `01-overview.md` — milestone narrative + scope-change disclosure
- `03-retrospective.md` — what worked / cycles burned
- `04-lessons.md` — forward lessons #10199+ + Lesson #10197 disconfirmation note
- `05-carry-forward.md` — Cluster #7 inventory
- `99-context.md` — engine state, predecessor pointers

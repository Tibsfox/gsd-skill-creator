# PR-Based Contribution Flow Design

**Phase 2 Execution Discipline for Wasteland Contributions**

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Date | 2026-03-04 |
| Authors | Lex (execution discipline) |
| Depends On | MVR Protocol Spec v0.1, Schema v1.1 |

---

## 1. Current State (Phase 1)

Phase 1 uses a direct-push model. The spec calls it `phase1_mode: wild_west`.

### 1.1 Data Flow

```
Contributor                     DoltHub
    |                              |
    |  fork upstream               |
    |----------------------------->|
    |  clone fork locally          |
    |<-----------------------------|
    |                              |
    |  SQL mutations (local)       |
    |  dolt add + commit           |
    |  dolt push origin main  ─────|──> fork/main updated
    |                              |
    |  (no review gate)            |
    |  (upstream pulls from fork)  |
```

### 1.2 How It Works Today

1. Contributor forks the upstream wasteland to their DoltHub namespace.
2. Contributor clones the fork locally.
3. Contributor adds upstream remote (`dolt remote add upstream`).
4. Contributor pulls from upstream (`dolt pull upstream main`).
5. Contributor makes SQL mutations locally (INSERT/UPDATE).
6. Contributor commits (`dolt commit -m "Complete: w-abc123"`).
7. Contributor pushes directly to fork main (`dolt push origin main`).
8. Upstream maintainer pulls from the contributor's fork (manual or automated).

### 1.3 What's Missing

| Gap | Risk |
|-----|------|
| No merge gate | Invalid data reaches upstream unchecked |
| No schema validation before merge | Broken SQL, orphan references |
| No yearbook rule enforcement at merge time | Self-stamps could slip through social cracks |
| No review requirement | Low-quality completions get stamped implicitly by merge |
| Trust is social, not enforced | Any registered rig pushes to its fork main; upstream trusts all forks equally |
| No audit trail of review decisions | Merge ≠ approval; there's no record of who approved what |

### 1.4 What Works

- Fork-and-push model: correct architectural primitive.
- Dolt's git semantics: commits, branches, and merges are sound.
- SQL schema constraints (yearbook CHECK, primary keys): enforced at the database level.
- The flow is simple. Phase 1 optimizes for adoption over rigor.

---

## 2. Target State (Phase 2)

Phase 2 introduces a PR-based review gate between contributor fork and upstream main.

### 2.1 Data Flow

```
Contributor                     DoltHub                     Validator
    |                              |                           |
    |  create branch               |                           |
    |  contribute/<wanted-id>      |                           |
    |                              |                           |
    |  SQL mutations (local)       |                           |
    |  dolt add + commit           |                           |
    |                              |                           |
    |  push branch to fork ────────|──> fork/contribute/w-x    |
    |                              |                           |
    |  open PR ────────────────────|──> PR: fork/branch → upstream/main
    |                              |                           |
    |                              |   review diff ◄───────────|
    |                              |   CI checks run           |
    |                              |                           |
    |                              |   merge + stamp ◄─────────|
    |                              |──> upstream/main updated  |
    |                              |                           |
    |  pull upstream ◄─────────────|                           |
```

### 2.2 Key Changes from Phase 1

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| Push target | `origin main` | `origin contribute/<wanted-id>` |
| Review gate | None | DoltHub PR required |
| Merge authority | Implicit (push = done) | Explicit (validator merges) |
| Stamp creation | Separate operation | Merged with PR approval |
| Trust enforcement | Social | Structural (API-enforced) |
| Audit trail | Dolt commit log only | PR + review comments + merge record |

### 2.3 Invariants

The following MUST hold in Phase 2:

1. **No direct push to upstream main.** All changes reach upstream via merged PR.
2. **One PR per contribution.** A contribution is a (wanted-id, contributor) pair.
3. **Merge = validation.** The act of merging a PR constitutes review approval.
4. **Stamp is atomic with merge.** The validator creates the stamp in the merge commit, not in a separate operation.
5. **Branch naming is deterministic.** `contribute/<wanted-id>` — parseable, unique per contribution.
6. **Yearbook rule enforced pre-merge.** CI checks reject PRs where author = subject in stamps.

---

## 3. Contribution Pipeline

### 3.1 Step-by-Step

Each step has preconditions (REQUIRE) and postconditions (ENSURE).

#### Step 1: Create Branch

**REQUIRE:**
- Contributor has a local clone of their fork.
- Fork is synced with upstream (`dolt pull upstream main`).
- Contributor has `trust_level >= 1`.

**ACTION:**
```bash
cd LOCAL_DIR
dolt pull upstream main
dolt checkout -b "contribute/<wanted-id>"
```

**ENSURE:**
- Local branch `contribute/<wanted-id>` exists, based on upstream main HEAD.
- Working tree is clean.

#### Step 2: Make Changes

**REQUIRE:**
- Active branch is `contribute/<wanted-id>`.

**ACTION:**
The contributor performs one or both of:

a) **INSERT completion:**
```sql
INSERT INTO completions (id, wanted_id, completed_by, evidence, completed_at)
VALUES ('<completion-id>', '<wanted-id>', '<handle>', '<evidence>', NOW());
```

b) **UPDATE wanted status:**
```sql
UPDATE wanted SET status = 'in_review', updated_at = NOW()
WHERE id = '<wanted-id>' AND status IN ('open', 'claimed');
```

Then commit:
```bash
dolt add .
dolt commit -m "Complete: <wanted-id>"
```

**ENSURE:**
- Branch has exactly one commit (or a small, focused commit chain) ahead of main.
- The completion references a valid wanted-id.
- The `completed_by` field matches the contributor's registered handle.

#### Step 3: Push Branch to Fork

**REQUIRE:**
- Local branch `contribute/<wanted-id>` has commits ahead of main.

**ACTION:**
```bash
dolt push origin "contribute/<wanted-id>"
```

**ENSURE:**
- Branch `contribute/<wanted-id>` exists on the contributor's DoltHub fork.
- Fork main is NOT modified.

#### Step 4: Open PR

**REQUIRE:**
- Branch exists on the contributor's DoltHub fork.
- Contributor has `trust_level >= 1`.

**ACTION:**
```bash
# DoltHub PR API
curl -s -X POST "https://www.dolthub.com/api/v1alpha1/<upstream-org>/<upstream-db>/pulls" \
  -H "Content-Type: application/json" \
  -H "authorization: token $DOLTHUB_TOKEN" \
  -d '{
    "title": "Complete: <wanted-id>",
    "description": "Completion by <handle>.\n\nEvidence: <evidence-url-or-description>",
    "fromBranchOwnerName": "<contributor-org>",
    "fromBranchRepoName": "<upstream-db>",
    "fromBranchName": "contribute/<wanted-id>",
    "toBranchOwnerName": "<upstream-org>",
    "toBranchRepoName": "<upstream-db>",
    "toBranchName": "main"
  }'
```

**ENSURE:**
- A PR exists on the upstream DoltHub repository.
- PR title follows convention: `Complete: <wanted-id>`.
- PR is open and reviewable.

**RETURN:** PR number and URL for user confirmation.

#### Step 5: Validator Reviews Diff

**REQUIRE:**
- PR exists and is open.
- Reviewer has `trust_level >= 2` (contributor) for review, `>= 3` (maintainer) for merge.

**ACTION:**
Validator inspects the PR diff on DoltHub:

- Verify the completion references a valid, non-completed wanted item.
- Verify the evidence is substantive.
- Verify no stamps are self-authored (yearbook rule — also enforced by CI).
- Verify no schema violations.

**ENSURE:**
- Reviewer has inspected all changed rows.
- Decision is recorded (approve, request changes, or reject).

#### Step 6: Validator Merges + Stamps

**REQUIRE:**
- PR is approved by a reviewer with `trust_level >= 3`.
- No CI check failures.

**ACTION:**
The validator merges the PR via DoltHub API:

```bash
# Merge the PR
curl -s -X PATCH "https://www.dolthub.com/api/v1alpha1/<upstream-org>/<upstream-db>/pulls/<pr-number>" \
  -H "Content-Type: application/json" \
  -H "authorization: token $DOLTHUB_TOKEN" \
  -d '{"state": "merged"}'
```

Then, in a follow-up commit on upstream main, the validator creates the stamp:

```bash
# Clone or pull upstream
cd UPSTREAM_LOCAL_DIR
dolt pull origin main

# Create stamp
STAMP_ID="s-$(openssl rand -hex 5)"
dolt sql -q "INSERT INTO stamps (id, author, subject, valence, confidence, severity, context_id, context_type, skill_tags, message, created_at) VALUES ('$STAMP_ID', '<validator-handle>', '<contributor-handle>', '<valence-json>', <confidence>, '<severity>', '<completion-id>', 'completion', '<skill-tags>', '<message>', NOW())"

# Link stamp to completion
dolt sql -q "UPDATE completions SET validated_by = '<validator-handle>', stamp_id = '$STAMP_ID', validated_at = NOW() WHERE id = '<completion-id>'"

# Mark wanted as completed
dolt sql -q "UPDATE wanted SET status = 'completed', updated_at = NOW() WHERE id = '<wanted-id>'"

dolt add .
dolt commit -m "Validate: <completion-id>"
dolt push origin main
```

**ENSURE:**
- PR is merged. Upstream main contains the completion.
- Stamp exists with `author != subject` (yearbook rule).
- Completion has `validated_by`, `stamp_id`, and `validated_at` set.
- Wanted item has `status = 'completed'`.

#### Step 7: Contributor Pulls

**REQUIRE:**
- PR is merged.

**ACTION:**
```bash
cd LOCAL_DIR
dolt checkout main
dolt pull upstream main
dolt branch -d "contribute/<wanted-id>"
```

**ENSURE:**
- Contributor's local main is synced with upstream.
- Branch is cleaned up.
- Contributor can see their stamp in the stamps table.

### 3.2 Pipeline Diagram

```
[Sync]──>[Branch]──>[Mutate]──>[Commit]──>[Push Branch]──>[Open PR]
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │   DoltHub PR       │
                                                    │   CI Checks Run    │
                                                    │   Validator Review  │
                                                    └─────────┬─────────┘
                                                              │
                                              ┌───────────────▼───────────────┐
                                              │  Merge + Stamp + Mark Done    │
                                              └───────────────┬───────────────┘
                                                              │
                                                    [Contributor Pulls]
```

---

## 4. DoltHub PR API

### 4.1 Create a Pull Request

```
POST /api/v1alpha1/<owner>/<repo>/pulls
```

**Request body:**
```json
{
  "title": "Complete: w-abc12345",
  "description": "Completion by alice.\n\nEvidence: https://github.com/org/repo/pull/42",
  "fromBranchOwnerName": "alice-dev",
  "fromBranchRepoName": "wl-commons",
  "fromBranchName": "contribute/w-abc12345",
  "toBranchOwnerName": "hop",
  "toBranchRepoName": "wl-commons",
  "toBranchName": "main"
}
```

**Response:** PR object with `pull_id` and DoltHub URL.

### 4.2 List Pull Requests

```
GET /api/v1alpha1/<owner>/<repo>/pulls
```

Returns all open PRs. Filter by state if the API supports it.

### 4.3 Merge a Pull Request

```
PATCH /api/v1alpha1/<owner>/<repo>/pulls/<pull_id>
```

**Request body:**
```json
{
  "state": "merged"
}
```

**Precondition:** Caller must have write access to the target repository (upstream maintainer).

### 4.4 Branch Naming Convention

| Pattern | Use |
|---------|-----|
| `contribute/<wanted-id>` | Standard completion submission |
| `register-wasteland/<owner>/<db>` | Wasteland federation registration (existing) |
| `register-rig/<handle>` | Future: rig registration via PR |

Branch names are deterministic and parseable. The prefix identifies the operation type. The suffix identifies the target entity.

### 4.5 Conflict Resolution Protocol

**When:** Two contributors submit PRs for the same wanted item.

**Resolution order:**
1. First PR opened has priority.
2. If both are valid, the validator may merge both (competing completions are allowed by spec — Section 5.4).
3. If the wanted item is already `completed` when the second PR is reviewed, the validator stamps the second completion independently or closes the PR.

**Merge conflicts on rows:**
1. Validator pulls upstream main.
2. Validator inspects `dolt conflicts cat <table>`.
3. Validator resolves using `--ours` (keep upstream) or `--theirs` (keep PR) per row.
4. Validator commits resolution: `dolt commit -m "Resolve conflict: <wanted-id>"`.

---

## 5. Trust Gates

### 5.1 Permission Matrix

| Operation | Level 0 (Outsider) | Level 1 (Registered) | Level 2 (Contributor) | Level 3 (Maintainer) |
|-----------|--------------------|---------------------|-----------------------|---------------------|
| Clone/read | Yes | Yes | Yes | Yes |
| Fork | Yes | Yes | Yes | Yes |
| Open PR | No | Yes | Yes | Yes |
| Review PR (comment) | No | No | Yes | Yes |
| Merge PR | No | No | No | Yes |
| Create stamp | No | No | No | Yes |
| Direct push to upstream | No | No | No | Yes (transition period only) |
| Modify trust levels | No | No | No | Yes |

### 5.2 Enforcement Points

**Pre-PR (client-side):**
- The `/wasteland done` command checks `trust_level >= 1` before opening a PR.
- Branch naming is enforced by the command — contributors cannot override the convention.

**Pre-merge (CI):**
- Schema validation: the PR diff contains only valid SQL mutations.
- Yearbook rule: no stamp rows where `author = subject`.
- Duplicate check: no completion with the same `(wanted_id, completed_by)` pair already exists.
- Trust verification: the `completed_by` handle matches a rig with `trust_level >= 1`.
- Wanted item exists and is not `withdrawn`.

**Post-merge (validator):**
- Stamp creation is manual — the validator decides valence, confidence, severity.
- The stamp commit references the completion ID for traceability.

### 5.3 Escalation Path

```
Level 0 ──[register]──> Level 1 ──[earn stamps]──> Level 2 ──[maintainer approval]──> Level 3
```

- **0 → 1:** Automatic on registration (INSERT into rigs).
- **1 → 2:** Requires 3+ stamps with avg quality >= 3.0. Advisory — maintainer reviews and promotes.
- **2 → 3:** Requires sustained contribution record. MUST be manual. Maintainer updates `trust_level` directly.

---

## 6. Migration Plan

### 6.1 Phases

| Phase | Model | Duration | Criteria to Exit |
|-------|-------|----------|-----------------|
| 1 (current) | Direct push | Until Phase 2 ready | PR API integration tested, CI checks deployed |
| 1.5 (transition) | Both models accepted | 2-4 weeks | All active contributors notified and tested on PR flow |
| 2 (target) | PR-only for Level 1-2 | Ongoing | Direct push disabled for non-maintainers |

### 6.2 Transition Period (Phase 1.5)

During the transition:

1. **Direct push still works** for `trust_level >= 3` (maintainers).
2. **New contributors** (`trust_level = 1`) MUST use the PR flow.
3. **Existing contributors** (`trust_level = 2`) SHOULD use PR flow but direct push is accepted.
4. The `/wasteland done` command detects trust level and routes accordingly:
   - Level 1-2: branch + PR flow (Phase 2 behavior).
   - Level 3: offers choice between direct push and PR.

### 6.3 Backward Compatibility

- **Config file:** No changes to `~/.hop/config.json` schema. The PR flow uses existing config fields.
- **Schema:** No schema changes. The PR flow is an operational change, not a data model change.
- **Existing completions:** All Phase 1 completions remain valid. No retroactive migration.
- **Fork structure:** Forks remain. The only change is push target (branch vs. main).

### 6.4 Switchover Criteria

Phase 1.5 ends and Phase 2 begins when ALL of the following are met:

1. PR API integration is implemented and tested in `/wasteland done`.
2. CI checks (schema validation, yearbook rule, duplicate check) are operational.
3. All registered rigs with `trust_level >= 1` have been notified of the change.
4. At least 3 successful PR-based contributions have been completed end-to-end.
5. No regressions in the contributor workflow (measured by completion rate).

### 6.5 Rollback Plan

If Phase 2 causes contributor friction:

1. Re-enable direct push for all trust levels.
2. Keep PR as optional (contributors choose).
3. Investigate friction points and iterate.
4. Rollback is a `_meta` table update: `phase1_mode = 'wild_west'`.

---

## 7. Slash Command Updates

### 7.1 `/wasteland done` — Phase 2 Behavior

**Current (Phase 1):**
```
dolt push origin main
```

**Phase 2:**
```
1. Sync:      dolt pull upstream main
2. Branch:    dolt checkout -b contribute/<wanted-id>
3. Mutate:    INSERT completion + UPDATE wanted status
4. Commit:    dolt commit -m "Complete: <wanted-id>"
5. Push:      dolt push origin contribute/<wanted-id>
6. PR:        POST /api/v1alpha1/<upstream>/pulls
7. Report:    "PR opened: <url>. A validator will review and merge."
```

**Trust-gated routing (Phase 1.5):**
```
IF trust_level >= 3 AND user_preference != 'always_pr':
    → offer choice: "Push directly or open PR?"
    → if direct: Phase 1 behavior
    → if PR: Phase 2 behavior
ELSE:
    → Phase 2 behavior (PR required)
```

### 7.2 `/wasteland claim` — No Change

Claiming continues to push directly to fork main. Claims are low-risk mutations (single UPDATE) and do not require review. A maintainer pulling from the fork sees the claim.

**Rationale:** Adding PR overhead to claims would slow down the workflow without proportional safety benefit. Claims are advisory, not authoritative.

### 7.3 `/wasteland post` — No Change

Posting wanted items continues to push directly to fork main. The poster's fork is the source of truth until the item is pulled upstream.

**Rationale:** Wanted items are proposals. They don't affect the integrity of completions or stamps. The review gate belongs at the completion boundary.

### 7.4 `/wasteland browse` — Minor Update

Add a section showing open PRs if any exist for the current wasteland:

```sql
-- Query open PRs (via API, not SQL)
GET /api/v1alpha1/<upstream-org>/<upstream-db>/pulls?state=open
```

Display as:
```
Open PRs:
  #3  Complete: w-com-005  (by alice, 2h ago)
  #7  Complete: w-com-012  (by bob-agent, 30m ago)
```

---

## 8. Automation — CI Checks on PRs

### 8.1 Check Suite

Each PR triggers the following checks. All MUST pass before merge is allowed.

| Check | What It Validates | Failure Mode |
|-------|-------------------|--------------|
| **Schema validation** | All SQL mutations produce valid rows | Block merge |
| **Yearbook rule** | No stamp rows where `author = subject` | Block merge |
| **Duplicate completion** | No existing completion with same `(wanted_id, completed_by)` | Warn (allow competing completions from different contributors) |
| **Trust level verification** | `completed_by` maps to a rig with `trust_level >= 1` | Block merge |
| **Wanted item exists** | `wanted_id` references a row in the `wanted` table | Block merge |
| **Wanted item not terminal** | `wanted.status` is not `withdrawn` | Block merge |
| **Handle consistency** | `completed_by` matches the PR author's registered handle | Warn |

### 8.2 Schema Validation

Apply the PR's SQL diff to a temporary Dolt database and verify:

```bash
# Clone upstream main to temp dir
TMPDIR=$(mktemp -d)
dolt clone <upstream> "$TMPDIR"
cd "$TMPDIR"

# Apply PR branch changes
dolt pull <pr-source-remote> <pr-branch>

# Verify all tables exist and constraints hold
dolt sql -q "SELECT COUNT(*) FROM completions WHERE wanted_id NOT IN (SELECT id FROM wanted)"
# Expected: 0 (no orphan completions)

dolt sql -q "SELECT COUNT(*) FROM stamps WHERE author = subject"
# Expected: 0 (yearbook rule)
```

### 8.3 Implementation Options

**Option A: DoltHub webhooks + external CI.**
DoltHub fires a webhook on PR creation. An external service (GitHub Actions, a simple HTTP server) runs the checks and posts results back.

**Option B: Dolt SQL procedures.**
Define stored procedures that run validation queries. The validator executes them manually before merging.

**Option C: Local pre-merge script.**
A shell script that the validator runs locally:

```bash
#!/usr/bin/env bash
# validate-pr.sh <upstream> <pr-branch>
set -euo pipefail

UPSTREAM="$1"
BRANCH="$2"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

dolt clone "$UPSTREAM" "$TMPDIR/db"
cd "$TMPDIR/db"
dolt fetch origin "$BRANCH"
dolt merge "origin/$BRANCH" --no-commit

# Yearbook rule
SELF_STAMPS=$(dolt sql -r csv -q "SELECT COUNT(*) as n FROM stamps WHERE author = subject" | tail -1)
if [ "$SELF_STAMPS" != "0" ]; then
  echo "FAIL: Yearbook rule violation — self-stamps detected"
  exit 1
fi

# Orphan completions
ORPHANS=$(dolt sql -r csv -q "SELECT COUNT(*) as n FROM completions WHERE wanted_id NOT IN (SELECT id FROM wanted)" | tail -1)
if [ "$ORPHANS" != "0" ]; then
  echo "FAIL: Orphan completions — wanted_id references nonexistent wanted item"
  exit 1
fi

# Trust level
UNTRUSTED=$(dolt sql -r csv -q "SELECT COUNT(*) as n FROM completions c LEFT JOIN rigs r ON c.completed_by = r.handle WHERE r.trust_level < 1 OR r.handle IS NULL" | tail -1)
if [ "$UNTRUSTED" != "0" ]; then
  echo "FAIL: Completion by unregistered or untrusted rig"
  exit 1
fi

echo "PASS: All checks passed"
```

**Recommendation:** Start with Option C (local script). Migrate to Option A when DoltHub webhook support matures. Option B is a fallback if neither webhook nor external CI is available.

---

## 9. Summary — Verification Matrix

Every pipeline stage mapped to its verification point:

| Stage | Actor | Precondition | Action | Postcondition | Verification |
|-------|-------|-------------|--------|---------------|--------------|
| 1. Branch | Contributor | Synced with upstream | `dolt checkout -b contribute/<wid>` | Branch exists | Branch name matches convention |
| 2. Mutate | Contributor | On correct branch | INSERT completion, UPDATE wanted | Rows added/modified | Completion references valid wanted-id |
| 3. Commit | Contributor | Changes staged | `dolt commit` | Commit on branch | Commit message follows convention |
| 4. Push | Contributor | Commits ahead of main | `dolt push origin <branch>` | Branch on fork | Fork branch exists on DoltHub |
| 5. PR | Contributor | Branch on fork | POST to PR API | PR open on upstream | PR targets upstream main |
| 6. Review | Validator | PR exists, `trust_level >= 2` | Inspect diff | Decision recorded | All CI checks pass |
| 7. Merge | Validator | PR approved, `trust_level >= 3` | PATCH PR state to merged | Upstream main updated | Completion in upstream main |
| 8. Stamp | Validator | PR merged | INSERT stamp, UPDATE completion | Stamp exists | `author != subject`, stamp linked to completion |
| 9. Pull | Contributor | PR merged | `dolt pull upstream main` | Local synced | Contributor sees stamp |

Measure twice. Every stage has a verifiable postcondition.

---

*End of design.*

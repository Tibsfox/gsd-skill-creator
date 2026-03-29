# Branch Infrastructure — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 0 | **Track:** —
**Model Assignment:** Haiku
**Estimated Tokens:** ~6K
**Dependencies:** None (parallel with Shared Types)
**Produces:** `scripts/create-nasa-branch.sh`, `scripts/nasa-push.sh`, `.github/workflows/nasa-sync.yml`, `.gitignore` additions, directory skeleton

---

## Objective

Set up the `nasa` branch infrastructure on gsd-skill-creator: branch creation from main, push.default=nothing enforcement, directory skeleton for all NASA mission series outputs, and the GitHub workflow for sync verification. An agent with only this spec can create the complete branch infrastructure.

## Context

The NASA mission series runs on a dedicated `nasa` branch of `github.com/Tibsfox/gsd-skill-creator`. GSD pipeline discipline requires `push.default=nothing` — mandatory staging discipline. The branch must stay syncable with main throughout 73+ releases spanning months of execution. The directory structure must accommodate all seven pipeline parts, skills, chipsets, educational content, TSPB additions, and retrospectives.

The branch starts at v1.0 (not v0.x) because the first release produces real content, not scaffolding.

## Technical Specification

### Branch Creation Script

```bash
#!/bin/bash
# scripts/create-nasa-branch.sh
# Creates the nasa branch from current main HEAD
# Run once at project start

set -euo pipefail

echo "=== NASA Mission Series: Branch Creation ==="

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create nasa branch
git checkout -b nasa

# Enforce push discipline
git config push.default nothing

# Create directory skeleton
mkdir -p docs/nasa/catalog
mkdir -p docs/nasa/missions
mkdir -p docs/nasa/retrospectives
mkdir -p docs/nasa/release-notes
mkdir -p docs/TSPB
mkdir -p skills/nasa
mkdir -p chipsets/nasa
mkdir -p college/nasa
mkdir -p types
mkdir -p scripts/nasa
mkdir -p .planning/nasa/staging/inbox

# Create placeholder files
echo "# NASA Mission Series" > docs/nasa/README.md
echo "# Mission Catalog" > docs/nasa/catalog/README.md
echo "# The Space Between — Mission Mathematics" > docs/TSPB/README.md

# Initial commit
git add -A
git commit -m "nasa-v0.0: Branch infrastructure and directory skeleton"

echo "=== Branch 'nasa' created. Ready for v1.0. ==="
```

### Push Script

```bash
#!/bin/bash
# scripts/nasa-push.sh
# Explicitly pushes nasa branch (respects push.default=nothing)
# Usage: scripts/nasa-push.sh [tag]

set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "nasa" ]; then
  echo "ERROR: Not on nasa branch (currently on $BRANCH)"
  exit 1
fi

git push origin nasa

if [ -n "${1:-}" ]; then
  echo "Pushing tag: $1"
  git push origin "$1"
fi
```

### Directory Skeleton

```
gsd-skill-creator/ (nasa branch)
├── docs/
│   ├── nasa/
│   │   ├── catalog/
│   │   │   ├── README.md
│   │   │   └── mission-index.json
│   │   ├── missions/
│   │   │   └── [mission-id]/
│   │   │       ├── part-a.md
│   │   │       ├── part-b.md
│   │   │       ├── part-c.md
│   │   │       ├── part-d.md
│   │   │       ├── part-e.md
│   │   │       ├── part-f.md
│   │   │       ├── part-g.md
│   │   │       └── part-h.md
│   │   ├── retrospectives/
│   │   │   └── nasa-v1.X-retrospective.md
│   │   └── release-notes/
│   │       └── nasa-v1.X-release-notes.md
│   └── TSPB/
│       └── [chapter]/
├── skills/
│   └── nasa/
│       └── [skill-name]/
│           └── SKILL.md
├── chipsets/
│   └── nasa/
│       └── [chipset-name].yaml
├── college/
│   └── nasa/
│       └── [department]/
│           └── [module]/
├── types/
│   ├── nasa-mission.ts
│   ├── pipeline-part.ts
│   ├── release-cycle.ts
│   └── retrospective.ts
├── scripts/
│   └── nasa/
│       ├── create-nasa-branch.sh
│       ├── nasa-push.sh
│       ├── nasa-release.sh
│       └── nasa-sync-main.sh
└── .planning/
    └── nasa/
        └── staging/
            └── inbox/
```

### Behavioral Requirements

- `push.default=nothing` must be set on the nasa branch (verified by push script)
- Directory skeleton must not conflict with existing main branch structure
- All scripts must be executable (`chmod +x`)
- Branch creation script is idempotent (safe to re-run)
- No modifications to main branch files during branch creation

## Implementation Steps

1. Write `scripts/create-nasa-branch.sh` with all directory creation
2. Write `scripts/nasa-push.sh` with branch verification
3. Create `.github/workflows/nasa-sync.yml` (CI check that nasa branch is not too far behind main)
4. Test: run branch creation, verify skeleton, verify push.default setting
5. Commit as `nasa-v0.0: Branch infrastructure and directory skeleton`

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| BI-01 | Run create-nasa-branch.sh | nasa branch exists; skeleton complete | All directories present; on nasa branch |
| BI-02 | `git config push.default` on nasa branch | "nothing" | push.default=nothing confirmed |
| BI-03 | Run nasa-push.sh from main branch | Error message | Exit code 1; "Not on nasa branch" |
| BI-04 | Run nasa-push.sh from nasa branch | Push succeeds | Exit code 0 |

## Verification Gate

- [ ] nasa branch exists and is based on main HEAD
- [ ] `git config push.default` returns "nothing" on nasa branch
- [ ] All skeleton directories exist
- [ ] All scripts are executable
- [ ] Initial commit message is `nasa-v0.0: Branch infrastructure and directory skeleton`

## Safety Boundaries

No domain-specific safety boundaries for this component.

# Release Cadence Engine — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 1 | **Track:** A
**Model Assignment:** Sonnet
**Estimated Tokens:** ~20K
**Dependencies:** Component #0 (Shared Types), Component #1 (Branch Infrastructure)
**Produces:** `scripts/nasa/nasa-release.sh`, `skills/nasa/release-manager/SKILL.md`, release note template, version management logic

---

## Objective

Build the release cadence engine that manages the version bump → release notes → git tag → push → main sync cycle for each NASA mission release. The engine produces verbose release notes from the pipeline output, creates properly formatted git tags, and triggers main branch synchronization. Done means: `scripts/nasa/nasa-release.sh nasa-v1.X` produces complete release artifacts and advances the branch.

## Context

The NASA mission series follows a strict release cadence: build → release → retrospect → sync → repeat. Each release is tagged `nasa-v1.X` where X increments per mission. Release notes are verbose and standalone — they document everything built, every skill created, every lesson applied.

GSD push.default=nothing means every push is explicit. The release script handles the explicit push of both the branch and the tag.

Release note template from the research reference (02-research-reference.md, Release Engineering Protocol section) defines the required sections.

## Technical Specification

### Release Script

```bash
#!/bin/bash
# scripts/nasa/nasa-release.sh
# Produces release artifacts and tags the release
# Usage: scripts/nasa/nasa-release.sh <version> <mission-id>
# Example: scripts/nasa/nasa-release.sh 1.5 mercury-freedom-7

set -euo pipefail

VERSION="$1"
MISSION_ID="$2"
TAG="nasa-v${VERSION}"

# Verify on nasa branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "nasa" ] || { echo "ERROR: Not on nasa branch"; exit 1; }

# Verify all pipeline parts complete
for part in a b c d e f g h; do
  [ -f "docs/nasa/missions/${MISSION_ID}/part-${part}.md" ] || \
    { echo "ERROR: Part ${part} not found for ${MISSION_ID}"; exit 1; }
done

# Generate release notes (skill handles content; script handles placement)
NOTES_PATH="docs/nasa/release-notes/nasa-v${VERSION}-release-notes.md"
echo "Release notes: ${NOTES_PATH}"

# Generate retrospective
RETRO_PATH="docs/nasa/retrospectives/nasa-v${VERSION}-retrospective.md"
echo "Retrospective: ${RETRO_PATH}"

# Stage, commit, tag
git add -A
git commit -m "${TAG}: $(head -1 docs/nasa/missions/${MISSION_ID}/part-a.md | sed 's/^# //')"
git tag -a "${TAG}" -m "NASA Mission Series ${TAG}: ${MISSION_ID}"

echo "=== Release ${TAG} created ==="
echo "Run 'scripts/nasa/nasa-push.sh ${TAG}' to push"
echo "Run 'scripts/nasa/nasa-sync-main.sh' to sync with main"
```

### Behavioral Requirements

- Version numbers are strictly sequential (1.0, 1.1, 1.2, ...)
- Release notes must contain all template sections (summary, deliverables, new skills, lessons applied, safety actions, metrics)
- Git tag format: `nasa-v1.X` with annotated tag message
- Commit message format: `nasa-v1.X: [Mission Name from Part A header]`
- Release fails if any pipeline part is missing
- Release notes generated BEFORE the commit (included in the tagged commit)
- Retrospective generated BEFORE the commit (included in the tagged commit)

## Implementation Steps

1. Write `scripts/nasa/nasa-release.sh` with full validation and tagging logic
2. Create `skills/nasa/release-manager/SKILL.md` for release note content generation
3. Create release note markdown template in `skills/nasa/release-manager/templates/`
4. Write version sequence validator (no gaps, no duplicates)
5. Test: simulate release with synthetic pipeline output

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| RC-01 | Complete pipeline output | Release notes at expected path | All template sections present |
| RC-02 | Missing Part D | Release script fails | Exit code 1; error identifies missing part |
| RC-03 | Version "1.5" after "1.4" | Tag `nasa-v1.5` created | Tag exists; points to correct commit |
| RC-04 | Version "1.5" after "1.3" (gap) | Validation warning | Warning logged; release proceeds with note |
| RC-05 | Run from main branch | Script fails | Exit code 1; "Not on nasa branch" |

## Verification Gate

- [ ] Release script validates all 8 parts before proceeding
- [ ] Release notes match template structure
- [ ] Git tag is annotated with correct format
- [ ] Commit message follows format convention
- [ ] Version sequence validation catches gaps

## Safety Boundaries

No domain-specific safety boundaries for this component. (Safety Warden checks content; this component manages release mechanics.)

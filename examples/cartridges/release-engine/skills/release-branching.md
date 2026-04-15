# release-branching

Manage branch and tag hygiene for the release pipeline. Covers dev → main merge strategy, release branches when cadence requires them, tag creation (`v<major>.<minor>.<subminor>`), hotfix branches off the last shipped tag, and the rule that work happens on dev and only verified commits land on main. Enforces the "PRs as work items" pattern.

**Triggers:** `release branch`, `merge to main`, `create tag`, `branch strategy`, `hotfix branch`, `release pr`, `git tag`

**Affinity:** `release-capcom`, `release-engineer`

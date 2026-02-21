#!/usr/bin/env bash
# validate-chipset.sh -- Validate a GSD chipset YAML configuration.
#
# Usage: validate-chipset.sh [chipset-file]
#   Default: .chipset/minecraft-knowledge-world.yaml
#
# Checks:
#   1. File exists and is readable
#   2. Required top-level sections present
#   3. Skill count matches expected (20)
#   4. Token budget sum under 40% ceiling
#   5. Team references valid (skills reference existing teams)
#   6. Routing team references valid
#   7. Agent skill references valid (each agent's skills exist in skills section)
#   8. No duplicate skill names
#   9. Loading order respects dependencies
#
# Exit codes:
#   0 = all checks pass
#   1 = one or more checks failed
#   2 = usage error

set -euo pipefail

CHIPSET_FILE="${1:-.chipset/minecraft-knowledge-world.yaml}"
PASS=0
FAIL=0
WARN=0

# Color output helpers
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN=''
  RED=''
  YELLOW=''
  BOLD=''
  NC=''
fi

pass() {
  PASS=$((PASS + 1))
  printf "${GREEN}PASS${NC}: %s\n" "$1"
}

fail() {
  FAIL=$((FAIL + 1))
  printf "${RED}FAIL${NC}: %s\n" "$1"
}

warn() {
  WARN=$((WARN + 1))
  printf "${YELLOW}WARN${NC}: %s\n" "$1"
}

# ── Check 1: File exists and is readable ──
if [[ ! -f "$CHIPSET_FILE" ]]; then
  fail "Chipset file not found: $CHIPSET_FILE"
  echo ""
  echo "=== Chipset Validation Summary ==="
  echo "PASS: $PASS  FAIL: $FAIL  WARN: $WARN"
  echo "STATUS: FAILED"
  exit 1
fi
pass "Chipset file exists: $CHIPSET_FILE"

# ── Check 2: Required top-level sections ──
REQUIRED_SECTIONS="schema_version chipset skills agents teams routing budget"
MISSING_SECTIONS=""
for section in $REQUIRED_SECTIONS; do
  if ! grep -q "^${section}:" "$CHIPSET_FILE"; then
    MISSING_SECTIONS="$MISSING_SECTIONS $section"
  fi
done

if [[ -z "$MISSING_SECTIONS" ]]; then
  pass "All 7 required top-level sections present"
else
  fail "Missing top-level sections:$MISSING_SECTIONS"
fi

# ── Check 3: Skill count ──
# Count skills within the skills section only (between "^skills:" and "^agents:")
SKILL_COUNT=$(awk '/^skills:/{flag=1;next} /^agents:/{flag=0} flag && /^  - name:/{count++} END{print count+0}' "$CHIPSET_FILE")
if [[ "$SKILL_COUNT" -eq 20 ]]; then
  pass "Skill count is 20"
else
  fail "Skill count is $SKILL_COUNT (expected 20)"
fi

# ── Check 4: Token budget sum under 40% ──
# Extract token_budget values from the skill_budgets section
BUDGET_SUM=$(awk '/^  skill_budgets:/{flag=1;next} /^  team_budgets:/{flag=0} flag && /: "/{gsub(/[^0-9.]/, "", $2); sum+=$2} END{printf "%.1f", sum}' "$CHIPSET_FILE")
CEILING=$(grep 'ceiling_percent:' "$CHIPSET_FILE" | head -1 | awk '{print $2}')

if awk "BEGIN{exit !($BUDGET_SUM < $CEILING)}"; then
  pass "Token budget sum ${BUDGET_SUM}% is under ${CEILING}% ceiling"
else
  fail "Token budget sum ${BUDGET_SUM}% exceeds ${CEILING}% ceiling"
fi

# ── Check 5: Skill team references valid ──
# Extract team names from teams section
TEAM_NAMES=$(awk '/^teams:/{flag=1} /^routing:/{flag=0} flag && /^  - name:/{gsub(/^  - name: /, ""); print}' "$CHIPSET_FILE")

# Extract team references from skills section
SKILL_TEAMS=$(awk '/^skills:/{flag=1} /^agents:/{flag=0} flag && /^    team:/{gsub(/^    team: /, ""); print}' "$CHIPSET_FILE")

INVALID_TEAM_REFS=""
for team_ref in $SKILL_TEAMS; do
  if ! echo "$TEAM_NAMES" | grep -q "^${team_ref}$"; then
    INVALID_TEAM_REFS="$INVALID_TEAM_REFS $team_ref"
  fi
done

if [[ -z "$INVALID_TEAM_REFS" ]]; then
  pass "All skill team references are valid"
else
  fail "Invalid skill team references:$INVALID_TEAM_REFS"
fi

# ── Check 6: Routing team references valid ──
ROUTING_TEAMS=$(awk '/^  rules:/{flag=1} /^  default_team:/{flag=0} flag && /^      team:/{gsub(/^      team: /, ""); print}' "$CHIPSET_FILE")

INVALID_ROUTING_REFS=""
for team_ref in $ROUTING_TEAMS; do
  if ! echo "$TEAM_NAMES" | grep -q "^${team_ref}$"; then
    INVALID_ROUTING_REFS="$INVALID_ROUTING_REFS $team_ref"
  fi
done

if [[ -z "$INVALID_ROUTING_REFS" ]]; then
  pass "All routing team references are valid"
else
  fail "Invalid routing team references:$INVALID_ROUTING_REFS"
fi

# ── Check 7: Agent skill references valid ──
# Extract skill names from skills section
SKILL_NAMES=$(awk '/^skills:/{flag=1} /^agents:/{flag=0} flag && /^  - name:/{gsub(/^  - name: /, ""); print}' "$CHIPSET_FILE")

# Extract agent skill references from agents section
AGENT_SKILLS=$(awk '/^agents:/{flag=1} /^teams:/{flag=0} flag && /^    skills:/{gsub(/^    skills: \[/, ""); gsub(/\]/, ""); gsub(/, /, "\n"); print}' "$CHIPSET_FILE")

INVALID_SKILL_REFS=""
for skill_ref in $AGENT_SKILLS; do
  if ! echo "$SKILL_NAMES" | grep -q "^${skill_ref}$"; then
    INVALID_SKILL_REFS="$INVALID_SKILL_REFS $skill_ref"
  fi
done

if [[ -z "$INVALID_SKILL_REFS" ]]; then
  pass "All agent skill references are valid"
else
  fail "Invalid agent skill references:$INVALID_SKILL_REFS"
fi

# ── Check 8: No duplicate skill names ──
DUPLICATES=$(echo "$SKILL_NAMES" | sort | uniq -d)
if [[ -z "$DUPLICATES" ]]; then
  pass "No duplicate skill names"
else
  fail "Duplicate skill names: $DUPLICATES"
fi

# ── Check 9: Loading order respects dependencies ──
# Extract loading order
LOADING_ORDER=$(awk '/^  loading_order:/{flag=1;next} /^  total_allocated:/{flag=0} flag && /^    - /{gsub(/^    - /, ""); print}' "$CHIPSET_FILE")

# Build a simple dependency check: for each skill in loading order,
# verify that all its dependencies appear before it
DEPENDENCY_VIOLATIONS=""
ORDER_INDEX=0
declare -A LOADED_SKILLS

while IFS= read -r skill; do
  LOADED_SKILLS["$skill"]=$ORDER_INDEX

  # Extract dependencies for this skill
  DEPS=$(awk -v name="$skill" '
    /^skills:/{flag=1}
    /^agents:/{flag=0}
    flag && /^  - name: / && $NF == name {found=1; next}
    found && /^  - name:/{found=0}
    found && /^    dependencies:/{
      gsub(/^    dependencies: \[/, "")
      gsub(/\]/, "")
      gsub(/, /, "\n")
      print
      found=0
    }
  ' "$CHIPSET_FILE")

  for dep in $DEPS; do
    if [[ -z "$dep" ]]; then
      continue
    fi
    if [[ -z "${LOADED_SKILLS[$dep]+x}" ]]; then
      DEPENDENCY_VIOLATIONS="$DEPENDENCY_VIOLATIONS $skill(needs $dep)"
    fi
  done

  ORDER_INDEX=$((ORDER_INDEX + 1))
done <<< "$LOADING_ORDER"

if [[ -z "$DEPENDENCY_VIOLATIONS" ]]; then
  pass "Loading order respects all dependencies"
else
  fail "Loading order violations:$DEPENDENCY_VIOLATIONS"
fi

# ── Summary ──
echo ""
echo "=== Chipset Validation Summary ==="
echo "PASS: $PASS  FAIL: $FAIL  WARN: $WARN"
if [[ $FAIL -gt 0 ]]; then
  echo "STATUS: FAILED"
  exit 1
else
  echo "STATUS: PASSED"
  exit 0
fi

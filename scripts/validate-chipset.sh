#!/usr/bin/env bash
# validate-chipset.sh -- Validate ASIC chipset.yaml internal consistency
# Usage: ./scripts/validate-chipset.sh [path/to/chipset.yaml]
#
# Validates:
#   1. YAML syntax
#   2. Required top-level keys
#   3. Skill source paths exist
#   4. Agent skill references resolve
#   5. Team member references resolve
#   6. Crew config paths exist (warns if Phase 316/317 not yet executed)
#   7. Bus loop config paths exist (warns if Phase 317 not yet executed)
#   8. Budget ceiling not exceeded

set -euo pipefail

CHIPSET_PATH="${1:-.chipset/openstack-nasa-se/chipset.yaml}"
PASS=0
FAIL=0
WARN=0

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}: $1"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}FAIL${NC}: $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "${YELLOW}WARN${NC}: $1"; WARN=$((WARN + 1)); }

echo "=========================================="
echo "  Chipset Validation: ${CHIPSET_PATH}"
echo "=========================================="
echo ""

# 1. File exists and parses
if [ ! -f "$CHIPSET_PATH" ]; then
  fail "Chipset file not found: $CHIPSET_PATH"
  echo ""
  echo "Results: $PASS passed, $FAIL failed, $WARN warnings"
  exit 1
fi

python3 -c "import yaml; yaml.safe_load(open('$CHIPSET_PATH'))" 2>/dev/null
if [ $? -eq 0 ]; then
  pass "YAML syntax valid"
else
  fail "YAML syntax invalid"
  exit 1
fi

# 2-8. Use Python for structured validation
export CHIPSET_PATH
python3 << 'PYEOF'
import yaml
import os
import sys

chipset_path = os.environ.get("CHIPSET_PATH", ".chipset/openstack-nasa-se/chipset.yaml")

with open(chipset_path) as f:
    chipset = yaml.safe_load(f)

passes = 0
fails = 0
warns = 0

def ok(msg):
    global passes
    print(f"\033[0;32mPASS\033[0m: {msg}")
    passes += 1

def bad(msg):
    global fails
    print(f"\033[0;31mFAIL\033[0m: {msg}")
    fails += 1

def warning(msg):
    global warns
    print(f"\033[0;33mWARN\033[0m: {msg}")
    warns += 1

# Required top-level keys
print("\n--- Required Keys ---")
required_keys = ["schema_version", "chipset", "skills", "agents", "teams", "routing", "budget"]
for key in required_keys:
    if key in chipset:
        ok(f"Top-level key '{key}' present")
    else:
        bad(f"Top-level key '{key}' missing")

# Skill source paths
print("\n--- Skill Source Paths ---")
skill_names = set()
for skill in chipset.get("skills", []):
    name = skill.get("name", "unknown")
    source = skill.get("source", "")
    skill_names.add(name)
    if os.path.exists(source):
        ok(f"Skill '{name}' source exists: {source}")
    else:
        bad(f"Skill '{name}' source NOT FOUND: {source}")

print(f"\n  Total skills: {len(skill_names)}")

# Agent skill references
print("\n--- Agent Skill References ---")
agent_names = set()
for agent in chipset.get("agents", []):
    aname = agent.get("name", "unknown")
    agent_names.add(aname)
    for skill_ref in agent.get("skills", []):
        if skill_ref in skill_names:
            ok(f"Agent '{aname}' skill '{skill_ref}' resolves")
        else:
            bad(f"Agent '{aname}' references undefined skill '{skill_ref}'")

print(f"\n  Total agents: {len(agent_names)}")

# Team member references
print("\n--- Team Member References ---")
for team in chipset.get("teams", []):
    tname = team.get("name", "unknown")
    for member in team.get("members", []):
        if member in agent_names:
            ok(f"Team '{tname}' member '{member}' resolves")
        else:
            bad(f"Team '{tname}' references undefined agent '{member}'")

# Crew config paths
print("\n--- Crew Config Paths ---")
for crew_name, crew_path in chipset.get("crews", {}).items():
    if os.path.exists(crew_path):
        ok(f"Crew config '{crew_name}' exists: {crew_path}")
    else:
        warning(f"Crew config '{crew_name}' not yet created: {crew_path} (expected from Phase 316/317)")

# Bus loop config paths
print("\n--- Communication Loop Paths ---")
comm = chipset.get("communication", {})
for loop in comm.get("loops", []):
    lname = loop.get("name", "unknown")
    config = loop.get("config", "")
    if os.path.exists(config):
        ok(f"Loop '{lname}' config exists: {config}")
    else:
        warning(f"Loop '{lname}' config not yet created: {config} (expected from Phase 317)")

for extra in ["arbitration", "halt"]:
    path = comm.get(extra, "")
    if path and os.path.exists(path):
        ok(f"Bus '{extra}' config exists: {path}")
    elif path:
        warning(f"Bus '{extra}' config not yet created: {path} (expected from Phase 317)")

# Budget validation
print("\n--- Budget Validation ---")
budget = chipset.get("budget", {})
ceiling = budget.get("ceiling_percent", 0)
total_str = budget.get("total_allocated", "0%")
total = float(total_str.replace("%", ""))
if total <= ceiling:
    ok(f"Total allocated ({total_str}) within ceiling ({ceiling}%)")
else:
    bad(f"Total allocated ({total_str}) EXCEEDS ceiling ({ceiling}%)")

# Summary
print("\n==========================================")
print(f"  Results: {passes} passed, {fails} failed, {warns} warnings")
print("==========================================")

if fails > 0:
    sys.exit(1)
else:
    sys.exit(0)
PYEOF

RESULT=$?

echo ""
if [ $RESULT -eq 0 ]; then
  echo "Chipset validation: PASSED (warnings may exist for Phase 316/317 artifacts not yet created)"
else
  echo "Chipset validation: FAILED -- fix errors above"
fi

exit $RESULT

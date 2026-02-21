#!/usr/bin/env bash
# validate-world-layout.sh -- Validate Knowledge World layout constraints
#
# Checks: file existence, YAML syntax, district completeness, coordinate
# non-overlap, walking distance constraint, palette uniqueness, path coverage,
# and cross-reference consistency between master plan, palettes, and wayfinding.
#
# Usage: validate-world-layout.sh [--verbose] [--yaml-dir <path>] [--help]
#
# Exit codes: 0=all pass, 1=any failure, 2=missing dependencies

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_YAML_DIR="${SCRIPT_DIR}/../minecraft/world-design"
YAML_DIR="${DEFAULT_YAML_DIR}"
VERBOSE=false

CHECKS_RUN=0
CHECKS_PASSED=0
CHECKS_FAILED=0
FAILURES=()

REQUIRED_DISTRICTS=(hardware software network creative community workshop)

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: validate-world-layout.sh [OPTIONS]

Validate Knowledge World layout YAML files for consistency and constraints.

Options:
  --verbose       Print detailed output for each check
  --yaml-dir DIR  Path to YAML directory (default: ../minecraft/world-design/)
  --help          Show this help message

Exit codes:
  0  All checks passed
  1  One or more checks failed
  2  Missing dependencies (python3 or yaml module)
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose) VERBOSE=true; shift ;;
        --yaml-dir) YAML_DIR="$2"; shift 2 ;;
        --help) usage; exit 0 ;;
        *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------

if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: python3 is required but not found"
    exit 2
fi

if ! python3 -c "import yaml" 2>/dev/null; then
    echo "ERROR: python3 yaml module is required but not installed"
    echo "  Install with: pip3 install pyyaml"
    exit 2
fi

# ---------------------------------------------------------------------------
# Check helpers
# ---------------------------------------------------------------------------

check_pass() {
    local desc="$1"
    CHECKS_RUN=$(( CHECKS_RUN + 1 ))
    CHECKS_PASSED=$(( CHECKS_PASSED + 1 ))
    if [[ "${VERBOSE}" == "true" ]]; then
        printf "  PASS: %s\n" "${desc}"
    fi
}

check_fail() {
    local desc="$1"
    local detail="${2:-}"
    CHECKS_RUN=$(( CHECKS_RUN + 1 ))
    CHECKS_FAILED=$(( CHECKS_FAILED + 1 ))
    FAILURES+=("${desc}")
    printf "  FAIL: %s\n" "${desc}"
    if [[ -n "${detail}" && "${VERBOSE}" == "true" ]]; then
        printf "        %s\n" "${detail}"
    fi
}

# ---------------------------------------------------------------------------
# 1. File existence checks (5 checks)
# ---------------------------------------------------------------------------

echo "=== File Existence ==="

YAML_FILES=(
    "world-master-plan.yaml"
    "district-palettes.yaml"
    "wayfinding-system.yaml"
    "sign-standards.yaml"
    "README.md"
)

for f in "${YAML_FILES[@]}"; do
    if [[ -f "${YAML_DIR}/${f}" ]]; then
        check_pass "File exists: ${f}"
    else
        check_fail "File exists: ${f}" "Not found at ${YAML_DIR}/${f}"
    fi
done

# ---------------------------------------------------------------------------
# 2. YAML syntax checks (4 checks -- README is markdown, not YAML)
# ---------------------------------------------------------------------------

echo "=== YAML Syntax ==="

PARSEABLE_FILES=(
    "world-master-plan.yaml"
    "district-palettes.yaml"
    "wayfinding-system.yaml"
    "sign-standards.yaml"
)

for f in "${PARSEABLE_FILES[@]}"; do
    filepath="${YAML_DIR}/${f}"
    if [[ ! -f "${filepath}" ]]; then
        check_fail "YAML parse: ${f}" "File not found"
        continue
    fi
    if python3 -c "import yaml; yaml.safe_load(open('${filepath}'))" 2>/dev/null; then
        check_pass "YAML parse: ${f}"
    else
        check_fail "YAML parse: ${f}" "Failed to parse as YAML"
    fi
done

# ---------------------------------------------------------------------------
# 3. District completeness checks (6 checks)
# ---------------------------------------------------------------------------

echo "=== District Completeness ==="

MASTER_PLAN="${YAML_DIR}/world-master-plan.yaml"

if [[ -f "${MASTER_PLAN}" ]]; then
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        found=$(python3 -c "
import yaml
data = yaml.safe_load(open('${MASTER_PLAN}'))
ids = [d['district_id'] for d in data.get('districts', [])]
print('yes' if '${district_id}' in ids else 'no')
" 2>/dev/null || echo "error")
        if [[ "${found}" == "yes" ]]; then
            check_pass "District present: ${district_id}"
        else
            check_fail "District present: ${district_id}" "Not found in master plan"
        fi
    done
else
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        check_fail "District present: ${district_id}" "Master plan file missing"
    done
fi

# ---------------------------------------------------------------------------
# 4. Coordinate non-overlap checks (15 checks -- 6 choose 2)
# ---------------------------------------------------------------------------

echo "=== Coordinate Non-Overlap ==="

if [[ -f "${MASTER_PLAN}" ]]; then
    overlap_results=$(python3 -c "
import yaml

data = yaml.safe_load(open('${MASTER_PLAN}'))
districts = data.get('districts', [])
results = []

for i in range(len(districts)):
    for j in range(i + 1, len(districts)):
        a = districts[i]
        b = districts[j]
        ab = a['bounds']
        bb = b['bounds']

        # Overlap exists when ranges overlap on BOTH axes
        overlap_x = not (ab['max']['x'] < bb['min']['x'] or ab['min']['x'] > bb['max']['x'])
        overlap_z = not (ab['max']['z'] < bb['min']['z'] or ab['min']['z'] > bb['max']['z'])

        a_id = a['district_id']
        b_id = b['district_id']

        if overlap_x and overlap_z:
            results.append(f'FAIL:{a_id}-vs-{b_id}:Bounding boxes overlap')
        else:
            results.append(f'PASS:{a_id}-vs-{b_id}:No overlap')

for r in results:
    print(r)
" 2>/dev/null)

    while IFS= read -r line; do
        status="${line%%:*}"
        rest="${line#*:}"
        pair="${rest%%:*}"
        detail="${rest#*:}"
        if [[ "${status}" == "PASS" ]]; then
            check_pass "Non-overlap: ${pair}"
        else
            check_fail "Non-overlap: ${pair}" "${detail}"
        fi
    done <<< "${overlap_results}"
else
    # Generate all 15 pairs and fail each
    for (( i=0; i<${#REQUIRED_DISTRICTS[@]}; i++ )); do
        for (( j=i+1; j<${#REQUIRED_DISTRICTS[@]}; j++ )); do
            check_fail "Non-overlap: ${REQUIRED_DISTRICTS[i]}-vs-${REQUIRED_DISTRICTS[j]}" "Master plan missing"
        done
    done
fi

# ---------------------------------------------------------------------------
# 5. Walking distance constraint checks (6 checks)
# ---------------------------------------------------------------------------

echo "=== Walking Distance Constraint ==="

MAX_WALK_BLOCKS=518

if [[ -f "${MASTER_PLAN}" ]]; then
    distance_results=$(python3 -c "
import yaml, math

data = yaml.safe_load(open('${MASTER_PLAN}'))
districts = data.get('districts', [])
max_blocks = ${MAX_WALK_BLOCKS}
speed = 4.317

for d in districts:
    ent = d['entrance']
    # Euclidean distance from spawn (0, 0) to entrance (x, z)
    dist = math.sqrt(ent['x'] ** 2 + ent.get('z', ent.get('y', 0)) ** 2)
    # entrance format is {x, y, z} -- we need x and z
    # Actually entrance has x, y, z -- use x and z
    ex = ent['x']
    # z might be stored differently if y=64 is in between
    # Parse all keys
    ez = 0
    if 'z' in ent:
        ez = ent['z']
    dist = math.sqrt(ex ** 2 + ez ** 2)
    walk_time = dist / speed
    did = d['district_id']
    if dist <= max_blocks:
        print(f'PASS:{did}:{dist:.0f} blocks ({walk_time:.0f}s)')
    else:
        print(f'FAIL:{did}:{dist:.0f} blocks ({walk_time:.0f}s) exceeds {max_blocks}')
" 2>/dev/null)

    while IFS= read -r line; do
        status="${line%%:*}"
        rest="${line#*:}"
        did="${rest%%:*}"
        detail="${rest#*:}"
        if [[ "${status}" == "PASS" ]]; then
            check_pass "Distance: ${did} -- ${detail}"
        else
            check_fail "Distance: ${did} -- ${detail}"
        fi
    done <<< "${distance_results}"
else
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        check_fail "Distance: ${district_id}" "Master plan missing"
    done
fi

# ---------------------------------------------------------------------------
# 6. Palette uniqueness checks (6 checks)
# ---------------------------------------------------------------------------

echo "=== Palette Uniqueness ==="

PALETTES="${YAML_DIR}/district-palettes.yaml"

if [[ -f "${PALETTES}" ]]; then
    palette_results=$(python3 -c "
import yaml

data = yaml.safe_load(open('${PALETTES}'))
palettes = data.get('palettes', {})
families = {}

for did, pal in palettes.items():
    cf = pal.get('color_family', '')
    if cf in families.values():
        # Find which district has this family already
        dup = [k for k, v in families.items() if v == cf][0]
        print(f'FAIL:{did}:Duplicates color_family of {dup}: {cf}')
    else:
        print(f'PASS:{did}:Unique color_family: {cf}')
    families[did] = cf
" 2>/dev/null)

    while IFS= read -r line; do
        status="${line%%:*}"
        rest="${line#*:}"
        did="${rest%%:*}"
        detail="${rest#*:}"
        if [[ "${status}" == "PASS" ]]; then
            check_pass "Palette unique: ${did} -- ${detail}"
        else
            check_fail "Palette unique: ${did}" "${detail}"
        fi
    done <<< "${palette_results}"
else
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        check_fail "Palette unique: ${district_id}" "Palettes file missing"
    done
fi

# ---------------------------------------------------------------------------
# 7. Path coverage checks (6 checks)
# ---------------------------------------------------------------------------

echo "=== Path Coverage ==="

WAYFINDING="${YAML_DIR}/wayfinding-system.yaml"

if [[ -f "${WAYFINDING}" ]]; then
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        found=$(python3 -c "
import yaml

data = yaml.safe_load(open('${WAYFINDING}'))
paths = data.get('paths', [])
path_ids = [p['path_id'] for p in paths]

# Check if there is a path from spawn to this district
target = 'spawn-to-${district_id}'
print('yes' if target in path_ids else 'no')
" 2>/dev/null || echo "error")
        if [[ "${found}" == "yes" ]]; then
            check_pass "Path coverage: spawn-to-${district_id}"
        else
            check_fail "Path coverage: spawn-to-${district_id}" "No path found in wayfinding system"
        fi
    done
else
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        check_fail "Path coverage: spawn-to-${district_id}" "Wayfinding file missing"
    done
fi

# ---------------------------------------------------------------------------
# 8. Cross-reference district IDs (6 checks)
# ---------------------------------------------------------------------------

echo "=== Cross-Reference: Master Plan <-> Palettes ==="

if [[ -f "${MASTER_PLAN}" && -f "${PALETTES}" ]]; then
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        found=$(python3 -c "
import yaml

mp = yaml.safe_load(open('${MASTER_PLAN}'))
pal = yaml.safe_load(open('${PALETTES}'))

mp_ids = [d['district_id'] for d in mp.get('districts', [])]
pal_ids = list(pal.get('palettes', {}).keys())

in_mp = '${district_id}' in mp_ids
in_pal = '${district_id}' in pal_ids

if in_mp and in_pal:
    print('yes')
elif in_mp and not in_pal:
    print('no:missing from palettes')
elif not in_mp and in_pal:
    print('no:missing from master plan')
else:
    print('no:missing from both')
" 2>/dev/null || echo "error")
        if [[ "${found}" == "yes" ]]; then
            check_pass "Cross-ref: ${district_id} in both master plan and palettes"
        else
            detail="${found#no:}"
            check_fail "Cross-ref: ${district_id}" "${detail}"
        fi
    done
else
    for district_id in "${REQUIRED_DISTRICTS[@]}"; do
        check_fail "Cross-ref: ${district_id}" "One or both files missing"
    done
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "==========================================="
echo "  Validation Summary"
echo "==========================================="
echo "  Total:  ${CHECKS_RUN}"
echo "  Passed: ${CHECKS_PASSED}"
echo "  Failed: ${CHECKS_FAILED}"
echo "==========================================="

if [[ ${CHECKS_FAILED} -gt 0 ]]; then
    echo ""
    echo "Failures:"
    for f in "${FAILURES[@]}"; do
        echo "  - ${f}"
    done
    exit 1
fi

echo ""
echo "All checks passed."
exit 0

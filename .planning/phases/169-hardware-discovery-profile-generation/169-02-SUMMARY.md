---
phase: 169-hardware-discovery-profile-generation
plan: 02
subsystem: infra
tags: [bash, resource-budget, yaml, tdd, vm-allocation, integer-arithmetic]

requires:
  - phase: 169-01
    provides: "Hardware discovery script generating hardware-values.yaml and hardware-profile.yaml"
provides:
  - "Resource budget calculator (calculate-budget.sh) for VM allocation planning"
  - "Test suite with 47 assertions across 6 test groups"
  - "4 fixture YAML profiles for deterministic hardware testing"
  - "Runtime-generated resource-budget.yaml with host/VM/Minecraft allocations"
affects:
  - "172 (VM provisioning reads resource-budget.yaml for allocation limits)"
  - "173 (Minecraft server deployment uses minecraft_vm allocation)"
  - "Any future VM creation consults unallocated pool"

tech-stack:
  added: []
  patterns: [fixture-based-testing, section-aware-yaml-parsing, multi-format-fallback, integer-budget-arithmetic]

key-files:
  created:
    - infra/scripts/calculate-budget.sh
    - infra/tests/test-calculate-budget.sh
    - infra/tests/fixtures/profile-64gb.yaml
    - infra/tests/fixtures/profile-32gb.yaml
    - infra/tests/fixtures/profile-16gb.yaml
    - infra/tests/fixtures/profile-8gb-novirt.yaml
  modified: []

key-decisions:
  - "Integer-only arithmetic in bash -- no floating point, all GB/core values are integers"
  - "Three-tier classification: minimal (16GB), comfortable (32GB), generous (64GB+)"
  - "Minecraft VM capped at 16GB RAM and 8 cores regardless of available resources"
  - "Multi-format YAML parsing: cpu section -> capabilities section -> companion profile fallback"
  - "Test helper returns all matches (not head -1) enabling positional extraction for repeated YAML keys"

patterns-established:
  - "Fixture-based testing: deterministic YAML profiles in tests/fixtures/ for reproducible results"
  - "Section-aware YAML parsing: awk-based parser tracks current section to distinguish repeated keys"
  - "Companion profile fallback: local-values format resolves missing fields from sanitized profile"
  - "Non-negotiable host floor: 4GB RAM + 2 cores reserved before any VM allocation"

requirements-completed: []

duration: 5min
completed: 2026-02-18
---

# Phase 169 Plan 02: Resource Budget Calculator Summary

**TDD-driven bash resource budget calculator with 47-assertion test suite, fixture-based testing across 4 hardware tiers, and multi-format YAML parsing with companion profile fallback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T02:12:50Z
- **Completed:** 2026-02-18T02:18:13Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 6

## Accomplishments

- 258-line resource budget calculator reads hardware profiles and computes VM allocations with guaranteed host OS reservation
- 373-line test suite with 47 assertions covering 64GB, 32GB, 16GB viable scenarios and 8GB/no-virt rejection
- 4 fixture YAML profiles for deterministic testing across minimal, comfortable, generous, and rejected tiers
- Multi-format YAML support: works with both sanitized profiles and local hardware-values.yaml (companion profile fallback)
- Calculator verified against actual system hardware (60GB i7-6700K workstation)

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests and fixtures** - `305d615` (test) -- 47 assertions, all failing (calculator not yet implemented)
2. **Task 2 (GREEN): Calculator implementation** - `7d633d3` (feat) -- all 47 tests passing

## Files Created/Modified

- `infra/scripts/calculate-budget.sh` - Resource budget calculator (258 lines)
- `infra/tests/test-calculate-budget.sh` - Test suite with 47 assertions across 6 test groups (373 lines)
- `infra/tests/fixtures/profile-64gb.yaml` - Generous tier fixture (16 cores, 64GB RAM)
- `infra/tests/fixtures/profile-32gb.yaml` - Comfortable tier fixture (8 cores, 32GB RAM)
- `infra/tests/fixtures/profile-16gb.yaml` - Minimal tier fixture (4 cores, 16GB RAM)
- `infra/tests/fixtures/profile-8gb-novirt.yaml` - Below-minimum fixture (2 cores, 8GB, no virtualization)

## Decisions Made

- **Integer-only arithmetic:** Bash does not support floating point. All calculations use integer division (GB and core counts are naturally integers for VM allocation).
- **Multi-format YAML parsing:** Calculator supports both sanitized profile format (with `virtualization:` in cpu section) and local values format (without it). Falls back to capabilities section, then companion sanitized profile in `../inventory/`.
- **Three tiers:** minimal/comfortable/generous classification helps downstream phases adapt their configuration complexity.
- **50% allocation rule:** Minecraft VM gets at most half of available resources, capped at 16GB/8cores, ensuring headroom for future VMs.
- **Test helper fix:** yaml_val returns all matches (not just first) to support positional extraction of repeated YAML keys like `ram_gb` appearing in multiple sections.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed yaml_val test helper returning only first match**
- **Found during:** Task 2 (GREEN -- first test run)
- **Issue:** Test helper used `head -1` in pipeline, causing `sed -n '2p'` through `sed -n '4p'` to always return empty
- **Fix:** Removed `head -1` from yaml_val, allowing all matches to be returned for positional extraction
- **Files modified:** infra/tests/test-calculate-budget.sh
- **Verification:** All 47 assertions now correctly extract values from the correct YAML sections
- **Committed in:** 7d633d3 (GREEN commit)

**2. [Rule 3 - Blocking] Fixed pipefail causing silent exit on yaml_get grep failure**
- **Found during:** Task 2 (real hardware verification)
- **Issue:** With `set -euo pipefail`, grep returning exit 1 (no match) in yaml_get pipeline caused script to exit silently when virtualization field was missing from local hardware-values.yaml
- **Fix:** Rewrote yaml_get to capture grep output with `|| true` before piping through sed transforms; added fallback chain: capabilities section -> companion sanitized profile
- **Files modified:** infra/scripts/calculate-budget.sh
- **Verification:** Calculator successfully processes real hardware-values.yaml using companion profile fallback
- **Committed in:** 7d633d3 (GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for correctness. No scope creep. Multi-format support makes calculator more robust for real-world use.

## Issues Encountered

None beyond the auto-fixed deviations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 169 is fully complete (both plans 01 and 02 delivered)
- Hardware discovery + resource budget pipeline ready for downstream consumption
- Run `bash infra/scripts/discover-hardware.sh` then `bash infra/scripts/calculate-budget.sh infra/local/hardware-values.yaml` to generate full allocation profile
- Phase 172 (VM provisioning) can read `infra/local/resource-budget.yaml` for VM sizing
- Phase 173 (Minecraft server) can read `minecraft_vm` section for allocation limits

## Self-Check: PASSED

All 6 created files verified present. Both commit hashes (305d615, 7d633d3) verified in git log. Calculator: 258 lines (min 80). Test suite: 373 lines (min 60). All 4 fixture files contain required `total_gb` values.

---
*Phase: 169-hardware-discovery-profile-generation*
*Completed: 2026-02-18*

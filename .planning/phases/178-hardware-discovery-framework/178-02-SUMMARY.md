---
phase: 178-hardware-discovery-framework
plan: 02
subsystem: platform
tags: [bash, distro, orchestrator, yaml, discovery, dnf, apt, pacman, firewall, selinux, apparmor]

requires:
  - "infra/scripts/lib/discovery-common.sh (shared YAML emission library from 178-01)"
  - "infra/scripts/discover-audio.sh (audio module from 178-01)"
  - "infra/scripts/discover-network.sh (network module from 178-01)"
  - "infra/scripts/discover-usb.sh (USB module from 178-01)"
  - "infra/scripts/discover-hardware.sh (base discovery from Phase 169)"
provides:
  - "Distribution detection with package manager, firewall, init system, and tier classification"
  - "Unified discovery orchestrator merging all 9 subsystems into single YAML"
  - "Sanitized hardware-capabilities.yaml (git-safe) and local variant (with MACs/IPs)"
  - "Complete example YAML documenting schema for downstream consumers"
affects:
  - "Phase 179 (distro abstraction reads distro section for package manager mapping)"
  - "Phase 180 (hypervisor abstraction reads hypervisor + GPU for VM configuration)"
  - "Phase 181 (hardware adaptation engine reads all sections for adaptive config)"
  - "Phase 182 (UAE installation reads audio + distro for Amiga emulation setup)"

tech-stack:
  added: [getenforce, aa-status, firewall-cmd, ufw, nft]
  patterns: [unified-orchestrator, dual-yaml-output, tier-classification, inline-fallback]

key-files:
  created:
    - infra/scripts/discover-distro.sh
    - infra/scripts/discover-all.sh
    - infra/inventory/hardware-capabilities.example.yaml
  modified: []

key-decisions:
  - decision: "Orchestrator uses inline fallback when discover-hardware.sh is absent"
    rationale: "Self-contained operation regardless of Phase 169 execution order"
  - decision: "Unified capabilities section aggregates flags from all modules"
    rationale: "Single boolean lookup for downstream feature gating (e.g., has_audio_output)"
  - decision: "Tier classification: Tier 1 = CentOS 9/Fedora 39+/Ubuntu 22.04+, Tier 2 = Debian 12+/Rocky/Alma/Arch, Tier 3 = everything else"
    rationale: "Matches project target platforms from PLAT-02 requirements"
  - decision: "SELinux and AppArmor reported as separate security subsection"
    rationale: "Both can coexist conceptually; downstream needs to know which is active"

patterns-established:
  - "Orchestrator pattern: call module scripts, capture YAML, merge with metadata"
  - "Dual-output pattern: sanitized (git-safe) + local (provisioning) from single run"
  - "Inline fallback: self-contained discovery when dependencies missing"

requirements-completed: []
duration: 5 min
completed: 2026-02-18
---

# Phase 178 Plan 02: Distribution Detection + Unified Discovery Orchestrator Summary

**Distribution detection module with tier classification and package manager mapping, plus unified orchestrator merging 9 subsystems (CPU, memory, storage, GPU, hypervisor, audio, network, USB, distro) into a comprehensive YAML capability database.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T02:12:55Z
- **Completed:** 2026-02-18T02:18:51Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Distribution detection module identifies distro, maps to package manager (dnf/apt/pacman/zypper), detects active firewall, classifies support tier 1-3, reports SELinux/AppArmor
- Unified orchestrator calls all 5 discovery modules (base + audio + network + USB + distro) and merges into single comprehensive YAML
- Dual-output: sanitized hardware-capabilities.yaml (no MACs/serials/hostnames) and local variant with full values
- Unified capabilities section with 13 boolean flags for downstream feature gating
- Self-contained: works both with and without Phase 169's discover-hardware.sh via inline fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create distribution detection module** - `4999e97` (feat)
2. **Task 2: Create unified discovery orchestrator and example output** - `71f002f` (feat)

## Files Created/Modified

- `infra/scripts/discover-distro.sh` - Distribution detection: /etc/os-release parsing, package manager mapping, firewall detection, tier classification, SELinux/AppArmor
- `infra/scripts/discover-all.sh` - Unified orchestrator: calls all modules, merges YAML, generates sanitized + local output
- `infra/inventory/hardware-capabilities.example.yaml` - Complete example YAML documenting all 11 sections with comments explaining downstream consumers

## Decisions Made

- Orchestrator uses inline discovery as fallback when discover-hardware.sh is absent (self-contained regardless of execution order)
- Unified capabilities section aggregates 13 flags from all modules for single-lookup feature gating
- Tier classification: CentOS 9 / Fedora 39+ / Ubuntu 22.04+ = Tier 1 (tested), Debian 12+ / Rocky 9 / Alma 9 / Arch = Tier 2 (expected), everything else = Tier 3 (untested)
- SELinux and AppArmor reported in separate security subsection (both can be present)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed awk section extraction producing duplicate YAML headers**
- **Found during:** Task 2 (unified orchestrator assembly)
- **Issue:** awk extraction from discover-hardware.sh output was printing the next section's header line before exiting, causing duplicate keys (e.g., `memory:` appeared twice)
- **Fix:** Restructured awk to check for next top-level key before printing, ensuring clean section boundaries
- **Files modified:** infra/scripts/discover-all.sh
- **Verification:** YAML validates with no duplicate top-level keys, all 11 sections unique
- **Committed in:** 71f002f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for valid YAML output. No scope creep.

## Issues Encountered

None beyond the awk extraction bug documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 178 (Hardware Discovery Framework) fully complete -- all plans executed
- Downstream phases can read `infra/inventory/hardware-capabilities.yaml` for all subsystem data
- Phase 179 (Distribution Abstraction) can use the distro section for package manager mapping
- Phase 180 (Hypervisor Abstraction) can use hypervisor + GPU sections for VM configuration
- Phase 181 (Hardware Adaptation Engine) has the complete capability database it needs
- No blockers for Wave 2 execution

## Self-Check: PASSED

All 3 created files verified present. Both commit hashes (4999e97, 71f002f) verified in git log. All scripts pass bash -n syntax check and produce valid YAML on current machine.

---
*Phase: 178-hardware-discovery-framework*
*Completed: 2026-02-18*

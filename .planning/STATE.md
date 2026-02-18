# State: GSD Skill Creator

## Current Position

Phase: 173-server-foundation (Wave 3 in progress)
Plan: 173-01 complete, 173-02 pending
Status: Executing Wave 3 -- Phase 173 Plan 01 complete (Minecraft deployment orchestrator + templates)
Last activity: 2026-02-18 — Completed 173-01-PLAN.md

Progress: [########..................] 8/30 phases (Wave 1: 169, 170, 178; Wave 2: 171, 172, 179, 180, 181 -- all complete; Wave 3: 173 in progress)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible
**Current focus:** v1.22 Minecraft Knowledge World -- Wave 3 execution (Phase 173 in progress)

## Current Milestone

**v1.22 Minecraft Knowledge World**
- 30 phases (169-198), 73 requirements, 6 execution waves
- 7 plans: Infrastructure, Minecraft Server, Platform Portability, Amiga Emulation, Knowledge World Design, Skill-Creator Integration, Operations
- Parallelization enabled (wave-based execution)
- Comprehensive depth, quality model profile (opus executors), yolo mode

## Next Actions

1. Execute 173-02-PLAN.md (remaining plan in Phase 173)
2. Continue Wave 3 execution: 174, 175, 176, 177 (Minecraft Server), 182, 183 (Amiga)
3. Wave 3 in progress -- 173-01 and 182-01 complete

## Decisions

### From Phase 169 Plan 01
- Sanitized profile excludes MACs, serials, hostnames, PCI slot addresses -- only capability flags and family names
- Dual YAML output: sanitized (git-safe) and local (gitignored) from single script run
- Minimum requirements threshold: 16GB RAM + CPU virtualization support
- Runtime-generated hardware-profile.yaml not committed -- example file documents structure instead
- [Phase 182]: Three-tier install strategy: detect existing -> native pkg manager -> Flatpak fallback
- [Phase 182]: Flatpak wrapper at ~/.local/bin/fs-uae for transparent command access on dnf systems
- [Phase 182]: AROS ROM URLs configurable via AROS_ROM_URL and AROS_SYSTEM_URL env vars for mirror flexibility
- [Phase 182]: Base config uses {ROM_DIR}/{DATA_DIR} placeholder tokens for render-step substitution in Plan 02
- [Phase 182]: A1200 model with AGA chipset selected for best AROS compatibility

### From Phase 169 Plan 02
- Integer-only arithmetic in bash for resource budget calculations
- Three-tier classification: minimal (16GB), comfortable (32GB), generous (64GB+)
- Minecraft VM capped at 16GB RAM and 8 cores (50% of available, whichever is less)
- Multi-format YAML parsing with companion profile fallback for local-values format
- Non-negotiable host floor: 4GB RAM + 2 cores reserved before any VM allocation

### From Phase 170 Plan 01
- DHCP range scoped to 192.168.122.200-250 (small PXE provisioning range)
- bind-interfaces + specific interface for DHCP/TFTP isolation
- BIOS/UEFI detection via DHCP option 93 (client-arch)

### From Phase 170 Plan 02
- Template variable naming: UPPER_SNAKE_CASE in templates, lower_snake_case in values files
- General-purpose renderer (render-pxe-menu.sh) works for any template/values pair, not PXE-specific
- Boot menu defaults to local disk on timeout (30 seconds safety)

### From Phase 178 Plan 01
- Shared library uses printf-based YAML emission (no external YAML dependency)
- Each module exits 0 even when hardware is absent (present: false flags)
- USB device classes reported instead of vendor:product IDs

### From Phase 178 Plan 02
- Orchestrator uses inline fallback when discover-hardware.sh is absent (self-contained)
- Unified capabilities section aggregates 13 boolean flags from all modules
- Tier classification: CentOS 9/Fedora 39+/Ubuntu 22.04+ = Tier 1, Debian 12+/Rocky/Alma/Arch = Tier 2
- SELinux and AppArmor reported in separate security subsection

### From Phase 179 Plan 02
- Four-strategy detection cascade mirrors pkg-abstraction.sh pattern for consistency
- FW_BACKEND=none is a valid state (not an error) for systems without a firewall
- Idempotency via pre-check: query port state before opening/closing to avoid duplicate rule errors
- Service-to-port resolution via /etc/services for iptables backend (firewalld/ufw support native service names)

### From Phase 179 Plan 01
- Associative arrays for name mapping -- enables O(1) lookup with bash-native data structures
- Empty mapping value signals package unavailable on backend (return 1) vs missing key signals passthrough
- Four-strategy detection cascade with PKG_BACKEND env override as highest priority for testing and CI
- apt cache staleness threshold at 1 hour to avoid stale package lists on Debian/Ubuntu

### From Phase 171 Plan 02
- Complete kickstart file (not %include) -- Anaconda HTTP %include is fragile
- Minecraft system user with nologin shell at /opt/minecraft for security
- First-boot hook (50-minecraft-setup.sh) validates Java only -- no server software installed
- Deploy script renders but does NOT serve HTTP -- operator chooses serving method

### From Phase 180 Plan 02
- Podman preferred over Docker (rootless, daemonless) with automatic fallback
- itzg/minecraft-server with Fabric 1.21.4 as standard container image for Minecraft deployment
- Capability matrix is static hand-maintained YAML for feature gating, not auto-generated
- Container exit codes match vm-ctl.sh convention (0=ok, 1=error, 2=no runtime, 3=args)

### From Phase 172 Plan 01
- Infrastructure-level backends separate from Phase 180 platform-level abstraction -- 172 handles full provisioning pipeline
- 60-second graceful shutdown timeout with force fallback for infrastructure VMs
- VM_BACKEND environment variable override for explicit backend selection without capabilities YAML
- Parameter validation reports ALL failures at once (not fail-fast on first error)

### From Phase 181 Plan 01
- Subsection-aware awk parsing for nested YAML (audio.midi.present) without external dependencies
- UAE audio backend: SDL for PipeWire/PulseAudio (auto-detects server), ALSA for direct-only systems
- Vulkan display for NVIDIA/AMD modern drivers, OpenGL for older, software for no GPU
- ALSA MIDI backend universal on Linux when MIDI hardware detected

### From Phase 181 Plan 02
- ZGC selected only when heap >= 8192MB (8GB) to ensure ZGC has enough headroom
- Management interface: first ethernet with state=up, fallback to first ethernet, then eth0
- Hypervisor preference: KVM > VMware > VirtualBox > container (open standard priority)
- Assessment failures produce safe defaults rather than errors for generator resilience

### From Phase 172 Plan 02
- vm-lifecycle.sh uses function-reference dispatch (vm_do_create etc.) for zero-overhead backend switching
- Backend scripts support --_sourced flag for function-only import without executing main
- DRY_RUN state saved/restored across backend sourcing to prevent silent dry-run failure
- provision-vm.sh calls vm-lifecycle.sh exclusively (never backends directly) for single integration point
- Clone mode explicitly measures and reports against 5-minute INFRA-11 target
- destroy subcommand requires --force safety flag against accidental VM deletion

## Accumulated Context

### From v1.21 (GSD-OS Desktop Foundation)
- Tauri v2 application with Rust backend and Vite webview frontend
- WebGL shader engine with CRT post-processing and Amiga-inspired palette
- Native PTY terminal with xterm.js, tmux integration, Claude session management
- Window manager with custom chrome, desktop shell, taskbar
- Dashboard integration, calibration/personalization, boot sequence
- Architecture: src/ (TypeScript lib/CLI) + src-tauri/ (Rust backend) + desktop/ (Vite webview)
- Strict boundaries: src/ never imports desktop/@tauri-apps/api; desktop/ never imports Node.js modules

### From Milestone Planning (v1.22)
- 7 pre-planned input documents define complete phase structure
- Wave-based execution: 6 waves with parallelism within each wave
- 5 agent teams: Infra, Platform, Amiga, Creative, Ops
- Token cache strategy: research results cached across plans for reuse
- Version pinning: Minecraft, Fabric, Syncmatica, CentOS, OpenJDK versions to be pinned during Wave 1 research
- Template/local-values pattern: zero secrets in version control
- Hardware-agnostic design: adapts from 16GB laptop to 64GB+ workstation
- Open standards: Linux kernel drivers, OpenJDK, Fabric, PXE/TFTP/DHCP, UAE, IFF/MOD

### Milestone History
- 25 milestones shipped (v1.0-v1.21 + v1.8.1 patch)
- 168 phases, 483 plans, ~214k LOC
- Phase numbering continues from 169

## Blockers

None.

## Pending Todos

None.

## Session Continuity

Last session: 2026-02-18T12:09:41Z
Stopped at: Completed 182-01-PLAN.md (FS-UAE install script, AROS ROM setup, base UAE config, test suite)

### Key Files
- `.planning/ROADMAP.md` -- Phase structure, success criteria, wave assignments
- `.planning/REQUIREMENTS.md` -- 73 requirements with traceability table
- `.planning/PROJECT.md` -- Core value, constraints, key decisions
- `/tmp/milestone-input/` -- 9 pre-planned documents with detailed phase specs

### Wave Dependencies
- Wave 1 (169, 170, 178): No dependencies, start immediately
- Wave 2 (171, 172, 179, 180, 181): Needs Wave 1 complete
- Wave 3 (173-177, 182-183): Needs Wave 2 complete
- Wave 4 (184-190): Needs Wave 3 complete
- Wave 5 (191-197): Needs Waves 1-4 complete
- Wave 6 (198): Needs Wave 5 complete

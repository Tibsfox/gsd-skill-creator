# State: GSD Skill Creator

## Current Position

Phase: 183-amiga-application-profiles (Wave 3 in progress)
Plan: 183-01 complete (Phase 183 fully complete)
Status: Executing Wave 3 -- Phase 183 complete (Amiga profiles, launcher, WHDLoad, exchange)
Last activity: 2026-02-18 -- Completed 183-01-PLAN.md

Progress: [#############.............] 13/30 phases (Wave 1: 169, 170, 178; Wave 2: 171, 172, 179, 180, 181 -- all complete; Wave 3: 173, 174-01, 175-01, 176-01, 182, 183 complete)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible
**Current focus:** v1.22 Minecraft Knowledge World -- Wave 3 execution (Phase 183 complete, continuing Wave 3)

## Current Milestone

**v1.22 Minecraft Knowledge World**
- 30 phases (169-198), 73 requirements, 6 execution waves
- 7 plans: Infrastructure, Minecraft Server, Platform Portability, Amiga Emulation, Knowledge World Design, Skill-Creator Integration, Operations
- Parallelization enabled (wave-based execution)
- Comprehensive depth, quality model profile (opus executors), yolo mode

## Next Actions

1. Continue Wave 3 execution: 177 (Minecraft Server) remaining
2. Wave 3 in progress -- 173 (both plans), 174-01, 175-01, 176-01, 182 (both plans), 183 complete
3. Phase 183 Amiga profiles complete: launcher, WHDLoad, exchange ready for Phase 184 asset pipeline

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
- [Phase 176]: Prism Launcher MMC pack format (mmc-pack.json + instance.cfg) for portable instance configuration
- [Phase 176]: Client mod manifest as single source of truth: all docs reference mods-manifest.yaml for versions and download URLs
- [Phase 176]: SHA256 checksums deferred to deployment time since JARs not downloaded during doc creation
- [Phase 176]: Dual-path documentation: Prism Launcher quick path (5 min) plus Vanilla manual fallback (10 min)

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

### From Phase 173 Plan 01
- Security hardening in systemd: ProtectSystem=full, ProtectHome=true, PrivateTmp=true, NoNewPrivileges=true
- Log4Shell mitigation unconditionally included in JVM flags (-Dlog4j2.formatMsgNoLookups=true)
- Nested YAML parser via awk for reading minecraft.jvm section from local-values.yaml
- Dual deployment modes: --local for on-VM and --target-host for remote SSH deployment
- EULA acceptance conditional on minecraft_eula setting in local-values

### From Phase 173 Plan 02
- Health check uses associative arrays for result tracking, enabling both human and JSON output from same data
- Health check exit codes: 0=healthy, 1=unhealthy, 2=warnings (degraded), 3=usage error
- Test assertion for absent GC flag checks JVM_FLAGS line only (not comments) since templates document all GC options

### From Phase 174 Plan 01
- Modrinth API v2 for mod resolution with jq-based JSON parsing and graceful fallback
- SHA-256 from local-values as authoritative (not API hash) for reproducibility
- Exit code 2 from check-mod-updates.sh signals updates available for cron/scripted monitoring
- Read-only update checker never downloads or modifies files (safety by design)
- Mod manifest at SERVER_DIR/mod-manifest.yaml separate from mods/ jar directory

### From Phase 175 Plan 01
- RCON password stored in infra/local/minecraft-secrets.yaml (gitignored, chmod 600, idempotent)
- Whitelist script uses jq primary with python3 fallback for JSON manipulation
- RCON commands: three-tier fallback (mcrcon -> python3 socket -> file-only mode)
- Offline UUID generation matches Java UUID.nameUUIDFromBytes() using MD5 + UUID v3 bits
- Merged values file pattern: flatten minecraft.server + network sections + secrets for renderer

### From Phase 182 Plan 02
- Vulkan/OpenGL/software mapping follows gpu.uae_display from local-values.yaml for FS-UAE display backend
- VRAM-tier integer scaling: 3x for high (8GB+), 2x for medium/low, 1x for none
- Scanline shader gated on rendering_capable=true, stderr warning when requested without GPU
- SDL audio backend for PipeWire/PulseAudio, ALSA for direct, sample-accurate Amiga audio mode
- Config renderer calls display and audio generators as subprocesses, merging output sections

### From Phase 183 Plan 01
- Profile merge uses awk last-value-wins for duplicate keys (app profile overrides base)
- Vulkan display mapped to opengl for FS-UAE compatibility (FS-UAE uses OpenGL internally)
- Default fallback values (opengl, 44100Hz, 512 buffer) when local-values.yaml missing
- WHDLoad HDF formatting requires xdftool (amitools pip package), manual fallback documented
- Exchange path stored in infra/local/amiga-exchange.path for launcher auto-detection

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

Last session: 2026-02-18T12:37:47Z
Stopped at: Completed 183-01-PLAN.md (Amiga profiles, launcher, WHDLoad, exchange, 56-assertion test suite)

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

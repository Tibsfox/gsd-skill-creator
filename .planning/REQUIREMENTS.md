# Requirements: GSD Skill Creator

**Defined:** 2026-02-17
**Core Value:** Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code

## v1.22 Requirements — Minecraft Knowledge World

73 requirements across 7 categories.

### Infrastructure Foundation (Plan 01)

- [ ] **INFRA-01**: Hardware discovery script detects CPU, RAM, storage, GPU, and hypervisor capabilities from Linux standard interfaces
- [ ] **INFRA-02**: Hardware profile generates both sanitized (git-safe) and local (gitignored) YAML outputs with no identifying information
- [ ] **INFRA-03**: Resource budget calculator determines VM allocations leaving minimum 4GB RAM and 2 cores for host OS
- [ ] **INFRA-04**: dnsmasq PXE/TFTP/DHCP configuration enables network boot without disrupting existing DNS services
- [ ] **INFRA-05**: PXE boot menu supports both BIOS and UEFI boot paths with GSD branding
- [ ] **INFRA-06**: CentOS Stream 9 boot media is downloaded and verified for PXE boot
- [ ] **INFRA-07**: Base kickstart template produces a minimal, secure CentOS Stream 9 VM (SELinux enforcing, firewalld active, SSH key-only)
- [x] **INFRA-08**: Minecraft kickstart extends base with Java 21, dedicated user, and game ports
- [x] **INFRA-09**: All kickstart values use template/local-values pattern with zero secrets in version control
- [x] **INFRA-10**: Hypervisor-agnostic VM creation scripts support at least VMware Workstation and KVM/libvirt backends
- [x] **INFRA-11**: Golden image workflow provisions via kickstart, snapshots, and clones in under 5 minutes
- [x] **INFRA-12**: VM lifecycle operations (create, start, stop, snapshot, destroy) are idempotent

### Minecraft Server (Plan 02)

- [x] **MC-01**: Minecraft Java Edition server runs on Fabric mod loader with systemd service management
- [x] **MC-02**: Server starts automatically on boot and restarts automatically on crash
- [x] **MC-03**: JVM flags are templated based on allocated RAM from hardware profile
- [x] **MC-04**: Fabric API and Syncmatica server-side mods are installed with version-pinned manifest
- [x] **MC-05**: Mod update script checks for newer versions without auto-applying them
- [x] **MC-06**: server.properties is fully templated with defaults for creative mode, peaceful difficulty, and command blocks enabled
- [x] **MC-07**: Whitelist management is automated via script (add/remove players)
- [x] **MC-08**: RCON is configured for remote command execution with random password in local secrets
- [x] **MC-09**: Client installation guide covers Windows, macOS, and Linux with Fabric Loader and mods
- [x] **MC-10**: Pre-configured Prism Launcher profile is available for one-click client setup
- [x] **MC-11**: End-to-end test verifies PXE boot through running Minecraft server in under 20 minutes
- [x] **MC-12**: Two clients can share schematics via Syncmatica within 30 seconds
- [x] **MC-13**: Server maintains 20 TPS with 2 connected clients

### Platform Portability (Plan 03)

- [ ] **PLAT-01**: Comprehensive hardware discovery script covers CPU, memory, storage, GPU, audio, network, and USB subsystems
- [ ] **PLAT-02**: Hardware discovery runs without errors on Tier 1 distributions (CentOS Stream 9, Fedora 39+, Ubuntu 22.04+)
- [ ] **PLAT-03**: Missing hardware (no GPU, no audio) results in graceful capability flags, not errors
- [x] **PLAT-04**: Distribution detection identifies OS from /etc/os-release and maps to package manager
- [x] **PLAT-05**: Package manager abstraction installs packages across dnf, apt, and pacman
- [x] **PLAT-06**: Firewall abstraction manages ports across firewalld, ufw, and iptables
- [ ] **PLAT-07**: Hypervisor abstraction provides unified VM operations across VMware, KVM/libvirt, and VirtualBox
- [x] **PLAT-08**: Container fallback supports Minecraft server deployment via Podman/Docker on resource-constrained environments
- [x] **PLAT-09**: Resource allocation calculator adapts VM sizes from 16GB (minimal) to 64GB+ (generous) configurations
- [x] **PLAT-10**: GPU capability assessment detects compute, rendering, and IOMMU passthrough support
- [x] **PLAT-11**: Audio subsystem detection identifies ALSA/PulseAudio/PipeWire devices and MIDI ports
- [x] **PLAT-12**: Adaptive configuration generator produces local-values YAML from hardware profile

### Amiga Emulation (Plan 04)

- [x] **AMIGA-01**: FS-UAE installs and runs on all Tier 1 distributions via package manager abstraction
- [x] **AMIGA-02**: AROS ROM boots to a usable Amiga Workbench without copyright issues
- [x] **AMIGA-03**: UAE display output uses GPU acceleration with optional scanline shader
- [x] **AMIGA-04**: UAE audio output works through host audio subsystem (ALSA/PulseAudio/PipeWire)
- [x] **AMIGA-05**: Application-specific UAE profiles exist for Deluxe Paint, OctaMED, ProTracker, and PPaint
- [x] **AMIGA-06**: WHDLoad integration allows hard-drive-based software loading
- [x] **AMIGA-07**: IFF/ILBM to PNG converter preserves palette metadata and dimensions
- [x] **AMIGA-08**: MOD/MED to WAV/FLAC/OGG renderer produces sample-accurate audio output
- [ ] **AMIGA-09**: Batch conversion processes 100+ files without errors
- [ ] **AMIGA-10**: Asset catalog YAML manifest contains accurate metadata for all converted files
- [ ] **AMIGA-11**: Curated asset collection (20 artworks, 20 music tracks, 10 demos) is legally distributable
- [ ] **AMIGA-12**: Legal guide documents ROM acquisition paths and software distribution rights

### Knowledge World Design (Plan 05)

- [ ] **WORLD-01**: Master world plan defines themed districts with coordinate ranges, color palettes, and spatial relationships
- [ ] **WORLD-02**: No district is more than 2 minutes walk from spawn plaza
- [ ] **WORLD-03**: Wayfinding system uses color-coded paths, beacon landmarks, and consistent sign formatting
- [ ] **WORLD-04**: Spawn plaza welcomes and orients new players within 60 seconds
- [ ] **WORLD-05**: Tutorial path is completable in 5 minutes
- [ ] **WORLD-06**: Schematic library contains at least 10 reusable architectural templates (meeting room, presentation hall, workshop, server room, library, garden, bridge, gateway, tower, observatory)
- [ ] **WORLD-07**: All schematics load correctly in Litematica and are shareable via Syncmatica
- [ ] **WORLD-08**: Schematic catalog YAML is valid with accurate metadata and consistent naming convention
- [ ] **WORLD-09**: "Visualize a Pipeline" guided build teaches data flow concepts through rooms and corridors
- [ ] **WORLD-10**: "Build a Network Topology" guided build teaches network concepts through buildings and paths
- [ ] **WORLD-11**: "Design a Database Schema" guided build teaches relational concepts through rooms and doors
- [ ] **WORLD-12**: Each guided build is completable in 30-60 minutes
- [ ] **WORLD-13**: "System Architecture as Buildings" methodology document enables educators to create new builds
- [ ] **WORLD-14**: Amiga Corner in Creative District displays pixel art gallery, demo scene exhibit, and tool evolution walkthrough

### Skill-Creator Integration (Plan 06)

- [ ] **SKILL-01**: Complete SKILL.md files exist for every skill identified across Plans 01-05 (17+ skills)
- [ ] **SKILL-02**: Each skill has token budget annotation, trigger patterns, and at least one test case
- [ ] **SKILL-03**: Trigger patterns do not overlap ambiguously between skills
- [ ] **SKILL-04**: Agent definitions formalize all team roles with skill compositions and tool access permissions
- [ ] **SKILL-05**: No two agents have identical skill sets — each is specialized
- [ ] **SKILL-06**: Team definitions specify topology (pipeline/map-reduce/swarm/leader-worker) with resource locks and sync points
- [ ] **SKILL-07**: Inter-team communication follows filesystem message bus pattern via .planning/artifacts/
- [ ] **SKILL-08**: Complete chipset definition in .chipset/minecraft-knowledge-world.yaml validates against chipset schema
- [ ] **SKILL-09**: Chipset trigger routing sends work to correct teams
- [ ] **SKILL-10**: Total skill token budget stays under 40% (leaving headroom for execution)

### Operations (Plan 07)

- [ ] **OPS-01**: Backup script quiesces server (save-all, save-off) before backup with under 5-second interruption
- [ ] **OPS-02**: Backup rotation keeps 24 hourly, 7 daily, 4 weekly backups
- [ ] **OPS-03**: Restore script rebuilds from backup to a fresh VM with zero data loss
- [ ] **OPS-04**: node_exporter and JMX exporter provide system and JVM metrics to Prometheus
- [ ] **OPS-05**: Custom metrics collector tracks TPS, player count, world size, chunk count, entity count, and mod status
- [ ] **OPS-06**: Alert rules fire for TPS degradation, memory pressure, disk usage, backup age, and server unreachability
- [ ] **OPS-07**: Health check script validates all systems and catches known failure modes
- [ ] **OPS-08**: Golden image can be cloned to a working server in under 5 minutes
- [ ] **OPS-09**: PXE rebuild produces identical server from scratch in under 20 minutes
- [ ] **OPS-10**: Day-1 runbook enables new operator to complete full deployment
- [ ] **OPS-11**: Day-2 runbook covers player management, health checks, backup review, and OS updates
- [ ] **OPS-12**: Incident response runbook covers server unreachable, performance degradation, world corruption, and mod conflicts
- [ ] **OPS-13**: Server update procedure is documented and tested on at least one version bump

## v2 Requirements

### Future Enhancements

- **FUT-01**: Additional educational builds (5+) covering advanced computing concepts
- **FUT-02**: Custom Minecraft mod for tighter GSD-OS integration
- **FUT-03**: Automated world analytics (player paths, build patterns, engagement metrics)
- **FUT-04**: Multi-server federation for topic-specific worlds
- **FUT-05**: Grafana dashboards for operational monitoring visualization
- **FUT-06**: WSL2 support for Windows-based deployments

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud-hosted Minecraft | GSD philosophy is local-first infrastructure |
| Survival mode gameplay | Knowledge World is creative/educational only |
| Custom Minecraft mod development | Using existing open-source mods only |
| Mobile Minecraft clients | Java Edition desktop only |
| Oracle JDK | OpenJDK only, open standards first |
| Proprietary hypervisor lock-in | Must support multiple hypervisors |
| Real-time voice chat | Not needed for spatial learning |
| Automated content generation | World design is intentional, not procedural |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 169 | Pending |
| INFRA-02 | Phase 169 | Pending |
| INFRA-03 | Phase 169 | Pending |
| INFRA-04 | Phase 170 | Pending |
| INFRA-05 | Phase 170 | Pending |
| INFRA-06 | Phase 170 | Pending |
| INFRA-07 | Phase 171 | Pending |
| INFRA-08 | Phase 171 | Complete |
| INFRA-09 | Phase 171 | Complete |
| INFRA-10 | Phase 172 | Complete |
| INFRA-11 | Phase 172 | Pending |
| INFRA-12 | Phase 172 | Pending |
| MC-01 | Phase 173 | Complete |
| MC-02 | Phase 173 | Complete |
| MC-03 | Phase 173 | Complete |
| MC-04 | Phase 174 | Complete |
| MC-05 | Phase 174 | Complete |
| MC-06 | Phase 175 | Complete |
| MC-07 | Phase 175 | Complete |
| MC-08 | Phase 175 | Complete |
| MC-09 | Phase 176 | Complete |
| MC-10 | Phase 176 | Complete |
| MC-11 | Phase 177 | Complete |
| MC-12 | Phase 177 | Complete |
| MC-13 | Phase 177 | Complete |
| PLAT-01 | Phase 178 | Pending |
| PLAT-02 | Phase 178 | Pending |
| PLAT-03 | Phase 178 | Pending |
| PLAT-04 | Phase 179 | Complete |
| PLAT-05 | Phase 179 | Complete |
| PLAT-06 | Phase 179 | Complete |
| PLAT-07 | Phase 180 | Pending |
| PLAT-08 | Phase 180 | Complete |
| PLAT-09 | Phase 181 | Complete |
| PLAT-10 | Phase 181 | Complete |
| PLAT-11 | Phase 181 | Complete |
| PLAT-12 | Phase 181 | Complete |
| AMIGA-01 | Phase 182 | Complete |
| AMIGA-02 | Phase 182 | Complete |
| AMIGA-03 | Phase 182 | Complete |
| AMIGA-04 | Phase 182 | Complete |
| AMIGA-05 | Phase 183 | Complete |
| AMIGA-06 | Phase 183 | Complete |
| AMIGA-07 | Phase 184 | Complete |
| AMIGA-08 | Phase 184 | Complete |
| AMIGA-09 | Phase 184 | Pending |
| AMIGA-10 | Phase 184 | Pending |
| AMIGA-11 | Phase 185 | Pending |
| AMIGA-12 | Phase 185 | Pending |
| WORLD-01 | Phase 186 | Pending |
| WORLD-02 | Phase 186 | Pending |
| WORLD-03 | Phase 186 | Pending |
| WORLD-04 | Phase 187 | Pending |
| WORLD-05 | Phase 187 | Pending |
| WORLD-06 | Phase 188 | Pending |
| WORLD-07 | Phase 188 | Pending |
| WORLD-08 | Phase 188 | Pending |
| WORLD-09 | Phase 189 | Pending |
| WORLD-10 | Phase 189 | Pending |
| WORLD-11 | Phase 189 | Pending |
| WORLD-12 | Phase 189 | Pending |
| WORLD-13 | Phase 189 | Pending |
| WORLD-14 | Phase 190 | Pending |
| SKILL-01 | Phase 191 | Pending |
| SKILL-02 | Phase 191 | Pending |
| SKILL-03 | Phase 191 | Pending |
| SKILL-04 | Phase 192 | Pending |
| SKILL-05 | Phase 192 | Pending |
| SKILL-06 | Phase 193 | Pending |
| SKILL-07 | Phase 193 | Pending |
| SKILL-08 | Phase 194 | Pending |
| SKILL-09 | Phase 194 | Pending |
| SKILL-10 | Phase 194 | Pending |
| OPS-01 | Phase 195 | Pending |
| OPS-02 | Phase 195 | Pending |
| OPS-03 | Phase 195 | Pending |
| OPS-04 | Phase 196 | Pending |
| OPS-05 | Phase 196 | Pending |
| OPS-06 | Phase 196 | Pending |
| OPS-07 | Phase 196 | Pending |
| OPS-08 | Phase 197 | Pending |
| OPS-09 | Phase 197 | Pending |
| OPS-10 | Phase 198 | Pending |
| OPS-11 | Phase 198 | Pending |
| OPS-12 | Phase 198 | Pending |
| OPS-13 | Phase 198 | Pending |

**Coverage:**
- v1.22 requirements: 73 total
- Mapped to phases: 73
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*

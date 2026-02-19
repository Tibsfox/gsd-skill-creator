# Known-Issues Cross-Reference

**Generated:** 2026-02-19
**Purpose:** 3-way classification of all 99 deferred conformance items from Phase 229, mapped to ecosystem DAG nodes. Feeds the compatibility matrix (COMPAT-05) with annotations distinguishing "not built yet" from "permanently deferred."

**Source:** `.planning/milestones/v1.24-phases/229-documentation-amendments/known-issues.md`
**Node reference:** `.planning/specs/ecosystem-dependency-map/node-inventory.md` (20 nodes, 4-state status)
**Edge reference:** `.planning/specs/ecosystem-dependency-map/edge-inventory.md` (48 typed edges)

---

## Classification Scheme

Each known-issues group is classified into exactly one of three categories:

| Category | Code | Meaning | Re-evaluation Expected |
|----------|------|---------|----------------------|
| **Not built yet (aspirational)** | ASPIR | Has a recommended milestone; will be built when prerequisites are met | At milestone planning or when prerequisites are available |
| **Not built yet (environment-dependent)** | ENVDEP | Requires hardware or infrastructure not currently available | When the required hardware/infrastructure becomes available |
| **Permanently deferred** | PERM | Architectural decision made; will not be built | None (permanent) -- only revisit if architecture fundamentally changes |

A fourth status, **Resolved**, applies to Group 8 (Vision Amendments). These items were resolved via the amendment protocol during Phase 229 and do not represent deferred work or compatibility concerns.

---

## Group Classifications

### Group 1: GSD ISA Instruction Set

| Field | Value |
|-------|-------|
| **Known-issues group** | 1. Deferred Architecture -- GSD ISA Instruction Set |
| **Checkpoint count** | 32 |
| **Checkpoint IDs** | isa-001 through isa-032 |
| **Classification** | **ASPIR** -- Not built yet (aspirational) |
| **Affected DAG node** | **gsd-isa** (Middleware layer, status: aspirational) |
| **Recommended milestone** | v2.x -- GSD Execution Engine |
| **Re-evaluation trigger** | When workflow orchestration model decisions are made; when the TypeScript-based skill/agent/team composition model is deemed insufficient for scaling requirements |
| **Impact on compatibility matrix** | Edges #42 (gsd-isa -> chipset), #43 (gsd-isa -> skill-creator), #44 (gsd-isa -> amiga-leverage), #45 (gsd-isa -> silicon) are all aspirational. No source component currently depends on gsd-isa (0 incoming edges), so absence has zero downstream impact today. |
| **Notes** | The AGC ISA (educational simulator in `src/agc/`) is a separate component serving the educational tier. It is NOT the GSD ISA. The GSD ISA envisions custom opcodes (GSD-I encoding), 8 general-purpose registers, filesystem bus protocol, and FPGA synthesis -- entirely unimplemented. |

### Group 2: Silicon/ML Pipeline

| Field | Value |
|-------|-------|
| **Known-issues group** | 2. Deferred ML Pipeline -- Silicon Layer |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | sl-003 through sl-014, ca-009, ca-011, ca-012, ca-014 |
| **Classification** | **ENVDEP** -- Not built yet (environment-dependent) |
| **Affected DAG node** | **silicon** (Middleware layer, status: aspirational) |
| **Recommended milestone** | v3.x -- ML Acceleration Layer |
| **Re-evaluation trigger** | When GPU infrastructure and model training capabilities become available in the development environment |
| **Impact on compatibility matrix** | Edges #3 (silicon -> chipset), #4 (silicon -> skill-creator) are outgoing hard-blocks. Edges #8 (staging -> silicon), #12 (creative-suite -> silicon), #45 (gsd-isa -> silicon) are incoming soft-enhances. Staging and creative-suite degrade gracefully without silicon (soft-enhances edges). |
| **Notes** | The `silicon-panel.ts` dashboard component exists for visualization but has no actual ML pipeline behind it. QLoRA fine-tuning, adapter lifecycle, hybrid routing, training pair generation, and VRAM budget management are all aspirational. Requires GPU access, training framework, and model serving infrastructure. |

### Group 3: Hardware Workbench

| Field | Value |
|-------|-------|
| **Known-issues group** | 3. Environment-Dependent -- Hardware Workbench |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | hw-001 through hw-013 |
| **Classification** | **ENVDEP** -- Not built yet (environment-dependent) |
| **Affected DAG node** | **amiga-workbench** (Platform layer, status: partial) |
| **Recommended milestone** | v4.x -- Hardware Integration |
| **Re-evaluation trigger** | When a physical hardware test environment with audio/MIDI/camera/GPIO peripherals becomes available |
| **Impact on compatibility matrix** | Edges #40 (amiga-workbench -> amiga-leverage), #41 (amiga-workbench -> gsd-os) are outgoing hard-blocks. Amiga-workbench has 0 incoming edges (leaf consumer), so its partial status does not block any other component. The hardware I/O features are additive to the existing Workbench UI (window manager, taskbar, pixel-art icons). |
| **Notes** | The Workbench UI layer exists and functions in `desktop/src/wm/`. Only the physical hardware I/O features (audio/MIDI, camera, GPIO) are deferred. These require physical peripherals not available in a software-only development environment. |

### Group 4: Wetty Divergence

| Field | Value |
|-------|-------|
| **Known-issues group** | 4. Architectural Divergence -- Wetty to Native PTY |
| **Checkpoint count** | 9 |
| **Checkpoint IDs** | wtm-001 through wtm-011 (9 of 11 amended; wtm-004 and wtm-005 pass as standard tmux features) |
| **Classification** | **PERM** -- Permanently deferred |
| **Affected DAG node** | **wetty-tmux** (Platform layer, status: permanently-deferred) |
| **Recommended milestone** | None -- architectural divergence is permanent and intentional |
| **Re-evaluation trigger** | None. Only revisit if the Tauri desktop architecture is abandoned in favor of a web-only deployment model, which would be a fundamental architectural reversal. |
| **Impact on compatibility matrix** | Edges #21 (gsd-os -> wetty-tmux) and #38 (dashboard-console -> wetty-tmux) are both soft-enhances. Both source components function fully without wetty-tmux because Tauri native PTY (`src-tauri/src/pty/`, `desktop/src/terminal/`) replaced the Wetty approach. These edges represent historical architectural influence, not active dependencies. |
| **Notes** | GSD-OS adopted Tauri + portable-pty + xterm.js for terminal functionality. Native PTY provides better performance, lower latency, and tighter desktop integration. Wetty would have added an unnecessary SSH/network layer for a desktop application. This is the only permanently-deferred component in the ecosystem. |

### Group 5: LCP Templates

| Field | Value |
|-------|-------|
| **Known-issues group** | 5. Infrastructure Templates -- LCP |
| **Checkpoint count** | 12 |
| **Checkpoint IDs** | lcp-001 through lcp-016 (12 of 16 amended) |
| **Classification** | **ASPIR** -- Not built yet (aspirational) |
| **Affected DAG node** | **lcp** (Platform layer, status: partial) |
| **Recommended milestone** | v2.x -- Infrastructure Automation |
| **Re-evaluation trigger** | When more sophisticated templating is needed beyond shell substitution; when VM identity reconfiguration, DNS templates, or advanced provisioning features become requirements |
| **Impact on compatibility matrix** | Edges #22 (lcp -> bootstrap), #23 (lcp -> centos-guide) are outgoing hard-blocks to external nodes (both implemented). Edges #24 (lcp -> minecraft-world), #25 (lcp -> chipset) are outgoing soft-enhances. Edge #31 (cloud-ops -> lcp) is the sole incoming hard-blocks edge. LCP's partial status blocks cloud-ops curriculum from having a complete lab infrastructure. |
| **Notes** | LCP currently uses shell substitution (`${VAR}` via `render-pxe-menu.sh`) instead of Jinja templating. This is a deliberate simplicity choice. The existing PXE boot, VM provisioning, and basic configuration management work. The deferred items are advanced features (Jinja templates, VM identity reconfiguration, DNS templates). |

### Group 6: Cloud-Ops Curriculum

| Field | Value |
|-------|-------|
| **Known-issues group** | 6. Content-Only -- Cloud-Ops Curriculum |
| **Checkpoint count** | 4 |
| **Checkpoint IDs** | cop-001, cop-003, cop-004, cop-008 |
| **Classification** | **ASPIR** -- Not built yet (aspirational) |
| **Affected DAG node** | **cloud-ops** (Educational layer, status: aspirational) |
| **Recommended milestone** | v3.x -- Educational Content Platform |
| **Re-evaluation trigger** | When content authoring infrastructure exists; when educational content platform requirements are defined |
| **Impact on compatibility matrix** | Edges #30 (cloud-ops -> bootstrap), #31 (cloud-ops -> lcp), #32 (cloud-ops -> centos-guide) are outgoing hard-blocks. Edges #33 (cloud-ops -> creative-suite), #34 (cloud-ops -> space-between) are outgoing soft-enhances. Cloud-ops has 0 incoming edges (leaf consumer), so its absence has zero downstream impact. |
| **Notes** | Cloud-ops exists as vision documents only (6 curriculum modules, concept mapping, Podman path). Implementation requires training materials, lab environments, and assessment tools -- a content creation effort. The vision document structural claims are verified as sound. |

### Group 7: Dashboard Packaging

| Field | Value |
|-------|-------|
| **Known-issues group** | 7. Packaging Model -- Dashboard Generator |
| **Checkpoint count** | 3 |
| **Checkpoint IDs** | pd-011, pd-012, pd-006 |
| **Classification** | **ASPIR** -- Not built yet (aspirational) |
| **Affected DAG node** | **planning-docs** (Platform layer, status: implemented) |
| **Recommended milestone** | v2.x -- Skill Ecosystem |
| **Re-evaluation trigger** | When a skill marketplace requires uniform packaging; when GSD event system integration becomes a priority |
| **Impact on compatibility matrix** | Planning-docs is implemented and functional. These 3 items concern packaging the dashboard generator as a GSD skill (with SKILL.md, metadata.yaml) rather than a standalone TypeScript module. This affects edge #46 (planning-docs -> skill-creator, soft-enhances) -- the packaging would formalize this relationship. No other edges are affected since planning-docs functions fully without the skill packaging. |
| **Notes** | The dashboard generator (`src/dashboard/`) predates the skill packaging system and works effectively as a standalone module. The deferred items are about organizational packaging, not functional gaps. File-change triggers and GSD command wrappers exist as Phase 85/86 stubs but are not wired into the GSD event system. |

### Group 8: Vision Amendments

| Field | Value |
|-------|-------|
| **Known-issues group** | 8. Feature Maturity -- Vision Claims Amended |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | pd-008, pd-009, pd-010, os-014, os-015, os-016, os-017, os-018, dc-008, dc-009, dc-014, id-008, ds-008 |
| **Classification** | **Resolved** -- Not deferred |
| **Affected DAG nodes** | **planning-docs** (pd-008, pd-009, pd-010), **gsd-os** (os-014 through os-018), **dashboard-console** (dc-008, dc-009, dc-014), **info-design** (id-008, ds-008) |
| **Recommended milestone** | N/A -- amendments are the resolution |
| **Re-evaluation trigger** | N/A -- resolved. The amendment protocol in Phase 229 formally documented the gap between vision and implementation with proper paper trail. |
| **Impact on compatibility matrix** | None. These items were resolved via amendment, not deferred. Vision documents were updated to match actual implementation. No compatibility concerns arise from amended items because the vision now accurately reflects reality. |
| **Notes** | 13 vision document claims were amended to match actual implementation. These represent cases where visions overstated feature richness or specificity compared to what was built. Each has a formal entry in amendment-log.md. These are NOT deferred work -- they are reconciled documentation. |

---

## Summary Table

| Group | Items | Classification | Code | Affected Node(s) | Node Status | Milestone | Re-evaluation Trigger |
|-------|-------|----------------|------|-------------------|-------------|-----------|----------------------|
| GSD ISA | 32 | Not built yet (aspirational) | ASPIR | gsd-isa | aspirational | v2.x | Workflow orchestration model decisions |
| Silicon/ML | 13 | Not built yet (environment-dependent) | ENVDEP | silicon | aspirational | v3.x | GPU infrastructure available |
| Hardware Workbench | 13 | Not built yet (environment-dependent) | ENVDEP | amiga-workbench | partial | v4.x | Physical hardware test environment |
| Wetty divergence | 9 | Permanently deferred | PERM | wetty-tmux | permanently-deferred | None | None (permanent) |
| LCP templates | 12 | Not built yet (aspirational) | ASPIR | lcp | partial | v2.x | Sophisticated templating needed |
| Cloud-ops | 4 | Not built yet (aspirational) | ASPIR | cloud-ops | aspirational | v3.x | Content authoring infrastructure |
| Dashboard packaging | 3 | Not built yet (aspirational) | ASPIR | planning-docs | implemented | v2.x | Skill marketplace packaging |
| Vision amendments | 13 | Resolved (not deferred) | RESOLVED | planning-docs, gsd-os, dashboard-console, info-design | various (implemented/partial) | N/A | N/A |
| **Total** | **99** | | | | | | |

---

## Classification Distribution

| Classification | Groups | Total Items | Percentage |
|----------------|--------|-------------|------------|
| Not built yet (aspirational) | 4 groups (GSD ISA, LCP, Cloud-ops, Dashboard packaging) | 51 | 51.5% |
| Not built yet (environment-dependent) | 2 groups (Silicon/ML, Hardware Workbench) | 26 | 26.3% |
| Permanently deferred | 1 group (Wetty divergence) | 9 | 9.1% |
| Resolved | 1 group (Vision amendments) | 13 | 13.1% |
| **Total** | **8 groups** | **99** | **100%** |

---

## Compatibility Matrix Impact Summary

### Edges affected by deferred nodes

| Node | Classification | Outgoing Edges Affected | Incoming Edges Affected |
|------|---------------|------------------------|------------------------|
| gsd-isa (ASPIR) | 4 outgoing: #42, #43, #44, #45 | 0 incoming (no component depends on gsd-isa) |
| silicon (ENVDEP) | 2 outgoing: #3, #4 | 3 incoming soft-enhances: #8, #12, #45 |
| amiga-workbench (ENVDEP) | 2 outgoing: #40, #41 | 0 incoming (leaf consumer) |
| wetty-tmux (PERM) | 0 outgoing | 2 incoming soft-enhances: #21, #38 |
| lcp (ASPIR -- partial features) | 4 outgoing: #22, #23, #24, #25 | 1 incoming hard-blocks: #31 |
| cloud-ops (ASPIR) | 5 outgoing: #30, #31, #32, #33, #34 | 0 incoming (leaf consumer) |
| planning-docs (ASPIR -- packaging only) | 1 outgoing: #46 | 3 incoming: #19, #35, #47 (all functional without packaging) |

### Key finding

The permanently-deferred node (wetty-tmux) has zero downstream impact because both edges targeting it (#21, #38) are soft-enhances -- gsd-os and dashboard-console function fully with native PTY. The aspirational nodes with the highest potential future impact are silicon (3 incoming soft-enhances from staging, creative-suite, gsd-isa) and gsd-isa (0 incoming edges today, but would formalize the system bus architecture).

---

## Cross-Reference to Edge Inventory

For each known-issues group, the affected edges in the compatibility matrix should carry the following annotation:

| Edge | Target Node | Annotation for Matrix |
|------|------------|----------------------|
| #42, #43, #44, #45 | gsd-isa targets | "Target is aspirational (ASPIR). GSD ISA deferred to v2.x. Re-evaluate when workflow orchestration model decisions are made." |
| #3, #4 | silicon targets | "Target is aspirational (ENVDEP). Silicon layer deferred to v3.x. Re-evaluate when GPU infrastructure is available." |
| #8, #12, #45 | silicon as target | "Target is aspirational (ENVDEP). Source degrades gracefully (soft-enhances edge)." |
| #40, #41 | amiga-workbench targets | "Source is partially environment-dependent (ENVDEP). Hardware I/O features deferred to v4.x. Workbench UI functions without hardware." |
| #21, #38 | wetty-tmux as target | "Target is permanently deferred (PERM). Native PTY supersedes Wetty. Source functions fully without wetty-tmux." |
| #22, #23, #24, #25 | lcp targets | "Source has aspirational features (ASPIR). LCP templates deferred to v2.x. Core PXE/provisioning functions." |
| #30, #31, #32, #33, #34 | cloud-ops targets | "Source is aspirational (ASPIR). Cloud-ops curriculum deferred to v3.x." |
| #46 | planning-docs -> skill-creator | "Source has aspirational packaging (ASPIR). Dashboard generator functions as standalone module. Skill packaging deferred to v2.x." |

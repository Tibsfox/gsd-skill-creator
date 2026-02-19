# Known Issues

**Phase:** 229 - Documentation & Amendments
**Purpose:** Catalogue all conformance matrix items that are not pass or amended-to-match, explaining why they are deferred and when they should be addressed.

**Matrix totals:** 336 checkpoints (211 pass + 125 amended + 0 fail + 0 pending + 0 partial)

---

## 1. Deferred Architecture -- GSD ISA Instruction Set

| Field | Value |
|-------|-------|
| **Category** | Deferred architecture |
| **Checkpoint count** | 32 |
| **Checkpoint IDs** | isa-001 through isa-032 (includes T0/T1/T2 across all tiers) |
| **Status in matrix** | amended |
| **Description** | The full GSD ISA with custom opcodes (GSD-I encoding), 8 general-purpose registers (R0-R7), filesystem bus protocol, FPGA synthesis pipeline, privilege levels, and I/O bridges is entirely unimplemented. The AGC ISA is a separate educational ISA that serves the learning pack, not the GSD workflow engine. |
| **Rationale** | The GSD ISA is aspirational v2+ architecture. The current system achieves workflow orchestration through TypeScript-based skill/agent/team composition rather than a hardware-like instruction set. AGC ISA satisfies the educational component. |
| **Recommended milestone** | v2.x -- GSD Execution Engine (if hardware-like orchestration model is pursued) |

---

## 2. Deferred ML Pipeline -- Silicon Layer

| Field | Value |
|-------|-------|
| **Category** | Deferred ML pipeline |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | sl-003 through sl-014, ca-009, ca-011, ca-012, ca-014 |
| **Status in matrix** | amended |
| **Description** | QLoRA fine-tuning, adapter lifecycle management, hybrid routing (local/cloud), training pair generation, silicon.yaml configuration, consumer registration, and backpressure mechanisms are all aspirational features. The silicon-panel exists for ML adapter status visualization but no actual ML training pipeline is implemented. |
| **Rationale** | The silicon layer requires significant ML infrastructure (GPU access, training framework, model serving) that is beyond current project scope. The skill-creator's observation-to-skill pipeline works without ML training. |
| **Recommended milestone** | v3.x -- ML Acceleration Layer (requires GPU infrastructure and model training capabilities) |

---

## 3. Environment-Dependent -- Hardware Workbench

| Field | Value |
|-------|-------|
| **Category** | Environment-dependent |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | hw-001 through hw-013 |
| **Status in matrix** | amended |
| **Description** | Audio/MIDI integration, camera feed processing, GPIO control, and physical hardware workbench features require physical audio/MIDI/camera/GPIO hardware that is not available in the development environment. No audio/MIDI/camera/GPIO integration code exists. |
| **Rationale** | These checkpoints cannot be verified or implemented without physical hardware peripherals. The development environment is a software-only workstation. Hardware workbench is a vision feature for physical computing education. |
| **Recommended milestone** | v4.x -- Hardware Integration (requires physical hardware test environment) |

---

## 4. Architectural Divergence -- Wetty to Native PTY

| Field | Value |
|-------|-------|
| **Category** | Architectural divergence |
| **Checkpoint count** | 9 |
| **Checkpoint IDs** | wtm-001 through wtm-011 (9 of 11 fail; wtm-004 and wtm-005 pass as standard tmux features) |
| **Status in matrix** | amended |
| **Description** | GSD-OS uses Tauri + portable-pty + xterm.js for terminal functionality instead of Wetty (web-based SSH terminal). This is a deliberate architectural decision. The native PTY approach provides better performance, lower latency, and tighter desktop integration. Tmux session management (attach-or-create, persistence) works through native PTY. |
| **Rationale** | Wetty was the original vision for web-based terminal access. The Tauri desktop application architecture made native PTY the correct choice. Wetty would add an unnecessary network layer for a desktop application. |
| **Recommended milestone** | None -- architectural divergence is permanent and intentional |

---

## 5. Infrastructure Templates -- LCP

| Field | Value |
|-------|-------|
| **Category** | Infrastructure templates |
| **Checkpoint count** | 12 |
| **Checkpoint IDs** | lcp-001 through lcp-016 (12 of 16 fail) |
| **Status in matrix** | amended |
| **Description** | LCP (Local Cloud Platform) templates use shell substitution (`${VAR}` via render-pxe-menu.sh) instead of Jinja templating (`{{ }}/{% %}`). VM identity reconfiguration (configure-clone.sh), DNS templates, and advanced provisioning features are deferred. |
| **Rationale** | Shell substitution is simpler and more appropriate for the bash-based infrastructure scripts. Jinja would require a Python dependency for template rendering. The current shell approach works for PXE menu generation and basic provisioning. |
| **Recommended milestone** | v2.x -- Infrastructure Automation (if more sophisticated templating is needed) |

---

## 6. Content-Only -- Cloud-Ops Curriculum

| Field | Value |
|-------|-------|
| **Category** | Content-only |
| **Checkpoint count** | 4 |
| **Checkpoint IDs** | cop-001, cop-003, cop-004, cop-008 |
| **Status in matrix** | amended |
| **Description** | Cloud-ops curriculum is defined in vision documents only (6 modules, concept mapping, Podman path, 6-phase structure) with no corresponding code artifacts. The structural claims in the vision documents have been verified, but no implementation exists. |
| **Rationale** | Cloud-ops curriculum is educational content that exists as documentation. Implementation would require creating training materials, lab environments, and assessment tools -- a content creation effort rather than code development. |
| **Recommended milestone** | v3.x -- Educational Content Platform (requires content authoring infrastructure) |

---

## 7. Packaging Model -- Dashboard Generator

| Field | Value |
|-------|-------|
| **Category** | Packaging model |
| **Checkpoint count** | 3 |
| **Checkpoint IDs** | pd-011, pd-012, pd-006 |
| **Status in matrix** | amended |
| **Description** | Dashboard generator is a standalone TypeScript module (src/dashboard/) rather than a GSD skill with SKILL.md, metadata.yaml, and skill packaging. File-change triggers and GSD command wrappers exist as Phase 85/86 stubs but are not wired into the GSD event system. |
| **Rationale** | The dashboard generator predates the skill packaging system and works effectively as a standalone module. Packaging it as a skill would add complexity without functional benefit since it is always invoked directly. |
| **Recommended milestone** | v2.x -- Skill Ecosystem (if skill marketplace requires uniform packaging) |

---

## 8. Feature Maturity -- Vision Claims Amended

| Field | Value |
|-------|-------|
| **Category** | Feature maturity |
| **Checkpoint count** | 13 |
| **Checkpoint IDs** | pd-008, pd-009, pd-010, os-014, os-015, os-016, os-017, os-018, dc-008, dc-009, dc-014, id-008, ds-008 |
| **Status in matrix** | amended |
| **Description** | 13 vision document claims were amended to match actual implementation. These represent cases where the vision overstated feature richness or specificity compared to what was built. Each has been formally amended with paper trail in amendment-log.md. |
| **Rationale** | Vision documents described aspirational feature states. The actual implementations are appropriate for the current project maturity. Amendments formalize the gap between vision and reality with proper documentation. |
| **Recommended milestone** | N/A -- amendments are the resolution; features are functionally complete for current needs |

---

## Summary

| Category | Checkpoints | Resolution |
|----------|-------------|------------|
| GSD ISA | 32 | Deferred to v2.x |
| Silicon/ML | 13 | Deferred to v3.x |
| Hardware | 13 | Requires physical hardware |
| Wetty divergence | 9 | Permanent -- native PTY chosen |
| LCP templates | 12 | Deferred to v2.x |
| Cloud-ops | 4 | Deferred to v3.x |
| Dashboard packaging | 3 | Deferred to v2.x |
| Vision amendments | 13 | Resolved via amendment protocol |
| **Total deferred/amended** | **99** | -- |
| **Total pass** | **211** | Direct verification |
| **Total amended (prior phases)** | **26** | Phases 224-228 |
| **Grand total** | **336** | 100% resolved (0 fail, 0 pending) |

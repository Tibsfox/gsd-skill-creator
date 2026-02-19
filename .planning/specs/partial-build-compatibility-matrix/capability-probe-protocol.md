# Capability Probe Protocol

**Created:** 2026-02-19
**Purpose:** Structured readiness detection protocol enabling components to detect peer presence and maturity beyond binary filesystem checks. Defines a 3-tier detection hierarchy with JSON response schema and per-component marker paths.
**Requirements:** COMPAT-03 (structured probe response), COMPAT-04 (filesystem-presence detection)
**Status:** Protocol specification only -- implementation deferred to future milestone (IMPL-03)

---

## 1. Overview and Purpose

### Why Binary Filesystem Checks Are Insufficient

A simple `fs.existsSync('src/chipset/')` returns `true` -- but tells the caller nothing about:

- **Maturity state:** Is chipset fully implemented, partially built, or merely scaffolded?
- **Capability set:** Does this chipset build include team topologies? Agent routing? FPGA synthesis?
- **Version compatibility:** Is this chipset version compatible with the caller's expected interface?
- **Configuration state:** Is there an active `.chipset/chipset.yaml`, or just an empty directory?

Binary presence detection produces false positives (directory exists but component is non-functional) and provides no gradation between "absent" and "fully operational." Components need richer signals to make smart degradation decisions.

### The 3-Tier Detection Hierarchy

Each tier provides higher fidelity at the cost of more infrastructure:

| Tier | Name | Fidelity | Cost | Availability |
|------|------|----------|------|--------------|
| **Tier 1** | Filesystem-Presence | Low | Zero (directory existence check) | Always available |
| **Tier 2** | Configuration-Presence | Medium | Low (file existence + optional parse) | Available when component has config files |
| **Tier 3** | Structured Probe Response | High | Medium (requires probe implementation) | Available when IMPL-03 is implemented |

**Tiers are cumulative:** Tier 3 subsumes Tier 2, which subsumes Tier 1. A Tier 3 probe first verifies filesystem-presence (Tier 1), then checks configuration (Tier 2), then returns the full structured response.

### Specification Scope

This document defines the protocol, the detection hierarchy, the JSON response schema, and the per-component marker paths. It does NOT implement any detection code. The specification is precise enough that an implementer can build the complete detection system from this document alone.

---

## 2. Tier 1: Filesystem-Presence Detection (COMPAT-04)

### Standard Feature Flag Mechanism

Filesystem-presence detection is the lowest-cost, always-available detection tier. It answers one question: "Does this component have any physical footprint in the codebase?"

### Rules

1. **Check directory existence, NOT file contents** -- `fs.existsSync(markerPath)` only; no reading, parsing, or stat analysis
2. **Directory present = "at least partial"** -- presence does NOT confirm full functionality; it confirms the component is not absent
3. **Directory absent = "absent"** -- the component has no footprint in this build; all capabilities are unavailable
4. **This is the MINIMUM detection tier** -- always available, zero cost, no infrastructure required
5. **Multiple marker paths** -- some components have primary and secondary markers; primary is authoritative

### Per-Component Marker Paths

The 16 internal DAG nodes (excluding 4 external nodes: bootstrap, centos-guide, minecraft-world, space-between):

| Component | Node ID | Marker Path | What Presence Indicates |
|-----------|---------|-------------|------------------------|
| GSD Skill Creator | `skill-creator` | `src/` root + `package.json` exports | Core library exists; observation, detection, and skill pipelines have source |
| Chipset Architecture | `chipset` | `src/chipset/` | Chipset modules exist (blitter, copper, exec, integration, teams) |
| GSD-OS Desktop | `gsd-os` | `src-tauri/tauri.conf.json` | Desktop app scaffolded; Tauri backend configured |
| Planning Docs Dashboard | `planning-docs` | `src/dashboard/` | Dashboard module exists; parser, renderer, generator present |
| Dashboard Console | `dashboard-console` | `src/dashboard/console-page/` | Console subsystem exists within dashboard |
| Silicon Layer | `silicon` | `src/dashboard/silicon-panel/` | Silicon panel exists (visualization only; ML pipeline aspirational) |
| Staging Layer | `staging` | `src/dashboard/staging-queue-panel/` | Staging subsystem exists; queue panel and upload zone present |
| Amiga Architectural Leverage | `amiga-leverage` | `src/amiga/` | AMIGA modules exist (types, registry, envelope, ICD, MC1, ME1, CE1, GL1) |
| Local Cloud Provisioning | `lcp` | `infra/` | Infrastructure scripts exist; PXE boot, provisioning templates present |
| Cloud Operations Curriculum | `cloud-ops` | No marker (aspirational) | N/A until implemented -- define marker path when implementation begins |
| GSD Instruction Set Architecture | `gsd-isa` | No marker (aspirational) | N/A until implemented -- the AGC educational ISA (`src/agc/`) is a separate component; the GSD workflow ISA has no codebase footprint yet |
| BBS Educational Pack | `bbs-pack` | No marker (aspirational) | N/A until implemented -- define marker path when implementation begins |
| Amiga Creative Suite | `creative-suite` | No marker (aspirational) | N/A until implemented -- define marker path when implementation begins |
| Information Design System | `info-design` | `src/dashboard/design-system/` | Design system module exists; entity shapes, legend, typography present |
| Wetty + tmux Terminal Guide | `wetty-tmux` | N/A (permanently deferred) | Will not be built -- superseded by Tauri native PTY architecture |
| Amiga Workbench / Hardware I/O | `amiga-workbench` | `desktop/src/wm/` | Workbench UI layer exists within GSD-OS desktop (window manager, taskbar, pixel-art icons) |

### Marker Path Derivation

Marker paths are derived from the source directory evidence documented in node-inventory.md:

- **Implemented components** use their actual source directories (verified to exist in codebase)
- **Partial components** use the directory containing the most representative subset of functionality
- **Aspirational components** have no marker path defined -- the marker path MUST be defined when implementation begins, before the first commit to the component
- **Permanently deferred components** have no marker path and never will

### Detection Algorithm (Tier 1)

```
function detectPresence(nodeId: string): "present" | "absent" {
  const markerPath = MARKER_PATHS[nodeId]
  if (markerPath === null) return "absent"     // aspirational or deferred
  if (markerPath === "N/A") return "absent"    // permanently deferred
  return fs.existsSync(markerPath) ? "present" : "absent"
}
```

**Note:** This is pseudocode illustrating the algorithm, not implementation code.

---

## 3. Tier 2: Configuration-Presence Detection

### Mid-Fidelity Detection

Tier 2 goes beyond "does the directory exist?" to ask "is the component configured?" A component can have source files (Tier 1 passes) but lack configuration (Tier 2 fails), indicating it is scaffolded but not active.

### Per-Component Configuration Paths

Not all components have meaningful configuration files. Only those with distinct configuration artifacts are listed:

| Component | Node ID | Config Path | What Config Indicates |
|-----------|---------|-------------|---------------------|
| Chipset Architecture | `chipset` | `.chipset/chipset.yaml` | Active chipset definition with skill/agent/team declarations; component is configured, not just scaffolded |
| GSD-OS Desktop | `gsd-os` | `src-tauri/tauri.conf.json` | Tauri app configured with window settings, plugin declarations, and IPC permissions |
| Skill Creator | `skill-creator` | `.claude/commands/*.md` | Generated skills exist; skill-creator has produced at least one deliverable |
| Local Cloud Provisioning | `lcp` | `infra/scripts/render-pxe-menu.sh` | Provisioning scripts configured; PXE boot menu generation operational |
| Dashboard Console | `dashboard-console` | `src/console/milestone-config.ts` | Console has milestone configuration module; intake pipeline configured |
| Staging Layer | `staging` | `src/console/question-schema.ts` | Staging has question schema defined; intake validation configured |

### Rules

1. **Config existence implies configured, not just scaffolded** -- a component with source files but no config is "present but unconfigured" (effectively partial)
2. **Config files can be parsed for version or capability information** (Tier 2.5) -- reading `.chipset/chipset.yaml` to check for `skills.required` entries provides more detail than just checking file existence
3. **More reliable than directory existence** for distinguishing partial from full -- a chipset with source files but no `.chipset/chipset.yaml` is definitively partial
4. **Config detection is optional** -- Tier 2 is not required for all components; some components (amiga-leverage, info-design) are design philosophies with no separate config

### Detection Algorithm (Tier 2)

```
function detectConfiguration(nodeId: string): "configured" | "unconfigured" | "no-config-expected" {
  const configPath = CONFIG_PATHS[nodeId]
  if (configPath === undefined) return "no-config-expected"
  return fs.existsSync(configPath) ? "configured" : "unconfigured"
}
```

### Combined Tier 1 + Tier 2 States

| Tier 1 (Presence) | Tier 2 (Config) | Combined State |
|-------------------|-----------------|----------------|
| absent | N/A | **absent** -- component has no footprint |
| present | no-config-expected | **present** -- component exists; no config to check |
| present | unconfigured | **scaffolded** -- source exists but not configured |
| present | configured | **active** -- source exists and is configured |

---

## 4. Tier 3: Structured Probe Response (COMPAT-03)

### Highest-Fidelity Detection

Tier 3 provides the richest detection signal: a structured JSON response that includes component identity, version, maturity state, available capabilities, and exposed interfaces. This is the target protocol for runtime capability queries once IMPL-03 is implemented.

### JSON Response Schema

Based on the node-inventory status scheme and the Capability Probe Response Schema from 235-RESEARCH.md:

```yaml
# component-probe-response.schema.yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
title: "GSD Component Probe Response"
description: "Structured readiness signal returned by components when probed for capability detection"
type: object
required: [component, version, maturity]
properties:
  component:
    type: string
    description: "Node ID from ecosystem-deps.yaml (e.g., 'skill-creator', 'chipset')"
    pattern: "^[a-z][a-z0-9-]*$"
  version:
    type: string
    pattern: "^\\d+\\.\\d+\\.\\d+$"
    description: "Semantic version of the component build"
  maturity:
    type: string
    enum: [implemented, partial, aspirational, permanently-deferred, absent]
    description: "Status from node-inventory scheme -- matches DAG node status"
  capabilities:
    type: object
    description: "Map of capability names to boolean availability. Keys are component-specific."
    additionalProperties:
      type: boolean
  interfaces:
    type: object
    description: "Map of interface names to availability details. Values can be boolean, string, or object."
    additionalProperties: true
  tier1:
    type: object
    description: "Filesystem-presence detection result (embedded for traceability)"
    properties:
      marker_path:
        type: string
      present:
        type: boolean
  tier2:
    type: object
    description: "Configuration-presence detection result (embedded for traceability)"
    properties:
      config_path:
        type: [string, "null"]
      configured:
        type: boolean
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `component` | string | Node ID from ecosystem-deps.yaml |
| `version` | string | Semantic version (e.g., "1.25.0") |
| `maturity` | enum | One of: implemented, partial, aspirational, permanently-deferred, absent |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `capabilities` | object | Boolean map of named capabilities this component currently provides |
| `interfaces` | object | Map of interface names to availability details |
| `tier1` | object | Embedded Tier 1 detection result for audit trail |
| `tier2` | object | Embedded Tier 2 detection result for audit trail |

### Example Probe Responses

Four representative components, one per layer (Core, Middleware, Platform, Educational), showing how the response changes across maturity states.

#### Example 1: skill-creator (Core Layer) -- Implemented

```json
{
  "component": "skill-creator",
  "version": "1.24.0",
  "maturity": "implemented",
  "capabilities": {
    "observation": true,
    "detection": true,
    "suggestion": true,
    "composition": true,
    "co-activation": true,
    "session-observer": true,
    "gsd-orchestrator": true,
    "bounded-learning": true
  },
  "interfaces": {
    "skill-loading-pipeline": "6-stage",
    "session-observer": true,
    "gsd-orchestrator": true,
    "skill-metadata-format": "metadata.yaml",
    "agent-composition": true,
    "pattern-detection": true
  },
  "tier1": {
    "marker_path": "src/",
    "present": true
  },
  "tier2": {
    "config_path": ".claude/commands/*.md",
    "configured": true
  }
}
```

**skill-creator at "absent" state** (hypothetical -- if skill-creator were removed):

```json
{
  "component": "skill-creator",
  "version": "0.0.0",
  "maturity": "absent",
  "capabilities": {
    "observation": false,
    "detection": false,
    "suggestion": false,
    "composition": false,
    "co-activation": false,
    "session-observer": false,
    "gsd-orchestrator": false,
    "bounded-learning": false
  },
  "interfaces": {},
  "tier1": {
    "marker_path": "src/",
    "present": false
  },
  "tier2": {
    "config_path": ".claude/commands/*.md",
    "configured": false
  }
}
```

#### Example 2: chipset (Middleware Layer) -- Partial

Current state probe response:

```json
{
  "component": "chipset",
  "version": "1.24.0",
  "maturity": "partial",
  "capabilities": {
    "skill-loading": true,
    "agent-routing": true,
    "team-topologies": true,
    "blitter": true,
    "copper": true,
    "exec": true,
    "asic-prebuilt-library": false,
    "community-chipset-registry": false,
    "fpga-synthesis": false,
    "runtime-validation": false
  },
  "interfaces": {
    "chipset-yaml": ".chipset/chipset.yaml",
    "skill-loading-pipeline": true,
    "agent-topology": true,
    "token-budget-weight": true,
    "chipset-overview-panel": false
  },
  "tier1": {
    "marker_path": "src/chipset/",
    "present": true
  },
  "tier2": {
    "config_path": ".chipset/chipset.yaml",
    "configured": true
  }
}
```

**chipset at "implemented" state** (future -- all features built):

```json
{
  "component": "chipset",
  "version": "2.0.0",
  "maturity": "implemented",
  "capabilities": {
    "skill-loading": true,
    "agent-routing": true,
    "team-topologies": true,
    "blitter": true,
    "copper": true,
    "exec": true,
    "asic-prebuilt-library": true,
    "community-chipset-registry": true,
    "fpga-synthesis": true,
    "runtime-validation": true
  },
  "interfaces": {
    "chipset-yaml": ".chipset/chipset.yaml",
    "skill-loading-pipeline": true,
    "agent-topology": true,
    "token-budget-weight": true,
    "chipset-overview-panel": true,
    "intent-classifier": true
  },
  "tier1": {
    "marker_path": "src/chipset/",
    "present": true
  },
  "tier2": {
    "config_path": ".chipset/chipset.yaml",
    "configured": true
  }
}
```

#### Example 3: gsd-os (Platform Layer) -- Partial

Current state probe response:

```json
{
  "component": "gsd-os",
  "version": "1.24.0",
  "maturity": "partial",
  "capabilities": {
    "tauri-desktop-shell": true,
    "native-pty": true,
    "file-watcher": true,
    "ipc-bridge": true,
    "webgl-crt-engine": true,
    "indexed-palette": true,
    "window-manager": true,
    "taskbar": true,
    "calibration-wizard": true,
    "amiga-boot-sequence": true,
    "block-based-interaction": false,
    "educational-curriculum": false,
    "kit-builder-projects": false,
    "progressive-depth-levels": false,
    "blueprint-sharing": false
  },
  "interfaces": {
    "tauri-ipc": true,
    "xterm-terminal": true,
    "tmux-binding": true,
    "claude-integration": true,
    "dashboard-embedding": true,
    "webgl-renderer": true,
    "curriculum-framework": false
  },
  "tier1": {
    "marker_path": "src-tauri/tauri.conf.json",
    "present": true
  },
  "tier2": {
    "config_path": "src-tauri/tauri.conf.json",
    "configured": true
  }
}
```

**gsd-os at "absent" state** (no desktop app):

```json
{
  "component": "gsd-os",
  "version": "0.0.0",
  "maturity": "absent",
  "capabilities": {
    "tauri-desktop-shell": false,
    "native-pty": false,
    "file-watcher": false,
    "ipc-bridge": false,
    "webgl-crt-engine": false,
    "indexed-palette": false,
    "window-manager": false,
    "taskbar": false,
    "calibration-wizard": false,
    "amiga-boot-sequence": false,
    "block-based-interaction": false,
    "educational-curriculum": false,
    "kit-builder-projects": false,
    "progressive-depth-levels": false,
    "blueprint-sharing": false
  },
  "interfaces": {},
  "tier1": {
    "marker_path": "src-tauri/tauri.conf.json",
    "present": false
  },
  "tier2": {
    "config_path": "src-tauri/tauri.conf.json",
    "configured": false
  }
}
```

#### Example 4: bbs-pack (Educational Layer) -- Aspirational

Current state probe response:

```json
{
  "component": "bbs-pack",
  "version": "0.0.0",
  "maturity": "aspirational",
  "capabilities": {
    "modem-simulator": false,
    "ansi-art-renderer": false,
    "bbs-main-menu": false,
    "door-games": false,
    "mud-muck-interface": false,
    "fidonet-simulation": false,
    "student-player-toggle": false
  },
  "interfaces": {},
  "tier1": {
    "marker_path": null,
    "present": false
  },
  "tier2": {
    "config_path": null,
    "configured": false
  }
}
```

**bbs-pack at "partial" state** (future -- modem simulator and ANSI renderer built):

```json
{
  "component": "bbs-pack",
  "version": "3.0.0",
  "maturity": "partial",
  "capabilities": {
    "modem-simulator": true,
    "ansi-art-renderer": true,
    "bbs-main-menu": true,
    "door-games": false,
    "mud-muck-interface": false,
    "fidonet-simulation": false,
    "student-player-toggle": false
  },
  "interfaces": {
    "educational-module-format": "skill-creator-pack",
    "xterm-terminal": true,
    "modem-shared-component": true
  },
  "tier1": {
    "marker_path": "src/bbs/",
    "present": true
  },
  "tier2": {
    "config_path": null,
    "configured": false
  }
}
```

**bbs-pack at "implemented" state** (future -- all features built):

```json
{
  "component": "bbs-pack",
  "version": "3.5.0",
  "maturity": "implemented",
  "capabilities": {
    "modem-simulator": true,
    "ansi-art-renderer": true,
    "bbs-main-menu": true,
    "door-games": true,
    "mud-muck-interface": true,
    "fidonet-simulation": true,
    "student-player-toggle": true
  },
  "interfaces": {
    "educational-module-format": "skill-creator-pack",
    "xterm-terminal": true,
    "modem-shared-component": true,
    "door-game-api": true,
    "fidonet-protocol": true
  },
  "tier1": {
    "marker_path": "src/bbs/",
    "present": true
  },
  "tier2": {
    "config_path": ".chipset/bbs-educational.chipset.yaml",
    "configured": true
  }
}
```

### Maturity State Definitions

The `maturity` field uses the node-inventory status scheme. The following definitions govern how maturity maps to probe response content:

| Maturity | Definition | Capabilities Behavior | Interfaces Behavior |
|----------|------------|----------------------|---------------------|
| **implemented** | All planned features built and tested | All capability flags `true` | All interfaces listed |
| **partial** | Some features built, some missing | Mix of `true` and `false` flags | Only available interfaces listed |
| **aspirational** | Vision documented, no implementation | All capability flags `false` | Empty object `{}` |
| **permanently-deferred** | Architectural decision not to build | N/A -- probe returns error or absent | N/A |
| **absent** | Component not present in this build | All capability flags `false` | Empty object `{}` |

**Distinction between "aspirational" and "absent":**
- **aspirational** = the component is known to the ecosystem, has a vision document, and is planned for a future milestone, but has zero implementation
- **absent** = the component is not present in this particular build (could be implemented elsewhere but excluded from this build)

In practice, during the v1.25 era, aspirational and absent produce identical probe responses. The distinction matters for UI: an aspirational component can show "planned for M3" while an absent component shows "not included."

---

## 5. Detection Hierarchy Summary

### How the 3 Tiers Compose

The tiers are **cumulative** (Tier 3 includes Tier 2 includes Tier 1), not alternatives. A consumer always starts at Tier 1 and optionally escalates:

```
Step 1: Tier 1 -- Filesystem-Presence (always available, zero cost)
  |
  |-- absent? --> STOP. Component is absent. No further detection needed.
  |-- present? --> Continue to Step 2 (optional)
  |
Step 2: Tier 2 -- Configuration-Presence (if component has config files)
  |
  |-- unconfigured? --> Component is "scaffolded" -- source exists but not active.
  |-- configured? --> Component is "active" -- continue to Step 3 (optional)
  |-- no-config-expected? --> Skip to Step 3 (optional)
  |
Step 3: Tier 3 -- Structured Probe (if IMPL-03 is implemented)
  |
  |-- Read probe response for version, maturity, capabilities, interfaces
  |-- Full capability-aware degradation decisions possible
```

### Decision Table for Consumers

| What You Need to Know | Minimum Tier | Example |
|----------------------|-------------|---------|
| "Does X exist at all?" | Tier 1 | `fs.existsSync('src/chipset/')` |
| "Is X configured and active?" | Tier 2 | Check for `.chipset/chipset.yaml` |
| "Does X support capability Y at version Z?" | Tier 3 | Parse probe response `capabilities.fpga-synthesis` |
| "What version of X is running?" | Tier 3 | Parse probe response `version` field |
| "Should I degrade gracefully for X?" | Tier 1 (minimum) | Absent = full degradation; present = check Tier 2/3 for detail |

### Tier Availability by Component

| Component | Tier 1 | Tier 2 | Tier 3 (future) |
|-----------|--------|--------|-----------------|
| skill-creator | `src/` | `.claude/commands/*.md` | Probe response |
| chipset | `src/chipset/` | `.chipset/chipset.yaml` | Probe response |
| gsd-os | `src-tauri/tauri.conf.json` | `src-tauri/tauri.conf.json` | Probe response |
| planning-docs | `src/dashboard/` | N/A | Probe response |
| dashboard-console | `src/dashboard/console-page/` | `src/console/milestone-config.ts` | Probe response |
| silicon | `src/dashboard/silicon-panel/` | N/A | Probe response |
| staging | `src/dashboard/staging-queue-panel/` | `src/console/question-schema.ts` | Probe response |
| amiga-leverage | `src/amiga/` | N/A | Probe response |
| lcp | `infra/` | `infra/scripts/render-pxe-menu.sh` | Probe response |
| cloud-ops | No marker yet | N/A | Probe response |
| gsd-isa | No marker yet | N/A | Probe response |
| bbs-pack | No marker yet | N/A | Probe response |
| creative-suite | No marker yet | N/A | Probe response |
| info-design | `src/dashboard/design-system/` | N/A | Probe response |
| wetty-tmux | N/A (deferred) | N/A | N/A |
| amiga-workbench | `desktop/src/wm/` | N/A | Probe response |

### Fallback Behavior

When a higher tier is unavailable, fall back to the highest available tier:

- **Tier 3 unavailable** (pre-IMPL-03): Use Tier 2 if component has config, otherwise use Tier 1
- **Tier 2 not applicable** (no config for this component): Use Tier 1 directly
- **Tier 1 marker undefined** (aspirational component): Treat as absent

### Current State Summary (v1.25)

As of v1.25, only Tier 1 and Tier 2 are available (Tier 3 requires IMPL-03 implementation). The current ecosystem state:

| Component | Tier 1 Result | Tier 2 Result | Effective State |
|-----------|--------------|--------------|-----------------|
| skill-creator | present | configured | **active** (implemented) |
| chipset | present | configured | **active** (partial) |
| gsd-os | present | configured | **active** (partial) |
| planning-docs | present | N/A | **present** (implemented) |
| dashboard-console | present | configured | **active** (partial) |
| silicon | present | N/A | **present** (aspirational -- panel only) |
| staging | present | configured | **active** (partial) |
| amiga-leverage | present | N/A | **present** (implemented) |
| lcp | present | configured | **active** (partial) |
| cloud-ops | absent | N/A | **absent** (aspirational) |
| gsd-isa | absent | N/A | **absent** (aspirational) |
| bbs-pack | absent | N/A | **absent** (aspirational) |
| creative-suite | absent | N/A | **absent** (aspirational) |
| info-design | present | N/A | **present** (implemented) |
| wetty-tmux | absent | N/A | **absent** (permanently deferred) |
| amiga-workbench | present | N/A | **present** (partial) |

---

## 6. Implementation Notes

### Deferred to Future Milestone

Implementation of this protocol is deferred to a future milestone (IMPL-03 in REQUIREMENTS.md future requirements). This document is a specification only.

### Recommended Implementation Approach

When IMPL-03 is implemented:

1. **Tier 1 (Filesystem-Presence):** Can be implemented immediately in any TypeScript code using `fs.existsSync(markerPath)`. The marker paths in this document are the authoritative source. No new infrastructure required.

2. **Tier 2 (Configuration-Presence):** Can be implemented alongside Tier 1 using the same `fs.existsSync(configPath)` pattern. Optional Tier 2.5 parsing (reading config files for version/capability data) uses existing parsers (YAML for chipset, JSON for Tauri).

3. **Tier 3 (Structured Probe):** Should be implemented as part of the EventDispatcher subscriber registration protocol (defined in Phase 232 eventdispatcher-spec.md). Each subscriber provides its probe response when registering with the EventDispatcher. This approach:
   - Avoids a separate probe mechanism -- subscribers already register
   - Keeps probe responses current -- updated at registration time
   - Enables runtime discovery -- the EventDispatcher knows all registered subscribers and their capabilities
   - Follows the existing subscriber protocol pattern rather than inventing new infrastructure

### Probe Response Storage

When Tier 3 is implemented, probe responses should be accessible via:

- **Runtime API:** `EventDispatcher.getSubscriberProbe(nodeId)` -- returns the probe response for a registered subscriber
- **Filesystem cache:** `.gsd/probes/{node-id}.json` -- cached probe response for offline or pre-EventDispatcher access
- **Embedded in config:** Components MAY embed their probe response in their existing config file (e.g., a `_probe` key in `.chipset/chipset.yaml`)

### Versioning the Protocol

This specification is version 1.0. Future versions:

- **1.x:** Backward-compatible additions (new optional fields in probe response)
- **2.0:** Breaking changes (field renames, type changes, removed fields)

The probe response itself does not carry a protocol version field. The protocol version is implicit in the schema version. When IMPL-03 is implemented, the schema file (`component-probe-response.schema.yaml`) should be versioned alongside the codebase.

---

## Appendix: Relationship to Other Phase 235 Deliverables

| Deliverable | Relationship to This Protocol |
|-------------|------------------------------|
| compatibility-matrix.md (Plan 01) | Matrix entries reference maturity states defined here; edge degradation behavior depends on probe results |
| degradation-specs.md (Plan 02) | Degradation decisions use Tier 1/2/3 results to determine which degradation path to follow |
| standalone-modes.md (Plan 02) | Standalone detection starts with Tier 1 (all peers absent) |
| known-issues-cross-reference.md (Plan 01) | Known-issues categories map to maturity states (aspirational, permanently-deferred) used in probe responses |

# Amendment Log

**Phase:** 229 - Documentation & Amendments
**Purpose:** Formally resolve all conformance matrix failures by amending vision claims to match actual implementation, with full paper trail per the amendment protocol (AMEND-02).

**Protocol:** Each entry records checkpoint ID, original claim, actual state, resolution, and updated specification text.

---

## T2 Amendments (9 checkpoints)

### 1. pd-008 -- Semantic HTML5 Elements

| Field | Value |
|-------|-------|
| **Checkpoint** | pd-008 |
| **Tier** | T2 |
| **Section** | Structured Data: Semantic HTML5 |
| **Original claim** | Generated HTML uses semantic elements throughout: article, section, nav, aside, time, progress, details |
| **Actual state** | renderer.ts renderLayout() generates header, main, footer, nav (HTML5 structural elements). No article, section, aside, time, or progress elements. Only details used in deviation-summary.ts. 4 of 7 claimed semantic elements missing. |
| **Resolution** | Vision overstated HTML5 semantic richness. Actual implementation uses appropriate structural elements for a dashboard application. The elements used (header, main, footer, nav, details) are the correct HTML5 structural elements for this type of application. |
| **Updated specification** | Generated HTML uses HTML5 structural elements: header, main, footer, nav for page layout, and details for expandable sections. |

---

### 2. pd-009 -- JSON-LD Schema Types

| Field | Value |
|-------|-------|
| **Checkpoint** | pd-009 |
| **Tier** | T2 |
| **Section** | Structured Data: JSON-LD Structured Data |
| **Original claim** | JSON-LD Schema.org types embedded: Dashboard (SoftwareSourceCode+Project), Requirements (TechArticle), Roadmap (HowTo with HowToStep), Milestones (CreativeWork/Action), State (StatusUpdate) |
| **Actual state** | structured-data.ts implements SoftwareSourceCode (project index), ItemList (milestones), ItemList (roadmap). Requirements, State, and Console pages have no JSON-LD. 3 of 5 claimed types missing; roadmap uses ItemList instead of HowTo. |
| **Resolution** | Vision specified aspirational schema types. Actual implementation provides structured data for the three most important pages using appropriate Schema.org types (SoftwareSourceCode for code project metadata, ItemList for sequential data). |
| **Updated specification** | JSON-LD Schema.org types embedded on 3 pages: project index (SoftwareSourceCode), milestones (ItemList), roadmap (ItemList). |

---

### 3. os-014 -- Block Types

| Field | Value |
|-------|-------|
| **Checkpoint** | os-014 |
| **Tier** | T2 |
| **Section** | The Block System |
| **Original claim** | Six block types exist: Skill, Agent, Team, Trigger, Budget, Flow -- each with a distinct visual shape encoding its type |
| **Actual state** | Block definitions exist in src/agc/pack/block-definitions.ts with 5 AGC block types: agc-cpu, agc-dsky, agc-peripheral-bus, agc-executive-monitor, agc-assembly-editor. These are domain-specific AGC educational blocks, not the generic GSD workflow blocks described in the vision. Dashboard entity-shapes.ts defines 6 EntityTypes with distinct SVG shapes for visualization. |
| **Resolution** | The block system was implemented for AGC educational purposes rather than generic GSD workflow composition. The 5 AGC blocks serve the educational pack; dashboard entity-shapes provide 6 visualization types. The vision's generic workflow blocks are a future feature. |
| **Updated specification** | Block system provides 5 AGC educational block types (cpu, dsky, peripheral-bus, executive-monitor, assembly-editor) with typed ports. Dashboard entity-shapes provide 6 visualization types (agent, skill, team, milestone, adapter, plan) with distinct SVG shapes. |

---

### 4. os-015 -- Typed Ports with Color-Coded Wires

| Field | Value |
|-------|-------|
| **Checkpoint** | os-015 |
| **Tier** | T2 |
| **Section** | Block Connections |
| **Original claim** | Blocks connect through typed ports with color-coded wire system (cyan=context, amber=config, green=data, magenta=observation, red=error) |
| **Actual state** | AGC blocks define typed inputs/outputs (word15, address12, clock_signal, interrupt_vector) but no visual wire connection system with color coding exists. No block connection rendering, port snapping, or wire drawing code exists. Dashboard gantry-panel provides read-only topology visualization. |
| **Resolution** | AGC blocks have typed port definitions for educational simulation purposes. The interactive color-coded wire editor described in the vision is unimplemented. Typed port definitions exist at the data level. |
| **Updated specification** | AGC blocks define typed input/output ports (word15, address12, clock_signal, interrupt_vector) for simulation. No interactive wire editor; topology visualization is read-only via dashboard gantry-panel. |

---

### 5. os-016 -- Invalid Connection Bounce

| Field | Value |
|-------|-------|
| **Checkpoint** | os-016 |
| **Tier** | T2 |
| **Section** | Block Connections |
| **Original claim** | Invalid block connections do not snap -- block bounces back and tooltip explains the mismatch |
| **Actual state** | No block connection drag/snap/bounce-back system exists. AGC block definitions have typed ports but no runtime connection validation, tooltip display, or bounce-back animation. |
| **Resolution** | The interactive block editor with drag-and-drop connection validation is an unimplemented vision feature. Block type definitions exist but no editor UI connects them. |
| **Updated specification** | Block type safety enforced at definition level via typed ports. No interactive drag-and-drop block editor; connection validation is structural, not visual. |

---

### 6. os-017 -- Blueprint YAML Format

| Field | Value |
|-------|-------|
| **Checkpoint** | os-017 |
| **Tier** | T2 |
| **Section** | Blueprints |
| **Original claim** | Blueprint YAML format is defined and a parser/serializer exists for import/export |
| **Actual state** | No Blueprint type, blueprint YAML format definition, or parser/serializer exists. AGC pack has block definitions and a manifest but no blueprint concept. Chipset YAML defines skill/agent/team routing, not blueprint layouts. |
| **Resolution** | Blueprint YAML is an unimplemented vision feature. The chipset YAML (.chipset/) serves a related but different purpose (skill/agent/team routing and budget configuration). |
| **Updated specification** | No blueprint YAML format. Chipset YAML (.chipset/) provides declarative skill/agent/team routing and budget configuration. Block compositions are defined programmatically via AGC pack manifests. |

---

### 7. os-018 -- Blueprint Import Through Staging

| Field | Value |
|-------|-------|
| **Checkpoint** | os-018 |
| **Tier** | T2 |
| **Section** | Blueprints |
| **Original claim** | Blueprint import passes through staging layer hygiene check before import |
| **Actual state** | Staging layer provides comprehensive hygiene system (scanner, scope-coherence, trust-store, finding-actions, patterns) and intake flow, but processes skill content (SKILL.md files), not blueprints. No blueprint-specific intake or import flow exists. |
| **Resolution** | The staging hygiene system is fully implemented for skill content. Blueprint import was never implemented as blueprints themselves do not exist. The staging layer's hygiene patterns apply to skill intake, which is the actual content pipeline. |
| **Updated specification** | Staging layer hygiene checks apply to skill content intake (SKILL.md files). No blueprint import pathway; skill content is the validated intake pipeline. |

---

### 8. dc-008 -- Question Types Count

| Field | Value |
|-------|-------|
| **Checkpoint** | dc-008 |
| **Tier** | T2 |
| **Section** | The Question-Response System |
| **Original claim** | Seven question types are supported: binary (two buttons), choice (radio), multi-select (checkboxes), text input, confirmation, priority (drag-and-drop rank), and file (upload zone) |
| **Actual state** | question-schema.ts QuestionSchema.type is z.enum(["binary", "choice", "multi-select", "text", "confirmation"]). 5 types implemented. Priority (drag-and-drop rank) and file (upload zone) types are not defined. question-poller.ts renderQuestionResponseScript() handles the 5 implemented types only. |
| **Resolution** | 5 of 7 claimed question types are implemented. Priority and file types were aspirational; the 5 implemented types cover all question patterns used by GSD sessions in practice. |
| **Updated specification** | Five question types supported: binary (two buttons), choice (radio), multi-select (checkboxes), text input, and confirmation. |

---

### 9. dc-009 -- Question Poll Interval

| Field | Value |
|-------|-------|
| **Checkpoint** | dc-009 |
| **Tier** | T2 |
| **Section** | The Question-Response System |
| **Original claim** | Questions written by Claude session appear in dashboard within 3 seconds of being emitted (poll interval) |
| **Actual state** | question-poller.ts QuestionPoller.poll() is a server-side directory scan. No client-side 3-second polling mechanism. Auto-refresh system (refresh.ts) defaults to 5000ms (5 seconds). Dashboard is statically generated and updates via --live mode at 5s intervals or manually. |
| **Resolution** | The actual refresh interval is 5 seconds (page-level), not 3 seconds (question-specific). The 5-second interval provides adequate responsiveness for the human-in-the-loop interaction pattern. |
| **Updated specification** | Dashboard auto-refresh interval is 5 seconds (page-level) in live mode. Questions appear on next refresh cycle. |

---

## T3 Amendments (4 checkpoints)

*To be added in Task 2.*

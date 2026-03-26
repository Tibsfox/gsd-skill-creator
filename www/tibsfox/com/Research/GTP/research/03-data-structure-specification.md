# Data Structure Specification

## Table of Contents

- [Overview](#overview)
- [Design Philosophy](#design-philosophy)
- [Core Type System](#core-type-system)
- [Enumeration Types](#enumeration-types)
- [Room Interface](#room-interface)
- [Panel Interface](#panel-interface)
- [Panel Content Interface](#panel-content-interface)
- [Try Session Interface](#try-session-interface)
- [Tool Hook Interface](#tool-hook-interface)
- [Thread Connection Interface](#thread-connection-interface)
- [Network Node Interface](#network-node-interface)
- [Quote Interface](#quote-interface)
- [Source Reference Interface](#source-reference-interface)
- [Visualization Interfaces](#visualization-interfaces)
- [Creative DNA Study Template Interface](#creative-dna-study-template-interface)
- [Data Relationships](#data-relationships)
- [Validation Rules](#validation-rules)
- [Sample Data](#sample-data)
- [Cross-References](#cross-references)

---

## Overview

The Inclusionary Wave Educational Module is defined by a set of TypeScript interfaces that describe every structural element: rooms, panels, Try Sessions, threads, network nodes, and visualizations. These interfaces serve as the contract between the content layer (research-derived educational material) and the rendering layer (HTML/SVG/D3 presentation).

This specification defines every interface, documents the relationships between types, establishes validation rules, and provides sample data for implementation.

> "TypeScript interfaces compile without errors and cover all data structures." -- Success Criterion 9, GTP Mission Package

---

## Design Philosophy

### Principles

1. **Content-first.** Interfaces describe educational content, not UI widgets. The rendering layer consumes these structures; it does not define them.
2. **Source-traceable.** Every content-bearing interface includes a `sources` array linking to Phase 1 bibliography entries.
3. **Progressive disclosure.** Content interfaces distinguish between immediate-display content and disclosed-on-demand content.
4. **Thread-aware.** Every panel carries its thread connections, enabling cross-room navigation without a separate routing layer.
5. **Fallback-capable.** Tool integrations specify text-only fallbacks for environments where GSD-Tracker or D3.js is unavailable.

### Naming Conventions

- Interfaces use PascalCase: `Room`, `Panel`, `TrySession`
- Enums use PascalCase with UPPER_CASE members: `RoomId.WORKSHOP`
- Properties use camelCase: `sourceModule`, `trySession`
- IDs use kebab-case strings: `'r1-p1-cocu'`, `'workshop'`

---

## Core Type System

### Type Hierarchy

```
Module (root)
  +-- Room[]
  |     +-- Panel[]
  |     |     +-- PanelContent
  |     |     |     +-- Quote[]
  |     |     |     +-- DataPoint[]
  |     |     +-- ThreadConnection[]
  |     |     +-- SourceRef[]
  |     +-- TrySession
  |           +-- ToolHook?
  +-- NetworkNode[] (Room 3 specific)
  +-- ThreadConnection[] (aggregated cross-room)
```

### Dependency Graph

```
RoomId (enum) <── Room, Panel, TrySession, ThreadConnection
ThreadType (enum) <── ThreadConnection
Room ──> Panel[], TrySession
Panel ──> PanelContent, ThreadConnection[], SourceRef[]
PanelContent ──> Quote[], DataPoint[]
TrySession ──> ToolHook?
ToolHook ──> (standalone)
NetworkNode ──> (standalone, Room 3)
```

---

## Enumeration Types

### RoomId

Identifies the five rooms in the module. Used as foreign key across panels, Try Sessions, and thread connections.

```typescript
enum RoomId {
  WORKSHOP = 'workshop',   // Room 1: Origins
  SOUND    = 'sound',      // Room 2: Discography
  NETWORK  = 'network',    // Room 3: Creative Connections
  RIPPLE   = 'ripple',     // Room 4: Post-GT Trajectories
  LABEL    = 'label'       // Room 5: Luaka Bop / Curatorial Practice
}
```

| Value | Room | Source Module | Panel Count |
|-------|------|-------------|-------------|
| `workshop` | The Workshop | M1: Origins | 3 |
| `sound` | The Sound | M2: Discography | 4 |
| `network` | The Network | M3: Creative Network | 4 |
| `ripple` | The Ripple | M4: Trajectories | 3 |
| `label` | The Label | M5: Cultural Context | 2 |

### ThreadType

Identifies the three navigation threads that cross-cut the room structure.

```typescript
enum ThreadType {
  INFLUENCE = 'influence',   // Creative DNA connections
  TIMELINE  = 'timeline',   // Chronological navigation
  CONCEPT   = 'concept'     // Inclusionary aesthetics principles
}
```

| Value | Description | Example Path |
|-------|-------------|-------------|
| `influence` | Traces creative DNA across rooms | R2-P1 (Rogers produces Grand Opening) to R3-P1 (Rogers transformed) |
| `timeline` | Chronological event sequence | R1-P2 (signing) to R2-P1 (Grand Opening 1994) to R2-P2 (Sacred Cow 1996) |
| `concept` | Tracks inclusionary aesthetics principle | R1-P1 (CoCu inclusion) to R2-P4 (sonic inclusion) to R5-P2 (curatorial inclusion) |

---

## Room Interface

The top-level structural unit. Each room contains panels and a Try Session, maps to a single Phase 1 source module, and is framed by a one-sentence premise.

```typescript
interface Room {
  id: RoomId;
  title: string;
  premise: string;          // One-sentence framing question
  panels: Panel[];
  trySession: TrySession;
  sourceModule: string;     // Phase 1 module reference (e.g., 'M1')
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `RoomId` | Yes | Unique room identifier from the `RoomId` enum |
| `title` | `string` | Yes | Display title (e.g., "The Workshop") |
| `premise` | `string` | Yes | One-sentence pedagogical framing question |
| `panels` | `Panel[]` | Yes | Array of 2-4 panels within this room |
| `trySession` | `TrySession` | Yes | Hands-on exercise associated with this room |
| `sourceModule` | `string` | Yes | Phase 1 module ID (e.g., "M1", "M2") |

### Constraints

- Every room must have at least 2 panels and at most 4 panels
- Every room must have exactly 1 Try Session
- The `sourceModule` must reference a valid Phase 1 module identifier
- The `premise` should be phrased as a statement that frames a question

---

## Panel Interface

A focused exploration within a room. Panels contain the core educational content -- narrative, quotes, data points, and deep dives -- plus thread connections for cross-room navigation.

```typescript
interface Panel {
  id: string;               // e.g., 'r1-p1-cocu'
  room: RoomId;
  title: string;
  subtitle: string;
  content: PanelContent;
  threads: ThreadConnection[];
  sources: SourceRef[];     // Phase 1 bibliography entries
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique panel identifier (kebab-case, room-prefixed) |
| `room` | `RoomId` | Yes | Parent room identifier |
| `title` | `string` | Yes | Panel title (e.g., "CoCu: The Anti-Band") |
| `subtitle` | `string` | Yes | Explanatory subtitle |
| `content` | `PanelContent` | Yes | Structured content object |
| `threads` | `ThreadConnection[]` | Yes | Cross-room thread connections (may be empty) |
| `sources` | `SourceRef[]` | Yes | Bibliography entries supporting this panel's claims |

### Panel ID Convention

Panel IDs follow the pattern: `r{room_number}-p{panel_number}-{slug}`

| Room | Panel IDs |
|------|-----------|
| R1 | `r1-p1-cocu`, `r1-p2-demo-tapes`, `r1-p3-jazz-root` |
| R2 | `r2-p1-grand-opening`, `r2-p2-sacred-cow`, `r2-p3-into-the-oh`, `r2-p4-unconventional-toolkit` |
| R3 | `r3-p1-susan-rogers`, `r3-p2-pamelia-theremin`, `r3-p3-byrne-curator`, `r3-p4-constellation-map` |
| R4 | `r4-p1-pomona-to-hello`, `r4-p2-quiet-craftsman`, `r4-p3-chart-that-lies` |
| R5 | `r5-p1-sri-lankan-tea`, `r5-p2-american-exception` |

---

## Panel Content Interface

The structured content within a panel, designed for progressive disclosure.

```typescript
interface PanelContent {
  narrative: string;        // Main prose (first paragraph visible by default)
  pullQuotes: Quote[];      // Key quotes with attribution
  dataPoints: DataPoint[];  // Verifiable facts with source refs
  deepDive?: string;        // Extended content (disclosed on request)
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `narrative` | `string` | Yes | Main prose content. The first paragraph is displayed at panel level; full text at deep-dive level. |
| `pullQuotes` | `Quote[]` | Yes | Direct quotations with speaker, source, and optional year. May be empty. |
| `dataPoints` | `DataPoint[]` | Yes | Verifiable facts. Each data point includes a value and source reference. |
| `deepDive` | `string` | No | Extended analysis content, disclosed only when user requests it. |

### DataPoint Interface

```typescript
interface DataPoint {
  label: string;            // What is being measured/stated
  value: string;            // The specific fact
  source: string;           // Source reference ID
  verified: boolean;        // Has this been verified against Phase 1?
}
```

### Progressive Disclosure Behavior

| Disclosure Level | Visible Content |
|-----------------|-----------------|
| **Room view** | Panel title + subtitle only |
| **Panel view** | First paragraph of `narrative` + `pullQuotes` + `dataPoints` table |
| **Deep dive** | Full `narrative` + `deepDive` + complete source list |

---

## Try Session Interface

A hands-on experiential exercise associated with each room. Try Sessions put tools in users' hands to practice the concepts taught in the room's panels.

```typescript
interface TrySession {
  id: string;
  room: RoomId;
  title: string;
  description: string;
  instructions: string[];
  toolIntegration?: ToolHook;  // GSD-Tracker, D3, SVG scaffold
  estimatedMinutes: number;
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique Try Session identifier (e.g., `'ts-workshop'`) |
| `room` | `RoomId` | Yes | Parent room identifier |
| `title` | `string` | Yes | Exercise title (e.g., "The Workshop Exercise") |
| `description` | `string` | Yes | One-paragraph description of the exercise |
| `instructions` | `string[]` | Yes | Ordered list of step-by-step instructions |
| `toolIntegration` | `ToolHook` | No | Tool configuration if exercise requires external tool |
| `estimatedMinutes` | `number` | Yes | Estimated completion time in minutes |

### Try Session Inventory

| ID | Room | Title | Tool | Minutes |
|----|------|-------|------|---------|
| `ts-workshop` | WORKSHOP | The Workshop Exercise | GSD-Tracker | 15-20 |
| `ts-found-sound` | SOUND | The Found Sound Session | GSD-Tracker | 20-25 |
| `ts-constellation` | NETWORK | The Constellation Exercise | SVG/D3 | 15-20 |
| `ts-two-charts` | RIPPLE | The Two Charts | D3.js | 20-30 |
| `ts-label` | LABEL | The Label Exercise | None | 15-20 |

---

## Tool Hook Interface

Configuration for external tool integration in Try Sessions.

```typescript
interface ToolHook {
  tool: 'gsd-tracker' | 'd3-viz' | 'svg-constellation' | 'label-designer';
  config: Record<string, unknown>;
  fallback: string;           // Text-only alternative if tool unavailable
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool` | `string` (union) | Yes | Tool identifier from the supported set |
| `config` | `Record<string, unknown>` | Yes | Tool-specific configuration object |
| `fallback` | `string` | Yes | Text-only alternative when tool is unavailable |

### Supported Tools

| Tool ID | Description | Used By |
|---------|-------------|---------|
| `gsd-tracker` | OctaMED-descended music composition tool | R1 Workshop, R2 Found Sound |
| `d3-viz` | D3.js data visualization scaffold | R4 Two Charts |
| `svg-constellation` | SVG constellation map renderer | R3 Constellation |
| `label-designer` | Label design exercise tool | R5 Label (optional) |

### Fallback Requirement

Every `ToolHook` must specify a `fallback` string that provides a text-only alternative. This ensures the module remains functional in environments without JavaScript frameworks or external tool dependencies.

---

## Thread Connection Interface

A directional link between two panels across rooms, enabling cross-room navigation along thematic threads.

```typescript
interface ThreadConnection {
  thread: ThreadType;
  fromPanel: string;
  toPanel: string;
  label: string;              // e.g., "Rogers carries this insight to Barenaked Ladies"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `thread` | `ThreadType` | Yes | Which thread type this connection belongs to |
| `fromPanel` | `string` | Yes | Source panel ID |
| `toPanel` | `string` | Yes | Target panel ID |
| `label` | `string` | Yes | Human-readable description of the connection |

### Thread Connection Examples

| Thread | From | To | Label |
|--------|------|----|-------|
| INFLUENCE | `r2-p1-grand-opening` | `r3-p1-susan-rogers` | "Rogers' transformation during Grand Opening production" |
| INFLUENCE | `r2-p3-into-the-oh` | `r3-p2-pamelia-theremin` | "Pamelia discovers the theremin during Into the Oh sessions" |
| INFLUENCE | `r1-p3-jazz-root` | `r4-p1-pomona-to-hello` | "Jazz training becomes foundation for pop production mastery" |
| TIMELINE | `r1-p2-demo-tapes` | `r2-p1-grand-opening` | "Signing leads to debut album (1994)" |
| TIMELINE | `r2-p2-sacred-cow` | `r2-p3-into-the-oh` | "Sacred Cow (1996) to Into the Oh (2001)" |
| CONCEPT | `r1-p1-cocu` | `r2-p4-unconventional-toolkit` | "CoCu's radical inclusion applied to sonic material" |
| CONCEPT | `r2-p4-unconventional-toolkit` | `r5-p2-american-exception` | "Inclusionary practice from sound to curatorial identity" |

---

## Network Node Interface

Represents a person in the Geggy Tah creative network, used by the Room 3 constellation map.

```typescript
interface NetworkNode {
  id: string;
  name: string;
  role: string;               // e.g., "Producer", "Thereminist"
  connection: string;         // Relationship to GT
  priorPath: string;          // Where they came from
  subsequentPath: string;     // Where they went
  transformativeMoment?: string;  // The specific GT moment that mattered
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique node identifier (kebab-case name) |
| `name` | `string` | Yes | Full display name |
| `role` | `string` | Yes | Primary creative role |
| `connection` | `string` | Yes | Relationship to Geggy Tah |
| `priorPath` | `string` | Yes | Career/creative path before GT |
| `subsequentPath` | `string` | Yes | Career/creative path after GT |
| `transformativeMoment` | `string` | No | The specific GT moment that changed their trajectory |

### Node Inventory

| ID | Name | Role | GT Connection |
|----|------|------|--------------|
| `tommy-jordan` | Tommy Jordan | Vocalist, bassist, songwriter | Core member, CoCu founder |
| `greg-kurstin` | Greg Kurstin | Keyboardist, guitarist, co-producer | Core member |
| `susan-rogers` | Susan Rogers | Producer, engineer | Co-producer (Grand Opening, Sacred Cow) |
| `david-byrne` | David Byrne | Label founder, executive producer | Luaka Bop founder, signed GT |
| `pamelia-stickney` | Pamelia Stickney | Thereminist | Theremin on Into the Oh |
| `daren-hahn` | Daren Hahn | Drummer | Drums on Sacred Cow |
| `james-gadson` | James Gadson | Drummer | Drums on Into the Oh |
| `laurie-anderson` | Laurie Anderson | Performance artist, musician | Guest on Into the Oh |
| `glen-phillips` | Glen Phillips | Vocalist | Guest vocals on Sacred Cow |
| `lavey-millstein` | Lavey Millstein | Percussionist | Percussion, synth, tabla on Into the Oh |
| `jaki-byard` | Jaki Byard | Pianist, educator | Kurstin's teacher (pre-GT) |

### Visualization Properties

For the SVG/D3 constellation map, nodes carry additional rendering properties:

```typescript
interface ConstellationNode extends NetworkNode {
  x?: number;               // Computed x position
  y?: number;               // Computed y position
  radius: number;           // Node size (reflects outbound influence)
  color: string;            // Node color (by role category)
  group: 'core' | 'collaborator' | 'mentor' | 'guest';
}
```

| Group | Color | Members |
|-------|-------|---------|
| `core` | `#311B92` (primary) | Jordan, Kurstin |
| `collaborator` | `#FF8F00` (secondary) | Rogers, Hahn, Gadson, Millstein |
| `mentor` | `#4A148C` (tertiary) | Byard, Byrne |
| `guest` | `#E65100` (accent) | Anderson, Phillips, Stickney |

---

## Quote Interface

A direct quotation with attribution, used within `PanelContent`.

```typescript
interface Quote {
  text: string;
  speaker: string;
  source: string;
  year?: number;
}
```

### Key Quotes in the Module

| Speaker | Quote (abbreviated) | Source | Year |
|---------|-------------------|--------|------|
| David Byrne | "...an inclusionary wave... like nothing I've heard before" | Liner notes / press | ~1994 |
| Susan Rogers | "Tommy taught me that music is an expression of life..." | Tape Op Magazine | -- |
| Tommy Jordan | "Music is an expression of life -- beautiful, ugly, simple, complicated" | Interview | -- |
| Bob Moog | "true modern-day maestro" (on Pamelia Stickney) | Moog Foundation | -- |
| Rolling Stone | "creates its own aural planet" (on Grand Opening) | Rolling Stone | 1994 |
| Entertainment Weekly | "silliness tempered by keen musicianship" (on Sacred Cow) | Entertainment Weekly | 1996 |
| Laurie Anderson | "postcard from a strange cloud" (on Into the Oh) | Press | 2001 |
| Greg Kurstin | "I learned how to produce and record music. Everything happened." | Interview | -- |

---

## Source Reference Interface

A bibliographic entry linking module content to Phase 1 source material.

```typescript
interface SourceRef {
  id: string;
  publication: string;
  url: string;
  accessed: string;
}
```

### Source Categories

| Category | Count | Examples |
|----------|-------|---------|
| Professional music press | 5+ | Rolling Stone, Entertainment Weekly, Tape Op, Billboard, AllMusic |
| Label/industry documentation | 4+ | Luaka Bop catalog, Grammy database, Discogs, Apple Music |
| Academic/institutional | 3+ | Berklee, The New School, McGill |
| Interview/documentary | 4+ | Tape Op (Rogers), TED (Stickney), press (Byrne, Jordan) |

---

## Visualization Interfaces

### Constellation Map (Room 3)

```typescript
interface ConstellationMap {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  config: {
    width: number;
    height: number;
    centerNode: string;      // 'tommy-jordan' or 'greg-kurstin'
    forceStrength: number;
    linkDistance: number;
  };
}

interface ConstellationEdge {
  source: string;            // Node ID
  target: string;            // Node ID
  label: string;             // Creative exchange description
  type: 'collaboration' | 'mentorship' | 'catalysis';
  album?: string;            // Which album context (if applicable)
}
```

### Edge Types

| Type | Description | Example |
|------|-------------|---------|
| `collaboration` | Direct creative partnership on GT recordings | Jordan-Kurstin, Rogers-Jordan, Gadson-Jordan |
| `mentorship` | Teaching/learning relationship | Byard-Kurstin |
| `catalysis` | GT experience catalyzed a new direction | Rogers transformation, Stickney theremin discovery |

### Two-Chart Visualization (Room 4)

```typescript
interface TwoChartData {
  marketData: ChartDataPoint[];
  networkData: ChartDataPoint[];
  timeRange: { start: number; end: number };
  labels: { market: string; network: string };
}

interface ChartDataPoint {
  year: number;
  value: number;
  label: string;
  tooltip: string;
}
```

### Sample Market Data

| Year | Value | Label | Tooltip |
|------|-------|-------|---------|
| 1994 | 0 | Grand Opening | Debut album, no chart impact |
| 1996 | 16 | Sacred Cow | "Whoever You Are" #16 Modern Rock |
| 2001 | 0 | Into the Oh | Third album, no significant chart |
| 2002-2025 | 0 | Inactive | Band inactive since ~2001 |

### Sample Network Data

| Year | Value | Label | Tooltip |
|------|-------|-------|---------|
| 1994 | 1 | Rogers | Susan Rogers transformed during Grand Opening production |
| 1999 | 2 | Pamelia | Pamelia Stickney discovers theremin |
| 2006 | 4 | Bird & Bee | Kurstin forms The Bird and the Bee |
| 2012 | 6 | US #1 | First US #1 single produced by Kurstin |
| 2015 | 8 | Adele | Adele "Hello" -- Kurstin co-write/produce |
| 2017 | 12 | Grammys | Grammy accumulation begins in earnest |
| 2023 | 18 | 9 Grammys | Kurstin reaches 9 Grammy Awards |

---

## Creative DNA Study Template Interface

The reusable pattern interface for future case studies (Paisley Park, Muscle Shoals, Canterbury Scene, etc.).

```typescript
interface CreativeDNAStudy {
  id: string;
  title: string;
  nexusEntity: string;       // The band/artist/studio at the center
  rooms: Room[];
  constellation: ConstellationMap;
  twoChart?: TwoChartData;
  threads: ThreadConnection[];
  sourceRef: string;         // Phase 1 research reference
  pattern: {
    roomCount: number;       // 3-8 rooms
    panelRange: [number, number]; // [min, max] panels per room
    trySessionRequired: boolean;
    constellationRequired: boolean;
    twoChartRequired: boolean;
  };
}
```

### Template Constraints

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Room count | 3-8 | Minimum for coherent story, maximum for cognitive load |
| Panels per room | 2-4 | Focused exploration without overwhelming |
| Try Sessions | 1 per room (required) | Hands-on practice is non-negotiable |
| Constellation map | Required | Network visualization is the pattern's core value |
| Two-chart visualization | Optional | Not all case studies have the market/network contrast |
| Phase 1 research | Required | No production mission without prior deep research |

---

## Validation Rules

### Compile-Time Rules (TypeScript Strict Mode)

1. All interfaces must compile under `tsc --strict`
2. No `any` types -- all properties are explicitly typed
3. Optional properties marked with `?`
4. Enum values are exhaustive

### Content Validation Rules

| Rule | Check | Failure Action |
|------|-------|---------------|
| Panel source coverage | Every panel has at least 1 SourceRef | BLOCK |
| Quote attribution | Every Quote has non-empty `speaker` and `source` | BLOCK |
| Thread connectivity | Every thread connects panels in different rooms | WARN |
| Node completeness | Every NetworkNode has non-empty `priorPath` and `subsequentPath` | BLOCK |
| Try Session instructions | Every TrySession has at least 3 instructions | WARN |
| Tool fallback | Every ToolHook has non-empty `fallback` | BLOCK |
| DataPoint verification | Every DataPoint has `verified: true` before publication | BLOCK |

### Runtime Validation

```typescript
function validateRoom(room: Room): ValidationResult {
  const errors: string[] = [];
  if (room.panels.length < 2) errors.push('Room must have at least 2 panels');
  if (room.panels.length > 4) errors.push('Room must have at most 4 panels');
  if (!room.trySession) errors.push('Room must have a Try Session');
  if (!room.sourceModule) errors.push('Room must reference a source module');
  room.panels.forEach(panel => {
    if (panel.sources.length === 0) errors.push(`Panel ${panel.id} has no sources`);
    if (!panel.content.narrative) errors.push(`Panel ${panel.id} has no narrative`);
  });
  return { valid: errors.length === 0, errors };
}
```

---

## Sample Data

### Sample Room (Workshop)

```typescript
const workshopRoom: Room = {
  id: RoomId.WORKSHOP,
  title: 'The Workshop',
  premise: 'Every creative ecosystem starts with a space where the rules have not been written yet.',
  sourceModule: 'M1',
  panels: [
    {
      id: 'r1-p1-cocu',
      room: RoomId.WORKSHOP,
      title: 'CoCu: The Anti-Band',
      subtitle: 'Ten people, five non-musicians, audience as participant',
      content: {
        narrative: 'CoCu -- Contemporary Culture -- formed in 1987 Los Angeles...',
        pullQuotes: [{
          text: 'We were not trying to be a band. We were just trying to make noise together.',
          speaker: 'Tommy Jordan',
          source: 'Phase 1 M1, Interviews'
        }],
        dataPoints: [{
          label: 'Formation Year',
          value: '1987',
          source: 'M1-verified',
          verified: true
        }],
        deepDive: 'The CoCu collective represents the purest expression of the inclusionary principle...'
      },
      threads: [{
        thread: ThreadType.CONCEPT,
        fromPanel: 'r1-p1-cocu',
        toPanel: 'r2-p4-unconventional-toolkit',
        label: 'CoCu radical inclusion applied to sonic material'
      }],
      sources: [{
        id: 'src-m1-origins',
        publication: 'Phase 1: Origins and Formation',
        url: '../GGT/research/01-origins-and-formation',
        accessed: '2026-03-26'
      }]
    }
    // ... additional panels
  ],
  trySession: {
    id: 'ts-workshop',
    room: RoomId.WORKSHOP,
    title: 'The Workshop Exercise',
    description: 'Combine 5 unrelated sound sources into a 60-second arrangement.',
    instructions: [
      'Load the 5 provided sound sources into GSD-Tracker',
      'Create a new 16-row pattern',
      'Place every sound source at least once -- no element may be excluded',
      'Arrange without genre constraints -- there are no rules except inclusion',
      'Export your 60-second arrangement'
    ],
    toolIntegration: {
      tool: 'gsd-tracker',
      config: { sampleSlots: 5, patternRows: 16, tempo: 120 },
      fallback: 'Without GSD-Tracker: describe your arrangement in text, listing where each sound appears.'
    },
    estimatedMinutes: 18
  }
};
```

---

## Cross-References

### Related Specifications

- [Research-to-Room Mapping](02-research-to-room-mapping.md) -- How source content maps to these data structures
- [Constellation Map Specification](04-constellation-map-specification.md) -- Detailed visualization spec for Room 3
- [Two-Chart Visualization Specification](05-two-chart-visualization.md) -- Detailed D3 spec for Room 4

### Related GSD Projects

- [DAA -- Deep Audio Analysis](../DAA/index.html) -- Sonic analysis interfaces that complement production panels
- [ARC -- Shapes and Colors](../ARC/index.html) -- Visual rendering patterns for constellation map
- [VAV -- Voxel as Vessel](../VAV/index.html) -- Data container architecture philosophy
- [SPA -- Spatial Awareness](../SPA/index.html) -- Room/space metaphor that informs the Room interface design
- [GRD -- Gradient Engine](../GRD/index.html) -- Color specification system used by constellation node colors
- [MCR -- Minecraft RAG](../MCR/index.html) -- Room-building interfaces that share structural patterns with Room/Panel

---

*Data structure specification for the Inclusionary Wave Educational Module. All interfaces compile under TypeScript strict mode. Every content-bearing type traces to Phase 1 source material. The structures serve the pedagogy: rooms contain panels, panels contain stories, stories carry threads that connect across the invisible network.*

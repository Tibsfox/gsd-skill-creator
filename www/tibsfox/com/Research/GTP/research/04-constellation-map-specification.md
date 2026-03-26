# Constellation Map Specification

## Table of Contents

- [Overview](#overview)
- [Design Intent](#design-intent)
- [Node Specification](#node-specification)
- [Edge Specification](#edge-specification)
- [Layout Algorithm](#layout-algorithm)
- [Interaction Model](#interaction-model)
- [Visual Design](#visual-design)
- [Data Source](#data-source)
- [Complete Node Registry](#complete-node-registry)
- [Complete Edge Registry](#complete-edge-registry)
- [Rendering Configuration](#rendering-configuration)
- [Responsive Behavior](#responsive-behavior)
- [Accessibility](#accessibility)
- [Static Fallback](#static-fallback)
- [Implementation Notes](#implementation-notes)
- [Cross-References](#cross-references)

---

## Overview

The constellation map is Room 3's centerpiece visualization -- an interactive SVG/D3.js force-directed graph that renders every person who passed through the Geggy Tah creative field. Each node represents a person. Each edge represents a creative relationship. The map makes invisible influence pathways tangible and navigable.

> "Creative DNA doesn't flow through institutions. It flows through people who change each other." -- Room 3 Premise

The constellation map serves as both a visualization tool and a pedagogical device. Users can explore the network, hover over nodes to see biographical detail, and trace the pathways through which creative DNA traveled from a home studio in Pomona to the Grammy stage.

---

## Design Intent

### What the Map Teaches

1. **Network density.** Geggy Tah's creative field involved 11+ people across multiple disciplines -- not just two bandmates in isolation.
2. **Influence direction.** Arrows show which way creative DNA flowed. Rogers learned from Jordan. Kurstin learned from Byard. Stickney's trajectory was catalyzed by the GT studio environment.
3. **Outbound amplification.** Node size reflects outbound influence -- how many subsequent trajectories a person catalyzed. Kurstin's node is large because his post-GT career touched dozens of artists. Byard's node is large because his teaching lineage runs through Kurstin to modern pop.
4. **The invisible network.** A chart-based view of Geggy Tah shows two people with one hit. The constellation shows 11+ people whose trajectories intersected at a specific creative nexus, each carrying something forward.

### What the Map Does Not Show

- No commercial metrics (that's Room 4's domain)
- No timeline (that's the Timeline thread's domain)
- No genre labels (the map is about people, not categories)
- No speculation about personal relationships or motivations

---

## Node Specification

### Node Data Structure

```typescript
interface ConstellationNode {
  id: string;                // Kebab-case unique identifier
  name: string;              // Display name
  role: string;              // Primary creative role
  connection: string;        // Relationship to Geggy Tah
  priorPath: string;         // Where they came from
  subsequentPath: string;    // Where they went
  transformativeMoment?: string;  // The specific GT moment
  group: 'core' | 'collaborator' | 'mentor' | 'guest';
  radius: number;            // Visual size (reflects outbound influence)
  color: string;             // Fill color (by group)
}
```

### Node Groups

| Group | Description | Color | Stroke |
|-------|-------------|-------|--------|
| `core` | GT founding members | `#311B92` (deep violet) | `#1A0E5C` |
| `collaborator` | Recording collaborators, producers | `#FF8F00` (amber) | `#CC7200` |
| `mentor` | Teachers and curatorial figures | `#4A148C` (purple) | `#2E0D58` |
| `guest` | Guest artists and session musicians | `#E65100` (burnt orange) | `#B34000` |

### Node Sizing

Node radius reflects **outbound influence** -- the breadth and significance of a person's subsequent career relative to their GT connection.

| Influence Level | Radius | Criteria |
|----------------|--------|----------|
| Very High | 28-32px | Multiple Grammys, institutional founding, instrument redefinition |
| High | 20-26px | Grammy-winning production, major touring, academic appointment |
| Medium | 14-18px | Sustained session career, continued collaborations |
| Low | 10-12px | Single contribution, pre-GT influence only |

### Node Size Assignments

| Node | Group | Radius | Rationale |
|------|-------|--------|-----------|
| Tommy Jordan | core | 22px | CoCu founder, Jack Johnson collab, sustained creative practice |
| Greg Kurstin | core | 32px | 9 Grammys, Bird & the Bee, Adele, Foo Fighters, Beck, Sia |
| Susan Rogers | collaborator | 28px | McGill PhD, Berklee lab founder, Barenaked Ladies, psychoacoustics |
| David Byrne | mentor | 26px | Talking Heads legacy, Luaka Bop continues, curatorial influence |
| Pamelia Stickney | guest | 24px | Theremin redefined, Moog collaborator, TED, Vienna scene |
| Daren Hahn | collaborator | 14px | Sting, Barenaked Ladies touring |
| James Gadson | collaborator | 16px | Continued session legend, Aretha/Withers legacy |
| Laurie Anderson | guest | 18px | Continued solo career, performance art pioneer |
| Glen Phillips | guest | 14px | Solo career, continued collaborations |
| Lavey Millstein | collaborator | 12px | Session work |
| Jaki Byard | mentor | 20px | Mingus lineage, Kurstin's formation, teaching legacy |

---

## Edge Specification

### Edge Data Structure

```typescript
interface ConstellationEdge {
  source: string;            // Source node ID
  target: string;            // Target node ID
  label: string;             // Creative exchange description
  type: 'collaboration' | 'mentorship' | 'catalysis';
  album?: string;            // Album context (if applicable)
  weight: number;            // Edge thickness (1-3)
}
```

### Edge Types

| Type | Visual Style | Description |
|------|-------------|-------------|
| `collaboration` | Solid line, weight 2 | Direct creative partnership on GT recordings |
| `mentorship` | Dashed line, weight 2 | Teaching/learning relationship |
| `catalysis` | Dotted line with arrow, weight 3 | GT experience catalyzed a new trajectory |

### Edge Colors

Edges inherit a blended color from their connected nodes, with opacity 0.6 in resting state and 1.0 on hover.

| Edge Type | Color | Opacity (rest) | Opacity (hover) |
|-----------|-------|----------------|-----------------|
| collaboration | `#FF8F00` | 0.5 | 0.9 |
| mentorship | `#4A148C` | 0.5 | 0.9 |
| catalysis | `#E65100` | 0.6 | 1.0 |

---

## Layout Algorithm

### Force-Directed Layout (D3.js)

The constellation uses D3's force simulation with the following parameters:

```typescript
const simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('link', d3.forceLink(edges).id(d => d.id).distance(120))
  .force('collision', d3.forceCollide().radius(d => d.radius + 8))
  .force('x', d3.forceX(width / 2).strength(0.05))
  .force('y', d3.forceY(height / 2).strength(0.05));
```

### Layout Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Charge strength | -300 | Enough repulsion to spread nodes without scattering |
| Center force | `(width/2, height/2)` | Keeps constellation centered in viewport |
| Link distance | 120px | Enough space for labels between nodes |
| Collision radius | `node.radius + 8` | Prevents overlap with breathing room |
| X/Y centering strength | 0.05 | Gentle pull toward center prevents drift |

### Initial Positioning

Core nodes (Jordan, Kurstin) are positioned near center. Other nodes are placed radially by group:

| Group | Initial Position |
|-------|-----------------|
| core | Center (0,0 relative) |
| collaborator | Inner ring (radius ~100px) |
| mentor | Mid ring (radius ~160px) |
| guest | Outer ring (radius ~200px) |

The force simulation then settles into a stable layout. Initial positioning only influences the simulation's starting conditions.

---

## Interaction Model

### Hover Behavior

When the user hovers over a node:

1. **Node enlarges** -- radius increases by 4px with 200ms ease transition
2. **Label appears** -- Name, role, and transformative moment displayed in a tooltip
3. **Connected edges highlight** -- All edges connected to this node transition to full opacity
4. **Connected nodes brighten** -- Adjacent nodes increase opacity, non-connected nodes fade to 0.3 opacity
5. **Tooltip content:**

```
┌──────────────────────────────────────┐
│  Susan Rogers                        │
│  Producer, Engineer                  │
│  ─────────────────────               │
│  Prior: Prince (1983-88)             │
│  GT: Co-producer, Grand Opening &    │
│      Sacred Cow                      │
│  After: Berklee, McGill PhD,         │
│         Barenaked Ladies             │
│  ─────────────────────               │
│  "Tommy taught me that music is an   │
│   expression of life."              │
└──────────────────────────────────────┘
```

### Click Behavior

Clicking a node navigates to the corresponding panel in Room 3 (if the node has a dedicated panel) or highlights its connections in the constellation (if the node appears only in the aggregate view).

| Node | Click Action |
|------|-------------|
| Susan Rogers | Navigate to Panel R3-P1 |
| Pamelia Stickney | Navigate to Panel R3-P2 |
| David Byrne | Navigate to Panel R3-P3 |
| All others | Highlight connections, pin tooltip |

### Edge Hover Behavior

Hovering over an edge:

1. **Edge thickens** -- weight increases by 1 with 150ms transition
2. **Label appears** -- Edge label displayed at midpoint
3. **Connected nodes highlight** -- Source and target nodes enlarge slightly

### Drag Behavior

Nodes are draggable. Dragging a node pins it to the new position and pauses the force simulation for that node. Releasing unpins it. This allows users to manually arrange the constellation for their own understanding.

---

## Visual Design

### Canvas

| Property | Value |
|----------|-------|
| Background | Transparent (inherits page background) |
| Default width | 100% of container |
| Default height | 500px |
| Min height | 400px |
| Max height | 700px |
| Border | 1px solid `var(--mist)` |
| Border radius | 8px |

### Typography

| Element | Font | Size | Color |
|---------|------|------|-------|
| Node label (resting) | System sans-serif | 11px | `#757575` |
| Node label (hover) | System sans-serif | 12px bold | `#212121` |
| Edge label | System sans-serif | 10px italic | `#757575` |
| Tooltip heading | System sans-serif | 14px bold | `#311B92` |
| Tooltip body | System sans-serif | 12px | `#212121` |
| Tooltip quote | Georgia, serif | 12px italic | `#4A148C` |

### Color Palette

The constellation uses the GTP project palette:

| Role | Color | Usage |
|------|-------|-------|
| Primary (`#311B92`) | Deep violet | Core nodes, tooltip headings |
| Secondary (`#FF8F00`) | Amber | Collaboration edges, collaborator nodes |
| Tertiary (`#4A148C`) | Purple | Mentor nodes, mentorship edges |
| Accent (`#E65100`) | Burnt orange | Guest nodes, catalysis edges |
| Background | `#EDE7F6` | Light lavender, tooltip background |
| Mist | `#D1C4E9` | Border color, deemphasized elements |

### Legend

A small legend in the bottom-right corner of the canvas:

```
 ● Core Member     ─── Collaboration
 ● Collaborator    --- Mentorship
 ● Mentor          ··· Catalysis
 ● Guest
```

---

## Data Source

### Origin

All node and edge data derives from Phase 1 Module 3 (The Creative Network). No new biographical research is conducted for the constellation map. The map is a visualization of existing verified data.

### Data Flow

```
Phase 1 M3 → NetworkNode[] → ConstellationNode[] → D3 force simulation → SVG render
                              (add visual props)    (compute positions)   (draw)
```

### Verification

Every node's biographical data has been verified against published sources in the Phase 1 bibliography. The `transformativeMoment` field is sourced from published interviews, not speculation.

---

## Complete Node Registry

| # | ID | Name | Role | Group | Radius | Prior | GT Connection | Subsequent | Transformative Moment |
|---|-----|------|------|-------|--------|-------|---------------|------------|----------------------|
| 1 | `tommy-jordan` | Tommy Jordan | Vocalist, bassist, songwriter | core | 22 | CoCu founder | Core member, lyrics, bass, vocals | Jack Johnson "Flake," continued LA music | Founded the creative space that made everything possible |
| 2 | `greg-kurstin` | Greg Kurstin | Keyboardist, guitarist, co-producer | core | 32 | New School jazz, CalArts | Core member, keys, guitar, co-production | Bird & the Bee, 9 Grammys, Adele "Hello" | "I learned how to produce and record music. Everything happened." |
| 3 | `susan-rogers` | Susan Rogers | Producer, engineer | collaborator | 28 | Prince (1983-88) | Co-producer (Grand Opening, Sacred Cow) | Barenaked Ladies, Berklee lab, McGill PhD | "Tommy taught me that music is an expression of life." |
| 4 | `david-byrne` | David Byrne | Label founder, exec producer | mentor | 26 | Talking Heads | Founded Luaka Bop, signed GT, exec producer | Continued Luaka Bop curation | Hearing the demo: "truly like nothing else" |
| 5 | `pamelia-stickney` | Pamelia Stickney | Thereminist | guest | 24 | Jazz upright bass | Theremin on Into the Oh | Moog collaborator, TED, Vienna | Handed a theremin for the first time in the GT studio |
| 6 | `daren-hahn` | Daren Hahn | Drummer | collaborator | 14 | Session musician | Drums on Sacred Cow | Toured with Sting, Barenaked Ladies | -- |
| 7 | `james-gadson` | James Gadson | Drummer | collaborator | 16 | Aretha Franklin, Bill Withers | Drums on Into the Oh | Continued session legend | Bringing Aretha's groove to an experimental home studio |
| 8 | `laurie-anderson` | Laurie Anderson | Performance artist, musician | guest | 18 | Performance art pioneer | Guest on Into the Oh | Continued solo career | "Postcard from a strange cloud" |
| 9 | `glen-phillips` | Glen Phillips | Vocalist | guest | 14 | Toad the Wet Sprocket | Guest vocals on Sacred Cow | Solo career, collaborations | -- |
| 10 | `lavey-millstein` | Lavey Millstein | Percussionist | collaborator | 12 | LA session percussionist | Percussion, synth, tabla on Into the Oh | Session work | -- |
| 11 | `jaki-byard` | Jaki Byard | Pianist, educator | mentor | 20 | Charles Mingus's pianist | Kurstin's teacher (pre-GT) | (d. 1999) | Teaching the jazz foundation that enabled everything |

---

## Complete Edge Registry

### Core Edges

| # | Source | Target | Label | Type | Album | Weight |
|---|--------|--------|-------|------|-------|--------|
| 1 | `tommy-jordan` | `greg-kurstin` | Core creative partnership, songwriting, co-production | collaboration | All | 3 |
| 2 | `jaki-byard` | `greg-kurstin` | Jazz piano training at The New School | mentorship | Pre-GT | 2 |
| 3 | `david-byrne` | `tommy-jordan` | Label signing, curatorial endorsement | mentorship | Pre-Grand Opening | 2 |
| 4 | `david-byrne` | `greg-kurstin` | Label signing, executive production | mentorship | Pre-Grand Opening | 2 |

### Grand Opening Edges

| # | Source | Target | Label | Type | Album | Weight |
|---|--------|--------|-------|------|-------|--------|
| 5 | `susan-rogers` | `tommy-jordan` | Co-production, engineering (Grand Opening) | collaboration | Grand Opening | 2 |
| 6 | `susan-rogers` | `greg-kurstin` | Co-production, engineering (Grand Opening) | collaboration | Grand Opening | 2 |
| 7 | `tommy-jordan` | `susan-rogers` | Transformative creative exchange -- "music is an expression of life" | catalysis | Grand Opening | 3 |

### Sacred Cow Edges

| # | Source | Target | Label | Type | Album | Weight |
|---|--------|--------|-------|------|-------|--------|
| 8 | `susan-rogers` | `tommy-jordan` | Co-production continued (Sacred Cow) | collaboration | Sacred Cow | 2 |
| 9 | `daren-hahn` | `tommy-jordan` | Session drums | collaboration | Sacred Cow | 1 |
| 10 | `glen-phillips` | `tommy-jordan` | Guest vocals | collaboration | Sacred Cow | 1 |

### Into the Oh Edges

| # | Source | Target | Label | Type | Album | Weight |
|---|--------|--------|-------|------|-------|--------|
| 11 | `pamelia-stickney` | `tommy-jordan` | Theremin performance | collaboration | Into the Oh | 2 |
| 12 | `pamelia-stickney` | `greg-kurstin` | Theremin integration into arrangements | collaboration | Into the Oh | 2 |
| 13 | `tommy-jordan` | `pamelia-stickney` | Introduction to theremin, catalyzed new trajectory | catalysis | Into the Oh | 3 |
| 14 | `james-gadson` | `tommy-jordan` | Session drums, Aretha/Withers groove | collaboration | Into the Oh | 2 |
| 15 | `laurie-anderson` | `greg-kurstin` | Guest performance, "postcard from a strange cloud" | collaboration | Into the Oh | 1 |
| 16 | `lavey-millstein` | `tommy-jordan` | Percussion, synth, tabla | collaboration | Into the Oh | 1 |

### Post-GT Catalysis Edges

| # | Source | Target | Label | Type | Album | Weight |
|---|--------|--------|-------|------|-------|--------|
| 17 | `greg-kurstin` | `tommy-jordan` | Shared GT foundation enables divergent post-band paths | catalysis | Post-GT | 2 |

---

## Rendering Configuration

### SVG Container

```html
<div id="constellation-container" role="img" aria-label="Geggy Tah Creative Network Constellation Map">
  <svg id="constellation-map" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#E65100" />
      </marker>
    </defs>
    <g class="edges"></g>
    <g class="nodes"></g>
    <g class="labels"></g>
    <g class="legend"></g>
  </svg>
</div>
```

### D3 Configuration Object

```typescript
const constellationConfig = {
  width: 800,
  height: 500,
  centerNode: 'tommy-jordan',
  forceStrength: -300,
  linkDistance: 120,
  collisionPadding: 8,
  transitionDuration: 200,
  hoverRadiusIncrease: 4,
  fadeOpacity: 0.3,
  tooltipOffset: { x: 12, y: -8 },
  colors: {
    core: '#311B92',
    collaborator: '#FF8F00',
    mentor: '#4A148C',
    guest: '#E65100',
    background: 'transparent',
    edgeDefault: 'rgba(0,0,0,0.2)',
    labelDefault: '#757575',
    labelActive: '#212121'
  }
};
```

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| > 1024px | Full interactive map, 800x500 viewport |
| 768-1024px | Reduced to 600x400, smaller labels |
| < 768px | Simplified view: nodes only (no labels at rest), full-width, 100%x350px |
| < 480px | Static fallback image with alt text |

### Touch Support

On touch devices:

- Tap replaces hover for tooltip display
- Double-tap navigates to panel
- Pinch-zoom scales the SVG viewBox
- Drag works via touch-move events

---

## Accessibility

### ARIA Attributes

| Element | ARIA Role/Attribute | Value |
|---------|-------------------|-------|
| Container div | `role="img"` | Constellation map of GT creative network |
| SVG | `aria-label` | "Interactive constellation map showing 11 people in the Geggy Tah creative network" |
| Each node | `role="button"` | Click to view panel |
| Each node | `aria-label` | "{name}, {role}. Click for details." |
| Tooltip | `role="tooltip"` | Biographical information |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus between nodes (in DOM order) |
| Enter/Space | Activate focused node (show tooltip, navigate to panel) |
| Escape | Close tooltip |
| Arrow keys | Move between adjacent nodes in the network |

### Screen Reader Support

When a screen reader encounters the constellation map, it reads:

1. The container's `aria-label` describing the overall visualization
2. Each node as a button with name and role
3. Edge connections described as list items in a hidden `<ul>` below the SVG

```html
<ul class="sr-only" aria-label="Network connections">
  <li>Tommy Jordan and Greg Kurstin: Core creative partnership</li>
  <li>Jaki Byard mentored Greg Kurstin: Jazz piano training at The New School</li>
  <!-- ... -->
</ul>
```

---

## Static Fallback

For environments without JavaScript or D3.js, a static SVG fallback is provided:

### Fallback Content

```html
<noscript>
  <div class="constellation-fallback">
    <h4>Geggy Tah Creative Network</h4>
    <table>
      <thead><tr><th>Person</th><th>Role</th><th>Prior</th><th>GT Connection</th><th>After</th></tr></thead>
      <tbody>
        <tr><td>Tommy Jordan</td><td>Vocalist, bassist</td><td>CoCu founder</td><td>Core member</td><td>Jack Johnson, LA music</td></tr>
        <tr><td>Greg Kurstin</td><td>Keyboardist</td><td>New School jazz</td><td>Core member</td><td>9 Grammys, Adele</td></tr>
        <!-- ... all 11 nodes as table rows ... -->
      </tbody>
    </table>
  </div>
</noscript>
```

The static fallback presents the same information as the interactive map in table format, ensuring the educational content is accessible regardless of browser capabilities.

---

## Implementation Notes

### Performance

- The force simulation should run for a maximum of 300 iterations before freezing
- Node count (11) is well within D3's performance ceiling
- SVG is preferred over Canvas for accessibility (DOM-accessible elements)

### Data Loading

Node and edge data should be embedded in a `<script>` tag within the page rather than fetched externally, reducing HTTP requests and eliminating CORS concerns for local file:// browsing.

### Testing

| Test | ID | Expected |
|------|-----|----------|
| Node count | CF-06 | 11+ nodes rendered |
| Edge labels | CF-06 | All edges have visible labels on hover |
| Hover detail | CF-06 | Tooltip shows biographical information |
| Responsive | CF-06 | Map renders at 320px, 768px, 1024px, 1440px widths |
| Sparse data | EC-03 | Map handles nodes with only `id`, `name`, `role` (no optional fields) |
| Accessibility | -- | Screen reader reads node list and connections |

---

## Cross-References

- [Data Structure Specification](03-data-structure-specification.md) -- NetworkNode and ConstellationNode interfaces
- [Research-to-Room Mapping](02-research-to-room-mapping.md) -- Room 3 panel mapping that feeds the constellation
- [Two-Chart Visualization](05-two-chart-visualization.md) -- The other D3 visualization in the module
- [Source Material](01-source-material.md) -- Phase 1 Module 3 source data for all nodes
- [GGT -- Creative Network](../GGT/page.html?doc=research/03-the-creative-network) -- The original Phase 1 research module
- [ARC -- Shapes and Colors](../ARC/index.html) -- Visual pattern language informing node/edge rendering
- [GRD -- Gradient Engine](../GRD/index.html) -- Color system specification

---

*Constellation map specification for the Inclusionary Wave Educational Module. 11 nodes, 17 edges, 4 node groups, 3 edge types. The map makes the invisible network visible -- not as an academic citation graph, but as human stories about people teaching each other to hear differently.*

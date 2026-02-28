# Amiga Corner

The Amiga Corner is a walkable exhibit within the Knowledge World's Creative District. It physically manifests Amiga creative heritage -- pixel art, demo scene productions, and tool evolution -- as Minecraft builds that teach computing concepts through spatial experience.

## Why It Exists

The Amiga was not just a computer. It was a creative culture that produced tens of thousands of artworks, music compositions, demos, and tools between 1985 and the present day. This culture embodied principles that GSD values: constraint-driven creativity, architectural leverage, and community knowledge accumulation.

The Amiga Corner makes these principles walkable. Moving through the pixel art gallery teaches palette discipline. Walking the demo scene exhibit teaches architectural leverage. Traversing the tool evolution corridor teaches how creative DNA flows from ancestor tools to modern descendants.

## Content Files

| File | Type | Contents |
|---|---|---|
| `pixel-art-gallery.yaml` | YAML catalog | 7 Amiga artworks with map art conversion specs |
| `pixel-art-gallery.md` | Guide | Artwork history, map art construction instructions |
| `demo-scene-exhibit.yaml` | YAML catalog | 6 landmark demo scene productions with spatial builds |
| `demo-scene-exhibit.md` | Guide | Production history, technical breakdowns, exhibit builds |
| `tool-evolution-walkthrough.yaml` | YAML catalog | 7 Amiga-to-modern tool evolution stations |
| `tool-evolution-walkthrough.md` | Guide | Tool lineage narratives, creative insights |
| `amiga-corner-schematic-spec.yaml` | Schematic spec | Room layouts, block palettes, sign positions |
| `README.md` | This file | Overview and build instructions |

## Building the Amiga Corner

### Prerequisites

- **Phase 186** (world-master-plan.yaml) provides absolute coordinates for the Creative District origin. The Amiga Corner uses relative coordinates from that origin.
- **Phase 185** (curated assets) provides the IFF artwork files for map art conversion.
- **Litematica mod** for schematic capture and placement.
- **Syncmatica mod** for server-wide schematic sharing.

### Construction Process

1. **Read the schematic spec** (`amiga-corner-schematic-spec.yaml`) for the complete build blueprint
2. **Mark the footprint:** 64 blocks wide (east-west) x 80 blocks deep (north-south) from the Creative District offset
3. **Build in order:** Entry gateway -> Gallery -> Exhibit -> Corridor (see `build_notes.construction_order` in the schematic spec)
4. **Install content:** Use the YAML catalogs for sign text, item frame content, and alcove builds
5. **Create map art:** Follow `pixel-art-gallery.md` instructions to build 128x128 block canvases and create map items
6. **Capture schematic:** Select the full 64x80x16 bounding box in Litematica and save as `education-amiga-corner-1-0.litematic`
7. **Share via Syncmatica:** Upload the schematic for server-wide visibility

### Room Layout

```
North (entry from Creative District hub)
  |
  v
[Entry Gateway -- blue/orange arch, beacon]
  |
  v (10-block pathway)
[Pixel Art Gallery -- 30x20x6]
  7 artworks as map art in item frames
  |
  v (archway)
[Demo Scene Exhibit -- 30x24x8]
  6 alcoves with spatial concept builds
  |
  v (archway)
[Tool Evolution Corridor -- 12x22x5]
  7 stations: Amiga tool -> Modern equivalent
```

### Identity Colors

- **Blue** (blue_concrete): Amiga Workbench 1.x title bar
- **Orange** (orange_concrete): Amiga checkered disk logo
- **Light gray** (light_gray_concrete): Amiga computer case color
- **Dark oak** (dark_oak_planks): Sign backgrounds and warm accents

## Content Summary

- **7 pixel artworks** spanning OCS 32-color, EHB 64-color, HAM6 4096-color, AGA 256-color, and Hi-Res 16-color modes
- **6 demo scene productions** from 1986 (Juggler) to 2003 (Starstruck), each with spatial exhibit build concepts
- **7 tool evolution stations** mapping Deluxe Paint, ProTracker, LightWave, Scala, Video Toaster, AMOS, and SoundTracker to their modern descendants
- **59 signs** total with historically accurate content and creative insights
- **All content legally distributable** -- public domain, freeware, or scene.org free distribution

## Legal Framework

Every artwork, production, and tool reference in this exhibit is selected for legal distribtability:

- **Public domain:** Works explicitly released to the public domain (Juggler)
- **Freeware:** Works released for free distribution (Aminet uploads)
- **Scene productions:** Demo scene works available via scene.org under standard free distribution terms
- **Tool references:** Historical descriptions and comparisons (fair use / educational)

No copyrighted material is included without explicit free distribution rights. See the `legal_status` field in each YAML catalog entry for per-item status.

## Validation

Run the test suite to verify all content:

```bash
bash infra/tests/test-amiga-corner.sh
```

This validates YAML parsing, content counts, required fields, and markdown completeness.

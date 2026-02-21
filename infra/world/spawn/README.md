# Knowledge World Spawn Area Design System

The spawn area is every player's first impression of the Knowledge World. Its
design follows a principle of **meaningful space**: every block, sign, and path
serves the goal of orienting a new player within their first five minutes.

## File Overview

| File | Purpose |
|------|---------|
| `sign-standards.yaml` | Universal sign formatting rules for the entire Knowledge World |
| `spawn-plaza-spec.yaml` | Complete build specification for the central spawn plaza |
| `welcome-center-spec.yaml` | Build specification for the orientation building |
| `tutorial-path-spec.yaml` | Build specification for the guided 5-minute walk |
| `syncmatica-share.sh` | Script to register schematics for server-wide sharing |

## Sign Standards

`sign-standards.yaml` is the **single source of truth** for all sign formatting
across the Knowledge World. It defines four sign types:

- **Title signs** -- Building names, district entrances, and landmark labels.
  Title text in bold (line 1), colored per district.
- **Info signs** -- Explanations, descriptions, and instructions.
  Bold section title (line 1), white body text.
- **Direction signs** -- Wayfinding arrows with distance indicators.
  Destination name in bold, colored to match the destination district.
- **Wall text** -- Multi-sign sequences for longer information.
  Read left-to-right, sequential flow, white text.

All text follows a welcoming tone, second-person address ("you can..."),
present tense, and defines technical jargon on first use.

### District Color Palette

Each district has a primary text color and a three-block palette for builds:

| District | Color | Primary Block | Description |
|----------|-------|---------------|-------------|
| Hardware | Gold | gold_block | Warm metallic tones |
| Software | Aqua | diamond_block | Cool digital tones |
| Network | Green | emerald_block | Data flow greens |
| Creative | Light Purple | purpur_block | Artistic purples |
| Community | Blue | lapis_block | Social blues |
| Workshop | Red | redstone_block | Builder reds |
| Spawn | White | quartz_block | Neutral, clean |

## How Specs Relate to Schematics

Each build spec (YAML) describes what to build: dimensions, materials, layout,
sign content, and build order. The corresponding Litematica schematic metadata
file (in `../schematics/spawn/`) describes the in-game `.litematic` file that
captures the finished build.

**Workflow:**

1. Read the spec to understand the design
2. Build in-game following the spec's `build_order` section
3. Save the finished build as a `.litematic` file using Litematica
4. The schematic metadata file records dimensions, origin, tags, and dependencies
5. Run `syncmatica-share.sh` to register schematics for server-wide access

## Spatial Philosophy

The spawn area follows the Knowledge World's core spatial principle: **space
encodes meaning**. This means:

- **Paths are connections.** The colored radial paths from spawn plaza to each
  district are not just navigation -- they teach that in computing, things
  connect, and connections have properties (color = topic, width = importance).
- **Buildings are systems.** The welcome center is not just a building with
  signs -- it is a system with inputs (player enters), processing (reads
  panels), and output (player leaves informed).
- **Scale communicates importance.** The beacon is tall because it is globally
  important. Signs are small because they are locally relevant.
- **Color is wayfinding.** Consistent district colors let a player orient
  without reading by recognizing the color of their surroundings.

## Modifying the Spawn Experience

To change or extend the spawn area:

1. Edit the relevant spec file (e.g., add a waypoint to `tutorial-path-spec.yaml`)
2. Rebuild in-game following the updated spec
3. Re-save the `.litematic` file
4. Update the schematic metadata if dimensions or dependencies changed
5. Run `syncmatica-share.sh` to push the updated schematic

When adding signs, always reference `sign-standards.yaml` for formatting. When
adding new structures, choose block palettes from the spawn district's palette
(`quartz_block`, `white_concrete`, `smooth_stone`) to maintain visual coherence.

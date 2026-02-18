# GSD Knowledge World Schematic Library

The schematic library is the Knowledge World's reusable architectural toolkit. Builders browse the catalog, load schematics in Litematica, and place them in-world to construct meaningful spaces. Every structure in the Knowledge World begins as a schematic specification, gets built in-game, captured via Litematica, and shared through Syncmatica.

## Naming Convention

All schematic files follow this pattern:

```
category-name-version.litematic
```

Where:
- **category** = one of: `template`, `architecture`, `education`, `amiga`, `community`
- **name** = lowercase-hyphenated descriptive name (e.g., `meeting-room`, `presentation-hall`)
- **version** = semantic version with dots replaced by dashes (e.g., `1-0`, `1-1`, `2-0`)

### Examples

| Filename | Category | Name | Version |
|----------|----------|------|---------|
| `template-meeting-room-1-0.litematic` | template | meeting-room | 1.0 |
| `template-presentation-hall-1-0.litematic` | template | presentation-hall | 1.0 |
| `architecture-pipeline-view-1-0.litematic` | architecture | pipeline-view | 1.0 |
| `education-boolean-gates-1-0.litematic` | education | boolean-gates | 1.0 |
| `amiga-workbench-pixel-art-1-0.litematic` | amiga | workbench-pixel-art | 1.0 |
| `community-custom-bridge-1-0.litematic` | community | custom-bridge | 1.0 |

## Directory Layout

```
minecraft/schematics/
├── architecture/        # System architecture visualizations (pipelines, topologies, schemas)
├── templates/           # Reusable building templates (the 10 core schematics)
├── education/           # Concept-teaching builds from the educational curriculum
├── amiga/              # Amiga-inspired designs and pixel art recreations
├── community/          # User-contributed schematics
├── specs/              # Build specifications (YAML) defining what to construct
├── catalog.yaml        # Machine-readable catalog -- authoritative index of all schematics
└── README.md           # This file
```

### architecture/

System architecture visualizations: pipelines, network topologies, database schemas represented as Minecraft structures. These schematics make abstract computing concepts physically walkable.

### templates/

Reusable building templates for Knowledge World construction. The 10 core schematics live here: meeting rooms, presentation halls, workshops, server rooms, libraries, gardens, bridges, gateways, towers, and observatories. These are the building blocks that compose into districts.

### education/

Concept-teaching builds from the educational curriculum. Guided build projects that teach computing concepts through construction -- data flow as corridors, servers as buildings, tables as rooms.

### amiga/

Amiga-inspired designs and pixel art recreations. IFF artwork recreated as map art, Workbench-inspired interiors, and retro computing tributes that connect vintage computing to modern concepts.

### community/

User-contributed schematics. Builders who create original designs can submit them here following the naming convention and catalog registration process.

## Catalog Format

The `catalog.yaml` file is the **authoritative index** of every schematic in the library. Every `.litematic` file MUST have a corresponding entry in the catalog. The catalog tracks:

- **name**: Human-readable display name
- **id**: Machine-friendly identifier (lowercase-hyphenated)
- **filename**: Full filename following naming convention
- **file_path**: Relative path from this directory to the `.litematic` file
- **spec_file**: Path to the build specification YAML
- **category**: Which subdirectory the schematic belongs to
- **version**: Semantic version string
- **description**: Purpose and usage context
- **dimensions**: Width (X), height (Y), depth (Z) in blocks
- **block_count_estimate**: Approximate number of blocks
- **primary_blocks**: Key block types used
- **tags**: Searchable keywords
- **district**: Which Knowledge World district this schematic is designed for
- **status**: Lifecycle state (specified, built, captured, verified)

## Schematic Lifecycle

Each schematic progresses through four stages:

```
specified --> built --> captured --> verified
```

1. **specified**: A build specification YAML exists in `specs/` defining exactly what to construct
2. **built**: The schematic has been constructed in-game following the specification
3. **captured**: The in-game build has been selected and saved as a `.litematic` file via Litematica
4. **verified**: The `.litematic` file loads correctly in Litematica and has been shared via Syncmatica

## Contributing a New Schematic

To add a new schematic to the library:

1. **Create the specification**: Write a YAML file in `specs/` following the spec template (see existing specs for reference). Define dimensions, block palette, layout, features, and construction notes.
2. **Build in-game**: Construct the schematic in a Minecraft creative world following your specification exactly.
3. **Capture with Litematica**:
   - Open Litematica (default keybind: M)
   - Switch to Area Selection mode
   - Select the entire build with 1-block padding on all sides
   - Set the origin at the northwest ground-level corner
   - Save as `.litematic` with the correct naming convention
4. **Add to catalog**: Create an entry in `catalog.yaml` with all required metadata fields
5. **Commit**: Add the `.litematic` file, spec YAML, and updated catalog to version control

## Litematica Workflow

### Loading a Schematic

1. Open Litematica (press M or configured keybind)
2. Navigate to **Schematic Placements** tab
3. Click **Load Schematics** and browse to the `.litematic` file
4. Position the hologram where you want to build
5. Use **Easy Place** mode to build block-by-block matching the hologram
6. Verify placement matches the specification

### Saving a Schematic

1. Switch to **Area Selection** mode in Litematica
2. Create a selection box around your completed build
3. Add 1 block of padding on all sides for placement flexibility
4. Set the selection origin to the northwest ground-level corner
5. Click **Save Schematic** and use the naming convention
6. Test-load the saved schematic in a flat world to verify it captured correctly

### Sharing via Syncmatica

Once a schematic is captured and verified, share it through the Syncmatica mod for server-wide visibility. Other players can browse shared schematics, load them as holograms, and build collaboratively.

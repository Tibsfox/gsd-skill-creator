# M8: Texture Pack and Resource Pack Architecture

> **Module ID:** VAV-TEXTURE
> **Domain:** Asset Hierarchy, Atlas Stitching & PBR Storage
> **Through-line:** *The texture is the signal.* A resource pack is not a cosmetic skin — it is a complete data hierarchy that maps every visible surface to a chain of JSON declarations and PNG payloads. The pack metadata selects a format generation. The block state JSON resolves a block's properties to a model. The model declares geometry and binds texture variables. The texture PNGs carry the pixel data. The atlas config controls how those PNGs are stitched into GPU-resident sprite sheets. With PBR, every surface gains four additional signal channels — normal, metalness, emissive, roughness — each stored as a separate PNG. The entire hierarchy, from `pack.mcmeta` down to the last MER pixel, maps to addressable RADOS objects in Ceph. Every texture is a storage object. Every object has an address. The voxel is the vessel; the texture is what fills it.

---

## Table of Contents

1. [Resource Pack Directory Structure](#1-resource-pack-directory-structure)
2. [Atlas System (Java 1.19.3+)](#2-atlas-system-java-1193)
3. [PBR Texture Sets (Bedrock Vibrant Visuals)](#3-pbr-texture-sets-bedrock-vibrant-visuals)
4. [Pack Format Versioning](#4-pack-format-versioning)
5. [Block State JSON Structure](#5-block-state-json-structure)
6. [Block Model JSON Structure](#6-block-model-json-structure)
7. [Ceph Storage Mapping](#7-ceph-storage-mapping)
8. [Cross-Reference](#8-cross-reference)
9. [Sources](#9-sources)

---

## 1. Resource Pack Directory Structure

### 1.1 The Complete Tree

A Minecraft resource pack is a directory (or ZIP archive) with a rigid hierarchy. Every file has a fixed path relative to the pack root, and the path itself encodes the file's function. There is no manifest listing assets — the directory structure IS the manifest. [SRC-RESPACK]

```
<pack-root>/
  pack.mcmeta              -- Pack metadata (format version, description, filters)
  pack.png                 -- Pack icon (64x64 PNG displayed in resource pack menu)
  assets/
    <namespace>/            -- e.g., "minecraft", "mymod", "vav"
      blockstates/          -- Block variant/multipart JSON
        stone.json
        oak_fence.json
        redstone_wire.json
      models/
        block/              -- Block model JSON (geometry + face textures)
          stone.json
          oak_fence_post.json
          oak_fence_side.json
        item/               -- Item model JSON (handheld rendering)
          stone.json
          diamond_sword.json
      textures/
        block/              -- Block face textures (PNG, typically 16x16)
          stone.png
          oak_planks.png
        item/               -- Item textures (PNG)
          diamond_sword.png
        entity/             -- Entity textures (player skins, mob textures)
        particle/           -- Particle effect textures
        gui/                -- UI element textures
        colormap/           -- Biome color lookup (grass.png, foliage.png)
      atlases/              -- Sprite atlas configs (1.19.3+, Java Edition)
        blocks.json         -- Controls block texture atlas stitching
        armor_trims.json
        signs.json          -- (+ banner_patterns, beds, chest, etc.)
      sounds/               -- Sound files (.ogg Vorbis)
        block/stone/hit1.ogg
      sounds.json           -- Sound event definitions (maps events to .ogg files)
      lang/                 -- Language files (JSON key-value)
        en_us.json
      shaders/              -- Custom shaders (core/, post/, program/)
      font/                 -- Font provider definitions
```

### 1.2 Namespace Isolation

The `<namespace>` directory creates a flat namespace partition. Vanilla Minecraft uses the namespace `minecraft`. Mods and data packs use their own namespaces (e.g., `create`, `sodium`). For VAV, the namespace is the organizational unit — each knowledge corpus gets its own namespace, and all its textures, models, and block states live within that namespace's subtree. [SRC-RESPACK]

A resource location (the canonical identifier for any asset) takes the form `<namespace>:<path>`, for example:
- `minecraft:block/stone` — the stone block texture from vanilla
- `vav:block/embedding_dense` — a custom VAV block texture

The colon-separated format maps directly to the filesystem: `assets/<namespace>/textures/<path>.png`. This means every resource location is a deterministic file path, and every file path is a deterministic RADOS object key.

### 1.3 Ceph Addressing

The path-to-key mapping is mechanical: strip the file extension, prefix with `packs/`. The extension is implied by pool and key prefix — textures are always PNGs, models are always JSON. Any Minecraft resource location resolves to a RADOS object key in O(1) with no lookup table. The full mapping table appears in Section 7.

---

## 2. Atlas System (Java 1.19.3+)

### 2.1 What Atlases Do

Before 1.19.3, Minecraft hardcoded which textures were stitched into which GPU sprite sheets. The atlas system (introduced in 22w46a / 1.19.3) externalizes this into JSON configuration files in `assets/<namespace>/atlases/`. Each atlas config declares which PNG textures to include in a named sprite sheet. The GPU loads the stitched atlas as a single large texture; individual block faces reference sub-regions within it via UV coordinates. [SRC-ATLAS]

This is a standard texture atlas pattern used in virtually all 3D engines — the innovation is making it data-driven and resource-pack-overridable.

### 2.2 The Five Source Types

Atlas config files contain a `sources` array. Each source entry has a `type` field selecting one of five strategies for populating the atlas: [SRC-ATLAS]

| Source Type | Function | Key Fields |
|-------------|----------|------------|
| `directory` | Include all PNGs from a subdirectory recursively | `source` (path), `prefix` (prepend to sprite names) |
| `single` | Include one specific PNG by resource path | `resource` (path), `sprite` (optional rename) |
| `filter` | Remove sprites matching namespace/path regex | `namespace` (regex), `path` (regex) |
| `unstitch` | Extract sub-regions from a single source image | `resource`, `regions` (list of {sprite, x, y, width, height}) |
| `paletted_permutations` | Generate color variants from palette key files | `textures` (list), `palette_key`, `permutations` (map) |

**`directory`** is the workhorse — the vanilla `blocks.json` atlas uses it to sweep all PNGs under `textures/block/`. **`filter`** acts as an exclusion list, removing unwanted sprites after `directory` includes them. **`unstitch`** is the inverse of atlas stitching — it breaks a single composite image into named sub-sprites by pixel coordinates. **`paletted_permutations`** generates armor trim color variants by applying palette lookup tables to grayscale source textures. [SRC-ATLAS]

### 2.3 Example: blocks.json Atlas Config

```json
{
  "sources": [
    {
      "type": "directory",
      "source": "block",
      "prefix": "block/"
    },
    {
      "type": "directory",
      "source": "entity/signs",
      "prefix": "entity/signs/"
    },
    {
      "type": "single",
      "resource": "minecraft:misc/underwater"
    },
    {
      "type": "filter",
      "namespace": "^example_mod$",
      "path": "^debug/.*"
    }
  ]
}
```

This config says: include every PNG under `textures/block/` (prefixed as `block/`), include sign entity textures, include the underwater overlay, and exclude any sprite from the `example_mod` namespace whose path starts with `debug/`. The result is a single GPU texture containing all block sprites, all sign sprites, and the underwater overlay.

### 2.4 Mipmapping and Atlas Size

The block atlas uses **4 mip levels** by default. Each mip level halves the resolution: a 16x16 base sprite becomes 8x8, 4x4, 2x2, and 1x1 at successive levels. To prevent texture bleeding between adjacent sprites in the atlas, each sprite is padded by at least `2^mip_levels` texels on each side — for 4 mip levels, that is 16 texels of padding minimum. [SRC-ATLAS]

The maximum atlas size is bounded by the GPU's maximum texture dimension (`GL_MAX_TEXTURE_SIZE`), typically 16384x16384 on modern hardware. If the stitched atlas would exceed this limit, Minecraft auto-downscales all sprites to fit. With vanilla Minecraft's ~800 unique block textures at 16x16 each, the atlas comfortably fits within a 1024x1024 sheet. High-resolution packs (32x32, 64x64, or 128x128 per block) push the atlas larger:

| Sprite Resolution | Sprites | Atlas Size (approx) | Mip Storage |
|-------------------|---------|---------------------|-------------|
| 16x16 | 800 | 512x512 to 1024x1024 | ~1.3 MB |
| 32x32 | 800 | 1024x1024 to 2048x2048 | ~5.3 MB |
| 64x64 | 800 | 2048x2048 to 4096x4096 | ~21 MB |
| 128x128 | 800 | 4096x4096 to 8192x8192 | ~85 MB |

### 2.5 Storage Implication for Ceph

Atlas configs are small JSON files (typically <2 KB) stored in the `vav-meta` pool. But the *result* of atlas stitching — the actual sprite sheet loaded by the GPU — is ephemeral (generated at load time from individual PNGs). Ceph stores the **source PNGs**, not the stitched atlas. The atlas config is a **recipe**, and the PNGs are the **ingredients**. This means:

- Source PNGs: stored as individual RADOS objects in `vav-regions`
- Atlas configs: stored in `vav-meta`
- Stitched atlases: reconstructed at load time by the client, never stored in Ceph

This separation mirrors how Ceph already handles data vs. metadata: the config pool tells you how to assemble the data; the data pool holds the raw materials.

---

## 3. PBR Texture Sets (Bedrock Vibrant Visuals)

### 3.1 The texture_set JSON Format

Bedrock Edition's Vibrant Visuals rendering pipeline (preview, expanding since 1.21.30) introduces physically-based rendering (PBR) through the `minecraft:texture_set` JSON format. Each texture set definition declares the layers that describe a surface's optical properties. The `format_version` field must be `"1.16.100"` or later. [SRC-TEXSET]

A texture set definition lives alongside its base texture in the `textures/` directory:
```
textures/
  blocks/
    stone.png              -- Base color (RGBA)
    stone.texture_set.json -- PBR layer declarations
    stone_normal.png       -- Normal map
    stone_mer.png          -- Metalness/Emissive/Roughness
    stone_heightmap.png    -- Parallax heightmap
```

### 3.2 PBR Layer Channels

| Layer | JSON Field | Channel Encoding | Purpose |
|-------|-----------|-----------------|---------|
| Base Color | `color` | RGBA 8-bit per channel | Albedo — what color the surface is under neutral white light |
| Normal Map | `normal` | RGB: X=R, Y=G, Z=B (tangent space) | Surface micro-geometry direction for lighting calculations |
| MER | `metalness_emissive_roughness` | R=metalness, G=emissive, B=roughness | Three material properties packed into one RGB texture |
| Heightmap | `heightmap` | Grayscale (R channel) | Parallax occlusion mapping depth data |
| MERS (1.21.30+) | `metalness_emissive_roughness_subsurface` | R=metalness, G=emissive, B=roughness, A=subsurface | Adds subsurface scattering for translucent materials (wax, leaves, skin) |

Each channel value ranges 0-255 in the PNG (mapped to 0.0-1.0 in the shader). Metalness is binary in practice (0 = dielectric, 255 = metal) but the format allows intermediate values for layered materials. Emissive at 255 means full self-illumination (glowstone, lava). Roughness at 0 = mirror-smooth, 255 = fully diffuse. [SRC-TEXSET]

### 3.3 Example: texture_set Definition

```json
{
  "format_version": "1.16.100",
  "minecraft:texture_set": {
    "color": "stone",
    "metalness_emissive_roughness": "stone_mer",
    "normal": "stone_normal",
    "heightmap": "stone_heightmap"
  }
}
```

Values can be PNG references (string filename without extension), hex color strings (`"#FF8040"`), or constant arrays (`[128, 0, 200, 255]`). Using a constant avoids storing a full PNG when every texel has the same value — for example, a non-metallic, non-emissive, rough surface can declare `"metalness_emissive_roughness": [0, 0, 255, 255]` instead of storing a solid-blue PNG. [SRC-TEXSET]

### 3.4 Storage Multiplication Factor

A standard block requires **1 PNG per unique texture**. A PBR block requires up to **4 PNGs**: color, normal, MER, and heightmap. For 256 unique block types at 16x16: standard = 256 KB, PBR = 1,024 KB. At 128x128 resolution: standard = 12.3 MB, PBR = 49.2 MB. This 4x multiplication is the key storage cost of PBR — and in Ceph, each PNG becomes a separate RADOS object addressable by layer type. [SRC-TEXSET]

### 3.5 Ceph Mapping for PBR Layers

Each PBR layer maps to a separate RADOS object, with the layer name as the final path component:

```
textures/<ns>/blocks/stone/color          ->  stone.png (base color)
textures/<ns>/blocks/stone/normal         ->  stone_normal.png
textures/<ns>/blocks/stone/mer            ->  stone_mer.png
textures/<ns>/blocks/stone/heightmap      ->  stone_heightmap.png
textures/<ns>/blocks/stone/_texset        ->  stone.texture_set.json
```

This structure means a query for "all layers of stone" is a prefix scan: `list_objects(prefix="textures/<ns>/blocks/stone/")` returns all 5 objects. A query for "all normal maps in the pack" requires iterating all block prefixes and selecting the `/normal` suffix — or maintaining a secondary index in `vav-meta` that maps layer type to object keys.

---

## 4. Pack Format Versioning

### 4.1 The pack_format Field

Every resource pack's `pack.mcmeta` contains a `pack_format` integer that declares which Minecraft version the pack targets. The game uses this to determine compatibility. [SRC-FORMAT]

```json
{
  "pack": {
    "pack_format": 46,
    "description": "VAV Knowledge Corpus Textures"
  }
}
```

### 4.2 Format Range (Snapshot 25w31a+)

Since snapshot 25w31a, `pack.mcmeta` supports `supported_formats` as either an integer range object or an array, declaring the minimum and maximum `pack_format` versions the pack supports: [SRC-FORMAT]

```json
{
  "pack": {
    "pack_format": 46,
    "supported_formats": {
      "min_inclusive": 34,
      "max_inclusive": 48
    },
    "description": "VAV Knowledge Corpus Textures (wide compatibility)"
  }
}
```

Alternatively, the range can be an array: `"supported_formats": [34, 48]`.

When a pack's format range does not include the game's expected format, the game displays a compatibility warning. The pack still loads, but only after user confirmation. Incompatible packs appear with a red border in the resource pack selection screen.

### 4.3 Compatibility Matrix (Key Milestones)

| pack_format | Minecraft Version(s) | Notable Changes |
|-------------|---------------------|-----------------|
| 1 | 1.6.1 - 1.8.9 | Original format |
| 4 | 1.13 - 1.14.4 | Flattening: namespaced IDs |
| 8 | 1.18 - 1.18.2 | Extended world height [-64, 319] |
| 12 | 1.19.3 | Atlas system introduced |
| 13 | 1.19.4 | Atlas `armor_trims` added |
| 22 | 1.20.3 - 1.20.4 | Equipment models |
| 32 | 1.20.5 - 1.20.6 | Item model overhaul |
| 34 | 1.21 - 1.21.1 | Current stable baseline |
| 46 | 1.21.4 | Item model rework, equipment asset JSON |
| 48 | 1.21.5 (expected) | — |

Format numbers are not consecutive — Mojang reserves gaps for snapshot-only formats that do not reach release. [SRC-FORMAT]

### 4.4 Versioning as Ceph Object Generations

Pack format versioning maps to RADOS object versioning via **object name versioning**: include the format in the key (`packs/<ns>/v46/textures/block/stone/color`). This allows multiple format versions to coexist in the same pool, mirrors how Minecraft handles DataVersion for chunk data, and supports rollback. Old versions are retained; garbage collection removes obsolete versions on a configurable schedule.

---

## 5. Block State JSON Structure

### 5.1 What Block States Do

Every block in Minecraft has a set of **properties** that define its current state. A stone block has no properties (it is always just stone). An oak fence has properties for each cardinal direction (`north`, `south`, `east`, `west` = `true`/`false`) and `waterlogged` (`true`/`false`). A redstone wire has `north`, `south`, `east`, `west` (each `up`/`side`/`none`) plus `power` (0-15). [SRC-BLOCKSTATE]

The block state JSON in `blockstates/<block>.json` maps every possible combination of property values to a model (or set of models) to render. There are two formats: **variants** and **multipart**. [SRC-BLOCKSTATE]

### 5.2 Variants Format

The variants format maps each property combination to a single model reference:

```json
{
  "variants": {
    "": {
      "model": "minecraft:block/stone"
    }
  }
}
```

For a block with properties, each variant key is a comma-separated list of `property=value` pairs:

```json
{
  "variants": {
    "facing=north": { "model": "minecraft:block/furnace", "y": 0 },
    "facing=south": { "model": "minecraft:block/furnace", "y": 180 },
    "facing=east":  { "model": "minecraft:block/furnace", "y": 90 },
    "facing=west":  { "model": "minecraft:block/furnace", "y": 270 }
  }
}
```

Each variant entry supports `model` (resource location), `x` and `y` (rotation in 90-degree increments), `uvlock` (lock UV to block orientation, not model orientation), and `weight` (for random selection when the value is an array of models). [SRC-BLOCKSTATE]

### 5.3 Multipart Format

The multipart format composes a block's visual from multiple conditional model pieces. Each entry has a `when` condition and an `apply` action:

```json
{
  "multipart": [
    {
      "apply": { "model": "minecraft:block/oak_fence_post" }
    },
    {
      "when": { "north": "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "uvlock": true }
    },
    {
      "when": { "south": "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "y": 180, "uvlock": true }
    },
    {
      "when": { "east": "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "y": 90, "uvlock": true }
    },
    {
      "when": { "west": "true" },
      "apply": { "model": "minecraft:block/oak_fence_side", "y": 270, "uvlock": true }
    }
  ]
}
```

The post is always rendered. Each fence side is conditionally rendered based on whether a neighboring block connects on that face. The result is a composite model built from up to 5 pieces. Multipart `when` conditions support `OR` logic via nested arrays. [SRC-BLOCKSTATE]

### 5.4 Combinatorial Explosion

For blocks with many properties, variants produces a combinatorial explosion: a redstone wire (4 directional properties x 3 values x 16 power levels = **1,296 variants**). Multipart avoids this via independent conditional composition. For Ceph, each block state JSON is a single `vav-meta` object — even the largest are under 100 KB. [SRC-BLOCKSTATE]

---

## 6. Block Model JSON Structure

### 6.1 Model Inheritance

Block models in `models/block/<name>.json` use a **parent-child inheritance** system. A model can declare a `parent` reference, inheriting all properties from the parent and overriding specific fields. The base parents are built into the game: [SRC-MODEL]

```
minecraft:block/block                -- Root parent: ambient occlusion, display transforms
  minecraft:block/cube               -- 6-face cube with independent textures
    minecraft:block/cube_all         -- All 6 faces use the same texture
    minecraft:block/cube_column      -- Top/bottom vs side textures (logs, pillars)
    minecraft:block/cube_bottom_top  -- Distinct top, bottom, and side textures
  minecraft:block/cross              -- X-shaped cross (flowers, saplings)
  minecraft:block/slab               -- Half-height cube
  minecraft:block/stairs             -- Staircase geometry
```

A custom block model:

```json
{
  "parent": "minecraft:block/cube_all",
  "textures": {
    "all": "vav:block/embedding_dense"
  }
}
```

This inherits the full cube geometry from `cube_all` and sets every face texture to `vav:block/embedding_dense`. The texture variable `all` is defined by the parent as a shorthand for all six face references.

### 6.2 Texture Variables

Models define texture variables using a `textures` map. Variable names are arbitrary strings (by convention: `particle`, `all`, `top`, `bottom`, `side`, `north`, `south`, `east`, `west`, `up`, `down`). Variables are resolved by walking the parent chain until a concrete texture path is found. A `#` prefix references a variable: `"#all"` means "look up the variable named `all`". The `cube_all` parent, for example, maps all six face directions plus `particle` to the single `#all` variable. [SRC-MODEL]

### 6.3 Elements Array

Custom geometry is defined via the `elements` array. Each element is an axis-aligned cuboid with six faces:

```json
{
  "parent": "minecraft:block/block",
  "textures": {
    "top": "vav:block/info_top",
    "side": "vav:block/info_side",
    "particle": "vav:block/info_side"
  },
  "elements": [
    {
      "from": [0, 0, 0],
      "to": [16, 16, 16],
      "faces": {
        "up":    { "texture": "#top",  "uv": [0, 0, 16, 16], "cullface": "up" },
        "down":  { "texture": "#top",  "uv": [0, 0, 16, 16], "cullface": "down" },
        "north": { "texture": "#side", "uv": [0, 0, 16, 16], "cullface": "north" },
        "south": { "texture": "#side", "uv": [0, 0, 16, 16], "cullface": "south" },
        "east":  { "texture": "#side", "uv": [0, 0, 16, 16], "cullface": "east" },
        "west":  { "texture": "#side", "uv": [0, 0, 16, 16], "cullface": "west" }
      }
    }
  ]
}
```

Key fields per element: [SRC-MODEL]

| Field | Type | Description |
|-------|------|-------------|
| `from` | [x, y, z] | Start corner of the cuboid (0-16 coordinate space) |
| `to` | [x, y, z] | End corner of the cuboid |
| `rotation` | object | Optional rotation around a single axis (`origin`, `axis`, `angle`) |
| `shade` | boolean | Whether to apply ambient occlusion shading (default true) |
| `faces` | object | Per-face texture assignment, UV mapping, tint index, and cull face |

Each face within `faces` can specify:
- `texture` — texture variable reference (`"#side"`) or direct path
- `uv` — UV coordinates `[u1, v1, u2, v2]` within the 16x16 texture space
- `cullface` — which block face this polygon is adjacent to; if the neighboring block is opaque, this face is skipped (face culling)
- `rotation` — UV rotation in 90-degree increments (0, 90, 180, 270)
- `tintindex` — integer index for biome-dependent color tinting (grass, leaves, water)

### 6.4 Face Culling

Face culling (`cullface` field) is Minecraft's primary rendering optimization: faces adjacent to opaque neighbors are skipped entirely. A fully enclosed stone block draws zero faces. For VAV, culling metadata determines which texture objects need to be fetched for a given viewpoint — only visible faces require their RADOS texture objects to be read from Ceph. [SRC-MODEL]

---

## 7. Ceph Storage Mapping

### 7.1 Complete Hierarchy Table

The full mapping from Minecraft's texture hierarchy to Ceph object addresses:

| Hierarchy Level | Minecraft Path | Ceph Object Key | Pool | Typical Size |
|----------------|----------------|-----------------|------|-------------|
| Pack metadata | `pack.mcmeta` | `packs/<ns>/metadata` | vav-meta | <1 KB |
| Pack icon | `pack.png` | `packs/<ns>/icon` | vav-meta | ~16 KB |
| Block state | `blockstates/stone.json` | `packs/<ns>/blockstates/stone` | vav-meta | 0.1-100 KB |
| Block model | `models/block/stone.json` | `packs/<ns>/models/block/stone` | vav-meta | 0.5-5 KB |
| Item model | `models/item/stone.json` | `packs/<ns>/models/item/stone` | vav-meta | 0.5-2 KB |
| Base texture | `textures/block/stone.png` | `packs/<ns>/textures/block/stone/color` | vav-regions | 1-48 KB |
| Normal map | `textures/block/stone_normal.png` | `packs/<ns>/textures/block/stone/normal` | vav-regions | 1-48 KB |
| MER texture | `textures/block/stone_mer.png` | `packs/<ns>/textures/block/stone/mer` | vav-regions | 1-48 KB |
| Heightmap tex | `textures/block/stone_heightmap.png` | `packs/<ns>/textures/block/stone/heightmap` | vav-regions | 1-48 KB |
| Texture set def | `textures/block/stone.texture_set.json` | `packs/<ns>/textures/block/stone/_texset` | vav-meta | <1 KB |
| Atlas config | `atlases/blocks.json` | `packs/<ns>/atlases/blocks` | vav-meta | 1-3 KB |
| Sound file | `sounds/block/stone/hit1.ogg` | `packs/<ns>/sounds/block/stone/hit1` | vav-regions | 10-500 KB |
| Sound index | `sounds.json` | `packs/<ns>/sounds/_index` | vav-meta | 50-200 KB |
| Language file | `lang/en_us.json` | `packs/<ns>/lang/en_us` | vav-meta | 200-600 KB |

### 7.2 Pool Assignment Rules

The assignment to `vav-meta` vs. `vav-regions` follows a principle:

- **vav-meta:** JSON declarations, configuration, indices. Small objects. Read-heavy, write-rare. Always 3-way replicated for durability.
- **vav-regions:** Binary payloads (PNGs, OGGs, .mca files). Larger objects. Read-heavy for active rendering; eligible for erasure coding when archived.

The boundary is: if an object's content is **structural** (it tells the system how to interpret other objects), it goes in `vav-meta`. If it is **payload** (it contains the actual data to be rendered, played, or displayed), it goes in `vav-regions`.

### 7.3 Object xattrs

Each texture object in `vav-regions` carries xattrs for metadata queries without payload download: `vav.namespace`, `vav.block`, `vav.layer` (color/normal/mer/heightmap), `vav.resolution` (pixels per edge), `vav.pack_format`, `vav.hash` (SHA-256 for dedup), `vav.mtime`. A RADOS `getxattr` returns any attribute in a single round trip.

---

## 8. Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Thesis) | Resource packs are the visual encoding layer of the "voxel as vessel" concept — the texture is what you see when you look at the knowledge |
| M2 (Ceph/RADOS) | Every texture, model, and config maps to a RADOS object in the three-pool architecture |
| M3 (RAG Pipeline) | Block state resolution (property -> model -> texture) is part of the retrieval chain — rendering a knowledge voxel requires resolving its visual representation |
| M4 (Anvil/NBT) | Block state palettes (Section 6 of M4) reference block types whose visual appearance is defined by this module's resource pack hierarchy |
| M5 (PoC Plan) | PoC must include at least a minimal resource pack with custom textures for the VAV block types |
| M6 (Spatial Mapping) | Texture resolution choice affects rendering density — high-res textures for knowledge-dense regions, low-res for sparse regions (LOD by information density) |
| M7 (Block-Chunk Data) | Block state JSON (Section 5) is the bridge between the data module's palette entries and this module's visual rendering pipeline |

---

## 9. Sources

| ID | Reference |
|----|-----------|
| SRC-RESPACK | Minecraft Wiki. "Resource pack." https://minecraft.wiki/w/Resource_pack |
| SRC-ATLAS | Minecraft Wiki. "Atlas." https://minecraft.wiki/w/Atlas_(resource) |
| SRC-FORMAT | Minecraft Wiki. "Pack format." https://minecraft.wiki/w/Pack_format |
| SRC-TEXSET | Microsoft Learn. "Texture Set JSON Documentation and Introduction to Texture Sets." https://learn.microsoft.com/en-us/minecraft/creator/documents/rtxtexturesetdocumentation |
| SRC-BLOCKSTATE | Minecraft Wiki. "Model: Block states." https://minecraft.wiki/w/Model#Block_states |
| SRC-MODEL | Minecraft Wiki. "Model: Block models." https://minecraft.wiki/w/Model#Block_models |
| SRC-BEDROCK-ATLAS | Bedrock Wiki. "Texture Atlases." https://wiki.bedrock.dev/concepts/texture-atlases.html |
| SRC-ADDONS | Microsoft Learn. "Add-Ons Reference: blocks.json." https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blocksreference/examples/blockreference |
| SRC-PBR | Microsoft Learn. "Physically Based Rendering and Ray Tracing." https://learn.microsoft.com/en-us/minecraft/creator/documents/rtxgettingstarted |

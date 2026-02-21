---
name: schematic-library
description: "Manages Litematica schematic library with categorized catalog, build specifications, Syncmatica sharing, and naming conventions. Use when creating schematics, managing the schematic catalog, or sharing builds via Syncmatica."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "schematic.*(create|catalog|share|library)"
          - "litematica"
          - "syncmatica.*share"
          - "build.*spec"
        files:
          - "minecraft/schematics/catalog.yaml"
          - "minecraft/schematics/**/*.yaml"
          - "infra/world/spawn/*.yaml"
          - "infra/world/schematics/**/*.yaml"
        contexts:
          - "schematic management"
          - "build specification"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "05-knowledge-world-design"
      phase_origin: "187-188"
---

# Schematic Library

## Purpose

Manages the Litematica schematic library for Knowledge World builds with categorized catalogs, build specifications, Syncmatica sharing, and consistent naming conventions. Handles the full schematic lifecycle from specification through build, capture, and verification. Provides the build template infrastructure that educational content references.

## Capabilities

- Schematic catalog with categorized entries (category-name-version.litematic naming)
- Build specifications with block lists, dimensions, and placement coordinates
- Syncmatica sharing script for multi-player schematic distribution
- PENDING status for unbuilt schematics (does not fail, reports status)
- Four-stage schematic lifecycle: specified, built, captured, verified
- Dashes replacing dots in version strings for filename compatibility
- Gateway schematic uses white concrete placeholder stripe for district-specific color
- INFRA_DIR convention: points to infra/ directory, matching test patterns
- Relative coordinates from Creative District origin (Phase 186 provides absolute)

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/world/spawn/syncmatica-share.sh` | Syncmatica schematic sharing and distribution |

## Dependencies

- Litematica mod installed on client (client-setup skill)
- Syncmatica mod for server-side schematic sharing
- Schematic YAML specifications in `infra/world/schematics/`
- District coordinate system from world-design skill

## Usage Examples

**List available schematics:**
```
Read minecraft/schematics/catalog.yaml
for categorized schematic listing with lifecycle status
```

**Share schematic via Syncmatica:**
```bash
infra/world/spawn/syncmatica-share.sh computing-hub-v1-0
# Shares schematic with connected players via Syncmatica
```

**Check schematic lifecycle status:**
```
Review catalog.yaml entries for lifecycle field:
specified -> built -> captured -> verified
```

**Create new schematic specification:**
```
Add entry to appropriate category in catalog.yaml with:
- name following category-name-version convention
- block_list, dimensions, placement coordinates
- lifecycle: specified (initial state)
```

## Test Cases

### Test 1: Catalog completeness
- **Input:** Read catalog.yaml
- **Expected:** Lists 10+ schematics with category-name-version naming pattern
- **Verify:** `grep -c 'name:' minecraft/schematics/catalog.yaml` returns >= 10

### Test 2: Naming convention compliance
- **Input:** Check all schematic filenames in catalog
- **Expected:** All follow category-name-version.litematic pattern with dashes
- **Verify:** No filenames contain dots within the version segment

### Test 3: Unbuilt schematic handling
- **Input:** Run syncmatica-share.sh for an unbuilt schematic
- **Expected:** Reports PENDING status instead of failing
- **Verify:** Exit code 0 with "PENDING" in output for unbuilt schematics

## Token Budget Rationale

1.5% budget covers the schematic catalog YAML, sharing script, and build specification format. The lifecycle management and naming conventions provide essential context for build operations, while the Syncmatica integration adds moderate complexity.

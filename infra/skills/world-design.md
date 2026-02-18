---
name: world-design
description: "Designs Minecraft Knowledge World spatial layout with themed districts, coordinate systems, color palettes, wayfinding, and sign standards. Use when planning world layout, designing districts, or implementing wayfinding systems."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "world.*(design|layout|plan)"
          - "district.*(create|palette|plan)"
          - "wayfind"
          - "sign.*standard"
          - "coordinate.*range"
        files:
          - "infra/minecraft/world-design/*.yaml"
          - "infra/scripts/validate-world-layout.sh"
        contexts:
          - "world design"
          - "spatial planning"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "05-knowledge-world-design"
      phase_origin: "186"
---

# World Design

## Purpose

Designs the Minecraft Knowledge World spatial layout with themed districts, coordinate systems, color palettes, wayfinding systems, and sign standards. Provides the architectural foundation for all builds, ensuring consistent visual language, non-overlapping coordinate ranges, and navigable spaces that teach computing concepts through spatial experience.

## Capabilities

- Themed district design with unique color palettes and block selections
- Coordinate system with non-overlapping ranges per district
- Color palette definitions per district for visual consistency
- Wayfinding system: signs, paths, landmarks for navigation
- Sign standards: 15-character line limit, 6 sign types, consistent formatting
- Validation script to verify non-overlapping coordinate ranges
- District-level build guidelines and block palette documentation

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/validate-world-layout.sh` | Validates non-overlapping district coordinate ranges |

## Dependencies

- District YAML definitions in `infra/minecraft/world-design/`
- Coordinate range specifications per district
- Minecraft block palette knowledge for district theming

## Usage Examples

**Validate world layout:**
```bash
infra/scripts/validate-world-layout.sh
# Checks all districts for non-overlapping coordinate ranges
```

**Reference district palette:**
```
Read infra/minecraft/world-design/districts.yaml
for block palette and coordinate range per district
```

**Check sign standards:**
```
Reference sign standard documentation for:
- 15-character line limit
- 6 sign types and their uses
- Formatting conventions
```

## Test Cases

### Test 1: Non-overlapping coordinates
- **Input:** Run `validate-world-layout.sh` against all district definitions
- **Expected:** All districts have non-overlapping coordinate ranges
- **Verify:** `infra/scripts/validate-world-layout.sh; echo $?` returns 0

### Test 2: District completeness
- **Input:** Check district YAML files
- **Expected:** Each district has: name, coordinate range, color palette, block palette, description
- **Verify:** All required fields present in each district YAML

### Test 3: Sign line limit
- **Input:** Review sign standards documentation
- **Expected:** All example signs respect 15-character line limit
- **Verify:** No example sign text exceeds 15 characters per line

## Token Budget Rationale

1.5% budget covers the validation script and district YAML definitions that provide spatial context for all Knowledge World builds. The coordinate system and wayfinding rules are referenced frequently by downstream build skills, justifying moderate context allocation.

---
name: educational-curriculum
description: "Creates spatial learning experiences that teach computing concepts through Minecraft builds, including guided build methodology, curriculum design, and the Amiga Corner exhibit. Use when designing educational builds or creating curriculum content."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "curriculum.*(create|design)"
          - "guided.*build"
          - "spatial.*learn"
          - "education.*content"
          - "amiga.*corner"
        files:
          - "infra/knowledge-world/curriculum/**/*.md"
          - "infra/knowledge-world/curriculum/**/*.yaml"
          - "infra/knowledge-world/amiga-corner/**/*"
        contexts:
          - "educational design"
          - "curriculum development"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "05-knowledge-world-design"
      phase_origin: "189-190"
---

# Educational Curriculum

## Purpose

Creates spatial learning experiences that teach computing concepts through Minecraft builds. Provides the guided build methodology (9-step creation process), computing-to-Minecraft metaphor mappings, and the Amiga Corner exhibit design. Bridges educational content design with the schematic library and world design infrastructure.

## Capabilities

- 28 computing-to-Minecraft metaphor mappings (15 primary + 13 extended)
- Universal block palette: stone brick walls, cyan glazed terracotta corridors, glass interfaces, oak signs
- 15-character sign line limit with 6 sign types and consistent formatting conventions
- 9-step guided build creation process from concept identification through Litematica capture
- 30-60 minute target window: 8-12 build steps at 3-5 minutes each, plus orientation/walkthrough
- Amiga Corner exhibit: pixel art gallery, demo scene exhibit, tool evolution walkthrough
- 7 artworks spanning OCS, EHB, HAM6, AGA, and Hi-Res palette modes
- 6 demo productions covering 1986-2003 timeline (Juggler to Starstruck)
- 7 tool evolution stations including SoundTracker as separate from ProTracker
- Schematic specs use relative coordinates from Creative District origin
- All exhibit content legally distributable (public_domain, freeware, scene_production)

## Key Scripts

| Script | Purpose |
|--------|---------|
| (documentation/YAML-only skill) | No executable scripts -- curriculum documents and exhibit specifications |

## Dependencies

- World design skill for district coordinates and block palettes
- Schematic library skill for build specifications and Litematica workflow
- Content curation skill for legal compliance of Amiga Corner content
- Asset conversion skill for Amiga file format references

## Usage Examples

**Design a new guided build:**
```
Follow the 9-step guided build creation process:
1. Identify computing concept
2. Select metaphor mapping
3. Design spatial layout
4. Choose block palette
5. Write sign content (15-char limit)
6. Specify build steps (8-12, 3-5 min each)
7. Create schematic specification
8. Build in Minecraft Creative
9. Capture with Litematica
```

**Reference Amiga Corner exhibit:**
```
Read infra/knowledge-world/amiga-corner/ for:
- Pixel art gallery: 7 artworks with palette mode coverage
- Demo scene exhibit: 6 productions spanning 1986-2003
- Tool evolution: 7 stations from SoundTracker to modern
```

**Create curriculum content:**
```
Use computing-to-Minecraft metaphors from curriculum docs:
- CPU = command block chain
- RAM = chest arrays
- Network = minecart system
(28 total mappings available)
```

## Test Cases

### Test 1: Guided build methodology completeness
- **Input:** Read methodology document
- **Expected:** Contains all 9 guided build creation steps
- **Verify:** `grep -c 'Step [0-9]' infra/knowledge-world/curriculum/methodology.md` returns 9

### Test 2: Metaphor mapping coverage
- **Input:** Count computing-to-Minecraft metaphor mappings
- **Expected:** At least 28 mappings (15 primary + 13 extended)
- **Verify:** Total mapping entries >= 28

### Test 3: Amiga Corner legal compliance
- **Input:** Check all exhibit content licenses
- **Expected:** All content has license: public_domain, freeware, or scene_production
- **Verify:** No exhibit references content with restrictive licenses

## Token Budget Rationale

1.5% budget covers curriculum design documents, metaphor mappings, and Amiga Corner exhibit specifications. While documentation-heavy, the 28 metaphor mappings and 9-step methodology provide essential context for educational content creation that needs to be loaded for guided build design sessions.

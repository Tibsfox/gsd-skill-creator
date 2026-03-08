# v1.49.17 — The Space Between

**Shipped:** 2026-03-04
**Commits:** 9
**Files:** 55 changed | **New Code:** ~5,129 LOC
**Tests:** 112 new

## Summary

Transform three creative/educational source documents and a 31-chapter math textbook into integrated educational packs within gsd-skill-creator. First milestone to implement the cartridge packaging format as a composition mechanism.

This release is named for the essay that became its philosophical spine — *The Space Between: A Muse for the Mesh* — which traces the structural correspondence between audio engineering, hardware architecture, and the mesh's design principles. The cartridge format that ships here is the first concrete implementation of composition-as-packaging: discrete knowledge domains (audio, hardware, mathematics) loaded, validated, and bridged into a unified educational surface, the way Mark Farina layers four tracks in a single crossfade and the listener hears one continuous field of sound.

## Key Features

### Cartridge Format
- New packaging format for composable educational content
- Cartridge types, loader, validator, registry, packer/unpacker
- Integration with existing pack system
- First composition mechanism that treats knowledge packs as tracks in a mix

### Audio Engineering Pack
- 36 concepts across 6 domains (synthesis, physics of sound, consoles & mixing, DJ culture, MIDI & protocols, production)
- 32 citations from foundational audio engineering literature
- College enrichments for music and physics departments

### Hardware Infrastructure Pack
- 5 hardware tiers (edge, desktop, workstation, server, cloud) with node profiles and type system
- College enrichments for electronics and engineering departments
- Direct mapping to the mesh architecture's heterogeneous compute model

### Muse Vocabulary
- Foundation vocabulary index for the creative insight engine (Cedar)
- 122-entry vocabulary with cross-domain concept bridging between packs

### Space Between Cartridge
- 31 integrated concepts bridging audio, hardware, and mathematics
- Integration tests validating cartridge composition and cross-references

### Maple Foxy Bells Essays
- *The Space Between: A Muse for the Mesh* (393 lines) — the philosophical spine
- *Audio Synthesis Reference* (1,019 lines) — 27-channel synthesis deep dive
- *Hardware Expansion Pack* (874 lines) — computing history from Amiga custom chips to modern mesh

### Housekeeping
- Package renamed: `dynamic-skill-creator` to `gsd-skill-creator`
- Resolved 3 TypeScript compilation errors

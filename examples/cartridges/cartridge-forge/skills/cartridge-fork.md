---
name: cartridge-fork
description: Fork a cartridge to a new id with forkOf provenance.
---

# cartridge-fork

Use when the user wants to clone an existing cartridge and modify it
without losing lineage. Stamps `provenance.forkOf` with the source id.

Calls `skill-creator cartridge fork <path> <newId> [--out <path>]`.

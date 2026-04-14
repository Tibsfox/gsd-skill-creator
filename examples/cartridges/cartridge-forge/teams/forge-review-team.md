---
name: forge-review-team
description: Pre-ship review of any cartridge.
---

# forge-review-team

**Members:** forge-architect, forge-validator, forge-librarian.

Use for pre-ship review of any cartridge — whether freshly designed,
forked, or migrated.

1. **forge-architect** critiques the shape (chipset choice, topology).
2. **forge-validator** runs `cartridge validate` and `cartridge eval`.
3. **forge-librarian** checks provenance + runs dedup.

All three must sign off before the cartridge ships.

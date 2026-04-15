# grove-migration

Migrate grove state between format versions. Covers the grove-migration-live test suite's expectations (tier classification, chunk promotion), SkillDiff-driven incremental migration, and the JSON↔ArenaSet migration path used by the memory arena stack. Migrations are content-addressed and reversible when the source is retained.

**Triggers:** `migrate grove`, `grove format migration`, `grove tier classification`, `arenaset migration`, `grove format version`, `skilldiff migrate`

**Affinity:** `grove-keeper`

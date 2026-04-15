# storage-tiering

Classify data across tiers — hot (live working set), warm (accessible, not in working set), cold (archived, restore required), frozen (offsite, long recovery). Owns the rules that decide which tier a path belongs in and emits promote/demote recommendations when observed access patterns drift from the declared tier. Every classification becomes part of the RetentionPolicy record for its namespace.

**Triggers:** `storage tier`, `promote tier`, `demote tier`, `hot warm cold frozen`, `tier policy`, `access pattern`

**Affinity:** `housekeeping-capcom`, `archivist`, `curator`

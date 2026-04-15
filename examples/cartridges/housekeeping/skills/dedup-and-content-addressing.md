# dedup-and-content-addressing

Find duplicate files and content-addressable groups across the repo and known data stores. Writes a DedupReport that lists each collision set, proposes a canonical location, and records the content hash that identifies the group. Canonicalization is a human-approved step — the report is the work product, not a bulk mv.

**Triggers:** `find duplicates`, `dedup report`, `content hash`, `canonical location`, `duplicate files`, `hash the tree`

**Affinity:** `housekeeping-capcom`, `curator`

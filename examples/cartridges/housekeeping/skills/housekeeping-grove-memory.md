# housekeeping-grove-memory

The core of this cartridge — operate the grove memory substrate for the custodial pipeline. Every other skill writes into the `housekeeping` namespace; this skill owns query / link / diff / replay / export. A full custodial history can be rehydrated from grove by walking the GroveActivityLog and reconstructing HousekeepingSweep → StaleFileReport → ArchiveEntry → SnapshotRecord → DedupReport → RestoreDrillResult → RetentionAudit in order. Cross-cartridge linking lets a `ReleaseRecord` from the release-engine cartridge reference the ArchiveEntry that preserved its shipped state.

**Triggers:** `housekeeping grove`, `grove archive record`, `grove snapshot record`, `custodial history`, `rehydrate archive`, `cross cartridge archive`

**Affinity:** `housekeeping-capcom`, `archivist`

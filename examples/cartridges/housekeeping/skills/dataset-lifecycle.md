# dataset-lifecycle

Move datasets through the lifecycle — raw → curated → derived → archived. Each transition writes a DatasetLifecycleEvent record linking the source to the destination and recording the transformation applied. Makes it possible to trace a curated dataset back to its raw inputs without conversation-level memory.

**Triggers:** `curate dataset`, `dataset raw to curated`, `dataset lifecycle`, `derive dataset`, `dataset provenance`, `archive dataset`

**Affinity:** `housekeeping-capcom`, `curator`, `archivist`

# grove-memory-operations

The core of this cartridge — operate GSD's grove content-addressed memory. Covers record-type modeling, import/export, multi-hop retrieval, diff inspection, signature verification, activity-log replay, namespace queries, and migration between arena snapshots. Every other skill in this cartridge produces records that this skill knows how to read, link, and reconcile. When a session hands off or a phase closes, grove is what carries the context forward — not the conversation window.

**Triggers:** `grove query`, `grove import`, `grove export`, `grove record`, `grove memory`, `multi-hop retrieval`, `content addressed`, `skill view`, `grove namespace`, `activity log`, `arena snapshot`, `replay grove`

**Affinity:** `gsd-capcom`, `gsd-executor`

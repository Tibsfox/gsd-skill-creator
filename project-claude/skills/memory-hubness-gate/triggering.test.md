## SHOULD trigger

- "Embed these three fetched arXiv abstracts into the Grove store." — STRANGER externally-ingested content entering vector memory; the write path this gate wraps.
- "Run memory-consolidation to promote today's session-retro traces into MEMORY.md." — consolidation promotes records into the embedding index, the primary place the gate runs.
- "Upsert this scraped web snippet into pgvector so future queries can find it." — inserting untrusted content into vector memory; must be fan-in-screened before it can become a hub.

## SHOULD NOT trigger

- "Which memory records are nearest to this query?" — pure read/recall; that is memory-use-warrant's read-side gate, not a write.
- "Re-add this note; it's the identical content-addressed hash already in the store." — deterministic HOME dedup, no new geometry enters the index (explicit skip).
- "Vet this community skill file before I load it." — file-side trust decision handled by skill-injection-guardian, not a memory-record write.

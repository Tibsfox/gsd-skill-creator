# Gastown Origin: Beads Persistence

## Where This Comes From

The beads-state skill is a direct adaptation of Gastown's git-backed issue tracking system. In the original Gastown Go codebase, "beads" are lightweight work items identified by prefix-based IDs (e.g., `bead-a1b2c`). Each bead is a file on disk, tracked by git, forming an append-only audit trail of work.

## Key Mapping: Gastown to Skill-Creator

| Gastown Concept | Beads-State Equivalent | Adaptation Notes |
|----------------|----------------------|------------------|
| Bead (Go struct) | WorkItem (TypeScript interface) | Same semantics, TypeScript types |
| `.gastown/beads/` directory | `.chipset/state/work/` directory | Namespaced under chipset |
| Git-tracked bead files | JSON files with sorted keys | Git-friendly by design |
| Bead ID (prefix-hash) | `bead-{random}` format | Same pattern, simplified generation |
| Rig (workspace) | `rig` field on AgentIdentity | Preserved as agent context |
| Hook (work assignment) | HookState with GUPP enforcement | Formalized as typed state |
| Convoy (batch) | Convoy with progress tracking | Added progress calculation |

## Design Decisions

### Why Filesystem, Not Database

Gastown's original design uses the filesystem as its database, with git providing versioning, audit trails, and distributed replication. This skill preserves that philosophy:

1. **Readability:** `cat .chipset/state/agents/polecat-alpha.json` shows state instantly
2. **Diffability:** `git diff` shows exactly what changed between states
3. **Portability:** No runtime dependencies beyond Node.js `fs` module
4. **Recovery:** Atomic writes prevent corruption; git history enables rollback

### Why Atomic Writes

Gastown agents run in parallel. A process crash during a file write could leave partial JSON that breaks all downstream reads. The write-temp-fsync-rename pattern is the standard POSIX solution:

- `rename()` is atomic on all major filesystems (ext4, APFS, NTFS with caveats)
- The temp file acts as a staging area -- only complete data gets promoted
- If the process dies before rename, the original file is untouched

### Why Sorted Keys

When multiple agents update state files that git tracks, unsorted keys cause spurious diffs (JSON.stringify order depends on insertion order). Sorted keys ensure that two identical objects always produce identical JSON, making git diffs meaningful and merge-friendly.

## What Changed From Gastown

1. **Language:** Go to TypeScript -- async/await replaces goroutines
2. **ID generation:** Simplified from Gastown's prefix system to `{entity}-{random}`
3. **Schema:** TypeScript interfaces replace Go structs (compile-time safety)
4. **Merge queue:** Formalized as MergeRequest entity (was implicit in Gastown)
5. **Progress tracking:** Convoy progress is computed, not manually set

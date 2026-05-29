# v1.49.910 — Counter-Cadence Codify Ship: Promote #10459 (Class-Multi-Method Consolidated-Gate) ESTABLISHED + Clear 8 PARTIAL Discipline-Coverage Entries

**Released:** 2026-05-29

Counter-cadence codify ship — doc-only. Closes the codify-axis backlog accumulated by the v903-v909 seven-chip LoaderContext campaign, plus a discipline-coverage drift sweep that takes PARTIAL coverage to zero:

- **#10459** — Class-multi-method consolidated-gate sub-variant of #10448 (Architecture-retrofit patterns). v902 `state-reader.ts` (M=1 public) + v907 `file-store.ts` (M=5) + v908 `conversation-store.ts` (M=3+1 mixed) three-instance evidence. The single ESTABLISHED candidate from the campaign: each public read method hoists one `ensureAllowed` on the class-wrapped scope, private fs-ops inherit transitively (one audit per public call regardless of internal fan-out). Audit target is the wrapped SCOPE — distinct from #10455's file-path target (N=1 single fs-op method) and from the class-instance multi-method per-file target (N≥2 parallel public methods).
- **8 PARTIAL → 0** — discipline-coverage drift sweep. Eight lessons documented in canonical docs but absent from the manifest are wired to their owning entries: #10176/#10183/#10188 → Ship pipeline (`tools/pre-tag-gate.sh` registered as canonical doc); #10364/#10365/#10401 → Mission package framing (`docs/scaffold-manifest-discipline.md` registered); #10391 → Sub-agent dispatch; #10373 → Two-layer closure.

Counter-cadence count: 10 → 11. Lessons in manifest: 99 → 108. Discipline-coverage PARTIAL 8 → 0; UNCODIFIED unchanged at 39 (ceiling 41). KNOWN_UNWIRED Loader unchanged at 0 (ratchet closed at v909).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path

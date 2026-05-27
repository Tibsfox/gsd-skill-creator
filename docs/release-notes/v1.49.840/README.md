> Following v1.49.839 — _ProcessContext singleton chip: `intelligence/analyzer/findings/stalled.ts`_, v1.49.840 is the **next codify ship per #10428 meta-cadence** (7 ships past last codify at v833). Promotes 2 tentative observations to ESTABLISHED lessons: **#10436** (two-layer closure generalizes to file-overwrite drift) and **#10437** (subscriber-gated observability-only context-hook pattern). Extends 2 existing disciplines with new sections; no new manifest domains.

# v1.49.840 — Codification Ship: Promote #10436 + #10437

**Shipped:** 2026-05-27

First ship of the post-operational-debt-session block. Codification ship per #10428 meta-cadence — 7 ships past last codify (v833), within the 7-10 ship floor. Promotes 2 tentative observations that reached threshold per #10426 cross-class-registry-extraction rule, extending 2 existing disciplines rather than introducing new domains.

## What shipped

- **MODIFIED** `docs/two-layer-closure-discipline.md` — adds "File-overwrite drift sub-class (Lesson #10436)" section under "Forward observation". Documents the v813 (STATE.md operator-procedure drift) → v836 (publish.mjs file-overwrite drift) generalization via a side-by-side layer-mapping table, the "when the sub-class applies" criteria, the apply-how recipe, sub-class-specific anti-patterns, and the v836 publish-preservation reference implementation. Cross-references back to #10431.
- **MODIFIED** `docs/failure-mode-contracts.md` — adds "Subscriber-gated observability-only context-hook pattern (Lesson #10437)" section before the Lesson reference. Documents the 5-element structural shape (optional `?` field + subscriber gate + fire-and-forget Promise + .catch(() => {}) + two-argument signature), the 4-instance reference implementation table (v810 + v826 + v830 + v832), the PAIR co-location refinement (single try/catch shared across multiple hooks), how-to-apply recipe, anti-patterns, and cross-references to #10427 / #10426 / #10435.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - "Two-layer closure for procedure-rooted drift" entry: append `#10436` to key_lessons (`#10431` → `#10431, #10436`); extend summary with file-overwrite generalization; add `tools/release-history/publish.mjs` + `tools/release-history/chapter.mjs` to canonical_docs; append v1.49.840 codification record to codified_at_milestone.
  - "Failure-mode contracts" entry: append `#10437` to key_lessons (`#10427` → `#10427, #10437`); extend trigger to include subscriber-gated hooks; extend summary with the 5-element shape note + PAIR co-location refinement; append v1.49.840 codification record to codified_at_milestone.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Operative-disciplines section now references #10436 + #10437 in their respective domain entries (Two-layer closure + Failure-mode contracts).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Documentation + manifest + regenerated section only |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **58 consecutive ships at 1.178**; was 57 entering this ship — record again).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — extensions to existing entries, not new domains).
Total lessons referenced in manifest: **76 → 78** (+2: #10436, #10437; unique count per `tools/check-discipline-coverage.mjs` manifestIndex).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 (was ~12-14 at v839; 2 promoted).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **21** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Promotions in detail

### #10436 — Two-layer closure generalizes to file-overwrite drift

**Evidence (2 instances, 2nd-instance threshold per #10426):**

- **v1.49.813** STATE.md drift — operator-procedure-rooted. Source eliminator: `tools/state-md-set-shipped.mjs` (atomic writer). Detector: `tools/pre-tag-gate.sh` step 0.5 (post-write canonical-form check).
- **v1.49.836** publish.mjs chapter-overwrite drift — tool-procedure-rooted. Source eliminator: `chapter.mjs` `writeChapterIdempotent` + `openerMatches` (since v585 C04). Detector: `publish.mjs` `shouldPublishToDestination` (destination-side preservation gate; this ship).

The structural shape is identical: BOTH layers required, source-eliminator alone leaves the destination-side window open, detector alone leaves the source-side window open. The naming distinction (procedure-rooted vs file-overwrite) is descriptive of the drift *origin*, not a structural change to the discipline.

**Operational signal that revealed the v836 case:** the manual recovery procedure operators worked around for 251 ships (`git checkout HEAD -- <chapters>`) was the alarm bell for the missing destination-side detector layer. The v585 chapter.mjs source-side preservation existed since launch; the v836 publish.mjs destination-side gate closed the asymmetry.

**Codification target:** future ships closing drift classes should map both layers explicitly before declaring closure. If the operator-side workaround is the "manual recovery" pattern (`git checkout`, `cp .backup-*`, etc.), that's the smell for a missing layer. Forward-test trigger: any future bidirectional file-state class where both source and destination need preservation.

**Cross-references:** #10431 (parent discipline — procedure-rooted drift; this ship extends it), #10414 (gate-not-vigilance — the structural origin of two-layer closure), #10427 (failure-mode contracts — the destination-side gate is load-bearing per the silent-vs-loud test).

### #10437 — Subscriber-gated observability-only context-hook pattern

**Evidence (4 instances, 2nd-instance threshold per #10426 already exceeded; unified codification):**

- **v1.49.810** `onPredictions` 1st instance — copper `_emitPredictions`. Establishes the 5-element shape.
- **v1.49.826** `onPredictions` 2nd instance — selector `_emitPredictions`. Reaches threshold for `onPredictions` standalone.
- **v1.49.830** `fallbackProvider` 1st instance — copper `ActivationContext`. Cross-rootdir variant (src/ ↔ .college/); same 5-element shape.
- **v1.49.832** `fallbackProvider` 2nd instance — selector `ActivationContext`. Co-located with `onPredictions` — PAIR pattern.

Both hook families (`onPredictions` standalone × 2 + `fallbackProvider` × 2) exhibit the same 5-element structural shape: optional `?` field + subscriber gate + fire-and-forget Promise wrapper + `.catch(() => {})` swallow + two-argument derived-data signature. Rather than codifying two parallel lessons (one per hook), the v840 promotion unifies them as a single discipline (per the v830 lessons doc's explicit suggestion: _"potentially as a unified 'subscriber-gated observability-only context-hook' discipline rather than two separate codifications"_).

**The PAIR co-location refinement** — at v830 + v832, both hooks live on the same surface and share a single try/catch block. This shape reduces boilerplate and prevents per-hook drift; codified as a sub-section.

**Codification target:** future subscriber-gated hooks (whether in-rootdir or cross-rootdir) should follow the 5-element shape exactly. When adding a hook to a surface that already has one, share the catch block.

**Cross-references:** #10427 (parent discipline — accessory surfaces fail silently; this hook pattern is a specific shape of accessory), #10426 (second-instance promotion rule — both `onPredictions` and `fallbackProvider` independently reached threshold), #10435 (cross-rootdir wire pattern — `fallbackProvider` is a cross-rootdir variant of the hook shape; the hook structure is orthogonal to the rootdir partition).

## Tentative observations carried forward (post-v840)

Pre-v840 codification backlog (5 candidates per v834-835 + v836 + v838 + v839 handoff accumulation):

**Promoted in v840:**
- Two-layer closure generalization → #10436
- Subscriber-gated context-hook pattern (unified) → #10437

**Carried forward (deferred to future codify ship):**
- **Verification/integration-only ships axis** — 2 instances (v829 + v832). Would need a new sub-doc structure (no existing canonical doc fits cleanly); defer to v847+ codify ship.
- **Bidirectional enforcement completeness** — 1-2 instances (v838 audit inverse-check + v836 publish preservation). Classification ambiguous between "specific case of #10436" vs "new pattern about coverage-direction-symmetry of enforcement gates"; defer until 3rd instance disambiguates.
- **Auto-run-on-import as bootstrap-time tax** (1 instance from v836) — below 2-instance threshold; wait for 2nd.
- **Polarity convention for inverted-mechanic thresholds** (1 instance from v837) — below 2-instance threshold; wait for 2nd.

**Sustained (already ESTABLISHED, instance-count refinements):**
- **#10433 LOC-band-by-callsite-count refinement** — now 4 instances (v825 + v827 + v828 + v839). Sustained.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 58 consecutive ships at 1.178).
- Not a chokepoint chip (KNOWN_UNWIRED Process + Egress unchanged).
- Not a new discipline domain (manifest stays at 23 entries — extensions to existing entries only).
- Not a runtime test of #10436 or #10437 (they're already EXERCISED — the v836 preservation gate fired 9 times across v837-v839 chapters; the subscriber-gated hook shape is in production at v810/v826/v830/v832).

## Verification

- `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` → JSON OK.
- `npm run render:claude-md` → CLAUDE.md updated cleanly; new lessons render in Two-layer closure + Failure-mode contracts domain entries.
- `npm run build` → clean (no source changes, but build was run to confirm no incidental breakage).
- `node tools/check-discipline-coverage.mjs` → 23 manifest entries / 79 lessons / now (no change to UNCODIFIED — #10436 + #10437 were not previously emitted in chapters that the scanner tracks; their first emission is this ship's `04-lessons.md`).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-v840

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (58 consecutive ships at 1.178 after this ship; even wider pressure margin record). The codify cadence is now reset; next codify ship expected at ~v847-850.
2. **Continued ProcessContext singleton chips** — terminal family batch + remaining ~17 singletons.
3. **Production caller of the predict path** — would activate v837's auto-emit wire.
4. **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).

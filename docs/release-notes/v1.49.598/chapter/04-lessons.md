# v1.49.598 — Forward Lessons Emitted (Formal IDs Locked)

Four forward-lesson candidates emitted at v1.49.598 close. Each carries a formal ID for programmatic cross-milestone tracking. Body framings below; v599+ retrospectives can reference these by ID for soak observation tracking.

---

## #10233 — Tier 2 inline-Opus as primary build path (soak observation #1)

**Status at v598 close:** candidate-emitted; soak observation #1.
**Promotion criterion:** if v1.49.599 or v1.49.600 also use Tier 2 as primary-build at acceptable quality, promote candidate to ESTABLISHED at 3-instance reproducibly-stable.

### Body

v1.49.598 was the first invocation of Tier 2 (main-context inline-Edit recovery procedure per W2 build-agent template lines 247-269) as the *primary* build path, NOT as a fallback after Sonnet sub-agent dispatch interrupted. v1.49.589 + v1.49.595 used Tier 2 as fallback after Sonnet sub-agent dispatch interrupted; v1.49.598 used Tier 2 because Sonnet dispatch was unavailable in flight-ops' tool surface for v1.49.598 — the Tier-2 path was chosen pre-emptively, not adopted post-failure.

The build-quality verdict held in both contexts:
- v589 + v595 fallback applications: 78-89% predecessor depth ratio (template documented quality verdict).
- v598 primary-build application: NASA 1.78 at 99% lines / 115% bytes vs immediate predecessor NASA 1.77 (the strongest depth-audit result of any Tier-2-as-primary build to date).

**The template's stated 78-89% range may be the soak's lower bound, not its expected value.** Worth re-soaking explicitly across v599-v601 to update the verdict if the pattern holds. Caveat per #10238: the v598 99% may be inflated by Tier-2-vs-Tier-2 comparison; gold-standard comparison would yield a more conservative ratio.

**Decision deferred to v599+.** v598 is observation #1; promotion candidate at 3-instance reproducibly-stable (v601 earliest).

---

## #10236 — Cross-track structural pairs are discovered, not constructed (substrate-vs-frame epistemology)

**Status at v598 close:** candidate-emitted; substrate-vs-frame epistemology established at v598.
**Promotion criterion:** v599 + downstream milestones inherit the framing as canonical disposition for cross-track pair selection. ESTABLISHED at consistent application across 3 milestones.

### Body

The cross-track structural pair at v1.49.598 (NASA Apollo 14 + MUS *Tapestry* + ELC Moon Trees + SPS Marbled Murrelet) emerged from the substrate's own structural-coherence properties, not from thematic frame imposition. Three substrates lock onto a single shared physical artifact (Douglas fir + redwood) across NASA + ELC + SPS without thematic-frame selection: the seeds physically traveled with Apollo 14, the Moon Trees survivors include those species, the MAMU nest substrate IS those species. The MUS axis (Tapestry / Apollo 14 second-attempt-after-modest-precedent) emerged on a different cross-track axis without forcing.

The v1.49.598 NASA 1.78 artifacts/story/cone-crater-thirty-meters-short.html articulates the epistemology cleanly:

> *"The substrate is not selecting these three because they fit a frame. The frame is recognizing itself in the substrate, after the fact, when the milestone's research process surfaces what was always there: a structural primitive of canonical re-establishment manifesting in three substrates simultaneously, within ten days of calendar time, during an unrepeatable window in the late twentieth century. v1.78 records the recognition."*

**Operational implication for v599+:** future MUS/ELC/SPS pick selection should look for cross-track substrate coherence (shared physical artifact, calendar coincidence, structural primitive co-recognition) rather than reverse-engineer cross-track pairs to fit a pre-decided frame. The frame recognizes itself in the substrate, after the fact; do not impose the frame in advance.

**Promotion criterion:** if v599 + v600 + v601 also surface cross-track pairs as substrate-emergent (rather than frame-imposed), promote to ESTABLISHED epistemological discipline at 3-instance.

---

## #10237 — §6.6 register dispositions deferred to W2 build evidence, not pre-decided in mission brief

**Status at v598 close:** candidate-emitted; brief-default-vs-W2-evidence reconciliation discipline established at v598.
**Promotion criterion:** v599+ briefs should describe §6.6 candidate-watchlists rather than pre-decide register movements. ESTABLISHED at consistent application across 3 milestones.

### Body

The v1.49.598 mission brief defaulted to "no Path-D admit for nominal Apollo 14" because Apollo 14 was framed as a recovery mission with no novel structural primitives beyond what Apollo 11/12 had already established. The W2 build evidence revealed:

- **MET as wheeled-vehicle primitive** is structurally distinct from anything previously originated at §6.6. The three-part novelty resolution against Lunokhod 1 (crewed-pulled vs unmanned-remote-controlled / human-mobility-amplifier vs robotic-traverse / predates LRV as crewed wheeled mobility primitive) is airtight.
- **Moon Trees lineage as PERSISTENT-PROGRAM-CYCLE primitive** is structurally distinct from existing §6.6 threads. Single-decision genesis + multi-decade persistence + lineage-renewal mechanism canonical-criteria PASS.
- **Eyles abort-bit DSKY uplink patch** is the 3rd reproducibly-stable PREC instance after Apollo 12 Aaron SCE-AUX + Apollo 13 multi-recovery, satisfying ESTABLISHED promotion criterion.

The brief's default was correct on the criterion "is Apollo 14 a nominal mission?" (yes — the mission completed successfully without major in-flight emergencies beyond the recoverable abort-bit anomaly). But "nominal mission" does not imply "no §6.6 register movement." Apollo 14's contribution is in mission-system origination (MET as canonical wheeled-mobility instance) + program-cycle origination (Moon Trees as canonical artifact-lineage instance), not in mission-anomaly recovery.

**Operational implication for v599+:** briefs should describe §6.6 candidate-watchlists ("Apollo 15 LRV is a candidate GEOM 2-ex outcome-validation; Hadley-Apennine geology is a watchlist sub-thread for HIGHLAND-EXPLORATION") rather than pre-decide register movements ("no Path-D admit for nominal Apollo 15"). The W2 build is the evidence layer; the brief is the candidate-watchlist layer; the G2 lock is the disposition layer. Three layers with distinct authorities.

**Promotion criterion:** if v599 + v600 + v601 briefs adopt candidate-watchlist framing (rather than pre-deciding register movements), promote to ESTABLISHED brief-authoring discipline at 3-instance.

---

## #10238 — Depth-audit Tier-2-vs-Tier-2 inflation; consider gold-standard-comparison extension

**Status at v598 close:** candidate-emitted; depth-audit-extension forward-look soak observation #1.
**Promotion criterion:** if v599-v601 depth-audit results inflated by Tier-2-vs-Tier-2 comparison (when both target + predecessor are Tier-2 builds), extend depth-audit to also report gold-standard-comparison ratio.

### Body

The depth-audit script's `compare-against-immediate-predecessor` heuristic may inflate Tier 2 results when the immediate predecessor is also a Tier 2 build. v1.49.598 NASA 1.78 reported 99% lines / 115% bytes vs immediate predecessor NASA 1.77 — but NASA 1.77 was itself an 18-file Tier-2-quality build (skipped curriculum/mathematics/organism/papers/research track pages + retrospective subtree). The Tier-2-vs-Tier-2 comparison flatters both artifacts.

A gold-standard comparison (NASA 1.78 vs NASA 1.69 at 25 files / 94 KB index.html) would likely yield a more conservative ratio (~80% lines / ~85% bytes expected) — within the Tier 2 78-89% verdict envelope but not at the 99% level.

**Two interpretations of the v598 99% result:**

- **Interpretation A — Tier 2 verdict is conservatively pessimistic.** v589 + v595 + v598 all hit ≥78% predecessor depth via Tier 2; v598 hit 99%. Three observations approaching ESTABLISHED threshold for Tier 2 path itself. The template's stated 78-89% range may be the soak's lower bound, not its expected value.
- **Interpretation B — NASA 1.77 is a Tier-2 predecessor; the comparison reflects Tier-2-vs-Tier-2.** Per lab-director Phase 831 close: "If both this milestone AND its comparison baseline used Tier 2, the 99% ratio reflects Tier-2-vs-Tier-2 comparison, not Tier-2-vs-canonical." Interpretation B is the more cautious + probably correct reading.

**Don't update the Tier 2 verdict in the v598 retrospective on the basis of one composite-pass-equivalent observation.** Capture the depth-audit-extension proposal as #10238 forward-look soak observation candidate for v599-v601 to either confirm or refute Interpretation B.

**Promotion criterion:** if v599-v601 depth-audit results consistently inflated by Tier-2-vs-Tier-2 comparison (or if Sonnet sub-agent dispatch restoration enables Tier-1 baseline measurement showing the gap), implement depth-audit gold-standard-comparison extension as canonical second metric. ESTABLISHED at consistent measurement across 3 milestones with Tier-1 baseline for at least one.

---

## Summary

| Lesson ID | Title | Status | Promotion criterion |
|---|---|---|---|
| **#10233** | Tier 2 inline-Opus as primary build path | candidate-emitted (soak obs #1) | 3-instance reproducibly-stable across v599-v601 |
| **#10236** | Cross-track structural pairs are discovered, not constructed | candidate-emitted (epistemology established) | 3-instance consistent application across v599-v601 |
| **#10237** | §6.6 register dispositions deferred to W2 build evidence | candidate-emitted (brief-vs-evidence discipline) | 3-instance brief-authoring across v599-v601 |
| **#10238** | Depth-audit Tier-2-vs-Tier-2 inflation; consider gold-standard-comparison | candidate-emitted (forward-look soak obs #1) | 3-milestone consistent inflation OR Tier-1 baseline restoration |

All four lessons are tracked by ID for v599+ retrospective cross-reference. Each retrospective should reference these by ID format `#10NNN soak observation #N` for clean programmatic aggregation.

## Carryover lesson promotions at v598 close

- **PROCEDURAL-RECOVERY (PREC) §6.6 thread — PROMOTED TO ESTABLISHED at v598 close.** 3-ex reproducibly-stable evidence chain (Apollo 12 SCE-AUX founding + Apollo 13 multi-recovery + Apollo 14 Eyles abort-bit patch). This is a §6.6 register status promotion, not a separate forward-lesson, but cross-listed here for completeness.
- **Lesson #10221 (dev/main 0-commit drift via ship-sync) — held cleanly at v598.** ESTABLISHED at v596 third-instance; v598 maintains zero-drift through W4 ship pipeline. No status change; the canonical post-merge step continues.

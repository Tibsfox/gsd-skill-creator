# v1.49.610 — Forward Lessons

## Promoted to ESTABLISHED at v610

### #10260 ESTABLISHED at obs#3 — chunked Write+Edit pattern prevents stream-watchdog/quota failure modes

Two consecutive milestones (v609 obs#2 + v610 obs#3) with 4-of-4 clean dispatches each = 8 consecutive successful applications without a single watchdog/quota event. Reproducibility-by-prevention is now the steady-state W2 operating mode. **PROMOTED to ESTABLISHED at obs#3 via prevention-reproducibility path** (the recovery-reproducibility path landed at v608 obs#4; the prevention path is qualitatively stronger evidence).

The chunked Write+Edit pattern (Write skeleton ≤12KB then 6-10 Edits each ≤7KB) with explicit byte budgets in the agent prompt is the W2 discipline. Sonnet remains fallback only for ≤8KB single deliverables.

### #10262 ESTABLISHED at obs#2 — chunked-pattern-as-cross-track-fidelity-precondition

v609 obs#1 (zero fabrications across 4 W2 dispatches) + v610 obs#2 (zero fabrications across 4 W2 dispatches with explicit grep-count verification: 59-115 hits per sibling-track named-entity in W1 drafts). 8 consecutive clean dispatches at the per-citation level. **PROMOTED to ESTABLISHED at obs#2 via precondition-reproducibility path.**

The hypothesis from v609 ("when a build agent must split authoring across many small tool calls, the agent re-reads sibling W1 drafts more frequently between Edits") is empirically confirmed: chunked pattern naturally embeds cross-track citations more accurately than monolithic Write that "remembers" sibling content from a single read.

### 4-ex SISTER-COHORT OLD-GROWTH-OBLIGATE-VINDICATION ESTABLISHED

Promotes from 3-ex CANDIDATE (v609) → 4-ex ESTABLISHED at v610 W3.3. Strigidae #81 NSO + Alcidae #82 Marbled Murrelet + Picidae #83 Pileated Woodpecker + **Accipitridae #84 American Goshawk** = four independent taxonomic classes / four independent foraging biomes / four independent breeding strategies / differential population trajectories (NSO -7%/yr / Murrelet -5%/yr / Pileated +1.5%/yr / Goshawk *laingi* COSEWIC-Threatened recovery-arc-in-progress).

The 4-ex extension is qualitatively stronger than the 3-ex CANDIDATE: with four independent taxa, the substrate-coherence claim ("old-growth obligate as substrate primitive") becomes statistically robust against single-taxon artifact. **Soak chain is closed; primitive is now LOCKED.**

### SUBSTRATE-COHERENCE-PREDICTS-CROSS-PACK-DENSITY HOLDS at obs#6 (first POST-ESTABLISHED test)

v609 ESTABLISHED-confirmed at 5-of-5; v610 obs#6 reproduces (pack-10 produced 14 edges + K_9 single-pass + 5 substrate-bridges to pack-03). The lesson is now **stable past its initial promotion threshold**.

The bonus signal is the **pack-pair density inflation**: pack-10's 5 substrate-bridges to pack-03 exceeds pack-03's 4 bridges to pack-02 (v609). This seeds new sub-lesson #10265 PROJECTIVE-PAIR-DENSER-THAN-DIFFERENTIAL-PAIR at obs#1.

---

## CANDIDATE lessons emitted at v610

### #10263 CANDIDATE — SPS-internal-trophic-interconnection

**Statement:** Within the 4-ex SISTER-COHORT OLD-GROWTH-OBLIGATE-VINDICATION cohort, the species are not just paired-by-substrate-coherence but **paired-by-trophic-network**: Goshawk regularly preys on Pileated Woodpecker (well-documented in Aubry/Raley/Bull/Bonar/Mellen-McLean cohort literature). Trophic interconnection is a structurally-stronger form of substrate-coherence than paired-by-niche.

**Trigger:** any future SPS pick where the substrate-coherence with prior cohort members manifests as trophic interaction (predator-prey, mutualist, parasite, competitor).

**Action:** track at v611+. If reproduces (e.g., a v611 mammal-track pick that preys on Goshawk or competes with Pacific Marten), promote toward ESTABLISHED at 2-ex.

**Soak target:** 2 observations.

### #10264 CANDIDATE — PHYSICIAN-AS-CREW substrate as cross-track binding

**Statement:** PHYSICIAN-AS-CREW substrate primitive surfaces independently across three v610 tracks: NASA Kerwin first US physician in space + MUS Harrison spiritual/material duality (musician-as-spiritual-seeker) + SPS Goshawk female-as-fierce-defender (reverse-sexual-dimorphism predator). Three-track convergence at obs#1 with substrate-emergent fit (not engineered).

**Trigger:** any future milestone with a crewed-mission + dual-identity-artist + female-defender-species pairing.

**Action:** track at v611+ (Skylab 3 has Owen Garriott science-pilot + Jack Lousma similar dual-role; SPS pick may again surface female-defender). If reproduces, promote toward ESTABLISHED at 2-ex.

**Soak target:** 2 observations.

### #10265 CANDIDATE — PROJECTIVE-PAIR-DENSER-THAN-DIFFERENTIAL-PAIR

**Statement:** v609 pack-03 (algebraic geometry) bound with 4 substrate-bridges to pack-02 (differential geometry); v610 pack-10 (projective geometry) bound with 5 substrate-bridges to pack-03 (algebraic geometry). Projective-vs-algebraic pack-pair is denser than algebraic-vs-differential pack-pair.

**Hypothesis:** projective geometry sits at categorical-level-above algebraic (Proj-functor; algebraic varieties have projective compactifications); differential geometry sits at different categorical level (smooth manifolds; not always algebraic). The categorical-adjacency of projective-and-algebraic creates more bridges than the categorical-distance of algebraic-and-differential.

**Trigger:** any future TRS pack-pair binding.

**Action:** track at v611+ (next pack candidate is pack-06 number theory or pack-08 combinatorics). If reproduces (e.g., pack-06 number theory shows ≥6 bridges to pack-10 projective via algebraic-projective L-functions), promote toward ESTABLISHED at 3-ex (high bar because this is a structural claim about categorical-distance).

**Soak target:** 3 observations.

---

## CROSS-TRACK-DIRECT-AT-LITERAL-SHARED-PAYLOAD soak status

v609 admitted 1-ex (NASA EREP + ELC EREP = same Earth-observation hardware). v610 extends to 2-ex SOAK (NASA Skylab 2 ops + ELC Skylab 2 Biomedical = same crewed-station hardware, distinct biomedicine register). v611+ candidate: NASA + ELC at ATM solar-physics register (3-ex ESTABLISHED if surfaces).

**Action:** track at v611 (Skylab 3 ATM solar-observations are dominant payload register; if v611 ELC pick is ATM solar-physics, the 3-ex ESTABLISHED triggers).

---

## Carry-forward DEFERRED items at v610 close

- **#10238 + #10240** STILL DEFERRED to v612+ hard-fork milestone (per FA-609-6 v610 close decision: CONTINUE engine-cadence; no escalation pressure surfaced). v611+v612+v613+v614 candidate cadence: Skylab 3 (1.88) → Skylab 4 (1.90) → Mariner 10 (1.89, possibly out-of-order due to launch-date) → Apollo-Soyuz Test Project (1.91).
- 4 historical NASA track-card drifts (1.34/1.36/1.57/1.75) remain operator-decision-deferred (passive)
- TRS Wave 2.5 schema refinement (year-range floor) — passive
- **TRS pack-06 number theory binding** — recommended for v611 W1.TRS (algebraic-projective L-functions substrate; expects 6-10 bridges to pack-10 if #10265 hypothesis holds)
- **TRS pack-08 combinatorics binding** — alternative v611 candidate (Schubert-calculus combinatorial enumeration pair with pack-10)

---

## Forward action items emitted at v610

| # | Action | Owner | Target |
|---|---|---|---|
| FA-610-1 | Track #10263 obs#2 reproducibility (SPS trophic interconnection) at v611 W3 | v611 W3 | v611 |
| FA-610-2 | Track #10264 obs#2 reproducibility (PHYSICIAN-AS-CREW cross-track binding) at v611 W3 | v611 W3 | v611 |
| FA-610-3 | Track #10265 obs#2 reproducibility (projective-pair-density) at v611 W1.TRS — pack-06 number theory recommended | v611 W1 | v611 |
| FA-610-4 | Continue #10247 obs#6 soak — needs 1 more EXACT POSITIVE for 3-ex ESTABLISHED | v611 W3 | v611 |
| FA-610-5 | Continue CROSS-TRACK-DIRECT-AT-LITERAL-SHARED-PAYLOAD soak — ATM solar-physics 3-ex candidate at v611 | v611 W1.ELC | v611 |
| FA-610-6 | Re-evaluate v612-or-later hard-fork escalation at v611 close | v611 close | v612 candidate |

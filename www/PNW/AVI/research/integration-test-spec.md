# PNW Avian Taxonomy — Raptor-Prey Cross-Taxonomy Integration Test

> **Wings of the Pacific Northwest — AVI Mission, Wave 0 Foundation**
>
> **Test Name:** IN-AVI-MAM-RAPTOR-PREY
> **Resolves:** H-6 (Raptor-prey cross-taxonomy consistency)
> **Priority:** Required (BLOCK on failure)
> **Companion Document:** `degraded-output-protocol.md` (H-7 resolution)

---

## Purpose

Verify predator-prey consistency across the AVI (avian taxonomy) raptor profiles and MAM (mammal taxonomy) prey profiles. When a raptor species card lists a mammal as prey, the corresponding mammal species card must list that raptor as a predator. When a mammal species card lists a raptor as a predator, the corresponding raptor species card must list that mammal as prey.

This test catches silent contradictions between independently produced taxonomy modules. AVI and MAM will be produced by different agents in different waves. Without this test, it is possible for AVI to document an owl eating flying squirrels while MAM documents those same flying squirrels with no mention of owl predation, or vice versa.

---

## Test Architecture

```
AVI Module (Raptor Profile)          MAM Module (Prey Profile)
┌─────────────────────────┐          ┌─────────────────────────┐
│ Ecological Interactions │          │ Ecological Interactions │
│ field lists prey item   │◄────────►│ field lists predator    │
│ with mammal species     │  CHECK   │ with raptor species     │
└─────────────────────────┘          └─────────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│ Relationship Schema     │          │ Relationship Schema     │
│ REL-PRED-[raptor]-[prey]│  MATCH   │ REL-PRED-[raptor]-[prey]│
│ Interaction Strength    │◄────────►│ Interaction Strength    │
│ Evidence source IDs     │          │ Evidence source IDs     │
└─────────────────────────┘          └─────────────────────────┘
```

### Measurement Method

For each species pair below:

1. **Profile field check:** Locate the Ecological Interactions field in the raptor's AVI profile. Confirm it mentions the prey species by common name and scientific name.
2. **Reciprocal check:** Locate the Ecological Interactions field in the prey's MAM profile. Confirm it mentions the raptor species by common name and scientific name.
3. **Relationship record check:** Confirm a `REL-PRED-[raptor]-[prey]` relationship record exists in the AVI Module 5 (Ecological Networks) with the `Cross-Taxonomy: Yes` flag.
4. **Interaction strength consistency:** The interaction strength (Obligate/Primary/Secondary/Opportunistic) must be compatible between AVI and MAM profiles. A raptor cannot list a prey item as "Primary" while the prey's profile lists that raptor as "Opportunistic" without a documented explanation.
5. **Source citation overlap:** At least one source ID must appear in both the raptor profile and the prey profile's predator reference, establishing shared evidentiary basis.

### Pass Criteria

- **PASS:** Both profiles reference each other, relationship record exists, interaction strength is compatible, at least one shared source citation.
- **PARTIAL PASS:** Both profiles reference each other but interaction strength differs. Logged for Wave 4 reconciliation. Does not block.
- **FAIL:** One profile references the relationship but the other does not. BLOCKS publication until resolved.
- **DEFERRED:** MAM module not yet produced. AVI profile records the relationship with `See MAM (pending)` cross-reference. Test re-run after MAM Wave completion.

---

## Species Pairs

### Pair 1: Great Horned Owl / Northern Flying Squirrel

| Field | Value |
|-------|-------|
| **Raptor** | Great Horned Owl (*Bubo virginianus*) |
| **Prey** | Northern Flying Squirrel (*Glaucomys sabrinus*) |
| **Expected Relationship** | Primary nocturnal predator-prey. Great Horned Owl is the dominant nocturnal aerial predator across PNW old-growth and second-growth forests. Northern Flying Squirrel is a primary prey item documented through pellet analysis. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-OLD-GROWTH, HAB-SECOND-GROWTH (ELEV-LOWLAND, ELEV-MONTANE) |
| **Evidence Sources** | G-06, G-14 |
| **Cross-Module** | AVI Mod 1 (Great Horned Owl) ↔ MAM (Northern Flying Squirrel) |
| **Salmon Thread** | No (indirect — flying squirrels disperse truffle spores in forests fertilized by salmon-derived nutrients) |

### Pair 2: Great Horned Owl / Snowshoe Hare

| Field | Value |
|-------|-------|
| **Raptor** | Great Horned Owl (*Bubo virginianus*) |
| **Prey** | Snowshoe Hare (*Lepus americanus*) |
| **Expected Relationship** | Primary prey in montane and subalpine forests. Snowshoe hare population cycles (9-11 year periodicity in northern populations) influence Great Horned Owl reproductive success. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-OLD-GROWTH, HAB-SECOND-GROWTH (ELEV-MONTANE, ELEV-SUBALPINE) |
| **Evidence Sources** | G-14, G-23 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 3: Great Horned Owl / Deer Mouse

| Field | Value |
|-------|-------|
| **Raptor** | Great Horned Owl (*Bubo virginianus*) |
| **Prey** | Deer Mouse (*Peromyscus maniculatus*) |
| **Expected Relationship** | Secondary prey. Deer Mouse is the most abundant small mammal in PNW forests and a consistent dietary component, but Great Horned Owls preferentially take larger prey when available. |
| **Interaction Strength** | Secondary |
| **Habitat Overlap** | All terrestrial habitats |
| **Evidence Sources** | G-14 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 4: Northern Spotted Owl / Northern Flying Squirrel

| Field | Value |
|-------|-------|
| **Raptor** | Northern Spotted Owl (*Strix occidentalis caurina*) |
| **Prey** | Northern Flying Squirrel (*Glaucomys sabrinus*) |
| **Expected Relationship** | Obligate primary prey in western PNW old-growth forests. Northern Flying Squirrel constitutes 30-60% of Spotted Owl diet by biomass in most study populations. This relationship is the ecological foundation of the Northwest Forest Plan — protecting old-growth protects both species. |
| **Interaction Strength** | Obligate (most populations) |
| **Habitat Overlap** | HAB-OLD-GROWTH (ELEV-LOWLAND, ELEV-MONTANE) |
| **Evidence Sources** | G-06, G-12, P-13, P-14 |
| **Cross-Module** | AVI Mod 1 ↔ MAM; AVI Mod 5 (old-growth food web) |
| **Safety Note** | SC-END applies — no nest site locations for this ESA-Threatened species |

### Pair 5: Northern Spotted Owl / Bushy-tailed Woodrat

| Field | Value |
|-------|-------|
| **Raptor** | Northern Spotted Owl (*Strix occidentalis caurina*) |
| **Prey** | Bushy-tailed Woodrat (*Neotoma cinerea*) |
| **Expected Relationship** | Primary prey in drier portions of range (eastern slope Cascades, Klamath Mountains). Woodrats replace flying squirrels as primary prey in drier forest types. |
| **Interaction Strength** | Primary (range-dependent) |
| **Habitat Overlap** | HAB-OLD-GROWTH, HAB-SECOND-GROWTH (ELEV-LOWLAND, ELEV-MONTANE — east-side) |
| **Evidence Sources** | G-06, G-12 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 6: Barn Owl / Meadow Vole

| Field | Value |
|-------|-------|
| **Raptor** | Barn Owl (*Tyto alba*) |
| **Prey** | Meadow Vole (*Microtus pennsylvanicus*) |
| **Expected Relationship** | Primary prey in agricultural and grassland habitats. Barn Owls are vole specialists; Meadow Voles and Townsend's Voles together constitute 80-95% of diet in western PNW agricultural landscapes. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | AVI-HAB-GRASSLAND, HAB-URBAN, agricultural lands (ELEV-LOWLAND, ELEV-RIPARIAN) |
| **Evidence Sources** | G-14, G-15 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 7: Barn Owl / Deer Mouse

| Field | Value |
|-------|-------|
| **Raptor** | Barn Owl (*Tyto alba*) |
| **Prey** | Deer Mouse (*Peromyscus maniculatus*) |
| **Expected Relationship** | Secondary prey across all Barn Owl habitat. More important in east-side steppe than west-side agricultural areas where voles dominate. |
| **Interaction Strength** | Secondary |
| **Habitat Overlap** | All lowland terrestrial habitats |
| **Evidence Sources** | G-14 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 8: Red-tailed Hawk / Eastern Cottontail

| Field | Value |
|-------|-------|
| **Raptor** | Red-tailed Hawk (*Buteo jamaicensis*) |
| **Prey** | Eastern Cottontail (*Sylvilagus floridanus*) and Nuttall's Cottontail (*Sylvilagus nuttallii*) |
| **Expected Relationship** | Primary prey for Red-tailed Hawks in open and edge habitats. Red-tailed Hawk is the most common large raptor in PNW lowlands and the primary diurnal predator of cottontails in agricultural and suburban landscapes. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-OAK-PRAIRIE, HAB-URBAN, AVI-HAB-GRASSLAND, AVI-HAB-SAGEBRUSH (ELEV-LOWLAND) |
| **Evidence Sources** | G-14, G-15, O-22 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 9: Red-tailed Hawk / Ground Squirrels

| Field | Value |
|-------|-------|
| **Raptor** | Red-tailed Hawk (*Buteo jamaicensis*) |
| **Prey** | Columbian Ground Squirrel (*Urocitellus columbianus*), Belding's Ground Squirrel (*Urocitellus beldingi*), California Ground Squirrel (*Otospermophilus beecheyi*) |
| **Expected Relationship** | Primary prey in east-side steppe and agricultural areas. Ground squirrel activity patterns (diurnal, open-habitat foraging) align perfectly with Red-tailed Hawk hunting strategy. Hawk breeding success correlates with ground squirrel abundance in many PNW studies. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | AVI-HAB-SAGEBRUSH, AVI-HAB-GRASSLAND, HAB-OAK-PRAIRIE (ELEV-LOWLAND — east-side) |
| **Evidence Sources** | G-14, G-16, O-22 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 10: Peregrine Falcon / Bats (multiple species)

| Field | Value |
|-------|-------|
| **Raptor** | Peregrine Falcon (*Falco peregrinus*) |
| **Prey** | Big Brown Bat (*Eptesicus fuscus*), Yuma Myotis (*Myotis yumanensis*), Little Brown Bat (*Myotis lucifugus*) |
| **Expected Relationship** | Secondary prey. Peregrine Falcons are primarily bird predators (pigeons, shorebirds, waterfowl), but bats are documented prey at crepuscular hunting periods, especially near bat roost emergence sites. |
| **Interaction Strength** | Secondary |
| **Habitat Overlap** | AVI-HAB-CLIFF, HAB-URBAN (foraging airspace — ELEV-LOWLAND, ELEV-RIPARIAN) |
| **Evidence Sources** | G-14, O-22 |
| **Cross-Module** | AVI Mod 1 ↔ MAM (chiroptera section) |

### Pair 11: Osprey / Pacific Salmon

| Field | Value |
|-------|-------|
| **Raptor** | Osprey (*Pandion haliaetus*) |
| **Prey** | Chinook Salmon (*Oncorhynchus tshawytscha*), Coho Salmon (*Oncorhynchus kisutch*), Steelhead (*Oncorhynchus mykiss*) |
| **Expected Relationship** | Primary prey during salmon presence in freshwater. Osprey is the only PNW raptor that plunge-dives for fish as its exclusive hunting method. Salmon are the primary large prey item; trout, suckers, and other fish are taken when salmon are absent. |
| **Interaction Strength** | Primary (seasonal — salmon runs) |
| **Habitat Overlap** | HAB-STREAM, HAB-LAKE, ELEV-RIPARIAN, ELEV-LOWLAND |
| **Evidence Sources** | G-20, P-18 |
| **Cross-Module** | AVI Mod 1 ↔ ECO: salmon-nutrient-cycling; **Salmon Thread: Yes** |
| **Salmon Thread Note** | Osprey is a direct salmon consumer and a visible indicator of salmon run strength. Nest productivity correlates with local salmon abundance. |

### Pair 12: Bald Eagle / Pacific Salmon

| Field | Value |
|-------|-------|
| **Raptor** | Bald Eagle (*Haliaeetus leucocephalus*) |
| **Prey** | All PNW *Oncorhynchus* species, especially Chum Salmon (*O. keta*) and Chinook Salmon (*O. tshawytscha*) |
| **Expected Relationship** | Primary prey and scavenge resource. Bald Eagles congregate on salmon spawning rivers in extraordinary densities (hundreds of eagles on the Skagit, Nooksack, and Fraser Rivers in winter). Both active predation of live spawners and scavenging of post-spawn carcasses. Marine-derived nutrients from salmon carcasses scattered by eagles fertilize riparian forests. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-RIPARIAN, HAB-STREAM, ELEV-RIPARIAN, ELEV-LOWLAND |
| **Evidence Sources** | G-20, P-18, G-14 |
| **Cross-Module** | AVI Mod 1 ↔ ECO: salmon-nutrient-cycling; AVI Mod 5 (salmon-bird network); **Salmon Thread: Yes** |
| **Salmon Thread Note** | Bald Eagle is the iconic salmon-bird connection. Eagle winter congregations on salmon rivers are among the most visible ecological spectacles in the PNW. Eagles redistribute marine-derived nutrients (N-15, P) from river to forest through carcass scattering. |

### Pair 13: Bald Eagle / Snowshoe Hare

| Field | Value |
|-------|-------|
| **Raptor** | Bald Eagle (*Haliaeetus leucocephalus*) |
| **Prey** | Snowshoe Hare (*Lepus americanus*) |
| **Expected Relationship** | Secondary prey, more important in interior and montane habitats away from salmon rivers. Bald Eagles are generalist predators and will take hares opportunistically. |
| **Interaction Strength** | Secondary |
| **Habitat Overlap** | HAB-SECOND-GROWTH, ELEV-MONTANE, ELEV-SUBALPINE |
| **Evidence Sources** | G-14, G-23 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 14: Northern Goshawk / Snowshoe Hare

| Field | Value |
|-------|-------|
| **Raptor** | Northern Goshawk (*Accipiter gentilis*) |
| **Prey** | Snowshoe Hare (*Lepus americanus*) |
| **Expected Relationship** | Primary prey in montane and subalpine forests. Goshawk is the apex avian ambush predator of dense forest interior. Snowshoe hares are the largest prey regularly taken and are critical for goshawk breeding success. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-OLD-GROWTH, HAB-SECOND-GROWTH (ELEV-MONTANE, ELEV-SUBALPINE) |
| **Evidence Sources** | G-14, G-24 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 15: Northern Goshawk / Douglas Squirrel

| Field | Value |
|-------|-------|
| **Raptor** | Northern Goshawk (*Accipiter gentilis*) |
| **Prey** | Douglas Squirrel (*Tamiasciurus douglasii*) |
| **Expected Relationship** | Primary prey. Douglas Squirrels (chickarees) are abundant arboreal mammals in PNW conifer forests and a consistent goshawk prey item. Goshawk pursuit flights through dense canopy to take squirrels are among the most dramatic predator-prey interactions in PNW forests. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-OLD-GROWTH, HAB-SECOND-GROWTH (ELEV-LOWLAND, ELEV-MONTANE) |
| **Evidence Sources** | G-14, G-24 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 16: Great Gray Owl / Pocket Gopher

| Field | Value |
|-------|-------|
| **Raptor** | Great Gray Owl (*Strix nebulosa*) |
| **Prey** | Northern Pocket Gopher (*Thomomys talpoides*), Mazama Pocket Gopher (*Thomomys mazama*) |
| **Expected Relationship** | Primary prey. Great Gray Owls hunt meadow edges and openings, using facial disc and asymmetric ears to locate prey beneath snow or soil by sound alone. Pocket gophers are critical prey in PNW montane meadows. Great Gray Owls can plunge through crusted snow to capture gophers detected only by hearing. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-ALPINE-MEADOW, HAB-SUBALPINE-PARKLAND (ELEV-MONTANE, ELEV-SUBALPINE — meadow edges) |
| **Evidence Sources** | G-14, G-15 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |
| **Safety Note** | Mazama Pocket Gopher (*T. mazama*) includes ESA-listed subspecies in WA — SC-END applies |

### Pair 17: Great Gray Owl / Meadow Vole

| Field | Value |
|-------|-------|
| **Raptor** | Great Gray Owl (*Strix nebulosa*) |
| **Prey** | Meadow Vole (*Microtus pennsylvanicus*) |
| **Expected Relationship** | Primary prey. Voles and pocket gophers together constitute the bulk of Great Gray Owl diet. Meadow Voles are taken in greater numbers than gophers but contribute less biomass per individual. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | HAB-ALPINE-MEADOW, AVI-HAB-GRASSLAND (meadow edges) |
| **Evidence Sources** | G-14 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 18: Short-eared Owl / Meadow Vole

| Field | Value |
|-------|-------|
| **Raptor** | Short-eared Owl (*Asio flammeus*) |
| **Prey** | Meadow Vole (*Microtus pennsylvanicus*) |
| **Expected Relationship** | Obligate primary prey. Short-eared Owl is the most vole-dependent owl in the PNW. This crepuscular ground-nesting owl hunts open grasslands and marshes by quartering low over the ground. Population tracks vole cycles; Short-eared Owls are semi-nomadic, concentrating wherever vole outbreaks occur. |
| **Interaction Strength** | Obligate |
| **Habitat Overlap** | AVI-HAB-GRASSLAND, HAB-WETLAND, AVI-HAB-SAGEBRUSH (ELEV-LOWLAND, ELEV-RIPARIAN) |
| **Evidence Sources** | G-14, G-15 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

### Pair 19: Short-eared Owl / Townsend's Vole

| Field | Value |
|-------|-------|
| **Raptor** | Short-eared Owl (*Asio flammeus*) |
| **Prey** | Townsend's Vole (*Microtus townsendii*) |
| **Expected Relationship** | Primary prey in western PNW lowland grasslands and estuarine marshes. Townsend's Vole replaces Meadow Vole as dominant prey in wet, grassy habitats west of the Cascades, particularly in the Skagit and Samish River deltas where Short-eared Owls winter in concentrations. |
| **Interaction Strength** | Primary |
| **Habitat Overlap** | AVI-HAB-GRASSLAND, HAB-WETLAND, AVI-HAB-MUDFLAT margins (ELEV-RIPARIAN — west-side) |
| **Evidence Sources** | G-14, G-23 |
| **Cross-Module** | AVI Mod 1 ↔ MAM |

---

## Execution Protocol

### When to Run This Test

1. **After AVI Wave 1 completion:** Run against all raptor profiles produced in Modules 1 and 2. At this stage, MAM profiles will likely be deferred — mark all pairs as DEFERRED.
2. **After MAM module completion:** Re-run full test against both AVI and MAM profiles. This is the primary test execution.
3. **After Wave 4 reconciliation:** Final verification pass. All pairs must PASS or have documented explanations for PARTIAL PASS.

### Who Runs This Test

- **VERIFY agent** (primary) — executes field checks and relationship record validation.
- **INTEG agent** (secondary) — validates cross-module reference consistency.
- **WARDEN agent** (safety) — verifies SC-END compliance for ESA-listed species in predator-prey documentation.

### Scoring

| Result | Count Required | Action |
|--------|---------------|--------|
| PASS | 15+ of 19 pairs | Test passes. Remaining pairs documented. |
| PARTIAL PASS | Acceptable for up to 4 pairs | Logged for Wave 4 reconciliation. |
| FAIL | 0 allowed | BLOCKS publication. Must be resolved before Wave 4 completion. |
| DEFERRED | Unlimited | Acceptable when MAM module not yet produced. Must resolve to PASS/PARTIAL PASS before final publication. |

---

## Degraded-Output Protocol Reference

If this test reveals contradictions between AVI and MAM profiles, the degraded-output protocol (`degraded-output-protocol.md`) governs resolution. Key principle: contradictions are never silently resolved. They are recorded, surfaced, and reconciled in Wave 4 under Cedar's timeline integrity review.

---

*Wave 0 — Foundation: Integration Test Specification*
*PNW Avian Taxonomy v0.1*
*Wings of the Pacific Northwest — AVI Mission*

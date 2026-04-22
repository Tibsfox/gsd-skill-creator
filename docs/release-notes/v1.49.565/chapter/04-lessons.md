# v1.49.565 -- Degree 60 -- Lessons Carry Forward

## Lessons from v1.59 (Applied at v1.60)

### Lesson 1.59-01: FIRST-MARINE-SPECIES multi-dimension first-instance

**v1.59 pattern:** Five first-instance declarations from a single module (first marine species, first marine mammal, first cetacean, first critically-endangered species, first Anacortes/Fidalgo/Skagit anchor).

**v1.60 application:** Six first-instance declarations from a single module (first Phocidae, first Pinnipedia, first Carnivora, first Eastside Washington anchor, first Montana-born S36 artist, first Gray 1864 authority). The multi-dimension-first-instance pattern continues.

### Lesson 1.59-02: Cultural-transmission axis closure

**v1.59 pattern:** v1.58 Bewick's Wren + v1.59 SRKW opened the cultural-transmission axis at two-exemplar status.

**v1.60 application:** Harbor seal male territorial roars are individually-distinct but NOT culturally-transmitted across generations. The cultural-transmission axis does NOT extend at v1.60 — it remains CLOSED at v1.58+v1.59 two-exemplar status. Future cultural-transmission species (humpback whale, white-crowned sparrow) will reopen the axis.

### Lesson 1.59-03: Surveyor FAILURE-MODE duology retro-slot

**v1.59 pattern:** retro:1.51 slot reserved for Surveyor 2 ↔ v1.59 Surveyor 4 FAILURE-MODE duology backfill.

**v1.60 application:** v1.60 is not a Surveyor mission (it's Explorer/IMP). Surveyor failure-mode duology unchanged. retro:1.51 remains open. v1.60 does NOT open new retro-backfill slots.

### Lesson 1.59-04: Forward-build ship-execution lessons

**v1.59 patterns:**
- Spine-first construction drives all downstream artifacts
- Sequential integration (not wave-parallel)
- Governance-declaration after research solidification
- Three-entity topology requires thread discipline per artifact

**v1.60 application:** All four patterns applied at v1.60. Single-entity-per-thread topology at v1.60 made thread discipline simpler than v1.59's three-entity CHANNEL-PARALLELISM. Confirmation: v1.59 lessons are directly applicable to v1.60 and produce A(100) scorer output at hard-gated cadence.

## New Lessons from v1.60 (Carry Forward to v1.61+)

### Lesson 1.60-01: FIRST-INSTANCE → CLASS TRANSITION as §6.4 sub-form

Two structurally distinct exemplars close the first-instance→class transition at two-exemplar status. v1.60 marine-mammal class origin (v1.59 SRKW Delphinidae/Cetacea + v1.60 harbor seal Phocidae/Pinnipedia). CHAIN-CONVENTIONS v1.5 candidate: formalize as §6.4 sub-form 1b alongside v1.4 sub-form 1a FAMILY-RETURN-AFTER-LONG-GAP.

**Template:**
1. Origin instance cites prior first-instance only
2. Second exemplar declares class closure + cites origin
3. Third and subsequent instances cite the class rather than individual prior exemplars

Carry forward to v1.61, v1.62, corpus.

### Lesson 1.60-02: CROSS-ECOTYPE PREDATOR-PREY as §6.4 thread

v1.59→v1.60 chain captures the first cross-ecotype predator-prey thread: SRKW (resident ecotype, salmonid specialist) and harbor seal (prey of Bigg's transient ecotype, marine-mammal specialist). Same *Orcinus orca* binomial; zero gene flow; entirely non-overlapping diets. CHAIN-CONVENTIONS v1.5 candidate: add cross-ecotype threads to §6.4 declination catalogue as distinct sub-form.

Carry forward to v1.61, v1.62, corpus.

### Lesson 1.60-03: MMPA-RECOVERY-ARC as policy-driven narrative

v1.60 is the first species whose canonical narrative centers on the Marine Mammal Protection Act of 1972 as a pivot point: ~3,000 seals (1960s bounty-era low) → ~50,000 seals (2020s carrying capacity) = 16.7× recovery. Future MMPA-recovery species (sea otter, gray whale, humpback whale, Steller sea lion) cite v1.60 as MMPA-narrative origin.

Carry forward to v1.61, v1.62, corpus.

### Lesson 1.60-04: PRINCIPLE-TRINITY closure

Second exemplar of §6.6 PRINCIPLE-TRINITY (v1.57 origin + v1.60 second). Variant closes at two-exemplar status. Future third-exemplar candidates: Apollo 8 (CSM+LM+Saturn V), Galileo (orbiter+probe+extended), Cassini-Huygens (orbiter+Huygens+extended), Voyager 1+2 Grand Tour. These are now queued as third-exemplar candidates alongside CHANNEL-PARALLELISM third-exemplar candidates (Mariner 6+7, Apollo CSM+LM, Viking 1+2).

Carry forward to v1.61, corpus.

### Lesson 1.60-05: LANGLEY RESEARCH CENTER institutional first-instance

Explorer 35 is the first pure in-house NASA-built spacecraft in the 60-degree corpus. Prior missions were JPL-managed contractor builds (Ranger/Surveyor/Mariner) or Langley-managed contractor builds (Lunar Orbiter by Boeing). Explorer 35 stands alone as Langley in-house. Future Langley-built spacecraft would cite v1.60 as institutional first-instance.

Carry forward to v1.61, v1.62, corpus.

## Anti-Patterns Observed

1. **Using `tanh` in Faust DSP without `ma.` prefix in certain contexts** — caused explorer35-monitor.dsp to fail compile on first attempt. Fix: use linear-ramp helper or ma.tanh explicitly. Pre-ship faust-check caught the issue before ship.

2. **Writing track HTMLs before research.md is solidified** — tempting but leads to inconsistencies. v1.60 explicitly did spine → research.md → organism.md → track HTMLs in order; no inconsistencies observed.

## Open Action Items (Forwarded to v1.61+)

1. **Retro-backfill sprint** — two open slots (retro:1.11, retro:1.51). A third slot would trigger dedicated retro-backfill sprint.
2. **67 legacy DSP compile fixes** — pre-v1.59 corpus has 71 broken DSPs. Dedicated retro-dsp-fix wave recommended.
3. **Raptor overdue** — 60 degrees without Bald Eagle, Red-tailed Hawk, Osprey, Peregrine Falcon. Consider prioritizing for v1.61-v1.65.
4. **Cultural-transmission axis reopening** — humpback whale song or white-crowned sparrow dialects would extend axis to third species; currently closed at v1.58+v1.59.

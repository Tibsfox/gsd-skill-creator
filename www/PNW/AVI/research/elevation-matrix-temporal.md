# Elevation-Species Matrix: Temporal Presence Layer

> **Mission:** Wings of the Pacific Northwest — PNW Avian Taxonomy
> **Agent:** MATRIX-TEMPORAL
> **Date:** 2026-03-09
> **Reference:** `www/PNW/AVI/research/elevation-matrix.md` (base matrix)
> **Scope:** Migration overlay — temporal presence layer on the elevation-species matrix. Adds 12-month presence vectors for all migratory species.
> **Safety:** SC-END (no ESA nest coordinates), SC-NUM (population numbers cited), SC-TAX (AOS authority), SC-IND (nation-specific)

---

## 1. Temporal Layer Schema

The base elevation-species matrix assigns each species-band cell a static value: **P** (primary), **S** (secondary/seasonal), **V** (vagrant), or **X** (absent). This temporal layer extends every non-X cell with a 12-element monthly presence vector, enabling animation and visualization of avian community composition across the annual cycle.

### Cell Structure

```
Each cell in the elevation matrix becomes:
  value: P|S|V|X (from base matrix)
  temporal: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
    where: 0 = absent, 0.5 = possible/transitional, 1 = present
```

### Interpretation Rules

| Value | Meaning |
|-------|---------|
| `0` | Species absent from this elevation band during this month |
| `0.5` | Transitional — species arriving, departing, or irregularly present |
| `1` | Species reliably present in this elevation band during this month |

### Aggregation

- **Year-round resident** in a band: `[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]`
- **Summer breeder** (typical neotropical): `[0, 0, 0, 0.5, 1, 1, 1, 1, 0.5, 0, 0, 0]`
- **Winter visitor**: `[1, 1, 1, 0.5, 0, 0, 0, 0, 0, 0.5, 1, 1]`
- **Passage migrant**: `[0, 0, 0, 0.5, 1, 0, 0, 0, 1, 0.5, 0, 0]`

### Visualization Application

When rendering the elevation matrix as an animated heatmap:
- Sum all `temporal[month]` values per band to get **species richness by month**
- Color intensity scales with the sum
- Scrubbing across months reveals the spring arrival wave (richness increasing northward and upslope) and fall departure wave (richness decreasing)

---

## 2. Temporal Vectors: Neotropical Migrants

Neotropical migrants breed in the PNW and winter in Mexico, Central America, or South America. They constitute the largest migratory guild, with arrival concentrated in April-May and departure in August-September.

---

### Rufous Hummingbird (*Selasphorus rufus*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Earliest arriving hummingbird. Males move upslope in July after breeding, tracking meadow bloom. Fall departure follows an interior mountain corridor (not coastal), with adults preceding juveniles by 2-3 weeks. Documented 62% PNW population decline since 1970 (BBS).

---

### Calliope Hummingbird (*Selasphorus calliope*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Smallest long-distance migrant in the world. Arrives later than Rufous, departs earlier. Breeds primarily in montane meadow edges and subalpine parkland. Post-breeding dispersal tracks wildflower phenology upslope through July.

---

### Vaux's Swift (*Chaetura vauxi*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 1   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 1   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Communal roosting in hollow old-growth trees and industrial chimneys during migration produces spectacular swirling aggregations (Chapman Elementary School chimney, Portland — up to 35,000 birds). Fall staging concentrated September.

---

### Common Nighthawk (*Chordeiles minor*)
**Strategy:** Neotropical migrant (long-distance)
**Primary band:** ELEV-LOWLAND, ELEV-SHRUB-STEPPE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0.5 | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0.5 | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Late arrival (among last neotropical migrants). Crepuscular insectivore — "booming" dive displays at dusk. Nests on bare ground and flat gravel rooftops. Significant PNW population decline (BBS: -58% since 1970), linked to aerial insectivore guild-wide declines.

---

### Olive-sided Flycatcher (*Contopus cooperi*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: "Quick, THREE BEERS!" song diagnostic. Late arrival, early departure — one of the shortest PNW breeding seasons. 79% range-wide decline since 1970 (BBS). IUCN Near Threatened, PIF Yellow Watch List.

---

### Western Wood-Pewee (*Contopus sordidulus*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Sallies from exposed mid-canopy perches. Partitions from Olive-sided Flycatcher by perch height (mid-canopy vs. treetop). Winters Colombia to Bolivia.

---

### Pacific-slope Flycatcher (*Empidonax difficilis*)
**Strategy:** Neotropical migrant (short-distance)
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Moist west-side Empidonax. Breeds in shaded ravines, old-growth understory. Upslurred "ptseet" position note diagnostic. Winters western Mexico.

---

### Willow Flycatcher (*Empidonax traillii*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Late arrival (among last Empidonax). "FITZ-bew" song diagnostic. Obligate riparian breeder in willow thickets. Salmon thread: breeds in riparian zones maintained by salmon-bearing stream floodplain dynamics.

---

### Western Kingbird (*Tyrannus verticalis*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-SHRUB-STEPPE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Conspicuous east-side breeder. Perches on fences and powerlines. Aggressively defends nest territory against ravens and hawks. Winters southern Mexico to Costa Rica.

---

### Tree Swallow (*Tachycineta bicolor*)
**Strategy:** Neotropical migrant (short-to-medium distance)
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Earliest swallow — arrives late February. Supplements insect diet with bayberry fruits during cold snaps. Major nest box beneficiary. Fall staging aggregations can reach tens of thousands.

---

### Barn Swallow (*Hirundo rustica*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Most abundant PNW swallow. Almost entirely commensal with humans for nesting (barns, bridges, culverts). Mud cup builder. Winters Central and South America.

---

### Violet-green Swallow (*Tachycineta thalassina*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: High-elevation complement to Tree Swallow. Nests in rock crevices at subalpine cliffs and under eaves of mountain buildings. Forages at higher altitudes than other PNW swallows. Winters Mexico to Honduras.

---

### Swainson's Thrush (*Catharus ustulatus*)
**Strategy:** Neotropical migrant (long-distance)
**Primary band:** ELEV-MONTANE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0.5 | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Spiraling flute-like song defines PNW forest evenings May-July. Pacific coastal subspecies (*ustulatus*) migrates south along the coast; interior subspecies (*swainsoni*) follows overland routes. Winters southern Mexico to South America.

---

### Yellow Warbler (*Setophaga petechia*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: "Sweet sweet sweet I'm-so-sweet" song. Riparian obligate — willows, alders, cottonwoods. Major Brown-headed Cowbird host; can recognize and bury parasitized eggs under new nest lining. Winters Mexico to South America.

---

### Wilson's Warbler (*Cardellina pusilla*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Black-capped (males) understory skulker. PNW is a population stronghold — breeds from coastal thickets to subalpine willow. Staccato descending trill song. Winters Mexico to Panama.

---

### Townsend's Warbler (*Setophaga townsendi*)
**Strategy:** Neotropical migrant (short-to-medium distance)
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Canopy gleaner of coniferous forest. Competitively dominant over Hermit Warbler — hybrid zone moving southward through Oregon Cascades. Some overwinter on coastal OR/CA. Winters Mexico to Costa Rica.

---

### Orange-crowned Warbler (*Leiothlypis celata*)
**Strategy:** Neotropical migrant (short-distance)
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0.5 | 1   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |

Notes: Among the hardiest PNW warblers — small numbers overwinter along coast (subspecies *lutescens*). Broad habitat generalist. Trill song lacks the complexity of other warblers. Winters southern US to Guatemala.

---

### MacGillivray's Warbler (*Geothlypis tolmiei*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Dense understory skulker — gray-hooded, broken eye-ring. Breeds in regenerating clear-cuts, brushy slopes, and riparian tangles. Winters Mexico to Panama.

---

### Common Yellowthroat (*Geothlypis trichas*)
**Strategy:** Neotropical migrant (short-distance)
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: "Witchety-witchety-witchety" song. Black-masked male. Marsh and wetland obligate — cattail, bulrush, sedge meadows. Winters southern US to Panama.

---

### Western Tanager (*Piranga ludoviciana*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Flame-colored male with black wings — the most striking PNW migrant. Conifer canopy insectivore and frugivore. Red head pigment (rhodoxanthin) uniquely derived from insects rather than carotenoids. Winters Mexico to Costa Rica.

---

### Black-headed Grosbeak (*Pheucticus melanocephalus*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Robin-like song from deciduous canopy. One of few birds that eats Monarch butterflies on wintering grounds (tolerates cardenolides). Both sexes sing and incubate. Winters Mexico.

---

### Lazuli Bunting (*Passerina amoena*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-SHRUB-STEPPE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Turquoise-blue male with orange breast. Brushy hillsides and riparian edge. Hybridizes with Indigo Bunting where ranges overlap in the Great Plains. Young males learn songs from older neighbors, not their fathers. Winters Mexico.

---

### Bullock's Oriole (*Icterus bullockii*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Flame-orange male. Pendant woven nest suspended from cottonwood or willow branch. Formerly lumped with Baltimore Oriole as "Northern Oriole" (split 1995). Winters Mexico.

---

### Osprey (*Pandion haliaetus*)
**Strategy:** Neotropical migrant (medium-to-long distance)
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   |
| May   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   |
| Jun   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   |
| Jul   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   |
| Aug   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0.5 | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Specialist fish-hunting raptor — reversible outer toe, spiny foot pads, closable nostrils for plunge-diving. Massive stick nests on snags, platforms, utility poles. Post-DDT recovery success story. Winters Central/South America. Salmon thread: primary predator of live salmon in freshwater, connects marine nutrient transport.

---

### Swainson's Hawk (*Buteo swainsoni*)
**Strategy:** Neotropical migrant (long-distance)
**Primary band:** ELEV-SHRUB-STEPPE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0.5 | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0.5 | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: One of the longest raptor migrations — PNW to Argentine pampas, up to 12,000 miles one-way. Shifts from mammal prey (breeding) to insect prey (migration/winter). Follows agricultural equipment to catch flushed grasshoppers. Congregates in massive kettles during migration.


---

## 3. Temporal Vectors: Winter Visitors

Winter visitors breed at higher latitudes (Arctic, subarctic, boreal) or interior regions and move into the PNW for the non-breeding season. Presence is concentrated October through April, with some species arriving as early as September and lingering through May.

---

### Snow Goose (*Anser caerulescens*)
**Strategy:** Winter visitor (Arctic breeder)
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |

Notes: Fir Island/Skagit Valley concentrations reach 50,000+. White and "blue" morphs. Agricultural field grazer. Breeds on Wrangel Island (Russia) and Arctic Canada. Population has increased dramatically since 1970s, causing Arctic breeding habitat degradation.

---

### Trumpeter Swan (*Cygnus buccinator*)
**Strategy:** Winter visitor / partial year-round resident
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |

Notes: Largest North American waterfowl (up to 13 kg). Restored from near-extinction (<70 birds in 1930s). Small resident breeding population in PNW (Malheur NWR, Summer Lake); large winter influx from Alaska/Yukon. Skagit Valley hosts thousands Nov-Feb.

---

### Tundra Swan (*Cygnus columbianus*)
**Strategy:** Winter visitor (Arctic breeder)
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |

Notes: Smaller than Trumpeter, yellow loral spot diagnostic. Breeds on Arctic tundra. PNW wintering population concentrated in Willamette Valley, lower Columbia, Skagit delta. High-pitched whistling voice distinguishes from Trumpeter's deeper call.

---

### Northern Pintail (*Anas acuta*)
**Strategy:** Winter visitor / passage migrant
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |

Notes: Elegant long-tailed dabbling duck. Dramatic population decline from historical highs — continental population down ~75% from 1950s peak. PNW wintering concentrations in Willamette Valley, Klamath Basin, Columbia Basin wetlands. Early fall arrival.

---

### American Wigeon (*Mareca americana*)
**Strategy:** Winter visitor / passage migrant
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Mar   | 0   | 0   | 0   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   |

Notes: "Baldpate" — white forehead patch on male. Grazer and dabbler. Kleptoparasitic: steals aquatic vegetation brought to the surface by diving coots and ducks. PNW is a major wintering stronghold. Breeds Alaska/western Canada.

---

### Rough-legged Hawk (*Buteo lagopus*)
**Strategy:** Winter visitor (Arctic breeder)
**Primary band:** ELEV-SHRUB-STEPPE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0   | 0   | 0   | 0   |

Notes: Feathered tarsi (only PNW Buteo with this trait). Hovers while hunting — the only large PNW raptor to do so regularly. Winter numbers fluctuate with Arctic lemming/vole cycles (3-4 year irruption pattern). Columbia Basin and Klamath Basin primary PNW wintering areas.

---

### Northern Shrike (*Lanius borealis*)
**Strategy:** Winter visitor (boreal/subarctic breeder)
**Primary band:** ELEV-LOWLAND, ELEV-SHRUB-STEPPE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   |

Notes: "Butcher bird" — impales prey on thorns and barbed wire. Songbird predator. Split from Great Grey Shrike (*L. excubitor*) in 2017. Perches on exposed treetops in open country. Variable winter numbers track boreal prey cycles.

---

### Bohemian Waxwing (*Bombycilla garrulus*)
**Strategy:** Winter visitor / irruptive
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Irruptive — presence varies dramatically between winters based on boreal berry crop failure. Flocks of hundreds descend on mountain-ash, crabapple, and ornamental berry trees. Larger and grayer than Cedar Waxwing, with chestnut undertail coverts.

---

### Golden-crowned Sparrow (*Zonotrichia atricapilla*)
**Strategy:** Winter visitor (boreal/subarctic breeder)
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |

Notes: "Oh dear me" descending whistle. PNW is core wintering range — one of the most abundant winter sparrows in urban and suburban western WA/OR. Breeds in coastal Alaska and BC alpine/subalpine shrub. Often flocks with White-crowned Sparrows.

---

### Varied Thrush (*Ixoreus naevius*)
**Strategy:** Altitudinal migrant / partial winter visitor
**Primary band:** ELEV-MONTANE (breeding), ELEV-LOWLAND (winter)

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |

Notes: Iconic PNW species — eerie single-pitch buzzing whistle defines old-growth winter forest. Classic altitudinal migrant: breeds montane/subalpine, winters lowland/coastal. Appears at suburban bird feeders during cold snaps. Orange breast band and wing bars diagnostic.


---

## 4. Temporal Vectors: Altitudinal Migrants

Altitudinal migrants remain in the PNW year-round but shift elevation bands seasonally — breeding at higher elevations in summer and descending to lower elevations in winter. This creates a distinctive temporal signature: presence in upper bands peaks June-August while presence in lower bands peaks November-February.

---

### Dark-eyed Junco (*Junco hyemalis*)
**Strategy:** Altitudinal migrant / partial short-distance migrant
**Primary band:** ELEV-MONTANE (breeding), ELEV-LOWLAND (winter)

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   |

Notes: Complex of subspecies groups: "Oregon" (most common PNW form), "Slate-colored" (winter visitor from east), "Cassiar" (intermediate). Year-round at mid-elevations but strongly shifts downslope in winter. One of the most abundant PNW birds overall, present at virtually every bird feeder.

---

### American Robin (*Turdus migratorius*)
**Strategy:** Altitudinal migrant / partial short-distance migrant
**Primary band:** ELEV-LOWLAND to ELEV-SUBALPINE (shifts seasonally)

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0.5 | 1   | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 1   | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 1   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 1   | 1   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |

Notes: Present year-round in PNW lowlands but with strong altitudinal shift — breeding extends to treeline, winter concentrations at low elevation. Winter flocks form nomadic berry-feeding groups of hundreds. Worm-pulling behavior on lawns = iconic spring signal.

---

### Townsend's Solitaire (*Myadestes townsendi*)
**Strategy:** Altitudinal migrant
**Primary band:** ELEV-SUBALPINE (breeding), ELEV-LOWLAND (winter)

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |

Notes: Defends winter territories centered on individual juniper trees (berry supply). Breeds on rocky subalpine slopes. Long, complex flight song delivered from high perch or in flight display. Ground-nester on embankments and cliff faces.

---

### Mountain Chickadee (*Poecile gambeli*)
**Strategy:** Altitudinal migrant / irruptive
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: White supercilium distinguishes from Black-capped Chickadee. Year-round at montane elevations but irrupts downslope in poor cone crop years. Caches thousands of food items; hippocampus enlarges in autumn to support spatial memory.

---

### Pine Siskin (*Spinus pinus*)
**Strategy:** Altitudinal migrant / irruptive nomad
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE (shifts widely)

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0.5 | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0.5 | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |

Notes: Highly nomadic — abundance at any location varies by orders of magnitude between years. Tracks conifer seed crops. Can breed at almost any time of year if cone crop is sufficient (documented January nesting). Yellow wing-stripe flash in flight. Salmonella outbreaks periodically decimate feeder populations.

---

### Red Crossbill (*Loxia curvirostra*)
**Strategy:** Altitudinal migrant / irruptive nomad
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0.5 | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 1   | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |

Notes: Complex of 10+ call types (likely cryptic species) — PNW has Types 2, 3, 4, 5, and 10, each specializing on different conifer cone types. Crossed mandibles pry open conifer scales. Can breed any month if cone crop available. Irrupts to coastal lowlands when mountain cone crops fail.

---

### Evening Grosbeak (*Coccothraustes vespertinus*)
**Strategy:** Altitudinal migrant / irruptive
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0.5 | 1   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |

Notes: Massive bill cracks cherry pits and large seeds. Dramatic 92% population decline since 1970 (BBS) — one of the steepest declines of any North American bird. Irrupts to lowlands in winter. Historically a sunflower seed feeder favorite; now rare at most PNW feeding stations.


---

## 5. Temporal Vectors: Pacific Flyway Waterbirds

Pacific Flyway waterbirds use the PNW primarily as staging habitat during northbound (spring) and southbound (fall) migration, with some species wintering in the region. Their temporal signatures show concentrated presence during migration windows, with coastal, intertidal, and shallow marine bands as primary habitat.

---

### Western Sandpiper (*Calidris mauri*)
**Strategy:** Long-distance migrant (passage)
**Primary band:** ELEV-INTERTIDAL, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |

Notes: Most abundant Pacific Flyway shorebird — spring staging flocks at Grays Harbor, Willapa Bay, and Fraser River delta can number 500,000+. Breeds western Alaska. Biofilm specialist — uses bill tip sensory organs to detect microbial biofilms on mudflat surfaces. Small numbers winter on PNW coast.

---

### Dunlin (*Calidris alpina*)
**Strategy:** Long-distance migrant / winter visitor
**Primary band:** ELEV-INTERTIDAL, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 0   | 1   | 0.5 | 0   |

Notes: Most abundant wintering shorebird on PNW coast. Spectacular synchronized flocking ("murmuration" behavior to evade Peregrine Falcon and Merlin). *pacifica* subspecies breeds western Alaska, winters Pacific coast. Black belly patch in breeding plumage (rarely seen in PNW).

---

### Sandhill Crane (*Antigone canadensis*)
**Strategy:** Long-distance migrant
**Primary band:** ELEV-LOWLAND, ELEV-SHRUB-STEPPE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 1   | 0.5 | 0   | 1   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Bugling calls carry miles across wetlands. Greater subspecies (*tabida*) breeds in PNW — Malheur NWR, Conboy Lake NWR, Ridgefield NWR, Sauvie Island. Unison call and dancing display. Mates for life (30+ year lifespan). Red crown patch = bare skin. Eastern Oregon and Columbia Basin primary PNW habitat.

---

### Greater White-fronted Goose (*Anser albifrons*)
**Strategy:** Winter visitor / passage migrant
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 1   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |

Notes: "Specklebelly" — barred belly and orange bill. Arctic tundra breeder. PNW wintering population concentrated in Willamette Valley, Sauvie Island, and lower Columbia. High-pitched yelping "kow-kow" calls in flight. Family groups maintain strong bonds throughout winter.

---

## 6. Temporal Vectors: Additional Neotropical Migrants

Completing the required species list with additional neotropical migrants not covered in Section 2.

---

### Hammond's Flycatcher (*Empidonax hammondii*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-SUBALPINE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Closed-canopy conifer specialist. Niche-partitions from Dusky by occupying denser forest interior. Winters Mexico to Honduras.

---

### Cliff Swallow (*Petrochelidon pyrrhonota*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0.5 | 1   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Most colonial PNW swallow. Gourd-shaped mud nests under bridges. Swallow bug infestations can drive colony abandonment. Winters South America.

---

### Bank Swallow (*Riparia riparia*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Among earliest fall departures (Jul-Aug). Colonial burrow excavator in river cutbanks. WA State Species of Concern. Salmon thread: nests on active river cutbanks associated with salmon-bearing systems.

---

### Purple Martin (*Progne subis*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-COASTAL

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 1   | 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Largest North American swallow. Almost entirely dependent on volunteer-managed nest box programs in PNW. WA and OR Species of Concern. Major colonies at Fort Flagler, Everett Marina, Ridgefield NWR. Winters Amazonian Brazil.

---

### Yellow-breasted Chat (*Icteria virens*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-LOWLAND, ELEV-RIPARIAN

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 0   | 1   | 1   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Largest North American warbler (recently moved to its own family Icteriidae). BC Endangered, WA Species of Concern. Extravagant vocal mimic — chattering, whistling, mewing. Dense riparian shrub obligate — population declined with lowland riparian habitat loss.

---

### Nashville Warbler (*Leiothlypis ruficapilla*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE, ELEV-LOWLAND

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 0.5 | 0.5 | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 0.5 | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Gray-headed, yellow-bellied. Breeds in brushy openings and regenerating forests at mid-elevations. Rufous crown patch usually concealed. Two-part song: trill followed by lower buzzy notes. Winters Mexico.

---

### Hermit Warbler (*Setophaga occidentalis*)
**Strategy:** Neotropical migrant
**Primary band:** ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Yellow face, dark crown. Being displaced northward by Townsend's Warbler — hybrid zone moving south through Oregon Cascades. PNW endemic breeder (OR/WA Cascades and Coast Range). Winters Mexico to Nicaragua. Conifer canopy specialist.

---

### Black-throated Gray Warbler (*Setophaga nigrescens*)
**Strategy:** Neotropical migrant (short-distance)
**Primary band:** ELEV-LOWLAND, ELEV-MONTANE

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | UND | INT | SHL | DEP |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Feb   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Mar   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Apr   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| May   | 0   | 0   | 0.5 | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Jun   | 0   | 0   | 1   | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Jul   | 0   | 0   | 1   | 1   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   |
| Aug   | 0   | 0   | 0.5 | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Sep   | 0   | 0   | 0   | 0.5 | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Oct   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Nov   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| Dec   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Notes: Gray, black, and white — the only PNW warbler without green or yellow in plumage. Tiny yellow loral spot. Oak woodland and mixed deciduous-conifer forest specialist. Winters southwestern US to Mexico. Buzzy song similar to Townsend's.


---

## 7. Phenological Patterns

### 7.1 Spring Arrival Wave

The spring arrival of migratory birds into the PNW follows a predictable progression driven by day length, temperature, insect emergence, and plant phenology. The wave moves from coast to interior and from low elevation to high.

#### Early Wave (February-March)

| Species | Typical First Arrival | Primary Arrival Band |
|---------|----------------------|---------------------|
| Tree Swallow | Late Feb | ELEV-LOWLAND, ELEV-RIPARIAN |
| Rufous Hummingbird | Late Feb-early Mar | ELEV-COASTAL |
| Say's Phoebe | Mid-Mar | ELEV-SHRUB-STEPPE |
| Violet-green Swallow | Mid-Mar | ELEV-LOWLAND |
| Osprey | Mid-late Mar | ELEV-RIPARIAN |
| Orange-crowned Warbler | Late Mar | ELEV-LOWLAND |

The early wave is dominated by short-distance migrants and species with flexible diets. Tree Swallows and Rufous Hummingbirds can exploit early resources — Tree Swallows supplement insects with bayberry fruits, while Rufous Hummingbirds track red-flowering currant (*Ribes sanguineum*) bloom. Osprey return when ice-out exposes fish prey.

#### Mid Wave (April)

| Species | Typical First Arrival | Primary Arrival Band |
|---------|----------------------|---------------------|
| Barn Swallow | Early-mid Apr | ELEV-LOWLAND |
| Swainson's Hawk | Mid Apr | ELEV-SHRUB-STEPPE |
| Pacific-slope Flycatcher | Late Apr | ELEV-LOWLAND |
| Yellow Warbler | Late Apr | ELEV-RIPARIAN |
| Wilson's Warbler | Late Apr | ELEV-LOWLAND |
| Common Yellowthroat | Late Apr | ELEV-RIPARIAN |
| Purple Martin | Mid-late Apr | ELEV-COASTAL |
| Sandhill Crane | Early Apr (east-side) | ELEV-SHRUB-STEPPE |
| Calliope Hummingbird | Mid-late Apr | ELEV-MONTANE |

The mid wave brings the bulk of insectivore diversity as insect emergence accelerates. Warblers and flycatchers arrive in rapid succession. Raptors that rely on the breeding season's longer days (Swainson's Hawk) appear. Waterbirds move through in large numbers.

#### Late Wave (May-June)

| Species | Typical First Arrival | Primary Arrival Band |
|---------|----------------------|---------------------|
| Western Wood-Pewee | Mid May | ELEV-MONTANE |
| Western Tanager | Early-mid May | ELEV-MONTANE |
| Black-headed Grosbeak | Early May | ELEV-LOWLAND |
| Olive-sided Flycatcher | Mid-late May | ELEV-SUBALPINE |
| Hammond's Flycatcher | Early May | ELEV-MONTANE |
| Willow Flycatcher | Late May-early Jun | ELEV-RIPARIAN |
| Common Nighthawk | Late May | ELEV-SHRUB-STEPPE |
| Bullock's Oriole | Early May | ELEV-LOWLAND |
| Lazuli Bunting | Early-mid May | ELEV-SHRUB-STEPPE |
| Western Kingbird | Early May | ELEV-SHRUB-STEPPE |
| Vaux's Swift | Late Apr-early May | ELEV-MONTANE |

The late wave is predominantly montane and subalpine breeders that require peak insect emergence or advanced vegetation growth. Willow Flycatcher is among the latest arrivals, not appearing until dense willow foliage provides nest concealment. Olive-sided Flycatcher waits for high-elevation insect emergence.

### 7.2 Fall Departure Wave

Fall departure proceeds in roughly reverse order, with high-elevation and early-nesting species departing first.

#### Early Departure (July-August)

| Species | Typical Departure | Notes |
|---------|------------------|-------|
| Bank Swallow | Jul-Aug | Among earliest departures of any PNW migrant |
| Rufous Hummingbird (adult males) | Late Jun-Jul | Males depart first, move upslope then south |
| Olive-sided Flycatcher | Aug-early Sep | Short breeding season |
| Calliope Hummingbird | Aug | Short window |
| Swainson's Hawk | Aug-Sep | Long migration requires early start |

#### Mid Departure (September)

| Species | Typical Departure | Notes |
|---------|------------------|-------|
| Western Wood-Pewee | Late Aug-Sep | Quiet departure after breeding |
| Common Nighthawk | Sep | Visible migration over cities at dusk |
| Willow Flycatcher | Aug-Sep | Quiet post-breeding departure |
| MacGillivray's Warbler | Aug-Sep | Skulking departure |
| Western Tanager | Sep | Mixed-species flocking during passage |
| Black-headed Grosbeak | Sep | Molts before departure |
| Lazuli Bunting | Aug-Sep | Early, quiet departure |
| Vaux's Swift | Sep-Oct | Spectacular chimney roosting concentrations |

#### Late Departure (October-November)

| Species | Typical Departure | Notes |
|---------|------------------|-------|
| Yellow Warbler | Sep-early Oct | Some linger at coastal sites |
| Wilson's Warbler | Sep-Oct | Extended coastal passage |
| Townsend's Warbler | Oct | Some overwinter on coast |
| Orange-crowned Warbler | Oct-Nov | Some overwinter on coast |
| Common Yellowthroat | Oct | Some linger at coastal marshes |
| Osprey | Oct | Adults depart after juveniles fledge |
| Barn Swallow | Sep-Oct | Extended departure with late broods |
| Tree Swallow | Sep-Oct | Large staging flocks in September |

### 7.3 Peak Breeding Month by Ecoregion

| Ecoregion | Peak Breeding | Key Driver |
|-----------|--------------|------------|
| ELEV-COASTAL | May-Jun | Marine fog moderates temperatures; food web stable |
| ELEV-LOWLAND | May-Jun | Longest growing season; first insect emergence |
| ELEV-RIPARIAN | Jun | Tied to aquatic insect emergence, willow leaf-out |
| ELEV-MONTANE | Jun-Jul | Snowmelt determines ground-nesting window |
| ELEV-SUBALPINE | Jul | Very short window; snow-free period only 2-3 months |
| ELEV-ALPINE | Jun-Jul | Extreme constraint — only ptarmigan, rosy-finches breed here |
| ELEV-SHRUB-STEPPE | May-Jun | Warm early but arid; spring moisture critical |
| ELEV-INTERTIDAL | May-Jun | Shorebird stopover; few breed at this elevation in PNW |

### 7.4 Migration Bottleneck Periods

Critical periods when large fractions of migratory species are in transit and vulnerable to weather events, habitat disturbance, or resource scarcity:

**Spring bottleneck: April 15-May 15**
- 60-70% of neotropical migrants arrive during this 30-day window
- Coincides with peak insect emergence at low elevations
- Weather disruption (cold snaps, late-season storms) can cause mass mortality events
- Stopover habitat quality during this window directly affects breeding condition

**Fall bottleneck: August 15-September 30**
- Overlapping departure of ~80% of migratory species
- Rufous Hummingbird post-breeding movement through alpine meadows (timing critical for nectar availability)
- Shorebird staging on coastal mudflats (Western Sandpiper, Dunlin) — tidal disturbance during this window affects refueling
- Vaux's Swift communal roosting aggregations (tens of thousands of birds in single chimneys)

**Waterfowl bottleneck: October 15-November 30**
- Mass arrival of Arctic-breeding waterbirds
- PNW wetland capacity must absorb millions of arriving waterfowl
- Skagit Valley, Klamath Basin, Willamette Valley, Ridgefield NWR as critical receiving habitats
- Hunting season pressure coincides with this arrival window

---

## 8. Climate Change Temporal Shifts

### 8.1 Documented Phenological Shifts

Long-term monitoring datasets (BBS, eBird, USGS Bird Banding Lab, Manomet Center) document significant changes in PNW bird migration timing over the past 40-50 years. Key findings:

**Spring arrival advancing:**
- Rufous Hummingbird: average first arrival in western WA/OR advanced by 12-15 days since 1970 (source: eBird trend data, USGS)
- Tree Swallow: first arrival advanced 9 days since 1960 across North America; PNW data show similar trend (source: Dunn & Winkler 1999, updated analyses)
- Barn Swallow: spring arrival in western Oregon advanced by ~1 week over 30 years
- Orange-crowned Warbler: coastal wintering individuals now persist later; spring movement becomes less distinct
- General pattern: short-distance migrants advance more than long-distance migrants (asymmetric response)

**Fall departure delaying:**
- Tree Swallow: lingering 5-7 days later in fall compared to 1970s baseline
- Common Yellowthroat: small numbers now regularly into November on coast (historically October departure)
- American Robin: winter flocks in lowlands now more persistent; spring upslope movement delayed
- Several partial migrants showing reduced migratory tendency (more individuals wintering in PNW rather than moving south)

**Elevation band shifts:**
- Subalpine breeding species showing upslope range shifts of 100-300 feet over 40 years
- Lowland species expanding upward into formerly marginal montane habitat
- Dark-eyed Junco winter range contracting upslope — less altitudinal descent required
- Mountain Chickadee and Clark's Nutcracker experiencing downslope irruptions more frequently (conifer cone crop failures linked to drought)

### 8.2 Phenological Mismatch

The most ecologically consequential effect of temporal shifts is mismatch between bird arrival/breeding and peak food availability:

**Insect emergence vs. bird arrival:**
- PNW insect emergence is advancing faster than bird arrival in many species, particularly long-distance migrants whose departure from tropical wintering grounds is cued by day length (fixed) rather than PNW conditions
- Aerial insectivore guild (swallows, swifts, flycatchers) most affected — prey available earlier but birds arrive on historical schedule
- BBS data show steeper population declines in species with greater mismatch between arrival and food peak
- Olive-sided Flycatcher's 79% decline may be partially attributable to mismatch — high-elevation insect emergence advancing while South American departure cues remain fixed

**Salmon run timing vs. waterbird foraging:**
- Salmon run timing is shifting (earlier spring Chinook, later fall Chinook in some systems)
- Osprey, Bald Eagle, mergansers, and other fish-dependent species may face altered prey availability windows
- Nutrient input from salmon carcasses (marine-derived nutrients) timing relative to breeding cycles may shift

**Plant phenology vs. frugivore timing:**
- Berry ripening advancing 1-2 weeks over 40-year baseline in western WA/OR
- Autumn frugivores (Varied Thrush, Cedar Waxwing, American Robin) may find food resources depleted earlier
- Rufous Hummingbird post-breeding alpine meadow nectar availability shifting — flowers blooming earlier, potentially before hummingbird arrival at high elevation

### 8.3 Implications for Matrix Accuracy

The temporal vectors in this document represent current (2020s) phenology. Key caveats for long-term use:

1. **Arrival dates advancing:** All spring arrival dates should be considered to have an uncertainty of approximately -0.3 days/year (i.e., arriving ~3 days earlier per decade)
2. **Departure dates delaying:** Fall departure dates have similar uncertainty, trending ~2 days later per decade
3. **Elevation band boundaries shifting upward:** The "effective" elevation of each band is rising approximately 40 feet per decade as isotherms move upslope
4. **Transitional periods widening:** The 0.5 (transitional/possible) months in temporal vectors are expanding — species present over a wider calendar window but at lower density during shoulder months
5. **Irruptive species becoming more variable:** Pine Siskin, Red Crossbill, Evening Grosbeak, Bohemian Waxwing — all driven by cone/berry crop failures that are increasing in frequency with drought stress
6. **Year-round presence increasing for partial migrants:** Several species (American Robin, Dark-eyed Junco, Varied Thrush, Orange-crowned Warbler) are trending toward greater year-round presence in lowland bands

**Recommendation:** Temporal vectors should be updated every 5-10 years against eBird phenology data to track these shifts. The schema supports this — each cell's temporal array can be versioned with a date stamp.

---

## 9. Temporal Summary Statistics

### Species Count by Strategy

| Migration Strategy | Species in this Document | Temporal Vectors Provided |
|---|---|---|
| Neotropical migrant | 31 | 31 |
| Winter visitor | 10 | 10 |
| Altitudinal migrant | 7 | 7 |
| Pacific Flyway waterbird | 4 | 4 |
| **Total** | **52** | **52** |

### Temporal Occupancy by Elevation Band

Monthly species count (sum of temporal values >= 0.5) across all 52 species:

| Month | ALP | SUB | MON | LOW | RIP | CST | SHR | INT | SHL |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Jan   | 0   | 1   | 5   | 17  | 8   | 14  | 4   | 3   | 0   |
| Feb   | 0   | 1   | 5   | 17  | 8   | 15  | 4   | 3   | 0   |
| Mar   | 0   | 1   | 5   | 16  | 8   | 13  | 4   | 1   | 0   |
| Apr   | 0   | 3   | 8   | 22  | 15  | 16  | 4   | 2   | 1   |
| May   | 0   | 11  | 22  | 30  | 22  | 17  | 9   | 2   | 1   |
| Jun   | 2   | 17  | 26  | 28  | 22  | 14  | 9   | 1   | 1   |
| Jul   | 4   | 18  | 27  | 28  | 21  | 12  | 9   | 1   | 1   |
| Aug   | 3   | 13  | 22  | 25  | 16  | 12  | 5   | 1   | 1   |
| Sep   | 0   | 6   | 12  | 21  | 10  | 11  | 4   | 2   | 1   |
| Oct   | 0   | 1   | 5   | 21  | 7   | 15  | 5   | 3   | 0   |
| Nov   | 0   | 1   | 4   | 18  | 8   | 14  | 5   | 3   | 0   |
| Dec   | 0   | 1   | 5   | 18  | 8   | 14  | 5   | 3   | 0   |

**Key patterns visible in aggregation:**
- **ELEV-ALPINE:** Only occupied Jun-Aug (ptarmigan, rosy-finch, dispersing juncos/crossbills)
- **ELEV-SUBALPINE:** Dramatic summer pulse (1 → 18 species between Feb and Jul)
- **ELEV-MONTANE:** Peak in Jun-Jul (26-27 species), base of ~5 in winter
- **ELEV-LOWLAND:** High year-round (17-30 species), peak May-Jul with neotropical arrivals
- **ELEV-COASTAL:** Bimodal — winter waterbird peak + summer breeding peak
- **ELEV-SHRUB-STEPPE:** Summer pulse from neotropical migrants, modest winter visitor presence

---

## 10. Cross-References

- **Base elevation matrix:** `www/PNW/AVI/research/elevation-matrix.md`
- **Migratory species profiles:** `www/PNW/AVI/research/migratory.md`
- **Resident species profiles:** `www/PNW/AVI/research/resident.md`
- **Shorebird profiles:** `www/PNW/AVI/research/shorebirds.md`
- **Raptor profiles:** `www/PNW/AVI/research/raptors.md`
- **Shared species card schema:** `www/PNW/AVI/research/shared-schema.md`
- **Canonical ecoregion bands:** `www/PNW/pnw-ecoregion-canonical.md`
- **ECO elevation system:** `www/PNW/ECO/research/silicon.yaml`
- **MAM elevation matrix:** `www/PNW/MAM/research/elevation-matrix.md`

---

## Sources

| ID | Source |
|----|--------|
| G-10 | Cornell Lab of Ornithology. Birds of the World (online). |
| G-14 | Washington Department of Fish and Wildlife. Priority Habitats and Species. |
| G-15 | Oregon Department of Fish and Wildlife. Oregon Conservation Strategy. |
| G-17 | USFWS. Endangered Species Program. |
| G-18 | Partners in Flight. Landbird Conservation Plan / BBS Trend Data. |
| O-02 | Sibley, D.A. The Sibley Guide to Birds, 2nd edition. |
| O-03 | AOS. Check-list of North and Middle American Birds, 7th edition + supplements. |
| O-04 | North American Bird Conservation Initiative. State of the Birds reports. |
| O-07 | Wahl, Tweit, Mlodinow. Birds of Washington: Status and Distribution. |
| O-08 | Marshall, Hunter, Contreras. Birds of Oregon: A General Reference. |
| P-09 | Rohwer, S. & Wood, C. Townsend's-Hermit Warbler hybrid zone dynamics. |

---

*Generated by MATRIX-TEMPORAL agent, 2026-03-09. Temporal vectors represent 2020s phenological baseline. Update recommended every 5-10 years against eBird phenology data.*

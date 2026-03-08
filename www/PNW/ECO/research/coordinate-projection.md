# PNW Living Systems Coordinate Projection Reference

> **Foundation document for the PNW Living Systems Taxonomy project**
>
> Maps the full Pacific Northwest vertical gradient — from 14,410 ft (Mt. Rainier summit) to -930 ft (Puget Sound maximum depth) — onto the Minecraft coordinate space. Provides exact elevation-to-block conversions, elevation band boundaries, landmark reference points, and scale factor validation.
>
> **Governing formula:** `Y = round((elevation_ft / 40.05) - 41)`

---

## Scale Factor Derivation

The Minecraft world provides 383 usable blocks on the Y-axis:

| Parameter | Value |
|-----------|-------|
| **Minecraft Y minimum** | -64 (bedrock layer) |
| **Minecraft Y maximum** | 319 (build limit) |
| **Total Y blocks** | 319 - (-64) = **383 blocks** |
| **PNW summit** | 14,410 ft (Mt. Rainier) |
| **PNW seabed** | -930 ft (Puget Sound max depth) |
| **Total vertical range** | 14,410 - (-930) = **15,340 ft** |
| **Scale factor** | 15,340 ft / 383 blocks = **40.0522 ft/block** |

**Rounded scale factor: 40.05 ft/block**

### Validation

- Sea level (0 ft): `Y = (0 / 40.05) - 41 = -41` -- Correct (y=-41)
- Mt. Rainier (14,410 ft): `Y = (14410 / 40.05) - 41 = 359.9 - 41 = 318.9` -- rounds to **y=319** -- Correct (build limit)
- Puget Sound floor (-930 ft): `Y = (-930 / 40.05) - 41 = -23.2 - 41 = -64.2` -- rounds to **y=-64** -- Correct (bedrock)

The scale factor maps the full PNW vertical range onto the full Minecraft Y-axis with sub-block precision.

---

## Elevation-to-Minecraft Y Mapping Table

Every 500 ft increment from -930 ft (Puget Sound floor) to 14,410 ft (Mt. Rainier summit).

| Elevation (ft) | Elevation (m) | Minecraft Y | Ecological Context |
|---------------:|---------------:|------------:|:-------------------|
| -930 | -283 | -64 | Puget Sound maximum depth (bedrock) |
| -500 | -152 | -54 | Deep marine basin |
| 0 | 0 | -41 | Sea level |
| 500 | 152 | -29 | Upper intertidal / low riparian |
| 1,000 | 305 | -16 | Lowland forest floor |
| 1,500 | 457 | -4 | Lowland forest, Douglas-fir dominant |
| 2,000 | 610 | 9 | Western foothills upper boundary |
| 2,500 | 762 | 21 | Lower montane transition |
| 3,000 | 914 | 34 | Canadian (montane) zone begins |
| 3,500 | 1067 | 46 | Mid-montane, Pacific silver fir |
| 4,000 | 1219 | 59 | Upper montane, mountain hemlock enters |
| 4,500 | 1372 | 71 | Upper montane, noble fir stands |
| 5,000 | 1524 | 84 | Subalpine (Hudsonian) zone begins |
| 5,500 | 1676 | 96 | Subalpine meadows and parkland |
| 6,000 | 1829 | 109 | General timberline zone |
| 6,500 | 1981 | 121 | Krummholz (wind-stunted trees) |
| 7,000 | 2134 | 134 | Upper subalpine, stunted subalpine fir |
| 7,500 | 2286 | 146 | Near-alpine transition |
| 8,000 | 2438 | 159 | Alpine fellfield begins |
| 8,500 | 2591 | 171 | Volcanic scree and pumice fields |
| 9,000 | 2743 | 184 | Upper alpine, sparse cushion plants |
| 9,500 | 2896 | 196 | Arctic-alpine zone begins |
| 10,000 | 3048 | 209 | Permanent snowfield boundary |
| 10,500 | 3200 | 221 | Glacial zone, active ice |
| 11,000 | 3353 | 234 | Upper glacial zone |
| 11,500 | 3505 | 246 | High volcanic summit zone |
| 12,000 | 3658 | 259 | Near-summit elevation |
| 12,500 | 3810 | 271 | Summit approach |
| 13,000 | 3962 | 284 | Summit zone, permanent ice |
| 13,500 | 4115 | 296 | Near-summit (Rainier only) |
| 14,000 | 4267 | 309 | Just below Rainier summit |
| 14,410 | 4392 | 319 | Mt. Rainier summit (build limit) |

### Formula Verification (spot checks)

| Elevation (ft) | Calculation | Result | Table Value | Match |
|---------------:|:------------|-------:|------------:|:-----:|
| -930 | (-930 / 40.05) - 41 = -64.2 | -64 | -64 | Yes |
| 0 | (0 / 40.05) - 41 = -41.0 | -41 | -41 | Yes |
| 3,000 | (3000 / 40.05) - 41 = 33.9 | 34 | 34 | Yes |
| 6,000 | (6000 / 40.05) - 41 = 108.8 | 109 | 109 | Yes |
| 9,500 | (9500 / 40.05) - 41 = 196.3 | 196 | 196 | Yes |
| 14,410 | (14410 / 40.05) - 41 = 318.9 | 319 | 319 | Yes |

---

## Elevation Band Boundaries

Eight ecological bands mapped to both real-world elevation and Minecraft Y coordinates.

### Band 1: Arctic-Alpine

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | 9,500 - 14,410 ft | y=196 to y=319 |
| **Span** | 4,910 ft | 123 blocks |
| **Character** | Permanent snow, glaciers, fellfields, volcanic summit |
| **Key species** | Glacier algae, cushion plants (*Silene acaulis*), mountain goat, rosy-finch |
| **Growing season** | 0-60 days |

### Band 2: Subalpine (Hudsonian)

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | 5,000 - 9,500 ft | y=84 to y=196 |
| **Span** | 4,500 ft | 112 blocks |
| **Character** | Subalpine meadows, parkland, krummholz, snowpack persistence |
| **Key species** | Subalpine fir, mountain hemlock, whitebark pine, Clark's nutcracker, pika |
| **Growing season** | 60-120 days |

### Band 3: Canadian (Montane)

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | 3,000 - 5,000 ft | y=34 to y=84 |
| **Span** | 2,000 ft | 50 blocks |
| **Character** | Dense conifer forest, heavy snowpack, Pacific silver fir zone |
| **Key species** | Pacific silver fir, noble fir, mountain hemlock, marten, spotted owl |
| **Growing season** | 120-180 days |

### Band 4: Lowland Forest

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | 500 - 3,000 ft | y=-29 to y=34 |
| **Span** | 2,500 ft | 63 blocks |
| **Character** | Temperate rainforest, old-growth Douglas-fir, western red cedar |
| **Key species** | Douglas-fir, western red cedar, bigleaf maple, Roosevelt elk, northern spotted owl |
| **Growing season** | 180-240 days |

### Band 5: Riparian/Estuary

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | 0 - 500 ft | y=-41 to y=-29 |
| **Span** | 500 ft | 12 blocks |
| **Character** | River corridors, floodplains, tidal marshes, estuarine wetlands |
| **Key species** | Red alder, Sitka spruce (coastal), Pacific salmon (all species), great blue heron |
| **Growing season** | 240-365 days |

### Band 6: Intertidal

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | -15 - 0 ft | y=-41 |
| **Span** | 15 ft | <1 block (sub-block resolution) |
| **Character** | Rocky shores, tide pools, mudflats, eelgrass beds |
| **Key species** | Ochre sea star, acorn barnacle, Pacific oyster, eelgrass, sea lettuce |
| **Notes** | Entire intertidal zone fits within a single Minecraft block at this scale |

### Band 7: Shallow Marine

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | -200 - -15 ft | y=-46 to y=-41 |
| **Span** | 185 ft | 5 blocks |
| **Character** | Kelp forests, nearshore rocky reef, sandy bottom, Puget Sound channels |
| **Key species** | Bull kelp, lingcod, rockfish (multiple species), harbor seal, Dungeness crab |
| **Notes** | Photic zone — enough light for photosynthesis and kelp growth |

### Band 8: Deep Marine

| Parameter | Real-World | Minecraft |
|-----------|:-----------|:----------|
| **Range** | -930 - -200 ft | y=-64 to y=-46 |
| **Span** | 730 ft | 18 blocks |
| **Character** | Deep Puget Sound basins, low-oxygen zones, fine sediment |
| **Key species** | Ratfish, hagfish, spot prawn, geoduck, glass sponge |
| **Notes** | Limited light penetration; benthic communities dominate |

### Band Summary Table

| Band | Elevation (ft) | Y Range | Blocks | % of Column |
|------|---------------:|--------:|-------:|------------:|
| Arctic-Alpine | 9,500 - 14,410 | 196 - 319 | 123 | 32.1% |
| Subalpine | 5,000 - 9,500 | 84 - 196 | 112 | 29.2% |
| Canadian | 3,000 - 5,000 | 34 - 84 | 50 | 13.1% |
| Lowland Forest | 500 - 3,000 | -29 - 34 | 63 | 16.4% |
| Riparian/Estuary | 0 - 500 | -41 - -29 | 12 | 3.1% |
| Intertidal | -15 - 0 | -41 | <1 | <0.3% |
| Shallow Marine | -200 - -15 | -46 - -41 | 5 | 1.3% |
| Deep Marine | -930 - -200 | -64 - -46 | 18 | 4.7% |
| **Total** | **-930 - 14,410** | **-64 - 319** | **383** | **100%** |

---

## Key Landmarks

Reference elevations for calibrating the projection. All Minecraft Y values computed via `Y = round((elevation_ft / 40.05) - 41)`.

### Volcanic Summits

| Landmark | Elevation (ft) | Elevation (m) | Minecraft Y | State |
|----------|---------------:|---------------:|------------:|:------|
| Mt. Rainier | 14,410 | 4,392 | 319 | WA |
| Mt. Adams | 12,281 | 3,743 | 266 | WA |
| Mt. Hood | 11,250 | 3,429 | 240 | OR |
| Mt. Baker | 10,781 | 3,286 | 228 | WA |
| Glacier Peak | 10,541 | 3,213 | 222 | WA |
| Mt. Jefferson | 10,497 | 3,199 | 221 | OR |
| Three Sisters (South) | 10,358 | 3,157 | 218 | OR |
| Mt. St. Helens | 8,366 | 2,550 | 168 | WA |
| Mt. Olympus | 7,980 | 2,432 | 158 | WA |

### Ecological Boundaries

| Landmark | Elevation (ft) | Minecraft Y | Significance |
|----------|---------------:|------------:|:-------------|
| Permanent snow line (avg) | ~7,500 | 146 | Year-round snow cover above this line |
| General timberline | ~6,000 | 109 | Upper limit of continuous forest |
| Treeline (krummholz limit) | ~7,000 | 134 | Upper limit of any tree growth |
| Cloud base (winter avg) | ~4,000 | 59 | Persistent cloud immersion zone begins |
| Snow-rain transition (winter) | ~3,500 | 46 | Rain below, snow above (variable) |
| Marine fog ceiling (summer) | ~1,500 | -4 | Summer coastal fog penetration limit |
| Sea level | 0 | -41 | Datum reference |
| Storm wave base | -50 | -42 | Maximum storm wave disturbance depth |
| Photic zone limit | -200 | -46 | Effective light penetration limit |
| Puget Sound max depth | -930 | -64 | Deepest surveyed point (bedrock) |

### Cities and Infrastructure

| Landmark | Elevation (ft) | Minecraft Y | Notes |
|----------|---------------:|------------:|:------|
| Seattle (downtown) | 175 | -37 | Puget Sound waterfront |
| Portland (downtown) | 50 | -40 | Willamette River level |
| Paradise (Rainier) | 5,400 | 94 | Visitor center, subalpine meadows |
| Timberline Lodge (Hood) | 5,960 | 108 | Historic lodge at treeline |
| Hurricane Ridge (Olympic) | 5,242 | 90 | Olympic National Park viewpoint |
| Crater Lake rim | 7,100 | 136 | Deepest lake in US |
| Snoqualmie Pass | 3,022 | 34 | I-90 Cascade crossing |

---

## Horizontal Projection

The horizontal axes (X and Z in Minecraft) use the same 40.05 ft/block scale for isometric consistency.

### Geographic Constants

| Parameter | Value | Notes |
|-----------|:------|:------|
| **Bioregion north extent** | 59.7 N (Yakutat, AK) | Northern boundary |
| **Bioregion south extent** | 40.4 N (Cape Mendocino, CA) | Southern boundary |
| **Bioregion west extent** | ~125 W (Pacific coast) | Coastal boundary |
| **Bioregion east extent** | ~120 W (East Cascades) | Interior boundary |
| **Latitude span** | 19.3 degrees | ~1,393 miles / 7,354,176 ft |
| **Longitude span** | ~5 degrees (varies with latitude) | ~247 miles at 47.6 N |

### Conversion Factors

At the projection origin (Seattle, 47.6 N):

| Axis | Real-World Distance | Minecraft Blocks | Formula |
|------|:--------------------|------------------:|:--------|
| **N-S (Z-axis)** | 1 degree latitude = 364,320 ft | 9,097 blocks | `blocks = degrees * 364320 / 40.05` |
| **E-W (X-axis)** | 1 degree longitude = 364,567 * cos(lat) ft | 6,133 blocks at 47.6 N | `blocks = degrees * 364567 * cos(lat_rad) / 40.05` |

**Note:** Longitude convergence — degrees of longitude shrink toward the poles. At 47.6 N, each degree of longitude is only 67.3% as wide as at the equator. The projection accounts for this via the cosine correction factor.

### Bioregion Extent in Blocks

| Dimension | Real Distance | Blocks | Chunks (16-block) | Regions (512-block) |
|-----------|:--------------|-------:|---------:|--------:|
| North-South (full bioregion) | ~1,393 miles | ~183,600 | ~11,475 | ~359 |
| East-West (at 47.6 N) | ~247 miles | ~32,580 | ~2,036 | ~64 |
| Vertical | 15,340 ft | 383 | 24 | N/A |

---

## Projection Accuracy and Limitations

### Sources of Error

| Error Source | Magnitude | Mitigation |
|:-------------|:----------|:-----------|
| Rounding to integer blocks | up to 20 ft vertical, 20 ft horizontal | Acceptable for ecological modeling |
| Flat Earth approximation (no curvature) | ~0.01% over 200 miles | Negligible at bioregion scale |
| Longitude convergence ignored if using fixed cos(47.6) | up to 8% at bioregion extremes | Use latitude-dependent cosine correction |
| Elevation datum inconsistency (NAVD88 vs MSL) | ~3 ft | Below block resolution |
| Geoid undulation (WGS84 ellipsoid vs true sea level) | up to 60 ft in PNW | ~1.5 blocks — significant; apply geoid correction for precision work |

### Recommended Practice

1. Always use the latitude-dependent cosine correction for horizontal projection
2. For vertical mapping, the 40.05 ft/block scale is authoritative
3. Sea level is the fixed datum: y=-41 is always 0 ft elevation
4. When in doubt, compute from the formula rather than interpolating the table
5. Sub-block features (intertidal zone, stream channels <40 ft wide) require annotation rather than direct block representation

---

## Quick Reference Card

```
FORMULA:     Y = round((elevation_ft / 40.05) - 41)
INVERSE:     elevation_ft = (Y + 41) * 40.05
SCALE:       1 block = 40.05 ft (all axes)
SEA LEVEL:   y = -41
SUMMIT:      y = 319  (14,410 ft, Mt. Rainier)
BEDROCK:     y = -64  (-930 ft, Puget Sound floor)
TIMBERLINE:  y = 109  (~6,000 ft)
ORIGIN:      Seattle (47.6062 N, 122.3321 W)
```

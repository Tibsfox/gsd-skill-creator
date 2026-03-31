# Liquefaction Hub Design — Site Selection and Specifications

## What the Hub Does

The central hub receives crude helium (50–70% purity) from distributed sources, purifies it to Grade-A (99.999%) or Research Grade (99.9999%), optionally liquefies it to -269°C, and distributes it to customers via cylinder, dewar, or ISO container.

## Facility Layout

```
┌─────────────────────────────────────────────────────┐
│                  CO-OP HELIUM HUB                    │
│                                                      │
│  RECEIVING          PROCESSING         STORAGE       │
│  ┌──────────┐      ┌──────────────┐   ┌──────────┐  │
│  │ Tube     │      │ Membrane     │   │ High-P   │  │
│  │ trailer  │─────►│ separation   │──►│ gas      │  │
│  │ bay      │      │ (50→80% He)  │   │ storage  │  │
│  │ (2 bays) │      └──────┬───────┘   └──────────┘  │
│  └──────────┘             │                          │
│                    ┌──────▼───────┐   ┌──────────┐  │
│                    │ PSA          │   │ Liquid   │  │
│  QUALITY LAB       │ purification │──►│ He      │  │
│  ┌──────────┐      │ (80→99.999%) │   │ storage  │  │
│  │ GC/MS    │      └──────┬───────┘   │ (dewar)  │  │
│  │ analysis │             │           └──────────┘  │
│  └──────────┘      ┌──────▼───────┐                 │
│                    │ Liquefier    │   DISPATCH       │
│  UTILITIES         │ (-269°C)    │   ┌──────────┐  │
│  ┌──────────┐      └──────┬───────┘   │ Cylinder │  │
│  │ Power    │             │           │ fill     │  │
│  │ Water    │             └──────────►│ station  │  │
│  │ Cooling  │                         │ Loading  │  │
│  └──────────┘                         └──────────┘  │
│                                                      │
│  Footprint: 5,000-15,000 sq ft indoor               │
│  Lot: 1-3 acres (truck access, trailer parking)     │
└─────────────────────────────────────────────────────┘
```

## Capital Costs

### Small Hub (100 L/day liquid output)

| Component | Cost |
|-----------|------|
| Membrane separation system | $200K–$400K |
| PSA purification (99.999%) | $300K–$1M |
| Liquefier (Chart/Cryomech) | $500K–$2M |
| High-pressure gas storage (tube bank) | $100K–$200K |
| Liquid helium storage dewar (5,000L) | $150K–$300K |
| Cylinder/dewar fill station | $200K–$500K |
| Quality lab (GC, mass spec, moisture) | $300K–$500K |
| Building/site improvements | $500K–$1.5M |
| Utilities (electrical, water, cooling) | $200K–$500K |
| Permitting and engineering | $200K–$400K |
| **Total** | **$2.7M–$7.3M** |

### Medium Hub (500 L/day liquid output)

Scale up processing equipment, add redundancy, larger storage:
- **Total: $6M–$15M**

## Site Requirements

| Requirement | Specification |
|-------------|--------------|
| **Power** | 200–500 kW connected load (liquefier is the primary draw) |
| **Water** | Cooling water for compressors, ~5–20 GPM (closed-loop cooling tower preferred) |
| **Zoning** | Industrial (I-1 or I-2 in most jurisdictions). Hazmat storage requires setbacks. |
| **Road access** | Must accommodate tractor-trailers (tube trailers in, cylinders/dewars out) |
| **Proximity to I-5** | Within 10 miles for efficient corridor distribution |
| **Port proximity** | Within 30 miles of Tacoma/Seattle ports for export containers |
| **Lot size** | 1–3 acres minimum (building + truck access + trailer staging) |
| **Building** | 5,000–15,000 sq ft, high-bay for equipment, concrete floor rated for heavy loads |

## Candidate Locations Along I-5

| Location | Advantages | Considerations |
|----------|-----------|---------------|
| **Smokey Point, WA** | Central Welding fill plant already there; industrial zoning; I-5 access | North of Seattle — adds distance to Portland customers |
| **Kent/Auburn, WA** | Heavy industrial zoning; close to Port of Tacoma; rail access (BNSF) | Higher land costs |
| **Tumwater/Olympia, WA** | Mid-corridor; industrial land available; state capital (grants) | Smaller labor pool |
| **Portland industrial district** | Close to Silicon Forest (Hillsboro ~25 mi); rail access; large industrial market | Oregon vs. WA regulatory differences |
| **Hillsboro/Beaverton, OR** | Directly adjacent to Intel D1X; maximum customer proximity | Land costs near Intel campus are premium |
| **Wilsonville, OR** | I-5 access; industrial zoning; between Portland and Salem | Good balance of access and cost |

## Power Requirements Detail

| Component | Power Draw | Running Hours | Monthly kWh | Monthly Cost ($0.07/kWh) |
|-----------|-----------|---------------|-------------|-------------------------|
| Membrane compressor | 30 kW | 24/7 | 21,600 | $1,512 |
| PSA system | 15 kW | 24/7 | 10,800 | $756 |
| Liquefier | 100–200 kW | 24/7 | 108,000 | $7,560 |
| Fill station compressor | 30 kW | 8 hrs/day | 7,200 | $504 |
| Cooling tower/chillers | 20 kW | 24/7 | 14,400 | $1,008 |
| Facility (lighting, HVAC, lab) | 15 kW | 24/7 | 10,800 | $756 |
| **Total** | **210–310 kW** | | **~173,000** | **~$12,100** |

At PNW rates, **electricity is ~$12K/month** for a small hub. At Southwest rates ($0.10/kWh), the same facility would cost ~$17K/month. The PNW advantage is real but not overwhelming at this scale — it matters more as the operation scales up.

## Timeline: Site Selection to First Output

| Phase | Duration | Activities |
|-------|----------|-----------|
| Site selection & lease | 2–4 months | Evaluate candidates, negotiate terms |
| Permitting (SEPA, building, hazmat) | 3–6 months | Environmental review, building permits, fire marshal |
| Equipment order | 0 months (order during permitting) | Chart PSA, membrane modules, liquefier |
| Building preparation | 2–4 months | Concrete, electrical, water, ventilation |
| Equipment delivery & install | 4–8 months (from order) | Equipment arrives, mechanical/electrical installation |
| Commissioning & testing | 1–2 months | System integration, purity verification, safety checks |
| **Total** | **12–24 months** | From decision to first liquid helium output |

## Regulatory Path

1. **SEPA review** (WA) or **land use review** (OR) for new industrial facility
2. **Building permit** from local jurisdiction
3. **Air quality permit** from Ecology (WA) or DEQ (OR) — emissions are minimal for helium processing
4. **Fire marshal review** for compressed/cryogenic gas storage
5. **DOT registration** if operating transport vehicles
6. **No federal permits required** for a processing-only facility (not extracting from the ground)

The regulatory path is straightforward for a gas processing facility. This is not a chemical plant or refinery — helium is inert, non-toxic, non-flammable. The primary safety concern is oxygen displacement in enclosed spaces (standard industrial gas hazard with well-established protocols).

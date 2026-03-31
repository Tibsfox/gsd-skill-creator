# PSA Equipment & Vendor Landscape — What to Buy, From Whom

## The Architecture

A small-scale helium extraction system typically combines two technologies in series: a **membrane front-end** for bulk separation (enriching 0.5–5% feed gas to 50–80% helium) followed by a **PSA polishing unit** achieving 99.999% (Grade 5N) purity. This two-stage approach is more practical and cheaper than either technology alone.

## Vendors by Category

### PSA Systems (Purification to 99.999%)

**Chart Industries** (dominant at small-to-mid scale)
- **TITAN Helium line:** Skid-mounted PSA. 50–5,000 SCFH feed gas capacity.
- Small units (50–500 SCFH): **$150K–$500K**
- Large skids (1,000–5,000 SCFH): **$1M–$3M**
- Technology: Carbon molecular sieve (CMS) and zeolite beds, 2-bed or 4-bed configuration
- Recovery rate: 85–95% depending on feed composition
- Lead time (early 2026): **24–36 weeks** (extended from pre-crisis 12–20 weeks)

**Guild Associates** (Dublin, OH)
- Small PSA systems for specialty gas purification including helium
- 10–500 SCFM capacity
- **$100K–$500K**
- Worth contacting directly — strong experience at this scale

**Parker Hannifin** (formerly Balston/domnick hunter)
- Small membrane and PSA modules for lab/pilot scale
- **$50K–$200K**
- Entry-level option for proving concepts

### Membrane Systems (Bulk Separation Front-End)

**Air Liquide Advanced Separations (MEDAL)**
- MEDAL He-Sep hollow-fiber polyimide membrane modules
- Standard 4-inch and 8-inch diameter housings
- Single 8-inch module: 50–200 SCFM feed gas (150–600 psig operating)
- Complete multi-stage skid: **$200K–$800K**
- Advantage: no moving parts in the membrane stage
- Limitation: rarely achieves 5N purity alone — best as front-end to PSA

**Evonik (SEPURAN Noble)**
- Polyimide hollow-fiber membranes specifically optimized for helium
- Licensed to system integrators
- Per-module: **$5K–$20K**
- Complete system (housing, piping, controls): **$100K–$400K**

**Generon** (Houston)
- Membrane systems for gas separation, helium-specific work
- **$150K–$600K** for packaged skids

### Helium Liquefiers

**Chart Industries (PHPK Engineering)**
- 15 L/hr to 250+ L/hr capacity
- Lab-scale: ~**$500K**
- Production-scale: **$2M–$5M+**

### Recovery/Recycling Systems (For Fab Sites)

**Cryomech** (Syracuse, NY) — leading manufacturer
- **LHeP-60:** 60 L/day reliquefier, 11 kW, **$250K–$350K**
- **LHeP-120:** 120 L/day, 19 kW, **$350K–$450K**
- **HRS (Helium Recovery System):** Complete gas bag + compressor + reliquefier, **$300K–$600K installed**

**Quantum Design**
- **ATL160:** 22 L/day liquefier, **$350K–$500K**
- **ATL260:** 40 L/day, **$450K–$600K**
- Laboratory-scale recovery, not extraction

### Large-Scale (Reference Only — Above Co-op Scale)

**Linde Engineering** — Helium Cold Box (cryogenic distillation + PSA hybrid). Minimum 50 MMSCFD feed gas. **$20M–$100M+**. Custom EPC projects.

## Recommended Architecture for a Co-op Hub

```
FEED GAS (0.5-5% He)
       │
       ▼
  MEMBRANE FRONT-END          $200K-$400K
  (Evonik SEPURAN or MEDAL)
  Enriches to 50-80% He
       │
       ▼
  PSA POLISHING UNIT           $300K-$1M
  (Chart TITAN or Guild)
  Purifies to 99.999%
       │
       ▼
  LIQUEFIER (optional)         $500K-$5M
  (Chart or Cryomech)
  Cools to -269°C for storage/transport
```

**Total system cost: $1M–$6M** depending on capacity and whether liquefaction is included.

## Power Consumption

| System | Scale | Power Draw |
|--------|-------|-----------|
| Membrane skid (100 SCFM) | Bulk separation | 15–30 kW (compressor) |
| PSA (500 SCFH product) | Polishing to 5N | 5–15 kW |
| Combined membrane+PSA (pilot) | 0.5–2% He feed, 100 SCFM | 30–60 kW total |
| Cryomech LHeP-60 reliquefier | 60 L/day | 11 kW |
| Chart small liquefier | Production scale | 50–200 kW |

At PNW electricity rates ($0.06–$0.08/kWh), a complete membrane+PSA+liquefier system running 24/7 costs roughly **$2,000–$12,000/month** in electricity.

## Maintenance Requirements

| Component | Interval | Cost |
|-----------|----------|------|
| PSA adsorbent beds | Replace every 5–8 years | $10K–$50K per change |
| PSA valves | Overhaul every 2–3 years | $5K–$15K |
| Membrane modules | Replace every 5–10 years | $5K–$20K per module |
| Pre-treatment filters | Quarterly | $500–$2K per change |
| Compressor oil/service | Every 2,000–4,000 hours | $1K–$3K |
| Compressor major overhaul | 20,000–40,000 hours | $15K–$30K |
| Cryogenic cold head | Annual service | $5K–$10K |
| Instruments | Annual calibration | $2K–$5K |

## Lead Times (Early 2026)

| System | Lead Time | Pre-Crisis Baseline |
|--------|-----------|-------------------|
| PSA skids (standard) | 16–30 weeks | 12–20 weeks |
| PSA skids (custom) | 30–52 weeks | 20–30 weeks |
| Membrane modules | 8–16 weeks | 6–12 weeks |
| Cryogenic liquefiers | 20–40 weeks | 16–24 weeks |
| Chart HPUs | 24–36 weeks | 16–24 weeks |

Lead times are extended across the board due to crisis-driven demand.

## First Call List

For someone starting today with $1M–$5M to deploy:

1. **Chart Industries** — TITAN Helium PSA, liquefiers (largest product range at this scale)
2. **Guild Associates** — PSA systems, strong small-scale expertise
3. **Evonik** — SEPURAN Noble membrane modules (for front-end)
4. **Cryomech** — recovery/recycling systems (if serving fab customers)
5. **Air Liquide MEDAL** — membrane separation (alternative to Evonik)

Contact Chart and Guild first. They have the most experience at the $1M–$5M scale that a co-op would operate at.

# Helium Recycling Technology — Deep Dive

## Why Recycling Is the Lowest-Risk Play

Of everything in this research series, closed-loop helium recycling has the clearest business case:
- **No extraction required** — works with existing helium supply
- **No transport logistics** — installed at the customer site
- **Proven technology** — commercially available from multiple vendors
- **Fastest payback** — under 12 months at crisis prices
- **Immediate action** — a fab operator reading this can start today

## System Architectures

### 1. Gas Bag + Compressor + Reliquefier (Most Common)

```
HELIUM USER (MRI, NMR, fab tool)
       │ boil-off gas
       ▼
  GAS COLLECTION BAG (flexible, 500-5000L)
       │
       ▼
  COMPRESSOR (oil-free, to 200-300 psig)
       │
       ▼
  PURIFIER (PSA or getter, removes N2/O2/H2O contaminants)
       │
       ▼
  RELIQUEFIER (Gifford-McMahon or pulse tube cryocooler)
       │ liquid helium
       ▼
  RETURN TO USER (dewar or direct)
```

**Recovery rate:** 90–95% of boil-off captured
**Vendors:** Cryomech, Quantum Design
**Best for:** MRI/NMR facilities, university labs, research institutions

### 2. In-Line Recovery at Fab Tools

```
FAB TOOL (etch, implant, lithography)
       │ helium exhaust
       ▼
  COLLECTION MANIFOLD (connects multiple tools)
       │
       ▼
  COMPRESSOR + BUFFER TANK
       │
       ▼
  MEMBRANE OR PSA PURIFIER
       │
       ▼
  RETURN TO TOOL (compressed gas, recycled)
```

**Recovery rate:** 80–90% (some tools vent at low pressure, harder to capture)
**Vendors:** Linde, Air Liquide (custom systems), Chart Industries
**Best for:** Semiconductor fabs with multiple helium-consuming tools

### 3. Hybrid: Recovery + Reliquefaction + External Top-Off

Combines on-site recovery with a small reliquefier and periodic external deliveries to replace the 5–10% that escapes. This is the most practical architecture for a large facility.

## Vendor Comparison

| Vendor | Product | Capacity | Power | Price |
|--------|---------|----------|-------|-------|
| **Cryomech** LHeP-60 | Reliquefier | 60 L/day | 11 kW | $250K–$350K |
| **Cryomech** LHeP-120 | Reliquefier | 120 L/day | 19 kW | $350K–$450K |
| **Cryomech** HRS | Complete recovery system | 60–120 L/day | 11–19 kW | $300K–$600K |
| **Quantum Design** ATL160 | Liquefier | 22 L/day | ~8 kW | $350K–$500K |
| **Quantum Design** ATL260 | Liquefier | 40 L/day | ~12 kW | $450K–$600K |
| **Oxford Instruments** | Integra closed-cycle | Varies | Varies | $200K–$400K |
| **Linde** custom fab recovery | Manifold + purifier | Site-specific | Site-specific | $500K–$2M |
| **Air Liquide** fab recovery | On-site purification | Site-specific | Site-specific | $500K–$2M |

## ROI Calculator

### University/Research Lab (Consuming 200 L/month liquid helium)

| Factor | Without Recycling | With Recycling (Cryomech LHeP-60) |
|--------|------------------|------------------------------------|
| Monthly helium purchase | 200 L × $75/L = $15,000 | 20 L × $75/L = $1,500 |
| Monthly electricity | — | 11 kW × 720 hrs × $0.07 = $554 |
| Monthly maintenance (amortized) | — | ~$500 |
| **Monthly cost** | **$15,000** | **$2,554** |
| **Monthly savings** | — | **$12,446** |
| System cost | — | $300,000 |
| **Payback** | — | **24 months** (normal prices) |

### At Crisis Prices ($100/L)

| Factor | Without Recycling | With Recycling |
|--------|------------------|----------------|
| Monthly helium purchase | 200 L × $100/L = $20,000 | 20 L × $100/L = $2,000 |
| Monthly operating cost | — | $1,054 |
| **Monthly savings** | — | **$16,946** |
| **Payback** | — | **<18 months** |

### Large Fab (Consuming 20,000 L/month)

| Factor | Without Recycling | With Recycling ($2M system) |
|--------|------------------|----------------------------|
| Monthly helium purchase | $1,500,000 (at $75/L) | $150,000 (10% top-off) |
| Monthly operating cost | — | ~$10,000 |
| **Monthly savings** | — | **$1,340,000** |
| **Payback** | — | **<2 months** |

At fab scale and crisis prices, the ROI is overwhelming. The system pays for itself in weeks.

## Installation Requirements

| Requirement | Detail |
|------------|--------|
| Floor space | 50–200 sq ft for reliquefier + compressor + gas bag |
| Power | 15–25 kW dedicated circuit (208V or 480V 3-phase) |
| Cooling water | 5–10 GPM for compressor (or air-cooled option) |
| Ventilation | Oxygen depletion monitoring required (helium displaces O2 in enclosed spaces) |
| Gas lines | Connection from user's boil-off vent to collection system |
| Vibration | Cryocoolers produce some vibration — isolate from sensitive instruments |

## Case Studies

### Published Deployments
- **TSMC Fab 18:** >80% helium recovery at some phases (company disclosure)
- **Samsung Pyeongtaek:** Recovery programs operational (company disclosure)
- **Multiple US research universities:** Cryomech systems installed at 100+ sites
- **CERN:** Large-scale helium recovery and reliquefaction (~120 tonnes inventory managed)

### Lessons From Deployments
1. **Collection is the bottleneck** — most helium loss happens before the recovery system, not in it. Gas bag sizing and manifold design are critical.
2. **Purity management** — contaminated helium (air ingress through leaky fittings) fouls cryocoolers. Maintaining gas purity upstream saves maintenance downstream.
3. **Staff training matters** — operators need to understand the system to avoid accidentally venting recovered gas.

## Why Every Major Helium Consumer Should Have This Already

The economics have been favorable for years — even at pre-crisis prices, most systems pay back in 2–3 years. At crisis prices, payback is measured in months or weeks.

The reason most don't have it: **the false sense of abundance.** When helium was cheap and seemingly unlimited, the capital expenditure seemed unnecessary. The March 2026 crisis has made the cost of NOT recycling viscerally obvious.

For a co-op offering recycling installation as a service (FoxSilicon model — install, operate, maintain), this is the fastest path to revenue and customer relationships.

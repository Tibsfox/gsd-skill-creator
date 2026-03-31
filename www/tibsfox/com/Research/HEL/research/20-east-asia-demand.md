# East Asian Semiconductor Helium Demand — Quantified

**Caveat:** Fab-level helium consumption is proprietary. Numbers below are estimates from industry analysts, gas supplier disclosures, and conference presentations. Ranges reflect genuine uncertainty.

## Per-Fab Consumption

A single leading-edge fab (3nm/2nm node) consumes approximately:
- **200,000–400,000 liters** liquid helium equivalent per year
- **~17,000–33,000 liters/month**
- **~50–100 Mcf/month** (thousand cubic feet of gas)

The wide range reflects fab capacity utilization, number of EUV layers, and logic vs. memory production.

## Use Breakdown

| Application | Share | Notes |
|-------------|-------|-------|
| **EUV lithography purging/cooling** | 35–45% | Biggest single consumer. EUV sources and optics require ultra-pure helium. |
| **Carrier gas (CVD/PVD/etch)** | 20–30% | Inert carrier in deposition and etch chambers |
| **Leak detection** | 10–15% | Helium mass spectrometry across vacuum systems |
| **Wafer/chuck cooling** | 10–15% | Backside helium cooling during etch and implant |
| **Other (metrology, purging)** | 5–10% | Gas lines, tool purging, analytical instruments |

**Key trend:** EUV's share grows with each node shrink. A 2nm fab with 20+ EUV layers uses substantially more helium than a 5nm fab with ~14 layers.

## East Asian Fab Count (2025–2026)

### Taiwan (~12–15 leading-edge fabs, 7nm and below)
- **TSMC Fab 18** (Tainan): Phases 1–6, 5nm/3nm production
- **TSMC Fab 20/22** (Hsinchu/Kaohsiung): 2nm ramping 2025–2026
- Several more under construction
- TSMC dominates: ~8–10 leading-edge fabs in Taiwan alone

### South Korea (~8–10 leading-edge fabs)
- **Samsung Pyeongtaek** campus: P1/P2/P3 operational, P4 under construction
- **Samsung Hwaseong**: Logic and foundry
- **SK Hynix Icheon and Cheongju**: DRAM (EUV DRAM counts as leading-edge)

### Japan (~2–3 leading-edge, growing)
- **Rapidus Chitose**: 2nm, targeting 2027 pilot
- **TSMC JASM Kumamoto**: Fab 1 operational (12/6nm), Fab 2 under construction
- **Kioxia/WD Yokkaichi and Kitakami**: NAND (significant helium consumer)

**Total: approximately 25–30 leading-edge fabs operating or under construction across the three countries.**

## Company-Level Estimates

### TSMC
- Leading-edge fabs (~8–10): account for ~70% of helium consumption despite ~40% of wafer starts
- **Estimated total: 2–4 million liters LHe equivalent/year**
- TSMC has disclosed helium recovery programs: **>80% recovery** at some Fab 18 phases

### Samsung
- Logic foundry + DRAM + NAND: vertically integrated production
- **Estimated total: 1.5–3 million liters LHe equivalent/year**
- Recovery programs at Pyeongtaek campus

### SK Hynix
- DRAM (DDR5, HBM3E), NAND
- EUV DRAM adoption increasing demand
- **Estimated total: 0.5–1.5 million liters LHe equivalent/year**

### Helium-Filled Hard Drives (Adjacent Market)
Seagate and Western Digital use helium-filled drives (reduced air resistance enables more platters per drive). Single drive: ~5 liters He. Global HDD helium consumption: ~10–15 million liters/year. ~60% manufactured in Thailand/China/Malaysia rather than the three target countries.

## Total Addressable Market

### Semiconductor Helium (Taiwan + South Korea + Japan)

| Metric | Value |
|--------|-------|
| Annual volume | ~6–10 million liters LHe equivalent |
| Value at contract prices ($25–35/L) | **~$150–350 million/year** |
| Value at crisis prices ($50–100/L) | **~$300–1,000 million/year** |

### Including HDD (Broader East Asia)

| Metric | Value |
|--------|-------|
| Additional HDD volume | ~10–15 million liters/year |
| Additional HDD value | ~$100–150 million/year |
| **Combined TAM** | **$250–500 million/year** (normal) / **$400–1,150 million/year** (crisis) |

### Context
Global helium consumption: ~6 Bcf/year (~170 million liquid liter equivalent). East Asian semiconductor + HDD represents roughly **10–15% of global demand** — and growing faster than the overall market.

## Demand Growth Projection

Industry consensus (Kornbluth Helium Consulting, Edison Investment Research, SEMI):

**Semiconductor-grade helium: 8–12% CAGR through 2030**, driven by:
- EUV layer counts increasing per node (N2 may have 25+ EUV layers)
- New fab construction across all three countries plus US/Europe
- HBM (High Bandwidth Memory) production scaling — each HBM stack uses EUV DRAM
- Quantum computing facility buildout

This outpaces overall helium market growth of ~3–4% CAGR, meaning semiconductors are taking an **increasing share** of global supply.

## What a PNW Corridor Could Capture

Realistic market capture for a new, small-scale supplier:

| Scenario | Annual Volume | Annual Revenue |
|----------|-------------|---------------|
| 0.5% of East Asian semiconductor TAM | 30–50K liters | $750K–$1.75M |
| 1% of TAM | 60–100K liters | $1.5M–$3.5M |
| 2% of TAM | 120–200K liters | $3M–$7M |

Even 0.5% of the market represents a viable business for a cooperative operating at the scale described in the hub design document. The goal is not to replace Air Liquide — it's to provide a reliable, redundant alternative source.

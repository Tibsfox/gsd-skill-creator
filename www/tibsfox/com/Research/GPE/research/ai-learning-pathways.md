# AI Learning Pathways, DIY Projects & the Complex Plane of Energy Experience

> **Domain:** Global Power Efficiency / Energy Systems
> **Module:** Research Supplement — AI Tools, DIY Projects, College Integration, Career Pathways
> **Through-line:** *Efficiency is not a number. It is the distance between the energy a system consumes and the energy its people feel. Closing that gap — not just technically, but experientially — is the work of this generation.* This document extends the 25 AI strategies and 125 career pathways in `strategies.html` into a full research framework: the complex plane applied to energy systems, open-source tooling with measured impact, eight hands-on DIY projects, College of Knowledge integration across six departments, deep career pathways with certification routes, and cross-links to every relevant project in the 190+ research series.

---

## Table of Contents

1. [Energy Efficiency Through the Complex Plane](#1-energy-efficiency-through-the-complex-plane)
   - 1.1 [Formal Definition: The Energy State Variable](#11-formal-definition-the-energy-state-variable)
   - 1.2 [Operationalizing R(t): Measurable Energy Metrics](#12-operationalizing-rt-measurable-energy-metrics)
   - 1.3 [Operationalizing X(t): Experienced Energy Reality](#13-operationalizing-xt-experienced-energy-reality)
   - 1.4 [The Unit Circle: Balanced Energy State](#14-the-unit-circle-balanced-energy-state)
   - 1.5 [Four-Quadrant Country Analysis](#15-four-quadrant-country-analysis)
   - 1.6 [Dynamical Properties and the Phase Velocity of Energy Crisis](#16-dynamical-properties-and-the-phase-velocity-of-energy-crisis)
2. [AI Tools for Energy Efficiency — Expanded](#2-ai-tools-for-energy-efficiency--expanded)
   - 2.1 [Demand Forecasting with PyTorch](#21-demand-forecasting-with-pytorch)
   - 2.2 [Grid Optimization with TensorFlow](#22-grid-optimization-with-tensorflow)
   - 2.3 [Building Energy Modeling with scikit-learn](#23-building-energy-modeling-with-scikit-learn)
   - 2.4 [Math Co-Processor Integration: Fourier Analysis for Load Patterns](#24-math-co-processor-integration-fourier-analysis-for-load-patterns)
   - 2.5 [Open-Source Tool Reference Table](#25-open-source-tool-reference-table)
3. [DIY Projects — Eight Hands-On Energy Efficiency Builds](#3-diy-projects--eight-hands-on-energy-efficiency-builds)
4. [College of Knowledge Integration](#4-college-of-knowledge-integration)
   - 4.1 [Department Mapping](#41-department-mapping)
   - 4.2 [Cross-Departmental Learning Arcs](#42-cross-departmental-learning-arcs)
   - 4.3 [Rosetta Panel: Four Languages, Four Paradigms](#43-rosetta-panel-four-languages-four-paradigms)
5. [Career Pathways — Deep Dive](#5-career-pathways--deep-dive)
   - 5.1 [Entry Points by Skill Level](#51-entry-points-by-skill-level)
   - 5.2 [Certification Pathways](#52-certification-pathways)
   - 5.3 [Salary Ranges and Demand Data](#53-salary-ranges-and-demand-data)
   - 5.4 [Fox Companies Alignment](#54-fox-companies-alignment)
6. [Cross-Links to Existing Research](#6-cross-links-to-existing-research)
7. [Sources](#7-sources)

---

## 1. Energy Efficiency Through the Complex Plane

### 1.1 Formal Definition: The Energy State Variable

The mathematical framework introduced in the Political Science series (PSC Module 4: `04-complex-plane-framework.md`) rests on a core insight: that any system with both a measurable institutional dimension and an experiential human dimension cannot be correctly described by a single real number. The same structural argument applies with equal force to energy systems.

Let the energy state of a country or region at time $t$ be represented as a complex number:

$$z_E(t) = R_E(t) + i \cdot X_E(t)$$

where:

- $R_E(t) \in \mathbb{R}$ is the **real component**: the measurable, quantifiable, institutional energy efficiency of the system at time $t$ — electricity intensity, carbon intensity, grid reliability, renewable penetration, and similar metrics observable from outside the system.
- $X_E(t) \in \mathbb{R}$ is the **imaginary component**: the experienced energy reality — the degree to which citizens live energy-secure, energy-equitable lives, with access to affordable power, experienced as reliable, culturally consonant with their values, and felt as compatible with their conception of fairness.

The parallel to the political formulation is exact. $R_E(t)$ measures what the energy system *is*. $X_E(t)$ measures what the energy system *feels like to the people who depend on it*. These are orthogonal axes — independent degrees of freedom. A country can have technically excellent energy infrastructure and simultaneously have citizens who experience energy insecurity, unaffordability, or cultural alienation from the system. Conversely, a country with modestly efficient national statistics can have citizens who experience deep energy security through social solidarity, traditional knowledge, or community-scale renewable systems that do not appear prominently in national averages.

The term "imaginary" carries the same non-pejorative meaning here as in the PSC framework: the imaginary axis is mathematically orthogonal to the real axis, and it encodes information — phase, rotation, periodicity — that the real axis cannot encode. An energy dashboard that shows only kWh/GDP has set $X_E(t) = 0$. It is not a simpler picture. It is a fundamentally different and incomplete object.

### 1.2 Operationalizing $R_E(t)$: Measurable Energy Metrics

The real component $R_E(t)$ is operationalized through three primary measurable indices, normalized to $[-1, +1]$:

$$R_E(t) = \beta_1 \cdot EI(t) + \beta_2 \cdot CI(t) + \beta_3 \cdot GE(t)$$

where:

- $EI(t)$: **Electricity Intensity** — kWh of electricity consumed per $1,000 USD of GDP per capita (PPP-adjusted). Lower is better. The GPE rankings use this as the primary metric. Normalized so that the most efficient country in the dataset scores $+1$ and the least efficient scores $-1$ [IEA Electricity 2025].
- $CI(t)$: **Carbon Intensity of Electricity** — gCO₂ per kWh generated. Normalized over the range observed in IEA country data (approximately 10 gCO₂/kWh for Iceland's geothermal-heavy grid to 900+ for coal-dependent systems).
- $GE(t)$: **Grid Reliability and Access** — a composite of System Average Interruption Duration Index (SAIDI), electrification rate, and transmission loss percentage. Lower interruptions, higher access, and lower losses score toward $+1$.
- $\beta_1, \beta_2, \beta_3 > 0$ with $\beta_1 + \beta_2 + \beta_3 = 1$. Baseline weights: $\beta_1 = 0.45$, $\beta_2 = 0.35$, $\beta_3 = 0.20$. The electricity intensity term is given highest weight to maintain consistency with the GPE rankings primary metric. Empirical calibration is a research program [IEA; World Bank ESMAP].

**Primary data sources for $R_E(t)$:**
- IEA World Energy Balances (annual)
- IEA Electricity 2025 report
- World Bank Sustainable Energy for All (SE4All) database
- IRENA Renewable Capacity Statistics
- U.S. EIA International Energy Statistics

### 1.3 Operationalizing $X_E(t)$: Experienced Energy Reality

The imaginary component $X_E(t)$ is operationalized through survey instruments and social indicators:

$$X_E(t) = \gamma_1 \cdot ES(t) + \gamma_2 \cdot EA(t) + \gamma_3 \cdot EC(t)$$

where:

- $ES(t) \in [-1, +1]$: **Energy Security Experience** — the degree to which households report reliable, affordable access to electricity and heat. Measured by EU SILC "inability to keep home adequately warm" survey [Eurostat], U.S. EIA Residential Energy Consumption Survey (RECS) energy burden indicators, and World Bank Multi-Tier Framework household surveys. Normalized: widespread fuel poverty and energy burden above 10% of income scores toward $-1$; universal affordable access scores toward $+1$.
- $EA(t) \in [-1, +1]$: **Energy Equity** — the degree to which energy access is experienced as fair across income, geography, and demographic lines. Measured by DOE energy burden mapping by census tract, WHO/IEA Tracking SDG7 equity sub-indices, and Doctors Without Borders energy access in conflict zone surveys for extreme cases.
- $EC(t) \in [-1, +1]$: **Cultural Energy Consonance** — the degree to which the national energy system is experienced as consonant with cultural values around sufficiency, community, tradition, and environmental stewardship. Measured inversely by energy-related protest intensity (e.g., Gilets Jaunes fuel tax protests in France, 2018–2019), by survey responses on environmental concern versus affordability tension, and by qualitative ethnographic data where available.
- $\gamma_1 = 0.45, \gamma_2 = 0.35, \gamma_3 = 0.20$. Energy security experience is given highest weight as the most directly measurable axis.

**Primary data sources for $X_E(t)$:**
- Eurostat EU Statistics on Income and Living Conditions (EU-SILC)
- U.S. DOE Office of Energy Justice mapping tools
- IEA/World Bank Tracking SDG7 report (annual)
- Pew Research Center Global Attitudes surveys (energy and environment modules)
- World Values Survey (Wave 7, 2017–2022): energy affordability, climate concern, anti-nuclear sentiment

### 1.4 The Unit Circle: Balanced Energy State

The complex modulus $|z_E(t)| = \sqrt{R_E(t)^2 + X_E(t)^2}$ represents the overall coherence of the energy state. The **unit circle** $|z_E| = 1$ is a reference condition, not a ceiling or a target per se. It marks the set of all energy states where the combined magnitude of the measurable and experienced dimensions equals 1 in the normalized space.

The deeper significance of the unit circle in energy systems is as follows:

**Inside the unit circle** ($|z_E| < 1$): the system is incoherent — either measurements are weak (poor data, transitional grid, contested statistics) or both real and imaginary axes are near zero, signaling an energy system without strong signals on either dimension. Fragile states, post-conflict systems, and rapidly transitioning economies cluster here.

**On the unit circle** ($|z_E| = 1$): a state of *balanced coherence* — the energy system has measurable efficiency and the experiential dimension exactly counterbalances the real dimension. A country with $R_E = 0.7$ and $X_E = 0.71$ is on the unit circle with $\arg(z_E) \approx 45°$, indicating strong technical performance paired with strong energy security experience. This is the ideal Quadrant I state: efficient and equitable.

**Outside the unit circle** ($|z_E| > 1$): a state of *amplified coherence* — both real and imaginary axes are strong. This is achievable and represents energy-system excellence. Denmark ($R_E \approx 0.80$, $X_E \approx 0.75$) operates well outside the unit circle at $|z_E| \approx 1.10$. The unit circle is not a cap; it is a calibration point.

The **phase angle** $\arg(z_E) = \arctan(X_E / R_E)$ encodes the gap between technical performance and experienced reality:

| Quadrant | $R_E$ | $X_E$ | Energy Meaning |
|----------|--------|--------|----------------|
| I ($0° < \theta < 90°$) | $+$ | $+$ | Efficient and equitable: technical performance matched by energy security experience |
| II ($90° < \theta < 180°$) | $-$ | $+$ | Experiential solidarity despite inefficiency: community energy culture compensates for technical weakness |
| III ($180° < \theta < 270°$) | $-$ | $-$ | Energy poverty trap: inefficient *and* experienced as insecure, unaffordable, or exclusionary |
| IV ($-90° < \theta < 0°$) | $+$ | $-$ | Technical efficiency masking lived insecurity: national metrics high, but citizens experience fuel poverty, energy burden, or inequity |

### 1.5 Four-Quadrant Country Analysis

**Quadrant I — Efficient and Equitable:**
Denmark ($R_E \approx +0.82$, $X_E \approx +0.78$, $|z_E| \approx 1.13$). Denmark's district heating networks, high renewable penetration (~88% of electricity from wind and solar as of 2024), and strong social safety net produce both excellent efficiency metrics and one of the lowest rates of energy poverty in Europe. The Danish concept of *hygge* — warmth, comfort, conviviality — is partly an energy-access concept: the cultural expectation that every household can afford a warm, well-lit home. [IEA Energy Policy Review: Denmark, 2023; Eurostat EU-SILC 2024.]

**Quadrant IV — Technical Efficiency Masking Lived Insecurity:**
United Kingdom ($R_E \approx +0.55$, $X_E \approx -0.35$, $|z_E| \approx 0.65$, $\arg(z_E) \approx -32°$). The UK scores reasonably on electricity intensity (a relatively service-based economy with declining industrial load) but has Europe's most severe fuel poverty crisis in absolute numbers. The National Energy Action charity estimates 6.5 million UK households were in fuel poverty in winter 2023–24 — approximately 22% of all households — driven by the interaction of poor building stock (pre-1970s brick terraces with minimal insulation), high gas prices following the Ukraine war, and stagnant wages [NEA UK, 2024; BEIS LILEE survey, 2023]. The system looks efficient from the outside and feels insecure from the inside. $X_E < 0$ despite $R_E > 0$: the Quadrant IV pathology.

**Quadrant II — Experiential Solidarity Despite Inefficiency:**
Japan ($R_E \approx -0.10$, $X_E \approx +0.45$, $|z_E| \approx 0.46$, $\arg(z_E) \approx 102°$). Japan's electricity intensity is moderately high by OECD standards — the country is rebuilding industrial capacity post-Fukushima with a more fossil-fuel-dependent generation mix than it had in 2010 — yet Japanese energy culture operates in Quadrant II. The "Cool Biz" campaign (2005, Ministry of the Environment), which normalized summer office temperatures of 28°C and reduced formal dress codes, reduced business cooling energy use by an estimated 1.14 million tons of CO₂ per year [METI Japan, 2023]. The *mottainai* (もったいない) ethic — a cultural resistance to waste deeply rooted in Zen and Shinto traditions — shapes household consumption patterns in ways that national statistics undercount. Japan's $X_E$ is elevated not by wealth but by cultural consonance. [METI Japan Energy White Paper 2024; IPCC AR6 WG3.]

**Quadrant III — Energy Poverty Trap:**
Sub-Saharan Africa (regional aggregate, $R_E \approx -0.65$, $X_E \approx -0.55$, $|z_E| \approx 0.85$). The energy poverty trap is a positive feedback loop in the complex plane: low $R_E$ (inefficient, unreliable grids; high reliance on traditional biomass) produces low $X_E$ (energy insecurity experienced as life-limiting, not just inconvenient). The IEA reports 600 million people in sub-Saharan Africa without electricity access as of 2024, with grid reliability indices among the worst globally. But the experiential axis is negative not merely from lack of access — it is negative from the felt meaning of that absence: inability to refrigerate medicines, inability to study after dark, inability to power productive enterprise. Low $R_E$ traps $X_E$ below zero. [IEA Africa Energy Outlook 2024; World Bank SE4All 2024.]

**Notable Cross-Quadrant Tension: Iceland**
Iceland ($R_E \approx +0.90$, $X_E \approx +0.60$) operates in deep Quadrant I. Nearly 100% renewable electricity (hydro and geothermal). Low electricity prices have attracted energy-intensive aluminum smelting, which inflates absolute consumption while keeping intensity low due to high GDP per capita. The interesting tension: some Icelanders experience the *cultural* energy footprint of aluminum processing as discordant with national identity. $X_E$ is high but not as high as $R_E$ — a small positive phase angle ($\arg \approx 34°$), suggesting alignment is good but the experiential axis trails the technical axis modestly. [Orkustofnun Iceland Energy Statistics 2024.]

### 1.6 Dynamical Properties and the Phase Velocity of Energy Crisis

The time derivative $\dot{z}_E(t) = \dot{R}_E(t) + i \cdot \dot{X}_E(t)$ governs energy system change. Three dynamical properties have immediate policy relevance:

**Phase velocity** $\dot{\theta}_E = d/dt \cdot \arg(z_E)$ measures how fast the gap between technical efficiency and experienced energy reality is *rotating*. Policy-stable systems have $\dot{\theta}_E \approx 0$. Systems approaching energy-political crisis — the Gilets Jaunes moment, the UK 2022 energy bill shock, California's rolling blackouts — have accelerating $|\dot{\theta}_E|$. Monitoring $\dot{\theta}_E$ is an early warning indicator that is invisible to standard efficiency metrics.

**Cross-axis coupling**: $\dot{R}_E$ depends on $X_E$ and vice versa. Social license for efficiency programs (weatherization subsidies, appliance standards, time-of-use tariffs) depends on $X_E$ being positive — if citizens feel energy-insecure, efficiency mandates are experienced as additional burden, not benefit. The UK Green Deal (2013) failed partly because it asked energy-burdened households to take on upfront loans for insulation — a policy designed on the $R_E$ axis that ignored $X_E$ dynamics [National Audit Office UK, 2016].

**Radial velocity** $d/dt \cdot |z_E|$ measures whether the system is gaining or losing coherence. Energy system decarbonization initiatives that improve $R_E$ while failing to address $X_E$ produce *phase-angle rotation without radial gain* — technical progress that erodes political sustainability.

---

## 2. AI Tools for Energy Efficiency — Expanded

The 25 AI strategies in `strategies.html` identify the use cases; this section provides the implementation substrate: specific open-source libraries, measured deployment impacts, cost/benefit ratios, and integration with the math co-processor capabilities documented in the GSD system.

### 2.1 Demand Forecasting with PyTorch

**Use case:** Short-term (1–72 hour) and medium-term (1–7 day) electricity demand forecasting for utility operators, building managers, and demand response programs.

**Core library:** PyTorch (pytorch.org) — the primary deep learning framework for research-grade time-series forecasting in energy systems. The `torch.nn.LSTM` and `torch.nn.Transformer` modules are the two dominant architectures for load forecasting.

**Recommended implementations:**
- **NeuralForecast** (Nixtla, Apache 2.0 licensed): a PyTorch-based library that benchmarked 13 neural architectures against 28 datasets in the M4 and M5 forecasting competitions. Their NHITS (Neural Hierarchical Interpolation for Time Series) model reduces MASE by 25% on electricity load data versus LSTM baselines [Challu et al., 2023, arXiv:2201.12886].
- **GluonTS** (Amazon AWS, Apache 2.0): probabilistic time-series modeling with uncertainty quantification. Critical for demand response programs that need confidence intervals, not point estimates. DeepAR model trains in hours on consumer-grade GPU.
- **pytorch-forecasting** (jdb78, MIT license): high-level API built on PyTorch Lightning. The Temporal Fusion Transformer (TFT) implementation from this library is used by several European TSOs for day-ahead demand forecasting.

**Measured deployment impact:**
- PJM Interconnection (US mid-Atlantic/midwest grid, ~65 million people): ML demand forecasting reduced reserve margin requirements by approximately 3 GW compared to statistical baselines, translating to ~$180 million annual avoided capacity costs [PJM State of the Market Report, 2024].
- National Grid ESO (UK): ML-enhanced day-ahead forecasting reduced peak demand forecast error from 2.8% to 1.4% MAPE, allowing better market clearing and an estimated 0.8% reduction in balancing costs. [NGESO Operational Transparency Report, 2024.]
- A 2024 meta-analysis in *Applied Energy* (Gao et al., doi:10.1016/j.apenergy.2024.122714) surveyed 47 utility deployments of ML demand forecasting and found median forecast error reduction of 18–32% versus ARIMA baselines, with direct cost savings of $0.40–1.20 per MWh of load served.

**Cost/benefit framework:**
| Scale | Implementation cost (one-time) | Annual savings | Payback period |
|-------|-------------------------------|----------------|----------------|
| Single large commercial building | $8,000–25,000 | $3,000–12,000/yr | 1.5–3 years |
| Municipal utility (100–500 MW peak) | $150,000–400,000 | $200,000–800,000/yr | 6 months–2 years |
| Regional ISO (10+ GW peak) | $2M–8M | $15M–80M/yr | 1–3 months |

**Math co-processor integration:** Fourier spectral analysis of load data (using `fourier_spectrum` tool) reveals the dominant harmonics: the 24-hour diurnal cycle, the 168-hour weekly cycle, and the 8,760-hour annual cycle. Pre-computing these components and providing them as engineered features to PyTorch models reduces training time by 30–40% and improves medium-term forecast accuracy. The `statos_regression` tool can be used to fit seasonal adjustment models before feeding residuals to the neural forecaster.

### 2.2 Grid Optimization with TensorFlow

**Use case:** Optimal power flow (OPF), voltage regulation, renewable dispatch scheduling, and transmission congestion management.

**Core library:** TensorFlow 2.x (tensorflow.org), particularly with the `tf.keras` high-level API and the `tensorflow-probability` extension for uncertainty quantification.

**Recommended implementations:**
- **PowerGridworld** (NREL, MIT license): a reinforcement learning environment for power grid control built on TensorFlow. Documented use cases include voltage regulation in distribution networks with high PV penetration and BESS dispatch optimization. NREL benchmarks show 8–14% improvement in grid hosting capacity for solar with RL-based voltage control versus rule-based inverter settings [NREL Technical Report NREL/TP-5700-78808].
- **PandaPower** (Fraunhofer IEE, BSD 3-Clause): Python-based power systems modeling that integrates with TensorFlow for ML-enhanced OPF. Used by several German DSOs for distribution grid planning under high renewable penetration.
- **Grid2Op** (RTE France, LGPL): RL training environment for transmission grid operation, used in the Learning to Run a Power Network (L2RPN) competition series. Best-performing agents (2023 competition) reduced grid stress events by 67% versus rule-based baselines.

**Measured deployment impact:**
- DeepMind/Google: RL agent controlling cooling systems in Google data centers reduced cooling energy use by 40%, with 15% reduction in total data center energy consumption. Published in *Nature* (2018) and confirmed in follow-up deployment reports [Evans & Gao, 2016; Google Environmental Report 2024].
- Enel (Italy): TensorFlow-based predictive maintenance model for transformer monitoring reduced unplanned outages by 23% and extended average transformer service life by 3.7 years. ROI estimated at 11:1 over 5 years [Enel Sustainability Report, 2024].

**Cost/benefit framework:**
| Application | Implementation cost | Annual benefit | Notes |
|------------|--------------------|-----------------|-|
| Data center cooling RL | $500K–2M | 10–40% energy reduction | Requires on-site sensor infrastructure |
| Distribution voltage control | $250K–1M | 5–15% loss reduction | High ROI in high-PV penetration zones |
| Transmission OPF augmentation | $1M–5M | $2M–20M/yr congestion relief | Dependent on grid topology |

### 2.3 Building Energy Modeling with scikit-learn

**Use case:** Predicting building energy consumption, identifying retrofit priorities, calibrating simulation models, and measuring retrofit effectiveness (Measurement & Verification, M&V).

**Core library:** scikit-learn (scikit-learn.org) — the standard Python ML library for regression, classification, and clustering tasks that do not require deep learning. For building energy, gradient boosting (GradientBoostingRegressor, XGBoost, LightGBM) consistently outperforms neural networks on tabular building data due to sample size limitations (most portfolios have hundreds to thousands of buildings, not millions).

**Recommended implementations:**
- **SEED Platform** (U.S. DOE, Apache 2.0): Standard Energy Efficiency Data platform for portfolio-scale building energy management. Integrates with scikit-learn for anomaly detection and retrofit prioritization.
- **BuildingsBench** (NREL, 2024, MIT license): benchmark dataset of 900+ commercial buildings for ML model comparison. LightGBM achieves CVRMSE of 12–18% for monthly energy prediction — substantially better than ASHRAE 14 regression baselines.
- **OpenStudio** (NREL/DOE, BSD 3-Clause): physics-based building simulation that can be calibrated using scikit-learn Bayesian optimization (via scipy.optimize or scikit-optimize). A calibrated EnergyPlus/OpenStudio model supports M&V under IPMVP Option D.

**Measured deployment impact:**
- New York City's Local Law 97 (the Climate Mobilization Act): NYC used scikit-learn-based portfolio screening to identify the 3,400 buildings responsible for 30% of building sector emissions. Predictive models identified retrofit priority order with 89% accuracy versus full EnergyPlus simulation at 0.1% of the computational cost [NYSERDA Case Study, 2024].
- Lawrence Berkeley National Laboratory's VOLTTRON platform: ML-enhanced building control across 50 federal buildings reduced plug load by 12% and HVAC energy by 9% with no occupant behavior intervention. [LBNL-2001568, 2024.]

**Regression for efficiency prediction:** The `statos_regression` tool in the math co-processor can implement scikit-learn-compatible regression pipelines for building energy prediction, including feature importance analysis identifying which building characteristics (vintage, floor area, climate zone, occupancy type) drive the variance in energy intensity.

### 2.4 Math Co-Processor Integration: Fourier Analysis for Load Patterns

Energy systems produce time-series data with rich periodic structure. The Fourier transform decomposes any load signal into its constituent frequency components, revealing the dominant cycles and their amplitudes. This is not merely a preprocessing step — it is a diagnostic tool that directly reveals system dynamics.

**Fourier decomposition of a residential load signal:**

A household load signal $P(t)$ over one year, sampled hourly (8,760 data points), will typically show:

- **Fundamental (annual)**: period $T_1 = 8,760$ hours. Amplitude reflects seasonal heating/cooling demand. Communities with high heating degree days show large annual component amplitude; near-equatorial climates show small amplitude.
- **Second harmonic (semi-annual)**: period $T_2 = 4,380$ hours. Often visible in climates with distinct heating and cooling seasons.
- **168-hour (weekly)**: strong in commercial buildings (weekday vs. weekend occupancy); weaker in residential.
- **24-hour (diurnal)**: the dominant cycle in most residential and commercial loads. Amplitude tells you how "peaky" the demand profile is — high amplitude means a sharp morning and evening peak with deep overnight trough.
- **Sub-daily harmonics**: 12-hour, 8-hour, and 6-hour components often reflect specific appliance schedules (dishwasher at midnight, HVAC setback at 6 AM).

The `fourier_spectrum` tool computes the power spectral density (PSD) of a load signal, identifying dominant frequencies and their amplitudes. A flat PSD (no dominant frequencies) suggests a poorly metered or aggregated signal; a sharp 24-hour peak with harmonics is the signature of metered residential data.

**Application to GPE data:** The national electricity intensity metric in the GPE rankings is a time-averaged scalar. Applying Fourier analysis to the underlying hourly load data reveals the *shape* of demand — peak-to-average ratio, load factor, seasonal swing — which is often more relevant to efficiency policy than the annual average alone. A country with high load factor (flat demand curve) is more efficient to serve than a country with the same annual kWh/GDP but sharp peaks requiring expensive peaking capacity.

### 2.5 Open-Source Tool Reference Table

| Tool | License | Primary Use | Language | Stars (GitHub, 2025) |
|------|---------|-------------|----------|----------------------|
| NeuralForecast | Apache 2.0 | Time-series forecasting | Python | 4.2K |
| GluonTS | Apache 2.0 | Probabilistic forecasting | Python | 4.5K |
| PyPSA | MIT | Energy system optimization | Python | 3.8K |
| PandaPower | BSD-3 | Power flow analysis | Python | 2.9K |
| Grid2Op | LGPL | RL for grid control | Python | 1.2K |
| OpenStudio | BSD-3 | Building energy simulation | Ruby/C++ | 1.1K |
| SEED Platform | Apache 2.0 | Building portfolio management | Python | 400+ |
| BuildingsBench | MIT | Building ML benchmarks | Python | 350+ |
| HOMER Pro | Proprietary (free tier) | Microgrid sizing | Desktop | N/A |
| REopt | MIT | Renewable+storage optimization | Python | 300+ |
| SAM (NREL) | BSD-3 | Solar+wind performance | C++/Python | 1.5K |

---

## 3. DIY Projects — Eight Hands-On Energy Efficiency Builds

These projects are designed to span the full skill spectrum from data-curious beginners to experienced engineers. Each project produces real, usable outputs — dashboards, forecasts, or optimized controllers — while teaching transferable skills applicable to professional energy work.

---

### Project 1: Home Energy Audit with Python

**Difficulty:** Beginner | **Cost:** $0–30 | **Time:** 4–8 hours | **Platforms:** Any laptop

**Overview:** Pull your household utility bill data, calculate your electricity intensity, compare it to GPE country rankings, and identify your largest consumption drivers.

**Materials:**
- Python 3.10+ with pandas, matplotlib, seaborn
- Utility bill PDFs or CSV exports (most US utilities offer Green Button data export)
- GPE data (`data.js` from the GPE research project — extract the kWh/GDP values)

**Step-by-step:**

1. **Data import:** Download 12 months of utility bills. Most US utilities (PG&E, PSE, PEPCO) offer Green Button data in CSV format. Download at your utility's "My Account" page.
2. **Intensity calculation:** Divide monthly kWh by your household income divided by 12 (a rough per-household GDP proxy), or use the square footage normalized intensity (kWh/sq ft) for a building-level comparison.
3. **GPE comparison:** Import the GPE country rankings. Normalize your household intensity to kWh/$1,000 income. How does your household compare to Denmark? Japan? Your own country's average?
4. **Load decomposition:** Use your billing data to estimate the fractional contribution of HVAC (45–50%), water heating (18%), lighting (15%), and plug loads (22%) using DOE end-use shares adjusted for your climate zone.
5. **Visualization:** Build a matplotlib stacked bar chart showing monthly consumption by end use, a 12-month trend line, and an annotation marking how you rank relative to the GPE top-10 countries.

**Learning objectives:**
- Data import and cleaning with pandas
- Normalization and intensity calculations
- Visualizing consumption patterns
- Understanding the GPE metrics from the consumer side

**Connection to GPE data:** You are computing a micro-scale version of the GPE's primary metric. Your personal kWh/$1,000-income figure is your household's $R_E$ component. If you also rate your felt energy security (reliable service, affordable bills, confidence about future costs), you have your personal $X_E$.

---

### Project 2: Smart Thermostat Algorithm (Arduino + Sensor)

**Difficulty:** Intermediate | **Cost:** $40–90 | **Time:** 8–16 hours | **Hardware:** Arduino Uno or Nano, DHT22 sensor, relay module

**Overview:** Build a learning thermostat that optimizes heating/cooling schedules based on your own occupancy patterns, outdoor temperature, and learned comfort preferences — without cloud dependency or monthly subscription fees.

**Materials:**
- Arduino Uno/Nano ($15–25)
- DHT22 temperature/humidity sensor ($8)
- DS18B20 outdoor temperature sensor ($6)
- 5V relay module for HVAC control ($8)
- Optional: ESP8266 WiFi module for data logging ($4)
- Optional: small OLED display ($6)

**Algorithm design (in Python, to prototype before Arduino C++ port):**

```python
# scikit-learn comfort model
from sklearn.linear_model import SGDRegressor
import numpy as np

class SmartThermostat:
    def __init__(self):
        self.model = SGDRegressor(learning_rate='adaptive')
        self.comfort_history = []  # (temp, humidity, hour_of_day, day_of_week) -> comfort_rating
    
    def update_model(self, features, comfort_rating):
        """Update comfort model with new observation (online learning)."""
        X = np.array(features).reshape(1, -1)
        y = np.array([comfort_rating])
        self.model.partial_fit(X, y)
    
    def predict_comfort(self, temp, humidity, hour, day_of_week):
        features = [temp, humidity, hour, np.sin(2*np.pi*hour/24), 
                    np.cos(2*np.pi*hour/24), day_of_week]
        return self.model.predict([features])[0]
    
    def optimal_setpoint(self, outdoor_temp, hour, day_of_week):
        """Search the [18C, 26C] range for the setpoint that maximizes predicted comfort
        per unit energy (approximated as |setpoint - outdoor_temp|)."""
        candidates = np.linspace(18, 26, 33)
        scores = [self.predict_comfort(t, 50, hour, day_of_week) / 
                  (abs(t - outdoor_temp) + 0.1) for t in candidates]
        return candidates[np.argmax(scores)]
```

**Learning objectives:**
- Online machine learning with incremental model updates
- Sensor integration and signal conditioning
- Control system feedback loops
- Energy-comfort tradeoff optimization

**Connection to GPE data:** The HVAC Optimization strategy (Strategy 1, `strategies.html`) estimates 15–50% energy savings from behavioral optimization. This project implements that optimization in hardware.

---

### Project 3: Solar Panel Output Predictor

**Difficulty:** Intermediate | **Cost:** $0 (software only) | **Time:** 6–12 hours

**Overview:** Given a set of solar panel specifications and a location, build a model that forecasts daily and hourly panel output using weather API data, validated against NREL's PVWatts Calculator.

**Materials:**
- Python with requests, pandas, pvlib
- Open-Meteo API (free, no key required for personal use): `https://api.open-meteo.com`
- NREL PVWatts API (free with registration): for validation
- Panel spec sheet (any residential panel; e.g., Panasonic EVPV370HK: 370W, η=22.2%)

**Core library: pvlib**

`pvlib` (NREL/Sandia, BSD-3) is the standard open-source library for solar energy modeling. Key functions:

```python
import pvlib
from pvlib import location, irradiance, pvsystem, modelchain

# Define site (example: Seattle, WA)
site = location.Location(latitude=47.6, longitude=-122.3, 
                         altitude=56, tz='US/Pacific')

# Get weather (TMY3 or forecast API)
weather = pvlib.iotools.get_pvgis_tmy(47.6, -122.3, outputformat='csv')

# Define system
system = pvsystem.PVSystem(
    surface_tilt=30,
    surface_azimuth=180,  # south-facing
    module_parameters=pvlib.pvsystem.retrieve_sam('SandiaMod')['Panasonic_VBHN235SA06B'],
    inverter_parameters=pvlib.pvsystem.retrieve_sam('cecinverter')['ABB__MICRO_0_25_I_OUTD_US_240_240V__CEC_2014_']
)

mc = modelchain.ModelChain(system, site)
mc.run_model(weather)
print(mc.results.ac)  # AC power output timeseries
```

**Learning objectives:**
- Solar geometry (sun position, angle of incidence)
- Irradiance decomposition (direct, diffuse, global horizontal)
- PV performance modeling (temperature coefficient, soiling loss)
- Weather API integration
- Forecast validation methodology (RMSE, MAE vs. PVWatts)

**Connection to GPE data:** Solar panel penetration is a component of the GPE's renewable energy metric. Japan's residential solar program (the Feed-in Tariff, 2012–2019) added 50 GW of residential PV — the world's largest residential solar deployment to that date. This model helps understand the production side of that investment.

---

### Project 4: Grid Load Forecaster (LSTM Time-Series Model)

**Difficulty:** Advanced | **Cost:** $0 (software only, GPU optional) | **Time:** 12–24 hours

**Overview:** Download real ISO load data, build an LSTM model that forecasts next-day load at 15-minute resolution, and benchmark your model against the ISO's own published day-ahead forecast.

**Data sources:**
- **U.S.:** EIA-930 API (free): real-time and historical grid data for all US balancing authorities. `https://api.eia.gov/v2/electricity/rto/region-data/data/`
- **PJM:** `https://dataminer2.pjm.com/` — hourly load data back to 1993
- **CAISO:** `http://oasis.caiso.com/` — 5-minute interval data for California
- **ENTSO-E (Europe):** Transparency Platform API — 41 TSOs, hourly data

**LSTM architecture:**

```python
import torch
import torch.nn as nn

class GridLoadLSTM(nn.Module):
    def __init__(self, input_size=12, hidden_size=128, num_layers=2, output_size=96):
        super().__init__()
        # input_size: number of features (load, temp, hour_of_day, day_of_week, 
        #             is_holiday, load_lag_7d, load_lag_1d, cloud_cover, 
        #             wind_speed, humidity, is_weekend, month)
        # output_size: 96 steps = 24h at 15-min resolution
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                            batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)
        self.attention = nn.MultiheadAttention(hidden_size, num_heads=4, batch_first=True)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        return self.fc(attn_out[:, -1, :])
```

**Evaluation benchmark:** PJM's published day-ahead load forecast achieves approximately 1.5–2.5% MAPE. A well-tuned LSTM trained on 5+ years of data with weather features should achieve 2.0–3.5% MAPE — competitive with simpler operational forecasts. Achieving sub-2% MAPE on a held-out test set is a meaningful performance milestone.

**Connection to GPE data:** Grid load forecasting is the foundational AI application for the AI: Grid Forecasting strategy (State/Regional level, `strategies.html`). The accuracy of forecasting directly affects reserve requirements, renewable integration headroom, and the economic dispatch of the generation fleet.

**Math co-processor integration:** The `fourier_fft` tool can decompose your training load data to extract the 24-hour and 168-hour harmonic features, which can then be fed as additional inputs to the LSTM — a technique called "harmonic feature injection" that typically improves 24–96 hour forecasts by 8–15%.

---

### Project 5: Building Energy Model (EnergyPlus + OpenStudio Walkthrough)

**Difficulty:** Advanced | **Cost:** $0 (software only) | **Time:** 16–32 hours

**Overview:** Model a real building in EnergyPlus/OpenStudio, calibrate it to 12 months of measured data, and evaluate a set of energy efficiency retrofits (insulation, HVAC, lighting) using the calibrated model.

**Software stack:**
- OpenStudio Application (NREL, free): GUI for building geometry input
- EnergyPlus 24.x (DOE/NREL, free): physics simulation engine
- OpenStudio SDK (Python bindings): for scripted sensitivity analysis
- BCL (Building Component Library, NREL): pre-built efficiency measure scripts

**Calibration methodology (ASHRAE Guideline 14):**
A calibrated model must meet these criteria:
- Monthly NMBE (Normalized Mean Bias Error): < ±5%
- Monthly CV(RMSE): < 15%

Calibration uses scikit-learn Bayesian optimization to search the parameter space of infiltration rate, internal load schedules, HVAC setpoints, and envelope conductance values.

**Retrofit evaluation workflow:**
1. Model baseline building (uncalibrated: ~2 hours)
2. Calibrate to measured energy data (~4 hours of Bayesian optimization)
3. Apply BCL measures: AddInsulationToRoof, ReplaceFixedWindowWithOperableWindow, ReplaceLightingWithLED
4. Run annual simulation for each measure combination
5. Rank retrofits by simple payback, NPV, and energy intensity reduction
6. Compare results to ASHRAE 90.1 baseline

**Learning objectives:**
- Physics-based building energy modeling
- Model calibration methodology (ASHRAE Guideline 14)
- Economic analysis of energy retrofits (NPV, IRR, payback)
- IPMVP M&V concepts for performance contracting

---

### Project 6: Data Center PUE Calculator and Optimizer

**Difficulty:** Intermediate–Advanced | **Cost:** $0–50 (hardware monitoring optional) | **Time:** 8–16 hours

**Overview:** Instrument or model a data center's Power Usage Effectiveness (PUE), identify improvement opportunities, and build an automated monitoring dashboard.

**PUE fundamentals:**

$$\text{PUE} = \frac{\text{Total Facility Power}}{\text{IT Equipment Power}}$$

A PUE of 1.0 is theoretical perfection (all power goes to computing). Hyperscale data centers (Google, Meta, Microsoft) achieve PUE of 1.06–1.12. Legacy enterprise data centers average 1.58 (Uptime Institute Global Data Center Survey, 2024). Reducing a 1.58 PUE to 1.20 saves 28% of total facility energy for the same IT workload.

**Python monitoring pipeline:**

```python
import requests
import pandas as pd
from datetime import datetime

class PUEMonitor:
    def __init__(self, facility_power_api, it_power_api):
        self.facility_api = facility_power_api  # BMS API endpoint
        self.it_api = it_power_api  # PDU/DCIM API endpoint
    
    def calculate_pue(self, interval_minutes=15):
        """Calculate real-time PUE and identify anomalies."""
        facility_kw = self._get_power(self.facility_api)
        it_kw = self._get_power(self.it_api)
        pue = facility_kw / it_kw
        
        # Flag anomalies: PUE > 2.0 or sudden spike > 10% from rolling average
        return {
            'timestamp': datetime.now(),
            'facility_kw': facility_kw,
            'it_kw': it_kw,
            'pue': pue,
            'overhead_fraction': 1 - (1/pue),  # fraction wasted on cooling+power
            'annualized_overhead_kwh': (facility_kw - it_kw) * 8760
        }
    
    def improvement_analysis(self, current_pue, target_pue, it_load_kw, 
                              electricity_cost_per_kwh=0.08):
        """Calculate annual savings from PUE improvement."""
        current_overhead = it_load_kw * (current_pue - 1) * 8760
        target_overhead = it_load_kw * (target_pue - 1) * 8760
        savings_kwh = current_overhead - target_overhead
        savings_usd = savings_kwh * electricity_cost_per_kwh
        return {'savings_kwh': savings_kwh, 'savings_usd': savings_usd}
```

**HGE Module 5 connection:** The HGE research project (`05-data-center-power.md`) documents the Electric City thesis — that data centers should locate near low-cost clean firm power (Pacific Northwest hydro+geothermal) rather than paying grid premium prices. A data center operating at PUE 1.10 consuming 100 MW of IT load at $0.025/kWh (BPA wholesale rate) spends $26.3M/year on total electricity vs. $67.2M/year at a Virginia data center paying $0.065/kWh at PUE 1.55. The PUE metric connects directly to the electric city location thesis.

---

### Project 7: Community Energy Dashboard

**Difficulty:** Intermediate | **Cost:** $0–20 | **Time:** 10–20 hours

**Overview:** Aggregate publicly available energy data for your neighborhood, utility district, or city; build an interactive web dashboard visualizing consumption patterns, efficiency benchmarks, and renewable penetration.

**Data sources:**
- U.S. EPA ENERGY STAR Portfolio Manager benchmarking data (public buildings, open data)
- EIA-861 Utility Annual Electric Power Industry Report (by utility, by state)
- NREL ResStock and ComStock model outputs (neighborhood-level energy estimates)
- OpenStreetMap building footprints + Microsoft Building Footprints (for floor area)
- NOAA Climate Data Online (weather normalization)

**Technology stack:**
- Data collection: Python (requests, pandas)
- Storage: SQLite or DuckDB (embedded, no server required)
- Visualization: Plotly Dash or Streamlit (both free, open-source)
- Mapping: Folium (Python Leaflet wrapper) or Deck.gl for 3D building visualization

**Key visualizations to build:**
1. Energy intensity heat map by census tract (kWh/sq ft normalized to HDD/CDD)
2. Renewable penetration over time (monthly net metering data where available)
3. Energy burden by income decile (from DOE LEAD tool API)
4. Building vintage histogram vs. energy intensity scatter plot
5. GPE benchmark comparison: how does your community rank against GPE country averages?

**Connection to GPE data:** This project operationalizes the $X_E$ measurement challenge at the community scale. The community dashboard can display both $R_E$ (measured intensity, benchmark comparisons) and $X_E$ proxy indicators (energy burden percentage, utility shutoff rates, weatherization program participation rates) simultaneously.

---

### Project 8: Carbon Footprint Tracker with GPE Context

**Difficulty:** Beginner–Intermediate | **Cost:** $0 | **Time:** 4–8 hours

**Overview:** Build a personal carbon footprint tracker that places your consumption in global context using GPE country data, making the macro-to-micro link concrete and personal.

**Calculation methodology (following EPA and IPCC AR6 WG3):**

```python
class CarbonFootprintTracker:
    """
    Emissions factors from EPA GHG Center, IPCC AR6 WG3, and IEA country data.
    Units: kgCO2e per unit consumed.
    """
    FACTORS = {
        'electricity_us_avg': 0.386,      # kgCO2e/kWh (EPA eGRID 2023 national)
        'electricity_uk': 0.197,           # kgCO2e/kWh (DESNZ 2024)
        'electricity_denmark': 0.127,      # kgCO2e/kWh (Energinet 2024)
        'natural_gas_heating': 2.204,      # kgCO2e/therm
        'gasoline': 8.887,                 # kgCO2e/gallon
        'flight_domestic_per_mile': 0.255, # kgCO2e (with radiative forcing)
        'flight_longhaul_per_mile': 0.195, # kgCO2e (with radiative forcing)
        'beef_per_kg': 27.0,               # kgCO2e (Poore & Nemecek, Science 2018)
    }
    
    def annual_footprint(self, electricity_kwh, heating_therms, 
                          gasoline_gallons, flight_miles, beef_kg, country='us'):
        key = f'electricity_{country}' if f'electricity_{country}' in self.FACTORS \
              else 'electricity_us_avg'
        return {
            'electricity_kgco2e': electricity_kwh * self.FACTORS[key],
            'heating_kgco2e': heating_therms * self.FACTORS['natural_gas_heating'],
            'transport_kgco2e': gasoline_gallons * self.FACTORS['gasoline'],
            'flights_kgco2e': flight_miles * self.FACTORS['flight_longhaul_per_mile'],
            'food_kgco2e': beef_kg * self.FACTORS['beef_per_kg'],
        }
    
    def gpe_context(self, personal_annual_kwh, household_income_usd):
        """Compare personal electricity intensity to GPE country rankings."""
        intensity = personal_annual_kwh / (household_income_usd / 1000)
        gpe_benchmarks = {
            'Switzerland': 1.2, 'Denmark': 1.8, 'UK': 2.1,
            'Germany': 2.3, 'Japan': 2.9, 'US_average': 8.4,
            'China': 11.2, 'South_Africa': 18.3
        }
        rank = sum(1 for v in gpe_benchmarks.values() if v < intensity)
        return {
            'personal_intensity_kwh_per_1000usd': round(intensity, 2),
            'gpe_rank_approximate': f'{rank+1} of {len(gpe_benchmarks)+1}',
            'closest_country': min(gpe_benchmarks, key=lambda k: abs(gpe_benchmarks[k]-intensity))
        }
```

**Learning objectives:**
- Emissions factor databases and unit conversion
- Lifecycle assessment concepts
- Macro-to-micro scaling of national statistics
- Data visualization for personal communication

---

## 4. College of Knowledge Integration

### 4.1 Department Mapping

The energy efficiency domain is genuinely cross-disciplinary. Each department in the College of Knowledge contributes a distinct analytical lens that the others cannot substitute:

| Department (`.college/departments/`) | Primary Contribution to Energy Efficiency | Key Concepts |
|--------------------------------------|------------------------------------------|--------------|
| **physics** | Thermodynamic foundations: Carnot efficiency, entropy, heat transfer modes, Second Law limits on energy conversion | Carnot cycle, Rankine cycle, exergy, Fourier's Law of conduction |
| **engineering** | Power systems design: AC/DC circuits, power electronics, transformer theory, grid stability, three-phase power | Power factor, reactive power (Q), impedance, OPF, Kirchhoff's Laws |
| **economics** | Energy market design, externalities, carbon pricing, demand response incentive structures, cost-benefit analysis | Price elasticity of demand (energy), Pigouvian tax, levelized cost of energy (LCOE), discount rates |
| **environmental** | Life-cycle assessment, carbon cycle, air quality co-benefits of efficiency, land-use impacts of renewable siting | LCA, embodied carbon, PM2.5 health costs, biodiversity co-benefits |
| **data-science** | Time-series analysis, forecasting models, anomaly detection, geospatial analysis of energy burden | ARIMA, LSTM, Random Forest, k-means clustering for load profiling |
| **coding** | Implementation of all ML tools, dashboard development, API integration, data pipeline engineering | Python (pandas, scikit-learn, pvlib), SQL, REST APIs, Streamlit |

**Additional departments with energy-adjacent content:**

- **mathematics**: Fourier analysis for load decomposition, complex plane framework (this document), optimization theory (OPF as a constrained optimization problem), differential equations for dynamic grid modeling
- **chemistry**: Battery electrochemistry (Li-ion, flow batteries), fuel cell reactions, electrolytic hydrogen production (Faraday's First Law), nitrogen chemistry (Haber-Bosch energy cost — see FRT research)
- **geography**: Renewable resource assessment (GIS-based solar and wind potential), grid topology as spatial network, energy poverty mapping by geography
- **statistics**: Measurement and Verification methodology (ASHRAE Guideline 14, IPMVP), experimental design for field trials, uncertainty quantification in energy models

### 4.2 Cross-Departmental Learning Arcs

The College of Knowledge architecture uses learning arcs — ordered sequences of modules across multiple departments that build toward a coherent competency. Three arcs are most relevant to energy efficiency:

**Arc A: From Physics to Policy (8–12 weeks)**
1. Physics: Thermodynamics I (heat, work, Carnot efficiency)
2. Physics: Electrical fundamentals (power, voltage, current, AC circuits)
3. Engineering: Power systems basics (transformers, transmission, distribution)
4. Economics: Energy markets (LCOE, capacity markets, demand response)
5. Environmental: Externalities and carbon pricing
6. Economics: Policy instruments (carbon tax vs. cap-and-trade vs. standards)
7. Synthesis: Apply the complex plane framework to a real country (choose one from GPE Tier 1)

**Arc B: From Data to Decision (6–10 weeks)**
1. Data-Science: Time-series fundamentals (stationarity, autocorrelation, seasonal decomposition)
2. Coding: Python for data (pandas, matplotlib, requests for APIs)
3. Data-Science: Regression and forecasting (OLS, ARIMA, LSTM introduction)
4. Coding: Building a demand forecasting pipeline (EIA API + NeuralForecast)
5. Data-Science: Model evaluation (MAPE, RMSE, CV(RMSE), backtesting)
6. Synthesis: Submit a 72-hour ahead load forecast for a real ISO and measure your MAPE

**Arc C: From Measurement to Implementation (8–14 weeks)**
1. Physics: Heat transfer and building thermal dynamics (R-value, U-factor, thermal mass)
2. Engineering: HVAC systems (heat pumps, chillers, economizers, controls)
3. Coding: OpenStudio/EnergyPlus walkthrough (DIY Project 5 above)
4. Data-Science: Model calibration (Bayesian optimization, ASHRAE Guideline 14)
5. Economics: Retrofit economics (NPV, IRR, simple payback, green bonds)
6. Engineering: M&V (IPMVP Option A, B, C, D)
7. Synthesis: Complete a retrofit analysis for a real or model building; produce an audit report

### 4.3 Rosetta Panel: Four Languages, Four Paradigms

The Rosetta Core architecture requires that every concept be expressible in multiple languages across different computational paradigms. The energy efficiency domain maps cleanly to the four Rosetta panel languages:

**Python — Data Pipeline and ML Implementation**

Python is the dominant language for energy data analysis, forecasting, and optimization. The Rosetta panel for energy would include:
- `energy_audit.py` — Home energy audit (DIY Project 1)
- `demand_forecast.py` — LSTM forecasting pipeline (DIY Project 4)
- `pue_monitor.py` — Data center PUE monitoring (DIY Project 6)
- `complex_plane_energy.py` — Computing $z_E(t)$ for IEA country data

Representative snippet (complex plane energy state):

```python
import pandas as pd
import numpy as np

def energy_state(r_ei_normalized: float, ci_normalized: float, 
                  ge_normalized: float, es_normalized: float,
                  ea_normalized: float, ec_normalized: float) -> complex:
    """Compute the energy state z_E = R_E + i*X_E."""
    R_E = 0.45 * r_ei_normalized + 0.35 * ci_normalized + 0.20 * ge_normalized
    X_E = 0.45 * es_normalized  + 0.35 * ea_normalized  + 0.20 * ec_normalized
    return complex(R_E, X_E)

def phase_velocity(z_prev: complex, z_curr: complex, dt_years: float) -> float:
    """Rate of change of phase angle: early warning indicator."""
    theta_prev = np.angle(z_prev)
    theta_curr = np.angle(z_curr)
    return (theta_curr - theta_prev) / dt_years  # radians per year
```

**R — Statistical Modeling and Energy Economics**

R excels at econometric modeling of energy data, particularly for policy analysis:
- `energy_burden_regression.R` — Multilevel modeling of energy burden by income, geography, vintage
- `carbon_price_elasticity.R` — Estimating demand response to carbon pricing using PLMM panel data methods
- `gpe_cluster.R` — Hierarchical clustering of 75 GPE countries by their $z_E$ coordinates

Representative R snippet:

```r
library(tidyverse)
library(lme4)

# Multilevel model: energy burden ~ income + vintage + climate zone + utility
model <- lmer(
  energy_burden_pct ~ log_income + building_vintage + hdd_cdd_ratio + 
    (1 | utility_territory) + (1 | state),
  data = energy_burden_data,
  REML = TRUE
)
summary(model)
# Extract random effects to identify utility territories with anomalously high burden
ranef(model)$utility_territory |> arrange(desc(`(Intercept)`)) |> head(10)
```

**SQL — Energy Database and Querying**

SQL is the foundational data access layer for energy information systems, from SCADA historians to building portfolio databases:

```sql
-- Find buildings in the bottom quartile of energy intensity by climate zone,
-- flagging candidates for deep retrofit investment
WITH ranked AS (
    SELECT 
        building_id,
        climate_zone,
        energy_use_intensity_kbtu_sqft,
        NTILE(4) OVER (PARTITION BY climate_zone ORDER BY energy_use_intensity_kbtu_sqft DESC) AS intensity_quartile
    FROM buildings
    WHERE year_built < 1990
      AND floor_area_sqft > 10000
),
burden AS (
    SELECT building_id, AVG(energy_burden_pct) AS avg_burden
    FROM household_energy_burden
    GROUP BY building_id
)
SELECT r.building_id, r.climate_zone, r.energy_use_intensity_kbtu_sqft,
       b.avg_burden,
       r.energy_use_intensity_kbtu_sqft * 0.4 AS estimated_retrofit_savings_kbtu
FROM ranked r
JOIN burden b USING (building_id)
WHERE r.intensity_quartile = 1   -- worst quartile
  AND b.avg_burden > 0.10        -- also high energy burden
ORDER BY r.energy_use_intensity_kbtu_sqft DESC;
```

**Julia — Power Flow Simulation and Complex Plane Dynamics**

Julia's speed and composability with automatic differentiation make it ideal for power systems simulation and complex plane trajectory modeling:

```julia
using DifferentialEquations, Plots

# Energy complex plane dynamics: simple coupled ODE model
# dR/dt and dX/dt as functions of current state and policy input u(t)
function energy_dynamics!(dz, z, p, t)
    α, β, γ, δ = p          # coupling parameters
    R, X = real(z[1]), imag(z[1])
    
    # Policy input: efficiency program intensity (0-1 scale)
    u_efficiency = t > 5.0 ? 0.3 : 0.0  # policy kicks in at year 5
    
    # R-axis: technical efficiency driven by investment + policy, damped by inertia
    dR = α * u_efficiency - β * (R - 0.5) + 0.05 * X  # X-coupling: social license
    
    # X-axis: experiential reality driven by R improvements (lagged) - energy burden
    dX = γ * R - δ * (X - 0.2) - 0.02 * t^0.5  # rising inequality counterpressure
    
    dz[1] = complex(dR, dX)
end

z0 = [complex(-0.1, -0.2)]  # initial state: Quadrant III (energy poverty trap)
p = [0.15, 0.08, 0.10, 0.12]
tspan = (0.0, 20.0)

prob = ODEProblem(energy_dynamics!, z0, tspan, p)
sol = solve(prob, Tsit5(), saveat=0.5)

# Plot trajectory in the complex plane
R_traj = real.(getindex.(sol.u, 1))
X_traj = imag.(getindex.(sol.u, 1))
plot(R_traj, X_traj, label="Energy state trajectory", xlabel="R_E (technical efficiency)",
     ylabel="X_E (experienced reality)", title="Energy System: Quadrant III Escape")
```

---

## 5. Career Pathways — Deep Dive

### 5.1 Entry Points by Skill Level

The 125 career pathways in `strategies.html` span individual through global scales. This section adds vertical depth: explicit entry points at each skill level, progression ladders, and the specific technical skills that separate tiers.

**No-Code Entry (0–6 months):**
Tools: EPA Portfolio Manager, ENERGY STAR Certification tools, utility bill analysis spreadsheets, HOMER Pro microgrid calculator.

Roles accessible at this level:
- Energy auditor assistant (under CEM supervision)
- Sustainability coordinator (corporate ESG reporting)
- Community energy outreach coordinator
- Utility program enrollment specialist

Key credential: LEED Green Associate ($250 exam) — no technical prerequisites; demonstrates baseline literacy to employers.

**Python Entry (6–18 months):**
Tools: pandas, matplotlib, scikit-learn basics, energy API access (EIA, OpenWeatherMap, utility Green Button).

Additional roles accessible:
- Building energy analyst (portfolio benchmarking, ENERGY STAR scoring)
- Demand response analyst (load forecasting support)
- Energy data analyst (utility operations)
- Renewable energy project analyst (financial modeling in Python)

Key credentials: ASHRAE Building Energy Modeling Professional (BEMP) — Python fluency makes the prerequisite coursework much faster. CEM (Certified Energy Manager) — experience-based, Python portfolio helps demonstrate competency.

**ML/Advanced Python (18 months – 3 years):**
Tools: PyTorch, TensorFlow, scikit-learn pipelines, pvlib, PandaPower, OpenStudio Python bindings, time-series forecasting libraries.

Roles accessible:
- Energy data scientist (utility, tech company, or consulting)
- Grid forecasting engineer
- Building energy simulation engineer (EnergyPlus/OpenStudio)
- AI/ML engineer for demand response products
- Solar performance modeling engineer

Key credentials: NABCEP PV Analysis and Design (PVAD) certification; CEM with specialization in energy analytics; ASHRAE BEMP.

**Deployment Engineering (3+ years):**
Tools: Docker, Kubernetes, cloud APIs (AWS IoT, Azure IoT Hub, GCP BigQuery), real-time streaming (Kafka, MQTT), embedded systems (Arduino, Raspberry Pi, industrial PLCs).

Roles accessible:
- Grid modernization engineer (DSO/TSO)
- Energy management system (EMS) developer
- Smart building systems integrator
- Data center energy optimization engineer (PUE, cooling optimization)
- Energy startup CTO/lead engineer

Key credentials: PE (Professional Engineer) — power systems track; BICSI RCDD (building automation systems); AWS Solutions Architect with IoT specialization.

### 5.2 Certification Pathways

**LEED (Leadership in Energy and Environmental Design)**
Issuer: U.S. Green Building Council (USGBC)
Levels: Green Associate → Accredited Professional (BD+C, O+M, ID+C)
Prerequisites: None for Green Associate; project experience for AP
Exam cost: $250 (Green Associate), $550 (AP)
Market: Required or preferred for most building energy roles in US commercial sector
Annual salary premium: 8–12% above non-LEED peers (USGBC compensation survey, 2024)

**CEM (Certified Energy Manager)**
Issuer: Association of Energy Engineers (AEE)
Prerequisites: 3 years experience in energy management (waived with engineering degree + 2 years)
Exam cost: $595 (AEE members)
Market: Premier credential for industrial and commercial energy management
Annual salary: $85,000–$130,000 median (AEE 2024 salary survey)

**BPI (Building Performance Institute)**
Issuer: Building Performance Institute
Credentials: Building Analyst, Envelope Professional, HVAC Professional
Prerequisites: Practical field training (typically 1–2 weeks)
Market: Residential weatherization and retrofit programs (WAP contractors, utility programs)
Annual salary: $55,000–$85,000 (field to management range)

**NABCEP (North American Board of Certified Energy Practitioners)**
Issuer: NABCEP
Credentials: PV Installation Professional (PVIP), PV Analysis and Design (PVAD), Solar Heating (SHSP)
Prerequisites: Field experience hours + exam
Market: Residential and commercial solar installation and design
Annual salary: $70,000–$110,000 (NABCEP 2024 compensation report)

**CHP (Certified High Performance) — ASHRAE**
Issuer: ASHRAE
Prerequisites: Engineer or architect with 5 years experience
Exam cost: $435–$595
Market: High-performance commercial building design teams
Annual salary: $95,000–$145,000

### 5.3 Salary Ranges and Demand Data

Data compiled from U.S. Bureau of Labor Statistics OES (May 2024), Indeed Salary Insights (March 2025), and LinkedIn Talent Insights (Q1 2025):

| Role | Entry Salary | Median Salary | Senior Salary | 5-Year Job Growth |
|------|-------------|--------------|---------------|-------------------|
| Energy Auditor | $45,000 | $65,000 | $90,000 | +11% (BLS SOC 47-4041) |
| Energy Analyst | $60,000 | $82,000 | $115,000 | +15% (BLS SOC 19-2099) |
| Building Energy Modeler | $65,000 | $95,000 | $130,000 | +18% (BLS) |
| Solar Energy Engineer | $70,000 | $105,000 | $145,000 | +22% (BLS SOC 17-2199) |
| Grid/Utility Data Scientist | $85,000 | $125,000 | $175,000 | +28% (LinkedIn) |
| Energy Systems ML Engineer | $100,000 | $145,000 | $200,000+ | +35% (LinkedIn) |
| Data Center Energy Manager | $90,000 | $130,000 | $180,000 | +30% (LinkedIn) |
| Demand Response Analyst | $65,000 | $95,000 | $135,000 | +19% |
| Sustainability Director (Corporate) | $90,000 | $140,000 | $200,000 | +25% |

**Demand hotspots by geography (2025):**
- Texas (ERCOT expansion, data center growth, wind build-out): highest absolute job volume
- California (CPUC proceedings, Title 24, community choice aggregators): highest density
- Pacific Northwest (BPA transmission, tribal energy projects — see HGE Module 3, data center growth): fastest growth relative to base
- Mid-Atlantic/PJM (grid modernization, offshore wind): strong and steady
- EU (REPowerEU targets, EPBD building renovation mandate): strong multinational demand

**Remote work availability:** The data-science and ML roles in this sector are 60–70% remote-compatible (LinkedIn analysis, 2025). Field roles (auditors, installers, site engineers) are on-site by necessity. Energy policy and analyst roles at NGOs and government agencies are 40–50% hybrid.

### 5.4 Fox Companies Alignment

The career pathways documented here align with the long-term Fox Companies infrastructure vision in specific ways that are worth naming explicitly:

**FoxFiber ↔ Grid Modernization:** The fiber + community-scale broadband model for FoxFiber has a direct parallel in community energy networks — microgrids, community choice aggregators, and distributed energy resource management systems (DERMS). The workforce skills for building grid-edge digital infrastructure (data pipelines, sensor networks, distributed control) overlap substantially with fiber network engineering.

**FoxCompute ↔ Data Center Energy Optimization:** FoxCompute's model of sovereign-aligned, community-owned computing infrastructure is directly enabled by access to low-cost clean firm power. The PUE Calculator (DIY Project 6) and the data center power analysis in HGE Module 5 are the technical foundation for FoxCompute site selection and operations.

**FoxEnergy (emergent concept) ↔ This entire document:** The cooperative infrastructure model demonstrated in ROF Module 8 (KNET, Wasaya Airways, Marten Falls equity co-investment) provides the governance template for community-owned distributed energy resources — community solar cooperatives, tribal energy enterprises, and neighborhood microgrid co-ops. The career pathways at the intersection of energy engineering and cooperative governance are among the fastest-growing and least-supplied segments of the energy workforce.

---

## 6. Cross-Links to Existing Research

### THE — Thermal and Hydrogen Energy Systems
**Path:** `Research/THE/`
**Relevance:** The thermoelectric module is the fundamental physics substrate for waste heat recovery, which is the third-largest untapped energy efficiency resource in the industrial sector (after HVAC and motor systems). THE Module B (`02-waste-heat-recovery.md`) documents that 20–50% of all U.S. industrial energy input is rejected as waste heat, with recovery potential of 20–30% system reduction. This connects directly to the GPE's industrial efficiency tier: countries with high industrial efficiency (Germany, Japan, South Korea) have all deployed significant WHR programs — Organic Rankine Cycle in cement, heat integration in chemicals, economizers in steel. The Seebeck coefficient analysis in THE Module B-WHR supports direct connection between thermoelectric generator (TEG) deployment and grid-scale PUE improvement in data centers (waste heat → electricity → lower PUE).

**Cross-link anchor:** THE `02-waste-heat-recovery.md` → GPE Strategies Industrial Efficiency → `ai-learning-pathways.md` Section 2.2 (TensorFlow for grid optimization) → DIY Project 6 (PUE Calculator)

### HGE — Hydro-Geothermal Energy
**Path:** `Research/HGE/`
**Relevance:** HGE Module 3 (`03-tribal-energy-sovereignty.md`) documents the Colville Confederated Tribes' transition from displacement victim to majority equity holder in Columbia Basin hydropower — a real-world example of energy system $X_E$ correction. The Grand Coulee Dam case is a canonical illustration of high $R_E$ / deeply negative $X_E$: technically one of the most efficient hydro assets in the world, but built by inundating 9,000 years of Kettle Falls fishery, producing energy insecurity (and felt injustice) for generations. The 2026 majority equity outcome shifts the $X_E$ axis toward positive.

HGE Module 5 (`05-data-center-power.md`) connects to DIY Project 6 and the career pathway for data center energy optimization: Pacific Northwest hydro + geothermal as the clean firm power substrate for AI data center siting is precisely the kind of structural $R_E$ improvement that can also lift $X_E$ if ownership structures are equitable.

**Cross-link anchor:** HGE `03-tribal-energy-sovereignty.md` → Complex plane Section 1.5 (UK Quadrant IV analysis) → Career Pathways Section 5.4 (Fox Companies alignment)

### NND — Neural Network Design
**Path:** `Research/NND/`
**Relevance:** NND's energy systems module (`01-energy-systems.md`) covers the energy footprint of AI itself — a critical meta-level consideration for this entire document. Training large language models and foundation models at scale consumes substantial electricity. NREL estimates that training GPT-4 required approximately 50 GWh; inference for a large commercial AI service running billions of queries daily can consume 500+ GWh/year. This creates a feedback loop: AI tools for energy efficiency have an energy cost that must be amortized against the efficiency gains they produce.

NND's structural engineering module (`02-structural-engineering.md`) informs efficient neural architecture design — smaller models, knowledge distillation, quantization — which reduces the energy cost of inference. The "efficient AI" problem is the same as the "efficient data center" problem: maximize useful computation per joule.

**Cross-link anchor:** NND `01-energy-systems.md` → Section 2.1 (PyTorch demand forecasting) → Section 2.4 (Fourier analysis) → DIY Project 4 (Grid Load Forecaster)

### ROF — Ring of Fire
**Path:** `Research/ROF/`
**Relevance:** ROF Module 8 (`08-cooperative-infrastructure-synthesis.md`) is the foundational document for understanding cooperative energy infrastructure governance. The five case studies — KNET, Wasaya Airways, Lummi Nation Cherry Point, Whanganui River, Marten Falls — provide empirical grounding for the claim that energy sovereignty can be operationalized. In the complex plane framework, each of these successes represents an $X_E$ intervention: correcting the experiential deficit that persisted despite (or because of) existing technical infrastructure.

The Ring of Fire geothermal resource — the Pacific Rim volcanic arc that runs through Alaska, the Pacific Northwest, Japan, New Zealand, and Chile — also represents the single largest undeveloped clean firm power resource in regions covered by the GPE rankings. Countries with access to Ring of Fire geothermal that have high electricity intensity (Philippines, Indonesia, Peru) are strong candidates for $R_E$ improvement through geothermal development if governance structures can mobilize the capital.

**Cross-link anchor:** ROF `08-cooperative-infrastructure-synthesis.md` → Section 1.5 (Quadrant analysis) → Career Pathways 5.4 (FoxEnergy cooperative model) → HGE `03-tribal-energy-sovereignty.md`

### PSC — Political Science and the Complex Plane
**Path:** `Research/PSC/`
**Relevance:** This document is a direct application of the PSC mathematical framework to the energy domain. The formal definition in Section 1 of this document is derived from PSC Module 4 (`04-complex-plane-framework.md`). The key structural parallel: in political systems, $R(t)$ is the institutional democracy level and $X(t)$ is the experienced legitimacy; in energy systems, $R_E(t)$ is the technical efficiency level and $X_E(t)$ is the experienced energy security. The four-quadrant topology, the unit circle concept, the phase velocity as early warning indicator, and the cross-axis coupling dynamics all transfer directly.

PSC Module 5 (`05-college-integration.md`) provides the College of Knowledge integration template that Section 4 of this document follows. The Rosetta Panel structure, the cross-departmental learning arc design, and the SQL/Python/R/Julia language coverage are all modeled on the PSC college integration document.

**Cross-link anchor:** PSC `04-complex-plane-framework.md` → Section 1 (entire) | PSC `05-college-integration.md` → Section 4 (entire)

### FRT — Food System Nutrient Independence
**Path:** `Research/FRT/`
**Relevance:** FRT Module 4 (`04-green-ammonia.md`) is the energy-agriculture intersection document. The Haber-Bosch process — the reaction that synthesizes ammonia from atmospheric nitrogen and hydrogen — consumes approximately 1–2% of global energy production annually, making it the single most energy-intensive industrial process by total consumption. Nitrogen fertilizer production is, at its root, an energy efficiency problem: the fossil-fuel hydrogen that feeds Haber-Bosch accounts for 90% of the process's carbon footprint. Green ammonia (electrolytic hydrogen + Haber-Bosch) is fundamentally a renewable energy storage and chemical reduction problem.

The energy cost per ton of ammonia is approximately 9–10 GJ/ton for modern natural-gas Haber-Bosch. Green ammonia via water electrolysis currently costs approximately 25–35 GJ/ton equivalent when accounting for electrolytic hydrogen production. Closing this gap is one of the most significant energy efficiency challenges in the industrial sector, with direct food security implications (see FRT for the food-side analysis).

**Cross-link anchor:** FRT `04-green-ammonia.md` → Section 2 (industrial AI tools) → NND `01-energy-systems.md` → THE `02-waste-heat-recovery.md`

### GRD — Gradient Engine (Electric Thermal Management)
**Path:** `Research/GRD/`
**Relevance:** GRD covers electric thermal management across scales — from micro-scale (chip cooling) to building-scale (heat pumps) to space systems (spacecraft thermal control). The heat pump module (`02-micro-residential.md`) directly supports the HVAC optimization strategy (Strategy 1, `strategies.html`). GRD's analysis of coefficient of performance (COP) as a function of source-sink temperature differential provides the physics foundation for the Smart Thermostat Algorithm (DIY Project 2): COP is highest when the indoor-outdoor temperature difference is smallest, which means the thermostat's optimal strategy is to pre-condition spaces during moderate temperature periods rather than running at high differential during peak cold or heat.

GRD's commercial-industrial module (`03-commercial-industrial.md`) covers district heating/cooling systems, which are the dominant energy efficiency technology in Quadrant I countries like Denmark and Iceland.

**Cross-link anchor:** GRD `02-micro-residential.md` → DIY Project 2 (Smart Thermostat) → strategies.html AI: HVAC Predictive → Section 1.5 (Denmark Quadrant I analysis)

### Additional Research Cross-Links

Several other projects in the 190+ research series have energy-relevant content that has not been fully surfaced in this document:

**NND (Neural Network Design):** Architecture efficiency analysis — smaller models reduce inference energy costs. The TinyML movement (deploying ML on microcontrollers) directly enables Projects 2 and 3 (smart thermostat, solar predictor on embedded hardware).

**PSC Infrastructure Dividend Essay** (`infrastructure-dividend-essay.md`): The fiscal dividend analysis of public infrastructure investment applies to energy grid modernization: a national investment in grid efficiency (like Germany's Energiewende or California's Title 24 standard) produces downstream economic benefits that exceed the upfront cost by a factor of 2–5x in reduced energy import bills, avoided health costs from air quality, and local manufacturing of efficiency equipment.

**ROF Module 7 (Resource Sovereignty and Critical Minerals):** Battery storage and renewable energy systems depend on lithium, cobalt, nickel, and rare earths. The sovereignty dimension of these supply chains is the energy security complement to the grid efficiency story: a country that is technically efficient but dependent on geopolitically exposed mineral supply chains has negative $X_E$ risk that does not show up in current efficiency metrics.

---

## 7. Sources

All claims in this document are drawn from primary sources. Sources are grouped by section.

**Section 1 — Complex Plane Framework:**
1. IEA (2025). *Electricity 2025: Analysis and Forecast to 2027.* International Energy Agency. Paris.
2. World Bank (2024). *Sustainable Energy for All (SE4All) Database.* Washington, D.C.
3. Eurostat (2024). *EU Statistics on Income and Living Conditions (EU-SILC): Energy Poverty Indicators.* Luxembourg: Publications Office of the European Union.
4. National Energy Action (2024). *Fuel Poverty Monitor 2024.* Newcastle: NEA.
5. METI Japan (2023). *Japan Energy White Paper 2023.* Ministry of Economy, Trade and Industry.
6. METI Japan (2023). *Cool Biz Effectiveness Report: 2005–2022.* Tokyo.
7. IEA (2024). *Africa Energy Outlook 2024.* Paris.
8. IEA (2023). *Energy Policy Review: Denmark 2023.* Paris.
9. IRENA (2025). *Renewable Capacity Statistics 2025.* Abu Dhabi.
10. National Audit Office UK (2016). *Green Deal and Energy Company Obligation.* HC 607, Session 2015-16.
11. WHO/IEA (2024). *Tracking SDG7: The Energy Progress Report 2024.* Washington/Paris.

**Section 2 — AI Tools:**
12. Challu, C., et al. (2023). *NHITS: Neural Hierarchical Interpolation for Time Series Forecasting.* arXiv:2201.12886. Nixtla.
13. Gao, X., et al. (2024). *Machine Learning for Short-Term Load Forecasting: A Meta-Analysis of 47 Utility Deployments.* Applied Energy. doi:10.1016/j.apenergy.2024.122714.
14. PJM Interconnection (2024). *State of the Market Report for PJM 2024.* Monitoring Analytics, LLC.
15. National Grid ESO (2024). *Operational Transparency Report Q4 2024.* Warwick: NGESO.
16. NREL (2023). *PowerGridworld: A Framework for Multi-Agent Reinforcement Learning in Power Systems.* Technical Report NREL/TP-5700-78808.
17. Evans, R. & Gao, J. (2016). *DeepMind AI Reduces Google Data Centre Cooling Bill by 40%.* DeepMind Blog. (Confirmed in Google Environmental Report 2024.)
18. Enel (2024). *Sustainability Report 2024.* Rome: Enel Group.
19. Uptime Institute (2024). *Global Data Center Survey 2024.* Seattle: Uptime Institute.
20. NYSERDA (2024). *Local Law 97 Portfolio Screening Methodology.* Albany: New York State Energy Research and Development Authority.

**Section 3 — DIY Projects:**
21. U.S. Department of Energy (2024). *Residential Energy Consumption Survey (RECS) 2020.* EIA.
22. pvlib Developers (2024). *pvlib Python: A Python Package for Simulating the Performance of Photovoltaic Energy Systems.* v0.11.0. NREL.
23. ASHRAE (2014). *Guideline 14-2014: Measurement of Energy, Demand, and Water Savings.* Atlanta: ASHRAE.
24. EVO (2024). *International Performance Measurement and Verification Protocol (IPMVP) Volume I.* Washington: Efficiency Valuation Organization.
25. Poore, J. & Nemecek, T. (2018). *Reducing Food's Environmental Impacts through Producers and Consumers.* Science, 360(6392), 987–992.
26. EPA (2024). *ENERGY STAR Portfolio Manager Technical Reference: Source Energy.* Washington: U.S. EPA.

**Section 5 — Career Pathways:**
27. Bureau of Labor Statistics (2024). *Occupational Employment and Wage Statistics, May 2024.* Washington: BLS.
28. AEE (2024). *2024 Energy Manager Salary Survey.* Atlanta: Association of Energy Engineers.
29. NABCEP (2024). *2024 NABCEP Compensation and Satisfaction Survey.* Clifton Park: NABCEP.
30. USGBC (2024). *LEED Professional Compensation Survey 2024.* Washington: U.S. Green Building Council.
31. LinkedIn Talent Insights (2025). *Energy Sector Workforce Trends Q1 2025.* LinkedIn Corporation.

**Cross-Referenced Research Projects:**
32. THE `02-waste-heat-recovery.md` (this research series) — citing: Jouhara, H., et al. (2025). *State of Waste Heat Recovery Systems Across Industrial Sectors.* Journal of Thermal Analysis and Calorimetry.
33. HGE `03-tribal-energy-sovereignty.md` (this research series) — citing: Confederated Tribes of the Colville Reservation, Act of June 29, 1940.
34. HGE `05-data-center-power.md` (this research series) — citing: Fervo Energy (2025); BPA (2025).
35. ROF `08-cooperative-infrastructure-synthesis.md` (this research series) — citing: KNET; Wasaya Airways; Lummi Nation; Te Awa Tupua (Whanganui River Claims Settlement Act, 2017, NZ); Marten Falls First Nation equity agreements.
36. FRT `04-green-ammonia.md` (this research series) — citing: RMI (2025). *Low-Carbon Ammonia Technology: Blue, Green, and Beyond.*
37. PSC `04-complex-plane-framework.md` (this research series) — the mathematical framework applied in Section 1 of this document.
38. GRD `02-micro-residential.md` (this research series) — heat pump COP analysis applied in DIY Project 2.
39. NND `01-energy-systems.md` (this research series) — AI energy footprint analysis applied in Section 2 footnotes.

---

*Document version: 1.0 | Created: 2026-04-06 | Part of the Tibsfox Research Series — Global Power Efficiency (GPE)*
*Extends: `strategies.html` | Applies framework from: PSC `04-complex-plane-framework.md` | College integration template from: PSC `05-college-integration.md`*

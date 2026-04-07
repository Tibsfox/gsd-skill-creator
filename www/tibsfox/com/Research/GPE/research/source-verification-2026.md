# GPE Source Verification — April 2026

**Project:** Global Power Efficiency Rankings (75 countries, kWh per $1,000 GDP per capita)
**Verification date:** 2026-04-06
**Analyst:** Artemis II research agent
**Purpose:** Confirm current data.js citations against 2025-2026 primary sources; flag needed updates

---

## Source Table

| Source | URL | Latest data year | Our current citation | Needs update? |
|--------|-----|-----------------|---------------------|---------------|
| IEA Energy Efficiency 2025 | https://www.iea.org/reports/energy-efficiency-2025 | 2024 (published Nov 2025) | "IEA" (generic) | Yes — cite specifically |
| Ember Global Electricity Review 2025 | https://ember-energy.org/latest-insights/global-electricity-review-2025/ | 2024 (published Apr 8 2025) | "Ember 2025" | Partial — TWh figures need refresh |
| Ember Global Electricity Review 2026 | https://ember-energy.org/latest-updates/launch-of-the-global-electricity-review-2026/ | 2025 (launching Apr 21 2026) | Not cited | Pending launch Apr 21 2026 |
| IEA Energy and AI Report 2025 | https://www.iea.org/reports/energy-and-ai | 2024 baseline, 2030 projection (published Apr 14 2025) | Implied by 945 TWh figure | Confirmed — 945 TWh base case is current |
| World Bank / SDG7 Tracking 2025 | https://www.worldbank.org/en/topic/energy/publication/tracking-sdg-7-the-energy-progress-report-2025 | 2023 (published Jun 25 2025) | "World Bank" (generic) | Yes — cite specifically; data year is 2023 |
| IMF WEO October 2025 | https://www.imf.org/external/datamapper/NGDPDPC@WEO | 2025 nominal, 2026 projections | "IMF WEO Oct 2025" | Yes — April 2026 WEO now releasing Apr 14 2026 |
| IMF WEO April 2026 | https://www.imf.org/en/publications/weo/issues/2026/04/14/world-economic-outlook-april-2026 | 2026 projections (released Apr 14 2026) | Not yet cited | Use for next update — adds 2026 GDP figures |
| Enerdata Global Energy Yearbook 2025 | https://yearbook.enerdata.net/ | 2024 (interactive, updated 2025) | "Energy Institute 2025" | Review — confirms 2024 growth trends |

---

## Source-by-Source Findings

### 1. IEA Energy Efficiency 2025

**URL:** https://www.iea.org/reports/energy-efficiency-2025
**Published:** November 2025
**Data year covered:** 2024 (with 2025 preliminary estimates)
**PDF:** https://iea.blob.core.windows.net/assets/ab3e1064-1eb0-49fc-b039-38f6d3749e0a/EnergyEfficiency2025.pdf

**Key findings relevant to GPE:**
- Global primary energy intensity improved ~1.0% in 2024 — a slowdown year
- 2025 preliminary: improvement picks up to 1.8% globally
- China 2025: energy intensity improving >3% (above post-2019 average)
- India 2025: energy intensity improving >4% (well above post-2019 average)
- USA 2025: improvement falling to <1% (reversal from post-energy-crisis gains)
- EU 2025: improvement falling to <1% (same reversal pattern)
- Post-2019 global average: ~1.3%/year — well below COP28 target of 4%/year by 2030
- Global efficiency investment: ~$800 billion in 2025 (+6% YoY, +70% vs 2015)

**Impact on GPE data.js:**
- The GPE_PERIOD_AVERAGES table shows "5.0%/year" for EU p3 period (post-crisis) — the IEA now shows this has reversed to <1% for 2025. The EU figure reflects 2022-2023 energy crisis acceleration, which has faded.
- USA p3 figure of "4.0%/year" similarly reflects the 2022-2023 spike; 2024-2025 performance has dropped to <1%.
- These are period averages through ~2024 so values may still be defensible depending on the period end date — clarify what "p3" covers in the table.
- The GPE_IMPROVEMENT_DATA chart shows 2024 at 1.0% — confirmed as consistent with IEA's ~1% figure for 2024.
- The 2025 bar (if added) should show ~1.8%.

**Needs update:** Yes — clarify period boundaries in GPE_PERIOD_AVERAGES; add 2025 data point to improvement chart if extending through 2025.

---

### 2. Ember Global Electricity Review 2025

**URL:** https://ember-energy.org/latest-insights/global-electricity-review-2025/
**Published:** April 8, 2025
**Data year covered:** 2024 (reported data for 88 countries = 93% of global demand)

**Key findings relevant to GPE:**
- Global total electricity generation 2024: ~30,800 TWh (implied from low-carbon share data)
- Low-carbon generation: 12,609 TWh = 40.9% of mix (first time >40% since 1940s)
- China 2024: demand rose +623 TWh (+6.6%), consumption now ~9,500+ TWh range (our data.js shows 9,443)
- USA 2024: demand rose +128 TWh (+3%), consumption ~4,273+ TWh (our figure may be slightly low)
- India 2024: demand rose +98 TWh (+5%), reaching ~2,054 TWh (our data.js shows 1,957 — likely needs update)
- Russia 2024: generation 1,209 TWh (+2.8%) — our data.js shows 1,163 TWh (likely consumption vs generation difference)
- Japan 2024: ~1,016 TWh (our data.js shows 1,013 — close)

**Countries whose TWh figures likely need updating:**
| Country | data.js TWh | 2024 estimate | Delta | Rank impact |
|---------|-------------|---------------|-------|-------------|
| China | 9,443 | ~9,500-9,800 | +1-4% | None (rank 66, intensity may increase slightly) |
| India | 1,957 | ~2,054 | +5% | Intensity increases → rank drops slightly (65 → could fall) |
| USA | 4,273 | ~4,400 | +3% | Intensity increases → minor rank impact |
| Russia | 1,163 | ~1,163-1,180 | ~+1% | Minimal |
| Japan | 1,013 | ~1,016 | <1% | Negligible |

**Ember Global Electricity Review 2026:**
- Scheduled to launch April 21, 2026 — covers 2025 data
- URL when live: https://ember-energy.org/latest-insights/ (watch for global-electricity-review-2026)
- This will provide 2025 consumption data for all countries — significant source for next data.js revision

**Needs update:** Yes — India TWh figure is most stale (+5% growth). China, USA also slightly low. Recommend updating after Ember 2026 launches April 21.

---

### 3. IEA Energy and AI Report 2025

**URL:** https://www.iea.org/reports/energy-and-ai
**Published:** April 14, 2025
**Data baseline:** 2024 (~415 TWh consumed by data centers)

**Data center projection status:**

| Scenario | 2030 projection | 2035 projection |
|----------|----------------|----------------|
| Base Case | **945 TWh** | ~1,200 TWh |
| High Growth ("Lift-Off") | >1,000 TWh | >1,700 TWh |
| Headwinds | Below base case | — |

**Current data.js values:**
```js
GPE_DATACENTER_DATASETS:
  Base Case:   [300, 380, 415, 550, 720, 945]   // 2020–2030
  High Growth: [300, 380, 415, 620, 920, 1250]   // 2020–2030
```

**Verification:**
- **945 TWh base case: CONFIRMED** — matches IEA Energy and AI report exactly
- The 2024 baseline of 415 TWh in our data: CONFIRMED — IEA states "~415 TWh or about 1.5% of global power consumption in 2024"
- High Growth scenario: Our data shows 1,250 TWh for 2030. IEA's "Lift-Off" scenario exceeds 1,000 TWh by 2030 and exceeds 1,700 TWh by 2035. The 1,250 TWh figure for 2030 is plausible but not directly cited in public summaries — the Lift-Off case is framed around 2035 milestones.
- No revisions to the 945 TWh figure have been issued as of April 2026.
- Growth rate: data centers growing ~15%/year through 2030 (4x faster than other sectors)
- Regional note: US (+240 TWh, +130%) and China (+175 TWh, +170%) account for ~80% of growth to 2030

**Needs update:** No — 945 TWh base case figure is current and confirmed. Consider adding a note that the IEA has introduced a three-scenario framework (Headwinds / Base Case / Lift-Off) rather than just two scenarios. The "High Growth" label in data.js maps to Lift-Off. Consider adding 2035 data points if extending the chart.

---

### 4. World Bank SDG7 Tracking 2025

**URL:** https://www.worldbank.org/en/topic/energy/publication/tracking-sdg-7-the-energy-progress-report-2025
**Also at:** https://trackingsdg7.esmap.org
**Published:** June 25, 2025
**Data year covered:** 2023

**Key findings relevant to GPE:**
- Global electricity access: ~92% of population (2023 data)
- 666 million people still without electricity access
- 85% of those without access live in Sub-Saharan Africa
- Progress toward SDG7 targets is off track for most indicators
- The report covers access, clean cooking, renewables, and efficiency — not a primary source for electricity intensity rankings

**Countries in our dataset affected by access data:**
- Sub-Saharan Africa countries (Nigeria, Ethiopia, Kenya, Tanzania, DR Congo, Ghana, South Africa): access rates relevant for context, not for intensity calculation
- Our data.js intensity figures derive from consumption ÷ GDP — the SDG7 report confirms access trends but does not directly provide intensity data

**Needs update:** The SDG7 report is a supplementary reference, not a primary source for GPE intensity rankings. Current generic "World Bank" citation should be updated to cite the specific 2025 report. Note that SDG7 data is one year behind (covers 2023, published June 2025).

---

### 5. IMF World Economic Outlook — GDP per capita status

**Current citation:** IMF WEO Oct 2025
**New release:** IMF WEO April 2026 — analytical chapters April 8, main chapter April 14, 2026

**GDP per capita comparison (nominal USD, data.js vs latest IMF/StatisticsTimes figures):**

| Country | data.js gdpCap | IMF Oct 2025 / Apr 2026 estimate | Delta | Rank impact |
|---------|---------------|----------------------------------|-------|-------------|
| Ireland | 106,000 | ~129,132 (2025 actual) | +22% | Significant — intensity would DROP, rank improves |
| Switzerland | 105,670 | ~118,173 | +12% | Intensity drops, rank improves |
| Luxembourg | 131,300 | Not in top-50 list (est. ~140,000+) | unknown | Likely improving |
| UK | 56,660 | ~60,011 | +6% | Minor improvement |
| USA | 85,370 | ~92,883 | +9% | Intensity drops, rank improves |
| Norway | 90,430 | ~96,580 | +7% | Minor |
| Singapore | 88,450 | ~99,042 | +12% | Intensity drops, rank improves |
| Germany | 54,560 | ~63,600 | +17% | Notable improvement |
| France | 47,360 | ~51,708 | +9% | Minor |
| Australia | 66,590 | ~69,358 | +4% | Negligible |
| Japan | 33,140 | ~36,391 | +10% | Minor |
| Canada | 54,935 | ~58,244 | +6% | Minor |
| UAE | 51,350 | ~53,842 | +5% | Minor |
| Saudi Arabia | 32,530 | ~35,839 | +10% | Minor |
| South Korea | 34,160 | ~37,523 | +10% | Minor |
| Taiwan | 34,430 | ~41,586 | +21% | Significant — intensity drops |
| Israel | 53,370 | ~64,275 | +20% | Significant — intensity drops |
| Sweden | 58,530 | ~66,124 | +13% | Notable |
| Netherlands | 63,750 | ~77,881 | +22% | Significant |
| Denmark | 68,900 | ~82,706 | +20% | Significant |

**Source note:** StatisticsTimes.com citing "IMF World Economic Outlook (October 2025)" with page updated February 2026. IMF WEO April 2026 releases April 14 2026 — use that for the definitive update.

**Countries with ranking-relevant GDP shifts (>15% increase = intensity metric shifts meaningfully):**
- Ireland: +22% GDP growth → intensity falls from ~0.65 to ~0.53 kWh/$1,000 — currently rank 1, stays elite
- Netherlands: +22% → intensity falls significantly (currently rank 11 at 1.10)
- Denmark: +20% → intensity falls (currently rank 7 at 0.89)
- Israel: +20% → intensity falls (currently rank 17 at 1.36)
- Taiwan: +21% → intensity falls substantially (currently rank 55 at 3.43 — could improve 2-4 spots)
- Germany: +17% → intensity falls (currently rank 10 at 1.10)

**Needs update:** Yes — GDP per capita figures are stale by 1-2 years for most countries. Ireland in particular shows the largest delta (+22%). A full GDP refresh would shift rankings for several European countries (moving up) and tech-heavy economies. Recommend using IMF WEO April 2026 data once the database is updated (typically 1-2 weeks after release).

---

### 6. Enerdata Global Energy Yearbook 2025

**URL:** https://yearbook.enerdata.net/
**Publication:** 2025 edition (interactive, data through 2024)
**Access:** Free interactive application; detailed data requires registration

**Key 2024 findings (from Enerdata public summaries):**
- Global electricity consumption grew +4% in 2024 (vs 2.7%/year average 2010-2019 and in 2023)
- China: +7%, now ~33% of global electricity consumption
- India: +4% (slower than 2023)
- Brazil: +6%
- Russia: +2%
- South Africa: +3%
- USA: +2% (driven by industry, data centers, EVs, cooling)

**Relevance to data.js:**
- Confirms the directional trend: China's intensity is not improving at the same rate as its GDP growth implies — consumption growing faster than efficiency gains
- India's 4% demand growth against ~6% GDP growth = improving intensity (consistent with rank 65 at 4.94)
- The Enerdata yearbook is useful for cross-referencing Ember figures but does not offer free country-level TWh downloads
- Energy intensity of GDP page available at: https://yearbook.enerdata.net/total-energy/world-energy-intensity-gdp-data.html

**Needs update:** The Enerdata Yearbook is a corroborating reference, not a primary citation. Our data.js header lists "Energy Institute 2025" — Enerdata is a separate organization. Recommend clarifying source attribution in the header comment.

---

## Summary: What Needs Updating

### High priority

| Item | Current value | Updated value | Action |
|------|--------------|---------------|--------|
| India TWh | 1,957 | ~2,054 (Ember 2025) | Update data.js after Ember 2026 (Apr 21) |
| USA TWh | 4,273 | ~4,400 (Ember 2025) | Update data.js after Ember 2026 |
| China TWh | 9,443 | ~9,500-9,800 (Ember 2025) | Update data.js after Ember 2026 |
| GDP per capita — all countries | Various (2023-era) | IMF WEO Apr 2026 | Update after Apr 14 2026 WEO database refresh |
| Source header comment | "IMF WEO Oct 2025" | "IMF WEO Apr 2026" | Update citation in data.js |

### Medium priority

| Item | Current value | Issue | Action |
|------|--------------|-------|--------|
| GPE_IMPROVEMENT_DATA (2024 bar) | 1.0% | Confirmed correct by IEA | No change needed |
| GPE_IMPROVEMENT_DATA (2025 bar) | Not in chart | IEA shows 1.8% for 2025 | Add 2025 data point to chart |
| GPE_PERIOD_AVERAGES USA p3 | 4.0%/year | This was energy-crisis spike; 2025 pace <1% | Add footnote on period end date |
| GPE_PERIOD_AVERAGES EU p3 | 5.0%/year | Same — 2025 pace <1% | Add footnote on period end date |
| Data center scenarios | "Base Case" / "High Growth" | IEA now uses Headwinds/Base/Lift-Off | Consider renaming "High Growth" → "Lift-Off" |

### Low priority / monitoring

| Item | Status | Action |
|------|--------|--------|
| 945 TWh 2030 projection | Confirmed current | No change |
| 2024 data center baseline (415 TWh) | Confirmed | No change |
| SDG7 citation | Generic "World Bank" | Specify: "Tracking SDG7: Energy Progress Report 2025" |
| Enerdata citation | Listed as "Energy Institute 2025" | Clarify — separate organizations |

---

## New Country Candidates

Based on current source review, no new countries with sufficient data quality were identified that would clearly merit inclusion in the 75-country ranking. The following are worth monitoring:

- **Vietnam** (rank 70, 5.91 intensity): Enerdata and Ember confirm continued high growth in both GDP and consumption — intensity may shift 2-3 ranks
- **Bangladesh** (rank 42): IMF projects 5%+ GDP growth; consumption growing rapidly — could exit Elite tier
- **Philippines** (rank 39): IMF projects 5.73% GDP growth — one of fastest-growing; intensity improving
- **Ethiopia** (rank 6): Strong GDP growth but electricity data reliability concerns — worth flagging

---

## Ember 2026 Watch

The Ember Global Electricity Review 2026 launches April 21, 2026 — 15 days from this verification date. It will provide:
- 2025 electricity consumption data for 215 countries
- First comprehensive 2025 country-level TWh figures
- Updated generation mix data

**Recommendation:** Schedule a data.js refresh immediately after April 21 using Ember 2026 + IMF WEO April 2026 database (typically available ~2 weeks post-release). This will be the most significant data update since the current version was created.

---

*Sources consulted:*
- [IEA Energy Efficiency 2025](https://www.iea.org/reports/energy-efficiency-2025)
- [IEA Energy Efficiency 2025 — PDF](https://iea.blob.core.windows.net/assets/ab3e1064-1eb0-49fc-b039-38f6d3749e0a/EnergyEfficiency2025.pdf)
- [IEA Global Progress on Energy Efficiency Picks Up in 2025 (news)](https://www.iea.org/news/global-progress-on-energy-efficiency-picks-up-in-2025)
- [Ember Global Electricity Review 2025](https://ember-energy.org/latest-insights/global-electricity-review-2025/)
- [Ember Global Electricity Review 2026 (launch)](https://ember-energy.org/latest-updates/launch-of-the-global-electricity-review-2026/)
- [Ember European Electricity Review 2026](https://ember-energy.org/latest-insights/european-electricity-review-2026/)
- [IEA Energy and AI — Energy Demand from AI](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai)
- [IEA Energy and AI — Executive Summary](https://www.iea.org/reports/energy-and-ai/executive-summary)
- [DCD: IEA data center 945 TWh](https://www.datacenterdynamics.com/en/news/iea-data-center-energy-consumption-set-to-double-by-2030-to-945twh/)
- [Carbon Brief: AI data-centre energy context (Sep 2025)](https://www.carbonbrief.org/ai-five-charts-that-put-data-centre-energy-use-and-emissions-into-context/)
- [S&P Global: IEA data center power demand to double](https://www.spglobal.com/energy/en/news-research/latest-news/electric-power/041025-global-data-center-power-demand-to-double-by-2030-on-ai-surge-iea)
- [World Bank SDG7 Tracking 2025](https://www.worldbank.org/en/topic/energy/publication/tracking-sdg-7-the-energy-progress-report-2025)
- [Tracking SDG7 ESMAP 2025](https://trackingsdg7.esmap.org)
- [IMF WEO April 2026](https://www.imf.org/en/publications/weo/issues/2026/04/14/world-economic-outlook-april-2026)
- [IMF GDP per capita datamapper](https://www.imf.org/external/datamapper/NGDPDPC@WEO)
- [StatisticsTimes IMF WEO 2026 projections](https://statisticstimes.com/economy/projected-world-gdp-ranking.php)
- [Enerdata Global Energy Yearbook 2025](https://yearbook.enerdata.net/)
- [Enerdata World Power Consumption](https://yearbook.enerdata.net/electricity/electricity-domestic-consumption-data.html)
- [Enerdata Energy Intensity of GDP](https://yearbook.enerdata.net/total-energy/world-energy-intensity-gdp-data.html)
- [IEA World Energy Outlook 2025](https://www.iea.org/reports/world-energy-outlook-2025)
- [IEA Global Energy Review 2025 — Electricity](https://www.iea.org/reports/global-energy-review-2025/electricity)

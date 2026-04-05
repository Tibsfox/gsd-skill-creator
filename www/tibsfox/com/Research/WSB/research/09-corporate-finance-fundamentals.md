# Corporate Finance Fundamentals

> **Domain:** Corporate Finance & Valuation
> **Module:** 9 -- NPV, Cost of Capital, Valuation Drivers, DCF Analysis
> **Through-line:** *Every company's value reduces to three numbers: how fast it grows, how much it keeps, and how efficiently it converts capital into revenue. The discipline of corporate finance exists to make these numbers rigorous.*
> **Source:** Aswath Damodaran, NYU Stern School of Business (5 lectures); Full Financial Accounting Course
> **Rosetta Clusters:** Business (primary), Science, AI & Computation

---

## Table of Contents

1. [The Three Drivers of Value](#1-the-three-drivers-of-value)
2. [Time Value of Money](#2-time-value-of-money)
3. [Cost of Capital](#3-cost-of-capital)
4. [Discounted Cash Flow Valuation](#4-discounted-cash-flow-valuation)
5. [Capital Structure](#5-capital-structure)
6. [The Magnificent Seven Case Study](#6-the-magnificent-seven-case-study)
7. [Common-Size Financial Analysis](#7-common-size-financial-analysis)
8. [Narrative and Numbers](#8-narrative-and-numbers)
9. [Study Topics](#9-study-topics)
10. [DIY Sessions](#10-diy-sessions)
11. [Cross-Cluster Connections](#11-cross-cluster-connections)
12. [Sources](#12-sources)

---

## 1. The Three Drivers of Value

Aswath Damodaran's framework reduces the complexity of corporate valuation to three fundamental drivers. Every financial analysis, every investment decision, every strategic choice ultimately affects one or more of these numbers.

| Driver | Definition | Effect on Value | How to Measure |
|--------|-----------|-----------------|----------------|
| **Revenue Growth** | Rate at which top-line revenue increases | Higher growth → higher value | Year-over-year revenue change % |
| **Operating Margins** | Fraction of revenue converted to operating profit | Higher margins → higher value | Operating income / Revenue |
| **Sales-to-Capital Ratio** | Revenue generated per dollar of invested capital | Higher ratio → higher value (less reinvestment needed) | Revenue / (Total capital - cash) |

**The Perfect Company** would have all three at maximum: growing fast, profitably, with minimal capital requirements. In practice, companies face trade-offs — a company might sacrifice margins to accelerate growth, or accept slower growth to preserve capital efficiency.

**Design Your Company:**
- High growth + high margins + high capital efficiency = the Magnificent Seven
- High growth + low margins + high capital efficiency = Amazon (early years)
- Low growth + high margins + low capital efficiency = utilities
- Low growth + low margins + low capital efficiency = value trap

---

## 2. Time Value of Money

The foundational principle of all finance: a dollar today is worth more than a dollar tomorrow.

### Present Value

**PV = FV / (1 + r)^t**

Where:
- PV = present value (what it's worth today)
- FV = future value (what you'll receive later)
- r = discount rate (opportunity cost of capital)
- t = time periods until receipt

### Net Present Value (NPV)

**NPV = -Initial Investment + Σ [Cash Flow_t / (1 + r)^t]**

Decision rule: Accept projects where NPV > 0. This means the project generates more value than its cost, accounting for the time value of money.

### Internal Rate of Return (IRR)

The discount rate that makes NPV = 0. In other words, the project's effective rate of return.

**Decision rule:** Accept if IRR > cost of capital.

**Warning:** IRR can give misleading results for non-conventional cash flows (multiple sign changes) or mutually exclusive projects. Always use NPV as the primary criterion.

### Key Formulas

| Concept | Formula | Use Case |
|---------|---------|----------|
| Present Value | FV / (1+r)^t | Valuing a single future payment |
| Annuity PV | C × [(1 - (1+r)^-t) / r] | Valuing equal periodic payments |
| Perpetuity PV | C / r | Valuing infinite equal payments |
| Growing Perpetuity PV | C / (r - g) | Terminal value in DCF (Gordon Growth) |

---

## 3. Cost of Capital

The discount rate used in valuation represents the **opportunity cost** of investing in this company rather than alternatives of equivalent risk.

### Cost of Equity (CAPM)

**k_e = r_f + β × (r_m - r_f)**

Where:
- r_f = risk-free rate (typically 10-year Treasury yield)
- β = beta (sensitivity to market movements)
- r_m - r_f = equity risk premium (compensation for bearing market risk)

### Weighted Average Cost of Capital (WACC)

**WACC = (E/V) × k_e + (D/V) × k_d × (1 - T)**

Where:
- E/V = equity proportion of total capital
- D/V = debt proportion of total capital
- k_d = cost of debt (yield on company's bonds)
- T = corporate tax rate (debt interest is tax-deductible)

### Practical Estimation

| Input | How to Estimate | Current Range (2026) |
|-------|----------------|---------------------|
| Risk-free rate | 10-year Treasury yield | ~4.0-4.5% |
| Equity risk premium | Historical or implied | ~5.0-6.0% |
| Beta | Regression of stock vs. market returns | Company-specific |
| Cost of debt | Yield on comparable bonds | Company-specific |
| Tax rate | Effective rate from financial statements | ~21% federal + state |

---

## 4. Discounted Cash Flow Valuation

The DCF model estimates intrinsic value by projecting future free cash flows and discounting them to present value.

### Free Cash Flow to Firm (FCFF)

**FCFF = EBIT × (1 - Tax Rate) + Depreciation - Capital Expenditures - Change in Working Capital**

Or equivalently:

**FCFF = Revenue × Operating Margin × (1 - Tax Rate) - Reinvestment**

Where reinvestment is driven by the sales-to-capital ratio: higher ratio means less reinvestment needed per dollar of growth.

### The Two-Stage DCF Model

**Stage 1: Explicit Forecast (typically 5-10 years)**
- Project revenue growth, margins, and reinvestment year by year
- Growth rate starts at current level, converges toward stable growth

**Stage 2: Terminal Value**
- Assumes company reaches steady state
- Terminal Value = FCFF_terminal / (WACC - g_terminal)
- g_terminal must be ≤ long-term GDP growth (typically 2-3%)

**Intrinsic Value = PV(Stage 1 cash flows) + PV(Terminal Value) - Debt + Cash**

### Common Mistakes

1. **Growth that exceeds GDP forever** — no company can outgrow the economy in perpetuity
2. **Margins that defy industry gravity** — competition erodes abnormal profitability over time
3. **Ignoring reinvestment** — growth requires capital; "free" growth doesn't exist
4. **Circular WACC** — using market weights when the market price is what you're trying to determine
5. **Terminal value dominance** — if 80%+ of value is in terminal value, your model is mostly a guess

---

## 5. Capital Structure

Capital structure — the mix of debt and equity financing — affects both the cost of capital and the risk profile of the firm.

### The Modigliani-Miller Framework

**Proposition I (no taxes):** Capital structure is irrelevant in a frictionless world.
**Proposition I (with taxes):** Debt creates value through the tax shield (interest is deductible).
**Practical reality:** Trade-off between tax benefits of debt and costs of financial distress.

### Debt vs. Equity Comparison

| Dimension | Debt | Equity |
|-----------|------|--------|
| Cost | Lower (tax-deductible, senior claim) | Higher (residual claim, no tax benefit) |
| Obligation | Fixed payments required | No fixed obligation |
| Risk | Increases financial risk | Dilutes ownership |
| Control | No voting rights | Voting rights |
| Flexibility | Restricts (covenants) | Preserves |

### Comparative Analysis: Hosain vs. Gil

From Damodaran's in-class demonstration:

| Metric | Hosain | Gil |
|--------|--------|-----|
| Debt/Total Capital | 50% | 72% |
| Equity/Total Capital | 50% | 28% |
| Current Ratio | ~2.0x | ~1.25x |
| Operating Margin | Lower | Higher |
| Financial Stability | **Strong** | Risky |
| Profitability | Moderate | **Higher** |

**Conclusion:** Gil generates higher returns but with significantly more financial risk. Hosain has a "much more stable financial position" — better positioned for economic downturns, more borrowing capacity in reserve.

---

## 6. The Magnificent Seven Case Study

The Mag Seven demonstrate what Damodaran calls the "magic trick" — achieving all three value drivers simultaneously, at scale.

### Why They're Special

Most companies face a growth-profitability trade-off: you can grow fast (investing heavily) or be highly profitable (harvesting), but rarely both. The Mag Seven broke this constraint through:

1. **Near-zero marginal costs** — software and digital services scale without proportional capital
2. **Network effects** — each user makes the platform more valuable for all users
3. **Data advantages** — proprietary data creates self-reinforcing competitive moats
4. **Platform business models** — capturing value from ecosystems, not just products

### The Scale Achievement

> "There are some companies that can do this when they're $50 million companies, but these are companies that have been able to do it as 50 billion, 100 billion, 200 billion, 500 billion companies."

This is the extraordinary part — sustaining the magic trick as revenue grows 10,000x. Historical precedent suggested that as companies scale, growth slows, margins compress, and capital efficiency decreases. The Mag Seven defied all three.

### Valuation Implications

When the three drivers are all positive and sustainable:
- Terminal value assumptions become the dominant factor
- The key debate shifts to **how long** the magic trick can last
- "Duration" of competitive advantage becomes the central variable

---

## 7. Common-Size Financial Analysis

Damodaran's comparative methodology for evaluating companies regardless of absolute size.

### Income Statement (Vertical Analysis)

Set revenue = 100%. Express every line item as a percentage:

```
Revenue:                     100.0%
  Cost of Goods Sold:        -60.0%
Gross Profit:                 40.0%
  SG&A:                      -15.0%
  R&D:                        -8.0%
Operating Income:              17.0%
  Interest Expense:            -2.0%
  Taxes:                       -3.8%
Net Income:                    11.2%
```

This reveals the company's **cost structure** independent of scale.

### Balance Sheet (Vertical Analysis)

Set total assets = 100%:

```
Current Assets:               25.0%
Long-term Assets:              75.0%
Total Assets:                 100.0%

Current Liabilities:           12.5%
Long-term Liabilities:         37.5%
Total Liabilities:             50.0%
Shareholders' Equity:          50.0%
Total L + SE:                 100.0%
```

This reveals the company's **capital structure** and **asset composition** independent of scale.

---

## 8. Narrative and Numbers

Damodaran's integration of qualitative and quantitative analysis:

> Every valuation begins with a **story** — a narrative about what the company does, how it competes, and where it's headed. The numbers are the translation of that story into financial assumptions.

**The Process:**
1. **Craft the narrative** — What is this company? What market does it serve? What's its competitive advantage?
2. **Map narrative to drivers** — The story implies specific growth rates, margin trajectories, capital needs
3. **Build the model** — Translate assumptions into a DCF
4. **Test for consistency** — Do the numbers tell the same story? If you're projecting 30% growth with 5% capital spending, is that realistic?
5. **Update as reality unfolds** — New data should update both the story and the numbers

---

## 9. Study Topics

### Foundational
1. Time value of money — calculate PV, FV, NPV, IRR by hand
2. The three drivers — identify growth, margins, capital efficiency for any public company
3. Read a 10-K — find revenue, operating income, capex, working capital changes
4. Financial statement relationships — how income statement feeds balance sheet feeds cash flow

### Intermediate
5. WACC estimation — build a cost of capital from first principles
6. Free cash flow calculation — FCFF and FCFE from financial statements
7. Relative valuation — when to use P/E vs. EV/EBITDA vs. P/S
8. Capital structure analysis — common-size balance sheet comparison

### Advanced
9. Full DCF model construction — explicit forecast + terminal value + sensitivity tables
10. Real options in corporate finance — option to expand, abandon, wait
11. Cross-border valuation — country risk premiums, currency effects
12. Financial distress prediction — Altman Z-score, Merton model

---

## 10. DIY Sessions

### Session 1: Three-Driver Analysis (1 hour)
Pick three companies from different sectors. For each, calculate: (a) 5-year average revenue growth, (b) current operating margin, (c) sales-to-capital ratio. Rank them. Which would Damodaran say is the most "magic trick" company? Which is a value trap?

### Session 2: Build a DCF (3 hours)
Choose a company you understand. Download 5 years of financials from SEC EDGAR. Build a 10-year explicit forecast with converging growth rates. Add a terminal value. Discount at WACC. Compare your intrinsic value to the market price. What does the market know that you don't (or vice versa)?

### Session 3: Capital Structure Detective (1.5 hours)
Compare the balance sheets of a tech company (e.g., Meta), a utility (e.g., Duke Energy), and a bank (e.g., JPMorgan). Use common-size analysis. Why are their structures so different? What industry characteristics drive the differences?

### Session 4: Narrative Valuation (2 hours)
Write a one-page narrative for a company you're interested in. What's the story? Then translate it: what growth rate does the story imply? What margins? What capital needs? Build the DCF from the narrative, not from historical trend extrapolation. Compare the two approaches.

---

## 11. Cross-Cluster Connections

### Corporate Finance → Infrastructure (INF)
Infrastructure projects are the ultimate test of DCF analysis: massive upfront investment, uncertain long-term cash flows, government regulation of returns. Cost of capital estimation becomes critical — public infrastructure often uses the social discount rate rather than private WACC.

### Corporate Finance → Energy (NRG)
Energy companies present unique valuation challenges: commodity price sensitivity, reserve estimation, depletion accounting. The three-driver framework still applies but with additional dimensions — how do you model revenue growth when your product price is set by global markets?

### Corporate Finance → AI & Computation (AIC)
AI companies have redefined capital efficiency. The Mag Seven's "magic trick" is fundamentally an AI story — software that scales without proportional capital, data moats that strengthen with use, and algorithmic optimization of operations. Understanding their valuations requires understanding this technological leverage.

### Corporate Finance → Science (SCI)
Damodaran's quantitative approach mirrors the scientific method: hypothesis (narrative) → prediction (cash flow projections) → testing (comparison to market) → revision (updated valuation). The DCF model is essentially a mathematical model of a company, subject to the same rigor and limitations as any scientific model.

---

## 12. Sources

| Source | Type | Authority |
|--------|------|-----------|
| Aswath Damodaran, NYU Stern | Academic Lectures | **Gold** — globally recognized authority on valuation |
| "Investment Valuation" (Damodaran, Wiley) | Textbook | Gold — standard reference |
| "The Little Book of Valuation" (Damodaran) | Practitioner guide | Gold — accessible introduction |
| Damodaran Online (pages.stern.nyu.edu/~adamodar/) | Data & Tools | Gold — free datasets, updated annually |
| SEC EDGAR | Primary source | Gold — official company filings |
| Full Financial Accounting Course (YouTube) | Educational content | Silver — comprehensive university-level |

# Venture Economics and Cap Tables

> **Domain:** Startup Finance & Equity Management
> **Module:** 14 -- Cap Tables, 409A Valuations, Founder Equity, Fundraising Due Diligence
> **Through-line:** *A cap table is not a spreadsheet — it is the authoritative ledger of who owns what fraction of a company, and getting it wrong is one of the fastest ways to kill a fundraise. Clean cap tables signal operational competence; messy ones signal risk.*
> **Source:** Aista Cap Table Webinar (Sam Wong, Thomas M); MIT/Yale Mathematics in Finance (Dr. Jake Shaw, Dr. Vasily Estrella)
> **Rosetta Clusters:** Business (primary), AI & Computation, Infrastructure

---

## Table of Contents

1. [What Is a Cap Table](#1-what-is-a-cap-table)
2. [Equity Instruments](#2-equity-instruments)
3. [Founder Equity](#3-founder-equity)
4. [The Option Pool](#4-the-option-pool)
5. [409A Valuations](#5-409a-valuations)
6. [Fundraising Rounds](#6-fundraising-rounds)
7. [Dilution Mechanics](#7-dilution-mechanics)
8. [Due Diligence](#8-due-diligence)
9. [Quantitative Finance Foundations](#9-quantitative-finance-foundations)
10. [Study Topics](#10-study-topics)
11. [DIY Sessions](#11-diy-sessions)
12. [Cross-Cluster Connections](#12-cross-cluster-connections)
13. [Sources](#13-sources)

---

## 1. What Is a Cap Table

A capitalization table (cap table) is the **authoritative ledger** of all current and pending shareholders in a startup. It tracks every share, option, warrant, and convertible instrument — who holds it, when it was granted, at what price, and under what terms.

**Key principle:** Most founders think they can track this in a spreadsheet. They would be wrong. As the Aista webinar makes explicit: "Simple spreadsheets are insufficient to manage the complexity." By the time a startup has two founders, an employee option pool, angel investors, and a SAFE note, the interactions between instruments create a combinatorial problem that spreadsheets handle poorly and dangerously.

### Why It Matters

- **Fundraising:** Investors scrutinize cap tables during due diligence. A messy table signals operational risk
- **Compliance:** Stock option pricing requires 409A valuations — errors create tax liability
- **Decision-making:** Founders need to understand dilution effects before accepting terms
- **Exit planning:** Liquidation preferences, participation rights, and conversion ratios determine who gets paid and in what order

### Professional Tools

| Tool | Focus | Scale |
|------|-------|-------|
| **Aista** | Cap table management, 409A valuations | 15,000+ clients, $50B+ AUM |
| **Carta** | Equity management, compliance | Enterprise-scale |
| **Pulley** | Early-stage simplicity | Seed to Series B |
| **LTSE Equity** | Long-term focused | Mission-aligned companies |

---

## 2. Equity Instruments

A startup's cap table tracks multiple types of equity instruments, each with different rights, preferences, and economic characteristics.

### Common Stock

The base layer of ownership. Founders and employees hold common stock (or options to purchase common stock).

| Feature | Detail |
|---------|--------|
| Voting rights | Typically 1 vote per share |
| Dividends | Rare in startups — if paid, common receives last |
| Liquidation | Paid after all preferred stock claims satisfied |
| Valuation | Lower than preferred (lack of preferences = lower value) |

### Preferred Stock

Investor-class equity with economic protections. Each fundraising round creates a new series (Series Seed, Series A, Series B, etc.).

**Key preferences:**
- **Liquidation preference** — investors get their money back first (1x is standard, 2x+ is aggressive)
- **Anti-dilution protection** — if the company raises at a lower price later, preferred holders' conversion ratio adjusts
- **Participation rights** — some preferred shares "double dip" (get liquidation preference AND share in remaining proceeds)
- **Conversion rights** — preferred converts to common, typically at IPO or acquisition

### Stock Options

Rights to purchase shares at a fixed price (the "strike" or "exercise" price) in the future. Issued from the option pool.

**Vesting schedule (standard):**
- 4-year total vesting period
- 1-year cliff (nothing vests until 12 months)
- Monthly vesting thereafter (1/48th per month after cliff)

**Exercise price** must be set at fair market value (FMV) as determined by a 409A valuation.

### Convertible Instruments

| Instrument | How It Works | When It Converts |
|------------|-------------|-----------------|
| **SAFE** (Simple Agreement for Future Equity) | Investor pays now, receives shares later | At next priced round |
| **Convertible Note** | Debt instrument that converts to equity | At next priced round or maturity |

**Key terms:**
- **Valuation cap** — maximum valuation at which the instrument converts (protects early investors)
- **Discount** — percentage reduction on the conversion price (typically 15-25%)
- **Interest rate** (notes only) — accrues and converts to additional shares
- **MFN clause** — "most favored nation" gives investor the best terms issued to any subsequent investor

### Warrants

Rights to purchase shares at a set price, typically issued alongside debt financing or as compensation to advisors.

---

## 3. Founder Equity

Founder equity splits are "a lot more complex than people realize." The webinar emphasizes that this decision — made in the first weeks of a company — has consequences that persist for years.

### Split Considerations

| Factor | Weight | Notes |
|--------|--------|-------|
| **Idea origination** | Low-Medium | Ideas are cheap; execution matters more |
| **Full-time commitment** | High | Full-time founders should hold more than part-time |
| **Domain expertise** | Medium | Relevant experience accelerates execution |
| **Capital contribution** | Medium | Cash in exchange for additional equity |
| **Network and relationships** | Medium | Access to customers, investors, talent |
| **Role going forward** | High | CEO and CTO roles carry different demands |

### Common Patterns

- **Equal split (50/50 or 33/33/33):** Simple but often inaccurate — rarely do founders contribute equally over time
- **Unequal split reflecting contributions:** More realistic but requires honest negotiation
- **Dynamic equity (Slicing Pie model):** Equity adjusts based on ongoing contributions — theoretically fair but complex to administer

### Vesting for Founders

Founders should vest their own shares. Standard: 4-year vesting with 1-year cliff, sometimes with acceleration on change of control.

**Why founders vest:** If a co-founder leaves after 6 months with 50% of the company, the remaining founder faces an impossible fundraising situation. Vesting protects against this.

---

## 4. The Option Pool

The employee stock option pool is a reserved block of shares allocated for future employee grants.

### Sizing

| Stage | Typical Pool Size | Notes |
|-------|------------------|-------|
| Formation | 10-15% | Pre-investment |
| Post-Seed | 10-15% | Often increased before Seed round |
| Post-Series A | 15-20% | VCs typically require pool expansion pre-close |

### The Pre-Money Pool Shuffle

Investors frequently require the option pool to be sized (or increased) **before** their investment, which means the dilution from the pool comes entirely from founders, not investors. This is one of the most important economic negotiations in a fundraise.

**Example:**
- Pre-money valuation: $10M
- Investor wants 20% option pool established pre-money
- Effective pre-money to founders: $10M - $2M pool = $8M
- The "headline" valuation of $10M is misleading — the economic reality is $8M

### Grant Methodology

| Level | Typical Grant (early stage) | Vesting |
|-------|---------------------------|---------|
| VP/C-level hire | 1-2% | 4yr/1yr cliff |
| Director | 0.25-0.5% | 4yr/1yr cliff |
| Senior engineer | 0.1-0.25% | 4yr/1yr cliff |
| Junior employee | 0.01-0.05% | 4yr/1yr cliff |

---

## 5. 409A Valuations

Section 409A of the Internal Revenue Code requires that stock options be priced at "fair market value" at the time of grant. A 409A valuation is the formal process of determining that FMV.

### Why It Exists

If options are granted below FMV (a "cheap stock" problem), the difference is treated as taxable income to the employee at vesting — plus a 20% penalty tax. The 409A valuation provides a safe harbor against this.

### Valuation Methods

| Method | Approach | Best For |
|--------|----------|----------|
| **Market approach** | Comparable company transactions | Companies with public comps |
| **Income approach** | Discounted cash flow | Revenue-generating companies |
| **Asset approach** | Net asset value | Pre-revenue / asset-heavy |
| **Backsolve** | Work backward from most recent round price | Post-funding companies |
| **Option Pricing Model (OPM)** | Black-Scholes for each equity class | Complex capital structures |

### Practical Requirements

- Must be performed by a qualified independent appraiser (NACV certification referenced in the Aista webinar)
- Valid for 12 months or until a material event (new funding round, major contract, pivot)
- Should be obtained **before** granting options, not retroactively
- Cost: $5K-$25K depending on complexity

### Common vs. Preferred Discount

The 409A valuation determines the **common stock** price, which is always lower than the preferred stock price investors paid. The difference (the "discount for lack of marketability" or DLOM) typically ranges from 20-50% for early-stage companies. This discount reflects that common stock lacks the preferences, protections, and liquidity of preferred stock.

---

## 6. Fundraising Rounds

### Typical Progression

| Round | Amount | Valuation Range | Investors |
|-------|--------|----------------|-----------|
| **Pre-Seed** | $50K-$500K | $1M-$5M | Friends/family, angels |
| **Seed** | $500K-$3M | $3M-$15M | Angels, seed funds |
| **Series A** | $3M-$15M | $15M-$50M | Venture capital |
| **Series B** | $15M-$50M | $50M-$200M | Venture capital |
| **Series C+** | $50M+ | $200M+ | Late-stage VC, growth equity |

### What Investors Examine

During due diligence, investors review:

1. **Cap table accuracy** — Do all the numbers add up? Are all instruments properly recorded?
2. **Founder vesting** — Are founders vested? What happens if one leaves?
3. **Option pool** — How much is allocated? How much has been granted? What's remaining?
4. **Prior instruments** — Any SAFEs, convertible notes, warrants? What are their terms?
5. **IP assignment** — Have all contributors assigned intellectual property to the company?
6. **83(b) elections** — Did founders file 83(b) elections within 30 days of receiving restricted stock?

### The Aista Scale

The webinar reveals the scale of their operation:
- 15,000+ startup clients
- $50B+ in assets under management
- NACV-certified 409A valuation team
- Integration with legal, accounting, and investor platforms

---

## 7. Dilution Mechanics

Every time a company issues new shares — whether through fundraising, option grants, or convertible instrument conversion — existing shareholders are diluted.

### Basic Dilution Example

```
FORMATION
  Founder A:  6,000,000 shares  (60%)
  Founder B:  4,000,000 shares  (40%)
  Total:     10,000,000 shares (100%)

OPTION POOL CREATION (15%)
  Founder A:  6,000,000 shares  (51.0%)
  Founder B:  4,000,000 shares  (34.0%)
  Option Pool:1,764,706 shares  (15.0%)
  Total:     11,764,706 shares (100%)

SEED ROUND ($500K on SAFE at $5M cap)
  [Converts at next priced round — shares TBD]

SERIES A ($2M at $10M pre-money)
  SAFE converts: 1,200,000 shares (10.0%)
  Series A:      2,400,000 shares (20.0%)
  Founder A:     6,000,000 shares (36.6%)
  Founder B:     4,000,000 shares (24.4%)
  Option Pool:   1,764,706 shares (10.8%)
  Total:        16,364,706 shares (~100%)
```

### Fully Diluted vs. Basic

- **Basic share count:** Only issued and outstanding shares
- **Fully diluted:** Includes all shares that *could* exist — outstanding shares + all options (vested and unvested) + all warrants + all convertible instruments

Investors always think in fully diluted terms. Founders should too.

---

## 8. Due Diligence

The cap table is the first financial document investors examine. Common red flags:

### Red Flags

| Issue | Why It's a Problem |
|-------|-------------------|
| **Spreadsheet-only tracking** | Error-prone, no audit trail, formula mistakes compound |
| **Missing 83(b) elections** | Creates massive tax liability for founders |
| **No 409A valuation** | Options may be improperly priced — IRS exposure |
| **Departed founders with large holdings** | Dead equity reduces investor returns |
| **Unclear IP assignment** | Company may not own its own technology |
| **Excessive convertible instruments** | Conversion creates unpredictable dilution |
| **Side letters or undisclosed agreements** | Hidden terms undermine trust |

### Best Practices

1. Use professional cap table software from day one
2. Maintain a single source of truth — never parallel spreadsheets
3. Get a 409A valuation before granting any options
4. Ensure all founders have vesting schedules and 83(b) elections on file
5. Keep a clean option pool ledger with grant dates, exercise prices, vesting schedules
6. Update the cap table immediately when any equity event occurs
7. Have legal counsel review before any fundraise

---

## 9. Quantitative Finance Foundations

The MIT/Yale Mathematics in Finance course (Dr. Jake Shaw, Dr. Vasily Estrella) provides the mathematical foundations that underpin venture valuation and option pricing.

### Mathematical Toolkit

| Domain | Application in Venture Finance |
|--------|-------------------------------|
| **Linear algebra** | Portfolio optimization, correlation matrices across startup cohorts |
| **Probability theory** | Expected value calculations for venture returns (power law distributions) |
| **Statistics** | Parameter estimation for comparable company analysis |
| **Stochastic calculus** | Option pricing models (Black-Scholes) used in 409A OPM valuations |

### The Black-Scholes Connection

The Option Pricing Model (OPM) used in 409A valuations is a direct application of Black-Scholes:

**C = S × N(d1) - K × e^(-rT) × N(d2)**

Where:
- C = option value
- S = current stock price
- K = strike price
- r = risk-free rate
- T = time to expiration
- N() = cumulative standard normal distribution
- d1, d2 = intermediate calculations involving volatility

In 409A context, each class of equity (common, Series A preferred, Series B preferred) is modeled as a call option on the company's total equity value, with different strike prices corresponding to liquidation preferences.

### Power Law Returns

Venture capital returns follow a **power law distribution**, not a normal distribution:
- Most investments return 0-1x
- A small number return 10-100x
- The entire fund's return depends on 1-2 outliers

This mathematical reality shapes everything about how VCs invest: they need each individual bet to have the *potential* for 100x, because most will fail.

---

## 10. Study Topics

### Beginner
1. Define cap table and explain why spreadsheets are insufficient
2. List the five main equity instruments and their characteristics
3. Explain the 4-year/1-year cliff vesting schedule
4. Calculate basic dilution for a single fundraising round

### Intermediate
5. Model a cap table from formation through Series A (including SAFE conversion)
6. Explain the pre-money option pool shuffle and its economic impact on founders
7. Describe the 409A valuation process and safe harbor requirements
8. Compare SAFE vs. convertible note terms and conversion mechanics

### Advanced
9. Build an Option Pricing Model (OPM) for a multi-class equity structure
10. Analyze a term sheet for hidden economic terms (participation, ratchets, pay-to-play)
11. Model liquidation waterfall scenarios (1x non-participating vs. 2x participating)
12. Apply Black-Scholes to 409A backsolve methodology

---

## 11. DIY Sessions

### Session 1: Cap Table Construction (2 hours)
**Materials:** Spreadsheet software or Aista/Pulley trial account
**Procedure:**
1. Two founders split equity 60/40 on 10M authorized shares
2. Reserve 15% option pool
3. Angel round: $500K on SAFE at $5M cap
4. Series A: $2M at $10M pre-money valuation
5. Calculate dilution at each stage for all parties
6. Model 5 employee option grants with 4-year vesting, 1-year cliff
7. Compare fully diluted vs. basic share counts at each stage

### Session 2: 409A Valuation Analysis (1.5 hours)
**Materials:** Public 409A methodology guides, spreadsheet
**Procedure:**
1. Choose a hypothetical startup (post-Seed, $2M ARR)
2. Estimate enterprise value using revenue multiples from comparable companies
3. Apply a 30% discount for lack of marketability (DLOM)
4. Calculate the per-share common stock price
5. Compare to the Series Seed preferred price — what's the ratio?
6. Discuss: would you exercise options at this price?

### Session 3: Liquidation Waterfall Modeling (2 hours)
**Materials:** Spreadsheet
**Procedure:**
1. Set up a company with: Common, Series Seed (1x non-participating), Series A (1x participating)
2. Model exit scenarios at $5M, $20M, $50M, $200M
3. Calculate payouts to each class at each exit price
4. Graph the payout curves — where do the "kinks" occur?
5. Compare: what exit price makes Series A indifferent between converting and taking preference?

### Session 4: Term Sheet Analysis (1.5 hours)
**Materials:** Sample term sheets (available from Y Combinator, NVCA)
**Procedure:**
1. Read the NVCA model term sheet
2. Identify all economic terms vs. control terms
3. Calculate the effective pre-money valuation after accounting for option pool shuffle
4. List all protective provisions — which give investors veto power?
5. Compare to the Y Combinator standard SAFE — what's simpler and what's missing?

---

## 12. Cross-Cluster Connections

### Venture Economics --> Trust System
Cap table management is **distributed ownership tracking** — tracking who owns what fraction of a shared entity with full provenance. This is structurally identical to federation resource allocation, where compute credits, storage quotas, and access rights must be tracked across distributed nodes. The trust system's verification model maps directly to cap table audit trails: every equity event must have a corresponding record that can be independently verified.

### Venture Economics --> Infrastructure
Infrastructure project financing introduces unique equity structures: public-private partnerships, tax equity in renewable energy projects, infrastructure REITs. The cap table concepts of preference stacking, conversion mechanics, and waterfall distributions all apply but with additional regulatory dimensions.

### Venture Economics --> AI & Computation
AI companies have redefined venture economics. The Magnificent Seven (from Module 09) achieved capital efficiency that conventional venture models didn't predict. For AI startups specifically: data moats create enterprise value that traditional 409A methods struggle to appraise, and compute costs create unusual capital structures (GPU leases as quasi-debt).

### Venture Economics --> Science
The MIT/Yale mathematics course bridges pure mathematics to financial practice. The stochastic calculus that prices options originated in physics (Brownian motion). Monte Carlo simulation — used for both Value at Risk and startup outcome modeling — is a computational technique borrowed from nuclear physics research at Los Alamos.

---

## 13. Sources

| Source | Type | Authority |
|--------|------|-----------|
| Aista Cap Table Webinar (Sam Wong, Thomas M) | Practitioner Webinar | Bronze — vendor-sponsored but substantive, industry data |
| MIT/Yale Mathematics in Finance | University Course | **Gold** — Creative Commons, multi-instructor, rigorous |
| Y Combinator SAFE Documents | Legal Templates | Gold — industry standard, publicly available |
| NVCA Model Legal Documents | Legal Templates | Gold — venture industry association standard |
| IRC Section 409A | Legal Authority | Gold — authoritative tax code |

# The Cap Table

> **Domain:** Business Law & Accounting
> **Module:** 6 -- Equity & Securities
> **Through-line:** *The cap table is the constitution of a company -- it defines who owns what, who controls what, and what happens when new money arrives.*
> **Disclaimer:** This document is educational research, not securities or tax advice. All equity compensation, securities, and tax decisions require consultation with qualified securities attorneys, tax advisors, and compensation specialists.

---

## Table of Contents

1. [Equity as Architecture](#1-equity-as-architecture)
2. [Stock Options](#2-stock-options)
3. [Restricted Stock Units](#3-restricted-stock-units)
4. [Phantom Equity](#4-phantom-equity)
5. [409A Valuations](#5-409a-valuations)
6. [Vesting Schedules](#6-vesting-schedules)
7. [Common vs. Preferred Stock](#7-common-vs-preferred-stock)
8. [Cap Table Management](#8-cap-table-management)
9. [Convertible Notes and SAFEs](#9-convertible-notes-and-safes)
10. [How Startups Structure Equity](#10-how-startups-structure-equity)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Equity as Architecture

Equity is not merely a financial instrument. It is the architectural blueprint of ownership -- who has a stake, how large that stake is, what rights it carries, and how it changes over time. In a startup, the equity structure determines how power and wealth are distributed among founders, employees, and investors. In a public company, it determines governance, dividend policy, and acquisition vulnerability. In a cooperative, it determines patronage allocation and democratic control [1][2].

The cap table (capitalization table) is the master record of this architecture. Every equity stake -- founder shares, investor preferred stock, employee options, advisor warrants, convertible notes, SAFEs -- is documented in the cap table. It answers the fundamental question: "Who owns this company?" [1][2]

Understanding equity is not optional for anyone building or joining a company. The founder who does not understand dilution will be surprised when their 50% becomes 15% after three funding rounds. The employee who does not understand vesting will leave money on the table. The investor who does not understand liquidation preferences will misunderstand their actual downside protection. Equity literacy is business literacy [1].

---

## 2. Stock Options

A stock option is the right to purchase a share of stock at a fixed price (the "exercise" or "strike" price) at a future date. The option has value when the stock's fair market value exceeds the strike price (the option is "in the money"). If the stock price falls below the strike price, the option is "underwater" and has no exercise value [3][4].

### Incentive Stock Options (ISOs)

ISOs receive favorable tax treatment under IRC Section 422:

- **At grant:** No taxable event
- **At exercise:** No ordinary income tax (if holding requirements met). However, the spread (FMV minus strike price) is an adjustment for Alternative Minimum Tax (AMT) purposes.
- **At sale (if qualified disposition):** Gain taxed as long-term capital gains (if shares held 1+ year after exercise AND 2+ years after grant)
- **ISO limit:** Maximum $100,000 in options that become exercisable in any calendar year (measured by FMV at grant)
- **Availability:** Only for employees (not contractors or advisors) [3][5]

### Non-Qualified Stock Options (NQSOs)

NQSOs do not receive ISO tax treatment:

- **At grant:** No taxable event (assuming strike price equals FMV)
- **At exercise:** Spread taxed as ordinary income (subject to income tax, Social Security, and Medicare)
- **At sale:** Gain above exercise-date FMV taxed as capital gains
- **Availability:** Can be granted to employees, contractors, advisors, board members [3][5]

### The Exercise Decision

Exercising options requires paying the strike price multiplied by the number of shares. For early-stage startups, the cost may be nominal ($0.001/share x 10,000 shares = $10). For later-stage companies, the cost can be significant. The employee must also consider tax consequences (particularly AMT exposure for ISOs) and liquidity risk (paying cash to own shares that cannot be sold until an IPO or acquisition) [3][4].

**Early exercise** (exercising before vesting is complete) allows employees to start the capital gains holding period earlier and potentially reduce AMT exposure. Section 83(b) elections permit early exercise -- the employee pays ordinary income tax on the spread at exercise (typically $0 for early-stage companies) and starts the capital gains clock immediately. The 83(b) election must be filed with the IRS within 30 days of exercise [5].

---

## 3. Restricted Stock Units

Restricted Stock Units (RSUs) are a promise to deliver shares of stock upon vesting. Unlike options, RSUs have no exercise price -- the employee receives the shares outright when they vest [3][6].

### Tax Treatment

- **At grant:** No taxable event
- **At vesting:** Fair market value of delivered shares is taxed as ordinary income (subject to income and payroll taxes)
- **At sale:** Gain above vesting-date FMV taxed as capital gains

### RSUs vs. Options

| Factor | Stock Options | RSUs |
|--------|--------------|------|
| **Cost to employee** | Must pay strike price | None (shares delivered free) |
| **Value if stock falls** | Potentially $0 (underwater) | Always has value (unless stock goes to $0) |
| **Tax timing** | At exercise (options) | At vesting (RSUs) |
| **Holding period** | Starts at exercise | Starts at vesting |
| **Early-stage companies** | Preferred (low strike price) | Less common (tax on illiquid shares) |
| **Late-stage/public companies** | Less common | Preferred (certain value, no exercise cost) |

RSUs have become the dominant equity compensation vehicle at large public companies (Google, Facebook/Meta, Amazon, Microsoft) because they always have value and require no action from the employee. Options remain common at startups because the low strike price and potential for capital gains treatment provide significant upside with minimal initial cost [3][6].

---

## 4. Phantom Equity

Phantom equity provides economic exposure to the company's value without issuing actual shares. It is a cash-based right that tracks the value of equity without creating additional shareholders [3][7].

### Stock Appreciation Rights (SARs)

SARs pay the holder the increase in stock value over a base price (similar to option spread). The payment is in cash (or sometimes stock). SARs are taxed as ordinary income when exercised [7].

### Phantom Stock

Phantom stock pays the holder the full value of a share (not just the appreciation). Units track the stock price but are settled in cash. Often used to simulate equity participation in LLCs, partnerships, and S-Corps where actual equity issuance would create complications [7].

### Why Phantom Equity

- **LLCs and partnerships** cannot easily issue "stock" -- phantom equity provides equity-like incentives without the complexity of partnership interest grants
- **S-Corps** have shareholder limits (100) and single-class-of-stock requirements that phantom equity does not trigger
- **Family businesses** that do not want to add outside shareholders can use phantom equity to incentivize key employees
- **Tax planning** -- phantom equity is deductible by the company when paid (as compensation expense) and taxed as ordinary income to the recipient [3][7]

---

## 5. 409A Valuations

Section 409A of the Internal Revenue Code requires that stock options and other deferred compensation arrangements be structured to comply with specific timing and pricing rules. For stock options, the critical requirement is that the option strike price must be no less than the fair market value (FMV) of the underlying stock on the date of grant [5][8].

### Why 409A Matters

If options are granted with a strike price below FMV (a "cheap stock" issue), severe tax consequences apply to the option holder:

- Ordinary income tax upon vesting (not exercise)
- Additional **20% penalty tax**
- Interest on the underpayment from the vesting date [5][8]

### The 409A Valuation Process

Private companies must obtain an independent valuation to establish FMV. The valuation typically uses three approaches:

- **Income approach:** Discounted cash flow analysis based on projected future earnings
- **Market approach:** Comparable company analysis or comparable transaction analysis
- **Asset approach:** Net asset value (primarily for holding companies or asset-heavy businesses) [8]

The IRS provides a safe harbor for valuations performed by qualified independent appraisers using generally accepted valuation methods. Valuations should be refreshed every 12 months or after any material event (new funding round, significant revenue change, acquisition offer, key customer gain/loss) [8].

### Practical Impact

409A valuations are a routine cost of startup operation. Typical cost: $2,000-$10,000 per valuation. The valuation establishes the option strike price, which directly affects the employee's potential gain. A lower 409A valuation means a lower strike price, which means more potential upside for option holders. This creates natural tension: companies want low valuations for option pricing, but the valuation must be defensible under IRS scrutiny [8].

---

## 6. Vesting Schedules

Vesting is the process by which an employee earns the right to their equity grant over time. Vesting protects the company from giving permanent ownership stakes to employees who leave quickly [3][4].

### Standard 4-Year Vesting with 1-Year Cliff

The most common vesting schedule in the startup ecosystem:

- **Year 1:** Nothing vests (the "cliff period")
- **Month 12:** 25% vests at once (the "cliff")
- **Months 13-48:** Remaining 75% vests monthly (1/48 per month)
- **Total:** 100% vested at 48 months

The cliff serves a specific purpose: if an employee leaves (or is terminated) before the first anniversary, they receive no equity. This protects the company from giving ownership to short-tenure employees. After the cliff, monthly vesting provides a smooth, continuous earn-out [3][4].

### Variations

- **3-year vesting:** Faster full vesting, sometimes used for senior hires or competitive markets
- **6-year vesting:** Longer retention tool, used by some public companies
- **Performance-based vesting:** Equity vests upon achieving specific milestones rather than (or in addition to) time-based triggers
- **Back-loaded vesting:** More equity vests in later years (Amazon's original RSU schedule: 5%, 15%, 40%, 40%)
- **Acceleration:** Single-trigger (vesting accelerates on acquisition) or double-trigger (vesting accelerates on acquisition AND termination) [4][6]

### Reverse Vesting for Founders

Founders who receive their shares at formation often subject those shares to reverse vesting: the founder owns all shares from day one but the company retains a right to repurchase unvested shares at the original purchase price if the founder departs. This structure is functionally equivalent to forward vesting but allows the founder to file an 83(b) election and start the capital gains clock immediately [4].

---

## 7. Common vs. Preferred Stock

### Common Stock

Common stock represents basic ownership in a corporation. Common stockholders have voting rights (typically one vote per share), receive dividends if declared by the board, and have a residual claim on assets in liquidation (after all debts and preferred stock claims are satisfied). Founders and employees typically hold common stock [1][9].

### Preferred Stock

Preferred stock is issued to investors and carries additional rights that protect their investment:

**Liquidation preference.** In a sale or dissolution, preferred stockholders receive their investment back (1x liquidation preference) before common stockholders receive anything. Participating preferred adds the right to share in remaining proceeds alongside common after the preference is satisfied. Non-participating preferred requires the holder to choose between the preference OR converting to common and sharing pro rata [9][10].

**Anti-dilution protection.** If the company raises future rounds at a lower valuation (a "down round"), anti-dilution provisions adjust the conversion ratio to protect preferred holders from dilution. Broad-based weighted average is the most common formula; full ratchet (converting at the lower price exactly) is more aggressive and less common [9][10].

**Board seats.** Preferred stock rounds typically include the right to appoint one or more directors to the company's board. Series A investors commonly receive one board seat [9].

**Protective provisions.** Preferred holders may have veto rights over major decisions: new equity issuance, debt above a threshold, change of control, amendment of charter, dividend declaration, or changes to board size [9][10].

**Information rights.** Rights to receive regular financial statements, annual budgets, and material event notifications [9].

---

## 8. Cap Table Management

The cap table must be maintained with precision. Errors in the cap table create legal liability, investor disputes, and tax complications. A clean cap table shows, at any point in time [1][2]:

- **All outstanding equity:** Common shares, preferred shares (by series), options (granted, exercised, available), warrants, convertible notes, SAFEs
- **Ownership percentages:** Fully diluted (including all options and convertibles as if exercised/converted) and outstanding (actual shares issued)
- **Investor rights:** Liquidation preferences, anti-dilution provisions, pro-rata rights, by series
- **Option pool:** Total shares reserved, granted, exercised, forfeited, available for future grants

### Dilution

When new shares are issued, existing shareholders' percentage ownership decreases. This is dilution. It is the fundamental mechanic of startup equity:

**Pre-money valuation:** The company's value before new investment.
**Post-money valuation:** Pre-money plus new investment.
**New investor ownership:** New investment / Post-money valuation.

Example: Company valued at $8M pre-money raises $2M. Post-money = $10M. New investor owns $2M / $10M = 20%. All existing shareholders are diluted by 20% of their previous holdings [1][2].

Founders must understand dilution across multiple rounds. A founder who starts with 50% after seed round might have 40% after Series A (20% dilution), 32% after Series B (20% dilution), and 25.6% after Series C (20% dilution). The founder's percentage decreased but the value of each share increased (if the company's value grew) [1][2].

---

## 9. Convertible Notes and SAFEs

### Convertible Notes

A convertible note is short-term debt that converts into equity at the next priced equity round. Key terms [1][10]:

- **Principal:** The investment amount
- **Interest rate:** Typically 2-8% annual; accrues and converts alongside principal
- **Maturity date:** When the note is repayable if no conversion event occurs (typically 18-24 months)
- **Valuation cap:** The maximum valuation at which the note converts (protects the investor from converting at an unexpectedly high valuation)
- **Discount:** Typically 15-25% discount to the next round's price (rewards the investor for early risk)

At conversion, the investor receives equity at the lower of: the cap-implied price or the discounted price from the next round. The investor always gets the better deal [1][10].

### SAFEs (Simple Agreement for Future Equity)

Y Combinator created the SAFE in 2013 as a simpler alternative to convertible notes:

- **Not debt.** No maturity date, no interest, no repayment obligation
- **Conversion trigger:** Next priced equity round
- **Key terms:** Valuation cap and/or discount (similar to convertible notes)
- **Post-money SAFEs (current standard):** The cap is expressed as a post-money valuation, making dilution predictable -- the investor knows exactly what percentage they will own at conversion [10][11]

### SAFE vs. Convertible Note

| Factor | Convertible Note | SAFE |
|--------|-----------------|------|
| **Legal nature** | Debt | Equity contract |
| **Maturity date** | Yes (repayable if no conversion) | No |
| **Interest** | Yes (accrues) | No |
| **Repayment obligation** | Yes (at maturity) | No |
| **Complexity** | Moderate | Simple |
| **Dilution predictability** | Lower (interest accrues) | Higher (post-money SAFE) |

SAFEs have become the dominant early-stage fundraising instrument because of their simplicity. Most YC companies and many non-YC startups use SAFEs for pre-seed and seed rounds [10][11].

---

## 10. How Startups Structure Equity

### Typical Equity Structure at Formation

| Stakeholder | Typical Allocation |
|-------------|-------------------|
| Founders (2-3) | 70-90% (split among founders, subject to reverse vesting) |
| Employee option pool | 10-20% (reserved for future employee grants) |
| Advisors | 0.5-2% each (subject to vesting) |

### Progression Through Rounds

| Round | Typical Raise | Dilution | Cumulative Founder Dilution |
|-------|--------------|----------|-----------------------------|
| Pre-seed (SAFE/Note) | $250K-$2M | 5-15% | 5-15% |
| Seed | $1M-$5M | 15-25% | 20-35% |
| Series A | $5M-$20M | 20-30% | 35-55% |
| Series B | $20M-$60M | 15-25% | 45-65% |
| Series C+ | $50M+ | 10-20% | 55-75% |

By IPO or acquisition, founders typically retain 10-25% of the company. The absolute value of that percentage, however, may be worth hundreds of millions or billions of dollars if the company has grown substantially [1][2].

---

## 11. Cross-References

| Project | Connection |
|---------|------------|
| [WSB](../WSB/index.html) | Startup formation -- equity structuring is the financial foundation of startup creation |
| [ACC](../ACC/index.html) | Equity accounting -- stock compensation expense, ASC 718, cap table reconciliation |
| [GRD](../GRD/index.html) | Optimization and valuation -- mathematical models underlying 409A valuations |
| [NND](../NND/index.html) | Cooperative equity -- contrasting cap table models with patronage-based equity |
| [WAL](../WAL/index.html) | Rosetta Stone -- equity as a translation layer between labor, capital, and ownership |

---

## 12. Sources

1. [Y Combinator: Cap Table Guide](https://www.ycombinator.com/library/cap-table)
2. [Investopedia: Cap Table](https://www.investopedia.com/terms/c/capitalization-table.asp)
3. [IRS: Equity (Stock) Compensation](https://www.irs.gov/businesses/small-businesses-self-employed/stock-options)
4. [Investopedia: Stock Options vs. RSUs](https://www.investopedia.com/articles/personal-finance/041515/equity-vs-salary-what-you-need-know.asp)
5. [IRS: Section 409A -- Nonqualified Deferred Compensation](https://www.irs.gov/retirement-plans/section-409a-nonqualified-deferred-compensation-plans)
6. [Investopedia: RSUs](https://www.investopedia.com/terms/r/restricted-stock-unit.asp)
7. [Investopedia: Phantom Stock and SARs](https://www.investopedia.com/articles/stocks/12/phantom-stock-stock-appreciation-rights.asp)
8. [409A Valuations: IRS Safe Harbor](https://www.irs.gov/retirement-plans/section-409a-nonqualified-deferred-compensation-plans)
9. [Investopedia: Preferred Stock vs. Common Stock](https://www.investopedia.com/ask/answers/difference-between-preferred-stock-and-common-stock/)
10. [Y Combinator: SAFE](https://www.ycombinator.com/documents)
11. [Y Combinator: Post-Money Safe User Guide](https://www.ycombinator.com/documents)

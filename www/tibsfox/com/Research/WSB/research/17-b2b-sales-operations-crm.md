# B2B Sales Operations and CRM Systems

> **Domain:** Sales Operations & Revenue Management
> **Module:** 17 -- Pipeline Architecture, CRM Workflows, Revenue Operations, Deal Velocity
> **Through-line:** *A sales organization without operations is a collection of individual performers. A sales organization WITH operations is a machine that generates predictable revenue. The difference is infrastructure -- and infrastructure is what scales.*
> **Source:** 8 transcripts (~10 hours): Sales Operations Masterclass (107 min), Harvard Alumni B2B Sessions 1 & 2 (139 min), Predictable Revenue methodology workshops (171 min), Ultimate Sales Training (154 min), POWERFUL methodology (60 min)
> **Rosetta Clusters:** Business (primary), Infrastructure, AI & Computation

---

## Table of Contents

1. [Revenue Operations vs. Sales Operations](#1-revenue-operations-vs-sales-operations)
2. [Pipeline Architecture](#2-pipeline-architecture)
3. [CRM as Operating System](#3-crm-as-operating-system)
4. [The Pipeline Math](#4-the-pipeline-math)
5. [Deal Velocity and Forecasting](#5-deal-velocity-and-forecasting)
6. [Territory and Account Planning](#6-territory-and-account-planning)
7. [Sales Enablement](#7-sales-enablement)
8. [The SDR-AE Handoff Problem](#8-the-sdr-ae-handoff-problem)
9. [Metrics That Matter vs. Vanity Metrics](#9-metrics-that-matter-vs-vanity-metrics)
10. [Study Topics](#10-study-topics)
11. [DIY Sessions](#11-diy-sessions)
12. [Cross-Cluster Connections](#12-cross-cluster-connections)
13. [Sources](#13-sources)

---

## 1. Revenue Operations vs. Sales Operations

The Sales Operations Masterclass draws a sharp line between two functions that are often conflated:

**Sales Operations** is the engine room of the sales team. It handles:
- Pipeline management and deal tracking
- Sales rep enablement (tools, training, content)
- Territory and quota design
- Compensation plan administration
- Sales process enforcement
- CRM configuration and data hygiene

**Revenue Operations** is the full-funnel coordination layer across marketing, sales, AND customer success. It handles:
- Lead-to-revenue attribution
- Cross-functional handoff protocols (marketing → sales → CS)
- Full lifecycle analytics
- Tool stack integration and data flow
- Revenue forecasting at the company level
- Customer journey optimization

The distinction matters because companies that treat RevOps as "just Sales Ops with a new name" miss the integration opportunity. Marketing generates leads that sales qualifies and closes, then customer success retains and expands. If each function optimizes independently, you get lead-generation machines that produce unqualifiable leads, sales teams that close customers who churn, and CS teams that firefight instead of expand.

RevOps aligns all three functions around a single metric: **net revenue retention.** Not just new logos, not just pipeline, not just NPS -- net revenue retention captures acquisition, retention, expansion, and contraction in one number.

---

## 2. Pipeline Architecture

### 2.1 The Standard Pipeline Stages

Every pipeline needs clear stage definitions with specific entry and exit criteria. The most common architecture:

| Stage | Definition | Entry Criteria | Exit Criteria |
|-------|-----------|----------------|---------------|
| **Lead** | Identified target, no engagement | Fits ICP, has contact info | Responds to outreach |
| **Qualified** | Confirmed fit and interest | BANT or MEDDPICC score ≥ threshold | Discovery meeting scheduled |
| **Discovery** | Understanding needs | Meeting held, needs identified | Mutual agreement to proceed |
| **Proposal/Demo** | Presenting solution | Needs confirmed, stakeholders identified | Proposal delivered |
| **Negotiation** | Terms discussion | Decision criteria clear, champion engaged | Verbal agreement |
| **Closed-Won** | Contract signed | Legal/procurement complete | Revenue recognized |
| **Closed-Lost** | Deal dead | — | Loss reason documented |

### 2.2 Stage Integrity

The most common pipeline disease is **stage inflation** -- deals sitting in stages they don't belong in because reps are optimistic or afraid to remove them. Signs of a sick pipeline:

- Deals older than 2x the average sales cycle that haven't moved stages
- "Proposal" stage packed with deals where no proposal was actually sent
- "Discovery" stage containing deals where the only "discovery" was a marketing form fill
- Win rates by stage that don't monotonically increase (if Discovery→Proposal win rate is LOWER than Lead→Qualified, something is wrong)

**The fix:** Weekly pipeline reviews where each deal is challenged against stage criteria. "What changed since last week? What's the next specific action? What needs to happen for this deal to move forward?" If a rep can't answer these three questions, the deal moves backward or gets removed.

### 2.3 Weighted Pipeline

Not all pipeline dollars are equal. A $100K deal in Discovery is not worth $100K in your forecast -- it's worth $100K × the historical Discovery-stage win rate.

| Stage | Historical Win Rate | $100K Deal Value |
|-------|-------------------|-----------------|
| Lead | 5% | $5,000 |
| Qualified | 15% | $15,000 |
| Discovery | 30% | $30,000 |
| Proposal | 50% | $50,000 |
| Negotiation | 75% | $75,000 |
| Closed-Won | 100% | $100,000 |

Weighted pipeline answers: "Given where our deals actually are, how much revenue can we realistically expect?"

---

## 3. CRM as Operating System

### 3.1 CRM Is Not a Reporting Tool

The biggest CRM implementation mistake: treating it as a place reps enter data so that managers can run reports. This creates adversarial dynamics -- reps see CRM as surveillance, managers see empty CRM as insubordination, and nobody wins.

CRM should be the **workflow engine** that makes reps more effective:
- Auto-logging emails and calls (no manual data entry)
- Surfacing next-best actions based on deal stage and buyer signals
- Triggering automated follow-up sequences after meetings
- Alerting managers when deals stall so they can coach (not punish)
- Providing reps with competitive intelligence and buyer research at the moment of need

### 3.2 CRM Data Hygiene

Three non-negotiable data fields that must be accurate at all times:

1. **Close date:** When will this deal close? Must be updated weekly based on real buyer signals, not rep optimism. A deal that's been pushed 3 months in a row isn't "delayed" -- it's stalled or dead.

2. **Deal value:** What is the expected revenue? Must reflect the actual scope discussed with the buyer, not the maximum possible upsell fantasy.

3. **Stage:** Where is this deal in the buying process? Must reflect the BUYER's position, not the seller's activity. "I sent a proposal" doesn't mean the deal is in Proposal stage -- it means Proposal stage if the buyer has reviewed it and is actively evaluating.

### 3.3 Integration Architecture

Modern CRM sits at the center of a tool ecosystem:

```
Marketing Automation (HubSpot/Marketo)
         ↓ (MQL handoff)
    CRM (Salesforce/HubSpot)
    ↑↓ (data sync)       ↓ (Closed-Won)
Outreach Sequencer    Customer Success
(Outreach/Salesloft)   (Gainsight/Totango)
    ↑↓                    ↓
Conversational Intel   Support/Ticketing
(Gong/Chorus)          (Zendesk/Intercom)
```

Each integration must have clear data ownership rules. Who creates the contact record -- marketing or sales? Who updates the deal stage -- automation or the rep? Who decides when a customer is "at risk" -- CS platform or human judgment?

---

## 4. The Pipeline Math

### 4.1 The Revenue Formula

```
Monthly Recurring Revenue (MRR) Target = $500,000

Average Deal Size (ADS) = $50,000/yr = $4,167/mo
Required New Customers/Month = $500,000 ÷ $4,167 = 120

Win Rate (Discovery → Close) = 25%
Required Discoveries/Month = 120 ÷ 0.25 = 480

Qualified → Discovery Conversion = 60%
Required Qualified Leads/Month = 480 ÷ 0.60 = 800

Lead → Qualified Conversion = 20%
Required Leads/Month = 800 ÷ 0.20 = 4,000
```

This math is sobering and clarifying. It shows exactly where the bottleneck is. If you need 4,000 leads per month and only generate 2,000, no amount of sales training or process improvement will hit target. If you generate 4,000 leads but only qualify 10%, your ICP definition or lead scoring is broken.

### 4.2 Pipeline Coverage

Industry standard: **3-4x pipeline coverage** relative to quota. If your quarterly target is $1M, you need $3-4M in qualified pipeline at the start of the quarter.

Why 3-4x? Because:
- Not every deal will close (win rates range 15-35% in B2B)
- Some deals will slip to future quarters
- Some deals will shrink during negotiation
- Pipeline must absorb unexpected losses

Companies that consistently hit quota maintain 3.5x+ coverage. Companies that struggle maintain under 2x.

### 4.3 Sales Velocity

The four-lever formula:

```
Sales Velocity = (# Opportunities × Win Rate × Avg Deal Size) ÷ Sales Cycle Length
```

**Lever 1: More opportunities** — Most expensive to increase. Requires more SDRs, more marketing spend, or more channels.

**Lever 2: Higher win rate** — Usually the best ROI. Investing in discovery skills, qualification rigor, and competitive positioning can move win rate from 20% to 30% -- a 50% improvement in output with zero additional pipeline.

**Lever 3: Larger deals** — Cross-sell, upsell, multi-year contracts, premium tiers. Expanding existing deals costs less than finding new ones.

**Lever 4: Shorter cycles** — The most overlooked lever. Reducing average cycle from 90 days to 60 days increases velocity by 50%. Tactics: mutual action plans, executive sponsorship engagement, parallel workstreams (legal + technical evaluation simultaneously).

---

## 5. Deal Velocity and Forecasting

### 5.1 The Forecasting Problem

Every sales leader faces the same challenge: predicting future revenue from a pipeline of uncertain deals. The two common approaches and their failure modes:

**Bottom-up forecasting:** Ask each rep what they'll close. Failure mode: optimism bias. Reps forecast based on what they hope, not what the buyer's behavior indicates.

**Top-down forecasting:** Apply historical conversion rates to current pipeline. Failure mode: assumes the future looks like the past. Doesn't account for market shifts, competitive changes, or pipeline quality degradation.

**The hybrid approach that works:**
1. Start with weighted pipeline (stage × historical win rate)
2. Apply rep-specific adjustment factors (some reps consistently over-forecast, others under-forecast)
3. Layer in deal-specific intelligence (champion strength, competitive position, budget confirmation)
4. Compare to historical booking patterns by month/quarter
5. Flag variance between rep commit and model prediction

### 5.2 Deal Velocity Indicators

Fast-moving deals share characteristics:
- **Multi-threaded:** Seller has relationships with 3+ stakeholders (not dependent on one champion)
- **Mutual action plan:** Both buyer and seller have documented next steps with dates
- **Executive engagement:** An economic buyer or executive sponsor has participated in at least one meeting
- **Compelling event:** An external deadline drives the timeline (budget cycle, contract expiration, compliance requirement, business initiative launch)

Stalled deals also share characteristics:
- Single-threaded (one contact, who may leave the company)
- No compelling event ("we're just exploring")
- Seller doing all the work (buyer not returning calls, not reviewing proposals)
- Close date pushed 3+ times with no new information

---

## 6. Territory and Account Planning

### 6.1 Territory Design Principles

Territories should balance three factors:
- **Opportunity:** Equal revenue potential across territories
- **Workload:** Equal number of accounts that need active management
- **Coverage:** No gaps (every account assigned) and no overlaps (no account claimed by two reps)

Common territory models:
- **Geographic:** By region/state/city -- simplest but ignores industry variation
- **Named account:** Top accounts assigned individually -- best for enterprise but creates coverage gaps
- **Industry vertical:** By sector -- enables deep expertise but may create geographic inefficiency
- **Hybrid:** Named enterprise + geographic SMB -- the most common for companies with mixed deal sizes

### 6.2 Account Planning

For strategic accounts (top 20% that drive 80% of revenue):
- Map the organizational chart and identify all stakeholders
- Understand their strategic initiatives for the next 12 months
- Identify 3-5 use cases where your solution creates measurable value
- Build a relationship map: who you know, who you need to know, who can introduce you
- Document competitive presence: what else they use, where you have an advantage
- Create a mutual success plan with the customer champion

---

## 7. Sales Enablement

### 7.1 What Enablement Actually Is

Sales enablement = providing sellers with the information, content, tools, and training they need to engage buyers effectively at each stage of the buying journey.

It is NOT:
- Product training (that's product marketing)
- CRM training (that's ops)
- Motivational speeches (that's... motivational speeches)

It IS:
- Buyer-facing content mapped to purchase stages (awareness → consideration → decision)
- Competitive battle cards updated monthly
- Talk tracks for common objections with evidence/proof points
- Case studies and ROI calculators that quantify value
- Onboarding programs that get new reps to quota in 90 days instead of 180

### 7.2 Content by Stage

| Buyer Stage | Content Type | Purpose |
|-------------|-------------|---------|
| Awareness | Industry reports, thought leadership | Establish credibility |
| Consideration | Solution comparisons, case studies | Build preference |
| Decision | ROI calculators, reference calls, proposals | Remove risk |
| Post-sale | Implementation guides, best practices | Accelerate time-to-value |

---

## 8. The SDR-AE Handoff Problem

From the Predictable Revenue transcripts -- the most painful operational problem in B2B sales:

**The symptom:** SDR gets a prospect on the line, qualifies them, books a meeting, hands them to an AE... and the AE says "I don't want to talk to them. They're not going to buy in 90 days."

**The root cause:** Misaligned qualification criteria. The SDR is measured on meetings booked. The AE is measured on deals closed. What constitutes a "qualified" meeting differs between them.

**The fix:**
1. **Shared qualification criteria:** SDR and AE agree on what constitutes a qualified handoff (BANT minimum, MEDDPICC threshold, or custom criteria)
2. **Accepted vs. booked:** Track not just "meetings booked" but "meetings accepted" -- did the AE agree this was worth their time?
3. **Feedback loop:** AEs must document why they reject a meeting. That data trains better SDR qualification.
4. **Warm handoff:** SDR introduces the AE during the qualification call or sends a personalized warm introduction email (not a cold calendar link)

The broader principle from the Predictable Revenue evolution: "What's better -- them inbounding to you on the same day they inbound to your competitor? Or you reaching out 3-9 months before they're in market?" The SDR's job isn't to catch buyers at the moment of intent. It's to create relationships early enough that when intent emerges, you're already top-of-mind.

---

## 9. Metrics That Matter vs. Vanity Metrics

### Metrics That Matter

| Metric | What It Tells You | Action Trigger |
|--------|------------------|----------------|
| Win rate (by stage) | Conversion effectiveness | <20%: qualification or skills problem |
| Pipeline coverage | Can you hit target? | <3x: pipeline generation emergency |
| Average sales cycle | Deal velocity | Increasing: process friction growing |
| Net revenue retention | Customer health | <100%: churn exceeds expansion |
| Ramp time to quota | Enablement effectiveness | >6 months: onboarding broken |
| ACV (Avg Contract Value) | Pricing/positioning | Declining: discounting or market shift |

### Vanity Metrics

| Metric | Why It's Misleading |
|--------|-------------------|
| Number of calls made | Activity ≠ effectiveness |
| Emails sent | Volume ≠ quality |
| Meetings booked (without acceptance) | Doesn't measure quality |
| Pipeline created (without aging) | New pipeline ≠ closable pipeline |
| Demo requests | Interest ≠ intent |

---

## 10. Study Topics

1. Design a RevOps dashboard with 6 metrics that a CEO, CRO, and VP Sales would all find useful. What changes for each audience?
2. Your pipeline coverage is 2.1x and the quarter starts in 2 weeks. What three actions do you take in priority order?
3. Compare geographic vs. named-account vs. industry-vertical territory models for a 50-person sales team selling enterprise software.
4. The SDR-AE handoff failure rate is 40%. Walk through the diagnostic process: where do you look first, second, third?
5. What is the difference between a Closed-Lost deal and a "no decision" deal? How should each be tracked and analyzed?

---

## 11. DIY Sessions

### Session A: Pipeline Audit (45 min)
Take any sales pipeline (real or hypothetical) and conduct a health check:
- Calculate pipeline coverage ratio
- Identify deals older than 2x average cycle length
- Check stage progression integrity (deals should move forward, not backward)
- Calculate weighted pipeline vs. unweighted
- Identify the biggest bottleneck stage (highest drop-off)

### Session B: CRM Design Exercise (60 min)
Design a CRM workflow for a SaaS company selling a $30K/year product:
- Define 6 pipeline stages with entry/exit criteria
- List required fields at each stage
- Design 3 automation rules (e.g., "if deal hasn't moved in 14 days, alert manager")
- Create the dashboard the sales manager reviews weekly

### Session C: Sales Velocity Calculator (30 min)
Build a spreadsheet with the four-lever formula. Input current performance, then model three scenarios:
1. 20% more pipeline, everything else constant
2. Win rate improves from 20% to 28%, everything else constant
3. Sales cycle shortens from 90 to 65 days, everything else constant
Which lever produces the highest incremental revenue?

---

## 12. Cross-Cluster Connections

**→ Business (WSB 01-05):** Sales operations is the revenue-generation complement to the formation → licensing → tax → employment → funding stack. A business can be perfectly formed and still fail without a sales engine.

**→ Infrastructure:** CRM architecture parallels network infrastructure design -- pipeline stages are like routing tables, data hygiene is like network monitoring, and integration is like protocol interoperability.

**→ AI & Computation:** Forecasting models are moving from weighted-pipeline heuristics to ML-driven prediction. Deal scoring, churn prediction, and pricing optimization are the first AI applications in SalesOps that actually work.

**→ Leadership (WSB 08):** Sales management is the primary application of the "leader as coach" model. The best managers don't close deals for their reps -- they use pipeline reviews as coaching sessions.

---

## 13. Sources

| # | Source | Authority | Key Contribution |
|---|--------|-----------|-----------------|
| 1 | Sales Operations Masterclass (107 min) | Silver | Full SalesOps curriculum |
| 2 | Harvard Alumni B2B Session 1 (71 min) | Gold | ICP, discovery-first method |
| 3 | Harvard Alumni B2B Session 2 (68 min) | Gold | Pipeline, stakeholder alignment |
| 4 | Predictable Revenue Methodology (64 min) | Silver | SDR process, handoff design |
| 5 | Aaron Ross (57 min) | Gold | Outbound evolution, PR 2.0 |
| 6 | Predictable Revenue Podcast (50 min) | Silver | Sequence design, cadence |
| 7 | Outbound Sales Strategy 2026 (62 min) | Silver | Signal-based outreach |
| 8 | POWERFUL methodology (60 min) | Bronze | Discovery-to-close metrics |

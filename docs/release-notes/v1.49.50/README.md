# v1.49.50 — "Double Entry"

**Shipped:** 2026-03-26
**Commits:** 1 (`359b1dbe`)
**Files:** 20 | **Lines:** +4,274 / -2 (net +4,272)
**Branch:** dev → main
**Tag:** v1.49.50
**Dedicated to:** Luca Pacioli (1447-1517) — Franciscan friar, mathematician, and the man who wrote down what Venetian merchants already knew, so the rest of the world could learn it

> "Every transaction has two sides. Every debit has a credit. The books balance or they don't — there is no ambiguity in arithmetic."

---

## Summary

The 48th Research project and the capstone of the Business cluster. BLA (Business Law & Accounting) maps the full legal and financial infrastructure of commerce — from Luca Pacioli's 1494 codification of double-entry bookkeeping through modern entity formation, cooperative accounting, tribal sovereign commerce, federal regulatory compliance, equity securities, and international expansion. Eight modules across six domains with 46 sources trace 530 years of the system that makes markets legible.

BLA strengthens the **Business cluster** to four entries: WA accounting law (ACC), WA small business startup (WSB), building/contractor compliance (BCM), and now the universal business law stack from formation to international expansion (BLA). ACC and WSB were Washington State-specific. BLA provides the foundational layer — entity law, accounting principles, compliance frameworks — that ACC and WSB specialize atop. The cluster now has both breadth (six domains) and depth (state + federal + international + tribal).

Named "Double Entry" — the foundational innovation that made modern commerce legible. Every transaction recorded twice, debit and credit, 530 years and still the foundation of every accounting system on Earth. Double-entry is itself a Rosetta Stone — a single economic event encoded in two accounts simultaneously, translating between assets and obligations.

**Research series: 48 complete projects, 446 research modules, ~201,000 lines.**

---

## Key Features

### BLA Research Project

**Location:** `www/tibsfox/com/Research/BLA/`
**Files:** 16 | **Research lines:** 1,946 | **Sources:** 46 | **Cross-linked projects:** 16
**Theme:** Slate (#37474F) with currency green (#2E7D32)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Choose Your Structure | 239 | *The entity you choose determines the rules you play by.* |
| 02 | Pacioli's Gift | 257 | *Every transaction has two sides. Every debit has a credit.* |
| 03 | Member-Owned | 228 | *A cooperative exists to serve its members, not its shareholders.* |
| 04 | Sovereign Commerce | 247 | *Tribal sovereignty means tribal enterprises operate under their own law.* |
| 05 | The Compliance Stack | 252 | *Compliance is the infrastructure that makes markets possible.* |
| 06 | The Cap Table | 302 | *The cap table is the constitution of a company.* |
| 07 | Beyond Borders | 278 | *Every border you cross adds a legal system.* |
| 08 | The Audit Trail | 143 | *Verification, 46 sources, 16 cross-links.* |

### Module Highlights

- **Module 01 "Choose Your Structure"** maps entity formation — sole proprietorship, LLC, S-Corp, C-Corp, cooperative, tribal enterprise. Each structure determines liability, taxation, governance, and succession. The choice is the first legal decision a business makes, and it constrains every decision after.
- **Module 02 "Pacioli's Gift"** traces double-entry bookkeeping from 1494 Venice to modern GAAP. Pacioli didn't invent it — Venetian merchants had used it for centuries. He wrote it down in *Summa de Arithmetica* so the rest of the world could learn. Documentation as gift. The Research series principle in a 530-year-old frame.
- **Module 03 "Member-Owned"** documents cooperative accounting — where the entity serves members, not shareholders. Different ownership model, different financial statements, different success metrics. REI, credit unions, rural electric co-ops: the cooperative structure is everywhere, just invisible to people trained to see only corporations.
- **Module 04 "Sovereign Commerce"** covers tribal sovereignty as a distinct legal framework. Not a subset of state or federal law — a parallel legal system with its own jurisdiction, its own courts, its own regulatory authority. Tribal enterprises operate under sovereign authority. The Research series gains nuance by documenting this alongside conventional business law.
- **Module 05 "The Compliance Stack"** maps the regulatory infrastructure from local permits through federal securities law. Compliance as infrastructure, not burden — the rules that make markets trustworthy enough to function.
- **Module 06 "The Cap Table"** is the longest module (302 lines) covering equity, ownership dilution, vesting schedules, convertible instruments, and the cap table as a company's constitutional document. Who owns what, under what terms, with what rights.
- **Module 07 "Beyond Borders"** traces international expansion — every border crossed adds a legal system, a tax authority, a regulatory body, and a currency. Transfer pricing, treaty networks, permanent establishment rules, FCPA compliance.

### Business Cluster Integration

| Project | Scope | Connection to BLA |
|---------|-------|------------------|
| ACC | WA accounting law | State-level specialization of BLA's accounting principles |
| WSB | WA small business startup | Practical application of BLA's entity formation |
| BCM | Building/contractor compliance | Industry-specific compliance atop BLA's regulatory stack |
| BLA | Universal business law | Foundation layer for the entire cluster |

Additional cross-links: TIBS/SAL (tribal sovereignty), WYR (corporate timberland structure), SAN (compliance frameworks).

---

## File Inventory

- 16 research modules (8 markdown + 8 supporting files)
- 1 hub index page
- 1 chipset YAML
- 1 test plan
- 1 browsable catalog (index.html)

---

## Retrospective

### What Worked

1. **The Business cluster needed this foundation.** ACC and WSB were WA-specific, practical, and narrow. BLA provides the universal principles that ACC and WSB specialize. Now the cluster reads correctly: BLA establishes entity law, accounting fundamentals, compliance frameworks; ACC applies Washington accounting regulation; WSB applies Washington startup practice; BCM applies contractor/building compliance. Foundation first, specialization second.

2. **Tribal sovereignty as a parallel legal system, not a footnote.** Module 04 is 247 lines documenting a legal framework that's fundamentally different from state or federal law. Not "special rules for Native businesses" but a sovereign jurisdiction with its own authority. The Research series is stronger for documenting parallel systems rather than treating one system as default and others as exceptions.

3. **Module 06 at 302 lines earned its length.** The cap table module is the longest because equity is the most consequential and least understood aspect of business formation. Dilution, vesting cliffs, liquidation preferences, convertible notes — every startup founder learns these the hard way. The length matches the complexity.

### Lessons Learned

1. **530-year-old innovations are still infrastructure.** Pacioli published in 1494. Every accounting system on Earth still uses double-entry. The longevity proves it's not a convention but a discovery — there are exactly two sides to every transaction, and the books balance or they don't. Infrastructure that lasts five centuries has earned the right to be called fundamental.

2. **Six domains in eight modules requires disciplined scoping.** Entity formation, accounting, cooperatives, tribal law, compliance, equity, international — any one of these could be its own project. BLA covers all six by staying at the principles level and letting ACC/WSB/BCM handle the specifics. The cluster architecture makes this possible: depth through specialization, breadth through the foundation layer.

---

> *530 years. Every transaction recorded twice. The books balance or they don't.*

# The Trust System — How Trust Works in the Wasteland

Trust in the Wasteland is not a database column you flip or a credential you present. It is a living record of real relationships — who you are to the people around you, what you've built together, and how deeply you've connected. The system has two orthogonal axes, a consent layer, and a privacy architecture that treats the social graph as private property belonging to the participants.

This document describes the full trust architecture: the math, the data model, the privacy guarantees, and how all the pieces fit together.

---

## The Two Axes of Trust

Trust operates on two independent axes. They measure different things and work differently.

```
  Community Trust (vertical)          Interpersonal Trust (lateral)
  ┌──────────────────────┐            ┌────────────────────────────┐
  │ monotonic — never     │            │ bilateral — each side has  │
  │ decreases. earned     │            │ its own vector. can expire │
  │ through stamps from   │            │ when contracts end. models │
  │ the community.        │            │ how deeply two specific    │
  │                       │            │ rigs know each other.      │
  │ Level 3: Old Growth   │            │                            │
  │ Level 2: Sapling      │            │   z = time + i*depth       │
  │ Level 1: Seedling     │            │   |z| <= 1.0 (unit disk)   │
  │ Level 0: Outsider     │            │   theta = atan2(depth,time)│
  └──────────────────────┘            └────────────────────────────┘
```

Community trust answers: **"How much has the community invested in this rig?"**
Interpersonal trust answers: **"How deeply are these two specific rigs connected?"**

They are separate systems that inform each other. A rig with many deep, mutual interpersonal connections is demonstrating real community participation — which is evidence for community trust progression. But they are never collapsed into a single number.

---

## Axis 1: Community Trust

Community trust is vertical progression through four tiers. It never decreases. Promotion is based on accumulated stamps (peer recognition) and time-in-tier requirements.

### Trust Levels

| Level | Name | What It Means | What You Can Do |
|-------|------|---------------|-----------------|
| 0 | Outsider | You haven't registered yet | Read-only access to the wanted board |
| 1 | Seedling | You just arrived — nobody knows you yet | Post, claim tasks, submit completions |
| 2 | Sapling | People know your face — you've shared experiences, built together | Validate others' work, issue stamps |
| 3 | Old Growth | Family — years of trust earned through real shared experience | Manage trust levels, merge PRs |

### Promotion Rules

Promotion from one level to the next requires meeting all criteria simultaneously:

**Seedling (1) to Sapling (2):**
- 3+ stamps received from other rigs
- Average quality score >= 3.0 across all stamps
- 7+ days since registration

**Sapling (2) to Old Growth (3):**
- 10+ stamps received
- 5+ stamps issued (you've validated others' work)
- Average quality score >= 4.0
- 30+ days at Sapling level
- Stamps from 2+ unique validators (not just one friend)

### The Stamp Pipeline

Stamps are how the community recognizes work. Each stamp carries three dimensions:

| Dimension | What It Measures | Scale |
|-----------|-----------------|-------|
| Quality | How good is the work itself? | 0–5 |
| Reliability | Can we count on this rig to deliver? | 0–5 |
| Creativity | Did they bring something unexpected? | 0–5 |

Stamps also carry a severity (leaf/branch/root — peer/senior/maintainer review) and a confidence score (0.0–1.0 — how certain the validator is).

**The Yearbook Rule (SC-05):** You cannot stamp your own work. Recognition comes from others.

### Implementation

Community trust lives in `src/integrations/wasteland/trust-escalation.ts` (537 lines). The data provider interface (`EscalationDataProvider`) abstracts the DoltHub queries so the evaluation engine can be tested without a live database. The `scanForEscalation()` function batch-evaluates all rigs at a given level and returns promotion recommendations.

---

## Axis 2: Interpersonal Trust

Interpersonal trust models bilateral connections between two specific rigs using complex numbers on the unit disk.

### The Unit Circle Model

Every trust connection between two rigs is a vector in the first quadrant of the complex plane:

```
  sharedDepth (imaginary axis)
  1.0 ┤
      │  depth-forged (theta near 90 degrees)
      │     .
      │    /
      │   /   balanced (theta = 45 degrees)
      │  /   .
      │ /  /
      │/ /     history-anchored (theta near 0 degrees)
  0.0 ┤─────────────────────
      0.0               1.0
            sharedTime (real axis)
```

- **Real axis (sharedTime):** How long have we known each other? Ranges from 0 (just met) to 1 (lifetime).
- **Imaginary axis (sharedDepth):** How deeply are we connected? Ranges from 0 (surface-level) to 1 (profound).
- **Magnitude:** `min(1, sqrt(time^2 + depth^2))` — overall trust strength, capped at the unit circle boundary.
- **Theta:** `atan2(depth, time)` — the character of the connection, from 0 (pure time) to pi/2 (pure depth).

### What the Angle Tells You

| Angle Range | Classification | What It Means |
|-------------|---------------|---------------|
| magnitude < 0.05 | unconnected | No real connection exists |
| theta < 22.5 deg | history-anchored | We've been through a lot over a long time |
| 22.5–37.5 deg | time-leading | More shared time than depth |
| 37.5–52.5 deg | balanced | Equal parts history and intensity |
| 52.5–67.5 deg | depth-leading | More shared depth than time |
| theta >= 67.5 deg | depth-forged | Connected deeply, possibly quickly |

### Key Design Decisions

**Trust is asymmetric.** How deeply I feel connected to you may differ from how deeply you feel connected to me. Each side of a relationship has its own vector. This is intentional — it models real human connections honestly.

**Multiple simultaneous relationships are normal.** The same two rigs can hold a permanent trust (family), an event-scoped trust (camping together this burn), and a project-scoped trust (collaborating on this art piece) — all active at the same time. Real relationships are layered. The system models that.

**TTL is on the contract, not the trust.** A 15-minute game creates an ephemeral contract. When the contract expires, the interaction's record remains — the memory of the connection doesn't vanish. The contract governs active status; the trust vector is the record of what was shared.

### Contract Types

| Type | Default TTL | Use Case |
|------|-------------|----------|
| permanent | never expires | Married, blood family, chosen family, lifelong friends |
| long-term | never expires | Camp mates across multiple burns, old friends |
| event-scoped | 7 days | Met this burn, camping together this week |
| project-scoped | 30 days | Building this art piece, collaborating on this project |
| ephemeral | 1 hour | "I'm Fox, here's my icon, let's play a 15-minute game" |

Every contract type accepts a custom TTL override. You can make an ephemeral contract last 15 minutes or an event-scoped contract last 2 weeks. The participant sets the terms.

### Harmony

Harmony measures how mutual a connection is:

```
magnitudeRatio = min(mA, mB) / max(mA, mB)     1.0 = equal strength
angleDelta     = |thetaA - thetaB|               0   = same character
harmony        = magnitudeRatio * (1 - angleDelta / (pi/2))
```

A harmony of 1.0 means both rigs feel the same way about the connection — same strength, same character. Lower harmony means the connection is lopsided (one feels it more than the other) or differently characterized (one sees it as history-anchored while the other sees it as depth-forged).

### Implementation

Interpersonal trust lives in `src/integrations/wasteland/trust-relationship.ts` (497 lines). Pure functions, no side effects. The data provider in `trust-relationship-provider.ts` (443 lines) adds DoltHub persistence.

---

## The Consent Layer: Character Sheets

A character sheet is what a rig **deliberately chooses** to share about themselves. It is separate from the computed reputation profile (stamps, badges, stats — documented in `character-sheet-design.md`).

### Two Distinct Concepts

| Concept | Source | Purpose |
|---------|--------|---------|
| **Character Sheet** (consent layer) | Created by the rig, all fields optional | Controls what personal info others can see |
| **Reputation Profile** (computed) | Derived from stamps, completions, badges | Shows what the community says about the rig |

The consent layer answers: "What do I choose to reveal?"
The reputation profile answers: "What has the community observed about me?"

They complement each other but serve different purposes and must never be merged.

### Character Sheet Fields

| Field | Required? | Purpose |
|-------|-----------|---------|
| handle | yes | Rig identity (totem-NNN format) |
| displayName | yes | Playa name — chosen by the rig |
| icon | no | Visual identity (emoji, icon ref) |
| bio | no | Self-description in the rig's own words |
| homeCamp | no | Camp affiliation |
| reputationVisibility | no (default: summary) | How much of the computed profile to show: full, summary, or minimal |
| visibleSkills | no (default: none) | Which skill tags to display publicly |
| customFields | no (default: empty) | User-defined key-value pairs (pronouns, spirit animal, anything) |

A minimal valid character sheet is a handle and a display name. Everything else is the rig's choice. A rig exploring an ephemeral 15-minute interaction might share nothing beyond their playa name and an emoji. A rig embedded in the community for years might share a full bio, camp affiliation, and custom fields. Both are valid.

---

## Privacy Architecture

Privacy is not a feature of this system. It is a constraint that shapes every design decision. These rules are non-negotiable.

### The Rules

1. **Absolute zero PII.** No real names, email addresses, phone numbers, social media handles, or any real-world personal information. Not through direct storage, not through metadata, not through patterns that could be reverse-engineered.

2. **The social graph is private.** Who trusts whom, who knows whom, the connections between participants — this is private data owned by the participants. Never public, never committed to shared repositories, never aggregated into reports or dashboards.

3. **Trust relationship data is local-only.** The SQL schema for trust tables is shared (so every instance knows the structure). The rows — the actual relationships — are stored only in the local Dolt clone. They are never pushed to the DoltHub commons upstream. Each instance is sovereign over its own social graph.

4. **Character sheets are explicit consent.** Nothing is inferred, auto-populated, or scraped. The rig creates their sheet. What the sheet shows is what others see. Nothing more.

5. **Participants label their own relationships.** Nobody else defines, categorizes, or labels your connections for you. The `fromLabel` and `toLabel` fields in a trust relationship belong to the respective participants.

### Where Data Lives

| Data Type | Storage | Visibility |
|-----------|---------|------------|
| Community trust level | DoltHub (synced) | Public — your trust tier is part of the protocol |
| Stamps received/issued | DoltHub (synced) | Public — stamps are the shared record |
| Completions | DoltHub (synced) | Public — work done is public |
| Trust relationships | Local Dolt only | Private — never synced upstream |
| Character sheets | Local Dolt only | Controlled by the rig's visibility settings |
| Relationship labels | Local Dolt only | Private to each participant |

---

## The Bridge: How Interpersonal Trust Feeds Community Trust

A rig with many deep, mutual interpersonal connections is demonstrating real community participation. The escalation bridge converts this signal into additional evidence for community trust promotion.

### The Escalation Bonus

```
bonus = (strength * 0.5) + (breadth * 0.3) + (mutuality * 0.2)
```

| Component | Weight | What It Measures | Range |
|-----------|--------|-----------------|-------|
| Strength | 50% | Average trust magnitude from others toward this rig | 0–1 |
| Breadth | 30% | Number of active connections (diminishing returns) | 0–1 |
| Mutuality | 20% | Average harmony score across relationships | 0–1 |

Breadth uses `1 - 1/(1 + connections * 0.25)` so the first few connections matter most — going from 0 to 3 connections is a bigger signal than going from 10 to 13.

This bonus is evidence, not a gate. It supplements the existing stamp-based criteria rather than replacing them.

---

## Data Model

### SQL Schema (3 tables, local-only)

```sql
CREATE TABLE trust_contracts (
  id            VARCHAR(32) PRIMARY KEY,
  type          VARCHAR(16) NOT NULL,
  ttl_seconds   INT DEFAULT NULL,
  created_at    DATETIME NOT NULL,
  expires_at    DATETIME DEFAULT NULL
);

CREATE TABLE trust_relationships (
  contract_id   VARCHAR(32) PRIMARY KEY,
  from_handle   VARCHAR(64) NOT NULL,
  to_handle     VARCHAR(64) NOT NULL,
  from_time     FLOAT NOT NULL,
  from_depth    FLOAT NOT NULL,
  to_time       FLOAT NOT NULL,
  to_depth      FLOAT NOT NULL,
  from_label    VARCHAR(128) DEFAULT NULL,
  to_label      VARCHAR(128) DEFAULT NULL,
  visibility    VARCHAR(8) DEFAULT 'private',
  CHECK (visibility IN ('private', 'mutual'))
);

CREATE TABLE character_sheets (
  handle                VARCHAR(64) PRIMARY KEY,
  display_name          VARCHAR(128) NOT NULL,
  icon                  VARCHAR(32) DEFAULT NULL,
  bio                   TEXT DEFAULT NULL,
  home_camp             VARCHAR(64) DEFAULT NULL,
  reputation_visibility VARCHAR(8) DEFAULT 'summary',
  visible_skills        JSON DEFAULT '[]',
  custom_fields         JSON DEFAULT '{}',
  updated_at            DATETIME NOT NULL,
  CHECK (reputation_visibility IN ('full', 'summary', 'minimal'))
);
```

Contract IDs follow the format `tc-{type_prefix}-{timestamp_hex}` where the prefix is `pm` (permanent), `lt` (long-term), `ev` (event-scoped), `pj` (project-scoped), or `ep` (ephemeral).

### Provider Interface

All trust relationship storage goes through a data provider interface for dependency injection:

```typescript
interface TrustRelationshipDataProvider {
  saveRelationship(rel: TrustRelationship): Promise<void>
  removeRelationship(contractId: string): Promise<void>
  getRelationshipsForRig(handle: string): Promise<TrustRelationship[]>
  getRelationshipsBetween(handleA: string, handleB: string): Promise<TrustRelationship[]>
  saveCharacterSheet(sheet: CharacterSheet): Promise<void>
  getCharacterSheet(handle: string): Promise<CharacterSheet | null>
  getAggregateTrustStrength(handle: string): Promise<number>
}
```

The DoltHub-backed implementation uses the `DoltClient` interface (REST API with local CLI fallback). All SQL values go through `sqlEscape()` for injection protection (SEC-02). Writes are always local-only — the `execute()` method writes to the local Dolt clone, never to the REST API.

---

## File Map

```
src/integrations/wasteland/
  trust-escalation.ts              Community trust (levels 0-3, stamp-based promotion)
  trust-relationship.ts            Interpersonal trust (unit circle, contracts, character sheets)
  trust-relationship-provider.ts   DoltHub storage, schema DDL, escalation bridge
  stamp-validator.ts               Stamp pipeline (evidence -> valence -> stamp)
  sql-escape.ts                    SQL injection protection (SEC-02)
  dolthub-client.ts                DoltHub REST + local CLI client

  __tests__/
    trust-relationship.test.ts              44 tests
    trust-relationship-provider.test.ts     32 tests
```

### Related Docs

| Document | What It Covers |
|----------|---------------|
| `docs/character-sheet-design.md` | Reputation display — terminal/web rendering of computed profile |
| `docs/wasteland-mvr-explainer.md` | The full MVR protocol including all seven tables |
| `docs/wasteland-ecosystem.md` | Federation architecture and rig types |
| `docs/wasteland-getting-started.md` | Installation and first participation |

---

## What's Not Built Yet

- CLI commands for creating and managing trust relationships
- Terminal rendering of character sheets (the consent layer integrated with the reputation display)
- Wiring the escalation bonus into the live `evaluateRig()` promotion flow
- Application-level privacy enforcement on trust relationship queries
- Automated schema creation (DDL is generated but not auto-executed on first run)

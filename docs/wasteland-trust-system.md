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
- **Graph diversity** — validators must come from different parts of the trust graph, not one clique. The shape of the graph matters, not the count of validators. Uses `max(3, floor(log2(active_rigs)))` as a floor, with graph topology analysis replacing head counts at scale.
- At least some validators must be Old Growth themselves (prevents bootstrapping from nothing)
- **Interpersonal trust bonus** — acts as a weighted tiebreaker for borderline cases. Strong interpersonal connections can push a rig over the threshold, but are not required. Rigs who meet stamp criteria on their own are not blocked.

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

**Multi-context bonds multiply trust.** Knowing someone from work AND from the furry community AND from burns is qualitatively different from knowing them through one context. Each independent context is an anchor — if one context ends, the others remain. The system scores multi-context bonds higher because uncorrelated contexts compound as independent evidence.

**TTL is on the contract, not the trust.** A 15-minute game creates an ephemeral contract. When the contract expires, the interaction's record remains — the memory of the connection doesn't vanish. The contract governs active status; the trust vector is the record of what was shared.

**Full archive.** Expired contracts stay in storage forever. Storage is cheap. The memory of a connection does not vanish when the contract period ends. A 15-minute game you played at the 2026 burn is still visible in your relationship history years later.

### Contract Types

| Type | Default TTL | Use Case |
|------|-------------|----------|
| permanent | never expires | Married, blood family, chosen family, lifelong friends |
| long-term | never expires | Camp mates across multiple burns, old friends |
| event-scoped | 7 days | Met this burn, camping together this week |
| project-scoped | 30 days | Building this art piece, collaborating on this project |
| ephemeral | 1 hour | "I'm Fox, here's my icon, let's play a 15-minute game" |

Every contract type accepts a custom TTL override. You can make an ephemeral contract last 15 minutes or an event-scoped contract last 2 weeks. The participant sets the terms.

### Heartbeat Renewal

Contracts with TTL support automatic renewal — a heartbeat that keeps the connection alive as long as participants are still engaged.

```
  Game starts         TTL expires        TTL expires        Someone leaves
  ─────────┬──────────────┬──────────────┬──────────────┬──────────
           │  still here  │  still here  │  one gone    │
           │  → renew     │  → renew     │  → expire    │
           │  count: 1    │  count: 2    │              │
```

- **Auto-renew defaults to ON** for contracts with TTL (ephemeral, event, project). Permanent/long-term have nothing to renew.
- **Either-side renewal with opt-out.** The contract auto-renews as long as either participant is active. Either party can explicitly opt out. The connection persists until someone says stop.
- **Renewal count tracks history.** A 15-minute game renewed 12 times = 3 hours of play. The original `createdAt` is preserved — you always know when the connection started.
- **Drop mechanism is absence, not action.** You don't have to do anything to end a connection. You just stop participating. The contract notices your absence, not your presence.

### Relationship Lifecycle

Relationships support two removal paths:

- **Archive (default):** Soft-delete with `archived_at` timestamp. The row stays, marked as archived. Queries filter it out by default. The memory persists.
- **Purge (explicit):** Hard delete. The participant chooses to erase the connection completely. Their data, their choice.

### Harmony

Harmony measures how mutual a connection is:

```
magnitudeRatio = min(mA, mB) / max(mA, mB)     1.0 = equal strength
angleDelta     = |thetaA - thetaB|               0   = same character
harmony        = magnitudeRatio * (1 - angleDelta / (pi/2))
```

A harmony of 1.0 means both rigs feel the same way about the connection — same strength, same character. Lower harmony means the connection is lopsided (one feels it more than the other) or differently characterized (one sees it as history-anchored while the other sees it as depth-forged).

### Character-of-Asymmetry Classifier

Beyond the single harmony score, the system classifies relationships into distinct asymmetry categories:

| Category | What It Means |
|----------|--------------|
| mutual | Both sides feel similarly — balanced strength and character |
| one-sided strength | One rig trusts much more than the other |
| character mismatch | Similar strength but different angles (one sees history-anchored, other sees depth-forged) |
| bridge potential | Not directly connected, but a strong prior exists through a high-trust intermediate node |
| multi-context bonded | Same two rigs share multiple active contracts across different types |

### Bridge Potential

Bridge potential is **introduction potential**, not trust. The graph says "these two should meet." The meeting is what creates trust.

```
  You ──(long-term, work)── Coworker ──(permanent, family)── Sister
                                              │
                              the "family" label carries signal
```

Trust propagates through high-trust nodes but decays sharply:
- **1 hop through a trusted node** = strong signal (Mom trusts them → I likely will too)
- **2 hops** = signal only if you physically meet through that chain
- **3+ hops** = zero signal

The character of the bridge bond matters. A family bond (permanent) carries more signal than a project bond (project-scoped). The formula is multiplicative — a chain is only as strong as its weakest link:

```
bridgePotential(A→B→C) = mag(A→B) × mag(B→C) × bondType(A→B) × bondType(B→C)
```

All graph algorithms are **ego-local** — 2-hop maximum, O(k²) where k is direct connections. No global graph traversal. This scales from campfire to planet.

### Implementation

Interpersonal trust lives in `src/integrations/wasteland/trust-relationship.ts`. Pure functions, no side effects. The data provider in `trust-relationship-provider.ts` adds DoltHub persistence.

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
| handle | yes | Rig identity (UUID, auto-generated at registration) |
| displayName | yes | Playa name — chosen by the rig, changeable anytime |
| icon | no | Visual identity (emoji, icon ref) |
| bio | no | Self-description in the rig's own words |
| homeCamp | no | Camp affiliation |
| reputationVisibility | no (default: summary) | How much of the computed profile to show: full, summary, or minimal |
| visibleSkills | no (default: none) | Which skill tags to display publicly |
| customFields | no (default: empty) | User-defined key-value pairs (pronouns, spirit animal, anything) |

A minimal valid character sheet is a handle and a display name. Everything else is the rig's choice.

### Progressive Disclosure

What a rig sees depends on their trust level — newcomers are never shown concepts they don't yet have context for:

| Trust Level | What They See |
|-------------|--------------|
| Outsider (0) | Their own handle, Welcome Home badge, wanted board (read only) |
| Seedling (1) | Their character sheet, completions, trust progression hints |
| Sapling (2) | Full character sheets for others (at subject's visibility setting), aggregate trust, vector classifications in plain language |
| Old Growth (3) | Full visibility on all public data, graph concepts (bridges, diversity) |

---

## Registration & Arrival

Registration is zero friction with a gentle welcome.

### The Flow

1. **UUID auto-generated** — the database key, invisible to the user
2. **Pick a display name** — playa name, changeable anytime
3. **Optional character sheet fields** — icon, bio, camp — all presented warmly, all skippable
4. **Brief orientation** — what trust levels mean, how to find work on the wanted board
5. **Welcome Home badge** — a personal gift from Foxy to every person who arrives

### The Welcome Home Badge

The Welcome Home badge is not a stamp. It's a **gift from Foxy**, the camp founder, to every person who arrives at Foxy's Playground. Just as the greeters at the real Burning Man gate say "Welcome home" before they know anything about you — the system greets you before you've earned anything.

- **Issuer:** Foxy's Playground (the system as Foxy's voice)
- **Given once, never revoked, never earned.** You showed up. That's enough.
- **Not a stamp.** No quality/reliability/creativity scores. No promotion weight. A gift.
- **The bell rings.** The community knows someone new arrived, without knowing who. The arrival is public. The identity is private.

---

## Privacy Architecture

Privacy is not a feature of this system. It is a constraint that shapes every design decision. These rules are non-negotiable.

### The Rules

1. **Absolute zero PII.** No real names, email addresses, phone numbers, social media handles, or any real-world personal information. Not through direct storage, not through metadata, not through patterns that could be reverse-engineered.

2. **The social graph is private.** Who trusts whom, who knows whom, the connections between participants — this is private data owned by the participants. Never public, never committed to shared repositories, never aggregated into reports or dashboards.

3. **Trust relationship data is local-only.** The SQL schema for trust tables is shared (so every instance knows the structure). The rows — the actual relationships — are stored only in the local Dolt clone. They are never pushed to the DoltHub commons upstream. Each instance is sovereign over its own social graph.

4. **Character sheets are explicit consent.** Nothing is inferred, auto-populated, or scraped. The rig creates their sheet. What the sheet shows is what others see. Nothing more.

5. **Participants label their own relationships.** Nobody else defines, categorizes, or labels your connections for you. The `fromLabel` and `toLabel` fields in a trust relationship belong to the respective participants.

6. **The consent pattern is fractal.** It applies at every scale: personal (character sheet), dyadic (relationship visibility flag), system (social graph never public), federation (each instance computes locally, never shares raw graph data).

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

**This bonus is a weighted tiebreaker, not a gate.** It only matters when a rig is borderline on the stamp criteria. If you clearly meet all stamp requirements, the bonus doesn't factor in. If you're close but not quite there, strong interpersonal trust can push you over. Fair to small communities, rewards genuine embedding in larger ones.

### Graph Diversity for Multi-Context Bonds

Multi-context bonds (multiple active contract types between the same two rigs) score higher than single-context connections. The initial implementation uses a simple count: `diversity = min(1, uniqueContractTypes / 4)`. As real usage data accumulates, this will graduate to information-theoretic independence weighting — uncorrelated contexts (work + burn) compound as stronger evidence than correlated contexts (two projects at the same company).

---

## Data Model

### SQL Schema (3 tables, local-only)

```sql
CREATE TABLE trust_contracts (
  id            VARCHAR(48) PRIMARY KEY,
  type          VARCHAR(16) NOT NULL,
  ttl_seconds   INT DEFAULT NULL,
  created_at    DATETIME NOT NULL,
  expires_at    DATETIME DEFAULT NULL,
  auto_renew    BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_count INT NOT NULL DEFAULT 0
);

CREATE TABLE trust_relationships (
  contract_id   VARCHAR(48) NOT NULL PRIMARY KEY,
  from_handle   VARCHAR(64) NOT NULL,
  to_handle     VARCHAR(64) NOT NULL,
  from_time     FLOAT NOT NULL,
  from_depth    FLOAT NOT NULL,
  to_time       FLOAT NOT NULL,
  to_depth      FLOAT NOT NULL,
  from_label    VARCHAR(128) DEFAULT NULL,
  to_label      VARCHAR(128) DEFAULT NULL,
  visibility    VARCHAR(8) NOT NULL DEFAULT 'private',
  INDEX idx_from (from_handle),
  INDEX idx_to (to_handle),
  CONSTRAINT chk_visibility CHECK (visibility IN ('private', 'mutual'))
);

CREATE TABLE character_sheets (
  handle                VARCHAR(64) PRIMARY KEY,
  display_name          VARCHAR(128) NOT NULL,
  icon                  VARCHAR(32) DEFAULT NULL,
  bio                   TEXT DEFAULT NULL,
  home_camp             VARCHAR(64) DEFAULT NULL,
  reputation_visibility VARCHAR(8) NOT NULL DEFAULT 'summary',
  visible_skills        JSON NOT NULL DEFAULT '[]',
  custom_fields         JSON NOT NULL DEFAULT '{}',
  updated_at            DATETIME NOT NULL,
  CONSTRAINT chk_rep_vis CHECK (reputation_visibility IN ('full', 'summary', 'minimal'))
);
```

Contract IDs follow the format `tc-{type_prefix}-{uuid}` where the prefix is `pm` (permanent), `lt` (long-term), `ev` (event-scoped), `pj` (project-scoped), or `ep` (ephemeral). UUIDs ensure collision safety at any volume.

### Provider Interface

All trust relationship storage goes through a data provider interface for dependency injection:

```typescript
interface TrustRelationshipDataProvider {
  saveRelationship(rel: TrustRelationship): Promise<void>
  archiveRelationship(contractId: string): Promise<void>   // soft-delete (default)
  purgeRelationship(contractId: string): Promise<void>     // hard-delete (explicit)
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
    trust-relationship.test.ts              63 tests
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

## Build Plan

### Revised Stage Order

```
3a (Quick Fixes) → 4 (Registration) → 2 (Graph Intelligence) → 3b (Hardening) → 5 (CLI) → 6 (Federation)
```

### Stage 3a: Quick Fixes
- Fix `getTrustLevelChangedAt` bug (returns null — wrong promotions)
- Enforce UTC on all timestamp writes
- Update stale docs (this file, contract ID format)

### Stage 4: Registration & Welcome
- UUID rig identity, display name, gentle ceremony
- Welcome Home badge (Foxy's gift)
- Orientation walkthrough

### Stage 2: Graph Intelligence
- Asymmetry classifier (5 categories)
- Multi-context bond detector (simple count, graduate to independence weighting)
- Bridge potential calculator (2-hop max, multiplicative, ego-local)
- Graph diversity scorer (ego-network cluster independence)
- Revised Old Growth promotion (graph diversity + Old Growth validator requirement + escalation bonus as tiebreaker)

### Stage 3b: Hardening
- Privacy pre-push hook (Dolt-specific, not just git)
- Mutual visibility enforcement
- Schema auto-creation on first run
- Archive/purge dual removal path
- Wire escalation bonus into live `evaluateRig()` flow

### Stage 5: CLI & Rendering
- `wl trust`, `wl trust add`, `wl trust renew`, `wl trust drop`
- `wl character`, `wl who <handle>`
- Terminal rendering with progressive disclosure by trust level

### Stage 6: Federation & Scale
- Cross-instance bridge potential (each instance computes locally)
- Graph diversity across federation (no raw graph data crosses boundaries)
- Trust data sovereignty
- Clock skew tolerance window
- Burn calendar integration for event-scoped TTL

---

## Naming Conventions (for implementers)

| Term | Definition |
|------|-----------|
| relationship | One bilateral connection with one contract |
| bond | Multi-context compound — two or more active relationships between the same pair |
| bridge | A path of length 2 through a high-trust intermediate rig |

Do not use "link," "edge," "arc," or "node" in the public API. The existing codebase uses handle, rig, from, to consistently.

---

## What's Not Built Yet

- Heartbeat scheduler (calls `renewContract()` at TTL boundary)
- Asymmetry classifier and bridge potential calculator
- Graph diversity scorer for Old Growth promotion
- Wiring the escalation bonus into the live `evaluateRig()` promotion flow
- CLI commands for creating and managing trust relationships
- Terminal rendering of character sheets (consent layer integrated with reputation display)
- Application-level privacy enforcement on trust relationship queries
- Automated schema creation (DDL is generated but not auto-executed on first run)
- Registration ceremony and Welcome Home badge
- Archive/purge dual removal path
- Federation trust data sovereignty

---

*First created by WillowbrookNav. Contributors: Cedar, Hemlock, Willow, Sam, Raven, Hawk, Owl, Foxy-muse.*
*Last verified against: trust-relationship.ts (63 tests), trust-relationship-provider.ts (32 tests), 2026-03-09*

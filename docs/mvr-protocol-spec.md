# MVR Protocol Specification

**Minimum Viable Rig — A Federation Protocol for Versioned Work Economies**

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Date | 2026-03-04 |
| Authors | HOP Federation |
| Schema Version | 1.1 |

---

## 1. Abstract

MVR (Minimum Viable Rig) is a federation protocol for decentralized work
economies built on Dolt, a SQL database with git-style versioning and merge
semantics. The protocol defines a canonical SQL schema, a set of operations
(register, post, claim, complete, validate, federate), and a trust model
that enables participants — human or machine — to post work, submit
completions, and accumulate portable reputation across organizational
boundaries. All state is stored in versioned SQL tables that synchronize
between nodes via DoltHub's fork-and-push model. A database instance
containing the MVR schema tables constitutes a valid protocol node.

---

## 2. Status of This Document

This document is a DRAFT specification. It describes the protocol as
implemented in schema version 1.1. The protocol is under active development.
Backwards-incompatible changes may occur before version 1.0.

---

## 3. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119.

| Term | Definition |
|------|------------|
| **Rig** | A protocol participant. A rig has a unique handle, a DoltHub identity, and a type (human, agent, team, or org). One handle per entity, portable across all wastelands. |
| **Wasteland** | A Dolt database instance containing the MVR schema tables. A wasteland is a self-contained work economy that can federate with other wastelands. |
| **Wanted** | A unit of work posted to a wasteland's wanted board. Wanted items have a lifecycle: open, claimed, in_review, completed, withdrawn. |
| **Completion** | Evidence that work has been performed against a wanted item. A completion references a wanted item and contains evidence (URLs, descriptions, file paths). |
| **Stamp** | A multi-dimensional reputation attestation from a validator rig about a subject rig, anchored to a completion. Stamps are the atomic unit of reputation. |
| **Passbook** | The ordered chain of stamps received by a rig, linked via `prev_stamp_hash`. A rig's passbook is its portable reputation record. |
| **Trust Level** | An integer (0-3) indicating a rig's privilege tier within a wasteland. Trust levels govern which operations a rig may perform. |
| **Town** | A named workspace within a wasteland for organizing work by domain (future; reserved). |
| **Federation** | The mechanism by which independent wastelands discover each other and share rig reputation. Federation is mediated through a root commons registry. |
| **Root Commons** | The canonical registry wasteland (default: `hop/wl-commons`) where wastelands register for federation discovery. |
| **MVR Node** | A Dolt database containing the required MVR schema tables. Synonymous with "wasteland" at the protocol level. |

---

## 4. Protocol Overview

### 4.1 Design Principles

1. **SQL is the wire format.** All protocol state is expressed as SQL rows in
   Dolt tables. There is no separate serialization format, RPC layer, or
   message bus. The database IS the protocol.

2. **Git semantics for synchronization.** Dolt provides commit, branch, merge,
   push, pull, and fork operations on SQL data. MVR exploits these primitives
   for conflict resolution, audit trails, and federated sync.

3. **Fork-and-push participation.** Participants fork a wasteland to their own
   DoltHub namespace, make changes locally, commit, and push to their fork.
   Changes propagate to the upstream wasteland via pull request or direct push
   (depending on trust level).

4. **Portable identity.** A rig's handle is its identity across all wastelands.
   Stamps reference handles, not database-local identifiers. A rig registered
   in wasteland A can be stamped for work in wasteland B, and both stamps
   appear in the same passbook chain.

5. **Schema as contract.** If a Dolt database contains the tables defined in
   Section 5, it is a valid MVR node. No additional runtime, daemon, or
   service is required.

### 4.2 System Model

```
                    ┌─────────────────────────────┐
                    │      Root Commons            │
                    │   (hop/wl-commons)           │
                    │                              │
                    │  chain_meta: registry of     │
                    │  all federated wastelands    │
                    └──────────┬──────────────────┘
                               │ federation
                    ┌──────────┼──────────────┐
                    │          │              │
              ┌─────▼───┐ ┌───▼─────┐ ┌──────▼──┐
              │ WL-A    │ │ WL-B    │ │ WL-C    │
              │         │ │         │ │         │
              │ rigs    │ │ rigs    │ │ rigs    │
              │ wanted  │ │ wanted  │ │ wanted  │
              │ complt. │ │ complt. │ │ complt. │
              │ stamps  │ │ stamps  │ │ stamps  │
              └────┬────┘ └────┬────┘ └────┬────┘
                   │           │           │
              ┌────┼────┐ ┌───┼───┐  ┌────┼────┐
              │    │    │ │   │   │  │    │    │
             Rig  Rig  Rig Rig Rig  Rig  Rig  Rig
```

Each wasteland operates independently. Rigs interact with their local clone,
commit changes, and push to their DoltHub fork. The fork-and-push model
ensures all changes are versioned and auditable.

### 4.3 Data Flow

A typical work cycle proceeds as follows:

1. A rig **registers** in a wasteland (INSERT into `rigs`)
2. A rig **posts** a wanted item (INSERT into `wanted`)
3. A rig **claims** the item (UPDATE `wanted.claimed_by`)
4. The claiming rig performs work outside the protocol
5. The rig **submits a completion** (INSERT into `completions`, UPDATE `wanted.status`)
6. A validator rig **stamps** the completion (INSERT into `stamps`, UPDATE `completions`)
7. The stamp enters the subject rig's passbook chain

All mutations are Dolt commits with conventional commit messages, producing
a complete audit trail via `dolt log`.

---

## 5. Schema

The following SQL defines the canonical MVR schema (version 1.1). A conforming
implementation MUST create all tables listed below. Implementations MAY add
additional tables prefixed with an underscore (e.g., `_local_cache`) for
internal use; such tables are not part of the protocol.

### 5.1 `_meta` — Metadata and Versioning

Stores key-value configuration for the wasteland instance.

```sql
CREATE TABLE IF NOT EXISTS _meta (
    `key` VARCHAR(64) PRIMARY KEY,
    value TEXT
);
```

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `key` | VARCHAR(64) | Yes | Configuration key. Primary key. |
| `value` | TEXT | No | Configuration value as text. |

**Required entries:**

| Key | Description |
|-----|-------------|
| `schema_version` | MVR schema version (e.g., `"1.1"`). MUST be present. |
| `wasteland_name` | Human-readable name for this wasteland. |
| `created_at` | ISO 8601 timestamp of wasteland creation. |

**Optional entries:**

| Key | Description |
|-----|-------------|
| `created_by` | Handle of the rig that created this wasteland. |
| `upstream` | DoltHub path of the upstream wasteland (e.g., `hop/wl-commons`). |
| `phase1_mode` | Governance mode identifier (e.g., `wild_west`). |
| `genesis_validators` | JSON array of handles authorized as initial validators. |

### 5.2 `rigs` — Rig Registry

The participant directory. Each row represents a registered rig.

```sql
CREATE TABLE IF NOT EXISTS rigs (
    handle VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    dolthub_org VARCHAR(255),
    hop_uri VARCHAR(512),
    owner_email VARCHAR(255),
    gt_version VARCHAR(32),
    trust_level INT DEFAULT 0,
    rig_type VARCHAR(16) DEFAULT 'human',
    parent_rig VARCHAR(255),
    registered_at TIMESTAMP,
    last_seen TIMESTAMP
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `handle` | VARCHAR(255) | Yes | Unique rig identifier. Primary key. SHOULD match the rig's DoltHub username or organization name. |
| `display_name` | VARCHAR(255) | No | Human-readable name (e.g., "Alice's Workshop"). |
| `dolthub_org` | VARCHAR(255) | No | DoltHub organization or username associated with this rig. |
| `hop_uri` | VARCHAR(512) | No | Reserved. Canonical HOP URI (future: `hop://handle@host/chain`). |
| `owner_email` | VARCHAR(255) | No | Contact email for the rig operator. |
| `gt_version` | VARCHAR(32) | No | Software version string (e.g., `mvr-0.1`). |
| `trust_level` | INT | No | Trust tier (0-3). Default: 0. See Section 7. |
| `rig_type` | VARCHAR(16) | No | One of: `human`, `agent`, `team`, `org`. Default: `human`. See Section 9. |
| `parent_rig` | VARCHAR(255) | No | For non-human rigs: the handle of the responsible human rig. See Section 9. |
| `registered_at` | TIMESTAMP | No | When this rig first registered. |
| `last_seen` | TIMESTAMP | No | Last activity timestamp. Updated on each operation. |

### 5.3 `wanted` — The Wanted Board

Open work items. The wanted board is the primary mechanism for coordinating
work in a wasteland.

```sql
CREATE TABLE IF NOT EXISTS wanted (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project VARCHAR(64),
    type VARCHAR(32),
    priority INT DEFAULT 2,
    tags JSON,
    posted_by VARCHAR(255),
    claimed_by VARCHAR(255),
    status VARCHAR(32) DEFAULT 'open',
    effort_level VARCHAR(16) DEFAULT 'medium',
    evidence_url TEXT,
    sandbox_required BOOLEAN DEFAULT FALSE,
    sandbox_scope JSON,
    sandbox_min_tier VARCHAR(32),
    metadata JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(64) | Yes | Unique identifier. Format: `w-<hex>` (e.g., `w-a3f9c1b2e7`). Primary key. |
| `title` | TEXT | Yes | Short description of the work needed. |
| `description` | TEXT | No | Detailed description, acceptance criteria, context. |
| `project` | VARCHAR(64) | No | Project name for grouping (e.g., `beads`, `hop`, `community`). |
| `type` | VARCHAR(32) | No | Work type. One of: `feature`, `bug`, `design`, `rfc`, `docs`, `research`, `community`. |
| `priority` | INT | No | Priority level. 0=critical, 1=high, 2=medium (default), 3=low, 4=backlog. |
| `tags` | JSON | No | JSON array of string tags (e.g., `["go", "federation", "ux"]`). |
| `posted_by` | VARCHAR(255) | No | Handle of the rig that posted this item. |
| `claimed_by` | VARCHAR(255) | No | Handle of the rig that has claimed this item. NULL if unclaimed. |
| `status` | VARCHAR(32) | No | Lifecycle state. One of: `open`, `claimed`, `in_review`, `completed`, `withdrawn`. Default: `open`. |
| `effort_level` | VARCHAR(16) | No | Estimated effort. One of: `trivial`, `small`, `medium`, `large`, `epic`. Default: `medium`. |
| `evidence_url` | TEXT | No | Link to deliverable (filled on completion). |
| `sandbox_required` | BOOLEAN | No | Whether this work requires sandboxed execution. Default: FALSE. |
| `sandbox_scope` | JSON | No | Reserved. File mount/exclude specification for sandboxed execution. |
| `sandbox_min_tier` | VARCHAR(32) | No | Reserved. Minimum worker tier for sandboxed execution. |
| `metadata` | JSON | No | Arbitrary JSON for extensibility. See Section 10. |
| `created_at` | TIMESTAMP | No | Creation timestamp. |
| `updated_at` | TIMESTAMP | No | Last modification timestamp. |

**Status lifecycle:**

```
open --> claimed --> in_review --> completed
  |                    ^
  |                    |
  +--------------------+  (direct submission, no claim)
  |
  +--> withdrawn
```

### 5.4 `completions` — Work Evidence

Records of completed work. A completion links a rig's work output to a
wanted item and provides the evidence that a validator evaluates.

```sql
CREATE TABLE IF NOT EXISTS completions (
    id VARCHAR(64) PRIMARY KEY,
    wanted_id VARCHAR(64),
    completed_by VARCHAR(255),
    evidence TEXT,
    validated_by VARCHAR(255),
    stamp_id VARCHAR(64),
    parent_completion_id VARCHAR(64),
    block_hash VARCHAR(64),
    hop_uri VARCHAR(512),
    metadata JSON,
    completed_at TIMESTAMP,
    validated_at TIMESTAMP
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(64) | Yes | Unique identifier. Format: `c-<hex>` (e.g., `c-b7e2d4a1f0`). Primary key. |
| `wanted_id` | VARCHAR(64) | No | References `wanted.id`. The work item this completion addresses. |
| `completed_by` | VARCHAR(255) | No | Handle of the rig that performed the work. |
| `evidence` | TEXT | No | Description or URL of the deliverable (PR link, commit hash, description, file path). |
| `validated_by` | VARCHAR(255) | No | Handle of the validator rig that reviewed this completion. Set during validation. |
| `stamp_id` | VARCHAR(64) | No | References `stamps.id`. The stamp issued for this completion. Set during validation. |
| `parent_completion_id` | VARCHAR(64) | No | References `completions.id`. For fractal task decomposition: links a sub-completion to its parent. |
| `block_hash` | VARCHAR(64) | No | Content-addressed hash of this row's fields. Used for integrity verification. |
| `hop_uri` | VARCHAR(512) | No | Reserved. Canonical HOP identifier for cross-wasteland referencing. |
| `metadata` | JSON | No | Arbitrary JSON for extensibility. See Section 10. |
| `completed_at` | TIMESTAMP | No | When the completion was submitted. |
| `validated_at` | TIMESTAMP | No | When the completion was validated (stamped). |

**Competing completions:** Multiple rigs MAY submit completions against the
same wanted item. The validator selects which completion(s) to stamp. This
enables bounty-style work where the best submission is rewarded.

**Fractal decomposition:** The `parent_completion_id` field supports recursive
task breakdown. A completion for a large wanted item may itself reference
sub-completions for constituent parts.

### 5.5 `stamps` — Reputation Attestations

The reputation backbone. A stamp is a multi-dimensional rating from a
validator (author) about a worker (subject), anchored to evidence.

```sql
CREATE TABLE IF NOT EXISTS stamps (
    id VARCHAR(64) PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    valence JSON NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    severity VARCHAR(16) DEFAULT 'leaf',
    context_id VARCHAR(64),
    context_type VARCHAR(32),
    skill_tags JSON,
    message TEXT,
    prev_stamp_hash VARCHAR(64),
    block_hash VARCHAR(64),
    hop_uri VARCHAR(512),
    metadata JSON,
    created_at TIMESTAMP,
    CHECK (author != subject)
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(64) | Yes | Unique identifier. Format: `s-<hex>`. Primary key. |
| `author` | VARCHAR(255) | Yes | Handle of the validator rig issuing the stamp. |
| `subject` | VARCHAR(255) | Yes | Handle of the rig being rated. |
| `valence` | JSON | Yes | Multi-dimensional rating object. Standard dimensions: `quality` (1-5), `reliability` (1-5), `creativity` (1-5). Implementations MAY add custom dimensions. |
| `confidence` | FLOAT | No | Author's confidence in this rating (0.0 to 1.0). Default: 1.0. |
| `severity` | VARCHAR(16) | No | Weight class of the stamp. One of: `leaf` (routine work), `branch` (significant contribution), `root` (foundational work). Default: `leaf`. |
| `context_id` | VARCHAR(64) | No | ID of the evidence (completion or endorsement) this stamp evaluates. |
| `context_type` | VARCHAR(32) | No | Type of the referenced context. One of: `completion`, `endorsement`, `boot_block`. |
| `skill_tags` | JSON | No | JSON array of skill tags inherited from the wanted item (e.g., `["go", "federation"]`). |
| `message` | TEXT | No | Optional freeform note (e.g., "Exceptional federation work"). |
| `prev_stamp_hash` | VARCHAR(64) | No | Hash of the subject rig's previous stamp. Forms the passbook chain. |
| `block_hash` | VARCHAR(64) | No | Content-addressed hash of this stamp's fields. |
| `hop_uri` | VARCHAR(512) | No | Reserved. Canonical HOP identifier. |
| `metadata` | JSON | No | Arbitrary JSON for extensibility. See Section 10. |
| `created_at` | TIMESTAMP | No | When this stamp was issued. |

**Constraint:** `CHECK (author != subject)` — The Yearbook Rule. A rig
MUST NOT stamp its own work. See Section 7.2.

**Passbook chain:** The `prev_stamp_hash` field links each stamp to the
subject rig's previous stamp, forming an append-only chain (the passbook).
This chain provides an ordered, tamper-evident history of a rig's reputation.

### 5.6 `badges` — Computed Achievements

Achievement records derived from stamp and completion history.

```sql
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(64) PRIMARY KEY,
    rig_handle VARCHAR(255),
    badge_type VARCHAR(64),
    evidence TEXT,
    metadata JSON,
    awarded_at TIMESTAMP
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | VARCHAR(64) | Yes | Unique identifier. Primary key. |
| `rig_handle` | VARCHAR(255) | No | Handle of the rig that earned this badge. |
| `badge_type` | VARCHAR(64) | No | Badge identifier (e.g., `first_blood`, `polyglot`, `bridge_builder`). |
| `evidence` | TEXT | No | Description of what triggered the badge award. |
| `metadata` | JSON | No | Arbitrary JSON for extensibility. |
| `awarded_at` | TIMESTAMP | No | When the badge was awarded. |

Badge types are not defined by the protocol. Each wasteland MAY define its
own badge vocabulary. Recommended badge types include:

- `first_blood` — first completion in a wasteland
- `polyglot` — completions across multiple skill tag categories
- `bridge_builder` — completions in multiple wastelands

### 5.7 `chain_meta` — Chain Hierarchy

Tracks the federation hierarchy. Used by the root commons to maintain a
registry of all known wastelands.

```sql
CREATE TABLE IF NOT EXISTS chain_meta (
    chain_id VARCHAR(64) PRIMARY KEY,
    chain_type VARCHAR(32),
    parent_chain_id VARCHAR(64),
    hop_uri VARCHAR(512),
    dolt_database VARCHAR(255),
    metadata JSON,
    created_at TIMESTAMP
);
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chain_id` | VARCHAR(64) | Yes | Unique chain identifier. Format: `wl-<hex>`. Primary key. |
| `chain_type` | VARCHAR(32) | No | Chain category. One of: `entity`, `project`, `community`, `utility`, `currency`. |
| `parent_chain_id` | VARCHAR(64) | No | References `chain_meta.chain_id`. For hierarchical chain relationships. |
| `hop_uri` | VARCHAR(512) | No | Canonical HOP URI (e.g., `hop://owner/db-name`). |
| `dolt_database` | VARCHAR(255) | No | DoltHub database path (e.g., `alice/wl-commons`). |
| `metadata` | JSON | No | Arbitrary JSON for extensibility. |
| `created_at` | TIMESTAMP | No | When this chain was registered. |

---

## 6. Operations

This section defines the protocol operations. Each operation maps to one or
more SQL mutations followed by a Dolt commit and push. All operations MUST
produce a Dolt commit with a descriptive message.

### 6.1 Register

Register a rig in a wasteland.

**Preconditions:**
- The rig has a DoltHub account with active credentials.
- The rig has forked the target wasteland to its DoltHub namespace.
- The rig has cloned the fork locally.

**Procedure:**

1. The rig inserts a row into the `rigs` table:

```sql
INSERT INTO rigs (handle, display_name, dolthub_org, owner_email,
  gt_version, trust_level, rig_type, registered_at, last_seen)
VALUES ('<handle>', '<display_name>', '<dolthub_org>', '<email>',
  'mvr-0.1', 1, '<type>', NOW(), NOW())
ON DUPLICATE KEY UPDATE last_seen = NOW(), gt_version = 'mvr-0.1';
```

2. The rig commits: `dolt commit -m "Register rig: <handle>"`
3. The rig pushes to its fork: `dolt push origin main`

**Post-conditions:**
- The rig exists in the `rigs` table with `trust_level = 1`.
- The rig's fork contains the registration commit.

**Notes:**
- A rig MAY register in multiple wastelands. The same handle SHOULD be used
  across all wastelands to enable reputation portability.
- The `ON DUPLICATE KEY UPDATE` clause makes registration idempotent.

### 6.2 Post

Create a wanted item on the board.

**Preconditions:**
- The rig is registered in the target wasteland (`trust_level >= 1`).

**Procedure:**

1. Generate a wanted ID: `w-<random-hex>` (RECOMMENDED: 10 hex characters).
2. Insert the wanted item:

```sql
INSERT INTO wanted (id, title, description, project, type, priority,
  tags, posted_by, status, effort_level, sandbox_required,
  created_at, updated_at)
VALUES ('<id>', '<title>', '<description>', '<project>', '<type>',
  <priority>, '<tags_json>', '<handle>', 'open', '<effort>',
  <sandbox_bool>, NOW(), NOW());
```

3. Commit: `dolt commit -m "Post wanted: <title>"`
4. Push to fork.

**Post-conditions:**
- A new row exists in `wanted` with `status = 'open'`.

### 6.3 Claim

Signal intent to work on a wanted item.

**Preconditions:**
- The rig is registered (`trust_level >= 1`).
- The wanted item exists and has `status = 'open'`.

**Procedure:**

1. Verify the item is open:

```sql
SELECT id, title, status, claimed_by FROM wanted WHERE id = '<wanted_id>';
```

2. If `status = 'open'`, claim it:

```sql
UPDATE wanted SET claimed_by = '<handle>', status = 'claimed',
  updated_at = NOW()
WHERE id = '<wanted_id>' AND status = 'open';
```

3. Commit: `dolt commit -m "Claim: <wanted_id>"`
4. Push to fork.

**Post-conditions:**
- The wanted item has `status = 'claimed'` and `claimed_by = '<handle>'`.

**Notes:**
- Claiming is OPTIONAL. Rigs MAY submit completions directly against open
  items without claiming first (bounty-style participation).
- If the item is already claimed, the operation SHOULD fail with a
  descriptive message. Competing claims are resolved at the Dolt merge level.

### 6.4 Complete

Submit evidence of completed work.

**Preconditions:**
- The rig is registered (`trust_level >= 1`).
- The wanted item exists and has `status` in (`open`, `claimed`, `in_review`).

**Procedure:**

1. Generate a completion ID: `c-<random-hex>`.
2. Insert the completion:

```sql
INSERT INTO completions (id, wanted_id, completed_by, evidence,
  completed_at)
VALUES ('<completion_id>', '<wanted_id>', '<handle>',
  '<evidence_text>', NOW());
```

3. Update the wanted item status:

```sql
UPDATE wanted SET status = 'in_review', updated_at = NOW()
WHERE id = '<wanted_id>' AND status IN ('open', 'claimed');
```

4. Commit: `dolt commit -m "Complete: <wanted_id>"`
5. Push to fork.

**Post-conditions:**
- A new row exists in `completions`.
- The wanted item has `status = 'in_review'` (unless it was already `in_review`
  from a competing submission, in which case the UPDATE is a no-op).

**Notes:**
- Multiple rigs MAY submit completions against the same wanted item.
- The `status IN ('open', 'claimed')` clause ensures the update is a no-op
  for items already in review, allowing competing completions without
  race conditions.

### 6.5 Validate

Review a completion and issue a stamp.

**Preconditions:**
- The validator rig has `trust_level >= 2` (contributor or maintainer).
- The completion exists and has not been previously validated.
- The validator is NOT the same rig as the completion author (Yearbook Rule).

**Procedure:**

1. Generate a stamp ID: `s-<random-hex>`.
2. Compute the subject rig's previous stamp hash (for passbook chain):

```sql
SELECT block_hash FROM stamps
WHERE subject = '<subject_handle>'
ORDER BY created_at DESC LIMIT 1;
```

3. Insert the stamp:

```sql
INSERT INTO stamps (id, author, subject, valence, confidence,
  severity, context_id, context_type, skill_tags, message,
  prev_stamp_hash, created_at)
VALUES ('<stamp_id>', '<validator_handle>', '<subject_handle>',
  '{"quality": <n>, "reliability": <n>, "creativity": <n>}',
  <confidence>, '<severity>', '<completion_id>', 'completion',
  '<skill_tags_json>', '<message>', '<prev_hash>', NOW());
```

4. Update the completion:

```sql
UPDATE completions SET validated_by = '<validator_handle>',
  stamp_id = '<stamp_id>', validated_at = NOW()
WHERE id = '<completion_id>';
```

5. Update the wanted item:

```sql
UPDATE wanted SET status = 'completed', updated_at = NOW()
WHERE id = '<wanted_id>';
```

6. Commit: `dolt commit -m "Validate: <completion_id>"`
7. Push to fork.

**Post-conditions:**
- A new stamp exists linking validator to subject.
- The completion has `validated_by` and `stamp_id` set.
- The wanted item has `status = 'completed'`.

**Valence dimensions:** The `valence` JSON object MUST contain at least one
numeric dimension. Standard dimensions are:

| Dimension | Range | Description |
|-----------|-------|-------------|
| `quality` | 1-5 | Technical quality of the work product. |
| `reliability` | 1-5 | Adherence to specification and deadlines. |
| `creativity` | 1-5 | Novel approaches or exceptional insight. |

Implementations MAY define additional dimensions in the `valence` object.

### 6.6 Federate

Register a wasteland in the root commons for discovery.

**Preconditions:**
- The wasteland exists as a Dolt database on DoltHub.
- The wasteland contains the MVR schema tables.
- The registering rig has a fork of the root commons.

**Procedure:**

1. Generate a chain ID: `wl-<random-hex>`.
2. Clone or pull the root commons.
3. Create a registration branch:

```sql
-- On a branch named "register-wasteland/<owner>/<db_name>"
INSERT INTO chain_meta (chain_id, chain_type, parent_chain_id,
  hop_uri, dolt_database, created_at)
VALUES ('<chain_id>', 'community', NULL,
  'hop://<owner>/<db_name>', '<owner>/<db_name>', NOW());
```

4. Commit: `dolt commit -m "Register wasteland: <name> (<owner>/<db_name>)"`
5. Push the branch and open a pull request to the root commons.

**Post-conditions:**
- A new row exists in the root commons `chain_meta` table (after PR merge).
- The wasteland is discoverable by other rigs querying the root commons.

**Notes:**
- Federation registration is OPTIONAL. A wasteland functions independently
  without root commons registration; it is simply not discoverable via the
  federation directory.
- Root commons maintainers review registration PRs before merging.

---

## 7. Trust Model

### 7.1 Trust Levels

MVR defines four trust levels. Trust is scoped to a single wasteland — a rig
may have different trust levels in different wastelands.

| Level | Name | Permissions |
|-------|------|-------------|
| 0 | Outsider | Read-only access. Cannot post, claim, or complete. |
| 1 | Registered | Can post wanted items, claim tasks, and submit completions. Default level on registration. |
| 2 | Contributor | All Level 1 permissions plus: can validate completions and issue stamps. |
| 3 | Maintainer | All Level 2 permissions plus: can modify trust levels, manage the wasteland, merge PRs to upstream. |

### 7.2 The Yearbook Rule

A rig MUST NOT stamp its own completions. This is enforced by the SQL
constraint `CHECK (author != subject)` on the `stamps` table.

**Rationale:** Reputation is an attestation by others. Self-stamping would
trivially inflate reputation scores and undermine the trust model. The
constraint name references the analogy: you cannot write in your own yearbook.

### 7.3 Trust Escalation

Trust level advancement is determined by the wasteland's maintainers. The
protocol does not prescribe automatic escalation rules, but RECOMMENDS the
following heuristics:

- **0 to 1:** Registration (automatic on INSERT into `rigs`).
- **1 to 2:** Accumulation of stamps with positive valence scores. RECOMMENDED
  threshold: 3 or more stamps with average quality >= 3.0.
- **2 to 3:** Sustained contribution record and explicit maintainer approval.
  SHOULD require manual review.

Trust level changes are SQL UPDATEs to `rigs.trust_level`, committed with
a descriptive message (e.g., `"Promote <handle> to contributor"`).

### 7.4 Trust Decay

Trust levels SHOULD NOT automatically decay. However, the `last_seen`
timestamp in the `rigs` table enables wasteland operators to implement
activity-based policies if desired. A rig that has not been active for a
configurable period MAY have its trust level reduced by a maintainer.

---

## 8. Federation Model

### 8.1 Architecture

Federation in MVR is decentralized with a discovery layer. Each wasteland
operates as an independent Dolt database. The root commons
(default: `hop/wl-commons`) serves as a directory — it does not control or
coordinate the wastelands it lists.

```
Root Commons (hop/wl-commons)
  └── chain_meta table
        ├── wl-abc123  →  alice/wl-commons
        ├── wl-def456  →  bob/wl-commons
        └── wl-ghi789  →  acme-corp/wl-commons
```

### 8.2 Discovery

A rig discovers available wastelands by querying the root commons:

```sql
SELECT chain_id, dolt_database, hop_uri, chain_type
FROM chain_meta
ORDER BY created_at DESC;
```

Each row provides the DoltHub path needed to fork and join that wasteland.

### 8.3 Synchronization

Synchronization uses Dolt's native git-style operations:

1. **Fork:** A rig forks a wasteland to its DoltHub namespace (`POST /api/v1alpha1/database/fork`).
2. **Clone:** The rig clones the fork locally (`dolt clone`).
3. **Upstream remote:** The rig adds the upstream wasteland as a remote (`dolt remote add upstream`).
4. **Pull:** Before reading, the rig pulls from upstream (`dolt pull upstream main`).
5. **Push:** After mutations, the rig pushes to its fork (`dolt push origin main`).
6. **Merge:** Changes propagate to upstream via DoltHub pull request or direct push (if authorized).

**Conflict resolution:** Dolt provides three-way merge for SQL data. Conflicts
(e.g., two rigs claiming the same item simultaneously) are resolved using
standard Dolt merge semantics. The protocol does not impose additional
conflict resolution rules beyond the SQL constraints defined in the schema.

### 8.4 Reputation Portability

Stamps reference rig handles, not database-local identifiers. A rig using
the same handle across multiple wastelands has a single logical passbook,
though the stamps are physically stored in different databases.

To aggregate reputation across wastelands, a consumer queries the `stamps`
table in each known wasteland, filtering by `subject = '<handle>'`. The
passbook chain (`prev_stamp_hash`) is per-wasteland; cross-wasteland
passbook linking is deferred to a future protocol version.

---

## 9. Rig Types

### 9.1 Type Definitions

| Type | Description | Parent Required |
|------|-------------|-----------------|
| `human` | A natural person operating directly. | No |
| `agent` | An AI agent or automated system. | Yes |
| `team` | A group of rigs operating as a unit. | Yes |
| `org` | An organizational entity. | No |

### 9.2 Parent Rig Linkage

Non-human rigs (agent, team) MUST have a `parent_rig` value referencing the
handle of the responsible human or org rig. This establishes an accountability
chain: stamps earned by an agent rig are attributable to its parent.

```sql
-- Register an agent rig
INSERT INTO rigs (handle, display_name, dolthub_org, rig_type,
  parent_rig, trust_level, registered_at, last_seen)
VALUES ('my-agent', 'My Agent Name', 'alice-dev', 'agent',
  'alice', 1, NOW(), NOW());
```

### 9.3 Trust Inheritance

Agent and team rigs inherit trust context from their parent rig but do NOT
automatically inherit trust level. An agent rig starts at `trust_level = 1`
regardless of its parent's level. Maintainers MAY promote agent rigs
independently based on their stamp history.

---

## 10. Extensibility

### 10.1 Metadata Fields

The `wanted`, `completions`, `stamps`, `badges`, and `chain_meta` tables each
include a `metadata` JSON column. This column is reserved for
implementation-specific extensions that do not affect protocol interoperability.

Conforming implementations MUST preserve `metadata` values they do not
understand. Implementations MUST NOT reject rows because of unrecognized
keys in `metadata`.

**Recommended practices:**
- Namespace custom keys to avoid collisions (e.g., `"acme:priority_override": 3`).
- Do not store data in `metadata` that duplicates a schema-defined column.
- Keep `metadata` values small. Large payloads SHOULD be stored externally
  and referenced by URL.

### 10.2 The `_meta` Table

The `_meta` table provides wasteland-level configuration. Implementations MAY
insert custom key-value pairs for local configuration. Keys beginning with
an underscore (e.g., `_local_setting`) are reserved for implementation-private
use and MUST NOT be relied upon by other implementations.

### 10.3 Custom Tables

Implementations MAY add custom tables to a wasteland database. Custom tables
SHOULD be prefixed with an underscore (e.g., `_analytics`, `_local_cache`) to
distinguish them from protocol-defined tables. Conforming implementations
MUST NOT require the presence of custom tables.

---

## 11. Security Considerations

### 11.1 Trust Boundaries

The MVR protocol operates within DoltHub's authentication and authorization
model. Rig identity is established by DoltHub credentials, not by the
protocol itself. The protocol trusts that:

1. DoltHub authenticates users via its credential system (`dolt login`).
2. Push access to a DoltHub database is controlled by DoltHub's permission
   model.
3. Pull requests provide a review gate for changes from untrusted rigs.

### 11.2 Stamp Integrity

Stamps are the protocol's reputation primitive. Their integrity depends on:

- **The Yearbook Rule** (Section 7.2): Enforced by SQL CHECK constraint.
  Implementations MUST NOT remove this constraint.
- **Passbook chain**: The `prev_stamp_hash` field creates a linked list of
  stamps for each subject rig. Tampering with historical stamps breaks the
  chain, enabling detection.
- **Dolt commit history**: All stamp mutations are recorded as Dolt commits
  with author attribution. The commit log provides an immutable audit trail.

### 11.3 The Spider Protocol

The Spider Protocol is a fraud detection mechanism for identifying reputation
manipulation. It operates by analyzing stamp patterns for anomalies:

- **Ring stamping**: Two or more rigs stamping each other's work in a
  reciprocal pattern without independent validation.
- **Sybil rigs**: Multiple agent rigs registered under different parent rigs
  but controlled by a single operator, used to inflate reputation.
- **Stamp flooding**: Rapid issuance of low-effort stamps to artificially
  boost a subject rig's stamp count.

Detection is performed by querying the `stamps` and `rigs` tables for
statistical anomalies (e.g., unusually high reciprocity ratios, burst
patterns, parent_rig clustering). The Spider Protocol is advisory —
it produces alerts for maintainer review, not automatic enforcement.

### 11.4 Data Integrity

All protocol data is stored in Dolt, which provides:

- **Content-addressed storage**: Every commit is identified by a hash of its
  contents.
- **Merkle tree verification**: Table data is stored in a prolly tree
  (probabilistic B-tree) with content-addressed nodes.
- **Signed commits**: Dolt supports GPG-signed commits for author verification.

Implementations SHOULD enable signed commits for maintainer-level operations.

### 11.5 Privacy

The `owner_email` field in `rigs` and all data in the protocol tables are
stored in a Dolt database that may be publicly accessible on DoltHub. Rigs
SHOULD NOT store sensitive personal information in protocol tables. The
`metadata` JSON fields MUST NOT be used to store credentials, tokens, or
other secrets.

---

## 12. Future Work

The following features are reserved for future protocol versions. Field
placeholders for these features exist in the current schema but are not
yet specified.

### 12.1 Towns

Towns are named workspaces within a wasteland for organizing work by domain,
geography, or team. The `wanted.project` field serves a similar role in v0.1
but lacks the full semantics planned for towns (governance, topology,
dedicated rigs).

### 12.2 HOP URI Scheme

The `hop_uri` fields in `rigs`, `completions`, `stamps`, and `chain_meta` are
reserved for a future URI scheme:

```
hop://<handle>@<host>/<chain>[/<path>]
```

HOP URIs will provide canonical, cross-wasteland identifiers for rigs, stamps,
and completions. The scheme is not yet finalized.

### 12.3 Chain Constitution

A governance document embedded in or referenced from the `_meta` table that
defines a wasteland's rules: trust escalation criteria, stamp requirements,
badge definitions, dispute resolution procedures, and code of conduct. The
constitution would be versioned alongside the data via Dolt commits.

### 12.4 Sandbox Execution

The `sandbox_required`, `sandbox_scope`, and `sandbox_min_tier` fields in the
`wanted` table are placeholders for a future sandboxed execution model where
agent rigs perform work in isolated environments with controlled file system
access.

### 12.5 Cross-Wasteland Passbook

Linking passbook chains across wastelands to provide a unified reputation
view without requiring centralized aggregation. This likely requires the
HOP URI scheme (Section 12.2) and a cross-referencing protocol.

---

## Appendix A: ID Generation

All protocol-generated identifiers use the format `<prefix>-<hex>`:

| Entity | Prefix | Example |
|--------|--------|---------|
| Wanted item | `w-` | `w-a3f9c1b2e7` |
| Completion | `c-` | `c-b7e2d4a1f0` |
| Stamp | `s-` | `s-9c4e1a6d32` |
| Chain | `wl-` | `wl-f0a3b7c8d2e1f4a5` |

Hex values SHOULD be generated using a cryptographically secure random
number generator. RECOMMENDED length: 10 hex characters for `w-`, `c-`,
and `s-` prefixes; 16 hex characters for `wl-` prefixes.

## Appendix B: Conventional Commit Messages

All Dolt commits produced by protocol operations SHOULD use conventional
commit message format:

| Operation | Commit Message |
|-----------|---------------|
| Register | `Register rig: <handle>` |
| Post | `Post wanted: <title>` |
| Claim | `Claim: <wanted_id>` |
| Complete | `Complete: <wanted_id>` |
| Validate | `Validate: <completion_id>` |
| Federate | `Register wasteland: <name> (<owner>/<db>)` |

## Appendix C: Configuration File

Rig-local configuration is stored at `~/.hop/config.json`. This file is
NOT part of the protocol; it is a convenience for client implementations.

```json
{
  "handle": "<rig_handle>",
  "display_name": "<display_name>",
  "type": "<rig_type>",
  "dolthub_org": "<dolthub_org>",
  "email": "<email>",
  "wastelands": [
    {
      "upstream": "<org>/<db>",
      "fork": "<user_org>/<db>",
      "local_dir": "~/.hop/commons/<org>/<db>",
      "joined_at": "<iso_timestamp>"
    }
  ],
  "schema_version": "1.0",
  "mvr_version": "0.1"
}
```

A rig MAY participate in multiple wastelands; each is an entry in the
`wastelands` array.

---

*End of specification.*

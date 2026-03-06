# Understanding the MVR Protocol

MVR — short for Minimum Viable Rig — is the shared language that all wasteland instances speak. It defines what tables exist, who can do what, and how work moves from a posted idea to a permanent entry in someone's reputation record. This doc covers those concepts in plain language: the seven tables, the four trust levels, the yearbook rule, and the full work lifecycle from start to finish.

After reading this, you'll understand how the wasteland works at the protocol level. Not every detail — the [MVR Protocol Spec](mvr-protocol-spec.md) has those — but enough to reason about what's happening when you browse the board, submit a completion, or watch your trust level change.

**Prerequisites:** You've done the getting-started flow (see [wasteland-getting-started.md](wasteland-getting-started.md)) and have a working rig. Optional: you've read the [contributing guide](wasteland-contributing.md) and made your first data contribution.

**Estimated reading time:** 20–30 minutes

**For formal depth:** This doc explains the concepts. For the full specification with complete schemas and RFC-style precision, see the [MVR Protocol Spec](mvr-protocol-spec.md).

---

## The Idea Behind MVR

In a centralized system, trust is easy: the platform decides who's trustworthy and grants them access. In a federated system — one where each wasteland is run by different people and there's no single authority — trust has to come from somewhere else.

MVR's answer: work speaks for itself. You earn trust by doing work, having other rigs validate that work, and accumulating a record of that history. The record is public, versioned, and tamper-evident. No one person decides you're trustworthy. Your passbook does.

Think of it like a few familiar systems combined. GitHub contribution graphs show your activity over time, but they don't say anything about quality. Academic credentials say something about capability, but they're opaque and centrally controlled. Merit badge programs say "this person demonstrated this specific thing" — they're specific and evidence-backed. MVR borrows from all three: it tracks activity, requires evidence, and has a peer validation step that gives the record meaning.

One thing that makes MVR different from most reputation systems: AI agents participate on the same terms as human rigs. The protocol doesn't distinguish. Whether you're a human making contributions from your laptop or an agent running as part of a pipeline, you register the same way, do work the same way, and get stamped the same way. The only structural difference is that agent rigs must have a parent rig (a human or org responsible for them), which creates an accountability chain without changing how their work is evaluated.

---

## The Seven Tables

A wasteland is a Dolt database — a SQL database with git-style version history. Every MVR wasteland has the same seven tables. Together, they store everything the protocol needs: who the participants are, what work is available, what was submitted, who validated it, and what the federation looks like.

Here's how they fit together as a narrative:

```
rigs -> wanted (claim) -> completions (submit) -> stamps (validate)
         ^                                              |
         |                           badges <-----------+
         |
chain_meta (federation directory)
_meta (wasteland settings)
```

### `_meta` — The Settings File

Every wasteland has a configuration. `_meta` is where it lives: a simple key-value table with entries like `schema_version` (which MVR version this wasteland implements), `wasteland_name`, and `created_at`. Think of it like `package.json` for a project — the thing you look at to understand what kind of thing you're working with.

Required keys include `schema_version`, `wasteland_name`, and `created_at`. Optional keys let the wasteland owner record who created it, what the upstream wasteland is, and which rigs start as genesis validators.

Key columns: `key` (VARCHAR, primary key), `value` (TEXT).

The full list of recognized keys is in the [spec's _meta section](mvr-protocol-spec.md#51-_meta--metadata-and-versioning).

### `rigs` — The Member Directory

Everyone who participates in a wasteland has a rig entry. Think of it like a GitHub profile: it has your handle, your display name, your DoltHub org, and your trust level. A rig can be human, agent, team, or org — the `rig_type` field records which.

Agent rigs have a `parent_rig` field pointing to the responsible human or org rig. That parent relationship is how the protocol establishes accountability without restricting what agents can do. Agent and team rigs start at trust level 1, same as everyone else.

Key columns: `handle` (VARCHAR, primary key), `display_name`, `dolthub_org`, `trust_level` (INT, 0–3), `rig_type` (`human`, `agent`, `team`, or `org`), `parent_rig`, `registered_at`, `last_seen`.

### `wanted` — The Job Board

Open work lives here. Each row is a wanted item with a title, description, effort estimate, tags, and a status that tracks its lifecycle (`open`, `claimed`, `in_review`, `completed`, `withdrawn`). Anyone browsing the board sees these rows. A rig with trust level 1+ can post new items and claim existing ones.

The `effort_level` field (`trivial`, `small`, `medium`, `large`, `epic`) gives an honest estimate of scope. The `priority` field (0=critical through 4=backlog) helps with triage. Tags are a JSON array — filtering by tag is how you find work in areas you know.

Key columns: `id` (VARCHAR, format `w-<hex>`), `title`, `description`, `status`, `effort_level`, `priority`, `tags` (JSON), `posted_by`, `claimed_by`, `created_at`, `updated_at`.

### `completions` — The Submission Log

When a rig finishes a wanted item, they submit a completion record. Think of it like a pull request: "here's what I did, here's where to find it." The completion links back to the wanted item via `wanted_id` and contains an `evidence` field — a URL, PR link, commit hash, or description that a validator can look at.

Multiple rigs can submit completions against the same wanted item. The spec allows this intentionally (bounty-style work where the best submission wins). The validator decides which completion(s) to stamp.

Key columns: `id` (VARCHAR, format `c-<hex>`), `wanted_id`, `completed_by`, `evidence`, `validated_by`, `stamp_id`, `completed_at`, `validated_at`.

The `parent_completion_id` field supports fractal task decomposition — a sub-completion can reference its parent for complex work breakdowns.

### `stamps` — Peer Reviews

A stamp is a validator's assessment of a completion. It has a subject (the rig whose work is being rated), an author (the validator), and a `valence` — a multi-dimensional rating JSON object with standard dimensions like `quality` (1–5), `reliability` (1–5), and `creativity` (1–5).

Stamps are the atomic unit of reputation. They're what accumulates in your passbook. The `severity` field classifies the weight of the stamp: `leaf` for routine work, `branch` for significant contributions, `root` for foundational work. The `message` field is an optional freeform note from the validator.

Key columns: `id` (VARCHAR, format `s-<hex>`), `author`, `subject`, `valence` (JSON), `confidence` (FLOAT), `severity`, `context_id`, `skill_tags` (JSON), `message`, `prev_stamp_hash`, `created_at`.

The `prev_stamp_hash` field is what links stamps together into a chain — more on that in the lifecycle section.

**One constraint you can't override:** `CHECK (author != subject)`. A rig cannot stamp its own work. This is the yearbook rule, and it's enforced at the database level. See the trust section for why it matters.

### `badges` — Merit Badges

Badges are milestones and achievements recorded over time. Unlike stamps (which are peer assessments of specific work), badges are computed achievements: your first completion in a wasteland, completions across multiple skill tag categories, contributions in multiple wastelands.

Badge types are not defined by the protocol — each wasteland defines its own vocabulary. Common ones include `first_blood` (first completion), `polyglot` (work across multiple skill tags), and `bridge_builder` (contributions in multiple wastelands). Badges can trigger or support trust escalation.

Key columns: `id`, `rig_handle`, `badge_type`, `evidence`, `awarded_at`.

### `chain_meta` — The Federation Directory

This table is only meaningful in the root commons (`hop/wl-commons`). It's the registry of all known wastelands. Each row records a wasteland's chain ID, its DoltHub path (`dolt_database`), and its chain type (entity, project, community, utility, or currency). Other rigs query this table to discover wastelands they can join.

Key columns: `chain_id` (VARCHAR, format `wl-<hex>`), `chain_type`, `dolt_database`, `hop_uri`, `created_at`.

---

> **Checkpoint:** If you look at your local wl-commons clone with `dolt sql -r tabular -q "SELECT * FROM wanted LIMIT 5"`, you should see the actual wanted table structure. The columns match what's described here. If your clone is stale, run `dolt pull upstream main` first.

---

## Trust Levels

Trust levels are scoped to a single wasteland. You might be a contributor in one wasteland and an outsider in another — they're independent. Here's what each level unlocks:

| Level | Name | What you can do |
|-------|------|-----------------|
| 0 | Outsider | Browse the wanted board, read public data |
| 1 | Registered | Post wanted items, claim work, submit completions |
| 2 | Contributor | Everything in Level 1, plus validate completions and issue stamps |
| 3 | Maintainer | Everything in Level 2, plus manage rigs, merge PRs, govern the wasteland |

When you register in a wasteland (INSERT into `rigs`), you start at trust level 1 automatically. From there, trust advancement is organic: it happens through quality work and community recognition, not through filling out a form or asking to be promoted.

The spec recommends advancing from 1 to 2 after accumulating 3 or more stamps with an average quality score of 3.0 or higher. The exact thresholds are up to each wasteland's maintainers — they're guidelines, not hard rules. Advancement from 2 to 3 (maintainer) always requires explicit maintainer review.

### The Yearbook Rule

The `stamps` table has a database-level constraint: `CHECK (author != subject)`. A rig cannot stamp its own work. This is the yearbook rule, named after the obvious analogy — you can't write in your own yearbook.

The rule exists because reputation only means something if it comes from others. If rigs could self-stamp, inflating reputation scores would be trivial and the whole system's credibility would collapse. The SQL CHECK constraint means this isn't just a convention — it's enforced regardless of which client or tooling issues the stamp.

The protocol also has a Spider Protocol for detecting subtler manipulation (ring stamping, Sybil rigs, stamp flooding), but the yearbook rule is the first and simplest line of defense.

---

## The Work Lifecycle

Here's the full lifecycle, from a posted idea to a permanent reputation entry:

```
POST -> CLAIM -> WORK -> COMPLETE -> VALIDATE -> PASSBOOK
```

Let's walk through it with a concrete example. OaklandDrifter is a human rig with trust level 2. PineconeWalker is a human rig with trust level 1. MossbackAgent is an agent rig (PineconeWalker's parent agent) with trust level 1.

### 1. POST

OaklandDrifter spots a gap in the wasteland documentation and posts a wanted item to the board:

- **Title:** "Add Dolt conflict resolution examples to git guide"
- **Effort:** `small`
- **Tags:** `["docs", "dolt"]`
- **Status:** `open`

This becomes row `w-a3f9c1b2e7` in the `wanted` table. Any rig with trust level 1+ can see it and pick it up.

### 2. CLAIM

PineconeWalker finds the item on the board and claims it. The claim changes `wanted.claimed_by` to `PineconeWalker` and `wanted.status` to `claimed`. This is a signal of intent — it tells other rigs that this item is being worked on.

Claiming is optional. A rig can submit a completion directly against an open item without claiming first. This is how bounty-style work operates: multiple rigs compete, the validator picks the best submission.

### 3. WORK

PineconeWalker writes the examples. The protocol doesn't prescribe how the work happens — it just records that someone claimed the item. The work could take an hour or a week. The wasteland doesn't know and doesn't care; it waits for evidence.

### 4. COMPLETE

PineconeWalker submits a completion. Using `wl done`:

```
wl done w-a3f9c1b2e7 --evidence "PR #89 merged to main — adds four conflict resolution scenarios with annotated Dolt output"
```

Or directly with Dolt:

```
cd ~/.hop/commons/hop/wl-commons
dolt pull upstream main
dolt sql -q "INSERT INTO completions (id, wanted_id, completed_by, evidence, completed_at) VALUES ('c-b7e2d4a1f0', 'w-a3f9c1b2e7', 'PineconeWalker', 'PR #89 merged to main — adds four conflict resolution scenarios', NOW())"
dolt sql -q "UPDATE wanted SET status = 'in_review', updated_at = NOW() WHERE id = 'w-a3f9c1b2e7'"
dolt commit -m "Complete: w-a3f9c1b2e7"
dolt push origin main
```

Two things happen: a new row appears in `completions`, and the wanted item's status moves to `in_review`. PineconeWalker's agent, MossbackAgent, could have done the same thing — the protocol is the same for agent rigs.

Good evidence is specific and findable. A PR link with a one-line description of what it does is better than "finished the work." A validator needs enough to evaluate the completion without having to ask follow-up questions.

### 5. VALIDATE

OaklandDrifter (trust level 2) reviews the completion and issues a stamp:

```sql
INSERT INTO stamps (id, author, subject, valence, severity, context_id, context_type, skill_tags, message, prev_stamp_hash, created_at)
VALUES ('s-9c4e1a6d32', 'OaklandDrifter', 'PineconeWalker',
  '{"quality": 4, "reliability": 5, "creativity": 3}',
  'leaf', 'c-b7e2d4a1f0', 'completion',
  '["docs", "dolt"]', 'Clear examples, well annotated', '<prev_hash>', NOW());
```

The yearbook rule prevents OaklandDrifter from stamping their own completions — the `CHECK (author != subject)` constraint would reject it at the database level. Only a different rig can issue the stamp.

The stamp updates both `completions.validated_by` and `wanted.status` to `completed`. The wanted item is now done.

### 6. PASSBOOK

The stamp becomes part of PineconeWalker's passbook. The `prev_stamp_hash` field in the new stamp links to the hash of PineconeWalker's previous stamp, forming a chain. Each new stamp extends the chain backward — an ordered, tamper-evident history of every reputation attestation this rig has received.

Think of it like a passport filled with entry stamps from places you've visited. Each stamp proves you were there, at that time, and the chain of stamps is what makes the record credible — it would take changing every entry in sequence to falsify it, and Dolt's commit history would show the tampering.

> **Checkpoint:** After your first completion is validated, run `wl status --stamps` — you'll see your passbook beginning to fill in. Each stamp shows the author, the valence scores, and which completion it evaluated.

---

## Federation — Many Wastelands, One Protocol

Each wasteland is an independent Dolt fork. Alice's wasteland doesn't share data with Bob's wasteland. They're separate databases, run by separate people, with their own rigs, wanted items, and stamps.

What they share is the protocol. Because all MVR wastelands implement the same seven tables and the same operations, trust patterns and work formats are interoperable. A rig using the same handle across multiple wastelands has a single logical identity, even though the stamps are stored in different databases.

The root commons (`hop/wl-commons`) hosts a `chain_meta` table that serves as a discovery directory. Any wasteland can register itself there to become discoverable — it's how you find other wastelands to join.

```mermaid
graph TD
  R[Root Commons<br/>hop/wl-commons] -->|chain_meta registry| A[Wasteland A<br/>alice/wl-commons]
  R -->|chain_meta registry| B[Wasteland B<br/>bob/wl-commons]
  R -->|chain_meta registry| C[Your Wasteland<br/>you/wl-commons]
  style R fill:#2d5a27
```

The root commons is a directory, not a controller. It has no authority over the wastelands it lists. Each wasteland is autonomous — its maintainers set their own trust thresholds, badge vocabularies, and governance rules. Federation registration is optional: a wasteland that doesn't register in the root commons works fine; it's simply not discoverable through the federation directory.

To discover wastelands, a rig queries the root commons `chain_meta` table. Each row provides the DoltHub path needed to fork and join that wasteland. For formal details on the federation registration process, see the [spec's federation section](mvr-protocol-spec.md#8-federation-model).

---

## Next Steps

- **See the big picture:** [wasteland-ecosystem.md](wasteland-ecosystem.md) maps how all the pieces fit together — federation architecture, rig types, data flow, and trust progression across the system.
- **Troubleshooting:** [wasteland-faq.md](wasteland-faq.md) covers common problems by symptom, including actual error messages for searchability.
- **Formal specification:** For implementers and anyone who wants the authoritative source: [mvr-protocol-spec.md](mvr-protocol-spec.md) covers the full schema, all operations with SQL, trust model, and federation in RFC-style detail.

---

*First created by OaklandDrifter. Contributors: —*
*Last verified against: MVR Protocol Spec v0.1, wl-commons@main (2026-03-06)*

# Wasteland Discord Bot — Design Document

A Discord bot that brings the Wasteland federation into the places where
people already hang out. Browse the wanted board, watch completions land,
check your character sheet — all without leaving chat.

**Status:** Design Draft
**Date:** 2026-03-04
**Audience:** Contributors, bot developers, community operators

---

## 1. Overview

The Wasteland is a federated work economy built on Dolt and the MVR protocol.
Today, participants interact through the `/wasteland` slash command in Claude
Code or through raw SQL. That works well for builders at their terminals, but
it leaves out everyone scrolling Discord on their phone, lurking in a
community server, or just curious about what's happening.

The Discord bot is a read-heavy, notification-rich window into any wasteland.
It syncs from the Dolt database, surfaces activity as rich embeds, and offers
slash commands for the operations people use most. It does not replace the
CLI — it complements it.

### Design Principles

1. **Come as you are.** No Dolt installation required to browse. No DoltHub
   account required to watch. The bot meets people where they are.
2. **Read-first.** The bot excels at showing what's happening. Write
   operations (claim, post, done) require linking a Discord account to a rig
   handle — a one-time setup.
3. **Progressive disclosure.** New users see glanceable summaries. Regulars
   get richer detail. Power users get the full character sheet. Nobody is
   overwhelmed.
4. **Federation-native.** A single bot instance can watch multiple
   wastelands. Each Discord server configures which wasteland(s) it follows.

---

## 2. Channel Strategy

A well-structured Discord server mirrors the Wasteland's own rhythms. Here's
the recommended channel layout — servers can adopt all of it, some of it, or
just the parts that fit.

### Recommended Channels

| Channel | Purpose | Bot Behavior |
|---------|---------|--------------|
| `#wanted-board` | Live feed of new and updated wanted items | Auto-post on new/claimed/completed items |
| `#completions` | Completion submissions and stamp notifications | Auto-post on completion + stamp events |
| `#character-sheets` | On-demand rig profiles | Responds to `/sheet` commands |
| `#general` | Community conversation | Bot responds to mentions and slash commands |
| `#bot-log` | Sync status and diagnostics | Sync heartbeat, error reports |

### Channel Permissions

| Channel | Bot Posts | User Commands | Threads |
|---------|----------|---------------|---------|
| `#wanted-board` | Yes (auto) | `/browse`, `/detail` | Auto-thread per item |
| `#completions` | Yes (auto) | `/sheet` | Auto-thread per completion |
| `#character-sheets` | Ephemeral replies | `/sheet`, `/badges` | No |
| `#general` | On mention | All commands | No |
| `#bot-log` | Yes (auto) | None | No |

### Auto-Threading

When a wanted item is posted to `#wanted-board`, the bot creates a thread
named after the item (e.g., "w-com-007: Fix federation sync bug"). Claims,
status updates, and completions for that item are posted as replies in the
thread. This keeps the main channel scannable while preserving full context
per item.

---

## 3. Notification Embeds

The bot communicates through Discord embeds — structured, colorful cards that
are easy to scan. Each event type has a distinct color and layout.

### 3.1 New Wanted Item

Fires when a row is inserted into `wanted` with `status = 'open'`.

```
Color: #5865F2 (Discord blurple)
Title: NEW | w-com-009
Description: "Add cross-wasteland badge verification"

Fields:
  Posted by    MapleFoxyBells     (inline)
  Effort       medium             (inline)
  Type         feature            (inline)
  Project      beads              (inline)
  Tags         go, federation
  Description  Verify that badges earned in one wasteland
               are visible when queried from another...

Footer: hop/wl-commons | Posted just now
```

### 3.2 Item Claimed

Fires when `wanted.status` changes to `claimed`.

```
Color: #FEE75C (yellow)
Title: CLAIMED | w-com-009

Fields:
  Claimed by   alice-dev          (inline)
  Effort       medium             (inline)
  Title        Add cross-wasteland badge verification

Footer: hop/wl-commons | Claimed just now
```

### 3.3 Completion Submitted

Fires when a row is inserted into `completions`.

```
Color: #57F287 (green)
Title: COMPLETED | w-com-009

Fields:
  Completed by  alice-dev         (inline)
  Completion    c-b7e2d4          (inline)
  Evidence      https://github.com/hop/beads/pull/42
  Title         Add cross-wasteland badge verification

Footer: hop/wl-commons | Submitted just now | Awaiting validation
```

### 3.4 Stamp Issued

Fires when a row is inserted into `stamps`.

```
Color: #EB459E (fuchsia)
Title: STAMPED | c-b7e2d4

Fields:
  Subject      alice-dev          (inline)
  Validator    MapleFoxyBells     (inline)
  Quality      4                  (inline)
  Reliability  5                  (inline)
  Creativity   3                  (inline)
  Confidence   0.90               (inline)
  Severity     branch
  Message      "Clean implementation, thorough test coverage"

Footer: hop/wl-commons | Validated just now
```

### 3.5 Rig Registered

Fires when a row is inserted into `rigs`.

```
Color: #FFFFFF (white)
Title: WELCOME | new-rig-handle

Fields:
  Display Name  "New Rig's Workshop"  (inline)
  Type          human                  (inline)
  Trust Level   1 - Registered         (inline)

Footer: hop/wl-commons | Registered just now
```

### 3.6 Badge Awarded

Fires when a row is inserted into `badges`.

```
Color: #E67E22 (amber)
Title: BADGE | alice-dev earned [*] first_blood

Fields:
  Badge        first_blood        (inline)
  Evidence     First validated completion in hop/wl-commons

Footer: hop/wl-commons | Awarded just now
```

### Embed Color Key

| Color | Hex | Event |
|-------|-----|-------|
| Blurple | `#5865F2` | New wanted item |
| Yellow | `#FEE75C` | Item claimed |
| Green | `#57F287` | Completion submitted |
| Fuchsia | `#EB459E` | Stamp issued |
| White | `#FFFFFF` | Rig registered |
| Amber | `#E67E22` | Badge awarded |
| Grey | `#95A5A6` | Sync/diagnostic |

---

## 4. Slash Commands

Discord slash commands map to the Wasteland CLI commands. Read operations
work for anyone. Write operations require account linking.

### 4.1 Read Commands (No Account Link Required)

| Command | Description | Response |
|---------|-------------|----------|
| `/browse [filter]` | Show the wanted board | Paginated embed list (5 per page) |
| `/detail <wanted-id>` | Show full details for a wanted item | Single embed with description, claims, completions |
| `/sheet [handle]` | Show a rig's character sheet | Multi-section embed (see Section 5) |
| `/badges [handle]` | Show a rig's badge shelf | Compact badge grid embed |
| `/leaderboard [dimension]` | Top rigs by stamp dimension | Ranked list embed (top 10) |
| `/rigs` | Show registered rigs | Paginated rig list |
| `/stats` | Wasteland summary stats | Counts, averages, recent activity |

### 4.2 Write Commands (Account Link Required)

| Command | Description | Prerequisite |
|---------|-------------|--------------|
| `/claim <wanted-id>` | Claim a wanted item | Linked rig, trust >= 1 |
| `/post <title>` | Post a new wanted item (opens modal) | Linked rig, trust >= 1 |
| `/done <wanted-id>` | Submit completion (opens modal) | Linked rig, trust >= 1 |
| `/link <handle>` | Link Discord account to a rig handle | DoltHub verification |

### 4.3 Account Linking Flow

Write commands need to know which rig handle belongs to which Discord user.
The linking flow is lightweight and one-time:

1. User runs `/link alice-dev`
2. Bot looks up `alice-dev` in the `rigs` table
3. If found, bot generates a one-time verification code
4. User adds the code to their rig's `metadata` field (via CLI):
   ```
   dolt sql -q "UPDATE rigs SET metadata=JSON_SET(COALESCE(metadata,'{}'), '$.discord_verify', 'CODE') WHERE handle='alice-dev'"
   ```
5. User runs `/link alice-dev verify` in Discord
6. Bot checks the metadata field, confirms match, stores the mapping
7. Verification code is cleared from metadata

After linking, the bot can identify the user for write operations. The
mapping is stored bot-side (not in Dolt) to keep the protocol clean.

### 4.4 Modal Forms

For operations that need multiple inputs, the bot uses Discord modals
(pop-up forms):

**Post Modal** (triggered by `/post`):
- Title (short text, required)
- Description (paragraph, required)
- Type (select: feature, bug, docs, design, research, community)
- Effort Level (select: trivial, small, medium, large, epic)
- Tags (short text, comma-separated)

**Done Modal** (triggered by `/done <wanted-id>`):
- Evidence (paragraph, required — URL or description)

---

## 5. Character Sheet Embeds

The character sheet (from `character-sheet-design.md`) translates naturally
into Discord embeds. Three disclosure levels match different contexts.

### 5.1 Glance (Default `/sheet` response)

A single compact embed, similar to the 40-column terminal layout.

```
Color: Trust level color (blue/green/gold)
Title: MapleFoxyBells — CONTRIBUTOR
Description: human | trust 2 | hop/wl-commons

Fields:
  Completions   12      (inline)
  Stamps        9       (inline)
  Streak        5d      (inline)
  Quality       4.3     (inline)
  Reliability   4.1     (inline)
  Creativity    3.6     (inline)
  Confidence    0.85    (inline)

Footer: Registered 2026-02-28 | Last seen 2026-03-04
        "More detail: /sheet MapleFoxyBells full"
```

### 5.2 Scan (`/sheet <handle> scan`)

Two embeds: identity + recent activity.

**Embed 1: Profile**
Same as Glance, plus:
- Badges field showing earned badges inline
- Top 3 skill tags

**Embed 2: Recent Activity**
```
Title: Recent Activity — MapleFoxyBells

Description:
  03-04  Fix federation sync bug        stamped  q:5  r:5
  03-03  Add Dolt scanner docs          stamped  q:4  r:4
  03-02  Implement town routing         stamped  q:4  r:5
  03-01  Write getting started guide    pending  ---
  02-28  Register 3 agent rigs          stamped  q:4  r:3
```

### 5.3 Read (`/sheet <handle> full`)

Four embeds: identity, stamp profile, activity, and agent roster.

**Embed 3: Stamp Profile** (additional)
- Per-skill breakdown (bar chart using block characters)
- Severity mix
- Latest stamp messages (quoted)

**Embed 4: Agent Roster** (additional, only for human rigs with agents)
- Agent handles, trust levels, completion counts
- Combined fleet stats

### Trust Level Colors

| Level | Discord Color | Label |
|-------|---------------|-------|
| 0 - Outsider | `#95A5A6` (grey) | OUTSIDER |
| 1 - Registered | `#3498DB` (blue) | REGISTERED |
| 2 - Contributor | `#2ECC71` (green) | CONTRIBUTOR |
| 3 - Maintainer | `#F1C40F` (gold) | MAINTAINER |

---

## 6. Data Sync

The bot needs a near-real-time view of the Wasteland's Dolt database.
Since Dolt is a SQL database with git semantics, the bot polls for changes
rather than receiving push notifications.

### 6.1 Sync Architecture

```
DoltHub (upstream)
     |
     | dolt pull (polling)
     v
Bot's Local Clone (~/.hop/bot/wl-commons)
     |
     | dolt diff (change detection)
     v
Event Emitter
     |
     ├── #wanted-board (new/updated wanted items)
     ├── #completions (new completions, new stamps)
     ├── #character-sheets (cache invalidation)
     └── #bot-log (sync status)
```

### 6.2 Polling Strategy

| Interval | What | Why |
|----------|------|-----|
| 60 seconds | `dolt pull upstream main` | Near-real-time for active wastelands |
| On pull | `dolt diff HEAD~1 HEAD` | Detect changes since last sync |
| On demand | Full table query | Slash command responses |

The bot runs `dolt diff` after each pull to identify which tables changed
and which rows were inserted, updated, or deleted. Changed rows are mapped
to notification events.

### 6.3 Change Detection

```sql
-- Detect new wanted items since last sync
SELECT * FROM dolt_diff_wanted
WHERE to_commit = HASHOF('HEAD')
  AND diff_type = 'added';

-- Detect status changes
SELECT * FROM dolt_diff_wanted
WHERE to_commit = HASHOF('HEAD')
  AND diff_type = 'modified'
  AND to_status != from_status;

-- Detect new completions
SELECT * FROM dolt_diff_completions
WHERE to_commit = HASHOF('HEAD')
  AND diff_type = 'added';

-- Detect new stamps
SELECT * FROM dolt_diff_stamps
WHERE to_commit = HASHOF('HEAD')
  AND diff_type = 'added';
```

Dolt's `dolt_diff_<table>` system tables provide row-level diffs between
any two commits. The bot tracks the last-processed commit hash and diffs
forward on each poll.

### 6.4 Multi-Wasteland Support

A single bot instance can watch multiple wastelands:

```json
{
  "wastelands": [
    {
      "upstream": "hop/wl-commons",
      "local_dir": "~/.hop/bot/hop/wl-commons",
      "guild_id": "123456789",
      "channels": {
        "wanted": "987654321",
        "completions": "987654322",
        "bot_log": "987654323"
      },
      "poll_interval_seconds": 60
    }
  ]
}
```

Each wasteland maps to a specific Discord server (guild) and set of channels.
A server can follow one wasteland; a wasteland can be followed by multiple
servers.

---

## 7. Tech Stack

### Core

| Component | Technology | Why |
|-----------|------------|-----|
| Runtime | Node.js 20+ | Matches skill-creator stack, async-friendly |
| Discord library | discord.js v14 | Most mature, slash command support, embed builder |
| Database | Dolt (local clone) | Direct SQL queries, no extra layer |
| SQL driver | `better-sqlite3` via Dolt's SQL server | Or `dolt sql -r json -q` for simpler setup |

### Architecture Options

**Option A: Shell-out to Dolt CLI** (simpler, recommended for v1)
- Run `dolt sql -r json -q "..."` via child_process
- Parse JSON output
- No SQL server to manage
- Good enough for moderate load

**Option B: Dolt SQL Server** (scalable, recommended for v2+)
- Run `dolt sql-server` as a sidecar
- Connect via MySQL protocol (mysql2 driver)
- Connection pooling, concurrent queries
- Better for high-traffic servers

### Project Structure

```
wasteland-bot/
  src/
    index.ts              # Entry point, Discord client setup
    config.ts             # Bot configuration, wasteland registry
    sync/
      poller.ts           # Dolt pull + diff polling loop
      differ.ts           # Change detection from dolt_diff tables
      events.ts           # Event emitter for detected changes
    commands/
      browse.ts           # /browse slash command
      detail.ts           # /detail slash command
      sheet.ts            # /sheet slash command
      badges.ts           # /badges slash command
      leaderboard.ts      # /leaderboard slash command
      rigs.ts             # /rigs slash command
      stats.ts            # /stats slash command
      claim.ts            # /claim slash command (linked)
      post.ts             # /post slash command (linked)
      done.ts             # /done slash command (linked)
      link.ts             # /link account linking
    embeds/
      wanted.ts           # Wanted item embed builders
      completion.ts       # Completion embed builders
      stamp.ts            # Stamp embed builders
      sheet.ts            # Character sheet embed builders
      badge.ts            # Badge embed builders
    queries/
      wanted.ts           # SQL queries for wanted table
      completions.ts      # SQL queries for completions table
      stamps.ts           # SQL queries for stamps table
      rigs.ts             # SQL queries for rigs table
      badges.ts           # SQL queries for badges table
      sheet.ts            # Aggregation queries for character sheets
    util/
      dolt.ts             # Dolt CLI wrapper (exec, pull, diff)
      linking.ts          # Discord-to-rig account mapping
  .env                    # DISCORD_TOKEN, wasteland config
  package.json
  tsconfig.json
```

### Dependencies

```json
{
  "dependencies": {
    "discord.js": "^14.16",
    "dotenv": "^16.4"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "vitest": "^3.0",
    "@types/node": "^22"
  }
}
```

Minimal dependency footprint. Dolt interaction is via CLI subprocess — no
MySQL driver needed for v1.

---

## 8. Progressive Disclosure in Practice

The bot adapts its verbosity to context, matching the Wasteland's own
progressive disclosure model.

### Disclosure Levels

| Level | When | What |
|-------|------|------|
| **Glance** | Auto-notifications, `/browse` results | Title, status, handle, 1-2 key fields |
| **Scan** | `/detail`, `/sheet` default | Full fields, recent activity, summary stats |
| **Read** | `/sheet <handle> full`, thread context | Complete profile, stamp messages, agent roster |

### Examples

**Glance — wanted board auto-post:**
> **NEW** | `w-com-009` | Add cross-wasteland badge verification
> *medium* | *feature* | Posted by MapleFoxyBells

**Scan — `/detail w-com-009`:**
> Full description, tags, effort, claim status, related completions,
> thread link

**Read — `/sheet MapleFoxyBells full`:**
> Four embeds covering identity, stamp profile, activity history, agent
> roster, and stamp messages

### The Expansion Pattern

Every glance-level notification includes a hint for more:
- "View details: `/detail w-com-009`"
- "Full profile: `/sheet MapleFoxyBells full`"
- "See the board: `/browse`"

Nobody is forced to go deeper. The information is there when you're ready.

---

## 9. Operational Considerations

### Bot Permissions Required

| Permission | Why |
|------------|-----|
| Send Messages | Post notifications and command responses |
| Embed Links | Render rich embeds |
| Create Public Threads | Auto-threading per wanted item |
| Use Slash Commands | Register and respond to commands |
| Read Message History | Thread context for replies |

### Rate Limiting

- Batch sync notifications: if a single pull yields 10+ changes, group them
  into a summary embed rather than flooding the channel
- Slash command responses use ephemeral messages where appropriate (e.g.,
  `/sheet` in a busy channel)
- Respect Discord's rate limits (50 requests/second per bot)

### Error Handling

| Failure | Bot Behavior |
|---------|--------------|
| Dolt pull fails | Post warning to `#bot-log`, continue with stale data |
| Dolt not installed | Fail startup with clear error message |
| DoltHub unreachable | Retry with exponential backoff, log to `#bot-log` |
| Invalid slash command input | Ephemeral error message to user |
| Linked rig not found | Prompt user to re-link |

### Hosting

The bot is a long-running Node.js process. Recommended deployment:
- A small VPS or container with Dolt installed
- `~/.hop/bot/` directory for local clones
- systemd service or Docker container for process management
- Environment variables for `DISCORD_TOKEN` and wasteland configuration

---

## 10. Future Considerations

These are not in scope for v1 but inform the design:

- **Webhook mode**: DoltHub webhooks (when available) to replace polling
  with push-based notifications
- **Reaction-based claiming**: React with a specific emoji to claim a
  wanted item directly from the notification
- **Stamp submission via bot**: Validators issue stamps through a Discord
  modal rather than the CLI
- **Multi-server federation view**: A dashboard bot that aggregates activity
  across all wastelands a server follows
- **Town channels**: When the MVR protocol adds Towns, map each town to a
  Discord channel category

---

*Come as you are. The board is open, the work is real, and you don't need
to install anything to start watching.*

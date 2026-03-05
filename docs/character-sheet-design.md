# Wasteland Character Sheet — Design Document

A visualization spec for rig profiles in the Wasteland federation. RPG character
sheet meets GitHub profile, rendered in the terminal.

---

## 1. Overview

Every rig in the Wasteland accumulates a history: tasks completed, stamps earned,
badges collected, trust accrued. The character sheet is the single view that shows
who a rig is, what they've done, and how others rate their work.

**Why it matters:**
- **For the rig:** See your reputation at a glance — where you're strong, where to grow
- **For validators:** Quick assessment before stamping — has this rig earned trust?
- **For the federation:** Transparent, portable reputation that travels across wastelands
- **For teams:** Evaluate fit — does this rig's profile complement the team?

The sheet is read-only. You can't edit your own — it's computed from evidence.
Like a yearbook, others write in it.

---

## 2. Data Sources

### Primary Tables

| Table | Fields Used | Purpose |
|-------|-------------|---------|
| `rigs` | handle, display_name, rig_type, trust_level, parent_rig, registered_at, last_seen | Identity header |
| `completions` | completed_by, wanted_id, stamp_id, completed_at, validated_at | Activity history |
| `stamps` | subject, valence, confidence, severity, skill_tags, message, created_at | Reputation scores |
| `badges` | rig_handle, badge_type, evidence, awarded_at | Achievement shelf |
| `wanted` | id, title, project, type, tags, effort_level | Context for completions |

### Derived Metrics

| Metric | Derivation |
|--------|------------|
| Weighted dimension score | `SUM(valence[dim] * confidence * severity_weight) / SUM(confidence * severity_weight)` |
| Active streak | Consecutive days with a completion (from `completed_at`) |
| Validation rate | Completions with a stamp / total completions |
| Skill profile | Frequency distribution of `skill_tags` across stamps |
| Agent fleet size | Count of rigs where `parent_rig = handle` |

---

## 3. Layout Design

### Full Terminal Rendering (80-column)

```
+==============================================================================+
|                                                                              |
|   MapleFoxyBells                                      CONTRIBUTOR [##--]     |
|   "Maple's Workshop"                                  human | trust 2       |
|   hop/wl-commons                          registered: 2026-02-28            |
|                                              last seen: 2026-03-04          |
|                                                                              |
+==============================================================================+
|                                                                              |
|  COMPLETIONS  12      STAMPS  9       STREAK  5d      VALIDATED  75%        |
|                                                                              |
+--------------------------------------+---------------------------------------+
|                                      |                                       |
|  STAMP PROFILE                       |  SKILL TAGS                           |
|                                      |                                       |
|        quality                       |  go ############ 5                    |
|          4.3                         |  federation ######### 4               |
|          /\                          |  docs ###### 2                        |
|         /  \                         |  testing #### 1                       |
|        /    \                        |                                       |
|       / .--. \                       |                                       |
|      / /    \ \                      |                                       |
|     / /      \ \                     |  SEVERITY MIX                         |
|    +-'        '-+                    |                                       |
|   reliability    creativity          |  root   ##  1                         |
|     4.1            3.6              |  branch ######  3                     |
|                                      |  leaf   ############  5               |
|  confidence: 0.85 avg               |                                       |
|                                      |                                       |
+--------------------------------------+---------------------------------------+
|                                                                              |
|  RECENT ACTIVITY                                                             |
|                                                                              |
|  03-04  c-a8f2  w-com-007  Fix federation sync bug      stamped  q:5 r:5    |
|  03-03  c-b1e9  w-com-006  Add Dolt scanner docs        stamped  q:4 r:4    |
|  03-02  c-c3d7  w-com-005  Implement town routing       stamped  q:4 r:5    |
|  03-01  c-d4a1  w-com-004  Write getting started guide   pending  ---       |
|  02-28  c-e5b2  w-com-003  Register 3 agent rigs        stamped  q:4 r:3    |
|                                                                              |
+--------------------------------------+---------------------------------------+
|                                      |                                       |
|  BADGES                              |  AGENT ROSTER                         |
|                                      |                                       |
|  [*] first_blood    2026-02-28      |  fops-a   agent  trust:1  last:03-04  |
|  [~] streak_7       2026-03-06      |  fops-b   agent  trust:1  last:03-03  |
|  [+] polyglot       2026-03-03      |  fops-c   agent  trust:1  last:03-02  |
|  [ ] mentor         ---             |                                       |
|  [ ] bridge_builder ---             |  3 agents | 7 completions combined    |
|                                      |                                       |
+--------------------------------------+---------------------------------------+
|                                                                              |
|  STAMP MESSAGES (latest)                                                     |
|                                                                              |
|  "Exceptional federation work — clean code, thorough tests"                  |
|     -- validator-x on c-a8f2 (root, confidence 0.95)                         |
|                                                                              |
|  "Good docs, could use more examples"                                        |
|     -- reviewer-y on c-b1e9 (branch, confidence 0.80)                        |
|                                                                              |
+==============================================================================+
```

### Compact Mode (for inline display, 40-column)

```
+======================================+
| MapleFoxyBells        CONTRIBUTOR    |
| human | trust 2 | hop/wl-commons    |
+======================================+
| COMP 12 | STAMPS 9 | STREAK 5d     |
| q:4.3  r:4.1  c:3.6  | conf:0.85   |
+--------------------------------------+
| [*] first_blood  [+] polyglot       |
| [~] streak_7     [ ] mentor         |
+--------------------------------------+
| 03-04 Fix federation sync   q:5 r:5 |
| 03-03 Add Dolt scanner docs q:4 r:4 |
| 03-02 Implement town routing q:4 r:5|
+======================================+
```

---

## 4. Stamp Aggregation

### Weighted Average Formula

Each stamp has three weighting factors:

1. **Confidence** (0.0-1.0) — how sure the validator is
2. **Severity weight** — derived from position in the validation chain:
   - `leaf` = 1.0 (peer review)
   - `branch` = 2.0 (senior review)
   - `root` = 3.0 (maintainer endorsement)
3. **Recency decay** (optional) — exponential decay from stamp age

**Per-dimension weighted score:**

```
                  SUM( valence[dim] * confidence * severity_weight * decay )
score[dim]  =  ---------------------------------------------------------------
                       SUM( confidence * severity_weight * decay )
```

Where `decay = exp(-lambda * days_since_stamp)` and `lambda = ln(2) / half_life_days`.

### Time Windows

| Window | Use Case | Decay |
|--------|----------|-------|
| All-time | Overall profile, badge eligibility | None |
| Rolling 30d | Current form, trend detection | `half_life = 30` |
| Rolling 7d | Streak calculation, "hot" indicator | `half_life = 7` |

### Per-Skill Breakdown

Stamps carry `skill_tags` (inherited from the wanted item). Group stamps by tag
and compute per-tag dimension scores using the same weighted formula. This shows
where a rig is strongest:

```
  go:         q:4.5  r:4.8  c:3.2   (5 stamps)
  federation: q:4.1  r:4.0  c:4.0   (4 stamps)
  docs:       q:3.8  r:4.5  c:2.5   (2 stamps)
```

### Edge Cases

- **No stamps yet:** Show "unrated" — display completion count only
- **Single stamp:** Show raw values, note "1 stamp — limited data"
- **Conflicting stamps:** Weighted average handles this naturally — high-confidence
  root stamps outweigh low-confidence leaf stamps

---

## 5. Trust Level Display

Trust levels are protocol-level access tiers. The character sheet renders them
as a progression bar with distinct visual treatment.

### Level Definitions

| Level | Name | Color | Symbol | Privileges |
|-------|------|-------|--------|------------|
| 0 | Outsider | grey | `[----]` | Read-only access to wanted board |
| 1 | Registered | blue | `[#---]` | Can claim tasks, submit completions |
| 2 | Contributor | green | `[##--]` | Can stamp others' work (leaf severity) |
| 3 | Maintainer | gold | `[###-]` | Can stamp at any severity, merge PRs, manage rigs |

### ANSI Color Codes

```
Level 0: \e[90m OUTSIDER \e[0m        (bright black / grey)
Level 1: \e[34m REGISTERED \e[0m      (blue)
Level 2: \e[32m CONTRIBUTOR \e[0m     (green)
Level 3: \e[33m MAINTAINER \e[0m      (yellow/gold)
```

### Progression Indicator

The trust bar shows current level and distance to next:

```
REGISTERED [#---]  ->  needs 3 validated stamps for CONTRIBUTOR
CONTRIBUTOR [##--]  ->  needs maintainer endorsement for MAINTAINER
MAINTAINER [###-]  ->  max level
```

Progression criteria (suggested — configurable per wasteland):

| From | To | Requirement |
|------|----|-------------|
| 0 -> 1 | Registered | Register as a rig |
| 1 -> 2 | Contributor | 3+ completions with stamps averaging quality >= 3.0 |
| 2 -> 3 | Maintainer | Explicit promotion by existing maintainer (root stamp) |

---

## 6. Badge System

Badges are computed achievements stored in the `badges` table. They trigger
automatically when conditions are met (checked at completion/stamp time).

### Badge Catalog

| Badge | ID | Icon | Trigger | Evidence |
|-------|----|------|---------|----------|
| First Blood | `first_blood` | `[*]` | First completion validated | completion ID |
| Polyglot | `polyglot` | `[+]` | Stamps across 3+ distinct skill tags | tag list |
| Bridge Builder | `bridge_builder` | `[~]` | Completions in 2+ different wastelands | wasteland list |
| Week Warrior | `streak_7` | `[7]` | 7 consecutive days with a completion | date range |
| Mentor | `mentor` | `[M]` | Stamped 5+ other rigs' completions | stamp IDs |
| Deep Root | `deep_root` | `[R]` | Received a root-severity stamp | stamp ID |
| Full Spectrum | `full_spectrum` | `[=]` | All three dimensions (q/r/c) avg >= 4.0 | dimension scores |
| Centurion | `centurion` | `[C]` | 100 validated completions | completion count |
| Night Owl | `night_owl` | `[N]` | 5+ completions submitted between 00:00-05:00 local | timestamps |
| Fleet Commander | `fleet_cmd` | `[F]` | 3+ agent rigs with stamps | agent handle list |

### Badge States

```
[*] earned   — badge awarded, date shown
[~] close    — 75%+ progress toward trigger (preview)
[ ] locked   — not yet earned, criteria shown on hover/expand
```

### Trigger SQL (example: polyglot)

```sql
SELECT COUNT(DISTINCT tag.value) as unique_tags
FROM stamps s,
     JSON_TABLE(s.skill_tags, '$[*]' COLUMNS(value VARCHAR(64) PATH '$')) tag
WHERE s.subject = 'TARGET_HANDLE'
HAVING unique_tags >= 3
```

---

## 7. SQL Queries

### Header — Rig Identity

```sql
SELECT
    r.handle,
    r.display_name,
    r.rig_type,
    r.trust_level,
    r.dolthub_org,
    r.parent_rig,
    r.registered_at,
    r.last_seen
FROM rigs r
WHERE r.handle = ?;
```

### Stats Block — Summary Metrics

```sql
-- Total completions
SELECT COUNT(*) as total_completions
FROM completions
WHERE completed_by = ?;

-- Validated completions (have a stamp)
SELECT COUNT(*) as validated
FROM completions
WHERE completed_by = ?
  AND stamp_id IS NOT NULL;

-- Active streak (consecutive days with completions, counting back from today)
SELECT DATE(completed_at) as day
FROM completions
WHERE completed_by = ?
ORDER BY completed_at DESC;
-- (streak computed in application layer by walking consecutive dates)
```

### Stamp Profile — Weighted Dimension Scores

```sql
SELECT
    s.valence,
    s.confidence,
    s.severity,
    s.skill_tags,
    s.created_at
FROM stamps s
WHERE s.subject = ?
ORDER BY s.created_at DESC;
```

Application-layer aggregation (per dimension):

```sql
-- Flattened for engines that support JSON extraction:
SELECT
    AVG(JSON_EXTRACT(s.valence, '$.quality') * s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    /
    AVG(s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    AS weighted_quality,
    AVG(JSON_EXTRACT(s.valence, '$.reliability') * s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    /
    AVG(s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    AS weighted_reliability,
    AVG(JSON_EXTRACT(s.valence, '$.creativity') * s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    /
    AVG(s.confidence *
        CASE s.severity WHEN 'root' THEN 3 WHEN 'branch' THEN 2 ELSE 1 END)
    AS weighted_creativity,
    AVG(s.confidence) as avg_confidence,
    COUNT(*) as stamp_count
FROM stamps s
WHERE s.subject = ?;
```

### Skill Tags Distribution

```sql
SELECT
    tag.value AS skill,
    COUNT(*) AS count
FROM stamps s,
     JSON_TABLE(s.skill_tags, '$[*]' COLUMNS(value VARCHAR(64) PATH '$')) tag
WHERE s.subject = ?
GROUP BY tag.value
ORDER BY count DESC
LIMIT 10;
```

### Severity Mix

```sql
SELECT
    s.severity,
    COUNT(*) as count
FROM stamps s
WHERE s.subject = ?
GROUP BY s.severity
ORDER BY FIELD(s.severity, 'root', 'branch', 'leaf');
```

### Recent Activity

```sql
SELECT
    DATE_FORMAT(c.completed_at, '%m-%d') as date,
    c.id as completion_id,
    c.wanted_id,
    w.title,
    CASE WHEN c.stamp_id IS NOT NULL THEN 'stamped' ELSE 'pending' END as status,
    JSON_EXTRACT(s.valence, '$.quality') as q,
    JSON_EXTRACT(s.valence, '$.reliability') as r
FROM completions c
LEFT JOIN wanted w ON c.wanted_id = w.id
LEFT JOIN stamps s ON c.stamp_id = s.id
WHERE c.completed_by = ?
ORDER BY c.completed_at DESC
LIMIT 5;
```

### Badge Shelf

```sql
SELECT
    b.badge_type,
    b.awarded_at,
    b.evidence
FROM badges b
WHERE b.rig_handle = ?
ORDER BY b.awarded_at DESC;
```

### Agent Roster (for human rigs)

```sql
SELECT
    r.handle,
    r.rig_type,
    r.trust_level,
    r.last_seen,
    (SELECT COUNT(*) FROM completions c WHERE c.completed_by = r.handle) as completions
FROM rigs r
WHERE r.parent_rig = ?
ORDER BY r.last_seen DESC;
```

### Stamp Messages (latest)

```sql
SELECT
    s.message,
    s.author,
    s.context_id,
    s.severity,
    s.confidence,
    s.created_at
FROM stamps s
WHERE s.subject = ?
  AND s.message IS NOT NULL
  AND s.message != ''
ORDER BY s.created_at DESC
LIMIT 3;
```

---

## 8. Terminal Rendering

### Box Drawing

Use Unicode box-drawing characters for clean borders:

| Element | Characters |
|---------|------------|
| Corners (double) | `+` (ASCII) or `╔ ╗ ╚ ╝` (Unicode) |
| Horizontal (double) | `=` (ASCII) or `═` (Unicode) |
| Vertical | `\|` (ASCII) or `│` (Unicode) |
| Section divider | `+--` (ASCII) or `├─` / `┤` (Unicode) |
| Internal junction | `+` (ASCII) or `┼` (Unicode) |

Default to ASCII for maximum compatibility. Detect UTF-8 locale and upgrade:

```bash
if [[ "$LANG" == *UTF-8* ]] || [[ "$LC_ALL" == *UTF-8* ]]; then
    BORDER_STYLE="unicode"
fi
```

### ANSI Color Palette

```
Header handle:     \e[1m (bold)
Trust level name:  \e[{level_color}m (see Level Definitions)
Dimension labels:  \e[36m (cyan)
Dimension values:  \e[1;37m (bold white)
Bar charts:        \e[32m (green) for high, \e[33m (yellow) for mid, \e[31m (red) for low
Badge earned:      \e[32m (green)
Badge locked:      \e[90m (grey)
Badge close:       \e[33m (yellow)
Timestamps:        \e[90m (grey)
Stamp messages:    \e[3m (italic)
Section headers:   \e[1;4m (bold underline)
```

### Radar Chart (ASCII)

The stamp profile uses a simplified triangle radar for quality/reliability/creativity.
Three axes, 5-point scale, plotted with ASCII:

```
        quality
          5
          |
     4    |
     3   .+.
     2  / | \
     1 /  |  \
     0+---+---+
  reliability  creativity
```

The filled region uses `/`, `\`, `|`, `-`, and `.` to approximate the shape.
The actual values are printed numerically beside each axis label — the chart
is a visual aid, not a precision instrument.

### Bar Charts

Horizontal bars for skill tags and severity mix:

```
go         ############ 5
federation #########    4
docs       ######       2
```

Bar length = `value / max_value * max_bar_width`. Use `#` for filled, space for empty.
Color by relative strength:
- Top 33%: green
- Mid 33%: yellow
- Bottom 33%: default

### Width Adaptation

- **80 columns** — full layout (two-column sections)
- **60 columns** — single column, stacked sections
- **40 columns** — compact mode (see Compact Mode mockup above)

Detect with: `tput cols` or `$COLUMNS`.

---

## 9. Web Rendering

Future web dashboard considerations. Not implemented now — these are design notes
for when a web frontend is built.

### Layout

Same logical sections as terminal, rendered with CSS Grid:

```
+----------------+------------------+
| Header (full width, hero banner)  |
+----------------+------------------+
| Stamp Profile  | Skill Tags       |
| (SVG radar)    | (bar chart)      |
+----------------+------------------+
| Recent Activity (table, full w)   |
+-----------------------------------+
| Badges         | Agent Roster     |
+----------------+------------------+
| Stamp Messages (feed, full w)     |
+-----------------------------------+
```

### Radar Chart

Replace ASCII triangle with an SVG/Canvas radar chart. Three axes at 120-degree
intervals, filled polygon for the scores. Use D3.js or Chart.js radar type.

### Trust Level

Render as a progress stepper:

```
[Outsider] ---- [Registered] ---- [Contributor] ---- [Maintainer]
                                       ^
                                   you are here
```

Color the completed steps, dim the remaining ones.

### Badge Shelf

Grid of badge icons with tooltips showing trigger criteria and award date.
Locked badges shown as greyed silhouettes. Hover reveals progress toward unlock.

### Responsive

- Desktop: two-column layout
- Tablet: stacked single column
- Mobile: card-based vertical scroll

### API Endpoint

```
GET /api/rig/:handle/character-sheet

Response: {
  identity: { ... },       // from rigs table
  stats: { ... },          // computed summary
  stampProfile: { ... },   // weighted dimension scores
  skillTags: [ ... ],      // tag distribution
  recentActivity: [ ... ], // last N completions
  badges: [ ... ],         // earned + progress
  agentRoster: [ ... ],    // child rigs
  stampMessages: [ ... ]   // latest with messages
}
```

Data computed server-side from Dolt SQL queries (Section 7), cached with
a TTL matching the polling interval of the Dolt scanner.

---

## 10. Implementation Notes

### Rendering Priority

For the initial terminal implementation:

1. Header + stats block (essential — identity and numbers)
2. Recent activity (most actionable — what have they done lately?)
3. Stamp profile dimensions (the core reputation signal)
4. Badge shelf (gamification hook)
5. Skill tags + severity mix (detail for power users)
6. Agent roster (only for human rigs with children)
7. Stamp messages (nice to have)

### Data Freshness

Pull from upstream before rendering:

```bash
cd LOCAL_DIR && dolt pull upstream main 2>/dev/null || true
```

If pull fails, render from local data with a staleness warning:

```
[!] Data may be stale — upstream sync failed
```

### Empty States

| Section | Empty State |
|---------|-------------|
| Completions = 0 | "No completions yet. Run /wasteland browse to find work." |
| Stamps = 0 | "Unrated — complete work and earn your first stamp." |
| Badges = 0 | "No badges yet. Your first completion earns [*] first_blood." |
| Agent roster = 0 | Section hidden entirely |
| Stamp messages = 0 | Section hidden entirely |

### Integration Point

Add to the `/wasteland` command as a new subcommand:

```
/wasteland sheet [handle]     -- show character sheet (default: self)
```

If no handle provided, use the handle from `~/.hop/config.json`.
If a handle is provided, look up that rig's public profile.

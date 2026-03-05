# Chain Constitution Questionnaire

**A Parameter Guide for Founding a Wasteland**

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Date | 2026-03-04 |
| Spec Reference | MVR Protocol Specification v0.1, Section 12.3 |

---

The record shows that every wasteland begins with a set of founding
decisions. These decisions become the constitution — the governance
parameters embedded in the `_meta` table and enforced by convention.
Choose carefully. What you set here shapes the culture of what grows.

This questionnaire is presented during `/wasteland create`. Each answer
maps to a concrete configuration value. Defaults are provided for every
parameter; accepting all defaults produces a functional, permissive
wasteland suitable for small teams and experimentation.

---

## I. Identity

The name and purpose of this wasteland. These are the first things a
prospective rig sees when they discover you in the root commons.

### Q1. Wasteland Name

> What is the human-readable name of this wasteland?

**Default:** `"<owner>'s Wasteland"`

**Tradeoffs:**
- Short, memorable names are easier to reference in conversation and documentation.
- Descriptive names ("Acme Backend Engineering") signal scope immediately but may feel limiting as the wasteland evolves.
- The name appears in the root commons `chain_meta` registry and on DoltHub.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value) VALUES ('wasteland_name', '<name>');
```

### Q2. Purpose Statement

> In one or two sentences, what kind of work happens here?

**Default:** `"A general-purpose wasteland for collaborative work."`

**Tradeoffs:**
- A focused purpose statement attracts the right rigs and filters out noise. "Frontend accessibility work for open-source projects" is better than "stuff."
- An overly narrow statement may discourage contributors whose work is adjacent but valuable.
- This is descriptive, not binding — rigs can post wanted items outside the stated purpose.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value) VALUES ('purpose', '<statement>');
```

Also used in the DoltHub database description:

```json
{
  "description": "Wasteland: <name> -- <purpose>"
}
```

### Q3. Database Path

> What DoltHub path should this wasteland use?

**Default:** `"<dolthub_org>/wl-commons"`

**Tradeoffs:**
- The conventional name `wl-commons` signals MVR compatibility to other rigs.
- Custom names (e.g., `wl-frontend`, `wl-research`) help when one org runs multiple wastelands.
- The `<owner>/<name>` path is permanent on DoltHub — renaming requires creating a new database.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value) VALUES ('dolt_database', '<owner>/<name>');
```

---

## II. Trust Model

Trust levels govern what rigs can do. The timeline indicates that trust
configuration is the single most consequential governance decision — it
determines who can validate work and how reputation accumulates.

### Q4. Initial Trust Level for New Rigs

> What trust level do rigs receive when they register?

| Level | Name | Permissions |
|-------|------|-------------|
| 0 | Outsider | Read-only. Cannot post, claim, or complete. |
| 1 | Registered | Can post, claim, and submit completions. |
| 2 | Contributor | Can also validate completions and issue stamps. |
| 3 | Maintainer | Full control: trust changes, merges, management. |

**Default:** `1` (Registered)

**Tradeoffs:**
- **Level 0** (curated entry): New rigs must be manually promoted before participating. High friction, high control. Suitable for sensitive or security-critical wastelands.
- **Level 1** (open participation): Anyone who registers can immediately post and submit work. Low friction, standard for most wastelands. Validation still requires promotion to level 2+.
- **Level 2** (instant validators): New rigs can validate immediately. Dangerous for reputation integrity unless you deeply trust all potential joiners (e.g., a small, closed team).

**Implements:**

```sql
-- In the registration INSERT, the default trust_level:
INSERT INTO rigs (handle, ..., trust_level, ...)
VALUES ('<handle>', ..., <level>, ...);
```

```sql
REPLACE INTO _meta (`key`, value) VALUES ('default_trust_level', '<level>');
```

### Q5. Trust Escalation Thresholds

> How many positive stamps must a rig accumulate before promotion?

**Default:**
- Level 1 to 2 (Contributor): 3 stamps with average quality >= 3.0
- Level 2 to 3 (Maintainer): Manual approval only

**Tradeoffs:**
- **Low threshold (1-2 stamps):** Fast promotion. Good for bootstrapping a new wasteland where you need validators quickly. Risk: reputation inflation from insufficient sample size.
- **Medium threshold (3-5 stamps):** Balanced. Enough signal to judge quality without creating a bottleneck. Recommended for most wastelands.
- **High threshold (10+ stamps):** Conservative. Appropriate for large wastelands where validation authority carries significant weight. Risk: contributor starvation — rigs leave before reaching validator status.
- **Manual only:** All promotions require explicit maintainer action. Maximum control, maximum bottleneck.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('escalation_1_to_2', '{"min_stamps": 3, "min_avg_quality": 3.0}');

REPLACE INTO _meta (`key`, value)
VALUES ('escalation_2_to_3', '{"mode": "manual"}');
```

### Q6. Trust Decay Policy

> Should trust levels decay after periods of inactivity?

**Default:** No decay.

**Tradeoffs:**
- **No decay:** Once earned, trust persists. Simple. Returning contributors retain their privileges. Risk: abandoned rigs with elevated trust that could be compromised.
- **Soft decay (warning):** After N days of inactivity, flag the rig but don't demote. Maintainers review flagged rigs periodically.
- **Hard decay (automatic demotion):** After N days, reduce trust_level by 1. Forces active participation to maintain validator status. Risk: penalizes legitimate breaks (vacations, project pauses).

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('trust_decay', '{"enabled": false}');

-- Or with decay enabled:
REPLACE INTO _meta (`key`, value)
VALUES ('trust_decay', '{"enabled": true, "mode": "soft", "days_inactive": 90}');
```

The `rigs.last_seen` timestamp provides the data. A maintenance query:

```sql
-- Find rigs inactive for >90 days with elevated trust
SELECT handle, trust_level, last_seen
FROM rigs
WHERE trust_level >= 2
  AND last_seen < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Q7. Minimum Validator Count

> How many validators must a completion receive before the wanted item can be marked completed?

**Default:** `1`

**Tradeoffs:**
- **1 validator:** Fast throughput. One trusted rig reviews and stamps. Suitable for small teams where validators know the domain well. This is the MVR protocol default.
- **2 validators:** Peer review model. Reduces individual bias. Doubles the validation cost and time.
- **3+ validators:** Committee review. Appropriate for high-stakes work (security audits, architectural decisions). Significant bottleneck on completion velocity.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('min_validators', '1');
```

---

## III. Governance

Who can do what. These parameters define the power structure of the
wasteland — who posts work, who reviews it, and how collective
decisions are made.

### Q8. Who Can Post Wanted Items?

> What trust level is required to post new work to the wanted board?

**Default:** `1` (any registered rig)

**Tradeoffs:**
- **Level 1 (open posting):** Any registered rig can post work. Democratic. The board reflects what the community needs. Risk: noise — low-quality or duplicate items.
- **Level 2 (contributor-only posting):** Only proven contributors can post. Filters the board to experienced voices. Risk: bootstrapping problem — new rigs can't signal what they need.
- **Level 3 (maintainer-only posting):** Centralized work allocation. The board is a curated assignment list. Efficient for directed teams, hostile to bottom-up contribution.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('min_trust_to_post', '1');
```

### Q9. Who Can Validate Completions?

> What trust level is required to review completions and issue stamps?

**Default:** `2` (Contributor)

**Tradeoffs:**
- **Level 2 (contributor validation):** Rigs who have demonstrated quality work can validate others. The standard MVR model. Produces a self-reinforcing quality culture.
- **Level 3 (maintainer-only validation):** Only maintainers can stamp. Tight quality control. Creates a bottleneck if there are few maintainers.
- **Level 1 (open validation):** Any registered rig can validate. Fastest reputation accumulation. Risk: Sybil attacks — colluding rigs stamp each other. Only viable with Spider Protocol monitoring.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('min_trust_to_validate', '2');
```

### Q10. Voting Threshold for Trust Escalation

> When promoting a rig, how many maintainers must approve?

**Default:** `1` (single maintainer decision)

**Tradeoffs:**
- **1 maintainer:** Fast. One trusted person makes the call. Appropriate for small wastelands with 1-3 maintainers.
- **Majority of maintainers:** Democratic. Prevents unilateral privilege grants. Requires tracking votes, adds process overhead.
- **Unanimous:** Maximum caution. One dissent blocks promotion. Appropriate for security-critical wastelands. Risk: deadlock if maintainers disagree.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('escalation_vote_threshold', '{"mode": "single"}');

-- Or majority:
REPLACE INTO _meta (`key`, value)
VALUES ('escalation_vote_threshold', '{"mode": "majority"}');
```

---

## IV. Scope

What kinds of work belong in this wasteland. Scope parameters shape the
wanted board's character and help rigs find work that matches their skills.

### Q11. Allowed Work Types

> Which work types does this wasteland accept?

Available types: `feature`, `bug`, `docs`, `design`, `rfc`, `research`, `community`

**Default:** All types enabled.

**Tradeoffs:**
- **All types:** Maximum flexibility. Any work that fits the purpose statement. Standard for general-purpose wastelands.
- **Restricted types:** Focuses the board. A documentation wasteland might only allow `docs` and `rfc`. A research commons might allow `research` and `rfc` only. Reduces noise but may exclude adjacent work.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('allowed_types', '["feature","bug","docs","design","rfc","research","community"]');
```

### Q12. Allowed Project Tags

> Should the wanted board be restricted to specific projects, or open to any?

**Default:** No restriction (any project tag accepted).

**Tradeoffs:**
- **Open (no restriction):** Rigs self-organize around whatever projects emerge. Organic. Good for community wastelands.
- **Allowlist:** Only predefined projects appear on the board. Useful for organizational wastelands where work aligns to known products or initiatives. Easier to browse and filter.

**Implements:**

```sql
-- Open:
REPLACE INTO _meta (`key`, value) VALUES ('allowed_projects', 'null');

-- Restricted:
REPLACE INTO _meta (`key`, value)
VALUES ('allowed_projects', '["beads","hop","gas-city"]');
```

### Q13. Effort Level Distribution

> What is the target distribution of effort levels on the board?

Effort levels: `trivial`, `small`, `medium`, `large`, `epic`

**Default:** No target (organic distribution).

**Tradeoffs:**
- **No target:** Let the board reflect actual needs. Simple.
- **Guided distribution:** Maintainers aim for a mix (e.g., 20% trivial, 30% small, 30% medium, 15% large, 5% epic). Ensures there is always entry-level work for new rigs and stretch assignments for experienced ones. This is advisory, not enforced.

**Implements:**

```sql
-- Advisory guideline only:
REPLACE INTO _meta (`key`, value)
VALUES ('effort_distribution_target',
  '{"trivial":0.20,"small":0.30,"medium":0.30,"large":0.15,"epic":0.05}');
```

---

## V. Federation

How this wasteland relates to other wastelands in the HOP federation.
Federation is optional — a wasteland functions independently without it.
But the record shows that connected wastelands accumulate reputation
faster and attract more rigs.

### Q14. Register in Root Commons?

> Should this wasteland be registered in `hop/wl-commons` for federation discovery?

**Default:** Yes.

**Tradeoffs:**
- **Yes (register):** Your wasteland appears in the root directory. Other rigs can find and join you. Stamps earned here are discoverable from any federated wasteland. Standard for public wastelands.
- **No (standalone):** Your wasteland operates independently. Not discoverable through the root commons. Appropriate for private or internal wastelands. Rigs can still join if they know the DoltHub path.

**Implements:**

```sql
-- Federation registration inserts into root commons:
INSERT INTO chain_meta (chain_id, chain_type, parent_chain_id,
  hop_uri, dolt_database, created_at)
VALUES ('<chain_id>', 'community', NULL,
  'hop://<owner>/<db>', '<owner>/<db>', NOW());
```

```sql
-- Local tracking:
REPLACE INTO _meta (`key`, value) VALUES ('federated', 'true');
REPLACE INTO _meta (`key`, value) VALUES ('upstream', 'hop/wl-commons');
```

### Q15. Accept Cross-Wasteland Rigs?

> Can rigs registered in other wastelands participate here without re-registering?

**Default:** No (registration required per wasteland).

**Tradeoffs:**
- **No (require local registration):** Every rig must register in your wasteland before participating. You maintain a complete local registry. The rig's handle is the same across wastelands, preserving reputation portability. This is the current MVR protocol model.
- **Yes (cross-wasteland passthrough):** Rigs with verified stamps from trusted wastelands can participate without local registration. Reduces friction. Requires trust in the originating wasteland's governance. Reserved for future protocol versions — the `hop_uri` scheme (Section 12.2) must be implemented first.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('cross_wasteland_rigs', 'false');

-- Future (when hop_uri scheme is live):
REPLACE INTO _meta (`key`, value)
VALUES ('cross_wasteland_rigs', 'true');
REPLACE INTO _meta (`key`, value)
VALUES ('trusted_wastelands', '["hop/wl-commons","acme/wl-commons"]');
```

### Q16. Honor External Stamps?

> When evaluating a rig's trust escalation, should stamps earned in other wastelands count?

**Default:** No (local stamps only).

**Tradeoffs:**
- **No (local only):** Trust is earned fresh in each wasteland. A rig with 50 stamps in wasteland A starts at trust_level 1 in wasteland B. Clean separation. No transitive trust issues.
- **Partial (weighted):** External stamps count at a discount (e.g., 0.5 weight). Rewards proven rigs while still requiring local demonstration. Complex to implement.
- **Yes (full portability):** All stamps count equally regardless of origin. Maximum rig mobility. Risk: a rig inflates reputation in a permissive wasteland, then carries it into a rigorous one.

**Implements:**

```sql
-- Local only:
REPLACE INTO _meta (`key`, value)
VALUES ('external_stamp_policy', '{"mode": "local_only"}');

-- Weighted:
REPLACE INTO _meta (`key`, value)
VALUES ('external_stamp_policy',
  '{"mode": "weighted", "weight": 0.5, "trusted_sources": ["hop/wl-commons"]}');
```

---

## VI. Safety

Guardrails that protect the wasteland from abuse, spam, and unsafe
execution. The timeline indicates that wastelands without safety
parameters eventually need them — better to decide upfront.

### Q17. Sandbox Requirements

> Should certain wanted items require sandboxed execution?

**Default:** Sandbox not required (field exists but defaults to FALSE).

**Tradeoffs:**
- **Not required (default FALSE):** Rigs execute work in their own environment. Simple. Appropriate when work is documentation, design, or research.
- **Optional (per-item):** Posters can mark individual items as `sandbox_required = TRUE`. Agent rigs claiming sandboxed items must execute in restricted environments. Useful for wastelands that mix docs and code work.
- **Required for all:** Every wanted item requires sandboxed execution. Maximum safety. Appropriate for wastelands processing untrusted code or where agent rigs operate autonomously.

**Implements:**

```sql
-- Global default:
REPLACE INTO _meta (`key`, value)
VALUES ('sandbox_default', 'false');

-- Or require for all:
REPLACE INTO _meta (`key`, value)
VALUES ('sandbox_default', 'true');
```

Per-item override in the `wanted` table:

```sql
INSERT INTO wanted (..., sandbox_required, ...) VALUES (..., TRUE, ...);
```

### Q18. Minimum Trust for Sensitive Work

> What trust level is required to claim items tagged with sensitive labels?

**Default:** `2` (Contributor)

**Tradeoffs:**
- **Level 2:** Contributors with demonstrated quality can access sensitive work. Balances throughput with oversight.
- **Level 3:** Only maintainers handle sensitive items. Maximum control. Appropriate for security-related wastelands.
- **No restriction:** Any registered rig can claim sensitive work. Only viable for wastelands with no truly sensitive items.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('sensitive_tags', '["security","credentials","infrastructure"]');

REPLACE INTO _meta (`key`, value)
VALUES ('sensitive_min_trust', '2');
```

### Q19. Rate Limits

> Should posting and claiming be rate-limited?

**Default:** No rate limits.

**Tradeoffs:**
- **No limits:** Unrestricted participation. Good for small teams. Risk: a single rig (or bot) floods the board or claims everything.
- **Post limit:** Cap new wanted items per rig per day (e.g., 10/day). Prevents board spam without restricting work velocity.
- **Claim limit:** Cap concurrent claims per rig (e.g., 3 active claims). Prevents hoarding. Encourages rigs to complete work before taking more.
- **Both:** Belt and suspenders. Appropriate for public wastelands with many unknown rigs.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('rate_limits', '{"posts_per_day": null, "max_active_claims": null}');

-- With limits:
REPLACE INTO _meta (`key`, value)
VALUES ('rate_limits', '{"posts_per_day": 10, "max_active_claims": 3}');
```

Enforcement query for claim limits:

```sql
-- Check before allowing a claim
SELECT COUNT(*) as active_claims
FROM wanted
WHERE claimed_by = '<handle>' AND status = 'claimed';
```

---

## VII. Reputation

How stamps work in this wasteland. Reputation parameters define the
dimensions of quality you measure and the weight classes you recognize.
This pattern has appeared before in every community that values work —
the question is always what you measure and how precisely.

### Q20. Stamp Valence Dimensions

> Which dimensions should stamps measure?

Standard dimensions (from MVR spec):

| Dimension | Range | Measures |
|-----------|-------|----------|
| `quality` | 1-5 | Technical quality of the work product |
| `reliability` | 1-5 | Adherence to specification and deadlines |
| `creativity` | 1-5 | Novel approaches or exceptional insight |

**Default:** All three standard dimensions.

**Tradeoffs:**
- **Standard three:** Well-understood, balanced signal. Suitable for most wastelands.
- **Fewer dimensions (quality only):** Simpler stamps. Less signal per stamp but lower cognitive load on validators. Good for high-volume wastelands where detailed review is impractical.
- **Custom dimensions:** Add domain-specific fields (e.g., `thoroughness`, `documentation`, `collaboration`, `security`). Richer signal. Risk: validators spend more time per stamp, and rare dimensions accumulate slowly.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('valence_dimensions',
  '["quality","reliability","creativity"]');
```

Stamps use these dimensions in the valence JSON:

```sql
INSERT INTO stamps (..., valence, ...)
VALUES (..., '{"quality": 4, "reliability": 5, "creativity": 3}', ...);
```

### Q21. Severity Levels

> Which stamp severity levels does this wasteland use?

| Severity | Weight | Meaning |
|----------|--------|---------|
| `leaf` | Low | Routine work — small tasks, incremental contributions |
| `branch` | Medium | Significant contribution — substantial features, important fixes |
| `root` | High | Foundational work — architectural decisions, major capabilities |

**Default:** All three levels.

**Tradeoffs:**
- **All three:** Full range of recognition. Validators distinguish between minor and major contributions. Enables weighted reputation scoring.
- **Leaf only:** All stamps carry equal weight. Simple. Appropriate for wastelands where all work is roughly equivalent in scope.
- **Leaf + branch:** Two tiers. Distinguishes routine from significant without the rarely-used `root` tier.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('severity_levels', '["leaf","branch","root"]');
```

### Q22. Badge Definitions

> Which badges should this wasteland award?

Recommended badges (from MVR spec):

| Badge | Trigger | Description |
|-------|---------|-------------|
| `first_blood` | First completion stamped | Welcome to the wasteland |
| `polyglot` | Stamps across 3+ skill tag categories | Versatile contributor |
| `bridge_builder` | Completions in 2+ wastelands | Federation citizen |
| `trusted_voice` | Promoted to trust_level 2 | Earned the right to validate |
| `maintainer` | Promoted to trust_level 3 | Keeper of the wasteland |

**Default:** All recommended badges enabled.

**Tradeoffs:**
- **All recommended:** Gamification out of the box. Badges provide milestone recognition and a sense of progression.
- **Minimal (first_blood + trusted_voice):** Just the essentials. Less noise in the badges table.
- **Custom badges:** Define domain-specific achievements (e.g., `security_first` for security-related completions, `documenter` for docs-only work). Shapes culture by signaling what the wasteland values.
- **None:** No badges. Stamps are the only reputation signal. Austere but clean.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('badge_definitions', '{
  "first_blood": {"trigger": "first_stamped_completion"},
  "polyglot": {"trigger": "stamps_across_3_skill_categories"},
  "bridge_builder": {"trigger": "completions_in_2_wastelands"},
  "trusted_voice": {"trigger": "promoted_to_trust_2"},
  "maintainer": {"trigger": "promoted_to_trust_3"}
}');
```

Badge award:

```sql
INSERT INTO badges (id, rig_handle, badge_type, evidence, awarded_at)
VALUES ('<badge_id>', '<handle>', 'first_blood',
  'First stamped completion: <completion_id>', NOW());
```

---

## VIII. Lifecycle

How work moves through time. Lifecycle parameters prevent the wanted
board from accumulating stale items and ensure completions receive
timely review. For continuity, note that these are the parameters most
often adjusted after founding — start permissive, tighten as patterns
emerge.

### Q23. Wanted Item Expiry

> Should open wanted items expire after a period of inactivity?

**Default:** No expiry.

**Tradeoffs:**
- **No expiry:** Items persist until completed or withdrawn. Simple. The board is an ever-growing backlog. Suitable for small wastelands where items are actively managed.
- **Soft expiry (stale flag):** Items older than N days without activity are flagged as stale. Maintainers review and either renew or withdraw them. Keeps the board fresh without losing items.
- **Hard expiry (auto-withdraw):** Items older than N days are automatically set to `status = 'withdrawn'`. Aggressive pruning. Risk: legitimate long-term work items disappear.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('wanted_expiry', '{"enabled": false}');

-- With soft expiry:
REPLACE INTO _meta (`key`, value)
VALUES ('wanted_expiry',
  '{"enabled": true, "mode": "soft", "days": 90}');
```

Maintenance query:

```sql
-- Find stale wanted items
SELECT id, title, updated_at
FROM wanted
WHERE status = 'open'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Q24. Completion Review SLA

> How long should validators have to review a completion before it is flagged as overdue?

**Default:** No SLA (review at validator's pace).

**Tradeoffs:**
- **No SLA:** Validators review when they can. Zero pressure. Appropriate for volunteer communities where validators have varying availability.
- **Advisory SLA (e.g., 7 days):** Completions older than N days in `in_review` are flagged. Maintainers can reassign to another validator. Sets expectations without enforcement.
- **Strict SLA (e.g., 3 days):** Completions not reviewed within N days are auto-escalated to all maintainers. Ensures fast feedback. Risk: pressure on validators may reduce review quality.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('review_sla', '{"enabled": false}');

-- With advisory SLA:
REPLACE INTO _meta (`key`, value)
VALUES ('review_sla',
  '{"enabled": true, "mode": "advisory", "days": 7}');
```

Monitoring query:

```sql
-- Completions awaiting review beyond SLA
SELECT c.id, c.wanted_id, w.title, c.completed_at
FROM completions c
JOIN wanted w ON c.wanted_id = w.id
WHERE c.validated_at IS NULL
  AND c.completed_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Q25. Stale Claim Timeout

> How long can a rig hold a claim before it expires?

**Default:** No timeout.

**Tradeoffs:**
- **No timeout:** Rigs hold claims indefinitely. Trust that rigs are working. Simple. Risk: abandoned claims block other rigs from taking the work.
- **Soft timeout (e.g., 14 days):** After N days, the claim is flagged but not released. The rig receives a nudge. Appropriate for most wastelands.
- **Hard timeout (e.g., 7 days):** After N days, `claimed_by` is cleared and `status` reverts to `open`. Aggressive reclamation. Risk: penalizes rigs doing careful, thorough work on large items.

**Implements:**

```sql
REPLACE INTO _meta (`key`, value)
VALUES ('claim_timeout', '{"enabled": false}');

-- With soft timeout:
REPLACE INTO _meta (`key`, value)
VALUES ('claim_timeout',
  '{"enabled": true, "mode": "soft", "days": 14}');
```

Reclamation query:

```sql
-- Find stale claims
SELECT id, title, claimed_by, updated_at
FROM wanted
WHERE status = 'claimed'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 14 DAY);

-- Hard reclaim (run only if mode = "hard"):
UPDATE wanted
SET claimed_by = NULL, status = 'open', updated_at = NOW()
WHERE status = 'claimed'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Summary: The Complete Constitution

For reference, here is the full `_meta` configuration produced by this
questionnaire. A wasteland accepting all defaults produces the following
entries beyond the MVR-required minimum:

```sql
-- Identity
REPLACE INTO _meta (`key`, value) VALUES ('wasteland_name', '<name>');
REPLACE INTO _meta (`key`, value) VALUES ('purpose', '<statement>');
REPLACE INTO _meta (`key`, value) VALUES ('created_by', '<handle>');
REPLACE INTO _meta (`key`, value) VALUES ('dolt_database', '<owner>/<db>');

-- Trust
REPLACE INTO _meta (`key`, value) VALUES ('default_trust_level', '1');
REPLACE INTO _meta (`key`, value) VALUES ('escalation_1_to_2', '{"min_stamps":3,"min_avg_quality":3.0}');
REPLACE INTO _meta (`key`, value) VALUES ('escalation_2_to_3', '{"mode":"manual"}');
REPLACE INTO _meta (`key`, value) VALUES ('trust_decay', '{"enabled":false}');
REPLACE INTO _meta (`key`, value) VALUES ('min_validators', '1');

-- Governance
REPLACE INTO _meta (`key`, value) VALUES ('min_trust_to_post', '1');
REPLACE INTO _meta (`key`, value) VALUES ('min_trust_to_validate', '2');
REPLACE INTO _meta (`key`, value) VALUES ('escalation_vote_threshold', '{"mode":"single"}');

-- Scope
REPLACE INTO _meta (`key`, value) VALUES ('allowed_types', '["feature","bug","docs","design","rfc","research","community"]');
REPLACE INTO _meta (`key`, value) VALUES ('allowed_projects', 'null');
REPLACE INTO _meta (`key`, value) VALUES ('effort_distribution_target', 'null');

-- Federation
REPLACE INTO _meta (`key`, value) VALUES ('federated', 'true');
REPLACE INTO _meta (`key`, value) VALUES ('upstream', 'hop/wl-commons');
REPLACE INTO _meta (`key`, value) VALUES ('cross_wasteland_rigs', 'false');
REPLACE INTO _meta (`key`, value) VALUES ('external_stamp_policy', '{"mode":"local_only"}');

-- Safety
REPLACE INTO _meta (`key`, value) VALUES ('sandbox_default', 'false');
REPLACE INTO _meta (`key`, value) VALUES ('sensitive_tags', '["security","credentials","infrastructure"]');
REPLACE INTO _meta (`key`, value) VALUES ('sensitive_min_trust', '2');
REPLACE INTO _meta (`key`, value) VALUES ('rate_limits', '{"posts_per_day":null,"max_active_claims":null}');

-- Reputation
REPLACE INTO _meta (`key`, value) VALUES ('valence_dimensions', '["quality","reliability","creativity"]');
REPLACE INTO _meta (`key`, value) VALUES ('severity_levels', '["leaf","branch","root"]');
REPLACE INTO _meta (`key`, value) VALUES ('badge_definitions', '{"first_blood":{"trigger":"first_stamped_completion"},"polyglot":{"trigger":"stamps_across_3_skill_categories"},"bridge_builder":{"trigger":"completions_in_2_wastelands"},"trusted_voice":{"trigger":"promoted_to_trust_2"},"maintainer":{"trigger":"promoted_to_trust_3"}}');

-- Lifecycle
REPLACE INTO _meta (`key`, value) VALUES ('wanted_expiry', '{"enabled":false}');
REPLACE INTO _meta (`key`, value) VALUES ('review_sla', '{"enabled":false}');
REPLACE INTO _meta (`key`, value) VALUES ('claim_timeout', '{"enabled":false}');

-- Protocol
REPLACE INTO _meta (`key`, value) VALUES ('schema_version', '1.1');
REPLACE INTO _meta (`key`, value) VALUES ('phase1_mode', 'wild_west');
REPLACE INTO _meta (`key`, value) VALUES ('genesis_validators', '["<handle>"]');
REPLACE INTO _meta (`key`, value) VALUES ('created_at', NOW());
```

---

## Appendix: Governance Archetypes

For founders who want guidance rather than 25 individual decisions, the
record shows four common patterns:

### Wild West (default)

Open posting, open claiming, single-validator review, no rate limits,
no expiry. Maximum freedom, minimum process. Good for small teams,
experiments, and bootstrapping.

### Guild Hall

Contributor-only posting, 2 validators required, advisory SLAs, claim
timeouts. Structured quality culture. Good for mid-size teams with
established work patterns.

### Fortress

Curated entry (trust_level 0 on registration), maintainer-only posting,
maintainer-only validation, sandbox required, strict SLAs. Maximum
control. Good for security-critical or compliance-sensitive work.

### Commons

Open posting, low escalation thresholds, federation enabled, external
stamps honored at 0.5 weight, soft expiry. Community-first. Good for
open-source projects and cross-organization collaboration.

---

*The record shows these decisions are the foundation. Choose with care,
but know that a constitution can be amended — the `_meta` table accepts
updates, and Dolt commits preserve the history of every change.*

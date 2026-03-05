# Spider Protocol — Fraud Detection Queries

**The immune system of the Wasteland reputation protocol.**

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Date | 2026-03-04 |
| Authority | Hemlock (Quality & Standards) |
| Schema | MVR 1.1 |
| Reference | `docs/mvr-protocol-spec.md` Section 11.3 |

---

## 1. Threat Model

Six categories of reputation attack. Each exploits a different surface of the MVR protocol.

| ID | Threat | Surface | Severity |
|----|--------|---------|----------|
| T1 | Stamp farming | `stamps` reciprocity | Critical |
| T2 | Sybil attack | `rigs` identity | Critical |
| T3 | Rubber stamping | `stamps` valence uniformity | High |
| T4 | Ghost claiming | `wanted` status lifecycle | Medium |
| T5 | Quality flooding | `completions` volume | High |
| T6 | Trust laundering | Cross-wasteland `stamps` | High |

### T1: Stamp Farming

Two or more rigs stamp each other's work in a closed loop. Rig A completes work, Rig B validates. Then Rig B completes work, Rig A validates. Both accumulate reputation without independent attestation.

**Why it works:** The Yearbook Rule (`CHECK (author != subject)`) prevents self-stamping but does not prevent reciprocal stamping between colluding rigs.

### T2: Sybil Attack

One human operator registers multiple rig identities (possibly under different DoltHub accounts) to create an artificial validator pool. The `parent_rig` field mitigates this for declared agent rigs, but a human creating multiple "human" rigs bypasses it.

**Why it works:** MVR identity is DoltHub-credential-based. One person with multiple DoltHub accounts can register multiple independent rigs.

### T3: Rubber Stamping

A validator approves every completion without meaningful review, issuing uniformly high valence scores regardless of work quality. This inflates the subject's reputation and degrades the signal-to-noise ratio of the stamp pool.

**Why it works:** The protocol requires `trust_level >= 2` to validate but does not enforce review rigor. Valence is self-reported by the validator.

### T4: Ghost Claiming

A rig claims wanted items to block other rigs from working on them, then never submits a completion. The item sits in `claimed` status indefinitely, starving the board of available work.

**Why it works:** Claiming has no expiration. The protocol does not enforce a timeout between `claimed` and `in_review` status transitions.

### T5: Quality Flooding

A rig submits many low-effort completions against trivial or self-posted wanted items to inflate their stamp count. Volume substitutes for quality. Often combined with T3 (a rubber-stamping validator approves all of them).

**Why it works:** Multiple completions per wanted item are allowed. No minimum quality threshold exists for stamp issuance.

### T6: Trust Laundering

A rig earns trust in a permissive wasteland (one with low review standards or colluding validators), then uses its stamp history to claim credibility in a stricter wasteland. Reputation portability enables this.

**Why it works:** Stamps reference handles, not databases. A rig's passbook aggregates stamps from all wastelands without distinguishing provenance quality.

---

## 2. Anomaly Indicators

Statistical signals that precede or correlate with threats. Each indicator has a baseline derivation and an anomaly threshold.

### 2.1 Stamp Velocity

**Signal:** Number of stamps issued or received per day, exceeding the population baseline.

**Baseline:** Median stamps per rig per day across all rigs with >= 5 stamps.

```sql
-- Stamp velocity per rig (as author)
SELECT
    s.author AS rig,
    COUNT(*) AS total_stamps,
    DATEDIFF(MAX(s.created_at), MIN(s.created_at)) + 1 AS active_days,
    COUNT(*) / (DATEDIFF(MAX(s.created_at), MIN(s.created_at)) + 1) AS stamps_per_day
FROM stamps s
GROUP BY s.author
HAVING stamps_per_day > 3.0
ORDER BY stamps_per_day DESC;
```

**Threshold:** > 3 stamps/day sustained over 7+ days. Justification: a thorough review takes non-trivial time. Three validations per day is aggressive but possible; sustained rates above this suggest automation or rubber stamping.

**False positives:** Maintainers clearing a review backlog. Mitigated by checking if burst correlates with a spike in pending completions.

### 2.2 Reciprocity Ratio

**Signal:** The proportion of stamps between two rigs that flow in both directions.

```sql
-- Reciprocal stamp pairs
SELECT
    LEAST(s1.author, s1.subject) AS rig_a,
    GREATEST(s1.author, s1.subject) AS rig_b,
    SUM(CASE WHEN s1.author < s1.subject THEN 1 ELSE 0 END) AS a_stamps_b,
    SUM(CASE WHEN s1.author > s1.subject THEN 1 ELSE 0 END) AS b_stamps_a,
    COUNT(*) AS total_interactions,
    LEAST(
        SUM(CASE WHEN s1.author < s1.subject THEN 1 ELSE 0 END),
        SUM(CASE WHEN s1.author > s1.subject THEN 1 ELSE 0 END)
    ) / GREATEST(
        SUM(CASE WHEN s1.author < s1.subject THEN 1 ELSE 0 END),
        SUM(CASE WHEN s1.author > s1.subject THEN 1 ELSE 0 END)
    ) AS reciprocity_ratio
FROM stamps s1
GROUP BY LEAST(s1.author, s1.subject), GREATEST(s1.author, s1.subject)
HAVING total_interactions >= 4
    AND reciprocity_ratio > 0.6
ORDER BY reciprocity_ratio DESC;
```

**Threshold:** Reciprocity ratio > 0.6 with >= 4 total interactions. A ratio of 1.0 means perfect reciprocity (A stamps B exactly as often as B stamps A). Normal validator-worker relationships are asymmetric.

**False positives:** Small communities with few participants (everyone reviews everyone). Mitigated by requiring minimum interaction count and cross-referencing with community size.

### 2.3 Completion Time Anomalies

**Signal:** Time between `wanted.created_at` (or `wanted.updated_at` when claimed) and `completions.completed_at` is implausibly short relative to effort level.

```sql
-- Fast completions relative to effort level
SELECT
    c.id AS completion_id,
    c.completed_by,
    w.id AS wanted_id,
    w.title,
    w.effort_level,
    TIMESTAMPDIFF(MINUTE, w.created_at, c.completed_at) AS minutes_to_complete,
    CASE w.effort_level
        WHEN 'trivial' THEN 15
        WHEN 'small'   THEN 60
        WHEN 'medium'  THEN 240
        WHEN 'large'   THEN 480
        WHEN 'epic'    THEN 1440
    END AS min_expected_minutes
FROM completions c
JOIN wanted w ON c.wanted_id = w.id
WHERE TIMESTAMPDIFF(MINUTE, w.created_at, c.completed_at) <
    CASE w.effort_level
        WHEN 'trivial' THEN 5
        WHEN 'small'   THEN 15
        WHEN 'medium'  THEN 30
        WHEN 'large'   THEN 60
        WHEN 'epic'    THEN 120
    END
ORDER BY minutes_to_complete ASC;
```

**Threshold:** Completion time < minimum plausible floor per effort level. A "medium" task completed in under 30 minutes warrants investigation. An "epic" task in under 2 hours is almost certainly fraudulent or mislabeled.

**False positives:** Pre-existing work submitted retroactively. The evidence field should explain this; flag but do not auto-penalize.

### 2.4 Valence Uniformity

**Signal:** A validator who always gives the same scores across all dimensions.

```sql
-- Validators with zero valence variance
SELECT
    s.author,
    COUNT(*) AS stamps_issued,
    JSON_EXTRACT(s.valence, '$.quality') AS quality_sample,
    STDDEV(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS quality_stddev,
    STDDEV(CAST(JSON_EXTRACT(s.valence, '$.reliability') AS DECIMAL)) AS reliability_stddev,
    STDDEV(CAST(JSON_EXTRACT(s.valence, '$.creativity') AS DECIMAL)) AS creativity_stddev
FROM stamps s
GROUP BY s.author
HAVING stamps_issued >= 5
    AND quality_stddev < 0.3
    AND reliability_stddev < 0.3
    AND creativity_stddev < 0.3
ORDER BY stamps_issued DESC;
```

**Threshold:** Standard deviation < 0.3 across all three valence dimensions with >= 5 stamps. A thoughtful reviewer's scores should vary. Perfect uniformity across 5+ reviews indicates either rubber stamping or scripted validation.

**False positives:** A validator who has genuinely reviewed only high-quality work. Mitigated by cross-referencing with effort level distribution — if the validated items span trivial to large, uniform 5s are suspect.

### 2.5 Trust Velocity

**Signal:** A rig's trust level increases faster than the population norm.

```sql
-- Trust escalation speed
SELECT
    r.handle,
    r.trust_level,
    r.rig_type,
    r.registered_at,
    DATEDIFF(NOW(), r.registered_at) AS days_since_registration,
    (SELECT COUNT(*) FROM stamps s WHERE s.subject = r.handle) AS stamps_received,
    (SELECT COUNT(*) FROM completions c WHERE c.completed_by = r.handle) AS completions_count,
    (SELECT COUNT(*) FROM stamps s WHERE s.subject = r.handle) /
        GREATEST(DATEDIFF(NOW(), r.registered_at), 1) AS stamps_per_day
FROM rigs r
WHERE r.trust_level >= 2
    AND DATEDIFF(NOW(), r.registered_at) < 14
ORDER BY r.trust_level DESC, days_since_registration ASC;
```

**Threshold:** `trust_level >= 2` within 14 days of registration. The recommended escalation heuristic (Section 7.3 of MVR spec) suggests 3+ stamps with average quality >= 3.0 for level 2. Reaching this in under two weeks is possible but warrants a closer look at stamp provenance.

**False positives:** Genuinely prolific contributors onboarding during a project sprint. Check whether the stamps come from diverse validators.

---

## 3. Detection Queries

One query per threat. Each query is designed to run against a single wasteland's Dolt database.

### 3.1 Detect Stamp Farming (T1)

Identifies pairs of rigs that stamp each other with high reciprocity and frequency.

```sql
-- SPIDER-T1: Stamp farming detection
-- Flags: reciprocal stamping pairs with high symmetry
SELECT
    LEAST(s.author, s.subject) AS rig_a,
    GREATEST(s.author, s.subject) AS rig_b,
    SUM(CASE WHEN s.author = LEAST(s.author, s.subject) THEN 1 ELSE 0 END) AS a_validates_b,
    SUM(CASE WHEN s.author = GREATEST(s.author, s.subject) THEN 1 ELSE 0 END) AS b_validates_a,
    COUNT(*) AS total_stamps,
    MIN(s.created_at) AS first_interaction,
    MAX(s.created_at) AS last_interaction,
    -- Symmetry score: 1.0 = perfect reciprocity
    LEAST(
        SUM(CASE WHEN s.author = LEAST(s.author, s.subject) THEN 1 ELSE 0 END),
        SUM(CASE WHEN s.author = GREATEST(s.author, s.subject) THEN 1 ELSE 0 END)
    ) / GREATEST(
        SUM(CASE WHEN s.author = LEAST(s.author, s.subject) THEN 1 ELSE 0 END),
        SUM(CASE WHEN s.author = GREATEST(s.author, s.subject) THEN 1 ELSE 0 END)
    ) AS symmetry_score,
    -- Exclusivity: what fraction of each rig's stamps involve only the other
    SUM(CASE WHEN s.author = LEAST(s.author, s.subject) THEN 1 ELSE 0 END) /
        (SELECT COUNT(*) FROM stamps s2 WHERE s2.author = LEAST(s.author, s.subject)) AS a_exclusivity,
    SUM(CASE WHEN s.author = GREATEST(s.author, s.subject) THEN 1 ELSE 0 END) /
        (SELECT COUNT(*) FROM stamps s2 WHERE s2.author = GREATEST(s.author, s.subject)) AS b_exclusivity
FROM stamps s
GROUP BY LEAST(s.author, s.subject), GREATEST(s.author, s.subject)
HAVING total_stamps >= 4
    AND symmetry_score > 0.5
    AND (a_exclusivity > 0.7 OR b_exclusivity > 0.7)
ORDER BY symmetry_score DESC, total_stamps DESC;
```

**Heuristic:** Symmetry score > 0.5 AND one rig's stamps are > 70% exclusive to the pair AND >= 4 total stamps.

**Justification:** Legitimate validator-worker relationships are asymmetric. A validator typically reviews many workers. When > 70% of a validator's stamps go to a single subject who also stamps them back, it's a closed loop.

**False positives:** Two-person team in a small wasteland. Check wasteland population size — if `(SELECT COUNT(*) FROM rigs WHERE trust_level >= 2) <= 3`, reduce severity.

**Response:** Level 2 — reduce confidence multiplier on suspect stamps to 0.25.

### 3.2 Detect Sybil Attack (T2)

Identifies potential Sybil clusters: multiple rigs that share operational patterns suggesting common control.

```sql
-- SPIDER-T2: Sybil detection — registration clustering
-- Flags: rigs registered in tight time windows from similar sources
SELECT
    r1.handle AS rig_a,
    r2.handle AS rig_b,
    r1.registered_at AS a_registered,
    r2.registered_at AS b_registered,
    ABS(TIMESTAMPDIFF(MINUTE, r1.registered_at, r2.registered_at)) AS registration_gap_minutes,
    r1.dolthub_org AS a_org,
    r2.dolthub_org AS b_org,
    r1.rig_type AS a_type,
    r2.rig_type AS b_type,
    -- Check if they only stamp each other's work
    (SELECT COUNT(*) FROM stamps s
     WHERE (s.author = r1.handle AND s.subject = r2.handle)
        OR (s.author = r2.handle AND s.subject = r1.handle)) AS mutual_stamps,
    -- Check if they share no other validators
    (SELECT COUNT(DISTINCT s.author) FROM stamps s
     WHERE s.subject = r1.handle AND s.author != r2.handle) AS a_independent_validators,
    (SELECT COUNT(DISTINCT s.author) FROM stamps s
     WHERE s.subject = r2.handle AND s.author != r1.handle) AS b_independent_validators
FROM rigs r1
JOIN rigs r2 ON r1.handle < r2.handle
WHERE r1.rig_type = 'human' AND r2.rig_type = 'human'
    AND ABS(TIMESTAMPDIFF(MINUTE, r1.registered_at, r2.registered_at)) < 60
HAVING mutual_stamps > 0
    AND a_independent_validators = 0
    AND b_independent_validators = 0
ORDER BY registration_gap_minutes ASC;
```

```sql
-- SPIDER-T2b: Sybil detection — agent rig clustering
-- Flags: agent rigs with different parent_rig that behave identically
SELECT
    r.parent_rig,
    COUNT(*) AS agent_count,
    GROUP_CONCAT(r.handle ORDER BY r.handle) AS agents,
    (SELECT COUNT(DISTINCT s.subject) FROM stamps s
     WHERE s.author IN (SELECT handle FROM rigs WHERE parent_rig = r.parent_rig)) AS subjects_validated,
    (SELECT COUNT(*) FROM stamps s
     WHERE s.author IN (SELECT handle FROM rigs WHERE parent_rig = r.parent_rig)) AS total_stamps_issued
FROM rigs r
WHERE r.rig_type = 'agent'
    AND r.parent_rig IS NOT NULL
GROUP BY r.parent_rig
HAVING agent_count > 3
ORDER BY agent_count DESC;
```

**Heuristic (T2a):** Two "human" rigs registered within 60 minutes of each other, with mutual stamps and zero independent validators.

**Heuristic (T2b):** A single parent_rig with > 3 agent rigs. Not inherently fraudulent, but the agent swarm's stamp patterns should be audited.

**False positives (T2a):** Onboarding events where multiple people register simultaneously. Mitigated by requiring mutual stamps AND zero independent validators — genuine distinct humans would acquire diverse validators over time.

**Response:** Level 1 (flag for review). If confirmed, Level 4 — revoke stamps from Sybil rigs and reset trust.

### 3.3 Detect Rubber Stamping (T3)

Identifies validators who approve everything without discrimination.

```sql
-- SPIDER-T3: Rubber stamping detection
-- Flags: validators with uniformly high scores and no rejections
SELECT
    s.author AS validator,
    COUNT(*) AS stamps_issued,
    AVG(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS avg_quality,
    AVG(CAST(JSON_EXTRACT(s.valence, '$.reliability') AS DECIMAL)) AS avg_reliability,
    AVG(CAST(JSON_EXTRACT(s.valence, '$.creativity') AS DECIMAL)) AS avg_creativity,
    MIN(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS min_quality,
    STDDEV(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS quality_variance,
    STDDEV(CAST(JSON_EXTRACT(s.valence, '$.reliability') AS DECIMAL)) AS reliability_variance,
    -- Time spent per review (proxy for diligence)
    AVG(TIMESTAMPDIFF(MINUTE, c.completed_at, s.created_at)) AS avg_review_minutes,
    MIN(TIMESTAMPDIFF(MINUTE, c.completed_at, s.created_at)) AS min_review_minutes,
    -- How many distinct subjects
    COUNT(DISTINCT s.subject) AS distinct_subjects
FROM stamps s
JOIN completions c ON s.context_id = c.id AND s.context_type = 'completion'
GROUP BY s.author
HAVING stamps_issued >= 5
    AND avg_quality >= 4.5
    AND quality_variance < 0.3
    AND min_review_minutes < 2
ORDER BY stamps_issued DESC;
```

**Heuristic:** >= 5 stamps AND average quality >= 4.5 AND quality variance < 0.3 AND minimum review time < 2 minutes.

**Justification:** A 2-minute review of a non-trivial completion is insufficient for meaningful assessment. Combined with uniformly high scores and low variance, this pattern indicates approval without inspection.

**False positives:** A validator reviewing a batch of genuinely excellent trivial tasks. Check `wanted.effort_level` — if all validated items are `trivial`, reduce severity.

**Response:** Level 2 — reduce confidence multiplier on this validator's stamps to 0.5. Level 3 if sustained.

### 3.4 Detect Ghost Claiming (T4)

Identifies rigs that claim items and never complete them.

```sql
-- SPIDER-T4: Ghost claiming detection
-- Flags: rigs with high claim-to-completion ratio failures
SELECT
    w.claimed_by AS ghost,
    COUNT(*) AS total_claims,
    SUM(CASE WHEN w.status = 'claimed' THEN 1 ELSE 0 END) AS still_claimed,
    SUM(CASE WHEN w.status IN ('in_review', 'completed') THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN w.status = 'claimed'
        AND DATEDIFF(NOW(), w.updated_at) > 14 THEN 1 ELSE 0 END) AS stale_claims,
    SUM(CASE WHEN w.status = 'claimed'
        AND DATEDIFF(NOW(), w.updated_at) > 14 THEN 1 ELSE 0 END) /
        COUNT(*) AS abandonment_ratio,
    AVG(CASE WHEN w.status = 'claimed'
        THEN DATEDIFF(NOW(), w.updated_at) ELSE NULL END) AS avg_claim_age_days
FROM wanted w
WHERE w.claimed_by IS NOT NULL
GROUP BY w.claimed_by
HAVING total_claims >= 3
    AND abandonment_ratio > 0.5
ORDER BY stale_claims DESC;
```

**Heuristic:** >= 3 claims AND > 50% stale (claimed for > 14 days with no completion) AND abandonment ratio > 0.5.

**Justification:** 14 days is generous for even a "large" effort item. A rig that claims 3+ items and abandons more than half is either overcommitting or intentionally blocking.

**False positives:** A rig that hit a legitimate blocker. Check if the rig has any completions at all — zero completions + multiple stale claims is stronger signal.

**Response:** Level 1 — flag for maintainer review. Maintainer may release claims (`UPDATE wanted SET claimed_by = NULL, status = 'open'`). Repeat offenders: Level 3 — freeze at trust_level 1 (cannot validate).

### 3.5 Detect Quality Flooding (T5)

Identifies rigs submitting high volumes of low-effort completions.

```sql
-- SPIDER-T5: Quality flooding detection
-- Flags: rigs with high completion volume against low-effort items
SELECT
    c.completed_by,
    COUNT(*) AS total_completions,
    SUM(CASE WHEN w.effort_level IN ('trivial', 'small') THEN 1 ELSE 0 END) AS trivial_small_count,
    SUM(CASE WHEN w.effort_level IN ('trivial', 'small') THEN 1 ELSE 0 END) /
        COUNT(*) AS low_effort_ratio,
    -- Self-posted ratio: did this rig also post the wanted items?
    SUM(CASE WHEN w.posted_by = c.completed_by THEN 1 ELSE 0 END) AS self_posted,
    SUM(CASE WHEN w.posted_by = c.completed_by THEN 1 ELSE 0 END) /
        COUNT(*) AS self_post_ratio,
    AVG(TIMESTAMPDIFF(MINUTE, w.created_at, c.completed_at)) AS avg_completion_minutes,
    -- Stamp quality received
    AVG(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS avg_quality_received,
    COUNT(DISTINCT s.author) AS distinct_validators
FROM completions c
JOIN wanted w ON c.wanted_id = w.id
LEFT JOIN stamps s ON s.context_id = c.id AND s.context_type = 'completion'
GROUP BY c.completed_by
HAVING total_completions >= 10
    AND (low_effort_ratio > 0.8 OR self_post_ratio > 0.5)
ORDER BY total_completions DESC;
```

**Heuristic:** >= 10 completions AND (> 80% against trivial/small items OR > 50% against self-posted items).

**Justification:** Completing your own posted items is allowed but disproportionate self-completion suggests manufactured work. Similarly, a portfolio dominated by trivial items when the board has substantive work available indicates quantity-over-quality strategy.

**False positives:** Documentation or community work that is genuinely high-volume and small-scoped. Check `wanted.type` — if predominantly `docs` or `community`, reduce severity.

**Response:** Level 2 — reduce confidence multiplier on stamps for trivial/small completions to 0.5. Level 3 if combined with T3 (rubber stamping validator).

### 3.6 Detect Trust Laundering (T6)

Identifies rigs whose reputation derives disproportionately from a single wasteland with suspect characteristics.

This query requires access to multiple wastelands (federation-level audit). Run against each wasteland individually and correlate results.

```sql
-- SPIDER-T6: Trust laundering — single-wasteland audit
-- Identifies rigs whose stamps come from a very small validator pool
SELECT
    s.subject,
    COUNT(*) AS total_stamps,
    COUNT(DISTINCT s.author) AS distinct_validators,
    COUNT(*) / COUNT(DISTINCT s.author) AS stamps_per_validator,
    AVG(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS avg_quality,
    AVG(s.confidence) AS avg_confidence,
    -- Check validator trust levels
    (SELECT AVG(r.trust_level) FROM rigs r
     WHERE r.handle IN (SELECT DISTINCT s2.author FROM stamps s2 WHERE s2.subject = s.subject)
    ) AS avg_validator_trust_level,
    -- Check if validators are themselves new
    (SELECT AVG(DATEDIFF(NOW(), r.registered_at)) FROM rigs r
     WHERE r.handle IN (SELECT DISTINCT s2.author FROM stamps s2 WHERE s2.subject = s.subject)
    ) AS avg_validator_age_days
FROM stamps s
GROUP BY s.subject
HAVING total_stamps >= 5
    AND distinct_validators <= 2
    AND avg_quality >= 4.0
ORDER BY stamps_per_validator DESC;
```

**Heuristic:** >= 5 stamps AND <= 2 distinct validators AND average quality >= 4.0. High reputation from a tiny validator pool is weak provenance.

**Justification:** Robust reputation requires diverse attestation. Five stamps from one validator carry less weight than five stamps from five independent validators. Combined with high scores, this pattern suggests either a very small community or a laundering operation.

**Federation-level correlation:** When a rig from wasteland A joins wasteland B, query their stamp provenance in wasteland A using this query. If flagged, their trust_level in wasteland B should start at 1 regardless of reputation claims.

**False positives:** Bootstrap phase of a new wasteland with few participants. Check `(SELECT COUNT(*) FROM rigs WHERE trust_level >= 2)` — if the wasteland has < 5 eligible validators, the small pool is structural, not fraudulent.

**Response:** Level 1 — flag for maintainer review in the destination wasteland. Level 2 — do not auto-promote based on cross-wasteland reputation from flagged sources.

---

## 4. Network Analysis

Graph-based detection for structural anomalies in the stamp network.

### 4.1 Stamp Graph Clustering

Build a directed graph: nodes are rigs, edges are stamps (author -> subject). Weight edges by stamp count.

```sql
-- Build the stamp graph adjacency list
SELECT
    s.author AS source,
    s.subject AS target,
    COUNT(*) AS weight,
    AVG(CAST(JSON_EXTRACT(s.valence, '$.quality') AS DECIMAL)) AS avg_quality,
    MIN(s.created_at) AS first_stamp,
    MAX(s.created_at) AS last_stamp
FROM stamps s
GROUP BY s.author, s.subject
ORDER BY weight DESC;
```

**Analysis:** Export this adjacency list and run community detection (Louvain or Leiden algorithm). Clusters with high internal connectivity and low external connectivity are suspect.

**Benchmark:** A healthy stamp graph has modularity < 0.5. Modularity > 0.7 indicates isolated cliques — potential stamp farming rings.

### 4.2 Isolated Subgraphs

Groups of rigs that interact exclusively with each other.

```sql
-- SPIDER-NET: Isolated subgraph detection
-- Finds rigs whose entire stamp history involves only a small closed set
SELECT
    s.subject AS rig,
    GROUP_CONCAT(DISTINCT s.author ORDER BY s.author) AS all_validators,
    COUNT(DISTINCT s.author) AS validator_count,
    (SELECT COUNT(DISTINCT s2.subject) FROM stamps s2
     WHERE s2.author IN (
         SELECT DISTINCT s3.author FROM stamps s3 WHERE s3.subject = s.subject
     ) AND s2.subject != s.subject
    ) AS validators_other_subjects,
    -- If validators stamp ONLY this rig, it's isolated
    (SELECT COUNT(DISTINCT s2.subject) FROM stamps s2
     WHERE s2.author IN (
         SELECT DISTINCT s3.author FROM stamps s3 WHERE s3.subject = s.subject
     )
    ) AS total_subjects_of_validators
FROM stamps s
GROUP BY s.subject
HAVING validator_count <= 3
    AND total_subjects_of_validators <= 4
    AND (SELECT COUNT(*) FROM stamps WHERE subject = s.subject) >= 3
ORDER BY total_subjects_of_validators ASC;
```

**Heuristic:** A rig with <= 3 validators, and those validators stamp <= 4 total subjects across all their stamps, and the rig has >= 3 stamps. This is a near-isolated clique.

**Benchmark:** In a healthy commons with N rigs, each validator should stamp >= sqrt(N) distinct subjects over time. Validators who stamp fewer than 3 subjects are either new or operating in a closed ring.

### 4.3 Betweenness Centrality Anomalies

Rigs that serve as the sole bridge between otherwise disconnected groups may be gatekeeping or acting as trust bottlenecks.

```sql
-- Simplified bridge detection: validators who are the ONLY connection
-- between two groups of workers
SELECT
    s.author AS potential_bridge,
    COUNT(DISTINCT s.subject) AS subjects_validated,
    (SELECT COUNT(DISTINCT s2.author) FROM stamps s2
     WHERE s2.subject IN (SELECT DISTINCT s3.subject FROM stamps s3 WHERE s3.author = s.author)
       AND s2.author != s.author
    ) AS co_validators,
    -- If co_validators = 0, this validator is the sole attestor for all their subjects
    CASE WHEN (
        SELECT COUNT(DISTINCT s2.author) FROM stamps s2
        WHERE s2.subject IN (SELECT DISTINCT s3.subject FROM stamps s3 WHERE s3.author = s.author)
          AND s2.author != s.author
    ) = 0 THEN 'SOLE_GATEKEEPER' ELSE 'NORMAL' END AS bridge_status
FROM stamps s
GROUP BY s.author
HAVING subjects_validated >= 3
    AND bridge_status = 'SOLE_GATEKEEPER'
ORDER BY subjects_validated DESC;
```

**Heuristic:** A validator who has stamped >= 3 distinct subjects AND none of those subjects have been stamped by any other validator.

**Risk:** A sole gatekeeper can inflate or suppress reputation unilaterally. Their stamps carry single-point-of-failure risk.

**Response:** Level 1 — flag for maintainer awareness. Not inherently fraudulent (may be the only active reviewer), but stamps from sole gatekeepers should carry reduced confidence.

---

## 5. Response Framework

Graduated response aligned with threat severity. Each level is cumulative.

| Level | Name | Action | Reversibility | Authority |
|-------|------|--------|---------------|-----------|
| 1 | Flag | Flag rig for human review. Add entry to `_spider_flags` table. | Trivial | Automated |
| 2 | Attenuate | Reduce confidence multiplier on suspect stamps. | Moderate — requires recalculation | Automated with review |
| 3 | Quarantine | Freeze rig trust level. Prevent trust escalation. | Moderate — maintainer unfreezes | Maintainer approval |
| 4 | Revoke | Revoke stamps issued by/to suspect rigs. Reset trust to level 1. | Difficult — affects downstream reputation | Maintainer + evidence |

### Level 1: Flag

```sql
-- Create spider flags table (custom, prefixed per MVR convention)
CREATE TABLE IF NOT EXISTS _spider_flags (
    id VARCHAR(64) PRIMARY KEY,
    rig_handle VARCHAR(255) NOT NULL,
    threat_id VARCHAR(8) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    evidence TEXT NOT NULL,
    query_id VARCHAR(32),
    flagged_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    disposition VARCHAR(32) DEFAULT 'pending',
    notes TEXT
);

-- Insert a flag
INSERT INTO _spider_flags (id, rig_handle, threat_id, severity, evidence, query_id)
VALUES (
    CONCAT('sf-', LEFT(MD5(CONCAT(NOW(), RAND())), 10)),
    '<rig_handle>',
    'T1',
    'critical',
    'Reciprocity ratio 0.85 with rig_b over 6 stamps',
    'SPIDER-T1'
);
```

**Governance note:** Flags are advisory. No automated enforcement. Maintainers review flags and decide disposition: `cleared`, `confirmed`, `escalated`.

### Level 2: Attenuate

Reduce the effective weight of suspect stamps by modifying the `confidence` field.

```sql
-- Attenuate stamps from a flagged validator
UPDATE stamps
SET confidence = confidence * 0.25,
    metadata = JSON_SET(
        COALESCE(metadata, '{}'),
        '$.spider_attenuated', TRUE,
        '$.spider_flag_id', '<flag_id>',
        '$.original_confidence', confidence
    )
WHERE author = '<suspect_validator>'
    AND confidence > 0.25;
```

**Governance note:** The original confidence is preserved in `metadata.original_confidence` for reversibility. Attenuation is non-destructive — no data is deleted.

### Level 3: Quarantine

Freeze a rig's trust level and prevent escalation.

```sql
-- Quarantine a rig
UPDATE rigs
SET metadata = JSON_SET(
        COALESCE(metadata, '{}'),
        '$.spider_quarantined', TRUE,
        '$.spider_quarantined_at', NOW(),
        '$.spider_flag_id', '<flag_id>',
        '$.pre_quarantine_trust_level', trust_level
    )
WHERE handle = '<suspect_rig>';
```

**Implementation note:** Quarantine does not change `trust_level` directly. Instead, validation logic checks `metadata.spider_quarantined` before allowing trust escalation. This preserves the rig's earned level while preventing further advancement.

### Level 4: Revoke

Nuclear option. Revoke stamps and reset trust.

```sql
-- Revoke all stamps authored by a confirmed bad actor
UPDATE stamps
SET confidence = 0.0,
    metadata = JSON_SET(
        COALESCE(metadata, '{}'),
        '$.spider_revoked', TRUE,
        '$.spider_revoked_at', NOW(),
        '$.spider_flag_id', '<flag_id>',
        '$.original_confidence', confidence
    )
WHERE author = '<confirmed_bad_actor>';

-- Reset the rig's trust level
UPDATE rigs
SET trust_level = 1,
    metadata = JSON_SET(
        COALESCE(metadata, '{}'),
        '$.spider_reset', TRUE,
        '$.spider_reset_at', NOW(),
        '$.spider_flag_id', '<flag_id>'
    )
WHERE handle = '<confirmed_bad_actor>';
```

**Governance note:** Level 4 requires documented evidence and maintainer sign-off. The revocation is recorded in Dolt's commit history, providing a permanent audit trail. Stamp data is preserved (confidence = 0.0, not deleted) for forensic analysis.

---

## 6. Implementation

### 6.1 Scheduled Audit

Run the full Spider Protocol query suite as a periodic audit.

| Frequency | Queries | Rationale |
|-----------|---------|-----------|
| Daily | T3 (rubber stamping), T4 (ghost claiming) | Fast-moving threats that degrade board health |
| Weekly | T1 (stamp farming), T2 (sybil), T5 (quality flooding) | Pattern-based threats that need accumulation to detect |
| Monthly | T6 (trust laundering), network analysis (4.1-4.3) | Cross-wasteland and structural analysis |

**Execution:** Run queries via `dolt sql` against the local clone after pulling latest from upstream. Store results in `_spider_flags`.

```bash
# Example: daily spider audit
cd LOCAL_DIR
dolt pull upstream main
dolt sql -r json < spider-daily.sql | spider-evaluate.sh
```

### 6.2 Real-Time Triggers

Event-driven checks on stamp creation.

| Event | Check | Action |
|-------|-------|--------|
| New stamp inserted | Reciprocity check (T1) for this author-subject pair | Flag if symmetry > 0.5 and interaction count >= 4 |
| New stamp inserted | Velocity check for author | Flag if > 3 stamps in last 24 hours |
| New stamp inserted | Valence variance check for author | Flag if stddev < 0.3 across last 5 stamps |
| New completion | Completion time check (2.3) | Flag if below effort-level floor |
| New claim | Ghost claim check for claimer | Flag if claimer has > 2 stale claims |

**Implementation:** Real-time triggers run as post-commit checks. After each `dolt commit` that modifies `stamps` or `completions`, run the relevant point query against the new row.

```sql
-- Point query: reciprocity check on new stamp
-- Run after INSERT into stamps with author=@author, subject=@subject
SELECT
    COUNT(*) AS reverse_stamps
FROM stamps
WHERE author = @subject AND subject = @author;

-- If reverse_stamps > 0, run the full T1 query for this pair
```

### 6.3 Dashboard Integration

Spider Protocol results feed into the Wasteland dashboard (see `types.ts: DashboardView`).

**Data flow:**

```
_spider_flags table
    |
    v
DashboardView.failurePatterns  (map spider flags to FailureSignature)
    |
    v
UI: Spider Protocol panel
    - Active flags (grouped by threat ID)
    - Trend chart (flags per week)
    - Network graph (stamp topology with flagged edges highlighted)
    - Response actions (attenuate, quarantine, revoke — maintainer-gated)
```

**Mapping to existing types:**

| Spider Concept | Existing Type | Field Mapping |
|---------------|---------------|---------------|
| Threat category | `FailureClass` | T1-T3 -> `safety-violation`, T4 -> `timeout`, T5-T6 -> `scope-gap` |
| Spider flag | `FailureSignature` | `failureClass`, `conditions` (threshold params), `preventativeAction` |
| Attenuation | `ConfidenceDecayConfig` | Reuse decay mechanics for gradual confidence reduction |

---

## 7. Calibration

### 7.1 Threshold Tuning

All thresholds in this document are initial calibration points. They must be tuned against real data.

| Parameter | Initial Value | Tuning Method |
|-----------|--------------|---------------|
| Stamp velocity ceiling | 3/day | 95th percentile of legitimate validators |
| Reciprocity threshold | 0.5 | ROC curve against known-good pairs |
| Completion time floor | Per effort level | 10th percentile of legitimate completions |
| Valence variance floor | 0.3 | Distribution analysis of active validators |
| Ghost claim timeout | 14 days | Median completion time per effort level |
| Self-post ratio ceiling | 0.5 | Community norm analysis |

### 7.2 Measurement Frequency

Recalibrate thresholds quarterly or when the rig population doubles, whichever comes first. The standard drifts as the community grows — what is anomalous in a 10-rig wasteland may be normal in a 100-rig wasteland.

### 7.3 False Positive Budget

**Target false positive rate: < 5% of flagged rigs are cleared after review.**

Track the disposition of all spider flags:

```sql
SELECT
    threat_id,
    COUNT(*) AS total_flags,
    SUM(CASE WHEN disposition = 'cleared' THEN 1 ELSE 0 END) AS false_positives,
    SUM(CASE WHEN disposition = 'confirmed' THEN 1 ELSE 0 END) AS true_positives,
    SUM(CASE WHEN disposition = 'cleared' THEN 1 ELSE 0 END) / COUNT(*) AS fp_rate
FROM _spider_flags
WHERE disposition IN ('cleared', 'confirmed')
GROUP BY threat_id;
```

If the false positive rate exceeds 5% for any threat category, loosen the corresponding threshold. If it drops below 1%, consider tightening — the query may be missing attacks.

---

The standard holds. Every query is precise. Every threshold is justified. Every response is proportional. This is the immune system — it protects without overreacting.

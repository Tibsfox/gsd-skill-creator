# Test Patterns Reference — Research Mission Generator

Templates and patterns for generating test plans across research domains.

## Test Plan Structure

Every research mission test plan contains four categories:

| Category | Purpose | Priority | Failure Action | Target % |
|----------|---------|----------|----------------|----------|
| Safety-critical | Non-negotiable boundaries | Mandatory | BLOCK | ≥15% |
| Core functionality | Deliverable acceptance | Required | BLOCK | ~45% |
| Integration | Cross-module validation | Required | BLOCK | ~25% |
| Edge cases | Robustness | Best-effort | LOG | ~15% |

**Test density target:** 2–4 tests per success criterion. For a 12-criterion mission, aim for 30–48 total tests.

---

## Universal Safety-Critical Tests

These tests apply to ALL research missions regardless of domain. Include all that are relevant:

| Test ID | Verifies | Expected Behavior | When to Include |
|---------|----------|-------------------|-----------------|
| SC-SRC | Source quality | All citations traceable to gov agencies, peer-reviewed journals, or professional organizations. Zero entertainment media. | ALWAYS |
| SC-NUM | Numerical attribution | Every species count, percentage, measurement, or statistic attributed to a specific source | ALWAYS |
| SC-ADV | No policy advocacy | Document presents evidence and findings without advocating for specific legislative or policy positions | ALWAYS |
| SC-IND | Indigenous attribution | Every Indigenous knowledge reference names specific nation, never generic "Indigenous peoples" | When Indigenous content present |
| SC-END | Endangered species locations | No GPS coordinates or specific nest/den/breeding site locations for any listed species | When endangered species discussed |
| SC-MED | Medical accuracy | No health claims without peer-reviewed evidence; appropriate disclaimers included | When health/medical content present |
| SC-CLI | Climate projections sourced | Every temperature, precipitation, or sea-level projection cites specific agency or IPCC scenario | When climate data present |
| SC-SEC | Security sensitivity | No operational details that could aid exploitation of vulnerabilities discussed | When security topics present |

---

## Core Functionality Test Patterns

Generate these tests based on the mission's success criteria. Each criterion should map to 2–4 tests.

### Inventory/Survey Criteria

For criteria like "Species inventories cover all four taxonomic groups":

```
CF-XX: [Group] inventory completeness
  Verifies: [Group] section contains ≥ [N] species with sources
  Expected: Count matches or exceeds published agency totals
```

### Profile/Deep-Dive Criteria

For criteria like "All 15 endemic species individually documented":

```
CF-XX: [Subject] profile completeness
  Verifies: Each [item] has habitat, range, conservation status, and source
  Expected: All [N] items individually profiled
```

### Quantitative Data Criteria

For criteria like "Marine-derived nitrogen pathway traced with data":

```
CF-XX: [Metric] quantitative support
  Verifies: [Specific claim] backed by numerical data with citation
  Expected: At least [N] quantitative data points with sources
```

### Geographic/Temporal Criteria

For criteria like "Geographic gradient explicitly mapped":

```
CF-XX: [Dimension] coverage
  Verifies: Document addresses variation across [geographic/temporal range]
  Expected: At least [N] distinct zones/periods explicitly described
```

---

## Integration Test Patterns

Integration tests verify cross-module connections. Every research mission should have at least 3.

### Cascade Tests

```
IN-XX: [Module A] → [Module B] cascade
  Verifies: Document traces causal chain from [A finding] to [B consequence]
  Expected: At least one explicit cross-reference between modules
```

### Consistency Tests

```
IN-XX: Cross-module species/data consistency
  Verifies: Same entity referenced in multiple modules uses consistent data
  Expected: No contradictions in counts, names, or status between modules
```

### Self-Containment Tests

```
IN-XX: Document self-containment
  Verifies: A reader with no prior knowledge can understand the full ecosystem
  Expected: No undefined terms, no unexplained references, complete bibliography
```

---

## Edge Case Test Patterns

```
EC-XX: Minority/outlier data handling
  Verifies: Unusual cases (anomalous range, disputed taxonomy) noted
  Expected: Explicitly flagged with appropriate uncertainty language

EC-XX: Data gap acknowledgment
  Verifies: Areas of incomplete knowledge identified
  Expected: At least one "further research needed" or "data insufficient" note

EC-XX: Temporal currency
  Verifies: Most recent available data cited
  Expected: Primary sources published within last 10 years where available
```

---

## Verification Matrix Template

Map every success criterion to its test IDs:

```latex
\begin{tabularx}{\textwidth}{XL{3.5cm}C{1.5cm}}
\toprule
\rowcolor{primary}
\tableheader{Success Criterion} & \tableheader{Test ID(s)} & \tableheader{Status} \\
\midrule
1. [Criterion text] & CF-01, CF-02 & Pending \\
2. [Criterion text] & CF-03 & Pending \\
...
\bottomrule
\end{tabularx}
```

**Verification rule:** Every success criterion must map to at least one test. Any criterion without a test ID is a gap that must be filled.

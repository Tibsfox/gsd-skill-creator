# Passbook Guide — Your Wasteland Achievement Record

Your passbook is your chain of stamps — every piece of work you've done, reviewed by someone who cares about quality.

## What Is a Passbook?

Think of it like a passport, but for work:
- Each **stamp** is an entry recording a completed task
- Stamps have **dimensions** (quality, reliability, creativity)
- Your **aggregate score** tells the story of your work over time
- The passbook is **versioned** — every entry is in Dolt, auditable forever

## Reading Your Passbook

Query your stamp history:
```sql
SELECT
  s.id,
  s.author,
  s.valence,
  s.confidence,
  s.severity,
  s.created_at,
  c.wanted_id,
  w.title
FROM stamps s
JOIN completions c ON s.context_id = c.id
JOIN wanted w ON c.wanted_id = w.id
WHERE c.completed_by = 'YourHandle'
ORDER BY s.created_at DESC;
```

## Understanding Valence

Each stamp contains a **valence** — a multi-dimensional score:

```json
{
  "quality": 4,
  "reliability": 5,
  "creativity": 3
}
```

- **Quality (1-5):** How well the work meets requirements
- **Reliability (1-5):** Did you follow through, communicate, meet deadlines?
- **Creativity (1-5):** Did you bring something unexpected or novel?

## Aggregate Scores

Over time, your passbook tells a story:

| Pattern | What It Means |
|---------|---------------|
| High quality, high reliability | Dependable craftsperson |
| High creativity, moderate quality | Innovative explorer |
| Consistent across all dimensions | Balanced contributor |
| Improving over time | Active learner |

## Confidence and Severity

Stamps also carry:
- **Confidence (0-1):** How sure the validator is about the rating
- **Severity (info/warning/critical):** Context about the assessment

A high-confidence, info-severity stamp is the standard positive review.
A low-confidence stamp means the validator wasn't sure — take it as directional, not definitive.

## Building Your Passbook

1. **Do good work** — Quality stamps follow quality work
2. **Be reliable** — Follow through on claims, communicate delays
3. **Take creative risks** — Novel approaches earn creativity points
4. **Accept feedback** — Each stamp is a learning opportunity
5. **Review others** — Becoming a validator deepens your understanding

## The Circular Path

```
Newcomer → First completion → First stamp → More work → More stamps
  → Contributor → Review others → Maintainer → Guide newcomers → Steward
```

Your passbook grows with each cycle. There's no shortcut — and that's the point.

# MVR Protocol — Minimum Viable Reputation

The MVR protocol is how the Wasteland tracks trust. It's deliberately simple.

## The Three Signals

Every interaction in the Wasteland produces one of three signals:

1. **Completions** — You did work. A record in the `completions` table proves it.
2. **Stamps** — Someone reviewed your work. A record in the `stamps` table captures their assessment.
3. **Trust level** — Your accumulated reputation. A number (0-3) in the `rigs` table.

## Trust Levels

| Level | Name | How You Get There |
|-------|------|-------------------|
| 0 | Newcomer | Register as a rig |
| 1 | Contributor | Complete work, receive positive stamps |
| 2 | Maintainer | Consistent quality over time, endorsed by other maintainers |
| 3 | Steward | Community trust, governance role |

## The Completion Cycle

```
Claim → Work → Submit → Review → Stamp → Repeat
```

Each cycle adds to your reputation. Stamps are multi-dimensional:

- **Quality** — How well you did the work (1-5)
- **Reliability** — Did you follow through? (1-5)
- **Creativity** — Did you bring something new? (1-5)

## Why It Works

The protocol is minimum viable on purpose:
- No complex algorithms decide your trust
- Humans review and stamp — no black boxes
- Your record is in a versioned database — auditable forever
- Trust is earned, never assigned

## SQL Quick Reference

Check your completions:
```sql
SELECT * FROM completions WHERE completed_by = 'YourHandle';
```

Check your stamps:
```sql
SELECT s.* FROM stamps s
JOIN completions c ON s.context_id = c.id
WHERE c.completed_by = 'YourHandle';
```

Check your trust level:
```sql
SELECT handle, trust_level FROM rigs WHERE handle = 'YourHandle';
```

## What's Next

After your first stamp, you're a contributor. Keep going:
- Claim harder tasks
- Review others' work (once you reach level 1)
- Post your own wanted items
- Help newcomers find their way

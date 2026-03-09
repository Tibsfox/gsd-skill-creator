# Decommodification — Anti-Gamification

**Principle:** In order to preserve the spirit of gifting, our community seeks to create social environments that are unmediated by commercial sponsorships, transactions, or advertising. We stand ready to protect our culture from such exploitation.
**GSD Guideline:** Anti-Gamification
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

A forest does not keep score. No tree accumulates "growth points" on a leaderboard.
No mycorrhizal network charges a transaction fee for phosphorus transfer. The old
growth persists because it optimizes for stability and mutualism, not for competitive
metrics. Decommodification in the GSD ecosystem translates to a strict
Anti-Gamification policy: stamps cannot be traded, sold, or aggregated into
leaderboards. There are no vanity metrics.

Stamps exist solely as trust signals — evidence that a skill was executed and
validated. They are non-transferable, non-fungible, and non-comparable across rigs.
The system does not expose aggregate stamp counts, completion percentages, or any
ranking that would allow one rig to be measured against another. When a rig earns a
stamp, that stamp is recorded in its local trust ledger and nowhere else. There is no
global scoreboard, no "top contributors" list, no achievement badges beyond the
functional trust levels required for promotion.

This is enforced at the API level. Any endpoint that would expose comparative metrics
across rigs is architecturally forbidden. The stamp validator rejects any operation
that attempts to transfer, aggregate, or serialize stamps into a portable format.
The playa economy runs on gifting, not on currency — and stamps are not currency.

## Testable Behaviors

1. The stamp validator rejects any attempt to transfer a stamp from one rig to another, returning a `TRANSFER_FORBIDDEN` error.
2. No public API endpoint exists that returns comparative rankings, leaderboards, or aggregate stamp counts across multiple rigs.
3. Stamp records are stored exclusively in the issuing rig's local trust ledger and are not replicated to any shared index.
4. The discovery index does not sort or rank skills by popularity, download count, or usage frequency.
5. No UI component renders comparative metrics (percentages, rankings, streaks) derived from stamp data.

## Dependencies

- `gifting` — Unconditional sharing reinforces the non-transactional model
- `radical-self-expression` — Content policy is rig-local, preventing system-level curation that could imply ranking
- `leaving-no-trace` — Deprecated metrics are fully dereferenced, not archived for future gamification

## PNW Metaphor

Like the salmon that returns nutrients to the forest without invoice or ledger, the
stamp system feeds the ecosystem without creating debt. The river does not rank which
trees received the most carcass-derived nitrogen — it simply flows.

## SHOULD trigger

1. "This SKILL.md is 180 lines, cut it down to something tighter." — A shorten
   request on an existing skill body; the exact case where anchors get stripped
   for length. Fires.
2. "Refactor the gsd-executor agent .md — it's too verbose, trim the fluff." —
   Rewrite/compress of an agent body the agent loads and executes; must inventory
   guards and commands before cutting. Fires.
3. "We're over token-budget on the convoy skills, compress security-hygiene's
   body." — Compression under budget pressure on a safety-critical body; fires
   AND routes to escalation rather than auto-applying.

## SHOULD NOT trigger

4. "The triggers list in this SKILL.md is echoed and the description is 1200
   chars — fix the frontmatter." — Frontmatter-only defect; `skill-frontmatter-doctor`
   owns it, this skill is body-scoped. Skip.
5. "Add a new '## Fallback' section to this skill explaining the cold-start
   path." — Expansion, not shortening; no existing anchor is at removal risk.
   Skip.
6. "Sanitize this community skill from sc-learn before we load it." — STRANGER
   untrusted ingest; that is `skill-injection-guardian`'s static pass, not a
   cost-aware rewrite of a trusted body. Skip.

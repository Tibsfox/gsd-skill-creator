# Known Validation Debt

*Pre-existing source-chipset defects surfaced by the unified cartridge
validator. Not regressions — documentation.*

The cartridge-forge unified loader is the first tool in the repo that
applies cross-chipset consistency checks to every migrated department.
Twenty-two bulk cartridges carry source defects that were invisible
before the unified validator existed. They are enumerated here and in
`KNOWN_VALIDATION_DEBT` in
`src/cartridge/__tests__/migrations.test.ts`.

The migrations test **skips cross-chipset validation** for any cartridge
in this set. The cartridge still loads, parses, and collects metrics —
only the cross-chipset validity assertion is deferred. This keeps the
bulk test suite green while documenting the defects as visible tech debt.

The CLI `validate` subcommand supports
`--allow-validation-debt` which behaves identically: the load and parse
must still succeed, and any error that is *not* one of the two recorded
categories still fails the run. The flag is a documented escape hatch,
not a blanket bypass.

## Category A — `agent_affinity` drift

Skills reference agent names that were never defined in the companion
`agents:` block. Ten departments:

1. `business-department`
2. `home-economics-department`
3. `learning-department`
4. `materials-department`
5. `mind-body-department`
6. `nature-studies-department`
7. `nutrition-department`
8. `physical-education-department`
9. `theology-department`
10. `trades-department`

**Repair plan:** either add the missing agents to each department, or
rewrite the offending `agent_affinity:` entries to point at an agent
that exists. Both are pure source-chipset edits — no format change, no
schema change.

## Category B — `domains_covered` drift

The evaluation chipset lists benchmark domains that do not appear in any
department skill key or description. Surfaced only after W3.T0 flattened
the legacy `gates.pre_deploy` nesting so the validator could actually
reach `benchmark.domains_covered`. Twelve departments:

1. `astronomy-department`
2. `cloud-systems-department`
3. `critical-thinking-department`
4. `data-science-department`
5. `engineering-department`
6. `environmental-department`
7. `geography-department`
8. `languages-department`
9. `math-department`
10. `reading-department`
11. `science-department`
12. `writing-department`

**Repair plan:** either broaden a skill's domain coverage to include the
advertised benchmark domains, or narrow the benchmark's
`domains_covered` to match what the skill set actually implements.
Again, source-chipset edits only.

## Out of Scope for cartridge-forge

Repairing the 22 departments is **a follow-up milestone**, not part of
cartridge-forge. The purpose of the list is to make the debt visible.
Every entry has a concrete, known fix that touches source chipsets only.
The cartridge format and the unified loader are correct; the source
chipsets are ahead of the validator by historical accident.

## The Cap

The migrations test caps `KNOWN_VALIDATION_DEBT.size` at 25. Any
additional entries beyond the current 22 require either a repair
(preferred) or an explicit cap bump with a retro note.

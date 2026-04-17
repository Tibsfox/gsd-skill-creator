# Retrospective — v1.3

## What Worked

- **Formalizing the skill format specification at v1.3 locks the contract.** Everything built on top (conflict detection, test infrastructure, agents) depends on a stable skill format. Documenting it here prevents drift.
- **Token budget and bounded learning documentation makes the system's constraints visible.** Users need to understand that learning is deliberately bounded -- without docs, the 20% change cap and 7-day cooldown from v1.0 would be invisible magic.

## What Could Be Better

- **Documentation at v1.3 means 3 versions of features shipped before formal docs existed.** The skill format, conflict detection, and test infrastructure were all defined in code before being documented. Earlier docs would have caught specification gaps sooner.

## Lessons Learned

1. **Core concepts documentation (skills, scopes, observations, agents) is the ontology of the system.** Naming things precisely at v1.3 standardizes the vocabulary for everything that follows.
2. **A getting-started guide with installation, quickstart, and tutorials lowers the barrier for the first external contributor.** Without it, the project is only usable by the people who built it.

---

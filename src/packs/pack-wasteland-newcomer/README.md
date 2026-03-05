# Pack: wasteland-newcomer

"Find Your First Wasteland Win" — A 2-4 hour mission to claim and complete your first Wasteland task.

## Structure

- **PACK.json** — Complete pack specification (metadata, phases, roles, assessments, safe reversibility)
- **BRIEFING.md** — Human-readable overview for learners
- **RESOURCES/** — Supporting materials (protocols, guides)
- **LOGS/** — Learner progress tracking (auto-populated)

## For Learners

1. Read **BRIEFING.md** first
2. Follow phases in order (Phase 1 → Phase 6)
3. Answer checkpoint questions at each phase boundary
4. Track your progress in LOGS/ (auto-saved)
5. Exit gracefully if you need to (see "Exit Points" in each phase)

## For Validators/Maintainers

### Key Design Decisions

- **6 phases:** Setup → Browse → Claim → Work → Submit → Celebrate
- **Safe reversibility:** Exit points at every phase for learners who get stuck
- **Refuge point:** Sam (0.50, 0.50) is the center — safe place to retreat when overwhelmed
- **Passion alignment:** Designed for "completers" and "explorers"
- **Estimated duration:** 2-4 hours (flexible)

### Testing This Pack

Before rolling out to volunteers:

1. **Self-test:** Follow all 6 phases yourself
   - Do the commands work?
   - Are instructions clear?
   - How long does each phase actually take?

2. **Refine based on experience:**
   - Note confusing steps
   - Time each phase
   - Check if exit points make sense

3. **Test with 2-3 volunteers:**
   - Pick volunteers with different backgrounds (technical + non-technical)
   - Ask: "What was unclear? What took longer than expected?"
   - Iterate based on feedback

### Known Gaps (for future versions)

- [ ] Detailed troubleshooting guide for common Dolt errors
- [ ] Video walkthroughs of Dolt commands
- [ ] Integration with /wasteland CLI command (once built)
- [ ] Social learning component (pair with a buddy)
- [ ] Micro-packs for individual phases (30-min versions)

### Feedback Loop

Learners who complete this pack can post:
1. A reflection in #learning channel
2. Suggestions for improvement (post as a Wasteland wanted item!)
3. Their own follow-up pack ideas

## Metrics

This pack should track:
- **Completion rate** — How many learners finish all 6 phases?
- **Time-to-completion** — Actual vs. estimated duration
- **Exit points used** — Where do learners get stuck?
- **Satisfaction** — Post-completion survey
- **Stamp quality** — What ratings do completers receive from validators?

## Next Packs in Roadmap

After validating this pilot:
1. **Pack: Map Your Muse Team** (designers, explorers) — 3h
2. **Pack: Scout a Town** (explorers) — 2.5h
3. **Educational Pack: Understanding the Complex Plane** (all) — 1.5h
4. **Pack: Become a Validator** (maintainers) — 4h
5. **Pack: Materialize a Pattern** (completers, designers) — 3h

---

*Pack created: 2026-03-05*
*Pack version: 1.0.0 (Pilot)*
*Status: Ready for volunteer testing*

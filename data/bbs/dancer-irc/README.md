# Dancer IRC Bot -- Educational Text Corpus

## EDUCATIONAL TEXT CORPUS ONLY -- NOT FOR COMPILATION

This directory contains **annotated excerpts** from the Dancer 4.16 IRC bot
source code. These files are educational text -- they demonstrate IRC bot
architecture concepts through commented C code excerpts. They are **never
compiled, linked, or executed**.

## Source Attribution

- **Project:** Dancer 4.16
- **Repository:** https://github.com/bagder/dancer-416
- **License:** GPL (GNU General Public License)
- **Authors:** Bjorn Reese and Daniel Stenberg
- **Last release:** March 18, 2001

## Files

| File | Educational Purpose |
|------|-------------------|
| `dancer-main.c` | Main event loop: initialization, socket select() loop, signal handling |
| `parse-irc.c` | IRC message parsing: prefix extraction, command identification, parameter splitting |
| `flood-protection.c` | Flood protection algorithm: per-source rate limiting, penalty tracking |
| `command-dispatch.c` | Command dispatch table: function pointer mapping, privilege checking |

## Cross-References

These files are cross-referenced from Module 04 (IRC and Dancer) in
`src/bbs-pack/modules/04-irc-dancer/content.md`:

- `dancer-main.c` -- Topic 8: Dancer Bot Architecture
- `parse-irc.c` -- Topic 9: IRC Message Parsing in C
- `flood-protection.c` -- Topic 10: Flood Protection Algorithm
- `command-dispatch.c` -- Topic 11: Command Dispatch Pattern

Module 04's labs (Phase 521) will also reference these files for hands-on
IRC protocol parsing exercises.

## Important Notes

- These are **partial excerpts**, not complete source files
- They contain extensive educational annotations (comments)
- They **will not compile** even if attempted -- they are deliberately incomplete
- There is no Makefile, no build script, and no compilation instructions
- Do not add any build tooling to this directory

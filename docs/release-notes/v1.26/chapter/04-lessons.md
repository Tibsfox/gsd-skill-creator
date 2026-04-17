# Lessons — v1.26

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Scan gates at installation boundaries are the right security architecture.**
   Refusing to install unscanned packages and refusing infected ones means the security check is mandatory, not optional. The user override for suspicious (but not infected) packages preserves agency without compromising safety.
   _🤖 Status: `investigate` · lesson #136 · needs review_
   > LLM reasoning: SSH Agent Security is a different security concern than package scan gates at install boundaries.

2. **Aminet INDEX.gz parsing for ~84,000 entries proves the architecture handles scale.**
   Fixed-width column parsing with JSON cache and 24-hour staleness detection means the initial load is slow but subsequent access is fast. RECENT-based incremental updates avoid re-downloading the full index.
   _🤖 Status: `investigate` · lesson #137 · needs review_
   > LLM reasoning: Agent-Ready Static Site is unrelated to Aminet INDEX parsing or incremental caching.

3. **WHDLoad slave detection with per-game hardware overrides shows the depth of Amiga domain knowledge.**
   The 5 hardware profiles (A500 through WHDLoad) with priority-based auto-selection from .readme metadata mean most packages just work without manual configuration.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #138_

4. **Cloanto encrypted ROM support via cyclic XOR decryption.**
   Supporting both free (AROS) and commercial (Cloanto) ROMs means the system works for all users without requiring piracy. The CRC32 verification ensures ROM integrity regardless of source.
---
   _🤖 Status: `investigate` · lesson #139 · needs review_
   > LLM reasoning: Brainstorm Session Support has no connection to Cloanto ROM decryption.

5. **~23,616 LOC in one release is substantial.**
   The 7-phase, 91-commit scope covers INDEX parsing, downloading, searching, scanning, extraction, emulation, and desktop integration. This is effectively a complete package manager built in one milestone.
   _🤖 Status: `investigate` · lesson #140 · needs review_
   > LLM reasoning: Upstream Intelligence Pack does not directly address LOC scope of the package manager release.

6. **LhA/LZX extraction depends on external tools (lhasa, unlzx).**
   The tool validator with platform-specific install guidance mitigates this, but the system isn't fully self-contained for archive extraction the way it is for virus scanning.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #141_

# Retrospective — v1.26

## What Worked

- **Pure TypeScript virus scanner with 52 byte-pattern signatures.** No external antivirus dependency, no native binaries -- just pattern matching on boot blocks, hunk files, and link virus signatures. The 3-layer scan orchestrator (fast/standard/thorough) gives users control over the tradeoff between speed and completeness.
- **7-state package lifecycle with atomic persistence.** not-mirrored → downloading → mirrored → scan-pending → clean/infected → installed is a clear, auditable state machine. The write-then-rename atomic persistence pattern prevents corrupted state on crash.
- **Self-contained CRC32 ROM scanner without npm dependencies.** Building IEEE polynomial CRC32 from scratch instead of pulling in a package shows commitment to minimizing external dependencies, especially for security-sensitive code that validates ROM integrity.
- **Standalone pack compliance.** The entire Aminet system was built without modifying GSD core. 6 SKILL.md files, 5 agents, pipeline team, chipset YAML -- all self-contained. This validates the pack architecture's extensibility.

## What Could Be Better

- **~23,616 LOC in one release is substantial.** The 7-phase, 91-commit scope covers INDEX parsing, downloading, searching, scanning, extraction, emulation, and desktop integration. This is effectively a complete package manager built in one milestone.
- **LhA/LZX extraction depends on external tools (lhasa, unlzx).** The tool validator with platform-specific install guidance mitigates this, but the system isn't fully self-contained for archive extraction the way it is for virus scanning.

## Lessons Learned

1. **Scan gates at installation boundaries are the right security architecture.** Refusing to install unscanned packages and refusing infected ones means the security check is mandatory, not optional. The user override for suspicious (but not infected) packages preserves agency without compromising safety.
2. **Aminet INDEX.gz parsing for ~84,000 entries proves the architecture handles scale.** Fixed-width column parsing with JSON cache and 24-hour staleness detection means the initial load is slow but subsequent access is fast. RECENT-based incremental updates avoid re-downloading the full index.
3. **WHDLoad slave detection with per-game hardware overrides shows the depth of Amiga domain knowledge.** The 5 hardware profiles (A500 through WHDLoad) with priority-based auto-selection from .readme metadata mean most packages just work without manual configuration.
4. **Cloanto encrypted ROM support via cyclic XOR decryption.** Supporting both free (AROS) and commercial (Cloanto) ROMs means the system works for all users without requiring piracy. The CRC32 verification ensures ROM integrity regardless of source.

---

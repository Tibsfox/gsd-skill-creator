# Changelog

All notable changes to gsd-skill-creator are documented in this file.

## v1.0.0 - 2026-01-31

### Changed

- **Extension fields moved from root level to `metadata.extensions.gsd-skill-creator`**
  - *Rationale:* Keeps official Claude Code namespace clean
  - *Migration:* Auto-migrated on skill update, or run `skill-creator migrate`

- **Skills now use subdirectory format: `.claude/skills/{name}/SKILL.md`**
  - *Rationale:* Allows reference files and scripts alongside skill definition
  - *Migration:* Run `skill-creator migrate` to convert flat-file skills

- **Agent `tools` field now uses comma-separated string format**
  - *Rationale:* Matches official Claude Code agent specification
  - *Migration:* Run `skill-creator migrate-agent` to convert array format

### Added

- Reserved name validation prevents conflicts with built-in commands
- Character budget validation with warnings at 80% and 100%
- Description quality validation for better auto-activation
- User-level and project-level skill scopes
- Agent format validation with auto-correction

### Migration

Run these commands to migrate existing skills and agents:

```bash
# Migrate skill directory structure
skill-creator migrate

# Migrate agent tools field to string format
skill-creator migrate-agent
```

Metadata format auto-migrates on skill save (no command needed).

See [docs/EXTENSIONS.md](docs/EXTENSIONS.md) for detailed migration guide.

---

## v0.1.0 - 2026-01-30

### Added

- Initial release with core skill creation and management
- Session observation and pattern detection
- Skill suggestion based on recurring patterns
- Token budget management
- Feedback-driven skill refinement
- Agent composition from skill clusters

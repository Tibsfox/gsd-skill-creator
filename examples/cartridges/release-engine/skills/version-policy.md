# version-policy

Own semver policy for the project. Decides major / minor / subminor bumps, enforces subminor cadence (e.g. v1.49.N where N increments per release in a series), handles pre-release and build-metadata tags, and reconciles version across `package.json`, `Cargo.toml`, `tauri.conf.json`, and any other authoritative version files. Writes a VersionDecision record per bump with the semver rationale.

**Triggers:** `bump version`, `semver decision`, `version policy`, `subminor cadence`, `version drift`, `package version`, `tag version`

**Affinity:** `release-capcom`, `release-engineer`

# hotfix-and-patch

Ship an out-of-cadence hotfix for a shipped release. Branches from the last tag, applies the minimal fix, bumps the subminor (or adds a patch tag), and writes a HotfixRecord linked to the root-cause DebugSession (from the get-shit-done cartridge) and the affected ReleaseRecord. Skips the series cadence but still runs pre/post-ship verification.

**Triggers:** `hotfix`, `urgent patch`, `out of cadence`, `emergency release`, `patch release`, `rollback release`

**Affinity:** `release-capcom`, `release-engineer`, `release-verifier`

# release-verification

Pre-ship and post-ship verification for a release. Pre-ship checks: tests green, version drift resolved, changelog generated, release notes authored, artifacts built. Post-ship checks: tag visible on origin, GitHub release live, published artifacts reachable over HTTP, smoke test of key entry points. Writes a ReleaseVerification record into grove.

**Triggers:** `verify release`, `pre ship gate`, `post ship smoke`, `release smoke test`, `release gate`, `ship gate`

**Affinity:** `release-capcom`, `release-verifier`

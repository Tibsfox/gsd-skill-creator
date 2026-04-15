# release-publisher

Sonnet-class agent that drives the build-and-publish chain. Runs pandoc, sync-to-live, GitHub release creation, and the communications fan-out. Writes PublishArtifact and ReleaseCommunication records as it goes.

**Model:** `sonnet`
**Tools:** `Read`, `Write`, `Bash`, `Grep`, `Glob`

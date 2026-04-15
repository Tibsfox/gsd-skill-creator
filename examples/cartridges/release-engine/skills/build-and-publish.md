# build-and-publish

Execute the build-and-publish chain. Calls into the publish-pipeline (pandoc → HTML/PDF), packages any binary artifacts, uploads to the CDN / FTP target, cuts the GitHub release, and writes a PublishArtifact record per output with its content hash and distribution target. Proven on the 360 series daily cadence and on book releases like Thicc Splines Save Lives (v1.49.203).

**Triggers:** `build release`, `publish release`, `ftp sync`, `github release`, `pandoc build`, `release artifact`, `ship release`

**Affinity:** `release-capcom`, `release-publisher`

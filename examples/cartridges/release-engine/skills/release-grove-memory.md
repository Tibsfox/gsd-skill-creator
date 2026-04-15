# release-grove-memory

The core of this cartridge — operate the grove memory substrate for the release pipeline. Every other skill in the cartridge writes into this namespace, and this skill owns the query / link / diff / replay / export surface. A complete series (360 degrees, 720 missions, or a book-as-release) can be rehydrated from grove by walking the GroveActivityLog and reconstructing ReleaseSeries → SeriesCatalog → ReleaseRecord* → ReleaseRetrospective* → FlywheelDelta* in order. Cross-series links let the flywheel of one series feed into another.

**Triggers:** `release grove`, `grove release record`, `series replay`, `rehydrate series`, `release memory`, `release activity log`, `cross series link`

**Affinity:** `release-capcom`, `release-engineer`

# Retrospective — v1.49.103

## What Worked

- The seven-layer architecture (Syntax, Linking, Architecture, Transport, Storage, Display) provides a clear mental model that connects seemingly unrelated standards into a coherent pipeline
- Three parallel tracks (Markup+Linking, Data+Telemetry, Display+Storage) allow natural grouping by abstraction level
- Including NASA CCSDS telemetry alongside industrial protocols (MQTT, Modbus) reveals shared design patterns across radically different application domains

## What Could Be Better

- The WebAssembly rendering path and its impact on real-time display performance is an emerging area that deserves dedicated coverage
- GraphQL and gRPC as alternatives to REST in the data architecture layer could be explored more deeply

## Lessons Learned

- Every system that moves data from the world to a human mind passes through at least three layers: representation (giving data shape), linking (connecting representations), and display (collapsing time into a comprehensible now)
- The Bush/Nelson/Engelbart lineage of hyperlinking reveals that the web's `<a>` tag is a radical simplification of transclusion -- the link model we got is not the link model that was envisioned, and the gap still matters
- RRDtool's circular buffer architecture (fixed-size, automatic consolidation) remains the most elegant solution to the "infinite time-series, finite storage" problem, and modern TSDBs like Prometheus still borrow its core insight

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*

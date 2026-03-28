# v1.49.103 "The Meaning Lives Between the Nodes"

**Released:** 2026-03-28
**Code:** MDS
**Series:** PNW Research Series (#103 of 167)

## Summary

A seven-layer architecture study tracing the full path from SGML's atom to WebGL's pixel. This release adds the MDS research project -- a deep study of markup standards genealogy, hyperlinking and semantic deep-mapping, data-driven architectures, real-time display systems, telemetry protocols (including NASA CCSDS), and time-series databases. The through-line is a single design decision made seven times: put the meaning in the connection, not the container.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 6 |
| Total Lines | ~3,732 |
| Safety-Critical Tests | 6 |
| Parallel Tracks | 3 |
| Est. Tokens | ~83K |
| Color Theme | Syntax indigo / link cyan / layer slate |

### Research Modules

1. **M1: Markup Standards Genealogy** -- SGML (ISO 8879:1986) through HTML5 Living Standard, XML 1.0, XHTML, CSS cascade model, UML specification history, DTDs, XML Schema, RELAX NG
2. **M2: Hyperlinking & Semantic Deep-Mapping** -- Bush/Nelson/Engelbart lineage, HTML anchor mechanics, XLink 1.1 arc model, RDF triple format, SPARQL, OWL, knowledge graphs (DBpedia, Wikidata), JSON-LD
3. **M3: Data-Driven Architecture** -- MVC, CQRS/Event Sourcing, Lambda architecture (batch + speed), Kappa (stream-only), Data Mesh (domain ownership), Data Fabric (automated integration), RDF as universal data model
4. **M4: Real-Time Display Systems** -- SVG/Canvas/WebGL performance hierarchy (1K/10K/1M+ data points), WebSocket streaming, requestAnimationFrame, GPU buffer management, D3.js, deck.gl, ECharts
5. **M5: Telemetry Systems** -- CCSDS protocol stack (Space Packet, TM/AOS, Proximity-1), NASA ASIST/ITOS, industrial telemetry (SNMP, OPC-UA, MQTT, Modbus, DNP3), edge-to-cloud integration
6. **M6: Time-Series Databases** -- RRDtool circular buffer mechanics, DS types, consolidation functions, InfluxDB (TSM-Tree), Prometheus (pull/PromQL), TimescaleDB (PostgreSQL), QuestDB benchmarks

### Cross-References

- **SRD** -- VNC/RFB encoding registry connects to display systems pipeline
- **CMH** -- Creative media handling, display rendering layer overlap
- **TCP** -- Transport layer for WebSocket streaming and telemetry protocols
- **SYS** -- Systems administration, SNMP and OPC-UA monitoring integration
- **RFC** -- IETF standards authority for XML, XLink, RDF specifications

## Retrospective

### What Worked
- The seven-layer architecture (Syntax, Linking, Architecture, Transport, Storage, Display) provides a clear mental model that connects seemingly unrelated standards into a coherent pipeline
- Three parallel tracks (Markup+Linking, Data+Telemetry, Display+Storage) allow natural grouping by abstraction level
- Including NASA CCSDS telemetry alongside industrial protocols (MQTT, Modbus) reveals shared design patterns across radically different application domains

### What Could Be Better
- The WebAssembly rendering path and its impact on real-time display performance is an emerging area that deserves dedicated coverage
- GraphQL and gRPC as alternatives to REST in the data architecture layer could be explored more deeply

## Lessons Learned

- Every system that moves data from the world to a human mind passes through at least three layers: representation (giving data shape), linking (connecting representations), and display (collapsing time into a comprehensible now)
- The Bush/Nelson/Engelbart lineage of hyperlinking reveals that the web's `<a>` tag is a radical simplification of transclusion -- the link model we got is not the link model that was envisioned, and the gap still matters
- RRDtool's circular buffer architecture (fixed-size, automatic consolidation) remains the most elegant solution to the "infinite time-series, finite storage" problem, and modern TSDBs like Prometheus still borrow its core insight

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*

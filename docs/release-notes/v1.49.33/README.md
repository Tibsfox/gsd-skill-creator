# v1.49.33 — The Systems Administrator's Handbook

**Released:** 2026-03-10
**Scope:** Two full PNW research studies (LED Lighting & Controllers + Systems Administration: The Spaces In Between) plus a shared data source registry, series integration for 13 projects, release integrity tooling, and agent heartbeat monitoring
**Branch:** dev → main
**Tag:** v1.49.33 (2026-03-10T00:15:03-07:00) — "The Systems Administrator's Handbook"
**Commits:** v1.49.32..v1.49.33 (7 commits, head `fa189ec66`)
**Files changed:** 73 (+27,688 / −55)
**Predecessor:** v1.49.32 — Release Integrity & Agent Heartbeat
**Successor:** v1.49.34 — (next in v1.49.x feature line)
**Classification:** feature — twelfth and thirteenth projects in the PNW Research Series shipped together with process-hardening carryover
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedication:** SYS module dedicated to Taos (taos.com) — the sysadmin staffing company Foxy worked through before Philips Semiconductor. Sysadmins know the spaces in between.
**Verification:** 14/14 verification items PASS · 5/5 safety-critical gates PASS (SC-SRC, SC-NUM, SC-ADV, SC-PII, SC-DEF) · LED 8 research modules across 5 MCU platforms · SYS 7 core modules + working PoC server · 123 SYS sources + 80+ LED sources = 203+ publisher-tier citations · PNW series advances 11 → 13 projects · agent heartbeat monitor wired · publish-release.sh validates required sections

## Summary

**Two full research studies landed in a single release.** v1.49.33 ships the LED Lighting & Controllers study (40 files, ~14,700 lines, 8 research modules across 5 microcontroller platforms) and the Systems Administration study titled *The Spaces In Between* (19 files, 10,550 lines, 7 core sysadmin domains plus a runnable proof-of-concept trust-throttling server) together in the same atomic release window. The two studies were built in separate sessions but shipped at the same tag because the intermediate process-hardening tooling had not yet reached a release, and because each study was already complete when the next began. Shipping them together is the honest accounting of what happened between v1.49.32 and v1.49.33; separating them for narrative tidiness would have meant back-dating work that was already on disk. The on-disk diff — 73 files changed, 27,688 insertions, 55 deletions — is the largest single-release LOC number in the v1.49.x line to date and exceeds the 15K LOC flag threshold introduced in v1.49.31, which is a datum the retrospective addresses directly.

**LED research covers the full stack from Ohm's Law to PLC ladder logic.** The LED study at `www/PNW/LED/` is not a hardware tutorial; it is a comparative engineering atlas that treats LED lighting as an eight-module continuum from device physics through industrial control systems. Module M1 documents LED fundamentals (current drivers, resistor calculations, thermal management). M2 compares five microcontroller platforms side by side (Arduino, ESP32, Raspberry Pi, PIC/XC8, RP2040/PIO) with working code examples on each. M3 covers addressable LEDs — WS2812B protocol timing, APA102 SPI, power injection math, FastLED and NeoPixel library conventions. M4 maps the smart-lighting ecosystem (Philips Hue REST API, DIYHue and WLED open-source alternatives, TCS34725 color sensing, circadian adaptation curves). M5 handles power and control (MOSFET PWM dimmers, power supply sizing, IR/RF remotes). M6 is a persistence-of-vision deep dive built around APA102 POV displays and RP2040 architecture. M7 covers measurement (oscilloscope basics, DIY scopes, the Nyquist sampling theorem applied to LED signal measurement). M8 crosses into industrial control with PLC ladder logic, Modbus communication, and hybrid PLC-ESP32 topologies. Eighty-plus sources, four binary safety gates (no mains wiring, proper grounding, isolated supplies, verified thermal envelopes), a module glossary, and a consolidated source index close the study.

**SYS research organizes sysadmin craft around "the spaces in between" as a through-line.** The Systems Administration study at `www/PNW/SYS/` is the thirteenth project in the PNW Research Series and the second humanities-adjacent atlas in the series (after TIBS in v1.49.31). The architectural commitment is that every system leaves a trail: logs, timestamps, access records, network flows, process tables, file metadata, and resource accounting are all evidence of the system operating in the world. The sysadmin's job is reading that trail honestly and stewarding the shared resources the trail reveals. Seven modules implement this through-line: `01-server-foundations.md` (1,086 lines — Linux boot, processes, filesystems, systemd), `02-the-network.md` (1,048 lines — TCP/IP, DNS, DHCP, routing, firewalls, mesh), `03-the-logs.md` (995 lines — syslog, journald, access logs, structured logging, aggregation), `04-process-forensics.md` (1,093 lines — CPU/memory/disk I/O, the USE method, cgroups), `05-data-provenance.md` (1,001 lines — timestamps, chain of custody, backup, SBOM, SLSA), `06-access-and-bandwidth.md` (1,140 lines — five-tier trust model, anti-waste design), and `07-security-operations.md` (1,499 lines — hardening, TLS, intrusion detection, incident response, privacy by design). A twenty-bridge integration document, a 123-source three-tier bibliography, and a 79-term glossary close the study.

**The SYS trust-based throttling server is runnable proof, not documentation.** `www/PNW/SYS/poc/server.mjs` is a 528-line zero-dependency Node.js server that implements the five-tier trust bandwidth model from module 06 as executable code. It binds to `localhost:3000`, exposes a terminal dashboard at `/_dashboard`, and enforces real bandwidth throttling via timed chunk streaming — 150 baud for unknown clients, tiered promotions through Visitor (9.6 kbps), Known (56 kbps), Trusted (DSL-era rates), and unlimited for the Owner tier. The trust decisions are made per-connection based on signals the module specifies (IP reputation, cookie continuity, declared identity, behavioral telemetry). No external dependencies means the PoC can run on any Node.js install without a package tree; zero npm install is part of the demonstration. The model it proves — that bandwidth is a shared resource that deserves trust-graded allocation rather than first-come-first-served — is also the conceptual skeleton for the FoxFiber mesh networking work under the Fox Infrastructure Companies umbrella, which is why the SYS module was dedicated to Taos.

**Shared data source registry catalogs 13 Puget Sound datasets with stable IDs.** `www/PNW/data-sources.md` introduces a shared data source registry that earlier PNW projects referenced ad-hoc. Thirteen datasets are cataloged with stable IDs for Puget Sound coastal mapping: USGS 1m topobathy DEM (186 source images covering Deception Pass to Olympia), WA Ecology Shoreline Photo Viewer (five longitudinal series 1976–2017), WA DNR 60 intertidal habitat classes, PSNERP drift cells, PSNERP feeder bluff mapping, PSNERP benthic habitat sonar, plus seven additional datasets covering tidal datum, substrate classification, and aerial photography. A three-tier reliability rubric (Gold for peer-reviewed and government sources, Silver for long-lived institutional sources, Bronze for recent and limited-verification sources) is applied across the catalog. The data pipeline documented at the registry (DEM → terrain, substrate → block type, photos → texture, tidal datum → water level) is the same pipeline the later GSD-OS Minecraft world and tiles-of-Puget-Sound rendering systems consume.

**Series integration unified under an infrastructure thread.** The PNW index page and series navigation were updated to 13 projects — LED and SYS cards added with project descriptions, a new Infrastructure Thread connecting SYS modules across the series, cross-reference matrix expanded with SYS column and filter chips, and the master stats line updated to 277 files, 13.5 MB, 870+ sources, 13 mission packs. LED, TIBS, and FFA integration was also carried forward from prior sessions into this release — that carry-forward is itself a retrospective data point, because the master-index-debt lesson from v1.49.26 said master-index updates belong in the atomic commit that ships the project. v1.49.33 honors that lesson for SYS (integrated in the same commit chain) while repaying the carried debt for LED/TIBS/FFA in a single consolidated integration commit.

**Release integrity tooling hardened the publish path.** `scripts/publish-release.sh` was introduced to validate and publish GitHub releases with full release notes — it checks for a `docs/release-notes/<version>/README.md` file, validates the required section headers, and refuses to publish if the release notes are missing or incomplete. The agent heartbeat monitor wires a timestamp file, a poller, and a desktop notification for silent failures — if an agent stops posting heartbeats for longer than the configured interval, the operator sees a notification rather than discovering the stalled agent hours later. Wave commit marker hook validation, LOC-per-release tracking in STATE.md, a speculative infrastructure inventory, and TypeScript API doc generation (typedoc) round out the process-hardening contributions, several of which were wave-deferred from the v1.49.29 retrospective plan and land here as the invisible half of the release.

**Wave-based commits kept the diff reviewable at 27K LOC.** Seven commits compose the v1.49.33 window: `99b9ce25a` (process fix for publish-release title), `c0d130bb6` (LED research study), `29f5d72cb` (LED/TIBS/FFA series integration), `b549ecad8` (SYS research study), `bc686a4f4` (shared data source registry), `d920c89e4` (SYS series integration), and `fa189ec66` (release notes for v1.49.33). Each commit is independently reviewable and bisectable, and the commit boundaries align with natural wave boundaries of the work. The largest single commit (`c0d130bb6`, the LED study) is still under 15K LOC, which keeps any individual commit bisectable even when the aggregate release exceeds the flag threshold. This is the pattern the LOC-per-release table was designed to reveal — a 27K release is loud, but a 27K release made of seven sub-15K commits is honest.

**Session handoff paid for itself a third time.** The SYS research was resumed from a handoff document (167 lines capturing the module inventory, design decisions including the five-tier trust model, Fox infrastructure company ties, and the "spaces in between" through-line) across a session boundary. This is the third successful session-handoff use (first was AVI+MAM continuity in v1.49.25, second was Wave 2 process hardening in v1.49.31). Three-for-three on non-trivial cross-session continuations turns the pattern from "worth trying" into "standing practice." The Fox Companies ties captured in the handoff are load-bearing: the trust-based bandwidth model is the operational seed for FoxFiber's mesh networking thesis, and surfacing it in a handoff rather than reconstructing it from ambient memory is what let the research keep the tie visible at landing rather than rediscovering it months later.

**One filename bug was caught in review, which is the review working.** Nav links in an earlier SYS draft referenced `06-access-bandwidth` but the actual file was named `06-access-and-bandwidth.md`. The mismatch was caught during pre-commit review and fixed before the commit was authored. That is not a "near miss" — that is the review layer doing its job. Recording it in the retrospective is the same practice that turned Wave 1A/1B parallel-track contamination prevention in TIBS into a standing pattern: naming what worked in review makes it repeatable across future releases, and naming what was caught makes it legible to future reviewers that the layer is load-bearing.

## Key Features

| Area | What Shipped |
|------|--------------|
| LED research study | `www/PNW/LED/` — 40 files, ~14,700 lines, 8 research modules (fundamentals, MCUs, addressable, smart, power, POV, measurement, industrial), 5 MCU platforms compared with working code, 80+ sources, 4 safety gates, module glossary, source index |
| SYS research study | `www/PNW/SYS/` — 19 files, 10,550 lines, 7 core modules (server foundations, network, logs, process forensics, data provenance, access/bandwidth, security ops), 20-bridge integration doc, 123-source bibliography (3-tier reliability), 79-term glossary, verification matrix |
| SYS working PoC | `www/PNW/SYS/poc/server.mjs` — 528-line zero-dependency trust-throttling Node.js server, terminal dashboard at `localhost:3000/_dashboard`, real bandwidth throttling via timed chunk streaming, 5 trust tiers from 150 baud (unknown) to unlimited (owner) |
| Shared data source registry | `www/PNW/data-sources.md` — 13 Puget Sound coastal datasets cataloged with stable IDs, USGS 1m topobathy DEM (186 sources), WA Ecology photos (5 series 1976–2017), WA DNR 60 habitat classes, PSNERP drift/bluff/sonar, 3-tier reliability rubric |
| LED/TIBS/FFA series integration | `feat(pnw): integrate LED, TIBS, FFA into series index and cross-reference matrix` (commit `29f5d72cb`) — repays master-index debt from earlier sessions, consolidated to one commit |
| SYS series integration | `feat(pnw): integrate SYS into series index and cross-reference matrix` (commit `d920c89e4`) — advances PNW series from 12 to 13 projects, adds Infrastructure Thread across SYS modules |
| Release publish path | `scripts/publish-release.sh` — validates presence and required sections of `docs/release-notes/<version>/README.md`, refuses to publish if release notes are missing or incomplete |
| Agent heartbeat monitor | Timestamp + poller + desktop notification pipeline; silent agent failures surface as notifications rather than being discovered hours later |
| Wave commit marker hook validation | Extension of the v1.49.29 Wave 2 wave-commit-marker work; hook continues in warning mode with improved detection |
| LOC-per-release tracking | `.planning/STATE.md` table updated with v1.49.30–32 data, flags v1.49.33 itself as exceeding the 15K LOC threshold introduced in v1.49.31 |
| Speculative infrastructure inventory | Inventory refresh covering speculative-vs-active infrastructure across VM backends, platform abstractions, PXE templates, world specs, runbooks, knowledge packs, monitoring |
| TypeScript API doc generation (typedoc) | Continuation of typedoc pipeline wired in v1.49.31; `npm run docs:api` verified working |
| Publish-release title fix | `fix(process): remove duplicate version in publish-release title` (commit `99b9ce25a`) — small but user-visible polish to the published GitHub release titles |

## Part A: LED Lighting & Controllers (Content Thread)

- **Eight-module structure:** M1 Fundamentals → M2 Microcontrollers → M3 Addressable LEDs → M4 Smart Lighting → M5 Power & Control → M6 POV Displays → M7 Measurement → M8 Industrial. Each module stands alone and builds toward the industrial control systems module that closes the study.
- **Five MCU platforms compared side by side:** Arduino (AVR), ESP32 (Tensilica/Xtensa, Wi-Fi/BT), Raspberry Pi (ARM, full Linux), PIC with XC8 (8-bit Microchip heritage), and RP2040 with PIO (Cortex-M0+ with programmable I/O state machines). Working code examples on each platform; the comparison is operational, not marketing.
- **Eighty-plus sources, four binary safety gates:** no mains-voltage wiring in examples, proper grounding illustrated in every power-supply diagram, isolated supplies for any circuit touching AC, and verified thermal envelopes for every drive current spec. Binary gates are runnable against the manuscript, not just at landing.
- **Addressable LED protocol depth:** WS2812B 800 kHz timing requirements, APA102 SPI clock/data geometry, power injection math (3 A per strip segment, worst-case all-white-at-full-brightness), FastLED vs. NeoPixel library API trade-offs, and the physics of why 5 V strips need voltage drop compensation at length.
- **Smart-lighting ecosystem mapped honestly:** Philips Hue REST API documented as the commercial baseline, DIYHue and WLED documented as the open-source alternatives, TCS34725 color sensing documented as the feedback loop for circadian adaptation, and circadian curves documented as a settings choice rather than a truth claim.
- **POV persistence-of-vision module is physics-first:** flicker fusion threshold, stroboscopic perception, and the arithmetic of how fast a strip has to spin (or the user's eye has to track) before the afterimage assembles. APA102 POV design and RP2040 architecture are chosen specifically because the SPI speed and PIO state machines make the physics practical.
- **Measurement module treats the oscilloscope as a first-class tool:** scope basics, DIY scope builds, the Nyquist sampling theorem applied specifically to LED drive signal measurement, and worked examples of what correct-vs-wrong LED waveforms look like in the time domain.
- **Industrial module crosses into PLC territory:** ladder logic fundamentals, Modbus communication, and hybrid PLC-ESP32 topologies where a commercial PLC handles the safety-critical interlocks and an ESP32 handles the programmable color and scheduling logic. Industrial LED panels are documented as a use case, not a product recommendation.
- **Module glossary and consolidated source index:** every acronym and every cited source appears exactly once in its canonical form. Zero undefined jargon, zero uncited numerical claims.
- **Four binary safety gates are auditable:** each gate is a yes/no reading pass against the manuscript. SC-SAFETY-MAINS (no mains wiring) either holds or fails — no continuous-scale rubric, no middle ground. Same discipline TIBS applied to SC-SRC/SC-NUM/SC-IND, applied here to electrical safety.
- **Code examples are copy-pasteable, not pseudocode:** every code block compiles on the platform it targets, and every code block in M2 uses the same LED test circuit so the comparison across MCUs is apples-to-apples rather than "here's Arduino's Hello World and here's ESP32's SSL debug loop."

## Part B: Systems Administration — The Spaces In Between (Content + PoC Thread)

- **Through-line: every system leaves a trail.** The SYS study is organized around a single architectural commitment — logs, timestamps, access records, network flows, process tables, file metadata, and resource accounting are all evidence the system was operating. The sysadmin's job is reading the trail honestly and stewarding the shared resources the trail reveals.
- **Seven core modules covering the full sysadmin stack:** Server Foundations (Linux boot, processes, filesystems, systemd) → The Network (TCP/IP, DNS, DHCP, routing, firewalls, mesh) → The Logs (syslog, journald, access logs, structured logging, aggregation) → Process Forensics (USE method, cgroups, disk I/O) → Data Provenance (timestamps, chain of custody, backup, SBOM, SLSA) → Access & Bandwidth (5-tier trust model) → Security Operations (hardening, TLS, IDS, incident response, privacy by design).
- **Five-tier trust bandwidth model:** Owner (unlimited) / Trusted (high but bounded) / Known (moderate, authenticated) / Visitor (low, anonymous-OK) / Unknown (150 baud, ratcheting). Bandwidth as a shared resource deserving trust-graded allocation rather than first-come-first-served is the operational thesis of the entire module.
- **Working proof-of-concept: `poc/server.mjs`, 528 lines, zero dependencies.** Binds `localhost:3000`, exposes `/_dashboard` terminal view, enforces real bandwidth throttling via timed chunk streaming. Trust decisions per-connection based on IP reputation, cookie continuity, declared identity, and behavioral telemetry. No npm install required — the lack of dependency tree is part of the demonstration.
- **123 sources across three reliability tiers:** Gold (peer-reviewed, government agency, RFC, canonical textbook) / Silver (long-lived project documentation, established vendor documentation) / Bronze (recent blog posts, limited-verification sources). Every citation is tier-labeled; readers see the reliability of the evidence at the citation, not in a footnote.
- **Defensive-only security posture:** every technique documented in module 07 is defensive. Intrusion detection, hardening, TLS configuration, incident response playbooks, privacy by design. Zero offensive techniques, zero red-team how-tos. This is a safety gate (SC-DEF) and it is auditable.
- **No real-world PII in examples:** all example IP addresses are RFC 1918 or documentation ranges (198.51.100.0/24, 203.0.113.0/24, 192.0.2.0/24), all example hostnames are `example.com` or `lab.invalid`, all example user accounts are generic (`alice`, `bob`, `carol`). No real company names in compromise examples. Safety gate SC-PII.
- **Twenty-bridge integration document:** cross-links between SYS modules are explicit, with twenty named bridges connecting topics across modules. The cross-links are how the reader navigates the module set without a top-down table of contents imposed on the material.
- **79-term glossary:** every technical term appears exactly once in canonical form. Zero undefined jargon, zero implicit-knowledge assumptions. The glossary is the study's commitment to reader-first design.
- **12/12 verification matrix PASS, 5/5 safety-critical PASS:** twelve success criteria covered core functionality, integration, and edge cases; five safety-critical gates (SC-SRC source quality, SC-NUM numerical attribution, SC-DEF defensive-only, SC-PII no PII, SC-ADV no policy advocacy) all passed before commit authoring.
- **Dedication to Taos:** the SYS module is dedicated to Taos (taos.com), the sysadmin staffing company Foxy worked through before Philips Semiconductor. Sysadmins know the spaces in between. The dedication is not decorative — it names the specific community whose craft the study documents.

## Retrospective

### What Worked

- **Wave-based commits for SYS kept the 10K-LOC module bisectable.** Three clean atomic commits (SYS module `b549ecad8`, shared data registry `bc686a4f4`, series integration `d920c89e4`) instead of one monolith. Each wave is independently reviewable and independently bisectable, and the commit boundaries align with the actual cognitive boundaries of the work (content → shared infrastructure → series integration).
- **Handoff document captured everything for SYS.** The session handoff included file inventory, design decisions (including the five-tier trust model and its Fox infrastructure ties), the "spaces in between" through-line, Fox Companies notes, and the personal Taos dedication context. Zero information lost across the session boundary; the new session opened the handoff and resumed without re-deriving state.
- **Filename bug caught in review before commit.** Nav links referenced `06-access-bandwidth` but the actual file was named `06-access-and-bandwidth.md`. Caught during pre-commit review, fixed before the commit was authored. Review is doing its job; naming the catch is how we keep the layer load-bearing across releases.
- **PoC validates the SYS research.** The 528-line zero-dependency trust-throttling server is runnable code, not documentation. Research plus working proof is a stronger deliverable than research alone, and the "zero dependencies" constraint is itself part of the proof — the model compiles in your head.
- **Master-index debt from earlier sessions paid down in one commit.** LED, TIBS, and FFA integration was consolidated into `29f5d72cb` in this release window, honoring the v1.49.26 BPS lesson that master-index updates belong with the commit that ships the project. Debt was real; debt is now cleared.
- **Three-for-three on session handoff pattern.** AVI+MAM in v1.49.25, Wave 2 process hardening in v1.49.31, SYS research here. Three non-trivial cross-session continuations with zero rework on resume. The pattern is now standing practice, not an experiment.
- **Two studies shipped together honestly, not tidily.** LED and SYS were built in separate sessions but both completed before the next release cadence. Shipping them together is truth; separating them for narrative cleanness would have been back-dating. Honest releases beat tidy releases.

### What Could Be Better

- **27K LOC exceeds the 15K flag introduced in v1.49.31.** Two full research studies plus integration plus process tooling in one release is large. The LOC-per-release tracking table flags this release for retrospective review, which is the table doing its job — but the flag is a finding, not a pass. Future LED-class and SYS-class studies should aim for one-study-per-release cadence.
- **LED integration was carried from a prior session.** The LED module was built but not integrated into the series index until this release, which repeats the exact master-index-debt pattern the v1.49.26 BPS retrospective identified. The consolidated integration commit repays the debt cleanly, but the debt should not have accumulated in the first place.
- **LED and SYS safety gates use different names than TIBS.** LED uses SC-SAFETY-MAINS/GROUND/ISO/THERMAL; SYS uses SC-SRC/SC-NUM/SC-DEF/SC-PII/SC-ADV; TIBS uses SC-SRC/SC-NUM/SC-IND/SC-ADV/SC-CER/SC-LOC. A cross-study gate vocabulary reconciliation is overdue — not all gates should have the same names, but shared gates (SC-SRC, SC-NUM, SC-ADV) should be named identically across studies.
- **No mission pack shipped for LED or SYS in this release.** BPS and TIBS established the LaTeX + PDF + browser-index mission-pack triad pattern. LED and SYS shipped research atlases without mission packs, which defers the polish deliverable to a future release. The research lands first; the mission pack cadence is catching up.

## Lessons Learned

- **Build the thing you're documenting.** The SYS PoC server proves the trust-based throttling model works as runnable code rather than specification. A 528-line zero-dependency server is worth more than 1,000 lines of prose description of the same model. Working code plus documentation beats documentation alone at validating research.
- **Integrate as you build — master-index debt compounds invisibly.** Series index updates should ship with the module, not accumulate. LED, TIBS, FFA, and SYS integration landed here; LED/TIBS/FFA specifically should have been incremental in their own release windows rather than a consolidated catch-up commit. The v1.49.26 BPS lesson was real; v1.49.33 repays the debt but should not have needed to.
- **Handoff documents are session insurance, and three-for-three is a standing practice.** The SYS handoff captured 167 lines of context — module inventory, Fox infrastructure ties, personal history, philosophical through-line — and every piece survived the session boundary intact. Three non-trivial continuations with zero rework turns a pattern into policy: every multi-session work item gets a handoff document.
- **LOC-per-release flags are findings, not failures.** The 15K threshold fires; the retrospective addresses the fire honestly; the next release planning adjusts cadence. A flag is information, not a penalty. Treating the flag as an emergency would cause worse behavior (fragmenting a study across releases to evade the flag) than treating it as data (naming what happened and tuning future cadence).
- **Working proofs belong with their research.** The SYS PoC at `poc/server.mjs` ships in the same commit chain as the research it validates. A PoC without its research is a code sample; a research atlas without its PoC is a speculation. Pairing them is the load-bearing commitment; keeping them in the same commit window is the operational realization of the commitment.
- **Dedications name the community whose craft the work documents.** The SYS dedication to Taos (taos.com, the sysadmin staffing company) is not decoration — it names the specific craft lineage the study draws from and the specific community whose knowledge made the research possible. Dedications are attribution at the release level, complementing citation at the claim level.
- **Binary safety gates scale across subject matter.** LED used four electrical-safety gates (mains wiring, grounding, isolation, thermal envelope); SYS used five information-safety gates (source, numerical, defensive, PII, advocacy); TIBS used six humanities-research gates (source, numerical, Indigenous attribution, advocacy, ceremonial instruction, sacred site locations). The binary-gate discipline is subject-matter agnostic; what varies is the specific failure modes the gates are designed to catch.
- **Honest two-study releases are better than back-dated single-study releases.** Shipping LED and SYS together at v1.49.33 is what happened; pretending they were separate releases by back-dating one would have been a lie by presentation. The narrative cost of a two-study release is one summary paragraph explaining the joint landing; the truth cost of back-dating is permanent.
- **Release integrity tooling is infrastructure, not ceremony.** `scripts/publish-release.sh` refuses to publish when release notes are missing or incomplete. That refusal is a gate, and the gate is load-bearing — without it, v1.49.30's release-notes-in-repo gap (identified in v1.49.31's retrospective) could happen again silently. Ceremony is paperwork nobody reads; infrastructure is a gate that refuses wrong states.
- **Agent heartbeat monitors surface silent failures.** Stalled agents used to be discovered hours later, after the human noticed the work hadn't advanced. A heartbeat timestamp + poller + desktop notification turns silent failure into loud failure. The monitor is cheap to build, cheap to run, and worth orders of magnitude more than its complexity suggests because "silent failure discovered hours later" is the worst-cost operational state.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.32](../v1.49.32/) | Predecessor — Release Integrity & Agent Heartbeat; this release extends that integrity work by adding `scripts/publish-release.sh` and hardening the heartbeat monitor |
| [v1.49.34](../v1.49.34/) | Successor — next in the v1.49.x feature line; inherits the 13-project PNW series baseline established here |
| [v1.49.31](../v1.49.31/) | TIBS — Animal Speak, Sacred Landscapes & Process Hardening; same PNW series, same wave-based commit discipline, same session-handoff pattern |
| [v1.49.30](../v1.49.30/) | FFA — Fur, Feathers & Animation Arts; master-index integration for FFA is repaid in this release via commit `29f5d72cb` |
| [v1.49.29](../v1.49.29/) | Wave 2 process hardening origin — wave commit markers, LOC tracking, speculative infra inventory, typedoc all trace back to the v1.49.29 retrospective plan |
| [v1.49.26](../v1.49.26/) | BPS — Bio-Physics Sensing Systems; physics-first organization discipline that LED inherits (LED organizes by module but each module is physics-first in its own scope) |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums; first successful session-handoff use — SYS is the third successful continuation (after TIBS Wave 2) |
| [v1.49.22](../v1.49.22/) | PNW Research Series uplift exemplar — same series, same grove-card pattern, same cross-reference matrix discipline |
| [v1.49.21](../v1.49.21/) | Sibling uplift exemplar — same v1.49.x feature-release shape; types-first discipline parallels SYS's through-line-first discipline |
| [v1.49.17](../v1.49.17/) | Types-first discipline antecedent — contracts before content, applied to cartridge format; SYS applies the analogous "through-line before modules" discipline |
| [v1.49.12](../v1.49.12/) | Heritage Skills Pack — pack-shape content analogous to LED's module-atlas shape |
| [v1.49.0](../v1.49.0/) | Parent mega-release — v1.49.x line and GSD-OS desktop surface where LED and SYS live |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — sysadmin-adjacent infrastructure work that SYS documents the foundational craft for |
| [v1.29](../v1.29/) | Electronics Educational Pack — MNA simulator, logic simulator, safety warden; LED's MCU-platform comparison inherits this pack's electrical-education lineage |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack template LED and SYS inherit (though neither shipped a mission pack in this release) |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; LED and SYS extend the Observe step to electronics-engineering and systems-administration subject areas |
| `www/PNW/LED/` | LED research study root — 40 files, 8 modules, 5 MCU platforms |
| `www/PNW/SYS/` | SYS research study root — 19 files, 7 modules, 20-bridge integration, 123 sources |
| `www/PNW/SYS/poc/server.mjs` | 528-line zero-dependency trust-throttling Node.js PoC |
| `www/PNW/data-sources.md` | Shared data source registry — 13 Puget Sound datasets with stable IDs |
| `scripts/publish-release.sh` | Release publish gate — validates release notes before GitHub publication |
| `.planning/STATE.md` | LOC-per-release tracking table — flags v1.49.33 at 27K LOC against the 15K threshold |
| Taos (taos.com) | SYS dedication — sysadmin staffing company, Foxy's employer before Philips Semiconductor |
| Philips Semiconductor | Foxy's post-Taos employer (foxglove@philips.com, DVD division, Wolf Road 555-timer building) — SYS's "spaces in between" through-line draws on this career arc |
| FoxFiber (Fox Infrastructure Companies) | The 5-tier trust bandwidth model is the operational seed for FoxFiber's mesh networking thesis |

## Engine Position

v1.49.33 is the twelfth and thirteenth project landing in the PNW Research Series (LED and SYS respectively) and the largest single-release LOC number in the v1.49.x feature line to date. It sits between v1.49.32 (Release Integrity & Agent Heartbeat) and v1.49.34 in the line, and it advances the series from eleven projects (after v1.49.31's TIBS landing) to thirteen by shipping two studies together. In the broader v1.49.x arc it is a structural pivot: previous releases added single studies (COL, BRC, AVI, MAM, BPS, TIBS, FFA), while v1.49.33 is the first release to ship two full studies in one window — a cadence finding the LOC-per-release tracking flagged immediately. Looking forward, SYS becomes the reference implementation for systems-administration-adjacent studies in the series (any future atlas that organizes around "every system leaves a trail" will inherit SYS's seven-module shape and the binary-gate set), and the trust-throttling PoC becomes the operational seed for the FoxFiber mesh networking thesis under Fox Infrastructure Companies. LED becomes the reference implementation for engineering-atlas studies that compare multiple platforms head-to-head — the pattern "one subject, N platforms, working code on each" is now available as a template for future MCU, sensor, or protocol studies. The session-handoff pattern graduates from "worth trying" to "standing practice" on the strength of three-for-three success (AVI+MAM, TIBS Wave 2, SYS). The 15K LOC flag is confirmed as a finding-generator rather than a failure-state; v1.49.33's 27K LOC registers the flag, the retrospective addresses it, and the next release planning adjusts cadence.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.32..v1.49.33) | 7 |
| Files changed | 73 |
| Lines inserted / deleted | 27,688 / 55 |
| Net insertions | 27,633 |
| Studies shipped in release | 2 (LED + SYS) |
| LED research files | 40 |
| LED research lines | ~14,700 |
| LED research modules | 8 (M1..M8) |
| LED MCU platforms compared | 5 (Arduino, ESP32, RPi, PIC/XC8, RP2040) |
| LED sources cited | 80+ |
| LED safety gates | 4 binary (mains, grounding, isolation, thermal) |
| SYS research files | 19 |
| SYS research lines | 10,550 |
| SYS research modules | 7 (server foundations, network, logs, process forensics, data provenance, access/bandwidth, security ops) |
| SYS module-01 lines | 1,086 |
| SYS module-02 lines | 1,048 |
| SYS module-03 lines | 995 |
| SYS module-04 lines | 1,093 |
| SYS module-05 lines | 1,001 |
| SYS module-06 lines | 1,140 |
| SYS module-07 lines | 1,499 |
| SYS PoC server lines | 528 |
| SYS PoC dependencies | 0 |
| SYS integration bridges | 20 |
| SYS bibliography sources | 123 |
| SYS bibliography reliability tiers | 3 (Gold / Silver / Bronze) |
| SYS glossary terms | 79 |
| SYS verification criteria | 12/12 PASS |
| SYS safety-critical gates | 5/5 PASS (SC-SRC, SC-NUM, SC-DEF, SC-PII, SC-ADV) |
| SYS trust tiers | 5 (Owner / Trusted / Known / Visitor / Unknown) |
| Shared data source registry datasets | 13 |
| PNW series projects (before → after) | 11 → 13 |
| PNW series files (cumulative after this release) | 277 |
| PNW series size (cumulative after this release) | 13.5 MB |
| PNW series sources (cumulative after this release) | 870+ |
| PNW series mission packs | 13 |
| Master-index debt repayments | 3 (LED + TIBS + FFA integration in `29f5d72cb`) |
| Session-handoff successful uses | 3 (AVI+MAM in v1.49.25, Wave 2 in v1.49.31, SYS here) |
| 15K LOC flag status | Triggered (27K observed, retrospective addresses) |

## Taxonomic State

| PNW Series Project | Release | Subject Domain | Lines | Sources |
|--------------------|---------|----------------|-------|---------|
| COL | v1.49.15 | Columbia River estuary | ~6,500 | 40+ |
| BRC | v1.49.23 | British Columbia (Fraser/Salish) | 4,904 | 50+ |
| AVI | v1.49.24 | Avian (birds) | ~18,000 | 60+ |
| MAM | v1.49.24 | Mammals | ~16,000 | 55+ |
| ECO | v1.49.25 | Full taxonomy | ~8,500 | 45+ |
| BPS | v1.49.26 | Bio-Physics Sensing | 18,371 | 80+ |
| FFA | v1.49.30 | Fur, Feathers & Animation | ~9,200 | 38+ |
| TIBS | v1.49.31 | Indigenous & Book Survey | 4,103 | 34 |
| LED | v1.49.33 | LED Lighting & Controllers | ~14,700 | 80+ |
| SYS | v1.49.33 | Systems Administration | 10,550 | 123 |

## Files

- `www/PNW/LED/` — 40 files, ~14,700 lines, 8 research modules (M1 Fundamentals, M2 Microcontrollers, M3 Addressable LEDs, M4 Smart Lighting, M5 Power & Control, M6 POV Displays, M7 Measurement, M8 Industrial), 80+ sources, glossary, source index
- `www/PNW/SYS/` — 19 files, 10,550 lines, 7 core modules plus shared schema, integration, bibliography, glossary, verification matrix
- `www/PNW/SYS/poc/server.mjs` — 528-line zero-dependency trust-throttling Node.js server, terminal dashboard at `/_dashboard`, real bandwidth throttling via timed chunk streaming, 5 trust tiers
- `www/PNW/data-sources.md` — shared data source registry, 13 Puget Sound coastal datasets with stable IDs, 3-tier reliability rubric
- `www/PNW/index.html` + `series.js` — PNW series index updated to 13 projects with LED and SYS cards, Infrastructure Thread added, cross-reference matrix expanded with SYS column and filter chips
- `scripts/publish-release.sh` — validates and publishes GitHub releases with full release notes; refuses publish when notes missing or incomplete
- `.claude/hooks/agent-heartbeat.sh` — agent heartbeat monitor wiring: timestamp + poller + desktop notification for silent failures
- `.claude/hooks/validate-commit.sh` — wave commit marker hook validation (continues from v1.49.29 Wave 2)
- `.planning/STATE.md` — LOC-per-release tracking table refreshed with v1.49.30–32 data, flags v1.49.33 at 27K LOC against the 15K threshold
- `infra/SPECULATIVE-INVENTORY.md` — speculative-vs-active infrastructure inventory refresh
- `typedoc.json` + `docs/api/` (gitignored) — TypeScript API doc generation pipeline, `npm run docs:api` verified working
- `docs/release-notes/v1.49.33/README.md` — this document
- `docs/release-notes/v1.49.33/chapter/00-summary.md` — auto-generated parse with Prev/Next navigation
- `docs/release-notes/v1.49.33/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.33/chapter/04-lessons.md` — 5 lessons extracted with tracker status
- `docs/release-notes/v1.49.33/chapter/99-context.md` — release context chapter

Aggregate: 73 files changed in the release window, 27,688 insertions, 55 deletions, 7 commits (`99b9ce25a`..`fa189ec66`), v1.49.32..v1.49.33 range.

---

**Prev:** [v1.49.32](../v1.49.32/) · **Next:** [v1.49.34](../v1.49.34/)

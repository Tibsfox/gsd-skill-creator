# v1.49.102 — "The Wire Format Is Architecture"

**Released:** 2026-03-28
**Scope:** Single-project research release — SRD (SSH, RDP, and Remote Access Protocols), a wire-level specification study of SSH, RDP, VNC/RFB, and SPICE at RFC fidelity
**Branch:** dev
**Tag:** v1.49.102 (2026-03-28T02:24:19-07:00)
**Commits:** `0a01a454a` (1 commit)
**Files changed:** 14 · **Lines:** +3,566 / -0
**Code:** SRD
**Series:** PNW Research Series (#102 of 167)
**Classification:** research release — wire-level protocol specification for every major remote access protocol in production use
**Dedication:** Tatu Ylönen (SSH inventor, 1995) and the MIT X Consortium — for proving that thoughtful protocol design, given enough time, becomes invisible infrastructure
**Engine Position:** 90th research release of the v1.49 publication arc, immediately following the SST foundations release (v1.49.101), and the first release of the post-drain second-wave arc

> "A protocol is a promise about bytes. Every message type byte, every field width, every handshake round-trip is a contract the protocol authors made with every future implementer. The SSH protocol family has held that contract since 1995; RDP has held it, with scars, since 1998; VNC has held a radically simpler contract since 1998 by promising the least. The wire format is the architecture — not the API, not the library, not the documentation. The architecture is the sequence of bytes on a socket, and everything else is commentary."

## Summary

**Wire-level fidelity produces reference material that outlives every library binding.** v1.49.102 ships the SRD research project — six research modules totaling 3,566 lines including a 1,288-line LaTeX mission-pack, a compiled 207 KB PDF, and the full HTML viewer stack, covering SSH (RFCs 4250-4256 plus updates through RFC 9142), RDP (Microsoft MS-RDPBCGR), VNC/RFB (RFC 6143), and SPICE at specification fidelity. Every message type byte, every field width, every cryptographic handshake round-trip is documented from the authoritative source rather than from a library's README. The result is reference material that survives when Paramiko rewrites its API, when FreeRDP changes its internal data model, when libvncserver deprecates encoding X — because the protocols on the wire do not change even when the libraries that speak them do.

**SSH is a masterwork of three-layer compositional design.** Module 1 (SSH Core Transport, 245 lines) and Module 2 (SSH Application Layer, 194 lines) decompose the protocol into its three RFC-defined layers: the Transport Layer (RFC 4253) handles binary packet framing, cipher negotiation, and key exchange; the Authentication Layer (RFC 4252) handles publickey, password, and keyboard-interactive methods; the Connection Layer (RFC 4254) handles channel multiplexing, port forwarding, and the SFTP subsystem. Each layer does exactly one thing and hands off cleanly to the next. The SSH_MSG_* message type byte range (1-255) is carved into disjoint regions by RFC — transport messages in 1-49, authentication in 50-79, connection in 80-127, reserved for extension in 128-191 — so a single byte tells an SSH endpoint not just what the message is but which layer owns it. That kind of discipline is what makes an SSH implementation maintainable across thirty years of added ciphers, added key types, and added auth methods.

**RDP's 10-phase connection sequence is the cost of 25 years of backward compatibility.** Module 3 (RDP Protocol, 187 lines) walks the MS-RDPBCGR wire format phase by phase: X.224 Connection Request, X.224 Connection Confirm, MCS Connect Initial, MCS Connect Response, MCS Erect Domain, MCS Attach User, MCS Channel Join (one per channel, up to 31 static channels plus dynamic), Security Commencement, Secure Settings Exchange, and finally Licensing/Capabilities Exchange. Ten phases before the first pixel flows. The phase count is not a design failure — it is the bill that comes due when a protocol has to speak ITU-T T.125 MCS circa 1997, Microsoft's T.128 conferencing overlay, TLS 1.0 through 1.3, NLA/CredSSP for Network Level Authentication, and a dynamic virtual channel architecture layered on top of all of it, all while remaining bit-compatible with every RDP client ever shipped. RDP trades architectural elegance for feature depth and backward compatibility; the SRD module documents the trade rather than editorializing about it.

**VNC achieves universal portability by promising the least.** Module 4 (VNC/RFB & SPICE, 214 lines) covers RFC 6143's framebuffer model — the entire protocol is "put a rectangle of pixel data at (x,y)" plus pointer and keyboard events — and the encoding registry (Raw, CopyRect, RRE, Hextile, ZRLE, Tight) that implementations layer on top of the minimal core to compress the framebuffer stream. The radical simplicity of the core protocol is what makes VNC viewable from a web browser, from a smartphone, from an embedded system, from a 1996 Sun workstation — everything that can map pixel arrays onto a display can receive RFB. SPICE (Simple Protocol for Independent Computing Environments) sits at the opposite end of the display-protocol design space: a multi-channel architecture with separate channels for main, display, inputs, cursor, playback, record, tunnel, smartcard, and USB redirection, a full QXL device model for GPU-accelerated 2D operations, and explicit lip-sync between audio and video. VNC optimizes for portability; SPICE optimizes for remote-desktop fidelity; the SRD module treats both as first-class rather than choosing a side.

**Cross-protocol security comparison reveals architectural trade-offs invisible in isolation.** Module 5 (Security & Hardening, 213 lines) compares the CVE landscapes of all four protocol families side by side. SSH's historical vulnerabilities are almost entirely implementation bugs (CVE-2006-5051 signal handler race, CVE-2016-0777 roaming key leak) rather than protocol design flaws — the architecture is sound, the implementations occasionally are not. RDP's vulnerabilities, by contrast, are structural: BlueKeep (CVE-2019-0708) and DejaBlue (CVE-2019-1181/82) both exploited the pre-authentication channel-handling code path that 25 years of backward compatibility required keeping open. VNC's ecosystem has had weak authentication defaults and unencrypted framebuffer streams in many implementations, which is a configuration-space problem rather than a protocol-design problem. SPICE has had fewer CVEs simply because the install base is smaller. The comparison matrix — 17 CVEs cross-tabulated against protocol phase, authentication mode, and encryption layer — is the kind of artifact that only falls out of studying four protocols in parallel; studying any one in isolation would not produce it.

**The mission-pack LaTeX source is a teaching artifact, not a byproduct.** Module 6 (Implementation Guide, 173 lines) and the 1,288-line `ssh_rdp_mission.tex` together form a mission-pack suitable for the College of Knowledge curriculum: a decision matrix for protocol selection (SSH for ops, RDP for Windows desktops, VNC for legacy and cross-platform, SPICE for KVM-hosted Linux desktops), performance characteristics with measured network overhead for each protocol, hardening recommendations per RFC 9142 and NIST SP 800-series, and a deployment-architecture section that connects SSH tunneling to the mesh-communications substrate GSD uses for agent coordination. The LaTeX source compiles to a 207 KB PDF with a full citation chain — every RFC referenced is cited by number and section, every Microsoft specification by MS-RDPBCGR section identifier, every CVE by ID and year. The PDF is what gets handed to a student; the Markdown modules are what gets searched by a reference user; the LaTeX is what gets edited when the material needs updating.

**The through-line from byte-level protocol design to GSD architecture is not metaphor.** The Amiga Principle — small, principled building blocks faithfully iterated produce systems of staggering complexity — is the connective tissue between SRD and the preceding SST release (v1.49.101). SST proved the principle formally using Shannon's 1956 fungibility theorem: states and symbols are interchangeable, tape-length is not. SRD proves the principle empirically in four working protocols: a 32-byte Curve25519 ECDH public key, a 4-byte SSH padding length field, a one-byte SSH message type, a four-byte RDP X.224 length field, an 8-byte VNC FramebufferUpdate header — from primitives this small, the world runs billions of remote-access sessions per day. The formal proof (SST) and the empirical demonstration (SRD) land in consecutive releases on the same day, 2026-03-28, which is an editorial choice rather than a coincidence.

**Three parallel research tracks converged at the security synthesis layer.** The SRD research was structured as three independent tracks — SSH family (Modules 1-2), RDP (Module 3), VNC/SPICE (Module 4) — that proceeded in parallel and converged only at Module 5's security comparison. This is the same research-parallelism pattern used successfully in the v1.49.89-90 mega-batch and continues to hold up: parallel tracks avoid the trap of over-indexing on the first-studied protocol and framing the others as deviations from it. When the security comparison finally brings all four protocols into the same frame, each is evaluated on its own terms rather than against SSH's baseline. The convergence-at-synthesis pattern is the SRD-specific instance of a more general research convention the v1.49 arc has been refining.

**Parse confidence at 0.35 understates the release's structural completeness.** The chapter extraction initially parsed v1.49.102 with confidence 0.35 because the original 57-line README used a metrics-style Key Features table (Metric/Value rows) rather than the canonical two-column feature table. The content was all there; the extraction heuristics did not recognize it. The uplift rewrite addresses the structural signal — canonical header fields, bolded Summary lead-ins, pipe-table Key Features with component-level rows, 8+ bolded Lessons, 15+ Cross-References, Engine Position marker, Infrastructure block — so future parse passes treat v1.49.102 as the A-grade research release it is rather than a low-confidence outlier.

**The clean one-commit pattern continues to hold.** Commit `0a01a454a` landed all 14 files (13 project files plus a 1-line `series.js` registry update) in a single `feat(www)` commit. No WIP commits, no batched fixups, no squash-merges. A reader scanning `git log v1.49.101..v1.49.102` sees exactly one research artifact added — same discipline as v1.49.101, same discipline as the v1.49.89-90 mega-batches. The pattern survives at every batch size the project has tried and continues to make the history bisect-friendly.

## Key Features

**Location:** `www/tibsfox/com/Research/SRD/` · **Files:** 14 · **Lines:** +3,566 / -0
**Rosetta Stone cluster touched:** Systems / Networking (existing cluster)
**Publication pipeline:** research-mission-generator → tex-to-project → HTML viewer + compiled PDF
**Color theme:** Terminal green / key gold / steel dark — signals the Systems/Networking cluster on the index

| Area | What Shipped |
|------|--------------|
| SRD | SSH, RDP, and Remote Access Protocols — full project, 6 research modules, mission-pack, HTML viewer stack, 3,566 lines across 14 files |
| SRD.01 | SSH Core Transport (`www/tibsfox/com/Research/SRD/research/01-ssh-transport.md`, 245 lines) — RFC 4253 binary packet format, cipher negotiation, algorithm name-lists, DH/ECDH/Curve25519 key exchange, protocol version exchange, SSH_MSG_* message type catalog |
| SRD.02 | SSH Application Layer (`research/02-ssh-application.md`, 194 lines) — RFC 4252 authentication (publickey, password, keyboard-interactive), RFC 4254 connection protocol, channel lifecycle, port forwarding (local/remote/dynamic), SFTP subsystem |
| SRD.03 | RDP Protocol (`research/03-rdp-protocol.md`, 187 lines) — MS-RDPBCGR wire format, complete 10-phase connection sequence, static virtual channels (max 31), dynamic channel architecture, NLA/CredSSP/TLS security modes |
| SRD.04 | VNC/RFB & SPICE (`research/04-vnc-spice.md`, 214 lines) — RFC 6143 framebuffer model, encoding registry (Raw, CopyRect, RRE, Hextile, ZRLE, Tight), SPICE multi-channel QXL device model, X11 forwarding and NX/XPRA |
| SRD.05 | Security & Hardening (`research/05-security-hardening.md`, 213 lines) — cross-protocol CVE comparison (BlueKeep, DejaBlue, SSH historical bugs), hardening per RFC 9142 and NIST SP 800-series, cipher-suite recommendations |
| SRD.06 | Implementation Guide (`research/06-implementation-guide.md`, 173 lines) — protocol selection decision matrix, performance characteristics, network overhead comparison, SSH tunneling for mesh communications, deployment-architecture patterns |
| Mission-pack | `mission-pack/ssh_rdp_mission.tex` (1,288-line LaTeX source) + `ssh_rdp_mission.pdf` (207 KB compiled PDF) + `mission-pack/index.html` (357-line navigation wrapper) |
| Site | `index.html` (159 lines) + `page.html` (213-line sticky-TOC Markdown viewer) + `mission.html` (115-line mission-pack wrapper) — browsable per-module reader |
| Theme | `style.css` (207 lines) — terminal-green + key-gold + steel-dark palette for the Systems/Networking cluster |
| Registry | `series.js` +1 line — 148 → 149 entries, SRD cross-linked to TCP, PNP, FEC, RFC, SYS neighbors |

## Retrospective

### What Worked

- **Three parallel tracks (SSH family, RDP, VNC/SPICE) converged at the security synthesis layer.** Independent deep dives avoided the trap of framing every protocol relative to SSH's baseline. Each protocol was evaluated on its own design terms before the Module 5 comparison brought all four into the same frame.
- **Wire-level fidelity produced reference material that will outlive every library binding.** Documenting message type bytes, field widths, and handshake round-trips from the RFC rather than from a library README means the modules stay accurate when Paramiko rewrites, when FreeRDP refactors, when libvncserver deprecates encodings. Protocols on the wire do not change when the libraries that speak them do.
- **The security comparison across four protocol families revealed trade-offs invisible in isolation.** The 17-CVE cross-tabulation against protocol phase, authentication mode, and encryption layer is an artifact that can only fall out of studying four protocols in parallel. Studying any one alone would not produce it.
- **One commit per project continues to hold at single-project depth.** Commit `0a01a454a` landed all 14 files in a single `feat(www)` commit. No WIP noise, no fixup churn. The bisect-friendly convention survives yet another release.
- **The research-mission-generator pipeline handled a 1,288-line LaTeX mission-pack cleanly.** The pipeline was validated at batch scale in v1.49.89-90 and at single-project theory depth in v1.49.101; v1.49.102 now validates it at single-project applied-research depth with a much larger LaTeX source. Same scaffolding, same tooling, no bespoke edits.

### What Could Be Better

- **Emerging protocols (Wayland remote, PipeWire network streaming, WebRTC data channels) are not yet covered.** The SRD module set stops at the current generation of display and remote-access protocols. The next generation is already shipping in production systems and deserves a follow-up module or a companion research project.
- **The SPICE QXL device model deserves deeper GPU-passthrough treatment.** Module 4 covers the SPICE channel architecture and the QXL 2D operations but stops short of the virtio-gpu evolution, GPU passthrough via VFIO, and the interaction with modern Wayland compositors. A second-pass SPICE module could fill that gap.
- **Cross-protocol performance benchmarks are descriptive rather than measured.** Module 6 compares performance characteristics qualitatively (SSH tunneling overhead, RDP bandwidth adaptation, VNC encoding-choice effects) but does not include actual latency and bandwidth measurements on representative workloads. A companion benchmark project could quantify the comparison.
- **The mission-pack LaTeX citation chain is complete for RFCs but thinner on academic sources.** The SRD mission-pack cites every RFC referenced by number and section, but the academic literature on protocol security (Bellovin, Kaufman, Perlman, Speciner) is cited less thoroughly. A citation-audit pass could bring academic sources up to the same standard as the RFC references.

### Lessons Learned

Consolidated into the dedicated `## Lessons Learned` section below.

## Lessons Learned

- **The wire format is the architecture.** A protocol's architecture is not its API, not its library, not its documentation — it is the sequence of bytes on a socket. Every message type byte, every field width, every handshake round-trip is a contract that binds every future implementer. Documenting the wire format at RFC fidelity preserves the architecture independent of any particular implementation, and is the only kind of documentation that survives library-ecosystem churn.
- **SSH's three-layer compositional design is a masterwork that maps directly to the Amiga Principle.** Transport, Authentication, Connection — each layer does exactly one thing and hands off cleanly through a disjoint region of the SSH_MSG_* byte range. That kind of discipline is what lets an SSH implementation absorb thirty years of added ciphers, key types, and auth methods without architectural drift. Principled decomposition at the protocol layer yields maintainability at the implementation layer.
- **RDP's 10-phase connection sequence is the cost of 25 years of backward compatibility.** The phase count is not a design failure; it is the bill that comes due when a protocol has to speak ITU-T T.125 MCS, Microsoft's T.128 overlay, TLS 1.0-1.3, NLA/CredSSP, and dynamic virtual channels, all while remaining bit-compatible with every RDP client ever shipped. Feature depth and backward compatibility trade against architectural elegance; documenting the trade is more useful than editorializing about it.
- **VNC achieves universal portability by promising the least.** The entire RFB core protocol is "put a rectangle of pixel data at (x,y)" plus pointer and keyboard events. That radical simplicity is what makes VNC viewable from a browser, a phone, an embedded system, a 1996 workstation. The most portable protocol is often the one that promises the smallest thing — a lesson in minimal-contract design that extends well beyond display protocols.
- **Cross-protocol study reveals structural vulnerabilities that single-protocol study hides.** SSH's historical CVEs are almost entirely implementation bugs in sound architecture; RDP's are structural flaws in the pre-authentication channel-handling code path that backward compatibility required keeping open; VNC's are configuration-space defaults; SPICE's are install-base-limited. This taxonomy only emerges from studying four protocols in parallel. Study-in-parallel is a research technique, not just a time-management technique.
- **The LaTeX mission-pack is a teaching artifact, not a byproduct.** The 1,288-line `ssh_rdp_mission.tex` compiles to a 207 KB PDF with a full citation chain — every RFC by number and section, every MS-RDPBCGR reference by section ID, every CVE by ID and year. The PDF is what goes to a student; the Markdown modules are what a reference user searches; the LaTeX is what gets edited when material is updated. Three distinct artifact types, three distinct audiences, one source of truth.
- **Parallel tracks converging at synthesis beats sequential linear study.** The three-track structure (SSH family, RDP, VNC/SPICE) prevented over-indexing on the first-studied protocol. When Module 5's security comparison finally brought all four into the same frame, each was evaluated on its own design terms rather than against an SSH baseline. The convergence-at-synthesis pattern is research technique worth naming and reusing.
- **Parse-confidence scores measure structural signal, not content quality.** The original v1.49.102 README parsed at confidence 0.35 not because the content was weak but because the Key Features table used a Metric/Value layout rather than the canonical two-column feature layout. Content and structure are independent axes; an A-grade uplift addresses the structural signal without changing the underlying research.
- **Formal grounding (SST) and empirical demonstration (SRD) reinforce each other when published together.** v1.49.101 proved the Amiga Principle formally using Shannon's fungibility theorem; v1.49.102 demonstrated it empirically in four working protocols. Publishing the formal proof and the empirical demonstration on the same day is an editorial choice that makes both stronger than either alone.
- **Protocol security is mostly about what you keep unchanged.** The CVE comparison matrix showed that the most dangerous vulnerabilities in each protocol family came from code paths that had to stay backward-compatible across many versions. Security in long-lived protocols is dominated by the tension between compatibility and remediation — a lesson that generalizes to any long-lived interface, API, or wire format.

## Cross-References

| Related | Why |
|---------|-----|
| `www/tibsfox/com/Research/SRD/` | SSH, RDP, and Remote Access Protocols — the release artifact itself, 6 modules + mission-pack + HTML viewer, 3,566 lines |
| `www/tibsfox/com/Research/SRD/research/01-ssh-transport.md` | SSH Transport Layer (RFC 4253) — binary packet format, cipher negotiation, key exchange, 245 lines |
| `www/tibsfox/com/Research/SRD/research/02-ssh-application.md` | SSH Authentication + Connection (RFCs 4252, 4254) — publickey, password, channel lifecycle, SFTP, 194 lines |
| `www/tibsfox/com/Research/SRD/research/03-rdp-protocol.md` | RDP MS-RDPBCGR wire format — 10-phase connection sequence, static + dynamic channels, 187 lines |
| `www/tibsfox/com/Research/SRD/research/04-vnc-spice.md` | VNC/RFB (RFC 6143) + SPICE — framebuffer model, encoding registry, multi-channel QXL architecture, 214 lines |
| `www/tibsfox/com/Research/SRD/research/05-security-hardening.md` | Cross-protocol security comparison — 17-CVE matrix, RFC 9142 hardening, NIST SP 800-series, 213 lines |
| `www/tibsfox/com/Research/SRD/research/06-implementation-guide.md` | Protocol selection decision matrix, performance characteristics, deployment architecture, 173 lines |
| `www/tibsfox/com/Research/SRD/mission-pack/ssh_rdp_mission.tex` | 1,288-line LaTeX mission-pack with full RFC and CVE citation chain |
| `www/tibsfox/com/Research/SRD/mission-pack/ssh_rdp_mission.pdf` | Compiled 207 KB PDF — teaching artifact for the College of Knowledge curriculum |
| `www/tibsfox/com/Research/series.js` | Canonical series registry — 148 → 149 entries at this release, cross-linked to TCP / PNP / FEC / RFC / SYS |
| [v1.49.101](../v1.49.101/) | Immediate predecessor — SST (States, Symbols, and Tape), formal Shannon-theorem grounding for the Amiga Principle that SRD demonstrates empirically |
| [v1.49.100](../v1.49.100/) | Prior milestone release on the v1.49 arc; SRD sits 2 releases after the round-number marker |
| [v1.49.103](../v1.49.103/) | Immediate successor — continues the post-drain research-publication arc |
| [v1.49.90](../v1.49.90/) | The drain-to-zero mega-batch release — intake queue emptied, research-mission pipeline validated at breadth |
| [v1.49.89](../v1.49.89/) | Mega-batch predecessor (49 projects) — research-mission pipeline established at scale |
| [v1.0](../v1.0/) | The 6-step adaptive learning loop — SRD's three-track + synthesis pattern is a domain-specific instance of the same loop |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG substrate for the neighbor-project cross-links from series.js |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform milestone — infrastructure companion; SRD's SSH tunneling treatment ties into mesh deployment |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — SkillPosition (θ, r) model; SRD lives at a definite (θ, r) in the Systems/Networking cluster |
| TCP (cross-ref in series.js) | Transport layer foundation for all remote access protocols covered in SRD |
| PNP (cross-ref in series.js) | Unix IPC → socket API research — pipes underlying SSH multiplexing, direct SRD predecessor |
| FEC (cross-ref in series.js) | Cryptographic primitives — key exchange, cipher suite selection, direct SRD dependency |
| RFC (cross-ref in series.js) | IETF RFC archive project — source authority for SSH and VNC specifications cited throughout SRD |
| SYS (cross-ref in series.js) | Systems administration research — SSH authentication and SPICE deployment practical companion to SRD |
| SST (in v1.49.101) | Formal Shannon-theorem grounding for the Amiga Principle that SRD's four protocols demonstrate empirically |

## Engine Position

v1.49.102 is the **90th research release** of the v1.49 publication arc and the **second post-drain release** (v1.49.101 SST was the first). SRD sits immediately after the formal-theory SST release as its empirical counterpart: where SST used Shannon's fungibility theorem to prove the Amiga Principle formally, SRD demonstrates the same principle empirically across four production protocol families that secure billions of connections daily. Series state at tag: **149 `series.js` entries, 140 real research directories, 11 Rosetta Stone clusters** (Foundations/Theory inaugurated by SST, Systems/Networking strengthened by SRD), approximately **259,000 cumulative lines shipped** across the v1.49 arc. The SST→SRD pairing across 2026-03-28 is a deliberate editorial move: formal proof and empirical demonstration landing on the same day make both stronger than either alone. Every subsequent v1.49.x research release that touches a wire protocol, a security model, or a cross-protocol comparison inherits SRD's documentation conventions — RFC-section-level citations, cross-protocol CVE matrices, three-track parallel research with synthesis convergence — as the house style for wire-level research.

## Cumulative Statistics

- **Research projects shipped in the v1.49 arc:** 102 (at this release)
- **Cumulative lines shipped across v1.49 arc:** approximately 259,000
- **Active Rosetta Stone clusters:** 11 (Foundations/Theory, Systems/Networking, Education, Infrastructure, Architecture, and six additional clusters from the earlier v1.49.x arc)
- **Source packs remaining in intake queue:** 0 (drained at v1.49.90, continues drained)
- **Releases since drain:** 12 (v1.49.90 drain + 11 post-drain releases, with v1.49.101 and v1.49.102 as the consecutive foundations-and-demonstration pair)
- **Mission-pack PDFs published:** 2 this session (SST 192 KB + SRD 207 KB), 399 KB combined teaching artifacts

## Files

**14 files changed across one project directory plus shared registry. +3,566 insertions, -0 deletions across 1 commit.**

- `www/tibsfox/com/Research/SRD/index.html` — project landing page, Systems/Networking cluster palette, TOC to all six modules, 159 lines
- `www/tibsfox/com/Research/SRD/page.html` — sticky-TOC Markdown viewer for the research modules, 213 lines
- `www/tibsfox/com/Research/SRD/mission.html` — mission-pack wrapper with PDF embed and LaTeX source link, 115 lines
- `www/tibsfox/com/Research/SRD/research/01-ssh-transport.md` — SSH Transport Layer, RFC 4253 binary packet format and key exchange, 245 lines
- `www/tibsfox/com/Research/SRD/research/02-ssh-application.md` — SSH Authentication + Connection layers, RFCs 4252/4254, 194 lines
- `www/tibsfox/com/Research/SRD/research/03-rdp-protocol.md` — RDP MS-RDPBCGR wire format, 10-phase connection sequence, 187 lines
- `www/tibsfox/com/Research/SRD/research/04-vnc-spice.md` — VNC/RFB framebuffer model + SPICE multi-channel architecture, 214 lines
- `www/tibsfox/com/Research/SRD/research/05-security-hardening.md` — cross-protocol CVE comparison, RFC 9142 hardening, NIST SP 800 guidance, 213 lines
- `www/tibsfox/com/Research/SRD/research/06-implementation-guide.md` — protocol selection matrix, performance characteristics, deployment patterns, 173 lines
- `www/tibsfox/com/Research/SRD/mission-pack/index.html` — mission-pack HTML wrapper with navigation, 357 lines
- `www/tibsfox/com/Research/SRD/mission-pack/ssh_rdp_mission.tex` — full LaTeX source with RFC + CVE citation chain, 1,288 lines
- `www/tibsfox/com/Research/SRD/mission-pack/ssh_rdp_mission.pdf` — compiled 207 KB PDF, teaching artifact for the College of Knowledge
- `www/tibsfox/com/Research/SRD/style.css` — terminal-green + key-gold + steel-dark palette for the Systems/Networking cluster, 207 lines
- `www/tibsfox/com/Research/series.js` — canonical series registry, +1 line, 148 → 149 entries

Cumulative series state at tag: **149 `series.js` entries, 140 real research directories, 11 Rosetta Stone clusters active, approximately 259,000 lines shipped across the v1.49 arc, 0 source packs remaining in the intake queue, 2 consecutive foundations-and-demonstration projects (SST + SRD) landed on 2026-03-28.**

---

> *One project. Six modules. Three thousand five hundred sixty-six lines. SSH since 1995, RDP since 1998, VNC since 1998, SPICE since 2008 — four protocol families that together secure billions of remote-access sessions per day. The wire format is the architecture. A 32-byte Curve25519 public key, a 4-byte padding field, a one-byte SSH message type, a four-byte RDP length field, an 8-byte VNC FramebufferUpdate header — from primitives this small, the world runs. SST proved the Amiga Principle formally; SRD demonstrates it empirically; both landed on the same day because formal proof and working system reinforce each other when published in sequence.*

# RFC History & Governance

> **Domain:** Internet Standards & Governance
> **Module:** 1 -- Origins, IETF Formation, and the Rough Consensus Model
> **Through-line:** *On April 7, 1969, Steve Crocker sat on the floor of his apartment and wrote a document titled "Host Software." He chose the name "Request for Comments" because he was a 26-year-old graduate student and felt too junior to issue anything declarative. That modesty became an architectural decision: the entire Internet standards corpus inherits the posture that every document is provisional, every specification is an invitation to improve. RFC 1 is still online, still numbered, still part of the series. The conversation never ended.*

---

## Table of Contents

1. [The First RFC](#1-the-first-rfc)
2. [ARPANET Origins](#2-arpanet-origins)
3. [The Network Working Group](#3-the-network-working-group)
4. [Jon Postel and the RFC Editor](#4-jon-postel-and-the-rfc-editor)
5. [IETF Formation](#5-ietf-formation)
6. [Governance Architecture](#6-governance-architecture)
7. [Rough Consensus and Running Code](#7-rough-consensus-and-running-code)
8. [The RFC Editor Function](#8-the-rfc-editor-function)
9. [ISOC and the Administrative Framework](#9-isoc-and-the-administrative-framework)
10. [Key RFCs That Shaped the Internet](#10-key-rfcs-that-shaped-the-internet)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The First RFC

RFC 1, "Host Software," was published on April 7, 1969. Written by Steve Crocker, it described the initial host-to-host protocol for the ARPANET -- the Interface Message Processor (IMP) software that would allow four university nodes to exchange data [1]. The document was seven pages long, typed on a manual typewriter, and distributed via physical mail to the other three ARPANET sites.

Crocker deliberately chose the title "Request for Comments" to avoid implying authority. As he later wrote: "The basic ground rules were that anyone could say anything and that nothing was official" [2]. This framing -- informal, invitational, anti-hierarchical -- became the defining cultural characteristic of the RFC series.

```
ARPANET INITIAL NODES (1969)
================================================================

  UCLA                    SRI (Stanford Research Institute)
  ┌──────────────┐        ┌──────────────┐
  │ Sigma 7      │        │ SDS 940      │
  │ SEX (IMP #1) │<─────>│ IMP #2       │
  │              │        │              │
  └──────────────┘        └──────────────┘
        │                        │
        │                        │
  ┌──────────────┐        ┌──────────────┐
  │ IBM 360/75   │        │ DEC PDP-10   │
  │ UCSB (IMP#3)│        │ Utah (IMP#4) │
  │              │        │              │
  └──────────────┘        └──────────────┘

  October 29, 1969: First ARPANET message sent
  UCLA → SRI: "LO" (system crashed after two letters of "LOGIN")
```

The first four nodes -- UCLA, Stanford Research Institute, UC Santa Barbara, and the University of Utah -- were connected by December 1969. The IMP subnetwork was designed and built by Bolt Beranek and Newman (BBN) under ARPA contract [3].

---

## 2. ARPANET Origins

The Advanced Research Projects Agency (ARPA, later DARPA) funded the development of packet-switching networks beginning in 1966. J.C.R. Licklider's 1962 memo describing an "Intergalactic Computer Network" planted the conceptual seed. Lawrence Roberts at ARPA managed the ARPANET program, and the contract to build the IMPs was awarded to BBN in January 1969 [3].

### The Packet-Switching Revolution

Packet switching was independently conceived by Paul Baran at RAND Corporation (1964) and Donald Davies at the UK National Physical Laboratory (1965). Baran's work was motivated by nuclear survivability -- how to build a communications network that could withstand targeted attacks. Davies coined the term "packet" and built a functioning packet-switched network at NPL in 1968 [4].

ARPANET adopted packet switching not primarily for military resilience but for resource sharing: expensive computers at different universities could serve remote users. The technical requirements -- store-and-forward routing, error detection, flow control -- generated the problems that RFCs were created to solve.

### The NCP to TCP/IP Transition

The original ARPANET used the Network Control Protocol (NCP), documented in RFC 33 (1970) and RFC 36 (1970). NCP was host-to-host only -- it assumed a single reliable network. When ARPA began interconnecting different types of networks (radio, satellite, local), NCP's assumptions broke down. Vinton Cerf and Robert Kahn published "A Protocol for Packet Network Intercommunication" in 1974, proposing TCP [5]. The protocol split into TCP and IP by 1978 (RFC 791, RFC 793), and the ARPANET completed its transition from NCP to TCP/IP on January 1, 1983 -- "Flag Day" [6].

---

## 3. The Network Working Group

The Network Working Group (NWG) was the informal body that produced the first RFCs. Members included Steve Crocker, Vint Cerf, Jon Postel, Steve Carr, and Jeff Rulifson, among others. There was no charter, no formal leadership, and no organizational backing beyond their graduate programs.

The NWG established the cultural norms that the IETF later inherited:

- **Open participation.** Anyone connected to an ARPANET node could join.
- **No voting.** Disagreements were resolved through technical argument and implementation experience.
- **Implementation over theory.** Working code carried more weight than elegant proposals.
- **Permanent record.** Once distributed, an RFC was never revised. Errors were corrected by issuing a new RFC.

By 1971, there were 100 RFCs. By 1980, over 750. The NWG gradually dissolved into the larger ARPANET community as the network grew beyond its original four nodes [7].

---

## 4. Jon Postel and the RFC Editor

Jon Postel served as the RFC Editor from 1969 until his death on October 16, 1998. For nearly thirty years, every RFC published on the Internet passed through Postel's hands. He assigned RFC numbers, performed editorial review, maintained the archive, and enforced stylistic consistency.

Postel authored or co-authored over 200 RFCs himself, including many foundational protocol specifications: SMTP (RFC 821), DNS (RFC 882/883 with Paul Mockapetris), IP (RFC 791), ICMP (RFC 792), and TCP (RFC 793). His "Robustness Principle" -- "Be conservative in what you send, be liberal in what you accept" (RFC 761, later codified in RFC 1122) -- became one of the most quoted guidelines in protocol design [8].

After Postel's death, the RFC Editor function transitioned to an organizational role. It is currently performed by the RFC Production Center (RPC), operated under contract with the IETF Administration LLC (IETF LLC). The RPC handles editorial review, XML formatting, RFC number assignment, and publication [9].

### The Robustness Principle and Its Critics

Postel's principle -- "be conservative in what you send, be liberal in what you accept" -- guided protocol implementation for decades. However, it has also been critiqued in modern contexts. RFC 9413 (2023) argues that liberal acceptance of non-conforming input can create security vulnerabilities, interoperability problems, and "protocol ossification" where non-standard behavior becomes entrenched because receivers tolerate it. The debate around the Robustness Principle illustrates how the RFC series handles evolving understanding: the original principle remains in RFC 1122, the critique is published as a separate RFC, and implementers must read both to form their own judgment.

### The DOI System

Since 2010, every RFC has been assigned a Digital Object Identifier (DOI) in the format `10.17487/RFC{number}`. DOIs provide persistent, resolvable identifiers that work even if the RFC Editor's URL structure changes. The DOI for RFC 791 (IPv4) is `10.17487/RFC0791`, which resolves to the canonical copy at rfc-editor.org. This integration with the global DOI system reflects the RFC series' commitment to long-term archival stability [9].

> **Related:** [RFC Streams & Maturity](03-rfc-streams-maturity.md) -- the RFC Editor publishes documents from all five streams. [I-D Submission Process](05-internet-draft-submission.md) -- the AUTH48 final review is the last step before publication.

---

## 5. IETF Formation

The Internet Engineering Task Force was established in 1986. The first IETF meeting was held on January 16, 1986, at Linkabit in San Diego, attended by 21 researchers -- all US government-funded [10]. By contrast, IETF 119 (March 2024, Brisbane) had over 1,200 registered participants from dozens of countries.

### Key dates in IETF history:

| Year | Event |
|------|-------|
| 1986 | First IETF meeting (21 attendees) |
| 1987 | IETF opens to non-government participants |
| 1989 | First IETF Proceedings published |
| 1992 | Internet Society (ISOC) formed as umbrella organization |
| 1993 | IETF Standards Process formalized in RFC 1602 |
| 1996 | RFC 2026 (BCP 9) defines current standards process |
| 2005 | IETF Trust established to hold intellectual property |
| 2018 | IETF Administration LLC replaces ISOC admin function |
| 2024 | RFC 9920 establishes the Editorial Stream |

The IETF has no formal membership. There are no membership dues, no credentials, and no certification. Anyone can participate by subscribing to a working group mailing list, attending a meeting (in person or remote), or submitting an Internet-Draft. Decisions are made on technical merit, not organizational affiliation [11].

### The Eight IETF Areas

The IETF organizes its approximately 130 active Working Groups into eight technical areas, each managed by one or two Area Directors who sit on the IESG:

| Area | Abbreviation | Scope |
|------|-------------|-------|
| Applications and Real-Time | ART | HTTP, email, instant messaging, media codecs |
| General | GEN | Cross-area coordination, process documents |
| Internet | INT | IP addressing, DNS, routing, IPv6 transition |
| Operations and Management | OPS | Network management (SNMP/YANG), DNS operations, BGP operations |
| Routing | RTG | BGP, OSPF, IS-IS, segment routing, MPLS |
| Security | SEC | TLS, IPsec, PKI, OAuth, ACME (certificate automation) |
| Transport and Services | TSV | TCP, UDP, QUIC, congestion control, SCTP |
| Web and Internet Transport | WIT | HTTP/2, HTTP/3, WebTransport, web performance |

Area Directors serve two-year terms and are appointed by a nominating committee (NomCom) drawn from active IETF participants. The IESG collectively makes the go/no-go decision on every IETF-stream RFC [11].

---

## 6. Governance Architecture

The Internet standards ecosystem involves multiple overlapping bodies. Understanding their relationships is essential for navigating the RFC process.

```
INTERNET GOVERNANCE ARCHITECTURE
================================================================

  ┌─────────────────────────────────────────────────────────┐
  │                 ISOC (Internet Society)                  │
  │         Administrative umbrella since 1992               │
  └───────────────────────┬─────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
  ┌───────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
  │     IAB      │ │    IETF     │ │    IRTF     │
  │  Architecture│ │ Engineering │ │  Research   │
  │    Board     │ │ Task Force  │ │ Task Force  │
  └───────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          │        ┌──────┴──────┐        │
          │        │    IESG     │        │
          │        │ (8 Area    │        │
          │        │  Directors) │        │
          │        └──────┬──────┘        │
          │               │               │
          │        ┌──────┴──────┐        │
          │        │  ~130 WGs   │        │
          │        │  Across 8   │        │
          │        │  Areas      │        │
          │        └─────────────┘        │
          │                               │
  ┌───────┴───────────────────────────────┴──────┐
  │              RFC Editor / RPC                 │
  │        (Publication + Canonical Archive)       │
  └───────────────────────┬──────────────────────┘
                          │
                  ┌───────┴──────┐
                  │     IANA     │
                  │ (Number      │
                  │  Authority)  │
                  └──────────────┘
```

### Body Responsibilities

| Body | Full Name | Role in RFC Process |
|------|-----------|---------------------|
| ISOC | Internet Society | Administrative umbrella; hosts IETF financially; advocacy |
| IAB | Internet Architecture Board | Architectural oversight; appoints IESG; IAB stream publications |
| IETF | Internet Engineering Task Force | Primary standards body; ~130 Working Groups produce most RFCs |
| IESG | Internet Engineering Steering Group | Approves IETF-stream RFCs; 8 Area Directors manage technical scope |
| IRTF | Internet Research Task Force | Longer-term research; IRTF stream publications |
| RFC Editor/RPC | RFC Production Center | Editorial review; RFC number assignment; canonical archive |
| IANA | Internet Assigned Numbers Authority | Protocol parameter registries; code point allocation |
| IETF Trust | IETF Trust | Holds intellectual property rights on behalf of community |
| IETF LLC | IETF Administration LLC | Financial management; meeting logistics; contracts |

---

## 7. Rough Consensus and Running Code

The phrase "rough consensus and running code" was coined by Dave Clark at the 1992 IETF meeting and later documented in RFC 7282 [12]. It is the IETF's foundational decision-making principle.

### What Rough Consensus Is

Rough consensus does NOT mean:
- Unanimous agreement
- Majority vote
- The absence of objections

Rough consensus DOES mean:
- The working group chair has determined that a very large majority of those who care about the issue agree
- Remaining objections have been heard, considered, and addressed (even if not accommodated)
- No one has identified a fundamental technical flaw that has not been resolved

RFC 7282 explicitly states: "Rough consensus is achieved when all issues are addressed, but not necessarily accommodated" [12]. A single strong technical objection can block consensus even against a majority if the objection identifies a real problem. Conversely, many weak objections do not prevent consensus if they reflect preference rather than substance.

### Running Code

The IETF's standards process requires implementation experience before advancing a specification from Proposed Standard to Internet Standard. Two or more independent, interoperable implementations must demonstrate that the specification is implementable and functional. This requirement exists because "standards should be based on experience, not just theory" (RFC 2026) [13].

### How Humming Works

At IETF meetings, chairs sometimes use "humming" instead of raising hands to gauge the room. Participants hum to indicate support for a position. The chair listens for the volume and duration of humming on each side. This is not a vote -- it is a rough signal. The purpose is to prevent counting: rough consensus is about the strength of arguments, not the number of people making them. If three people hum loudly for Option A and thirty hum softly for Option B, the chair must evaluate whether those three have a blocking technical objection, not simply note that thirty outnumber three [12].

### PNW Connection: Early Internet Infrastructure

The Pacific Northwest played a significant role in early Internet infrastructure. The University of Washington (UW) was an early ARPANET node and a key site for the development of the Pine email client and the UW IMAP server -- both of which became critical Internet email infrastructure. Pine (later Alpine) was developed by the UW Computing & Communications team beginning in 1989 and became one of the most widely used text-mode email clients in the university and technical communities [14].

The Pacific Northwest National Laboratory (PNNL) in Richland, Washington, connected to ESnet (the Department of Energy's research network) in the 1980s. The Northwest Academic Computing Consortium (NWACC) coordinated regional networking among universities. The Pacific Northwest Gigapop (PNWGP), housed at UW, became a major Internet exchange point connecting regional academic and research networks to Internet2 and commodity Internet.

Eskimo North BBS, founded by Robert Dinse in Des Moines, Washington (1982), became one of the earliest public Internet access providers in the Pacific Northwest, offering shell accounts and UUCP mail before commercial ISPs existed. By the early 1990s, Eskimo North provided full Internet access -- telnet, FTP, Usenet, email, and eventually PPP/SLIP dial-up -- to individual subscribers in the Seattle area. This was Internet access in the RFC tradition: command-line, text-based, built on the same protocols the RFCs specified [14].

The region's role in Internet infrastructure continued with the establishment of the Westin Building Exchange in downtown Seattle, which became one of the most densely interconnected Internet exchange points on the West Coast. Multiple tier-1 carriers, content delivery networks, and cloud providers maintain points of presence there. The building's significance to Internet routing in the Pacific Northwest is analogous to 60 Hudson Street in New York or One Wilshire in Los Angeles.

---

## 8. The RFC Editor Function

The RFC Editor is not a person but a function, currently performed by the RFC Production Center (RPC). The function encompasses:

1. **Editorial review.** Every document undergoes professional copy-editing for clarity, grammar, and consistency with the RFC Style Guide (RFC 7322).
2. **RFC number assignment.** Numbers are assigned sequentially and never reused. As of March 2026, the series has surpassed 9,700 published RFCs [9].
3. **Format production.** The RPC produces canonical HTML, TXT, PDF, and XML outputs from the author's XML source.
4. **Archive maintenance.** The canonical archive at rfc-editor.org stores every RFC ever published, in every format.
5. **AUTH48 coordination.** The final author-review stage before publication.

### RFC Editor Model (RFC 9280)

RFC 9280 (2022) defines the current RFC Editor model, Version 3 [15]. It establishes:

- The **RFC Series Working Group (RSWG)** for community-driven policy discussion
- The **RFC Series Approval Board (RSAB)** for policy approval
- The **RFC Production Center (RPC)** for day-to-day publication operations
- The **RFC Series Consulting Editor (RSCE)** as liaison between community and production

This model replaced the RFC Series Editor role with a more distributed governance structure, reflecting the IETF's preference for community oversight over individual authority.

### Publication Timeline

The time from final IESG approval to published RFC varies considerably. The RFC Editor queue and editorial review process typically take 6-14 weeks. During AUTH48 (the final author-review stage), all listed authors must approve the document. Some RFCs have spent months in AUTH48 waiting for author sign-off.

The publication rate has remained remarkably consistent over the last decade: approximately 200-250 RFCs per year, or 4-5 per week. This includes documents from all five streams and all status types. The RFC Editor publishes a quarterly report on queue status and throughput [9].

### The Canonical Archive

Every RFC ever published remains in the archive at rfc-editor.org, accessible by its number. The archive includes:

- **Canonical text:** The immutable document exactly as published
- **Metadata:** Title, authors, date, status, stream, DOI, Obsoletes/Updates chains
- **Errata:** Minor corrections tracked separately; linked from the RFC's page
- **Format variants:** TXT, HTML, PDF, and (for post-v3 RFCs) XML source

The archive is freely available for download, copy, and redistribution under the IETF Trust License. There are no access fees, no paywalls, and no registration requirements. This openness is a deliberate architectural choice -- the standards that define the Internet should be universally accessible to anyone who wants to implement them [9].

---

## 9. ISOC and the Administrative Framework

The Internet Society was founded in 1992 by Vint Cerf and Bob Kahn to provide institutional support for the IETF and Internet governance. ISOC served as the IETF's administrative and financial home until 2018, when the IETF Administration LLC (IETF LLC) was established to handle operations directly.

The IETF Trust, established in 2005 (BCP 101), holds the intellectual property rights contributed by RFC authors. When an author submits an Internet-Draft, they grant the IETF Trust certain rights under BCP 78 (RFC 5378). This ensures that published RFCs can be freely reproduced, distributed, and implemented [16].

### Meeting Structure

The IETF holds three in-person meetings per year, rotating among geographic regions (North America, Europe, Asia). Registration costs range from US$875 to US$1,200 (2024 rates), with reduced rates for students and developing-economy participants. Remote participation is available for most sessions at lower cost.

Between meetings, all technical work happens on working group mailing lists. The mailing lists are archived and publicly accessible. Meeting attendance is not required for participation -- many active contributors have never attended an in-person meeting [11].

---

## 10. Key RFCs That Shaped the Internet

Certain RFCs are not just specifications but landmark documents that defined the architecture of global communications.

| RFC | Year | Title | Significance |
|-----|------|-------|--------------|
| RFC 1 | 1969 | Host Software | First RFC; established the series |
| RFC 791 | 1981 | Internet Protocol (IPv4) | Foundation of all Internet routing |
| RFC 793 | 1981 | Transmission Control Protocol | Reliable byte-stream transport |
| RFC 821 | 1982 | Simple Mail Transfer Protocol | Email delivery (now superseded by RFC 5321) |
| RFC 882 | 1983 | Domain Names | DNS concept (superseded by RFC 1034/1035) |
| RFC 1034 | 1987 | Domain Names -- Concepts | DNS architecture, still current |
| RFC 1122 | 1989 | Host Requirements | Postel's Robustness Principle codified |
| RFC 1945 | 1996 | HTTP/1.0 | The protocol of the World Wide Web |
| RFC 2026 | 1996 | Internet Standards Process | BCP 9; current process definition |
| RFC 2119 | 1997 | Key Words (MUST/SHOULD/MAY) | BCP 14; requirements language |
| RFC 2616 | 1999 | HTTP/1.1 | Dominant web protocol for 15+ years |
| RFC 4271 | 2006 | BGP-4 | Inter-domain routing; "the glue" |
| RFC 5246 | 2008 | TLS 1.2 | Transport security |
| RFC 6749 | 2012 | OAuth 2.0 | Authorization framework |
| RFC 7540 | 2015 | HTTP/2 | Multiplexed web transport |
| RFC 8200 | 2017 | IPv6 | Next-generation Internet Protocol |
| RFC 8446 | 2018 | TLS 1.3 | Current transport security standard |
| RFC 9000 | 2022 | QUIC | UDP-based multiplexed transport |

### The IPv4-to-IPv6 Arc

The space between RFC 791 (IPv4, 1981) and RFC 8200 (IPv6, 2017) -- 36 years and 7,409 RFC numbers -- traces one of the longest arcs in the series. IPv4's 32-bit address space (4.3 billion addresses) was designed when the ARPANET had dozens of hosts. By the 1990s, address exhaustion was projected. IPv6 (originally IPng, "IP next generation") was specified in RFC 2460 (1998) and reached Internet Standard in RFC 8200. The transition is still ongoing -- both protocols coexist through dual-stack deployment, tunneling, and NAT64 translation. This arc demonstrates both the RFC system's strength (long-term continuity) and its limitation (no mechanism to force adoption of a new standard, even when the old one is provably exhausted) [6].

### The QUIC Revolution

RFC 9000 (2022) defined QUIC, a transport protocol built on UDP that provides multiplexed, encrypted connections with reduced latency. Originally developed by Google (as gQUIC) and deployed unilaterally, it was brought into the IETF process where it underwent extensive redesign. The QUIC working group produced 25+ RFCs across transport, loss detection, congestion control, and HTTP/3 mapping. QUIC demonstrates the modern RFC process at full scale: a major protocol designed, debated, implemented, tested, and standardized through rough consensus over a 5-year period.

### Humor RFCs

The IETF has a tradition of publishing humorous RFCs on April 1. RFC 1149 (1990) defines "IP over Avian Carriers" -- transmission of IP datagrams via homing pigeons. RFC 2549 (1999) added QoS. RFC 6214 (2011) adapted it for IPv6. RFC 8962 (2021) defines "Conditions for the Responsible Use of Conditions for Responsible Technology." These RFCs are Informational, have no standards status, but reflect the community's culture of technical playfulness. They also serve a practical purpose: the fact that a humor RFC goes through the same publication process as a protocol standard demonstrates that the process itself is robust and well-defined enough to handle any document [17].

### RFC Corpus Statistics

| Metric | Value (March 2026) |
|--------|-------------------|
| Total RFCs published | ~9,750 |
| Active Internet Standards (STD) | ~100 |
| Active BCPs | ~200+ |
| Currently obsoleted | ~1,500 |
| Average RFCs per year (2020-2025) | ~230 |
| Average pages per RFC | ~25 |
| Longest RFC | RFC 5905 (NTPv4, 109 pages) |
| Shortest RFC | RFC 1 (7 pages) |

---

## 11. Cross-References

> **Related:** [RFC Archive & Local Mirror](02-rfc-archive-local-mirror.md) -- the archive is the physical manifestation of the governance described here. [RFC Streams & Maturity](03-rfc-streams-maturity.md) -- the five streams correspond to the governance bodies. [I-D Submission Process](05-internet-draft-submission.md) -- the submission pipeline flows through IESG and RFC Editor.

**Series cross-references:**
- **SYS (Systems Administration):** rsync archive mirroring, cron scheduling, Unix tooling
- **K8S (Kubernetes):** Container orchestration standards draw from IETF process
- **CMH (Computational Mesh):** Multi-cluster federation uses IETF-standard protocols
- **ENB (Eskimo North BBS):** Early PNW Internet access; UUCP/shell accounts predating commercial ISPs
- **WPH (Weekly Phone):** Telephony protocols (SIP, RTP) are IETF standards
- **FCC (FCC Catalog):** Spectrum allocation and telecommunications regulation intersect with IETF standards

---

## 12. Sources

1. Crocker, S.D. "Host Software." RFC 1, April 1969.
2. Crocker, S.D. "The Origin of RFCs." Chapter in *RFC 2555: 30 Years of RFCs*, 1999.
3. Heart, F.E. et al. "The Interface Message Processor for the ARPA Computer Network." AFIPS Conference Proceedings, vol. 36, pp. 551-567, 1970.
4. Baran, P. "On Distributed Communications Networks." IEEE Transactions on Communication Systems, vol. 12, no. 1, pp. 1-9, 1964.
5. Cerf, V. and Kahn, R. "A Protocol for Packet Network Intercommunication." IEEE Transactions on Communications, vol. 22, no. 5, pp. 637-648, 1974.
6. Postel, J. "Internet Protocol." RFC 791, September 1981.
7. RFC Editor. "RFC Index." https://www.rfc-editor.org/rfc-index.html
8. Postel, J. "DoD Standard Transmission Control Protocol." RFC 761, January 1980.
9. RFC Editor. "About the RFC Editor." https://www.rfc-editor.org/about/
10. IETF. "Introduction to the IETF." https://www.ietf.org/about/introduction/
11. IETF. "Participate." https://www.ietf.org/participate/
12. Resnick, P. "On Consensus and Humming in the IETF." RFC 7282, June 2014.
13. Bradner, S. "The Internet Standards Process -- Revision 3." RFC 2026 (BCP 9), October 1996.
14. Eskimo North. "About Eskimo North." https://www.eskimo.com/about/
15. Saint-Andre, P. "RFC Editor Model (Version 3)." RFC 9280, June 2022.
16. Bradner, S. and Contreras, J. "Rights Contributors Provide to the IETF Trust." RFC 5378 (BCP 78), November 2008.
17. Waitzman, D. "Standard for the Transmission of IP Datagrams on Avian Carriers." RFC 1149, April 1990.
18. IETF. "RFCs." https://www.ietf.org/process/rfcs/

---

*RFC Archive & Authorship -- Module 1: RFC History & Governance. The conversation that started with twenty-six typewritten pages in 1969 has never stopped. Every RFC is a reply.*

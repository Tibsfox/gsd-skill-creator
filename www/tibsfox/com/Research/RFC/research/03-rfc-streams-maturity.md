# RFC Streams & Maturity Levels

> **Domain:** Internet Standards Process
> **Module:** 3 -- The Standards Track, Publication Streams, and Status Taxonomy
> **Through-line:** *Not all RFCs are standards. This is the single most common misconception about the RFC series. The number "RFC" carries weight, but an RFC's actual authority depends on which stream published it and what maturity level it carries. An April Fools RFC about IP over carrier pigeons has the same document format as the specification for TLS 1.3. The difference is the metadata: stream, status, and consensus level. Understanding this taxonomy is the difference between citing the right specification and building on sand.*

---

## Table of Contents

1. [The Five Publication Streams](#1-the-five-publication-streams)
2. [IETF Stream](#2-ietf-stream)
3. [IAB Stream](#3-iab-stream)
4. [IRTF Stream](#4-irtf-stream)
5. [Independent Submissions Stream](#5-independent-submissions-stream)
6. [Editorial Stream](#6-editorial-stream)
7. [The Standards Track](#7-the-standards-track)
8. [Off-Track Status Types](#8-off-track-status-types)
9. [STD and BCP Subseries](#9-std-and-bcp-subseries)
10. [Stream Selection Decision Tree](#10-stream-selection-decision-tree)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Five Publication Streams

RFCs enter the series through one of five publication streams. Each stream has different governance, different review processes, and different authority levels. RFC 4844 (2007) originally defined the stream structure; RFC 7841 (2016) updated the stream-specific boilerplate; and RFC 9920 (2024) added the Editorial Stream [1][2][3].

```
FIVE RFC PUBLICATION STREAMS
================================================================

  ┌──────────────────────────────────────────────────────────────┐
  │                    RFC PUBLICATION                            │
  ├──────────┬──────────┬──────────┬──────────────┬──────────────┤
  │   IETF   │   IAB    │   IRTF   │ Independent  │  Editorial   │
  │ Stream   │ Stream   │ Stream   │   Stream     │   Stream     │
  ├──────────┼──────────┼──────────┼──────────────┼──────────────┤
  │ IESG     │ Internet │ IRSG /   │ Independent  │ RFC Series   │
  │ approval │ Arch.    │ IRTF     │ Submissions  │ Working      │
  │          │ Board    │ Chair    │ Editor (ISE) │ Group (RSWG) │
  ├──────────┼──────────┼──────────┼──────────────┼──────────────┤
  │ Standards│ Info     │ Info /   │ Info /       │ Info         │
  │ Track +  │ only     │ Exp      │ Exp          │ only         │
  │ BCP +    │          │          │              │              │
  │ Info +   │          │          │              │              │
  │ Exp      │          │          │              │              │
  ├──────────┼──────────┼──────────┼──────────────┼──────────────┤
  │ ~85%     │ ~3%      │ ~3%      │ ~8%          │ <1%          │
  │ of all   │ of all   │ of all   │ of all       │ (new in      │
  │ RFCs     │ RFCs     │ RFCs     │ RFCs         │  2024)       │
  └──────────┴──────────┴──────────┴──────────────┴──────────────┘
```

The IETF stream produces approximately 85% of all RFCs. It is the only stream that can publish Standards Track documents and BCPs. The other four streams are limited to Informational and Experimental status [4].

---

## 2. IETF Stream

The IETF stream is the primary path for Internet standards. Documents flow through Working Groups (WGs), receive IESG review, and represent rough consensus of the IETF community.

### Process Flow

1. **Individual Internet-Draft** -- Author submits draft to Datatracker
2. **Working Group Adoption** -- A WG agrees to take on the draft (name changes from `draft-author-...` to `draft-ietf-wgname-...`)
3. **WG Last Call** -- WG chair determines rough consensus
4. **IETF Last Call** -- Broader community review (typically 2 weeks)
5. **IESG Review** -- Area Directors evaluate; may request changes
6. **IESG Ballot** -- Formal approval; requires no DISCUSS-level blocks
7. **RFC Editor Queue** -- Editorial review, AUTH48, publication

The entire process from first draft to published RFC typically takes 12-36 months for a Standards Track document. Some have taken years longer [5].

### What IETF Stream Can Publish

| Status | Available | Notes |
|--------|-----------|-------|
| Proposed Standard | Yes | Initial standards-track entry |
| Internet Standard | Yes | Requires implementation experience |
| BCP | Yes | Operational/process guidelines |
| Informational | Yes | General community information |
| Experimental | Yes | Research/development specifications |

---

## 3. IAB Stream

The Internet Architecture Board publishes documents relating to Internet architecture, governance, and IETF process. IAB stream documents are always Informational -- they carry architectural guidance but not standards authority [6].

Examples of IAB stream RFCs:
- RFC 3869 -- "IAB Concerns and Recommendations Regarding Internet Research and Evolution"
- RFC 7942 -- "Improving Awareness of Running Code: The Implementation Status Section"
- RFC 9518 -- "What Can Internet Standards Do About Centralisation?"

The IAB reviews and approves its own documents without IESG ballot, though the IESG checks for IETF-stream conflicts.

---

## 4. IRTF Stream

The Internet Research Task Force publishes longer-term research results from its Research Groups (RGs). IRTF stream RFCs may be Informational or Experimental [7].

### IRTF Review Process

1. Document developed within an IRTF Research Group
2. RG chair and IRTF chair review
3. IRSG (Internet Research Steering Group) review
4. IESG conflict check (not full review -- only checks for IETF-stream conflicts)
5. RFC Editor publication

IRTF stream documents often explore topics not yet ready for standardization -- quantum-safe cryptography, information-centric networking, delay-tolerant networking, and similar forward-looking research [7].

---

## 5. Independent Submissions Stream

The Independent Submissions stream provides a path for documents that are technically relevant to the Internet but do not originate from IETF/IAB/IRTF work. The Independent Submissions Editor (ISE) manages this stream [8].

### Submission Process

1. Publish as an Internet-Draft on the Datatracker
2. Email the ISE at `rfc-ise@rfc-editor.org` with:
   - I-D filename
   - Desired category (Informational or Experimental)
   - Summary of any WG discussion
   - Statement of purpose and merits
3. ISE arranges independent expert review
4. IESG performs a conflict review (not approval -- only checks for interference)
5. If accepted, enters RFC Editor queue

### When to Use the Independent Stream

| Scenario | Appropriate? |
|----------|-------------|
| Document describes a protocol already deployed but not standardized | Yes |
| Author wants to publish research outside any RG scope | Yes |
| Document needs community consensus to be meaningful | No -- use IETF stream |
| Document contradicts an existing IETF standard | Likely rejected |
| Author wants to avoid WG process | Not a valid reason |

Independent stream documents carry a specific boilerplate stating: "This document is not an Internet Standards Track specification; it is published for informational purposes" (or "for examination, experimental implementation, and evaluation") [8].

---

## 6. Editorial Stream

The newest stream, established by RFC 9920 (2024), handles documents about the RFC Series itself -- its governance, policies, and operational guidelines. Previously, such documents had no clear publication path [3].

The Editorial Stream is managed by the RFC Series Working Group (RSWG) with approval by the RFC Series Approval Board (RSAB). Documents are always Informational. This stream exists because the community needed a way to publish RFC Series governance documents without routing them through the IETF standards process [3].

The Editorial Stream was created to resolve a governance gap: documents about how the RFC Series itself should be managed had no natural home in any of the other four streams. The IETF stream is for standards and operational guidance. The IAB stream is for architectural advice. The IRTF stream is for research. The Independent stream is for documents outside IETF scope. None of these naturally accommodated "here is how the RFC Editor should operate" type documents. RFC 9920 filled that gap.

### Stream Volume and Distribution

The five streams produce RFCs at very different rates:

| Stream | Annual Volume (approx.) | Typical Document Types |
|--------|------------------------|----------------------|
| IETF | 180-200 RFCs/year | Protocol standards, BCPs, operational guidance |
| IAB | 5-10 RFCs/year | Architecture statements, process guidance |
| IRTF | 8-15 RFCs/year | Research results, experimental protocols |
| Independent | 15-25 RFCs/year | Vendor documentation, tutorials, surveys |
| Editorial | 1-3 RFCs/year | RFC Series governance (new in 2024) |

The IETF stream's dominance reflects its role as the primary Internet standards body. The other streams serve important but more specialized functions [10].

---

## 7. The Standards Track

The Standards Track is the most rigorous path to RFC publication. Only the IETF stream produces Standards Track documents. The current process is defined in RFC 2026 (BCP 9), as updated by RFC 6410 [4][5].

### Maturity Levels on the Standards Track

```
THE STANDARDS TRACK
================================================================

  ┌────────────────────┐
  │  Internet-Draft    │  (not an RFC; no standards status)
  │  (draft-...)       │
  └─────────┬──────────┘
            │ IESG approval + rough consensus
            v
  ┌────────────────────┐
  │  Proposed Standard │  RFC with initial standards status
  │  (most RFCs stop   │  Stable, peer-reviewed, implementable
  │   here)            │  May still change via new RFC
  └─────────┬──────────┘
            │ Multiple interoperable implementations
            │ + Implementation experience report
            │ + IESG re-evaluation
            v
  ┌────────────────────┐
  │  Internet Standard │  Highest maturity level
  │  (STD number       │  Assigned an STD number
  │   assigned)        │  Retains original RFC number
  └────────────────────┘

  Note: "Draft Standard" was removed by RFC 6410 (2011).
  The path is now two steps: Proposed → Internet Standard.
```

### Proposed Standard

A Proposed Standard is a stable specification, reviewed and approved by the IESG, that the IETF believes is ready for implementation. Most RFCs on the Standards Track remain at Proposed Standard indefinitely -- advancement to Internet Standard requires additional effort that is often not undertaken even for widely deployed protocols [5].

A Proposed Standard:
- Has been reviewed by the IETF community
- Has achieved rough consensus in its Working Group
- Is considered technically sound
- May still be revised via a new RFC
- Is suitable for implementation and deployment

### Internet Standard

An Internet Standard represents the highest maturity level. To advance from Proposed Standard to Internet Standard, a specification must demonstrate [5]:

1. **Multiple independent interoperable implementations** -- at least two, from different code bases
2. **Sufficient implementation experience** -- the specification has been deployed and tested
3. **No errata that affect interoperability**
4. **IESG re-evaluation and approval**

Internet Standards are assigned an STD number in addition to their RFC number. For example, TCP is STD 7 (RFC 793). When the standard is updated (new RFC replaces old), the STD number stays the same but points to the new RFC.

### Why Most RFCs Stay at Proposed Standard

The vast majority of Standards Track RFCs never advance beyond Proposed Standard. This is not a sign of failure -- it reflects the practical reality that advancing to Internet Standard requires someone to champion the advancement, document implementation experience, and shepherd the document through another IESG review cycle. For protocols that are already widely deployed (like many Proposed Standards), the community often considers the advancement effort unnecessary. The protocol works, interoperability is proven in practice, and the formal status upgrade adds bureaucratic cost without clear technical benefit [5].

This creates a perception problem: newcomers assume "Proposed Standard" means "not yet ready for deployment." In reality, Proposed Standards are the backbone of Internet infrastructure. HTTP/1.1 (RFC 2616) was a Proposed Standard for 15 years while serving 99% of all web traffic. The semantic gap between Proposed Standard and Internet Standard is much smaller than the names suggest.

RFC 6410 (2011) simplified the track by removing the intermediate "Draft Standard" level, reducing the path from three steps to two. This acknowledged that the three-step process was creating unnecessary friction without meaningfully improving protocol quality.

### Current STD Numbers

As of 2026, there are approximately 100 assigned STD numbers. Notable examples:

| STD # | RFC(s) | Protocol |
|-------|--------|----------|
| STD 5 | RFC 791, RFC 792, RFC 919, RFC 922, RFC 950 | Internet Protocol Suite |
| STD 7 | RFC 793 | Transmission Control Protocol |
| STD 13 | RFC 1034, RFC 1035 | Domain Name System |
| STD 51 | RFC 1661, RFC 1662 | Point-to-Point Protocol |
| STD 86 | RFC 8200 | Internet Protocol Version 6 |
| STD 94 | RFC 9293 | TCP (updated specification) |

---

## 8. Off-Track Status Types

Not all RFCs are on the Standards Track. The following status types exist outside the standards progression.

### Best Current Practice (BCP)

BCPs are IETF-stream documents that describe mandatory operational or process guidelines for the IETF community. They are not protocol standards but carry community consensus. BCPs are numbered separately (BCP 1 through BCP 200+) but retain their RFC numbers [4].

Key BCPs:
- BCP 9 (RFC 2026) -- Internet Standards Process
- BCP 14 (RFC 2119, RFC 8174) -- Requirements Language (MUST/SHOULD/MAY)
- BCP 72 (RFC 3552) -- Guidelines for Writing RFC Security Considerations
- BCP 78 (RFC 5378) -- Rights Contributors Provide to the IETF Trust
- BCP 79 (RFC 8179) -- Intellectual Property Rights in IETF Technology

### Informational

Informational RFCs provide general information to the Internet community. They have no standards implications and do not represent IETF consensus (unless published through the IETF stream with consensus noted). All five streams can publish Informational RFCs [4].

Uses include: technology surveys, experience reports, applicability statements, deployment guidance, and humor (April 1 RFCs).

### Experimental

Experimental RFCs describe research or development specifications not recommended for general deployment. They preserve ideas for the record and allow controlled experimentation. Published by all five streams except Editorial [4].

### Historic

An RFC classified as Historic has been superseded by a newer specification or is no longer considered relevant. The original document remains in the archive; only its metadata changes. The IESG can reclassify any RFC as Historic [4].

Note: The status is "Historic," not "Historical." This distinction is itself historical -- an early editorial choice that persisted.

### Unknown

Applied to a small number of very early RFCs where the original status was never clearly assigned. These are archival artifacts from before the status taxonomy was formalized.

---

## 9. STD and BCP Subseries

The STD and BCP subseries provide stable identifiers that persist across RFC number changes.

### How Subseries Numbering Works

```
SUBSERIES NUMBER PERSISTENCE
================================================================

  STD 7: TCP
    Originally:  RFC 793 (1981)
    Updated to:  RFC 9293 (2022)
    STD number remains 7 in both cases

  BCP 14: Requirements Language
    Originally:  RFC 2119 (1997)
    Extended by: RFC 8174 (2017)
    BCP 14 now comprises BOTH RFC 2119 AND RFC 8174
```

A single STD or BCP number can point to multiple RFCs. When implementing a standard, you reference the STD number and implement all associated RFCs.

### FYI and IEN Subseries (Historical)

Two other subseries exist in the archive but are no longer active:

- **FYI (For Your Information):** A subseries of Informational RFCs intended for a general audience. FYI 1 (RFC 1150) through FYI 38 (RFC 3098). The FYI subseries was discontinued in 2011 (RFC 6360) because the distinction from regular Informational RFCs was not useful [4].
- **IEN (Internet Experiment Notes):** Pre-RFC working documents from the early Internet development period (1977-1982). IENs were used for TCP/IP development notes before those topics migrated to the RFC series. They are preserved in the archive but no new IENs are published.

### Status Distribution (Approximate, March 2026)

| Status | Count | Percentage |
|--------|-------|------------|
| Proposed Standard | ~2,800 | ~29% |
| Internet Standard | ~100 | ~1% |
| Best Current Practice | ~200 | ~2% |
| Informational | ~3,400 | ~35% |
| Experimental | ~350 | ~4% |
| Historic | ~600 | ~6% |
| Unknown | ~30 | <1% |
| Obsoleted (any status) | ~1,500 | ~15% |

The dominance of Informational status reflects the RFC series' role as a general-purpose technical archive, not just a standards registry [10].

---

## 10. Stream Selection Decision Tree

Choosing the right stream is one of the first decisions an author must make.

```
STREAM SELECTION DECISION TREE
================================================================

  Is your document a protocol standard or BCP?
  ├── YES → IETF Stream
  │         (Only path for Standards Track / BCP)
  │
  └── NO → Does it describe Internet architecture or IETF process?
           ├── YES → Are you on the IAB?
           │         ├── YES → IAB Stream
           │         └── NO  → IETF Stream (as Informational)
           │
           └── NO → Is it research from an IRTF Research Group?
                    ├── YES → IRTF Stream
                    │
                    └── NO → Is it relevant to the Internet community?
                             ├── YES → Independent Stream
                             │         (email rfc-ise@rfc-editor.org)
                             │
                             └── NO → Is it about RFC Series governance?
                                      ├── YES → Editorial Stream
                                      └── NO  → May not be appropriate
                                                for RFC publication
```

### Common Mistakes in Stream Selection

| Mistake | Why It Fails |
|---------|-------------|
| Submitting a standards-track doc to Independent stream | Independent cannot publish standards |
| Avoiding IETF stream to skip WG process | ISE will likely redirect you back |
| Publishing operational guidance as Informational | Consider BCP if it needs community consensus |
| Expecting Independent stream to carry consensus | It explicitly does NOT carry community consensus |

---

## 11. Cross-References

> **Related:** [RFC History & Governance](01-rfc-history-governance.md) -- the governance bodies that operate each stream. [I-D Submission Process](05-internet-draft-submission.md) -- the submission pipeline differs by stream. [RFC Document Template](06-rfc-template-style-guide.md) -- boilerplate text varies by stream.

**Series cross-references:**
- **SYS (Systems Administration):** BCP documents define operational best practices
- **K8S (Kubernetes):** Kubernetes networking relies on IETF Standards Track protocols
- **WPH (Weekly Phone):** SIP (RFC 3261) and RTP (RFC 3550) are Proposed Standards
- **FCC (FCC Catalog):** Regulatory compliance often references Internet Standards
- **CMH (Computational Mesh):** Mesh protocols may warrant Experimental RFC status
- **DNS:** RFC 1034/1035 (STD 13) are Internet Standards -- the highest maturity level

---

## 12. Sources

1. Daigle, L. (Ed.) et al. "The RFC Series and RFC Editor." RFC 4844, July 2007.
2. Halpern, J. (Ed.) and Rescorla, E. (Ed.). "RFC Streams, Headers, and Boilerplates." RFC 7841, May 2016.
3. Roach, A.B. "Establishing the Editorial Stream." RFC 9920, 2024.
4. Bradner, S. "The Internet Standards Process -- Revision 3." RFC 2026 (BCP 9), October 1996.
5. Housley, R. and Crocker, D. "Reducing the Standards Track to Two Maturity Levels." RFC 6410 (BCP 9), October 2011.
6. IAB. "About the IAB." https://www.iab.org/about/
7. IRTF. "Policies and Procedures for the IRTF." https://www.irtf.org/policies/
8. RFC Editor. "Independent Submissions." https://www.rfc-editor.org/about/independent/
9. IETF. "Internet Standards Process." https://www.ietf.org/standards/process/
10. IETF. "RFCs." https://www.ietf.org/process/rfcs/
11. RFC Editor. "STD Index." https://www.rfc-editor.org/standards
12. RFC Editor. "BCP Index." https://www.rfc-editor.org/search/rfc_search_detail.php?sortkey=Number&sorting=ASC&page=All&pubstatus%5B%5D=Best%20Current%20Practice
13. Saint-Andre, P. "RFC Editor Model (Version 3)." RFC 9280, June 2022.
14. Bradner, S. and Contreras, J. "Rights Contributors Provide to the IETF Trust." RFC 5378 (BCP 78), November 2008.
15. Leiba, B. "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words." RFC 8174 (BCP 14), May 2017.

---

*RFC Archive & Authorship -- Module 3: RFC Streams & Maturity Levels. Not all RFCs are created equal. The metadata tells you which ones to build on.*

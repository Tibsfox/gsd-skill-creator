# Internet-Draft Submission Process

> **Domain:** Internet Standards Pipeline
> **Module:** 5 -- From First Draft to RFC Number: Naming, Datatracker, Working Groups, and AUTH48
> **Through-line:** *An Internet-Draft is a pull request against civilizational infrastructure. You write it, you name it, you submit it to the Datatracker, and it enters a public repository where anyone on Earth can read it, implement it, critique it, and improve it. If it survives rough consensus, IESG review, and editorial scrutiny, it becomes an RFC -- a permanent, immutable part of the Internet's technical record. The path is more open than most people realize. You do not need organizational sponsorship. You need technical precision and community engagement.*

---

## Table of Contents

1. [What Is an Internet-Draft](#1-what-is-an-internet-draft)
2. [Naming Conventions](#2-naming-conventions)
3. [Datatracker Submission](#3-datatracker-submission)
4. [The 185-Day Expiry Rule](#4-the-185-day-expiry-rule)
5. [Working Group Engagement](#5-working-group-engagement)
6. [WG Adoption](#6-wg-adoption)
7. [IETF Last Call](#7-ietf-last-call)
8. [IESG Review](#8-iesg-review)
9. [AUTH48](#9-auth48)
10. [Independent Stream Submission](#10-independent-stream-submission)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. What Is an Internet-Draft

An Internet-Draft (I-D) is a working document submitted to the IETF for discussion and development. I-Ds have NO standards status. They are explicitly provisional, subject to revision, and may be removed from the repository after expiry [1].

### Key Properties

| Property | Value |
|----------|-------|
| Standards status | None -- I-Ds are NOT standards |
| Lifetime | 185 days from posting (unless renewed or superseded) |
| Mutability | Can be revised (new version number) |
| Citation | MUST NOT be cited as authoritative |
| Repository | datatracker.ietf.org |
| Access | Publicly readable by anyone |
| Submission | Open to anyone -- no membership required |

> **SAFETY NOTE:** Implementers and vendors MUST NOT claim conformance to an Internet-Draft. I-Ds carry the boilerplate: "Internet-Drafts are working documents of the Internet Engineering Task Force (IETF). Note that other groups may also distribute working documents as Internet-Drafts." [1]

---

## 2. Naming Conventions

I-Ds follow a strict naming convention. The filename IS the identifier.

```
I-D NAMING CONVENTION
================================================================

  Format:
    draft-{identifier}-{topic}-{version}

  Individual submission:
    draft-{lastname}-{topic}-{version}
    draft-tibsfox-mesh-protocol-00

  After WG adoption:
    draft-ietf-{wgname}-{topic}-{version}
    draft-ietf-quic-transport-00

  "bis" revision (updating existing RFC):
    draft-{author}-rfc{number}bis-{version}
    draft-someone-rfc2345bis-00

  Version rules:
    - Always two digits, zero-padded: 00, 01, 02, ..., 99
    - First submission is ALWAYS -00
    - After WG adoption, version restarts at -00
    - Each revision increments by 1

  Extension:
    .xml   (preferred; RFCXML v3 source)
    .txt   (accepted; legacy plain text)
```

### Name Component Rules

| Component | Rule |
|-----------|------|
| `draft-` | Mandatory prefix for all I-Ds |
| identifier | Author's last name (individual) or `ietf` (WG-adopted) |
| wgname | Working group abbreviation (after adoption only) |
| topic | Descriptive slug; lowercase; hyphens only |
| version | Two-digit, zero-padded; starts at 00 |
| Total length | No formal limit, but keep reasonable (~50 chars max) |

### Examples from Real I-Ds

| Stage | Example Name |
|-------|-------------|
| Individual draft | `draft-varda-quic-datagram-00` |
| After WG adoption | `draft-ietf-quic-datagram-00` (restarts at -00) |
| Multiple revisions | `draft-ietf-quic-datagram-01`, `-02`, `-03` |
| Published as RFC | RFC 9221 (number assigned at publication) |

---

## 3. Datatracker Submission

All I-D submissions go through the IETF Datatracker at `https://datatracker.ietf.org/submit/` [2].

### Step-by-Step Submission

```
DATATRACKER SUBMISSION PROCESS
================================================================

  1. PRE-SUBMISSION
     ├── Run idnits: zero errors required
     ├── Verify filename matches <seriesInfo> in XML
     ├── Confirm date is current
     └── Check that all boilerplate is present

  2. UPLOAD
     ├── Go to: https://datatracker.ietf.org/submit/
     ├── Upload XML file (preferred) or plain text
     └── Tool parses and displays extracted metadata

  3. VERIFICATION
     ├── Review extracted title, authors, abstract
     ├── Confirm version number
     └── Check that no unintended content was parsed

  4. AUTHENTICATION
     ├── Option A: Log in to Datatracker account
     └── Option B: Email confirmation sent to all listed authors

  5. CONFIRMATION
     ├── Confirm metadata and submit
     └── I-D appears in the IETF I-D repository within minutes

  6. POST-SUBMISSION
     ├── I-D assigned an I-D tracker URL
     ├── Appears in the Internet-Drafts repository
     ├── Sent to i-d-announce mailing list
     └── 185-day expiry clock starts

  FALLBACK (manual posting):
     Email support@ietf.org with the I-D as an attachment
```

### Submission Requirements

| Requirement | Details |
|-------------|---------|
| File format | XML (RFCXML v3 preferred) or plain text (.txt) |
| idnits | Zero errors; zero warnings recommended |
| Boilerplate | IPR notice, Copyright, Status of This Memo |
| Date | Must be within 3 days of submission |
| Authors | Contact email for each listed author |
| Length | No formal limit; practical range 5-200 pages |

---

## 4. The 185-Day Expiry Rule

An Internet-Draft expires 185 days (approximately 6 months) after posting, unless one of the following prevents expiry [1]:

| Action | Effect on Expiry |
|--------|-----------------|
| New version submitted | Restarts 185-day clock |
| Adopted by a Working Group | Protected while in WG state |
| In IESG review | Protected while under review |
| Published as RFC | Removed from I-D repository |
| Expired | Removed from active repository; archived |

### What Happens When an I-D Expires

- Removed from the active I-D repository
- Moved to the expired I-D archive (still accessible but not linked from Datatracker)
- Any references to it in other documents become dangling
- Can be re-submitted as a new version to restart the clock

The 185-day rule exists to prevent the I-D repository from accumulating stale documents. If work on a topic has stalled, the document should expire rather than occupy repository space indefinitely [1].

---

## 5. Working Group Engagement

The IETF organizes its technical work into approximately 130 Working Groups, each chartered to address a specific technical area [3].

### Finding the Right Working Group

```
WG DISCOVERY PROCESS
================================================================

  1. Browse active WGs: https://datatracker.ietf.org/wg/
     ├── Organized by IETF Area (8 areas)
     ├── Each WG has: charter, mailing list, milestones
     └── Area Directors manage WG lifecycle

  2. IETF Areas (2024):
     ├── ART   (Applications and Real-Time)
     ├── GEN   (General)
     ├── INT   (Internet)
     ├── OPS   (Operations and Management)
     ├── RTG   (Routing)
     ├── SEC   (Security)
     ├── TSV   (Transport and Services)
     └── WIT   (Web and Internet Transport)

  3. Read the WG charter
     ├── Does your topic fall within charter scope?
     ├── Is the WG still active (not concluded)?
     └── Are the WG's milestones aligned?

  4. Subscribe to the mailing list
     ├── Observe discussion for 2-4 weeks
     ├── Understand the WG culture
     └── Identify active participants
```

### Engagement Strategy

| Phase | Action | Duration |
|-------|--------|----------|
| Listen | Subscribe to mailing list; read archives | 2-4 weeks |
| Introduce | Post a concise summary of your idea to the list | 1 email |
| Gauge interest | Monitor responses; address feedback | 1-2 weeks |
| Submit I-D | Post as individual draft on Datatracker | Day 1 |
| Present | Request agenda time at next IETF meeting or interim | Variable |
| Request adoption | Ask WG chairs to consider adoption | After sufficient discussion |

The IETF has no formal membership. Participation is open to anyone. Onsite meeting registration (3 meetings/year) costs US$875-$1,200. Remote participation is available. Between meetings, all technical work occurs on mailing lists -- meeting attendance is not required [3].

---

## 6. WG Adoption

When a Working Group decides to adopt an individual I-D, the document transitions from individual submission to WG document [4].

### Adoption Process

1. **Author requests adoption** (or WG chair proposes it)
2. **WG chairs gauge consensus** on the mailing list (not at meetings)
3. **Adoption call** -- typically 2-week comment period
4. **Chairs determine rough consensus** to adopt
5. **Document name changes** from `draft-author-...` to `draft-ietf-wgname-...`
6. **Version resets to -00**
7. **WG takes ownership** -- further revisions are WG work products

### After Adoption

| Before Adoption | After Adoption |
|----------------|----------------|
| `draft-smith-quic-datagram-03` | `draft-ietf-quic-datagram-00` |
| Individual submission | WG document |
| Author controls revisions | WG consensus controls direction |
| No IETF consensus implied | WG consensus process applies |

An adopted I-D is NOT yet an RFC. It must still go through WG Last Call, IETF Last Call, and IESG review before publication [4].

---

## 7. IETF Last Call

After the Working Group reaches rough consensus on the document, the WG chairs request that the responsible Area Director initiate an IETF Last Call [5].

### Last Call Process

1. **WG Last Call** -- WG-internal review period (1-2 weeks)
2. **Shepherd writeup** -- WG chair or document shepherd writes a detailed evaluation
3. **Publication request** -- Sent to IESG via Datatracker
4. **IETF Last Call** -- Announced to ietf-announce; broader community review (2 weeks minimum)
5. **Comments collected** and addressed by authors/WG

The IETF Last Call exposes the document to reviewers outside the WG who may identify issues that WG participants -- immersed in the topic -- might have missed [5].

---

## 8. IESG Review

The Internet Engineering Steering Group reviews all IETF-stream documents before publication [6].

### IESG Ballot

The IESG ballot involves all Area Directors (ADs) voting on the document:

| Position | Meaning |
|----------|---------|
| Yes | Approve publication |
| No Objection | No technical concerns; approve |
| Abstain | No opinion |
| DISCUSS | Block -- identifies a specific technical or process issue that must be resolved |
| Recuse | Conflict of interest |

A single DISCUSS-level objection blocks publication until resolved. The blocking AD must articulate a specific, actionable concern. DISCUSS is not a veto power -- it is a mechanism to force resolution of identified issues [6].

### Common IESG Concerns

| Category | Issue |
|----------|-------|
| Security | Inadequate Security Considerations section |
| IANA | Missing or incorrect IANA Considerations |
| Scope | Document scope exceeds WG charter |
| References | Normative reference to a non-standards-track document |
| Interoperability | Specification ambiguity that could cause implementation divergence |
| IPR | Undisclosed intellectual property rights |

---

## 9. AUTH48

AUTH48 is the final author-review stage before an RFC is published. The RFC Editor sends the near-final formatted document to all listed authors for approval [7].

```
AUTH48 PROCESS
================================================================

  1. RFC Editor completes editorial review
  2. Near-final document sent to authors
  3. Authors have 2-4 weeks to:
     ├── Review all editorial changes
     ├── Approve or request modifications
     ├── Verify author names and affiliations
     └── Sign off in writing (email)
  4. All authors must approve
  5. Any disagreements resolved with RFC Editor
  6. Upon approval, RFC Editor publishes

  IMPORTANT:
    - Authors CANNOT make substantive technical changes at AUTH48
    - Only editorial corrections are accepted
    - Indefinite delays are not allowed
    - RFC Editor prefers correctness over speed
```

### What Authors Can Change at AUTH48

| Allowed | Not Allowed |
|---------|-------------|
| Fix typos | Add new protocol features |
| Correct author affiliation | Change normative requirements |
| Fix broken references | Rewrite sections |
| Clarify ambiguous wording | Remove consensus-driven content |
| Update date | Change document status/stream |

### Timeline

| Phase | Typical Duration |
|-------|-----------------|
| Editorial review (RFC Editor) | 2-8 weeks |
| AUTH48 period | 2-4 weeks |
| Publication after AUTH48 approval | 1-2 weeks |
| Total (editorial queue to publication) | 6-14 weeks |

---

## 10. Independent Stream Submission

For documents outside IETF/IAB/IRTF scope, the Independent Submissions stream provides an alternative path through the Independent Submissions Editor (ISE) [8].

```
INDEPENDENT STREAM PROCESS
================================================================

  1. Publish as I-D on Datatracker (same as any I-D)

  2. Email ISE at rfc-ise@rfc-editor.org with:
     ├── I-D filename
     ├── Desired category: Informational or Experimental
     ├── Summary of any relevant WG discussion
     ├── IANA allocation assertion (if applicable)
     └── Statement of purpose and merits

  3. ISE arranges external expert review
     ├── 2-3 independent reviewers
     ├── Authors respond to review comments
     └── ISE determines if document meets quality bar

  4. IESG conflict review (RFC 5742, BCP 92)
     ├── NOT approval -- only checks for IETF conflicts
     ├── Ensures document doesn't contradict active WG work
     └── Typically 2-3 weeks

  5. If accepted → RFC Editor queue
     └── Same editorial process as any RFC

  Key differences from IETF stream:
    - No community consensus required
    - Cannot publish Standards Track
    - Limited to Informational or Experimental
    - Carries explicit "not IETF consensus" boilerplate
```

### When Independent Stream Is Appropriate

| Scenario | Appropriate |
|----------|------------|
| Protocol already deployed widely but never standardized | Yes |
| Research contribution outside any IRTF RG | Yes |
| Documentation of a vendor-specific protocol (e.g., Cisco, Juniper) | Yes, if Internet-relevant |
| Historical or archival documentation | Yes |
| Tutorial or survey document | Yes |
| Document that should carry IETF consensus | No -- use IETF stream |

---

## 11. Cross-References

> **Related:** [RFC Streams & Maturity](03-rfc-streams-maturity.md) -- stream selection determines the submission path. [Authoring Tools & Workflow](04-authoring-tools-workflow.md) -- idnits validation is required before Datatracker submission. [RFC Document Template](06-rfc-template-style-guide.md) -- the template must pass idnits before entering this pipeline.

**Series cross-references:**
- **SYS (Systems Administration):** Datatracker API for automated submission tracking
- **K8S (Kubernetes):** CI/CD-driven I-D builds submitted via Datatracker
- **WPH (Weekly Phone):** SIP and RTP went through full IETF standards process
- **CMH (Computational Mesh):** Mesh protocol standardization follows this path
- **FCC (FCC Catalog):** Regulatory bodies consume published Internet Standards
- **ENB (Eskimo North BBS):** Early Internet access predating the modern IETF submission process

---

## 12. Sources

1. IETF. "Internet-Drafts." https://www.ietf.org/participate/ids/
2. IETF Datatracker. "Submission Tool Instructions." https://datatracker.ietf.org/submit/tool-instructions/
3. IETF. "Working Groups." https://datatracker.ietf.org/wg/
4. IETF. "Internet Standards Process." https://www.ietf.org/standards/process/
5. Bradner, S. "The Internet Standards Process -- Revision 3." RFC 2026 (BCP 9), October 1996.
6. Housley, R. "IESG Procedures for Handling of Independent and IRTF Stream Submissions." RFC 5742 (BCP 92), December 2009.
7. RFC Editor. "Publication Process." https://www.rfc-editor.org/pubprocess/
8. RFC Editor. "Independent Submissions." https://www.rfc-editor.org/about/independent/
9. IETF. "I-D Guidelines." https://ietf.github.io/id-guidelines/
10. IETF. "How to Participate." https://www.ietf.org/participate/
11. Resnick, P. "On Consensus and Humming in the IETF." RFC 7282, June 2014.
12. IETF. "IETF Areas." https://www.ietf.org/topics/areas/
13. Bradner, S. and Contreras, J. "Rights Contributors Provide to the IETF Trust." RFC 5378 (BCP 78), November 2008.
14. RFC Editor. "AUTH48 FAQ." https://www.rfc-editor.org/pubprocess/auth48/
15. IETF Trust. "Legal Provisions Relating to IETF Documents." https://trustee.ietf.org/license-info/

---

*RFC Archive & Authorship -- Module 5: Internet-Draft Submission Process. The path from idea to RFC number is open to anyone. The requirements are technical precision and community engagement, not credentials or organizational affiliation.*

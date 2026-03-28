# Wire Protocol & Message Format

> **Domain:** Internet Protocol / DNS
> **Module:** 1 -- Binary Message Specification
> **Through-line:** *The DNS wire format is 12 bytes of fixed header followed by variable-length sections that encode the entire naming infrastructure of the internet. Every query and every response shares this same structure. The elegance is in the constraint: a fixed header small enough to fit in a single cache line, carrying flags that control behavior across billions of daily transactions.*

---

## Table of Contents

1. [Transport Layer](#1-transport-layer)
2. [Header Format](#2-header-format)
3. [Flag Field Bit Assignments](#3-flag-field-bit-assignments)
4. [Extended RCODE Values](#4-extended-rcode-values)
5. [Label Encoding](#5-label-encoding)
6. [Label Compression](#6-label-compression)
7. [Question Section Format](#7-question-section-format)
8. [Resource Record Wire Format](#8-resource-record-wire-format)
9. [Message Section Structure](#9-message-section-structure)
10. [UDP and TCP Transport Rules](#10-udp-and-tcp-transport-rules)
11. [Implementation Considerations](#11-implementation-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Transport Layer

DNS operates over both UDP and TCP on port 53. The original design (RFC 1035) used UDP for queries and TCP only for zone transfers. The transport rules have evolved substantially over four decades [1]:

- UDP is used for queries where the response fits in 512 bytes (the original DNS specification limit from RFC 1035)
- If a response is truncated (TC bit set in header), the client *must* retry over TCP
- With EDNS0, clients may advertise larger UDP payload sizes (commonly 4096 bytes), reducing TCP fallback frequency
- AXFR zone transfers *must* use TCP (RFC 5936)
- RFC 7766 (2016) requires all DNS implementations to support TCP, retiring the earlier "UDP first, TCP optional" assumption
- DNS over TLS (DoT) uses TCP port 853 (RFC 7858)
- DNS over HTTPS (DoH) uses TCP port 443 (RFC 8484)
- DNS over QUIC (DoQ) uses UDP port 853 with QUIC transport (RFC 9250)

The choice of UDP for the common case was deliberate. A typical DNS query-response exchange is 100-300 bytes -- well within a single UDP datagram. The three-way TCP handshake would triple the round-trip latency for every lookup. UDP gives DNS its speed; TCP gives it reliability for large responses and zone transfers [2].

> **SAFETY WARNING:** DNS over UDP is vulnerable to source IP spoofing because UDP provides no connection state. This is the root cause of DNS amplification attacks, where attackers send queries with forged source IPs to open resolvers, directing amplified responses at the victim. EDNS0 responses can reach 4096 bytes from a 60-byte query -- a 68x amplification factor [3].

---

## 2. Header Format

The DNS message header occupies exactly 12 bytes in all messages. Queries and responses share the same structure. The header contains six 16-bit fields [1]:

```
DNS MESSAGE HEADER (12 bytes fixed)
================================================================

 0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F   (bit position)
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      ID                         |  [0-1]  16-bit transaction ID
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|QR|  OPCODE   |AA|TC|RD|RA| Z|AD|CD|   RCODE    |  [2-3]  16-bit flags
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QDCOUNT                      |  [4-5]  question count
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ANCOUNT                      |  [6-7]  answer RR count
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    NSCOUNT                      |  [8-9]  authority RR count
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ARCOUNT                      | [10-11] additional RR count
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

The **ID** field is a 16-bit value assigned by the client and copied into the response. It allows the client to match responses to queries when multiple queries are in flight. The ID field is the *only* query-to-response correlation mechanism in the original protocol -- a design weakness exploited by the Kaminsky attack [4].

The four **count** fields (QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT) specify how many entries follow in each of the four variable-length sections. A typical query has QDCOUNT=1 and all other counts at 0. A typical response has QDCOUNT=1 (echoing the question), ANCOUNT >= 1, and may include NSCOUNT and ARCOUNT entries for referrals and glue records.

---

## 3. Flag Field Bit Assignments

The second 16-bit word of the header contains the control flags. Each flag bit has specific operational semantics defined across multiple RFCs [1][5][6]:

| Field | Bits | Description | Values |
|-------|------|-------------|--------|
| QR | 1 | Query (0) or Response (1) | 0=query, 1=response |
| OPCODE | 4 | Operation type | 0=QUERY, 1=IQUERY (obsolete, RFC 3425), 2=STATUS, 4=NOTIFY (RFC 1996), 5=UPDATE (RFC 2136) |
| AA | 1 | Authoritative Answer | Set if responding server owns the zone containing the answer |
| TC | 1 | Truncated | Response was truncated to fit UDP; client must retry over TCP |
| RD | 1 | Recursion Desired | Client requests recursive resolution; copied into response |
| RA | 1 | Recursion Available | Server supports recursion; set in response only |
| Z | 1 | Reserved | Must be zero (RFC 1035) |
| AD | 1 | Authenticated Data | DNSSEC: response data has been cryptographically verified (RFC 4035) |
| CD | 1 | Checking Disabled | DNSSEC: client requests unverified data; disables resolver validation (RFC 4035) |
| RCODE | 4 | Response Code | 0=NOERROR, 1=FORMERR, 2=SERVFAIL, 3=NXDOMAIN, 4=NOTIMP, 5=REFUSED |

### Behavioral Notes

The **AA** bit is critical for understanding referrals. When a server returns a referral (NS records in the authority section pointing to another zone), the AA bit is *not* set because the server is not authoritative for the queried name -- it is directing the resolver to the server that is [1].

The **TC** bit triggers a mandatory behavioral change: any client receiving a truncated response must retry the query over TCP. This mechanism ensures that large responses (particularly DNSSEC-signed responses) can always be delivered, at the cost of an additional round trip [7].

The **AD** and **CD** bits were added by RFC 4035 for DNSSEC. A resolver that has validated the response's RRSIG chain of trust sets AD=1. A stub resolver that wants to do its own validation (or skip validation entirely) sets CD=1 in its query [6].

---

## 4. Extended RCODE Values

The 4-bit RCODE field in the header supports values 0-15. EDNS0 (RFC 6891) extends this with 8 additional high-order bits carried in the OPT record's TTL field, creating a 12-bit extended RCODE space [8]:

| Code | Name | Meaning | RFC |
|------|------|---------|-----|
| 0 | NOERROR | No error condition | 1035 |
| 1 | FORMERR | Format error in query | 1035 |
| 2 | SERVFAIL | Server failure | 1035 |
| 3 | NXDOMAIN | Name does not exist | 1035 |
| 4 | NOTIMP | Not implemented | 1035 |
| 5 | REFUSED | Query refused by policy | 1035 |
| 6 | YXDOMAIN | Name exists when it should not | 2136 |
| 7 | YXRRSET | RR set exists when it should not | 2136 |
| 8 | NXRRSET | RR set that should exist does not | 2136 |
| 9 | NOTAUTH | Server not authoritative for zone / not authorized | 2136 |
| 10 | NOTZONE | Name not contained in zone | 2136 |
| 16 | BADSIG | TSIG signature failure | 2845 |
| 17 | BADKEY | Key not recognized | 2845 |
| 18 | BADTIME | Signature out of time window | 2845 |
| 19 | BADMODE | Bad TKEY mode | 2930 |
| 20 | BADNAME | Duplicate key name | 2930 |
| 21 | BADALG | Algorithm not supported | 2930 |
| 22 | BADTRUNC | Bad truncation | 4635 |

The **NXDOMAIN** response (code 3) is one of the most important in DNS operations. It is the definitive "this name does not exist" signal, and negative caching of NXDOMAIN responses (RFC 2308) prevents repeated queries for non-existent names from overloading authoritative servers [9].

---

## 5. Label Encoding

DNS names are encoded as a sequence of *labels*. Each label consists of a 1-byte length field followed by that many octets of label data. The name is terminated by a zero-length label representing the root. This encoding scheme is defined in RFC 1035 Section 4.1.2 [1]:

- **Maximum label length:** 63 octets (the length field uses only the lower 6 bits; the upper 2 bits are reserved for compression pointers)
- **Maximum full name length:** 253 characters in textual representation; 255 octets in wire format (includes all length bytes and the terminal root null byte)
- **Character rules:** The hostname convention (letters, digits, hyphen per RFC 952) applies to hostnames; the DNS protocol itself allows any octet in a label (RFC 2181)
- **Case sensitivity:** DNS name comparisons are case-insensitive for standard ASCII letters (RFC 4343). Servers should preserve case in responses but compare case-insensitively.

```
LABEL ENCODING EXAMPLE: "www.example.com"
================================================================

Wire encoding (hex):
  03 77 77 77 07 65 78 61 6d 70 6c 65 03 63 6f 6d 00
  |  w  w  w  |  e  x  a  m  p  l  e  |  c  o  m  |
  ^           ^                        ^           ^
  length=3    length=7                 length=3    root (0)

Total wire length: 17 bytes
```

The encoding is self-describing: a parser reads the length byte, consumes that many octets, and repeats until it encounters a zero-length label. This eliminates the need for a separate length field for the entire name [1][10].

---

## 6. Label Compression

Label compression (RFC 1035 Section 4.1.4) allows responses to reference names already present in the message without repeating them. A compression pointer replaces the remaining labels of a name with a 2-byte pointer to an earlier occurrence [1]:

```
LABEL TYPES (first two bits of length byte)
================================================================

Normal label:    0 0 L L L L L L   (bits: 00 = label, LLLLLL = length 0-63)
Compression ptr: 1 1 O O O O O O  O O O O O O O O
                 (bits: 11 = pointer, 14-bit offset from message start)
Reserved:        0 1 x x x x x x  (reserved, must not be used)
Reserved:        1 0 x x x x x x  (reserved, must not be used)
```

The 14-bit offset field allows pointers to reference any position in the first 16,384 bytes of a message. In practice, DNS messages are much shorter than this, so the pointer space is more than sufficient.

### Compression Rules

- A pointer can appear anywhere a label would appear in a name
- The pointer *replaces* all remaining labels (there is no "resume" mechanism)
- Pointers must point *backward* in the message (to prevent infinite loops)
- Compression may only be used in the RDATA of record types that the resolver is expected to understand (RFC 3597 restricts compression to specific well-known types: NS, CNAME, SOA, MX, PTR, and a few others)
- A maximum of 128 pointer hops should be enforced to prevent malicious compression loops [10]

Compression is particularly effective in responses that contain many records for the same domain. A response with 10 A records for `www.example.com` need only encode the full name once; the remaining 9 records use 2-byte pointers instead of 17-byte names -- saving 135 bytes [1].

> **Related:** [Resource Record Types](02-resource-record-taxonomy.md) for RDATA compression rules per type; [DNSSEC](05-dnssec.md) for RRSIG signer name encoding

---

## 7. Question Section Format

Each question record in the QUESTION section contains three fields [1]:

- **QNAME**: Variable-length label-encoded name (the name being queried)
- **QTYPE**: 16-bit record type (1=A, 28=AAAA, 15=MX, etc.; 255=ANY, 252=AXFR, 251=IXFR)
- **QCLASS**: 16-bit class (1=IN for Internet, 3=CH for Chaosnet, 255=ANY)

```
QUESTION SECTION WIRE FORMAT
================================================================

+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     QNAME                       |  Variable length, label-encoded
|                   (variable)                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     QTYPE                       |  16-bit record type
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     QCLASS                      |  16-bit class (usually IN = 1)
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

Nearly all production DNS traffic uses QCLASS=IN (Internet). The Chaosnet class (CH) is occasionally used for version queries: querying `version.bind` in class CH returns the BIND version string on many servers -- a common information leakage vector that security-conscious operators disable [11].

The QTYPE value 255 (ANY) requests all record types for a name. RFC 8482 (2019) effectively deprecated ANY queries by allowing servers to respond with a minimal answer, because ANY queries were heavily abused in amplification attacks [12].

---

## 8. Resource Record Wire Format

All records in the answer, authority, and additional sections share an identical wire format [1]:

```
RESOURCE RECORD WIRE FORMAT
================================================================

NAME      : variable-length label sequence (may use compression)
TYPE      : 16-bit record type (1=A, 2=NS, 5=CNAME, 6=SOA, 15=MX, ...)
CLASS     : 16-bit class (1=IN, 3=CH)
TTL       : 32-bit unsigned integer (seconds until expiry)
RDLENGTH  : 16-bit unsigned, length of RDATA in octets
RDATA     : type-specific data (RDLENGTH bytes)
```

### TTL Semantics

The TTL (Time To Live) field is a 32-bit value specifying how many seconds a record may be cached. RFC 2181 clarifies that TTL is treated as an unsigned 32-bit integer, giving a maximum value of 2,147,483,647 seconds (approximately 68 years). In practice [10]:

- Very short TTLs (30-300 seconds) are used by CDNs and dynamic DNS for rapid failover
- Standard TTLs (3600-86400 seconds, i.e. 1 hour to 1 day) are used for most static records
- Very long TTLs (604800 seconds / 1 week or more) are used for records that rarely change, like root zone NS records
- TTL=0 means "do not cache" -- the record must be re-queried for every use

### RDATA Structure

The RDATA field is entirely type-dependent. An A record's RDATA is exactly 4 bytes (IPv4 address). An AAAA record's RDATA is exactly 16 bytes (IPv6 address). A CNAME record's RDATA is a variable-length label-encoded domain name. The RDLENGTH field allows parsers to skip over unknown record types without understanding their RDATA format -- this is the extensibility mechanism that has allowed DNS to carry data types unimaginable in 1987 [1][13].

---

## 9. Message Section Structure

A DNS message contains up to five sections, always in this order [1]:

```
DNS MESSAGE SECTION LAYOUT
================================================================

+---------------------------+
| HEADER (12 bytes, fixed)  |  Always present. Contains ID, flags, and 4 counts.
+---------------------------+
| QUESTION SECTION          |  Usually 1 entry. Contains QNAME + QTYPE + QCLASS.
| (QDCOUNT entries)         |  Echoed in responses for query matching.
+---------------------------+
| ANSWER SECTION            |  0 or more RRs answering the question.
| (ANCOUNT entries)         |  Contains the requested records (A, AAAA, MX, etc.)
+---------------------------+
| AUTHORITY SECTION         |  0 or more RRs providing NS referrals or SOA records.
| (NSCOUNT entries)         |  Used in referral responses and NXDOMAIN (SOA for neg cache).
+---------------------------+
| ADDITIONAL SECTION        |  0 or more RRs providing supplementary data.
| (ARCOUNT entries)         |  Glue A/AAAA records for NS, OPT record for EDNS0.
+---------------------------+
```

### Section Behavioral Rules

The **answer section** contains the actual data the client requested. For a successful A record lookup, this section contains one or more A records.

The **authority section** serves dual purposes: in a referral response, it contains NS records pointing to the next zone's name servers; in an NXDOMAIN or NODATA response, it contains the SOA record of the zone, which provides the negative caching TTL [9].

The **additional section** carries supplementary records that the server believes the client will need. The most important are *glue records*: when the authority section contains NS records like `ns1.example.com`, the additional section carries the A/AAAA records for `ns1.example.com` so the resolver doesn't have to make a separate query. The EDNS0 OPT pseudo-record also lives in the additional section [1][8].

---

## 10. UDP and TCP Transport Rules

The DNS transport model is a nuanced hybrid of UDP and TCP, refined across 40 years of operational experience [1][7][14]:

| Rule | UDP | TCP |
|------|-----|-----|
| Default port | 53 | 53 |
| Query size limit | 512 bytes (RFC 1035) or EDNS0 advertised size | Unlimited (length-prefixed) |
| Response size limit | Same as query limit | Unlimited |
| Connection state | None | 3-way handshake |
| Truncation handling | TC bit triggers TCP retry | Not applicable |
| Zone transfers | Not permitted | Required (RFC 5936) |
| TCP requirement | Optional (RFC 1035), mandatory (RFC 7766) | Always supported |
| Latency | 1 RTT | 2+ RTT (handshake + query) |

### TCP Message Framing

When DNS is carried over TCP, each message is preceded by a 2-byte length prefix indicating the total message size in octets. This framing is necessary because TCP is a stream protocol without inherent message boundaries. The 2-byte prefix limits TCP DNS messages to 65,535 bytes -- more than sufficient for any practical DNS response [1][7].

### EDNS0 UDP Size Negotiation

EDNS0 (RFC 6891) allows clients to advertise their willingness to accept larger UDP responses through the OPT record's CLASS field (which carries the maximum UDP payload size instead of the normal class value). Common values are 1232 bytes (recommended by DNS Flag Day 2020 to avoid IP fragmentation on most paths) and 4096 bytes (the most common historical default) [8][15].

> **Related:** [EDNS0 Specification](06-modern-extensions-privacy.md) for the complete OPT record wire format; [Zone Management](04-zone-management.md) for AXFR TCP requirements

---

## 11. Implementation Considerations

### Common Implementation Traps

- **Label compression loops:** Malicious messages can create circular compression pointers. Implementations must enforce a maximum hop count (128 is typical) and a maximum total name length (255 bytes) to prevent infinite loops [10]
- **Case preservation vs. comparison:** DNS is case-insensitive for comparison but case-preserving in responses. Incorrectly normalizing case can break DNSSEC signatures, which sign the original case of the name (RFC 4034) [6]
- **TC bit and EDNS0 interaction:** A response can be truncated even with EDNS0 if the response exceeds the client's advertised maximum. Implementations must handle the TC bit even when EDNS0 is in use [8]
- **ID field entropy:** The 16-bit ID field provides only 65,536 possible values. Combined with predictable source port selection, this made the Kaminsky cache poisoning attack possible. Modern resolvers randomize both the ID field and the UDP source port (RFC 5452) [4][16]
- **Zero-length RDATA:** Some record types (like the root hints) may have zero-length RDATA. Implementations must handle RDLENGTH=0 gracefully [1]

### Wire Format Validation Checklist

1. Verify header is exactly 12 bytes
2. Validate QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT against actual section contents
3. Enforce 63-byte maximum label length
4. Enforce 255-byte maximum name length (wire format)
5. Check compression pointers point backward in the message
6. Limit compression pointer hops to prevent loops
7. Validate RCODE is in the known range
8. If EDNS0 is present, verify exactly one OPT record in the additional section

---

## 12. Cross-References

> **Related:** [Resource Record Taxonomy](02-resource-record-taxonomy.md) -- type-specific RDATA formats for all IANA-assigned types; [Resolution Architecture](03-resolution-architecture.md) -- how messages flow through the resolver hierarchy; [DNSSEC](05-dnssec.md) -- AD/CD flag semantics and RRSIG interaction with the wire format; [Modern Extensions](06-modern-extensions-privacy.md) -- EDNS0 OPT record construction and DoT/DoH transport encapsulation

**Related PNW Research Projects:**
- **RFC** -- RFC Archive project covers the IETF standards process and RFC publication mechanics
- **SYS** -- Systems Administration covers DNS server deployment and operational configuration
- **CMH** -- Computational Mesh covers DNS as service discovery infrastructure for distributed systems
- **K8S** -- Kubernetes covers CoreDNS and cluster-internal DNS resolution
- **PSS** -- PNW Signal Stack covers DNS as part of the network signal chain
- **FCC** -- FCC Catalog covers radio frequency allocation that DNS infrastructure depends on

---

## 13. Sources

1. RFC 1035 -- Domain Names: Implementation and Specification (Mockapetris, 1987)
2. RFC 768 -- User Datagram Protocol (Postel, 1980)
3. US-CERT Alert TA13-088A -- DNS Amplification Attacks (2013)
4. Kaminsky, D. -- "Black Ops 2008: It's the End of the Cache as We Know It" (Black Hat USA, 2008)
5. RFC 1034 -- Domain Names: Concepts and Facilities (Mockapetris, 1987)
6. RFC 4035 -- Protocol Modifications for DNS Security Extensions (Arends et al., 2005)
7. RFC 7766 -- DNS Transport over TCP: Implementation Requirements (Dickinson et al., 2016)
8. RFC 6891 -- Extension Mechanisms for DNS (EDNS(0)) (Damas et al., 2013)
9. RFC 2308 -- Negative Caching of DNS Queries (Andrews, 1998)
10. RFC 2181 -- Clarifications to the DNS Specification (Elz and Bush, 1997)
11. ISC BIND 9 Administrator Reference Manual, v9.21
12. RFC 8482 -- Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY (Abley et al., 2019)
13. RFC 3597 -- Handling of Unknown DNS Resource Record Types (Gustafsson, 2003)
14. RFC 5936 -- DNS Zone Transfer Protocol (AXFR) (Lewis and Hoenes, 2010)
15. DNS Flag Day 2020 -- https://dnsflagday.net/2020/
16. RFC 5452 -- Measures for Making DNS More Resilient against Forged Answers (Hubert and van Mook, 2009)
17. IANA DNS Parameters Registry -- https://www.iana.org/assignments/dns-parameters
18. RFC 9499 -- DNS Terminology (Hoffman et al., 2024)

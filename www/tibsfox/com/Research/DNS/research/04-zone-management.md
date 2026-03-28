# Zone Management

> **Domain:** Internet Protocol / DNS
> **Module:** 4 -- Zone Files, Transfers, and Dynamic Updates
> **Through-line:** *A zone file is a flat text file that describes a slice of the DNS namespace. It is one of the most consequential file formats in computing history. Every domain name on the internet -- every website, every email address, every API endpoint -- exists because someone wrote a zone file (or its database equivalent) and a server started answering queries from it. Zone management is where DNS stops being a protocol and starts being infrastructure.*

---

## Table of Contents

1. [Zone File Fundamentals](#1-zone-file-fundamentals)
2. [Zone File Directives](#2-zone-file-directives)
3. [Zone File Record Syntax](#3-zone-file-record-syntax)
4. [SOA Record Configuration](#4-soa-record-configuration)
5. [Zone Transfer: AXFR](#5-zone-transfer-axfr)
6. [Incremental Zone Transfer: IXFR](#6-incremental-zone-transfer-ixfr)
7. [NOTIFY Mechanism](#7-notify-mechanism)
8. [Dynamic Updates](#8-dynamic-updates)
9. [TSIG Transaction Signatures](#9-tsig-transaction-signatures)
10. [Multi-Primary Architectures](#10-multi-primary-architectures)
11. [Operational Best Practices](#11-operational-best-practices)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Zone File Fundamentals

A DNS zone is a contiguous portion of the DNS namespace managed by a single administrative authority. The zone boundary is defined by delegation: a parent zone creates NS records that delegate a subdomain to another zone's name servers. Everything between the zone apex (the delegated domain) and the next delegation is the zone's content [1][2]:

```
ZONE BOUNDARIES
================================================================

  .com zone                    example.com zone
  +-----------------------+    +-----------------------+
  |  example.com NS ns1.. |    |  @ SOA ns1. admin.   |
  |  example.com NS ns2.. |--->|  @ NS  ns1.example.  |
  |  (delegation)         |    |  @ NS  ns2.example.  |
  +-----------------------+    |  @ A   93.184.216.34  |
                               |  www CNAME @          |
                               |  mail A 93.184.216.35 |
                               |  @ MX 10 mail         |
                               +-----------------------+
                                        |
                               sub.example.com zone
                               +-----------------------+
                               |  (delegated further)  |
                               +-----------------------+
```

The zone file is the standard textual representation of zone data, defined in RFC 1035 Section 5. While modern DNS servers often use database backends (PowerDNS with PostgreSQL, Route 53 with DynamoDB), the zone file format remains the canonical interchange format [1].

---

## 2. Zone File Directives

Zone files support control directives that modify parsing behavior. These directives begin with `$` and affect all subsequent records [1][3]:

| Directive | Function | Example |
|-----------|----------|---------|
| `$ORIGIN domain` | Sets default origin; appended to unqualified names | `$ORIGIN example.com.` |
| `$TTL seconds` | Sets default TTL for subsequent records | `$TTL 86400` |
| `$INCLUDE file [origin]` | Includes another file; optionally overrides origin | `$INCLUDE /etc/bind/db.mail` |
| `$GENERATE range lhs type rhs` | Generates a series of similar records (BIND extension) | `$GENERATE 1-254 $.168.192.in-addr.arpa. PTR host-$.example.com.` |
| `@` | Shorthand for current $ORIGIN value | `@ IN A 93.184.216.34` |

### Relative vs. Absolute Names

Names in zone files that end with a dot (`.`) are *absolute* (fully qualified). Names without a trailing dot are *relative* and have the current `$ORIGIN` appended. This is one of the most common sources of DNS configuration errors -- forgetting the trailing dot turns `ns1.example.com` into `ns1.example.com.example.com.` [1][4]:

```
TRAILING DOT: CRITICAL DISTINCTION
================================================================

$ORIGIN example.com.

www          IN  A  93.184.216.34     <- resolves to www.example.com.
www.         IN  A  93.184.216.34     <- ERROR: resolves to just "www."
mail.example.com.  IN  A  93.184.216.35  <- absolute, correct
mail.example.com   IN  A  93.184.216.35  <- resolves to mail.example.com.example.com.  WRONG!
```

---

## 3. Zone File Record Syntax

Each resource record in a zone file follows this general syntax [1]:

```
ZONE FILE RECORD SYNTAX
================================================================

[name]  [TTL]  [class]  type  rdata

name   : Owner name (relative or absolute). If blank, uses previous record's name.
TTL    : Optional. If omitted, uses $TTL default.
class  : Optional. Almost always IN. If omitted, uses previous record's class.
type   : Record type (A, AAAA, NS, MX, CNAME, SOA, TXT, SRV, etc.)
rdata  : Type-specific record data.
```

### Complete Zone File Example

```
; Zone file for example.com
$ORIGIN example.com.
$TTL 86400

; SOA Record
@  IN  SOA  ns1.example.com. admin.example.com. (
             2026032701  ; Serial (YYYYMMDDnn)
             86400       ; Refresh (1 day)
             7200        ; Retry (2 hours)
             3600000     ; Expire (~ 42 days)
             3600        ; Minimum / Negative cache TTL (1 hour)
         )

; Name Servers
       IN  NS   ns1.example.com.
       IN  NS   ns2.example.com.

; A Records
       IN  A    93.184.216.34
www    IN  A    93.184.216.34
mail   IN  A    93.184.216.35

; AAAA Records
       IN  AAAA  2606:2800:21f:cb07:6820:80da:af6b:8b2c

; Mail
       IN  MX   10  mail.example.com.
       IN  MX   20  backup-mail.example.com.

; SPF / DKIM / DMARC
       IN  TXT  "v=spf1 mx -all"
_dmarc IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"

; Service Records
_sip._tcp  IN  SRV  10 60 5060 sip.example.com.

; Glue (for NS within zone)
ns1    IN  A    198.51.100.1
ns2    IN  A    198.51.100.2

; CAA
       IN  CAA  0 issue "letsencrypt.org"
```

---

## 4. SOA Record Configuration

The SOA (Start of Authority) record is mandatory at every zone apex and controls zone replication behavior. Each field has specific operational semantics [1][2][5]:

| Field | Value | Purpose |
|-------|-------|---------|
| MNAME | Primary server FQDN | Identifies the primary master for dynamic updates and NOTIFY |
| RNAME | Admin email (@ -> .) | Contact for zone issues; `admin.example.com.` = `admin@example.com` |
| SERIAL | YYYYMMDDnn | Zone version number; secondary fetches if primary serial is higher |
| REFRESH | 86400 (1 day) | How often secondaries check the primary's SOA serial |
| RETRY | 7200 (2 hours) | Retry interval if the primary is unreachable at refresh time |
| EXPIRE | 3600000 (~42 days) | Time after which secondary stops serving zone if primary remains unreachable |
| MINIMUM | 3600 (1 hour) | Negative caching TTL (RFC 2308) |

### Serial Number Management

The serial number is a 32-bit unsigned integer. Secondary servers compare their cached serial with the primary's serial via SOA query. If the primary's serial is higher (using serial number arithmetic per RFC 1982), the secondary initiates a zone transfer [1][6]:

- **YYYYMMDDnn convention:** `2026032701` = March 27, 2026, revision 01. Allows 100 changes per day.
- **Monotonic increment:** Any scheme works as long as the serial always increases. Some operators use Unix timestamps.
- **Serial wrap-around:** RFC 1982 defines modular comparison to handle the 32-bit wraparound. If current serial is 4294967295 (max), the next serial 1 is correctly identified as "newer."

> **SAFETY WARNING:** Accidentally *decreasing* the serial number is a common operational disaster. If the primary's serial drops below the secondary's, the secondary will never transfer because it believes it already has the latest version. Recovery requires either manually setting the primary's serial higher than the secondary's or purging the secondary's zone cache [4][7].

---

## 5. Zone Transfer: AXFR

AXFR (Authoritative Transfer, RFC 5936) is the full zone transfer protocol. A secondary server uses AXFR to obtain a complete copy of the zone from the primary [8]:

### Protocol Mechanics

1. Secondary sends SOA query to primary to check serial number
2. If primary serial > secondary serial, secondary sends AXFR query (QTYPE 252) over TCP
3. Primary responds with a TCP stream of DNS messages containing all records in the zone
4. First and last record in the stream are both the SOA record (*SOA bookending*)
5. Secondary replaces its entire zone data with the received records

```
AXFR PROTOCOL FLOW
================================================================

Secondary                              Primary
    |                                      |
    |--- SOA query ----------------------->|
    |<-- SOA response (serial: 2026032701) |
    |                                      |
    |  (serial > cached serial)            |
    |                                      |
    |--- AXFR query (TCP) --------------->|
    |<-- SOA record (start) --------------|
    |<-- NS records ----------------------|
    |<-- A records -----------------------|
    |<-- MX records ----------------------|
    |<-- ... all zone records ... --------|
    |<-- SOA record (end) ----------------|
    |                                      |
    |  (zone fully transferred)            |
```

### Security Considerations

AXFR has no built-in authentication. By default, *any* client that can reach the server on TCP port 53 can request a full zone transfer, exposing every record in the zone. This is a significant information leakage risk [8][9]:

- **IP-based ACL:** The minimum protection -- restrict AXFR to known secondary IP addresses
- **TSIG authentication:** HMAC-based message authentication; the standard mechanism for securing zone transfers (RFC 2845)
- **Historical incident:** In 2017, accidental open AXFR on the .ru TLD zone exposed 5.6 million Russian domain records [9]
- **Penetration testing:** `dig axfr example.com @ns1.example.com` is a standard reconnaissance step; responsible operators block this

---

## 6. Incremental Zone Transfer: IXFR

IXFR (RFC 1995) transfers only the changes since the last known serial, dramatically reducing bandwidth for large zones [10]:

### Protocol Mechanics

1. Secondary sends IXFR query (QTYPE 251) including its current SOA serial in the authority section
2. Primary computes the delta between the secondary's serial and its current serial
3. Primary responds with pairs of: (old SOA + deleted RRs) then (new SOA + added RRs) for each serial increment
4. If the primary cannot compute the delta (e.g., journal not available), it falls back to a full AXFR response

```
IXFR RESPONSE FORMAT
================================================================

; Change from serial 2026032701 to 2026032702:

example.com.  SOA  ... serial 2026032701    <- "from" SOA (start of deletions)
old-host.     A    192.0.2.1                 <- deleted record

example.com.  SOA  ... serial 2026032702    <- "to" SOA (start of additions)
new-host.     A    203.0.113.5               <- added record

example.com.  SOA  ... serial 2026032702    <- final SOA (end of transfer)
```

IXFR is especially valuable for large zones (TLD zones with millions of records) where full AXFR would transfer gigabytes of data. A single record change via IXFR requires only a few hundred bytes [10].

---

## 7. NOTIFY Mechanism

RFC 1996 defines NOTIFY to reduce zone propagation delay. Without NOTIFY, secondaries discover zone changes only at the REFRESH interval (typically hours). NOTIFY provides near-real-time propagation [11]:

### Protocol Flow

1. Primary zone data changes (serial incremented)
2. Primary sends NOTIFY message (OPCODE 4) to all configured secondary servers
3. Secondaries acknowledge with NOTIFY response
4. Secondaries immediately initiate SOA check (instead of waiting for refresh)
5. If serial has increased, secondaries initiate IXFR or AXFR

```
NOTIFY FLOW
================================================================

Primary                     Secondary-1              Secondary-2
  |                              |                        |
  | (zone updated, serial++)     |                        |
  |                              |                        |
  |--- NOTIFY (OPCODE 4) ------>|                        |
  |--- NOTIFY (OPCODE 4) ------------------------------>|
  |                              |                        |
  |<-- NOTIFY ACK --------------|                        |
  |<-- NOTIFY ACK ------------------------------------ -|
  |                              |                        |
  |                 SOA query -->|                        |
  |<-- SOA response ------------|                        |
  |                              |                        |
  |                 IXFR ------->|                        |
  |<-- zone delta --------------|                        |
```

NOTIFY reduces propagation from the REFRESH interval (hours) to seconds. It does not authenticate -- an attacker can send fake NOTIFY messages to trigger unnecessary SOA checks, though the impact is limited since the secondary verifies the serial before transferring [11].

---

## 8. Dynamic Updates

DNS UPDATE (RFC 2136, OPCODE 5) allows authorized clients to add, delete, or modify records in a zone without editing the zone file directly. The UPDATE message repurposes the standard four-section format [12]:

| Standard Section | UPDATE Meaning |
|-----------------|----------------|
| Question | Zone section: identifies the zone being updated |
| Answer | Prerequisite section: conditions that must be true before update applies |
| Authority | Update section: RRs to add or delete |
| Additional | Authentication (TSIG or SIG(0)) |

### Prerequisite Types

| Prereq Type | Meaning |
|-------------|---------|
| RRset exists (value dependent) | Specific RRset with specific RDATA must exist |
| RRset exists (value independent) | At least one RR of the specified type must exist |
| Name is in use | At least one RR of any type must exist at the name |
| RRset does not exist | No RRs of the specified type at the name |
| Name is not in use | No RRs of any type at the name |

### Common Use Cases

- **DHCP-DNS integration:** DHCP server registers A/PTR records for leased addresses via dynamic update
- **Let's Encrypt DNS-01:** ACME client adds `_acme-challenge` TXT record for certificate validation
- **Kubernetes ExternalDNS:** Controller creates A/AAAA records for LoadBalancer services
- **Active Directory:** Domain controllers register SRV records for Kerberos and LDAP services

> **SAFETY WARNING:** Dynamic updates modify the authoritative zone data. Unauthorized updates can redirect traffic, break email delivery, or create denial-of-service conditions. Always authenticate dynamic updates with TSIG or equivalent mechanisms. Never allow unauthenticated updates from untrusted networks [12][13].

---

## 9. TSIG Transaction Signatures

TSIG (Transaction Signature, RFC 2845) provides message-level authentication for DNS transactions using shared secret keys with HMAC algorithms [13]:

### How TSIG Works

1. Both parties (primary + secondary, or client + server) share a secret key
2. The sender computes an HMAC digest over the entire DNS message plus the key name, algorithm, and timestamp
3. The TSIG record (appended to the additional section) carries the key name, algorithm, timestamp, MAC value, and original message ID
4. The receiver recomputes the HMAC with its copy of the shared key and verifies the digest matches

### TSIG Record Fields

| Field | Purpose |
|-------|---------|
| Algorithm | HMAC algorithm: hmac-sha256, hmac-sha384, hmac-sha512 (hmac-md5 deprecated) |
| Time Signed | Unix timestamp (seconds since epoch) |
| Fudge | Allowed clock skew in seconds (typically 300 = 5 minutes) |
| MAC | HMAC digest value |
| Original ID | Transaction ID from the signed message |
| Error | TSIG-specific error code (0=NOERROR, 16=BADSIG, 17=BADKEY, 18=BADTIME) |

### TSIG Key Generation

```
TSIG KEY GENERATION (using tsig-keygen)
================================================================

$ tsig-keygen -a hmac-sha256 transfer-key
key "transfer-key" {
    algorithm hmac-sha256;
    secret "base64-encoded-random-secret";
};
```

TSIG protects zone transfers (AXFR/IXFR), dynamic updates, and NOTIFY messages. It is the standard authentication mechanism for DNS server-to-server communication [13][14].

---

## 10. Multi-Primary Architectures

Traditional DNS uses a single primary with one or more secondaries. Modern deployments often use multi-primary (or "hidden primary") architectures for resilience [15]:

### Hidden Primary

The primary server is not listed in NS records and is unreachable from the public internet. It pushes zone updates to public-facing secondary servers via NOTIFY + AXFR/IXFR. This protects the primary from DDoS attacks and exploitation attempts [15]:

```
HIDDEN PRIMARY ARCHITECTURE
================================================================

  [Hidden Primary]  (internal only, not in NS records)
       |
       | NOTIFY + AXFR/IXFR (authenticated with TSIG)
       |
       +-----> [Public Secondary 1]  (ns1.example.com, in NS records)
       +-----> [Public Secondary 2]  (ns2.example.com, in NS records)
       +-----> [Public Secondary 3]  (ns3.example.com, in NS records)

  All public queries hit secondaries.
  Primary is only reachable from internal network.
```

### Multi-Primary with Synchronization

Multiple writable primaries can be maintained using database-backed DNS (PowerDNS with shared database) or zone synchronization tools. This provides write availability even if one primary fails [15].

---

## 11. Operational Best Practices

- **Always use TSIG for zone transfers.** IP-based ACLs are necessary but not sufficient -- they are vulnerable to IP spoofing and don't protect against compromised intermediate networks [13].
- **Monitor serial number consistency.** Automated checks should verify all secondaries are within 1-2 serial numbers of the primary. Serial drift indicates transfer failures [4].
- **Use IXFR where possible.** For zones with more than a few hundred records, IXFR dramatically reduces transfer bandwidth and time [10].
- **Enable NOTIFY for all secondaries.** Without NOTIFY, propagation depends on the REFRESH interval -- potentially hours of stale data [11].
- **Back up zone files.** Zone data is critical infrastructure. Losing a zone file for a production domain means losing all DNS records for that domain. Treat zone files like database backups [4].
- **Test changes in staging.** Use `named-checkzone` (BIND) or equivalent validators before deploying zone file changes [3].
- **Increment serial correctly.** Always increase the serial. Use the YYYYMMDDnn convention for auditability. Automate serial updates where possible [1].

---

## 12. Cross-References

> **Related:** [Wire Protocol](01-wire-protocol-message-format.md) -- message format for AXFR/IXFR/UPDATE/NOTIFY; [Resource Records](02-resource-record-taxonomy.md) -- zone file syntax for each record type; [Resolution](03-resolution-architecture.md) -- how zones are discovered via delegation; [DNSSEC](05-dnssec.md) -- zone signing and DNSKEY management; [Extensions](06-modern-extensions-privacy.md) -- EDNS0 interaction with zone transfers

**Related PNW Research Projects:**
- **SYS** -- Systems Administration covers BIND, PowerDNS, and NSD operational deployment
- **K8S** -- Kubernetes CoreDNS uses configurable zone files for cluster-internal DNS
- **MCF** -- Multi-Cluster Federation uses DNS zone delegation for cross-cluster naming
- **CMH** -- Computational Mesh covers DNS zone management at infrastructure scale
- **RFC** -- RFC Archive documents the zone transfer protocol evolution
- **PSS** -- PNW Signal Stack covers DNS zones as part of the network infrastructure layer

---

## 13. Sources

1. RFC 1035 -- Domain Names: Implementation and Specification (Mockapetris, 1987)
2. RFC 1034 -- Domain Names: Concepts and Facilities (Mockapetris, 1987)
3. ISC BIND 9 Administrator Reference Manual, v9.21
4. RFC 1912 -- Common DNS Operational and Configuration Errors (Barr, 1996)
5. RFC 2308 -- Negative Caching of DNS Queries (Andrews, 1998)
6. RFC 1982 -- Serial Number Arithmetic (Elz and Bush, 1996)
7. IANA Root Zone Database -- https://www.iana.org/domains/root/db
8. RFC 5936 -- DNS Zone Transfer Protocol (AXFR) (Lewis and Hoenes, 2010)
9. Cimpanu, C. -- "Accidental zone exposure via AXFR" (Bleeping Computer, 2017)
10. RFC 1995 -- Incremental Zone Transfer in DNS (Ohta, 1996)
11. RFC 1996 -- A Mechanism for Prompt Notification of Zone Changes (Vixie, 1996)
12. RFC 2136 -- Dynamic Updates in the Domain Name System (Vixie et al., 1997)
13. RFC 2845 -- Secret Key Transaction Authentication for DNS (TSIG) (Vixie et al., 2000)
14. RFC 8945 -- Secret Key Transaction Authentication for DNS (TSIG Update) (Dupont et al., 2020)
15. Cloudflare DNS Documentation -- https://developers.cloudflare.com/dns/zone-setups/
16. RFC 2181 -- Clarifications to the DNS Specification (Elz and Bush, 1997)
17. PowerDNS Authoritative Server Documentation -- https://doc.powerdns.com/authoritative/
18. RFC 9499 -- DNS Terminology (Hoffman et al., 2024)

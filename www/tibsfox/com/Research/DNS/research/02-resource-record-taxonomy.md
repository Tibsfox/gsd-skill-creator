# Resource Record Taxonomy

> **Domain:** Internet Protocol / DNS
> **Module:** 2 -- Complete RR Type Catalog
> **Through-line:** *The type field is where DNS becomes infinite. Mockapetris gave every resource record a 16-bit type code and a variable-length RDATA field, then trusted the future to fill them in. Forty years later, that field carries IPv6 addresses, cryptographic keys, email routing tables, service discovery metadata, TLS certificate policies, and geographic coordinates. The protocol extended because it was designed with the right abstraction: "here is what kind of data follows" and "skip this many bytes if you don't understand it."*

---

## Table of Contents

1. [Record Classification](#1-record-classification)
2. [Core Record Types (RFC 1035)](#2-core-record-types-rfc-1035)
3. [Address Records: A and AAAA](#3-address-records-a-and-aaaa)
4. [Delegation Records: NS and SOA](#4-delegation-records-ns-and-soa)
5. [Alias and Pointer Records](#5-alias-and-pointer-records)
6. [Mail Exchange: MX](#6-mail-exchange-mx)
7. [Text Records: TXT](#7-text-records-txt)
8. [Extended Record Types](#8-extended-record-types)
9. [DNSSEC Record Types](#9-dnssec-record-types)
10. [Pseudo-RR Types](#10-pseudo-rr-types)
11. [Service Binding: SVCB and HTTPS](#11-service-binding-svcb-and-https)
12. [CLASS Values](#12-class-values)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Record Classification

DNS resource records fall into four functional categories, each serving a distinct role in the protocol architecture [1][2]:

| Category | Types | Purpose |
|----------|-------|---------|
| Address resolution | A, AAAA | Map names to IP addresses |
| Delegation & authority | NS, SOA, DS | Define zone structure and trust chains |
| Aliasing & indirection | CNAME, PTR, DNAME, NAPTR | Redirect queries to other names |
| Data & metadata | MX, TXT, SRV, CAA, TLSA, SSHFP | Carry application-specific data |
| Security | DNSKEY, RRSIG, NSEC, NSEC3, NSEC3PARAM | DNSSEC integrity and authentication |
| Extension | OPT | Protocol extension mechanism (EDNS0) |

The IANA DNS Parameters Registry maintains the authoritative list of assigned type codes. As of 2025, there are approximately 80 defined types, though many are experimental, obsolete, or restricted-use [3].

---

## 2. Core Record Types (RFC 1035)

The original DNS specification defined the fundamental record types that remain the backbone of every DNS deployment [1]:

| Type | Code | RDATA Format | Purpose |
|------|------|-------------|---------|
| A | 1 | 32-bit IPv4 address (4 bytes) | Host-to-IPv4 mapping |
| NS | 2 | Domain name (NSDNAME) | Authoritative name server for zone |
| CNAME | 5 | Domain name (canonical name) | Alias to another name |
| SOA | 6 | MNAME + RNAME + SERIAL + REFRESH + RETRY + EXPIRE + MINIMUM | Zone authority record |
| PTR | 12 | Domain name | Reverse DNS (IP-to-name mapping) |
| HINFO | 13 | CPU string + OS string | Host info (rarely used, privacy concern) |
| MX | 15 | 16-bit preference + domain name | Mail exchange routing |
| TXT | 16 | One or more character strings | Arbitrary text data |

---

## 3. Address Records: A and AAAA

### A Record (Type 1)

The A record maps a domain name to an IPv4 address. Its RDATA is exactly 4 bytes -- the 32-bit IPv4 address in network byte order [1]:

```
A RECORD RDATA (4 bytes)
================================================================
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|          IPv4 Address (32 bits / 4 octets)      |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

Zone file syntax:  example.com.  IN  A  93.184.216.34
Wire RDATA (hex):  5D B8 D8 22  (93.184.216.34)
```

### AAAA Record (Type 28)

The AAAA record (RFC 3596) maps a domain name to an IPv6 address. Its RDATA is exactly 16 bytes -- the 128-bit IPv6 address [4]:

```
AAAA RECORD RDATA (16 bytes)
================================================================
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                                                 |
|          IPv6 Address (128 bits / 16 octets)    |
|                                                 |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

Zone file syntax:  example.com.  IN  AAAA  2606:2800:21f:cb07:6820:80da:af6b:8b2c
```

A name may have both A and AAAA records. Modern resolvers typically query for both types simultaneously (RFC 8305 "Happy Eyeballs" algorithm) and connect to whichever address responds first, preferring IPv6 [5].

---

## 4. Delegation Records: NS and SOA

### NS Record (Type 2)

NS records specify the authoritative name servers for a zone. They appear in two places: at the zone apex (authoritative) and in the parent zone (delegation). The RDATA is a single domain name [1]:

```
NS RECORD RDATA
================================================================
NSDNAME: variable-length label-encoded domain name

Zone file syntax:  example.com.  IN  NS  ns1.example.com.
                   example.com.  IN  NS  ns2.example.com.
```

When NS records reference names *within* the delegated zone (as above), the parent zone must provide *glue records* -- A/AAAA records in the additional section -- to break the circular dependency [6].

### SOA Record (Type 6)

The SOA (Start of Authority) record is required at every zone apex. It defines the zone's administrative parameters and controls replication behavior. The seven fields are [1][7]:

| Field | Format | Recommended | Semantics |
|-------|--------|-------------|-----------|
| MNAME | Domain name | -- | Primary master name server FQDN |
| RNAME | Domain name | -- | Admin email (@ replaced with .) |
| SERIAL | 32-bit unsigned | YYYYMMDDnn | Zone version; secondary fetches if serial increases |
| REFRESH | 32-bit unsigned | 86400 (1 day) | Seconds between secondary SOA checks |
| RETRY | 32-bit unsigned | 7200 (2 hours) | Seconds between retries if primary unreachable |
| EXPIRE | 32-bit unsigned | 3600000 (~42 days) | Seconds before secondary stops serving if primary absent |
| MINIMUM | 32-bit unsigned | 3600 (1 hour) | Negative caching TTL (RFC 2308) |

```
SOA RECORD RDATA
================================================================
MNAME:   ns1.example.com.
RNAME:   admin.example.com.   (= admin@example.com)
SERIAL:  2026032701
REFRESH: 86400
RETRY:   7200
EXPIRE:  3600000
MINIMUM: 3600
```

The **SERIAL** field uses the YYYYMMDDnn convention by widespread practice (not by RFC requirement). The "nn" suffix allows up to 100 changes per day. Secondary servers compare their cached serial with the primary's serial; if the primary's is higher, a zone transfer is initiated [7][8].

---

## 5. Alias and Pointer Records

### CNAME Record (Type 5)

CNAME (Canonical Name) creates an alias. When a resolver encounters a CNAME, it restarts the query using the canonical name [1]:

```
CNAME RECORD RDATA
================================================================
CNAME: variable-length label-encoded canonical name

Zone file:  www.example.com.  IN  CNAME  example.com.
```

**Critical rule:** A name with a CNAME record must not have any other record types at the same name (except DNSSEC types RRSIG, NSEC, NSEC3). This is one of the most commonly violated DNS constraints and the reason CNAME cannot be used at the zone apex -- the zone apex must have SOA and NS records [1][6].

### PTR Record (Type 12)

PTR records provide reverse DNS lookups -- mapping IP addresses back to hostnames. IPv4 reverse lookups use the `in-addr.arpa` domain; IPv6 uses `ip6.arpa` [1]:

```
PTR RECORD EXAMPLES
================================================================
IPv4:  34.216.184.93.in-addr.arpa.  IN  PTR  example.com.
IPv6:  c.2.b.8.b.6.f.a.a.d.0.8...ip6.arpa.  IN  PTR  example.com.
```

### DNAME Record (Type 39, RFC 6672)

DNAME provides delegation-level aliasing: it redirects an entire subtree of the namespace to another domain. Unlike CNAME (which aliases a single name), DNAME aliases all names below the DNAME owner [9].

---

## 6. Mail Exchange: MX

MX records (Type 15) direct email delivery by specifying mail servers and their priority for a domain. The RDATA contains a 16-bit preference value and a domain name [1]:

```
MX RECORD RDATA
================================================================
PREFERENCE: 16-bit unsigned (lower = higher priority)
EXCHANGE:   variable-length label-encoded domain name

Zone file:  example.com.  IN  MX  10  mail1.example.com.
            example.com.  IN  MX  20  mail2.example.com.
```

Mail servers try MX records in preference order (lowest first). If the lowest-preference server is unreachable, the next is tried. Equal-preference MX records are load-balanced randomly (RFC 5321) [10].

MX records *must* point to A or AAAA records, never to CNAMEs (RFC 2181). This requirement avoids an extra resolution step that could fail independently, breaking mail delivery [6].

---

## 7. Text Records: TXT

TXT records (Type 16) carry arbitrary text data. Originally intended for human-readable information, TXT records have become the universal extension mechanism for DNS-based verification [1]:

**Common TXT Record Uses:**
- **SPF** (Sender Policy Framework): `v=spf1 include:_spf.google.com ~all`
- **DKIM** (DomainKeys Identified Mail): Public key for email signature verification
- **DMARC**: `v=DMARC1; p=reject; rua=mailto:dmarc@example.com`
- **Domain verification**: Google, Microsoft, and other services use TXT records to verify domain ownership
- **ACME challenges**: Let's Encrypt DNS-01 challenges use `_acme-challenge.example.com` TXT records

TXT RDATA consists of one or more character strings, each prefixed by a 1-byte length. The total RDATA can be up to 65,535 bytes, but individual strings are limited to 255 bytes. Long TXT records (like DKIM keys) must be split across multiple strings [1][11].

---

## 8. Extended Record Types

| Type | Code | RDATA Format | Purpose | RFC |
|------|------|-------------|---------|-----|
| AAAA | 28 | 128-bit IPv6 address | Host-to-IPv6 mapping | 3596 |
| SRV | 33 | Priority + Weight + Port + Target | Service location | 2782 |
| NAPTR | 35 | Order + Preference + Flags + Service + Regexp + Replacement | DDDS / VoIP ENUM | 3403 |
| DS | 43 | Key Tag + Algorithm + Digest Type + Digest | DNSSEC delegation signer | 4034 |
| SSHFP | 44 | Algorithm + Fingerprint Type + Fingerprint | SSH key fingerprint | 4255 |
| TLSA | 52 | Cert Usage + Selector + Matching Type + Cert Assoc Data | DANE TLS cert binding | 6698 |
| CAA | 257 | Flags + Tag + Value | CA authorization control | 8659 |

### SRV Record (Type 33)

SRV records enable service discovery -- locating the server and port for a specific service. Used extensively by Active Directory, SIP, XMPP, and Kubernetes [12]:

```
SRV RECORD RDATA
================================================================
PRIORITY: 16-bit (lower = higher priority)
WEIGHT:   16-bit (load balancing among equal-priority records)
PORT:     16-bit (TCP/UDP port number)
TARGET:   domain name of the service host

Zone file:  _sip._tcp.example.com.  IN  SRV  10  60  5060  sip1.example.com.
            _sip._tcp.example.com.  IN  SRV  10  40  5060  sip2.example.com.
```

### CAA Record (Type 257)

CAA (Certificate Authority Authorization) records specify which CAs are permitted to issue certificates for a domain. CAs are required to check CAA records before issuance (RFC 8659). This is a critical security control [13]:

```
CAA RECORD EXAMPLES
================================================================
example.com.  IN  CAA  0  issue  "letsencrypt.org"
example.com.  IN  CAA  0  issuewild  "letsencrypt.org"
example.com.  IN  CAA  0  iodef  "mailto:security@example.com"
```

---

## 9. DNSSEC Record Types

| Type | Code | Purpose | RFC |
|------|------|---------|-----|
| DNSKEY | 48 | Zone public key (KSK and ZSK) | 4034 |
| RRSIG | 46 | Digital signature over an RRset | 4034 |
| NSEC | 47 | Authenticated denial of existence | 4034 |
| NSEC3 | 50 | Hashed authenticated denial (prevents zone enumeration) | 5155 |
| NSEC3PARAM | 51 | NSEC3 zone parameters | 5155 |
| DS | 43 | Delegation signer (parent-to-child trust link) | 4034 |
| CDS | 59 | Child DS (automated key rollover) | 7344 |
| CDNSKEY | 60 | Child DNSKEY (automated key rollover) | 7344 |

These types form the DNSSEC cryptographic chain of trust. Full specifications for each type's wire format, signing semantics, and validation procedures are covered in Module 5 [14][15][16].

> **Related:** [DNSSEC](05-dnssec.md) for complete DNSKEY/RRSIG/DS/NSEC wire format specifications and the chain of trust validation algorithm

---

## 10. Pseudo-RR Types

### OPT Record (Type 41)

OPT is not a real resource record -- it exists only in the additional section and is used by EDNS0 to carry extension information. Its fields are repurposed from the standard RR format [17]:

```
OPT PSEUDO-RR WIRE FORMAT
================================================================
NAME      : 0x00 (root domain -- always empty)
TYPE      : 41
CLASS     : Sender's UDP payload size (e.g., 0x1000 = 4096 bytes)
TTL       : Extended RCODE (8 bits) | EDNS Version (8 bits) | EDNS Flags (16 bits)
            -- DO bit at position 15 of flags = "DNSSEC OK"
RDLENGTH  : Length of options
RDATA     : {OPTION-CODE (16) | OPTION-LENGTH (16) | OPTION-DATA (variable)} ...
```

There must be at most one OPT record per message. The CLASS field carries the UDP payload size advertisement. The TTL field is split into four subfields: extended RCODE (8 bits, combined with the header's 4-bit RCODE), EDNS version (8 bits, currently only 0), and a 16-bit flags field where the DO bit signals DNSSEC support [17].

### TSIG Pseudo-RR (Type 250)

TSIG (Transaction Signature) provides message-level authentication using shared secret keys. It is carried as the last record in the additional section and authenticates the entire DNS message. TSIG is the standard mechanism for authenticating zone transfers (AXFR/IXFR) between primary and secondary servers [18].

---

## 11. Service Binding: SVCB and HTTPS

RFC 9460 (2023) introduced SVCB (Type 64) and HTTPS (Type 65) records for service binding. HTTPS records replace the SRV+A/AAAA+TXT combination for web services, enabling single-query resolution of connection parameters [19]:

```
HTTPS RECORD RDATA
================================================================
PRIORITY:    16-bit (0 = alias mode, >0 = service mode)
TARGETNAME:  domain name (. = use owner name)
SVCPARAMS:   key=value pairs (alpn, port, ipv4hint, ipv6hint, ech)

Zone file:  example.com.  IN  HTTPS  1  .  alpn="h2,h3" ipv4hint=93.184.216.34
```

HTTPS records carry ALPN (Application-Layer Protocol Negotiation) hints, IP address hints for connection racing, and Encrypted Client Hello (ECH) keys -- allowing a browser to establish an encrypted HTTPS connection with a single DNS query, eliminating multiple round trips [19].

---

## 12. CLASS Values

| Class | Code | Usage |
|-------|------|-------|
| IN | 1 | Internet -- used for virtually all production DNS |
| CH | 3 | Chaosnet -- used for BIND version queries and diagnostics |
| HS | 4 | Hesiod -- Athena project, effectively obsolete |
| NONE | 254 | Used in DNS UPDATE to delete records (RFC 2136) |
| ANY | 255 | QCLASS only -- requests any class (rare, deprecated by RFC 8482) |

For all practical purposes, IN (Internet) is the only class in use. The class field exists because DNS was designed to be a general-purpose naming system, not just for the Internet [1][6].

---

## 13. Cross-References

> **Related:** [Wire Protocol](01-wire-protocol-message-format.md) -- how these record types are carried in DNS messages; [Zone Management](04-zone-management.md) -- zone file syntax for each record type; [DNSSEC](05-dnssec.md) -- complete DNSKEY/RRSIG/NSEC specifications; [Resolution Architecture](03-resolution-architecture.md) -- how record types interact during resolution

**Related PNW Research Projects:**
- **K8S** -- Kubernetes uses SRV records extensively for service discovery; CoreDNS is the default cluster DNS
- **WPH** -- Weekly Phone covers NAPTR and SRV records for VoIP/SIP routing
- **MCF** -- Multi-Cluster Federation uses DNS for cross-cluster service discovery
- **SYS** -- Systems Administration covers operational deployment of record types
- **RFC** -- RFC Archive covers the standards process that defines these types
- **CMH** -- Computational Mesh covers DNS-based service mesh discovery

---

## 14. Sources

1. RFC 1035 -- Domain Names: Implementation and Specification (Mockapetris, 1987)
2. RFC 9499 -- DNS Terminology (Hoffman et al., 2024)
3. IANA DNS Parameters Registry -- https://www.iana.org/assignments/dns-parameters
4. RFC 3596 -- DNS Extensions to Support IP Version 6 (Thomson et al., 2003)
5. RFC 8305 -- Happy Eyeballs Version 2 (Schinazi and Pauly, 2017)
6. RFC 2181 -- Clarifications to the DNS Specification (Elz and Bush, 1997)
7. RFC 1034 -- Domain Names: Concepts and Facilities (Mockapetris, 1987)
8. RFC 1912 -- Common DNS Operational and Configuration Errors (Barr, 1996)
9. RFC 6672 -- DNAME Redirection in the DNS (Rose and Wijngaards, 2012)
10. RFC 5321 -- Simple Mail Transfer Protocol (Klensin, 2008)
11. RFC 7208 -- Sender Policy Framework (SPF) (Kitterman, 2014)
12. RFC 2782 -- A DNS RR for Specifying the Location of Services (SRV) (Gulbrandsen et al., 2000)
13. RFC 8659 -- DNS Certification Authority Authorization (CAA) Resource Record (Hallam-Baker et al., 2019)
14. RFC 4034 -- Resource Records for the DNS Security Extensions (Arends et al., 2005)
15. RFC 5155 -- DNSSEC Hashed Authenticated Denial of Existence (Laurie et al., 2008)
16. RFC 7344 -- Automating DNSSEC Delegation Trust Maintenance (Kumari et al., 2014)
17. RFC 6891 -- Extension Mechanisms for DNS (EDNS(0)) (Damas et al., 2013)
18. RFC 2845 -- Secret Key Transaction Authentication for DNS (TSIG) (Vixie et al., 2000)
19. RFC 9460 -- Service Binding and Parameter Specification via DNS (Schwartz et al., 2023)
20. RFC 4255 -- Using DNS to Securely Publish SSH Key Fingerprints (Schlyter and Griffin, 2006)

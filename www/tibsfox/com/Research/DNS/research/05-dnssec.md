# DNSSEC -- DNS Security Extensions

> **Domain:** Internet Protocol / DNS
> **Module:** 5 -- Cryptographic Chain of Trust
> **Through-line:** *DNS was designed in 1983 without authentication. Any server along the resolution path could forge a response, and the resolver had no way to detect the forgery. DNSSEC fixes this by adding cryptographic signatures to DNS data -- not encrypting it, but proving that the answer came from the zone owner and wasn't modified in transit. The chain of trust runs from the root zone's key signing key, hardcoded in every validating resolver on the planet, down through the TLD to the individual zone. It is public-key cryptography applied to a distributed database at planetary scale.*

---

## Table of Contents

1. [DNSSEC Overview](#1-dnssec-overview)
2. [The Problem DNSSEC Solves](#2-the-problem-dnssec-solves)
3. [DNSKEY Records](#3-dnskey-records)
4. [RRSIG Records](#4-rrsig-records)
5. [DS Records and Delegation of Trust](#5-ds-records-and-delegation-of-trust)
6. [The Chain of Trust](#6-the-chain-of-trust)
7. [Authenticated Denial: NSEC](#7-authenticated-denial-nsec)
8. [Hashed Denial: NSEC3](#8-hashed-denial-nsec3)
9. [Resolver Validation Algorithm](#9-resolver-validation-algorithm)
10. [Zone Signing Procedure](#10-zone-signing-procedure)
11. [Key Rollover](#11-key-rollover)
12. [Deployment Status](#12-deployment-status)
13. [Attack Taxonomy](#13-attack-taxonomy)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. DNSSEC Overview

DNSSEC (DNS Security Extensions) provides origin authentication and integrity verification for DNS data. Defined across RFCs 4033, 4034, and 4035, DNSSEC adds four new record types to DNS: DNSKEY, RRSIG, DS, and NSEC/NSEC3 [1][2][3]:

**What DNSSEC provides:**
- **Origin authentication:** Proof that the response came from the zone owner, not an impersonator
- **Data integrity:** Proof that the response was not modified in transit
- **Authenticated denial of existence:** Cryptographic proof that a queried name or type does not exist

**What DNSSEC does NOT provide:**
- **Confidentiality:** DNS queries and responses remain plaintext (use DoT/DoH for privacy)
- **DDoS protection:** DNSSEC does not prevent denial-of-service attacks
- **Authorization:** DNSSEC does not control who can query what
- **Availability:** DNSSEC can *reduce* availability through validation failures (clock skew, expired signatures, misconfigured trust chains)

As of March 2026, the root zone and all generic TLDs are DNSSEC-signed. Approximately 45% of ccTLDs are signed. Second-level domain adoption exceeds 50% in the Netherlands (.nl), Czech Republic (.cz), Norway (.no), Sweden (.se), and Niue (.nu) [4].

---

## 2. The Problem DNSSEC Solves

### Cache Poisoning (Kaminsky Attack, 2008)

Without DNSSEC, a recursive resolver has no way to verify that a response is authentic. The resolver matches responses to queries using only three fields: the transaction ID (16-bit), the source port (16-bit for randomized ports), and the queried name. In 2008, Dan Kaminsky demonstrated that an attacker could flood a resolver with forged responses, each guessing the transaction ID, and statistically poison the cache within seconds [5][6]:

```
CACHE POISONING ATTACK
================================================================

1. Attacker triggers query: random123.example.com IN A
2. Resolver sends iterative query to example.com NS
3. Before real answer arrives, attacker floods resolver with forged responses:
   - Matching random123.example.com
   - Spoofed source IP of example.com NS
   - Guessing transaction ID (1 in 65,536 chance per packet)
   - AUTHORITY section contains: example.com NS attacker.evil.com
4. If a forged response is accepted, resolver caches:
   "example.com is served by attacker.evil.com"
5. All subsequent queries for *.example.com go to attacker

DNSSEC mitigation: The forged response lacks valid RRSIG signatures.
A validating resolver detects the forgery and discards it.
```

Source port randomization (RFC 5452) raised the birthday attack complexity, but DNSSEC is the only complete solution -- it provides cryptographic proof that cannot be forged without the zone's private key [6][7].

---

## 3. DNSKEY Records

DNSKEY (Type 48) carries the public key used to verify RRSIG signatures. Each DNSSEC-signed zone has at least one DNSKEY record at the zone apex [2]:

### DNSKEY RDATA Format

```
DNSKEY RDATA WIRE FORMAT
================================================================

Flags     : 16-bit
Protocol  : 8-bit  (must be 3)
Algorithm : 8-bit
Public Key: variable-length base64-encoded key material

Flags field:
  Bit 7 (0x0100): Zone Key flag -- must be set for zone signing keys
  Bit 8 (0x0001): SEP (Secure Entry Point) -- marks KSK
```

### KSK vs ZSK

| Property | Key Signing Key (KSK) | Zone Signing Key (ZSK) |
|----------|----------------------|----------------------|
| Flags | 257 (Zone Key + SEP) | 256 (Zone Key only) |
| Signs | Only the DNSKEY RRset | All other RRsets in the zone |
| Lifetime | 1-2 years (long) | 1-3 months (short) |
| DS in parent | Yes (parent holds DS for KSK) | No |
| Rollover impact | Requires parent DS update | Zone-local only |

The KSK/ZSK separation allows frequent ZSK rollovers (for key hygiene) without requiring the parent zone to update the DS record each time. Only KSK rollovers require parent coordination [2][3][8].

### Algorithm Codes

| Code | Algorithm | Status |
|------|-----------|--------|
| 5 | RSA/SHA-1 | Deprecated (RFC 8624) |
| 7 | RSASHA1-NSEC3-SHA1 | Deprecated |
| 8 | RSA/SHA-256 | Recommended |
| 10 | RSA/SHA-512 | Optional |
| 13 | ECDSA P-256/SHA-256 | Recommended (smaller signatures) |
| 14 | ECDSA P-384/SHA-384 | Optional |
| 15 | Ed25519 | Recommended (RFC 8080) |
| 16 | Ed448 | Optional |

Algorithm 13 (ECDSA P-256) produces 64-byte signatures compared to RSA-2048's 256-byte signatures, significantly reducing response size -- critical for staying within UDP payload limits [2][9].

---

## 4. RRSIG Records

RRSIG (Type 46) contains the digital signature over an RRset. Every signed RRset in a zone has a corresponding RRSIG record [2]:

### RRSIG RDATA Format

| Field | Size | Description |
|-------|------|-------------|
| Type Covered | 16-bit | The RR type being signed (e.g., 1 for A records) |
| Algorithm | 8-bit | Signing algorithm code |
| Labels | 8-bit | Number of labels in the owner name (for wildcard detection) |
| Original TTL | 32-bit | TTL of the signed RRset at signing time |
| Signature Expiration | 32-bit | UTC timestamp when signature expires |
| Signature Inception | 32-bit | UTC timestamp when signature becomes valid |
| Key Tag | 16-bit | Checksum to identify which DNSKEY was used |
| Signer's Name | variable | FQDN of the zone that holds the signing DNSKEY |
| Signature | variable | The actual cryptographic signature bytes |

### Signature Validity Window

RRSIG records have explicit inception and expiration timestamps. If the current time is outside this window, the signature is invalid. This means [2][3]:

- Zone operators must re-sign before signatures expire (typically every 1-4 weeks)
- Resolver clocks must be reasonably accurate (within the signature validity window)
- Clock skew between signer and validator can cause false validation failures

> **SAFETY WARNING:** DNSSEC validation failures result in SERVFAIL responses to clients -- the domain becomes unreachable. Expired signatures, misconfigured key rollovers, and clock skew are the three most common causes of DNSSEC outages. The 2020 .gov DNSSEC failure caused by expired signatures made multiple federal agency websites unreachable for hours [10].

---

## 5. DS Records and Delegation of Trust

DS (Delegation Signer, Type 43) is the bridge between parent and child zones. It is placed in the *parent* zone and contains a hash of the child's KSK, establishing a cryptographic link between the zones [2]:

### DS RDATA Format

| Field | Size | Description |
|-------|------|-------------|
| Key Tag | 16-bit | Identifies the child DNSKEY being referenced |
| Algorithm | 8-bit | Algorithm of the child DNSKEY |
| Digest Type | 8-bit | Hash algorithm: 1=SHA-1, 2=SHA-256, 4=SHA-384 |
| Digest | variable | Hash of the child's DNSKEY RDATA |

```
DS RECORD: PARENT-CHILD TRUST LINK
================================================================

Parent zone (.com) contains:
  example.com. DS 12345 13 2 <SHA-256 hash of example.com KSK>

This DS record says:
  "The zone example.com has a DNSKEY with tag 12345,
   using algorithm 13 (ECDSA P-256). Here is the SHA-256
   hash of that key. If you can fetch the DNSKEY from
   example.com and its hash matches this DS, the key is authentic."
```

DS records are managed at the registrar level. When a domain owner enables DNSSEC, they provide their KSK's DS record to their registrar, who inserts it into the parent zone [2][8].

---

## 6. The Chain of Trust

DNSSEC validation works by following a chain of cryptographic references from the queried record up to a configured trust anchor (the root KSK) [1][3]:

```
CHAIN OF TRUST
================================================================

Root KSK (trust anchor -- hardcoded in every validating resolver)
  |
  | Root zone contains DS record for .com
  | DS record is signed by root ZSK
  | Root ZSK is signed by root KSK (verifiable via trust anchor)
  v
.com KSK (validated via root DS)
  |
  | .com zone contains DS record for example.com
  | DS record is signed by .com ZSK
  | .com ZSK is signed by .com KSK (validated above)
  v
example.com KSK (validated via .com DS)
  |
  | example.com KSK signs the DNSKEY RRset
  | example.com ZSK signs all other RRsets
  v
www.example.com A 93.184.216.34
  RRSIG: signed by example.com ZSK
  -> ZSK verified by KSK
  -> KSK verified by parent DS
  -> ... chain verified up to root trust anchor
```

The root trust anchor is a specific DNSKEY record (currently key tag 20326, algorithm 8) that is distributed with every DNSSEC-validating resolver. This single key is the ultimate trust root for the entire DNSSEC system. It was last rolled in October 2018 (KSK-2017) [11][12].

---

## 7. Authenticated Denial: NSEC

NSEC (Type 47) provides authenticated denial of existence. It proves that a queried name or type does not exist by listing what *does* exist [2]:

### How NSEC Works

Each NSEC record contains:
- **Next Domain Name:** The next name in canonical (sorted) zone order
- **Type Bit Maps:** A bitmap of record types that exist at the current name

If a resolver queries `nonexistent.example.com`, the authoritative server returns the NSEC record that covers the gap where the name would exist in the sorted order:

```
NSEC DENIAL OF EXISTENCE
================================================================

Zone records (sorted):
  alpha.example.com.    A, AAAA, RRSIG, NSEC
  gamma.example.com.    A, MX, RRSIG, NSEC

NSEC chain:
  alpha.example.com. NSEC gamma.example.com. A AAAA RRSIG NSEC

Query: beta.example.com IN A
Response: NXDOMAIN + NSEC from alpha -> gamma
Proof: beta sorts between alpha and gamma, so beta does not exist.
```

### Zone Enumeration Vulnerability

NSEC's fatal flaw: an attacker can walk the entire zone by repeatedly querying for names just past each NSEC's "next domain name." Starting from the zone apex and following the NSEC chain reveals every name in the zone [2][13]:

```
NSEC ZONE WALKING
================================================================

Query: 0.example.com -> NSEC says next is alpha.example.com
Query: alpha0.example.com -> NSEC says next is gamma.example.com
Query: gamma0.example.com -> NSEC says next is mail.example.com
... continue until chain wraps to zone apex
```

This is not an attack on DNSSEC's integrity -- it is a privacy issue. NSEC3 (RFC 5155) was created to mitigate it [13].

---

## 8. Hashed Denial: NSEC3

NSEC3 (Type 50, RFC 5155) replaces name-based denial with hash-based denial to prevent zone enumeration [13]:

### How NSEC3 Works

Instead of listing the next domain name in cleartext, NSEC3 uses a cryptographic hash (SHA-1) of each owner name. The attacker can follow the hash chain but cannot reverse the hashes to discover the actual names.

### NSEC3 Parameters

| Field | Purpose |
|-------|---------|
| Hash Algorithm | Currently only 1 (SHA-1) |
| Flags | Bit 0: Opt-Out (skip unsigned delegations) |
| Iterations | Additional hash iterations (recommended: 0-10) |
| Salt | Random value mixed into hash computation (recommended: empty per RFC 9276) |

```
NSEC3 HASH CHAIN
================================================================

Zone names:          Hash (base32):
  example.com.    -> 2T7B4G4VSA5SMIBT...
  www.example.com -> B4UM86EGHHDS6NEA...
  mail.example.com-> IRGC31T7MMEQM7GI...

NSEC3 chain (sorted by hash):
  2T7B4G -> B4UM86  (types: A, NS, SOA, RRSIG, DNSKEY, NSEC3PARAM)
  B4UM86 -> IRGC31  (types: A, RRSIG)
  IRGC31 -> 2T7B4G  (types: A, MX, RRSIG)

Attacker sees hashes, not names. Cannot enumerate zone.
```

### NSEC3 Opt-Out

The Opt-Out flag allows NSEC3 chains to skip unsigned delegations. This is critical for large TLD zones like `.com` where millions of delegations are not DNSSEC-signed -- signing NSEC3 records for every unsigned delegation would be prohibitively expensive [13].

RFC 9276 (2022) provides updated guidance: use 0 iterations (no additional hashing beyond the initial hash) and empty salt. The original high-iteration-count recommendation was intended to slow offline dictionary attacks, but modern hardware makes this ineffective while still burdening legitimate resolvers [14].

---

## 9. Resolver Validation Algorithm

A DNSSEC-validating resolver receiving a signed response follows this procedure [3]:

1. **Signal DNSSEC support:** Send query with EDNS0 DO bit set (via OPT record) to request DNSSEC records alongside the answer
2. **Receive signed response:** Answer includes RRSIG records for each RRset
3. **Locate the signing key:** Match the RRSIG's Key Tag and Signer Name fields to a DNSKEY record
4. **Verify the DNSKEY:** Check that a DS record in the parent zone matches the DNSKEY (hash comparison)
5. **Walk the chain:** Follow DS -> DNSKEY links upward through each delegation until reaching a configured trust anchor
6. **Verify the signature:** Using the validated DNSKEY, cryptographically verify the RRSIG over the RRset
7. **Check validity window:** Verify current time is between RRSIG inception and expiration timestamps
8. **Set result:**
   - Validation succeeds: Set AD (Authenticated Data) bit in response to client
   - Validation fails: Return SERVFAIL (do not return unverified data)

```
VALIDATION DECISION TREE
================================================================

Is DO bit set in query?
  No  -> Return answer without DNSSEC records
  Yes -> Continue

Does answer include RRSIG?
  No  -> Is zone expected to be signed (DS in parent)?
         Yes -> Return SERVFAIL (should be signed but isn't)
         No  -> Return answer (unsigned zone, no expectation)
  Yes -> Continue

Can RRSIG Key Tag match a DNSKEY?
  No  -> Return SERVFAIL
  Yes -> Continue

Does DNSKEY hash match parent DS?
  No  -> Return SERVFAIL
  Yes -> Continue

Is RRSIG signature cryptographically valid?
  No  -> Return SERVFAIL
  Yes -> Continue

Is current time within [inception, expiration]?
  No  -> Return SERVFAIL
  Yes -> Set AD=1, return answer
```

---

## 10. Zone Signing Procedure

Signing a zone adds RRSIG records to every RRset, plus DNSKEY, NSEC/NSEC3, and NSEC3PARAM records [2][3]:

1. **Generate key pair:** Create KSK and ZSK using `dnssec-keygen` or equivalent
2. **Add DNSKEY records:** Insert both KSK and ZSK DNSKEY records at the zone apex
3. **Sign all RRsets:** Generate RRSIG records for every RRset using the ZSK
4. **Sign DNSKEY RRset:** Generate RRSIG for the DNSKEY RRset using the KSK
5. **Generate NSEC/NSEC3 chain:** Create denial-of-existence records covering all names and types
6. **Publish DS in parent:** Submit KSK's DS record to registrar for insertion in parent zone
7. **Re-sign periodically:** Before RRSIG expiration (typically every 7-14 days), regenerate all signatures

### Signing Tools

- **BIND:** `dnssec-signzone` (offline) or `dnssec-policy` (automatic inline signing)
- **PowerDNS:** Built-in DNSSEC support with `pdnsutil` commands
- **OpenDNSSEC:** Dedicated DNSSEC signing daemon with automated key management
- **Knot DNS:** Automatic online signing with built-in key management

---

## 11. Key Rollover

Key rollover is the process of replacing an expiring or compromised key with a new one. The rollover must be executed carefully to maintain the chain of trust throughout the transition [8][15]:

### ZSK Rollover (Pre-Publish Method)

1. **Introduce new ZSK:** Add new ZSK to DNSKEY RRset alongside old ZSK
2. **Wait for propagation:** Ensure all resolvers have cached the new DNSKEY (wait for old DNSKEY TTL to expire)
3. **Sign with new ZSK:** Re-sign all RRsets with the new ZSK
4. **Remove old ZSK:** After old RRSIG TTL expires from all caches, remove old ZSK from DNSKEY RRset

### KSK Rollover (Double-DS Method)

1. **Generate new KSK:** Create new KSK, add to DNSKEY RRset, sign DNSKEY RRset with both old and new KSK
2. **Add new DS to parent:** Submit new KSK's DS record to registrar (both old and new DS exist in parent)
3. **Wait for parent propagation:** Wait for old DS TTL to expire from all resolver caches
4. **Remove old KSK:** Remove old KSK from DNSKEY RRset
5. **Remove old DS from parent:** Request registrar to remove old DS record

The 2018 root KSK rollover (from KSK-2010 to KSK-2017) took 2 years to complete and was the first root key rollover in DNS history [11].

---

## 12. Deployment Status

As of March 2026 [4][16]:

| Zone Level | DNSSEC Adoption |
|-----------|-----------------|
| Root zone | Signed since July 2010 |
| Generic TLDs (.com, .org, .net) | 100% signed |
| ccTLDs | ~45% signed |
| .nl (Netherlands) | >60% of domains validate |
| .cz (Czech Republic) | >55% of domains validate |
| .se (Sweden) | >50% of domains validate |
| Global second-level domains | ~30% signed (varies widely) |
| Resolvers performing validation | ~30% of DNS traffic |

The gap between signing (zone has DNSSEC records) and validation (resolver checks DNSSEC) remains the primary deployment challenge. Unsigned zones cannot benefit from DNSSEC even if the resolver validates, and validating resolvers provide no benefit for unsigned zones [4].

---

## 13. Attack Taxonomy

| Attack | Mechanism | DNSSEC Mitigation | Other Mitigations |
|--------|-----------|-------------------|-------------------|
| Cache poisoning | Forge responses with guessed transaction ID | RRSIG verification rejects forged data | Source port randomization (RFC 5452), DNS cookies (RFC 7873) |
| DNS amplification DDoS | Spoof source IP, send small queries to open resolvers, amplified responses hit victim | Not mitigated by DNSSEC (may worsen -- signed responses are larger) | Response Rate Limiting (RRL), BCP38 source validation |
| Zone enumeration | Walk NSEC chain to discover all zone names | NSEC3 hashed denial prevents name discovery | Use NSEC3 with 0 iterations (RFC 9276) |
| DNS hijacking | Compromise NS records or registrar account to redirect a domain | DS record in parent prevents undetected key replacement | Registrar lock, multi-factor auth, ICANN registry lock |
| NXDOMAIN flooding | Send queries for random non-existent subdomains to overwhelm authoritative server | Aggressive NSEC caching (RFC 8198) can answer some locally | Rate limiting, response policy zones (RPZ) |

> **SAFETY WARNING:** DNSSEC increases DNS response sizes (RRSIG records add 100-300 bytes per RRset). This makes DNSSEC-signed zones more effective as amplification attack reflectors. DNS operators must deploy Response Rate Limiting (RRL) alongside DNSSEC to mitigate amplification risk [3][17].

---

## 14. Cross-References

> **Related:** [Wire Protocol](01-wire-protocol-message-format.md) -- AD/CD flag bits, EDNS0 DO bit; [Resource Records](02-resource-record-taxonomy.md) -- DNSKEY/RRSIG/DS/NSEC wire formats; [Resolution](03-resolution-architecture.md) -- how validation integrates with the resolution walk; [Zone Management](04-zone-management.md) -- zone signing procedures and key storage; [Extensions](06-modern-extensions-privacy.md) -- EDNS0 DO bit and encrypted transport for DNSSEC responses

**Related PNW Research Projects:**
- **FCC** -- FCC Catalog covers the regulatory framework for the infrastructure DNSSEC protects
- **PSS** -- PNW Signal Stack covers DNSSEC as part of the security layer in network architecture
- **CMH** -- Computational Mesh covers certificate management that DNSSEC (via DANE/TLSA) can enhance
- **SYS** -- Systems Administration covers DNSSEC deployment and monitoring in production
- **RFC** -- RFC Archive covers the IETF process that produced the DNSSEC standards
- **K8S** -- Kubernetes covers DNSSEC validation in cluster DNS configurations

---

## 15. Sources

1. RFC 4033 -- DNS Security Introduction and Requirements (Arends et al., 2005)
2. RFC 4034 -- Resource Records for the DNS Security Extensions (Arends et al., 2005)
3. RFC 4035 -- Protocol Modifications for the DNS Security Extensions (Arends et al., 2005)
4. APNIC DNSSEC Deployment Maps -- https://stats.labs.apnic.net/dnssec
5. Kaminsky, D. -- "Black Ops 2008: It's the End of the Cache as We Know It" (Black Hat USA, 2008)
6. RFC 5452 -- Measures for Making DNS More Resilient against Forged Answers (Hubert and van Mook, 2009)
7. RFC 7873 -- Domain Name System (DNS) Cookies (Eastlake and Andrews, 2016)
8. RFC 6781 -- DNSSEC Operational Practices, Version 2 (Kolkman et al., 2012)
9. RFC 8624 -- Algorithm Implementation Requirements and Usage Guidance for DNSSEC (Wouters and Sury, 2019)
10. Krebs, B. -- ".gov DNSSEC outage" (Krebs on Security, 2020)
11. ICANN Root KSK Rollover -- https://www.icann.org/resources/pages/ksk-rollover
12. IANA Trust Anchor Publication -- https://data.iana.org/root-anchors/
13. RFC 5155 -- DNSSEC Hashed Authenticated Denial of Existence (Laurie et al., 2008)
14. RFC 9276 -- Guidance for NSEC3 Parameter Settings (Hardaker and Dukhovni, 2022)
15. RFC 7583 -- DNSSEC Key Rollover Timing Considerations (Morris et al., 2015)
16. DNSSEC.net Operational Reference -- https://dnssec.net
17. RFC 8914 -- Extended DNS Errors (Kumari et al., 2020)
18. RFC 9364 -- DNS Security Extensions (DNSSEC) Best Current Practice (Hoffman, 2023)
19. RFC 6840 -- Clarifications and Implementation Notes for DNSSEC (Weiler and Blacka, 2013)

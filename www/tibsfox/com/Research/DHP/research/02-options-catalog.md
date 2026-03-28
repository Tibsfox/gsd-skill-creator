# Options Catalog

> **Domain:** Network Protocols -- Internet Infrastructure Layer
> **Module:** 2 -- DHCP Option Encoding, RFC 2132 Base Set, and Extended Registry
> **Through-line:** *The magic cookie bytes 99.130.83.99 guard the entrance to the options field like sentinels.* Past them lies a TLV-encoded catalog that configures everything a networked device needs to know: subnet mask, default gateway, DNS servers, lease duration, and hundreds more. The 8-bit option code space (0-255) holds the entire parameter vocabulary of IPv4 network configuration.

---

## Table of Contents

1. [TLV Encoding Architecture](#1-tlv-encoding-architecture)
2. [Magic Cookie and Field Structure](#2-magic-cookie-and-field-structure)
3. [Pad and End: The Sentinel Options](#3-pad-and-end-the-sentinel-options)
4. [RFC 1497 Vendor Extensions](#4-rfc-1497-vendor-extensions)
5. [IP Layer Parameters](#5-ip-layer-parameters)
6. [DHCP-Specific Extensions (Codes 50-61)](#6-dhcp-specific-extensions-codes-50-61)
7. [Post-RFC 2132 Critical Options](#7-post-rfc-2132-critical-options)
8. [Option Categories and Organization](#8-option-categories-and-organization)
9. [Option Encoding Examples](#9-option-encoding-examples)
10. [Option Overloading](#10-option-overloading)
11. [The IANA Registry](#11-the-iana-registry)
12. [Option Interaction and Dependencies](#12-option-interaction-and-dependencies)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. TLV Encoding Architecture

Every DHCP option (except Pad and End) uses Type-Length-Value encoding: one byte for the option code (type), one byte for the data length (count of subsequent data bytes, not including the code and length bytes themselves), followed by the data payload. This format allows parsers to skip unknown options by reading the length byte and advancing that many bytes [1].

```
TLV ENCODING -- GENERAL FORMAT
================================================================

+--------+--------+--------+--------+-- ... --+--------+
|  Code  | Length |  Data byte 1    |         | Data N |
| 1 byte | 1 byte|                  |         |        |
+--------+--------+--------+--------+-- ... --+--------+

Length = N (number of data bytes only; does not count Code or Length bytes)
Maximum data length per single option: 255 bytes
Total option overhead per option: 2 bytes (code + length)
```

The single-byte length field limits individual option data to 255 bytes. For options requiring more data (such as large domain search lists), RFC 3396 defines option concatenation: the same option code appears multiple times, and the data is concatenated in order of appearance [2].

All multi-byte quantities within option data are in **network byte order** (big-endian). IP addresses are 4 bytes in network order. Lists of IP addresses are packed consecutively with no separators; the length field divided by 4 gives the number of addresses [1].

---

## 2. Magic Cookie and Field Structure

The options field begins at byte offset 236 of the DHCP packet. The first four bytes are the **magic cookie**: 99, 130, 83, 99 (hex: 0x63, 0x82, 0x53, 0x63). These bytes identify the remainder of the field as DHCP/BOOTP vendor extensions [1].

The magic cookie value traces back to RFC 1497 (BOOTP Vendor Information Extensions, 1993) and ultimately to RFC 1048. It is a fixed, non-negotiable constant. Packets without the correct magic cookie at byte 236 are not treated as carrying DHCP options [3].

After the magic cookie, TLV-encoded options follow in any order until the End option (code 255) is encountered. The End option terminates parsing; any bytes after it are ignored.

---

## 3. Pad and End: The Sentinel Options

Two options have special single-byte encodings without length or value fields:

**Pad Option (Code 0):** Used for alignment purposes. Parsers encountering code 0 advance by exactly one byte. Pad options may appear anywhere in the options field and carry no semantic meaning [1].

**End Option (Code 255):** Marks the end of valid options. All bytes after the End option are ignored. Every well-formed options field must contain an End option. If the options field is smaller than the available space, the End option signals where meaningful data stops [1].

```
SENTINEL OPTIONS -- SPECIAL FORMAT
================================================================

Pad:   +------+        End:   +------+
       | 0x00 |               | 0xFF |
       +------+               +------+
       1 byte only            1 byte only
       No length field        No length field
       No data field          No data field
```

---

## 4. RFC 1497 Vendor Extensions

The original BOOTP vendor extension options (codes 1-18) provide basic network configuration parameters. These are the most universally used DHCP options [1][3].

| Code | Name | Length | Description | Source |
|------|------|--------|-------------|--------|
| 1 | Subnet Mask | 4 | Client's subnet mask. Must precede Router (option 3) if both present | RFC 2132 S3.3 |
| 2 | Time Offset | 4 | Signed 32-bit seconds offset from UTC | RFC 2132 S3.4 |
| 3 | Router | 4n | Ordered list of default gateways on client's subnet (preference order) | RFC 2132 S3.5 |
| 4 | Time Server | 4n | RFC 868 time protocol servers | RFC 2132 S3.6 |
| 5 | Name Server | 4n | IEN 116 name servers (obsolete) | RFC 2132 S3.7 |
| 6 | Domain Name Server | 4n | DNS recursive resolver addresses (RFC 1035) | RFC 2132 S3.8 |
| 7 | Log Server | 4n | MIT-LCS UDP log servers | RFC 2132 S3.9 |
| 8 | Cookie Server | 4n | RFC 865 cookie/quote servers | RFC 2132 S3.10 |
| 9 | LPR Server | 4n | RFC 1179 line printer daemon servers | RFC 2132 S3.11 |
| 10 | Impress Server | 4n | Imagen Impress network image servers | RFC 2132 S3.12 |
| 11 | Resource Location Server | 4n | RFC 887 resource location servers | RFC 2132 S3.13 |
| 12 | Host Name | n | Client's hostname string | RFC 2132 S3.14 |
| 13 | Boot File Size | 2 | Number of 512-byte blocks in boot file | RFC 2132 S3.15 |
| 14 | Merit Dump File | n | Path for client core dump | RFC 2132 S3.16 |
| 15 | Domain Name | n | Client's DNS domain name for resolution | RFC 2132 S3.17 |
| 16 | Swap Server | 4 | Client's swap server IP | RFC 2132 S3.18 |
| 17 | Root Path | n | Client's root disk path (NFS) | RFC 2132 S3.19 |
| 18 | Extensions Path | n | Path to BOOTP extensions file | RFC 2132 S3.20 |

Options 3 (Router) and 6 (Domain Name Server) are the most operationally critical. In typical deployments, a DHCP client receives its default gateway from option 3 and its DNS resolver addresses from option 6. Without these two options, a client can reach the local subnet but cannot route to remote destinations or resolve hostnames [1].

---

## 5. IP Layer Parameters

Options 19-33 configure IP layer behavior. These are less commonly used than the vendor extensions but important in specialized deployments [1].

| Code | Name | Length | Description | Source |
|------|------|--------|-------------|--------|
| 19 | IP Forwarding | 1 | 0=disabled, 1=enabled. Controls whether client forwards IP datagrams | RFC 2132 S4.1 |
| 20 | Non-Local Source Routing | 1 | 0=disabled. Controls source-routed datagram forwarding | RFC 2132 S4.2 |
| 21 | Policy Filter | 8n | Pairs of (destination, mask) for source-route filtering | RFC 2132 S4.3 |
| 22 | Max Datagram Reassembly | 2 | Minimum 576 bytes per RFC 1122 | RFC 2132 S4.4 |
| 23 | Default IP TTL | 1 | Default time-to-live for outgoing datagrams | RFC 2132 S4.5 |
| 26 | Interface MTU | 2 | MTU for the client's connected interface. Minimum 68 bytes | RFC 2132 S5.1 |
| 27 | All Subnets Local | 1 | 1 = all subnets share the same MTU | RFC 2132 S5.2 |
| 28 | Broadcast Address | 4 | Broadcast address for client's subnet | RFC 2132 S5.3 |
| 29 | Perform Mask Discovery | 1 | 1 = client should use ICMP to discover subnet mask | RFC 2132 S5.4 |
| 31 | Perform Router Discovery | 1 | 1 = client should use RFC 1256 router discovery | RFC 2132 S5.6 |
| 33 | Static Route | 8n | Pairs of (destination, router) for static routes. Superseded by option 121 | RFC 2132 S5.8 |

---

## 6. DHCP-Specific Extensions (Codes 50-61)

These options are specific to DHCP operations (not present in BOOTP). They control lease negotiation, server identification, and protocol mechanics [1].

| Code | Name | Length | Description | Source |
|------|------|--------|-------------|--------|
| 50 | Requested IP Address | 4 | Client's preferred IP address in DISCOVER or REQUEST | RFC 2132 S9.1 |
| 51 | IP Address Lease Time | 4 | Lease duration in seconds (unsigned 32-bit). Max: ~136 years. Special value 0xFFFFFFFF = infinite lease | RFC 2132 S9.2 |
| 52 | Option Overload | 1 | 1=file field carries options, 2=sname carries options, 3=both | RFC 2132 S9.3 |
| 53 | DHCP Message Type | 1 | **Required in ALL DHCP messages.** Values 1-8 (DISCOVER through INFORM) | RFC 2132 S9.6 |
| 54 | Server Identifier | 4 | DHCP server's IP address. Used by client to select offer; used in renewal for unicast target | RFC 2132 S9.7 |
| 55 | Parameter Request List | n | List of option codes (1 byte each) that client wants server to include in response | RFC 2132 S9.8 |
| 56 | Message | n | Human-readable error text in DHCPNAK or DHCPDECLINE | RFC 2132 S9.9 |
| 57 | Maximum DHCP Message Size | 2 | Largest DHCP message client will accept. Minimum: 576 bytes | RFC 2132 S9.10 |
| 58 | Renewal (T1) Time Value | 4 | Seconds from lease start until client enters RENEWING state. Default: 50% of lease | RFC 2132 S9.11 |
| 59 | Rebinding (T2) Time Value | 4 | Seconds from lease start until client enters REBINDING state. Default: 87.5% of lease | RFC 2132 S9.12 |
| 60 | Vendor Class Identifier | n | Client's vendor/hardware class (e.g., "MSFT 5.0" for Microsoft DHCP client) | RFC 2132 S9.13 |
| 61 | Client Identifier | n | Unique client ID. When present, overrides chaddr for server's client tracking | RFC 2132 S9.14 |

Option 53 (DHCP Message Type) is the single most important DHCP option. Without it, a packet is a BOOTP message, not a DHCP message. Every DHCP packet must include option 53, and its value (1-8) determines the message's semantics entirely [1].

Option 55 (Parameter Request List) is how clients communicate their configuration needs. A typical client sends option 55 containing codes like [1, 3, 6, 15, 28, 51] to request subnet mask, router, DNS server, domain name, broadcast address, and lease time. Servers are not obligated to honor every requested option but typically respond with as many as they can [1].

---

## 7. Post-RFC 2132 Critical Options

Numerous options have been standardized after RFC 2132. These address modern networking requirements that the original specification did not anticipate [4].

| Code | Name | Length | RFC | Description |
|------|------|--------|-----|-------------|
| 66 | TFTP Server Name | n | RFC 2132 | TFTP server hostname for PXE network booting |
| 67 | Bootfile Name | n | RFC 2132 | Boot file name for PXE. Supersedes the fixed `file` header field |
| 82 | Relay Agent Information | n | RFC 3046 | Sub-options from relay agent: Circuit ID (sub-option 1), Remote ID (sub-option 2). Critical for ISP per-subscriber identification |
| 90 | Authentication | n | RFC 3118 | DHCP message authentication. Delayed auth mechanism with shared secrets. Rarely deployed |
| 93 | Client System Architecture | 2 | RFC 4578 | PXE client architecture type (x86 BIOS, x86 UEFI, ARM, etc.) |
| 97 | Client Machine Identifier | n | RFC 4578 | Client's UUID/GUID for PXE boot matching |
| 100 | PCode (TZ-POSIX) | n | RFC 4833 | POSIX-style timezone string |
| 101 | TCode (TZ-Database) | n | RFC 4833 | TZ database timezone name (e.g., "America/Los_Angeles") |
| 114 | DHCP Captive Portal | n | RFC 8910 | URL for captive portal access. Used in Wi-Fi hotspot authentication |
| 119 | Domain Search | n | RFC 3397 | DNS domain search list using compressed name encoding (RFC 1035 Section 4.1.4) |
| 121 | Classless Static Route | n | RFC 3442 | Classless static routes using CIDR notation. Supersedes option 33 which could only express classful routes |
| 125 | V-I Vendor-Specific | n | RFC 3925 | Vendor-specific information organized by enterprise number |
| 150 | TFTP Server Address | 4n | RFC 5859 | List of TFTP server IP addresses for Cisco VoIP phone provisioning |
| 176-208 | Site-Specific | varies | varies | Reserved for site-specific use by individual organizations |
| 252 | WPAD URL | n | Internet-Draft | Web Proxy Auto-Discovery URL. Widely deployed despite never reaching RFC status. Security concerns documented extensively |

Option 82 (Relay Agent Information) is particularly significant in carrier and enterprise networks. When a relay agent appends Circuit ID (identifying the physical port or DSLAM slot) and Remote ID (identifying the subscriber), the DHCP server can assign addresses based on physical location rather than just MAC address. This enables per-port IP assignment in ISP access networks [5].

Option 121 (Classless Static Route) is the modern replacement for option 33 (Static Route). Where option 33 could only express routes as destination-gateway pairs using classful addressing, option 121 uses CIDR notation (prefix length + destination + gateway), supporting modern variable-length subnet masking [6].

---

## 8. Option Categories and Organization

RFC 2132 organizes the option space into seven logical categories [1]:

1. **RFC 1497 Vendor Extensions (codes 1-18):** Historical BOOTP compatibility; network fundamentals
2. **IP Layer Parameters per Host (codes 19-25):** Forwarding, TTL, source routing
3. **IP Layer Parameters per Interface (codes 26-33):** MTU, broadcast, subnet, static routes
4. **Link Layer Parameters per Interface (codes 34-36):** Trailer encapsulation, ARP cache timeout
5. **TCP Parameters (codes 37-39):** Default TTL, keepalive interval
6. **Application and Service Parameters (codes 40-49, 62-76):** NIS, NTP, NETBIOS, SMTP, POP3, TFTP
7. **DHCP Extensions (codes 50-61):** Lease negotiation, message type, server ID, parameter request

The **site-specific range (codes 128-254)** is reserved for private, organization-specific options. These must not be assumed to have consistent semantics across different networks. Code 252 (WPAD) is the most notable example of a site-specific code that achieved near-universal deployment without formal standardization [1][4].

---

## 9. Option Encoding Examples

```
ENCODING EXAMPLES -- COMMON OPTIONS
================================================================

Option 1: Subnet Mask = 255.255.255.0
+------+------+------+------+------+------+
| 0x01 | 0x04 | 0xFF | 0xFF | 0xFF | 0x00 |
| (1)  | (4)  | 255  | 255  | 255  | 0    |
+------+------+------+------+------+------+

Option 3: Router = 192.168.1.1
+------+------+------+------+------+------+
| 0x03 | 0x04 | 0xC0 | 0xA8 | 0x01 | 0x01 |
| (3)  | (4)  | 192  | 168  | 1    | 1    |
+------+------+------+------+------+------+

Option 6: DNS Servers = 8.8.8.8, 8.8.4.4
+------+------+------+------+------+------+------+------+------+------+
| 0x06 | 0x08 | 0x08 | 0x08 | 0x08 | 0x08 | 0x08 | 0x08 | 0x04 | 0x04 |
| (6)  | (8)  | 8    | 8    | 8    | 8    | 8    | 8    | 4    | 4    |
+------+------+------+------+------+------+------+------+------+------+
               |--- 8.8.8.8 (4 bytes) ---|--- 8.8.4.4 (4 bytes) ---|

Option 51: Lease Time = 86400 seconds (24 hours)
+------+------+------+------+------+------+
| 0x33 | 0x04 | 0x00 | 0x01 | 0x51 | 0x80 |
| (51) | (4)  |         86400              |
+------+------+------+------+------+------+

Option 53: DHCP Message Type = DISCOVER (1)
+------+------+------+
| 0x35 | 0x01 | 0x01 |
| (53) | (1)  | (1)  |
+------+------+------+

Option 55: Parameter Request List = [1, 3, 6, 15, 28, 51]
+------+------+------+------+------+------+------+------+
| 0x37 | 0x06 | 0x01 | 0x03 | 0x06 | 0x0F | 0x1C | 0x33 |
| (55) | (6)  | (1)  | (3)  | (6)  | (15) | (28) | (51) |
+------+------+------+------+------+------+------+------+

End Option:
+------+
| 0xFF |
+------+
```

---

## 10. Option Overloading

When the options field's capacity is insufficient, the `sname` (64 bytes) and `file` (128 bytes) header fields can carry additional options. Option 52 (Option Overload) signals this capability [1]:

- Value 1: The `file` field contains options
- Value 2: The `sname` field contains options
- Value 3: Both fields contain options

When overloaded, the fields are parsed as TLV option sequences (without a magic cookie prefix). Option 52 itself must appear in the main options field, not in an overloaded field. The Option Overload option must not appear in an overloaded field to prevent circular references [1].

Overloading is uncommon in modern deployments because option 57 (Maximum DHCP Message Size) allows negotiation of larger packets. However, it remains important for environments with strict 576-byte limits or legacy clients [7].

---

## 11. The IANA Registry

The IANA "BOOTP Vendor Extensions and DHCP Options" registry is the authoritative source for all assigned option codes. As of February 2026, the registry contains over 250 assigned entries spanning codes 0-255 [4].

The registry documents each option's:
- Code number
- Name
- Data length
- Meaning
- Reference RFC

Option codes 224-254 are reserved for private use. Code 0 (Pad) and 255 (End) are permanently assigned sentinel values. The remaining codes (1-223) are managed by IANA through Standards Action or IESG Approval [4].

The 8-bit code space (0-255) is the fundamental architectural limitation of DHCPv4 options. DHCPv6 addressed this by expanding to a 16-bit option code space (0-65535), providing orders of magnitude more room for future extensions [8].

---

## 12. Option Interaction and Dependencies

Several options have explicit ordering or dependency requirements:

- **Option 1 (Subnet Mask) before Option 3 (Router):** RFC 2132 requires the subnet mask to appear before the router option if both are present, because the client needs the mask to determine whether the router is on-link [1].

- **Option 53 required in ALL DHCP messages:** Without option 53, the packet is interpreted as BOOTP, not DHCP [1].

- **Option 54 (Server ID) required in DHCPOFFER, DHCPREQUEST (selecting), DHCPACK, DHCPNAK:** The server identifier is essential for multi-server environments to disambiguate offers and track leases [1].

- **Option 58 < Option 59 < Option 51:** The renewal time (T1) must be less than the rebinding time (T2), which must be less than the lease time. Violating this ordering produces undefined client behavior [1].

- **Option 82 inserted only by relay agents:** Clients must not include option 82 in their messages. Servers must not forward option 82 back to clients. The relay agent is responsible for adding it on the way to the server and removing it on the way back [5].

---

## 13. Cross-References

> **Related:** [Wire Format](01-wire-format-and-message-types.md) -- the packet structure that contains the options field at byte 236. [Lease Lifecycle](03-lease-lifecycle-and-state-machine.md) -- options 51, 58, and 59 control the lease timer semantics. [DHCPv6](05-dhcpv6-and-modern-extensions.md) -- 16-bit option space expansion.

**Series cross-references:**
- **DNS (DNS Protocol):** Option 6 configures DNS servers; option 119 configures domain search lists
- **SYS (Systems Admin):** Option management in DHCP server administration interfaces
- **K8S (Kubernetes):** Pod networking options in container DHCP configurations
- **CMH (Comp. Mesh):** Mesh node configuration parameters delivered via DHCP options
- **WPH (Weekly Phone):** Mobile devices request specific options via option 55 parameter request list
- **TCP (implied):** Options 37-39 configure TCP parameters at the client

---

## 14. Sources

1. Alexander, S. and Droms, R. "DHCP Options and BOOTP Vendor Extensions." RFC 2132, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
2. Lemon, T. and Cheshire, S. "Encoding Long Options in the Dynamic Host Configuration Protocol (DHCPv4)." RFC 3396, IETF Standards Track, November 2002. Retrieved from rfc-editor.org.
3. Reynolds, J. "BOOTP Vendor Information Extensions." RFC 1497, August 1993. Retrieved from rfc-editor.org.
4. IANA. "BOOTP Vendor Extensions and DHCP Options." Registry updated 2026-02-02. Retrieved from iana.org/assignments/bootp-dhcp-parameters.
5. Patrick, M. "DHCP Relay Agent Information Option." RFC 3046, IETF Standards Track, January 2001. Retrieved from rfc-editor.org.
6. Lemon, T., Cheshire, S. and Volz, B. "The Classless Static Route Option for Dynamic Host Configuration Protocol (DHCPv4)." RFC 3442, IETF Standards Track, December 2002. Retrieved from rfc-editor.org.
7. Droms, R. "Dynamic Host Configuration Protocol." RFC 2131, IETF Standards Track, March 1997. Retrieved from rfc-editor.org.
8. Mrugalski, T. et al. "Dynamic Host Configuration Protocol for IPv6 (DHCPv6)." RFC 8415, IETF Standards Track, November 2018. Retrieved from rfc-editor.org.
9. Aboba, B. and Cheshire, S. "Dynamic Host Configuration Protocol (DHCP) Domain Search Option." RFC 3397, IETF Standards Track, November 2002. Retrieved from rfc-editor.org.
10. Droms, R. and Arbaugh, W. "Authentication for DHCP Messages." RFC 3118, IETF Standards Track, June 2001. Retrieved from rfc-editor.org.
11. Johnston, M. and Venaas, S. "Definition of Managed Objects for the Bootstrap Protocol Server." RFC 4388, April 2006. Retrieved from rfc-editor.org.
12. Wimer, W. "Clarifications and Extensions for the Bootstrap Protocol." RFC 1542, October 1993. Retrieved from rfc-editor.org.
13. Droms, R. and Lemon, T. *The DHCP Handbook*. 2nd ed. Sams Publishing, 2003.
14. IETF DHC Working Group. "Dynamic Host Configuration." Charter and working group documents. Retrieved from datatracker.ietf.org/wg/dhc.
15. Cisco Systems. "DHCP Option 82 Relay Information." Configuration Guide, IOS XE, 2024.
16. Pentera. "Understanding and Preventing DHCP Spoofing Attacks." Security Research, November 2021.

---

*DHCP Protocol -- Module 2: Options Catalog. The 8-bit vocabulary that configures the entire Internet, one TLV at a time.*

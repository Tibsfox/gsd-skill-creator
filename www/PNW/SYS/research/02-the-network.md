# The Network

> **Module ID:** SRV-NET
> **Domain:** Network & Transport
> **Through-line:** *The pipe is paid for.* Bandwidth, addresses, ports — these are physical resources with real costs. The network is infrastructure, not magic. The admin decides what flows through it, blocks what should not be there, and ensures the signal reaches its destination. Every packet leaves a trail.

---

## Table of Contents

1. [The TCP/IP Stack](#1-the-tcpip-stack)
2. [IP Addressing & Subnets](#2-ip-addressing--subnets)
3. [DNS](#3-dns)
4. [DHCP](#4-dhcp)
5. [Routing](#5-routing)
6. [Firewalls & Filtering](#6-firewalls--filtering)
7. [The Pipe](#7-the-pipe)
8. [Wireless & Mesh](#8-wireless--mesh)
9. [Cross-Reference](#9-cross-reference)
10. [Sources](#10-sources)

---

## 1. The TCP/IP Stack

### 1.1 Layers of the Network

The network is a stack of abstractions. Each layer handles one concern and passes data to the layer above or below. The TCP/IP model has four layers (the OSI model has seven, but the internet actually runs on TCP/IP, so that is what we will learn). [SRC-TCP]

```
+---------------------------+  Layer 4: Application
|  HTTP, SSH, DNS, SMTP     |  What the user or service cares about:
|  MQTT, NTP, FTP           |  "Send this web page," "resolve this name,"
|                           |  "deliver this email."
+---------------------------+
|  TCP / UDP                |  Layer 3: Transport
|  Ports, sessions,         |  Reliable streams (TCP) or fast datagrams (UDP).
|  flow control             |  Multiplexes multiple conversations on one host.
+---------------------------+
|  IP (v4 / v6)             |  Layer 2: Internet
|  Addresses, routing,      |  Gets the packet from source host to destination
|  fragmentation            |  host across networks. The addressing layer.
+---------------------------+
|  Ethernet / Wi-Fi         |  Layer 1: Network Access (Link + Physical)
|  MAC addresses, frames,   |  Gets the frame from one device to the next
|  physical medium           |  device on the same local network.
+---------------------------+
```

The OSI model splits things more finely (Physical, Data Link, Network, Transport, Session, Presentation, Application), and it is useful vocabulary for talking about where a problem lives. But the TCP/IP model is how the internet's protocols are actually designed and implemented. [SRC-OSI]

### 1.2 What Happens When You Type a URL

Let us trace a real packet. You type `https://example.com` in a browser on a laptop at 192.168.1.50, connected to a home router at 192.168.1.1.

**Step 1: DNS Resolution (Application Layer)**
The browser needs an IP address. It asks the OS resolver, which checks the local cache, then queries the configured DNS server (say, 192.168.1.1, which forwards to 8.8.8.8). The answer comes back: `example.com` is `93.184.216.34`. (DNS is covered in depth in [Section 3](#3-dns).)

**Step 2: TCP Connection (Transport Layer)**
The browser opens a TCP connection to `93.184.216.34:443` (HTTPS). This involves a three-way handshake:

```
Your laptop                    example.com server
    |                                |
    |---- SYN (seq=100) ----------->|   "I want to connect"
    |                                |
    |<--- SYN-ACK (seq=300,ack=101)-|   "OK, I'm ready too"
    |                                |
    |---- ACK (ack=301) ----------->|   "Great, we're connected"
    |                                |
    |     [connection established]   |
```

The SYN-ACK exchange ensures both sides are ready and agree on initial sequence numbers. This is TCP's reliability — it establishes a session before sending data. [SRC-TCP]

**Step 3: TLS Handshake (overlaps Transport/Application)**
Because this is HTTPS, a TLS handshake happens next — certificate exchange, key agreement, cipher negotiation. After this, all data is encrypted. (TLS is covered in [Security Operations](07-security-operations.md).)

**Step 4: HTTP Request (Application Layer)**
The browser sends: `GET / HTTP/1.1\r\nHost: example.com\r\n\r\n`

**Step 5: IP Routing (Internet Layer)**
The packet's source is `192.168.1.50`, destination is `93.184.216.34`. Your laptop's routing table says: "anything not on 192.168.1.0/24, send to gateway 192.168.1.1." The router NATs the packet (replaces the source with its public IP) and forwards it. (Routing is covered in [Section 5](#5-routing).)

**Step 6: Ethernet Framing (Network Access Layer)**
On the local network, the packet is wrapped in an Ethernet frame addressed to the router's MAC address (resolved via ARP). The frame travels over Wi-Fi or cable to the router. From there, it is the ISP's problem — traveling through their network, through peering points, through the internet backbone, until it reaches the server.

**Step 7: Response**
The server receives the request, processes it, sends back an HTTP response (HTML content) through the same layers in reverse. Your browser receives it, renders the page.

Every one of these steps is inspectable. Every one can fail. The sysadmin can diagnose at each layer using different tools:

| Layer | Diagnostic Tools |
|-------|-----------------|
| Application | `curl`, `wget`, application logs |
| Transport | `ss`, `netstat`, `tcpdump` |
| Internet | `ping`, `traceroute`, `ip route` |
| Network Access | `ip link`, `ethtool`, `arp`, `iwconfig` |

### 1.3 TCP vs UDP

TCP and UDP are the two transport protocols that carry almost all internet traffic. They make fundamentally different tradeoffs. [SRC-TCP, SRC-UDP]

| Property | TCP | UDP |
|----------|-----|-----|
| **Connection** | Connection-oriented (3-way handshake) | Connectionless (send and forget) |
| **Reliability** | Guaranteed delivery, in-order, retransmission | Best effort — no guarantees |
| **Flow control** | Yes (window size, congestion control) | No |
| **Overhead** | Higher (headers, state tracking, ACKs) | Lower (8-byte header) |
| **Use cases** | HTTP, SSH, SMTP, database connections | DNS queries, NTP, video streaming, gaming, VoIP |

**TCP** is for data that must arrive complete and in order. A web page with missing chunks is useless. An SSH session with dropped characters is dangerous. TCP handles all of this — the application does not need to worry about reliability.

**UDP** is for data where speed matters more than completeness. A dropped video frame is a brief glitch. A retransmitted video frame is a stutter and a delay. DNS uses UDP because a single question-and-answer does not need a connection — if the reply is lost, just ask again. NTP uses UDP because time synchronization needs low latency, not guaranteed delivery of old timestamps.

### 1.4 Ports — Multiplexing Conversations

A single server at one IP address can run dozens of services simultaneously. Ports are how the kernel knows which service a packet is for. [SRC-TCP]

| Port Range | Name | Use |
|-----------|------|-----|
| 0-1023 | Well-known / privileged | Standard services: 22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS), 25 (SMTP) |
| 1024-49151 | Registered | Application-specific: 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis), 8080 (HTTP alt) |
| 49152-65535 | Ephemeral / dynamic | Client-side ports assigned automatically for outbound connections |

```bash
# Show all listening ports and what process owns them
ss -tlnp
# -t = TCP, -l = listening, -n = numeric (don't resolve names), -p = show process

# Example output:
# State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
# LISTEN  0       511     0.0.0.0:80          0.0.0.0:*          users:(("nginx",pid=1234,fd=6))
# LISTEN  0       128     0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=567,fd=3))
# LISTEN  0       244     127.0.0.1:5432      0.0.0.0:*          users:(("postgres",pid=890,fd=5))

# Note: PostgreSQL listens on 127.0.0.1 (localhost only) — not accessible from the network.
# nginx listens on 0.0.0.0 (all interfaces) — accessible from anywhere that can reach this server.
# This is a security-relevant distinction.
```

**Port binding requires root for ports below 1024.** This is a kernel restriction. The convention is: the service starts as root, binds the port, then drops privileges to a non-root user. Systemd can handle this via socket activation — systemd binds the port and passes the socket to the service, so the service never needs root at all.

---

## 2. IP Addressing & Subnets

### 2.1 IPv4 Addresses

An IPv4 address is 32 bits, written as four octets in decimal: `192.168.1.50`. Each octet is 0-255. There are 2^32 = ~4.3 billion possible addresses, which is not enough for the modern world (more devices than addresses). [SRC-IPv4]

```bash
# Show IP addresses on your system
ip addr show

# Typical output for a server:
# 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>
#     link/ether 52:54:00:ab:cd:ef brd ff:ff:ff:ff:ff:ff
#     inet 192.168.1.50/24 brd 192.168.1.255 scope global eth0
#     inet6 fe80::5054:ff:feab:cdef/64 scope link
```

### 2.2 Private vs Public Addresses (RFC 1918)

Not all IP addresses are routable on the public internet. RFC 1918 reserves three ranges for private networks: [SRC-RFC1918]

| Range | CIDR | Addresses | Common Use |
|-------|------|-----------|-----------|
| 10.0.0.0 - 10.255.255.255 | 10.0.0.0/8 | 16,777,216 | Large organizations, cloud VPCs, VPN tunnels |
| 172.16.0.0 - 172.31.255.255 | 172.16.0.0/12 | 1,048,576 | Medium networks, Docker default bridge |
| 192.168.0.0 - 192.168.255.255 | 192.168.0.0/16 | 65,536 | Home networks, small offices |

Your home router has one public IP (assigned by your ISP) and gives private IPs (192.168.x.x) to every device on your network. This is why multiple devices can share a single internet connection — and why NAT exists.

### 2.3 CIDR and Subnet Masks

CIDR (Classless Inter-Domain Routing) notation expresses a network address and its size in one compact form: `192.168.1.0/24`. The `/24` means the first 24 bits are the network part; the remaining 8 bits are host addresses. [SRC-CIDR]

```
192.168.1.0/24 in binary:
11000000.10101000.00000001 . 00000000
|_______ network part ____| |_ hosts_|
         24 bits               8 bits

Subnet mask: 255.255.255.0
Network:     192.168.1.0
First host:  192.168.1.1
Last host:   192.168.1.254
Broadcast:   192.168.1.255
Usable:      254 host addresses
```

**Common subnet sizes:**

| CIDR | Subnet Mask | Usable Hosts | Use Case |
|------|------------|-------------|----------|
| /32 | 255.255.255.255 | 1 | Single host (loopback, point-to-point) |
| /30 | 255.255.255.252 | 2 | Point-to-point link between two routers |
| /24 | 255.255.255.0 | 254 | Standard LAN, home network |
| /16 | 255.255.0.0 | 65,534 | Large campus or organization |
| /8 | 255.0.0.0 | 16,777,214 | Reserved ranges (10.0.0.0/8) |

**The practical question:** How do you decide subnet size? A `/24` gives you 254 hosts. If you have 30 devices, that is plenty of room. If you have 300 devices, you need a `/23` (510 hosts) or larger. If you are segmenting a data center into trust zones (web servers in one subnet, databases in another), smaller subnets (`/26` = 62 hosts, `/28` = 14 hosts) limit the blast radius if one zone is compromised.

### 2.4 NAT — Network Address Translation

NAT allows multiple devices with private IPs to share a single public IP. Your router maintains a translation table that maps internal address:port pairs to the public address with different port numbers. [SRC-NAT]

```
Internal Network                  Router (NAT)                Public Internet
                                  Public IP: 203.0.113.1
192.168.1.50:43210 ---->                                 ---->  93.184.216.34:443
192.168.1.51:43211 ---->    NAT table:                   ---->  93.184.216.34:443
192.168.1.52:43212 ---->    .50:43210 <-> :50001         ---->  93.184.216.34:443
                            .51:43211 <-> :50002
                            .52:43212 <-> :50003
```

When the response comes back to `203.0.113.1:50001`, the router looks up the NAT table and forwards it to `192.168.1.50:43210`. From the remote server's perspective, all three devices are the same public IP — only the port differs.

**NAT is why the internet still works with IPv4.** Without NAT, we would have exhausted the IPv4 address space in the 1990s. With NAT, a billion home networks each use the same `192.168.1.0/24` range internally and share a single public IP externally.

**NAT is also why running a server at home is complicated.** Inbound connections to your public IP do not know which internal device to reach. You must configure port forwarding (static NAT entries) to direct inbound traffic to the right internal host. This is not a firewall — it is address translation.

### 2.5 IPv6

IPv6 addresses are 128 bits — enough for 3.4 x 10^38 addresses. Written in hexadecimal groups: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`. Leading zeros in a group can be dropped, and one sequence of all-zero groups can be replaced with `::`. [SRC-IPv6]

```
Full:        2001:0db8:85a3:0000:0000:8a2e:0370:7334
Shortened:   2001:db8:85a3::8a2e:370:7334

Loopback:    ::1   (equivalent to 127.0.0.1 in IPv4)
Link-local:  fe80::/10  (auto-configured on every interface, not routable)
```

**Why IPv6 matters for sysadmins:**
- No NAT needed — every device can have a globally unique address
- Autoconfiguration (SLAAC) — devices generate their own addresses from the network prefix and their MAC address
- Simpler routing tables — hierarchical allocation reduces routing table size
- Mandatory IPsec support — built into the protocol
- Dual-stack is common — most servers run both IPv4 and IPv6 simultaneously

```bash
# Show IPv6 addresses
ip -6 addr show

# Test IPv6 connectivity
ping -6 ::1                    # Loopback
ping -6 2001:4860:4860::8888   # Google Public DNS over IPv6

# Check if your server has a global IPv6 address
ip -6 addr show scope global
```

The transition from IPv4 to IPv6 has been "almost done" for over two decades. In practice, most servers need both. The sysadmin configures both stacks and tests both paths.

---

## 3. DNS

### 3.1 The Phone Book of the Internet

DNS (Domain Name System) translates human-readable names (`example.com`) into IP addresses (`93.184.216.34`). Without DNS, you would need to memorize IP addresses for every service you use. DNS is the most critical infrastructure service on the internet — if DNS is down, everything appears to be down, even if the servers themselves are fine. [SRC-DNS]

### 3.2 How DNS Resolution Works

When your server needs to resolve `api.example.com`, here is what actually happens:

```
Your Server                Recursive Resolver          Authoritative Servers
    |                      (e.g., 8.8.8.8)
    |                           |
    |-- "What is               |
    |   api.example.com?" ---->|
    |                           |
    |                           |-- "Who handles .com?" -------> Root Server (.)
    |                           |<-- "Ask a]192.5.6.30" ---------+
    |                           |
    |                           |-- "Who handles              -> .com TLD Server
    |                           |   example.com?" ------------>  (a.gtld-servers.net)
    |                           |<-- "Ask ns1.example.com" ------+
    |                           |
    |                           |-- "What is                  -> example.com
    |                           |   api.example.com?" -------->  Authoritative Server
    |                           |<-- "93.184.216.34, TTL=300" ---+
    |                           |
    |<-- "93.184.216.34" -------|
    |                           |
    |   [cached for 300 seconds]|
```

**Key terms:**

| Term | Meaning |
|------|---------|
| **Recursive resolver** | The server that does the work of chasing referrals through the hierarchy. Your ISP runs one. Google (8.8.8.8), Cloudflare (1.1.1.1), and Quad9 (9.9.9.9) are public alternatives. |
| **Authoritative server** | The server that holds the actual DNS records for a domain. It does not chase referrals — it either has the answer or says "I don't know." |
| **Root servers** | 13 logical root server clusters (a.root-servers.net through m.root-servers.net) that know which servers handle each TLD (.com, .org, .net). |
| **TLD server** | Handles a top-level domain. The .com TLD servers know which authoritative servers handle every .com domain. |
| **TTL** | Time To Live — how long the resolver (and your local cache) should remember this answer before asking again. Measured in seconds. |

### 3.3 DNS Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| **A** | Maps a name to an IPv4 address | `example.com. A 93.184.216.34` |
| **AAAA** | Maps a name to an IPv6 address | `example.com. AAAA 2606:2800:220:1:248:1893:25c8:1946` |
| **CNAME** | Alias — points one name to another name | `www.example.com. CNAME example.com.` |
| **MX** | Mail server for the domain (with priority) | `example.com. MX 10 mail.example.com.` |
| **TXT** | Arbitrary text — used for SPF, DKIM, DMARC, domain verification | `example.com. TXT "v=spf1 ip4:93.184.216.0/24 -all"` |
| **NS** | Authoritative nameserver for the domain | `example.com. NS ns1.example.com.` |
| **SOA** | Start of Authority — primary nameserver, admin email, serial number, timing | Zone metadata |
| **PTR** | Reverse DNS — maps an IP address to a name | `34.216.184.93.in-addr.arpa. PTR example.com.` |
| **SRV** | Service location — hostname, port, priority, weight | `_sip._tcp.example.com. SRV 10 60 5060 sip.example.com.` |

### 3.4 DNS Diagnostic Tools

```bash
# dig — the most informative DNS tool
dig example.com
# Shows: query, answer, authority, additional sections, query time, server used

# Query a specific record type
dig example.com MX
dig example.com AAAA
dig example.com TXT

# Query a specific nameserver
dig @8.8.8.8 example.com

# Trace the full resolution path (recursive from root)
dig +trace example.com
# Shows each hop: root -> TLD -> authoritative

# Short answer only
dig +short example.com
# Output: 93.184.216.34

# Reverse DNS lookup
dig -x 93.184.216.34

# nslookup — simpler, less informative
nslookup example.com
nslookup example.com 8.8.8.8

# Check local DNS resolution
getent hosts example.com
# Uses the system resolver (honors /etc/hosts, nsswitch.conf)
```

### 3.5 DNS Configuration on a Server

```bash
# /etc/resolv.conf — which DNS servers to use
# (often managed by systemd-resolved or NetworkManager, not edited directly)
nameserver 8.8.8.8
nameserver 8.8.4.4
search example.com

# /etc/hosts — local overrides (checked before DNS)
127.0.0.1    localhost
192.168.1.10 db.internal
192.168.1.11 cache.internal

# Check what manages DNS resolution
resolvectl status    # If using systemd-resolved
cat /etc/nsswitch.conf | grep hosts
# hosts: files dns
# This means: check /etc/hosts first, then DNS
```

### 3.6 DNS as Infrastructure You Trust Implicitly But Shouldn't

DNS is almost always unencrypted. A standard DNS query is a plaintext UDP packet visible to every network hop between you and the resolver. Your ISP can see every domain you resolve. A compromised router can modify DNS responses to redirect you to a malicious server. [SRC-DNSSEC]

**DNS Security extensions:**

| Technology | What It Does | Limitation |
|-----------|-------------|-----------|
| **DNSSEC** | Cryptographically signs DNS records so the resolver can verify they were not tampered with | Does not encrypt — only authenticates. Your ISP still sees the queries. Adoption is inconsistent. |
| **DNS over TLS (DoT)** | Encrypts DNS queries between client and resolver using TLS on port 853 | The resolver still sees everything. Moves trust from the network path to the resolver. |
| **DNS over HTTPS (DoH)** | Encrypts DNS queries inside HTTPS to port 443, indistinguishable from web traffic | Same trust shift. Some argue it prevents network operators from doing legitimate DNS-based security filtering. |

The sysadmin's pragmatic position: use a trusted recursive resolver (your own, or a reputable public one). Enable DNSSEC validation if your resolver supports it. Know that DNS is a single point of failure — if your resolver is down or compromised, name resolution fails and everything looks broken. Consider running a local caching resolver (unbound, dnsmasq) so you are not entirely dependent on an external service.

Cross-reference: [Security Operations](07-security-operations.md) covers DNS-based attack vectors (DNS spoofing, cache poisoning, DNS tunneling).

---

## 4. DHCP

### 4.1 How Devices Get Addresses

DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses and network configuration to devices when they join a network. Without DHCP, every device would need manual configuration — impractical on any network with more than a handful of hosts. [SRC-DHCP]

### 4.2 The DORA Process

When a device connects to a network and needs an IP address, it goes through four steps, known by the acronym DORA:

```
Client                                    DHCP Server
(no IP yet,                               192.168.1.1
 uses 0.0.0.0)
    |                                          |
    |-- DISCOVER (broadcast) ----------------->|   "Is there a DHCP server here?"
    |   src: 0.0.0.0, dst: 255.255.255.255    |   (broadcast because client has no address)
    |                                          |
    |<-- OFFER --------------------------------|   "I can give you 192.168.1.50"
    |   Your IP: 192.168.1.50                  |   (includes subnet, gateway, DNS, lease time)
    |   Subnet: 255.255.255.0                  |
    |   Gateway: 192.168.1.1                   |
    |   DNS: 8.8.8.8                           |
    |   Lease: 86400 seconds (24 hours)        |
    |                                          |
    |-- REQUEST (broadcast) ------------------>|   "I accept 192.168.1.50 from you"
    |   Requested: 192.168.1.50                |   (broadcast so other DHCP servers know)
    |                                          |
    |<-- ACK ----------------------------------|   "Confirmed. 192.168.1.50 is yours
    |                                          |    for 24 hours."
    |                                          |
    [Client configures interface with the      ]
    [received parameters and starts using      ]
    [the network                               ]
```

**Why broadcast?** The client has no IP address yet — it cannot send targeted packets. Broadcasting reaches every device on the local network. The DHCP server responds because it is listening for these broadcasts. This is why DHCP works only on the local network segment unless a DHCP relay agent forwards broadcasts across subnets.

### 4.3 Lease Renewal

The lease is temporary. Before it expires, the client attempts to renew:

| Time Point | Action |
|-----------|--------|
| 50% of lease (T1) | Client sends REQUEST directly to the DHCP server (unicast). If acknowledged, lease is renewed. |
| 87.5% of lease (T2) | If T1 renewal failed, client broadcasts a REQUEST to any DHCP server on the network. |
| Lease expires | Client releases the address and starts DORA from scratch. If it cannot get an address, it has no network. |

A 24-hour lease means renewal attempts start at 12 hours. Short leases (1-4 hours) are appropriate for networks with many transient devices (Wi-Fi hotspots, conference rooms). Long leases (7-30 days) are appropriate for stable networks where devices rarely change.

### 4.4 Static vs Dynamic vs Reserved

| Mode | How Address Is Assigned | When to Use |
|------|------------------------|-------------|
| **Dynamic** | DHCP server picks from a pool | Laptops, phones, guest devices — anything transient |
| **Reserved (static DHCP)** | DHCP server assigns a specific IP based on the device's MAC address | Servers, printers, NAS, IoT devices — things that need a consistent address but you want centralized management |
| **Static** | Manually configured on the device (no DHCP) | Core infrastructure: the DHCP server itself, the gateway, DNS servers |

```bash
# Example DHCP reservation in dnsmasq.conf:
# Assign 192.168.1.100 to the device with this MAC address
dhcp-host=52:54:00:ab:cd:ef,192.168.1.100,nas-server

# ISC DHCP server (/etc/dhcp/dhcpd.conf):
host nas-server {
    hardware ethernet 52:54:00:ab:cd:ef;
    fixed-address 192.168.1.100;
}
```

**DHCP reservations are the pragmatic middle ground.** The device gets its address automatically via DHCP (no manual configuration on the device), but the address is always the same (because the server is told to give this MAC address this IP). You get the convenience of DHCP with the predictability of static addressing. Firewall rules, DNS entries, and monitoring that depend on consistent addresses all work reliably.

### 4.5 DHCP and Network Segmentation

On a segmented network with VLANs, each VLAN typically has its own DHCP scope (pool of addresses). A DHCP relay agent on the router forwards broadcasts from each VLAN to the central DHCP server, which responds with the appropriate scope.

```
VLAN 10 (Servers)      DHCP Relay          DHCP Server
192.168.10.0/24  ----> forwards ---->      Scope: 192.168.10.100-.200
                                           Gateway: 192.168.10.1
                                           DNS: 192.168.10.53

VLAN 20 (Users)        DHCP Relay          DHCP Server
192.168.20.0/24  ----> forwards ---->      Scope: 192.168.20.100-.200
                                           Gateway: 192.168.20.1
                                           DNS: 8.8.8.8

VLAN 30 (IoT)         DHCP Relay          DHCP Server
192.168.30.0/24  ----> forwards ---->      Scope: 192.168.30.100-.200
                                           Gateway: 192.168.30.1
                                           DNS: 192.168.10.53
```

This is network stewardship — each device class gets its own address space, its own gateway, and its own DNS policy. IoT devices in VLAN 30 cannot reach servers in VLAN 10 without passing through a router with firewall rules. The network topology enforces trust boundaries.

---

## 5. Routing

### 5.1 How Packets Find Their Path

Routing is the process of forwarding packets from one network to another. Every device that handles IP traffic — your laptop, a router, a server — has a routing table. The routing table is a set of rules: "if the destination address matches this network, send the packet out this interface to this next hop." [SRC-ROUTE]

```bash
# Show the routing table
ip route show

# Typical output for a server:
# default via 192.168.1.1 dev eth0 proto static
# 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50
# 172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1

# Translation:
# - Packets for 192.168.1.0/24: send directly out eth0 (local network)
# - Packets for 172.17.0.0/16: send out docker0 (Docker containers)
# - Everything else (default): send to 192.168.1.1 (the gateway)
```

### 5.2 The Default Gateway

The default gateway is the router that handles packets destined for networks not in the local routing table. On most servers and workstations, the routing table has one or two local network entries and a default route. Every packet not matching a local network goes to the default gateway. [SRC-ROUTE]

If the default gateway is unreachable (cable unplugged, router crashed, misconfigured), the machine can talk to other devices on its local subnet but cannot reach anything else. This is one of the most common network troubleshooting scenarios:

```bash
# Can I reach my gateway?
ping -c 3 192.168.1.1

# If yes: the local network is fine. Problem is upstream.
# If no: check cable, check interface, check IP config.

# Can I reach an IP on the internet?
ping -c 3 8.8.8.8

# If yes: IP routing works. If DNS fails, it's a DNS problem, not routing.
# If no: the path between your gateway and the internet is broken.

# Can I resolve DNS?
dig example.com

# If no: DNS server is unreachable or misconfigured.
# Fix: check /etc/resolv.conf, try a different DNS server.
```

This three-step diagnosis (local gateway, internet by IP, DNS) isolates the problem layer in under a minute.

### 5.3 Traceroute — Mapping the Path

`traceroute` reveals every router (hop) between your machine and the destination. It sends packets with incrementing TTL (Time To Live) values. Each router decrements the TTL and, when it hits zero, sends back an ICMP "Time Exceeded" message revealing its address. [SRC-ROUTE]

```bash
# Trace the path to a destination
traceroute example.com

# Typical output:
#  1  192.168.1.1 (192.168.1.1)      0.5 ms   0.4 ms   0.4 ms
#  2  10.0.0.1 (10.0.0.1)            2.1 ms   2.0 ms   2.1 ms
#  3  isp-router.example.net          8.3 ms   8.2 ms   8.4 ms
#  4  core-router.carrier.net        12.1 ms  12.0 ms  12.2 ms
#  5  * * *                          (no response — firewall blocks ICMP)
#  6  93.184.216.34                   18.5 ms  18.4 ms  18.5 ms

# mtr — combines ping and traceroute, shows packet loss per hop
mtr example.com
# Interactive display, updates continuously. Essential for finding
# intermittent routing problems (a hop that drops 5% of packets).
```

**Reading traceroute output:**
- Consistent latency increase per hop: normal. Each hop adds propagation delay.
- Sudden large jump at one hop: that hop crosses a long physical distance (e.g., undersea cable).
- `* * *` (asterisks): the router did not respond. Some routers are configured to drop traceroute probes. This is not necessarily a problem — the probe may continue fine beyond that hop.
- Packet loss at an intermediate hop but not at the destination: the router is just deprioritizing ICMP responses under load. Not a real problem.
- Packet loss at the final hop: the destination or its network is dropping packets. This is a real problem.

### 5.4 Static Routes

Sometimes the default gateway is not the right path for all traffic. Static routes direct specific networks through specific gateways.

```bash
# Add a static route: traffic for 10.10.0.0/16 goes through 192.168.1.254
ip route add 10.10.0.0/16 via 192.168.1.254

# Make it persistent (varies by distribution):
# Debian/Ubuntu (netplan):
# /etc/netplan/01-config.yaml
#   routes:
#     - to: 10.10.0.0/16
#       via: 192.168.1.254

# RHEL/Rocky (nmcli):
# nmcli connection modify eth0 +ipv4.routes "10.10.0.0/16 192.168.1.254"
```

**Common use:** A VPN gateway at 192.168.1.254 handles traffic to the office network (10.10.0.0/16). All other traffic goes through the default gateway (192.168.1.1) to the internet. The routing table sends packets to the right gateway based on destination.

### 5.5 BGP — How the Internet's Backbone Routes

BGP (Border Gateway Protocol) is how the internet's major networks (Autonomous Systems, or ASes) tell each other which IP ranges they can reach. It is the routing protocol of the global internet. [SRC-BGP]

When your ISP connects to a backbone provider, they exchange BGP routes: "I can reach 203.0.113.0/24 through me." The backbone provider aggregates these announcements and passes them on. The global BGP table contains over 900,000 prefixes — every routable network on the internet.

**Why a sysadmin should understand BGP at a high level:**
- **BGP hijacking** is when someone announces routes for IP space they do not own, redirecting traffic through their network. This has happened to cloud providers, cryptocurrency exchanges, and government networks.
- **BGP route leaks** cause widespread outages when an ISP accidentally announces routes it should not, pulling traffic into a network that cannot handle it.
- **Anycast** uses BGP to advertise the same IP prefix from multiple locations worldwide. DNS root servers, CDNs, and DDoS protection services use anycast so you reach the nearest instance.

You do not configure BGP on a typical server. But when a major outage happens (Cloudflare, AWS, Facebook have all had BGP incidents), understanding that the internet's routing is a distributed system of trust-based announcements helps you understand why a server in Oregon suddenly cannot reach a server in Virginia.

---

## 6. Firewalls & Filtering

### 6.1 What a Firewall Actually Does

A firewall inspects network packets and decides whether to allow, drop, or reject them based on rules. The kernel's packet filtering framework (netfilter) processes every packet that enters, leaves, or transits the machine. `iptables` and `nftables` are the userspace tools for configuring these rules. [SRC-NFT]

**Critical distinction:** A firewall is not security. A firewall is traffic management. It blocks what should not be there so the pipe carries signal, not noise. Security is layered — authentication, authorization, encryption, monitoring, patching. The firewall is one layer.

### 6.2 Chains and Flow

Packets flow through chains depending on their direction:

```
                              +------------------+
Incoming packet ------>  [INPUT chain]  ------> Local process
                              |
                              |  (if forwarding)
                              v
                         [FORWARD chain] ------> Outgoing interface
                              ^
                              |
Local process --------> [OUTPUT chain] -------> Outgoing packet

PREROUTING: before routing decision (DNAT, port forwarding)
POSTROUTING: after routing decision (SNAT, masquerade)
```

| Chain | Processes | Use Case |
|-------|-----------|----------|
| **INPUT** | Packets destined for this machine | Allow SSH (22), HTTP (80), block everything else |
| **OUTPUT** | Packets originating from this machine | Usually permissive — your server initiates connections |
| **FORWARD** | Packets passing through this machine (routing) | NAT gateway, Docker bridge, VPN gateway |
| **PREROUTING** | Before routing decision | Port forwarding (redirect port 8080 to internal server on 80) |
| **POSTROUTING** | After routing decision | Source NAT (masquerade outbound traffic) |

### 6.3 nftables — The Modern Approach

nftables replaces iptables with cleaner syntax, better performance, and a unified framework for IPv4, IPv6, ARP, and bridging. [SRC-NFT]

```bash
# Show current ruleset
nft list ruleset

# A basic server firewall:
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;

        # Allow established and related connections
        ct state established,related accept

        # Allow loopback
        iif lo accept

        # Allow ICMP (ping)
        ip protocol icmp accept
        ip6 nexthdr icmpv6 accept

        # Allow SSH
        tcp dport 22 accept

        # Allow HTTP and HTTPS
        tcp dport { 80, 443 } accept

        # Log and drop everything else
        log prefix "nft-drop: " drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

**Reading the rules:**
- `policy drop` — the default for incoming traffic is DROP. Only explicitly allowed traffic gets through.
- `ct state established,related accept` — if we already initiated a conversation (outbound connection), allow the response back in. This is stateful filtering.
- `iif lo accept` — allow all traffic on the loopback interface. Local services talking to each other.
- `tcp dport 22 accept` — allow inbound SSH connections.
- `log prefix "nft-drop: "` — log dropped packets so you can see what is being blocked. These logs go to journald and are invaluable for debugging "why can't X connect?"

### 6.4 iptables — The Legacy Approach

Many existing systems and documentation still use iptables. The concepts are the same; the syntax differs. [SRC-IPT]

```bash
# Equivalent to the nftables rules above:

# Default policy: drop incoming, accept outgoing
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow ICMP
iptables -A INPUT -p icmp -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Log and drop everything else
iptables -A INPUT -j LOG --log-prefix "iptables-drop: "
iptables -A INPUT -j DROP

# Save rules (Debian/Ubuntu)
iptables-save > /etc/iptables/rules.v4
# Restored on boot by iptables-persistent package
```

### 6.5 Stateful vs Stateless Filtering

| Type | How It Works | Pro | Con |
|------|-------------|-----|-----|
| **Stateless** | Each packet evaluated independently against rules | Fast, simple, predictable | Cannot distinguish new connections from replies. Must open wide port ranges for ephemeral ports. |
| **Stateful** | Tracks connection state (NEW, ESTABLISHED, RELATED) | Can allow replies without opening extra ports. More secure by default. | Uses memory to track connections. Very high connection rates can exhaust the connection table. |

Modern firewalls are stateful by default. The `ct state established,related accept` rule is what makes this work — it says "if this packet belongs to a conversation we already know about, let it through." Without stateful tracking, you would need explicit rules for every possible response port.

### 6.6 Drop vs Reject

| Action | What Happens | When to Use |
|--------|-------------|-------------|
| **DROP** | Packet silently discarded. No response sent. | External-facing rules. Gives the sender no information about what ports exist. |
| **REJECT** | Packet discarded and an ICMP "port unreachable" or TCP RST sent back. | Internal networks. Helps legitimate users and services get fast error responses instead of waiting for timeouts. |

On the public internet, DROP is generally preferred because it reveals nothing about the host. An attacker scanning ports sees no difference between a DROPped port and a port on a machine that does not exist. REJECT tells the attacker "this machine exists and is filtering traffic on this port" — useful information for reconnaissance.

On internal networks, REJECT is kinder. If a service tries to connect to a filtered port and gets no response (DROP), it waits for a timeout (often 30-120 seconds). With REJECT, it gets an immediate error and can fail fast.

### 6.7 The Anti-Waste Principle in Filtering

The firewall embodies the anti-waste principle. Every packet that reaches your server consumes resources: the NIC processes it, the kernel evaluates it against the firewall rules, and (if allowed) the application processes it. Traffic that should not be there wastes all of these resources.

A well-configured firewall ensures the pipe carries only signal. Unsolicited connections to ports with no service? Dropped before they consume application resources. Port scans from the internet? Logged and dropped. Broadcast noise from misconfigured devices? Filtered at the interface.

The goal is not to block everything — it is to be intentional about what is allowed. Every `accept` rule is a conscious decision: "yes, this traffic has a purpose, and the service behind this port is ready for it."

Cross-reference: [Security Operations](07-security-operations.md) covers firewall rules as part of a broader security posture. [Access & Bandwidth](06-access-bandwidth.md) covers rate limiting and traffic shaping, which build on top of basic filtering.

---

## 7. The Pipe

### 7.1 Bandwidth as a Physical Resource

Bandwidth is the maximum data transfer rate of a network link, measured in bits per second. A 1 Gbps Ethernet connection can carry at most 1 billion bits per second. This is a physical limit determined by the hardware — the NIC, the cable, the switch port. [SRC-BW]

The pipe is paid for. Whether it is a $50/month home internet connection or a $10,000/month dedicated fiber to a data center, the capacity is finite and has a monthly cost. The admin decides what flows through it.

### 7.2 Bandwidth vs Throughput vs Latency vs Jitter

These four metrics describe different aspects of network performance. Confusing them leads to wrong diagnoses.

| Metric | What It Measures | Analogy |
|--------|-----------------|---------|
| **Bandwidth** | Maximum capacity of the link | Width of the pipe |
| **Throughput** | Actual data transfer rate achieved | How much water actually flows |
| **Latency** | Time for a packet to travel from source to destination | How long it takes a drop to travel the pipe's length |
| **Jitter** | Variation in latency over time | Whether water flows smoothly or in spurts |

**Bandwidth and throughput are not the same.** A 1 Gbps link can have 200 Mbps throughput because of protocol overhead, congestion, packet loss, or application bottlenecks. Upgrading bandwidth does not help if the bottleneck is somewhere else.

**Latency and bandwidth are independent.** A satellite link can have high bandwidth (100 Mbps) but terrible latency (600ms round trip). A serial console connection can have low bandwidth (9600 bps) but excellent latency (<1ms). SSH over a satellite link is painful despite the bandwidth because every keystroke takes 600ms to echo back.

**Jitter matters for real-time traffic.** Voice and video need consistent latency, not just low latency. A video call with 50ms latency and 2ms jitter is fine. A video call with 50ms average latency and 100ms jitter is unwatchable — frames arrive at unpredictable intervals.

```bash
# Measure latency and jitter
ping -c 20 example.com
# Look at the summary: min/avg/max/mdev (mdev is standard deviation = jitter indicator)
# rtt min/avg/max/mdev = 18.2/18.5/19.1/0.3 ms  <-- low jitter, healthy
# rtt min/avg/max/mdev = 18.2/45.3/312.1/67.8 ms  <-- high jitter, problem

# Measure throughput
iperf3 -c remote-server       # Client mode — test TCP throughput to a remote iperf3 server
iperf3 -s                     # Server mode — run on the remote end

# Measure bandwidth usage in real time
iftop                         # Shows per-connection bandwidth usage
nload                         # Shows total bandwidth in/out per interface
vnstat                        # Historical bandwidth tracking per interface
```

### 7.3 QoS and Traffic Shaping

Quality of Service (QoS) prioritizes certain traffic types over others when the pipe is congested. When bandwidth is abundant, QoS does nothing — every packet gets through immediately. When the pipe fills up, QoS determines who waits and who goes first. [SRC-QOS]

**Common QoS priorities (from highest to lowest):**

| Priority | Traffic Type | Why |
|----------|-------------|-----|
| Highest | VoIP, video conferencing | Real-time, jitter-sensitive. 200ms delay makes conversation impossible. |
| High | SSH, interactive terminals | Keystroke latency is directly felt by the human operator. |
| Normal | HTTP, HTTPS, API traffic | Standard application traffic. Can tolerate short delays. |
| Low | Email, file sync, backups | Batch traffic. Does not matter if it takes 5 seconds or 50 seconds. |
| Lowest | Updates, torrents, bulk downloads | Scavenger class. Gets bandwidth only when nothing else needs it. |

```bash
# Linux traffic shaping with tc (traffic control)
# This is a simplified example — tc syntax is notoriously complex

# Limit outbound bandwidth on eth0 to 100 Mbps
tc qdisc add dev eth0 root tbf rate 100mbit burst 32kbit latency 400ms

# More sophisticated: use HTB (Hierarchical Token Bucket)
# for class-based prioritization
tc qdisc add dev eth0 root handle 1: htb default 30
tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit
tc class add dev eth0 parent 1:1 classid 1:10 htb rate 50mbit ceil 100mbit  # High priority
tc class add dev eth0 parent 1:1 classid 1:20 htb rate 30mbit ceil 100mbit  # Normal
tc class add dev eth0 parent 1:1 classid 1:30 htb rate 20mbit ceil 100mbit  # Low priority

# Classify SSH traffic as high priority
tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 22 0xffff flowid 1:10
```

**The stewardship principle:** QoS is the admin deciding that an SSH session to diagnose a production issue is more important than a background backup running at the same time. Both need bandwidth. The pipe is finite. The admin allocates based on purpose, not first-come-first-served.

### 7.4 Monitoring the Pipe

```bash
# Real-time per-connection bandwidth usage
iftop -i eth0

# Historical usage tracking
vnstat -i eth0                 # Summary
vnstat -i eth0 -d              # Daily totals
vnstat -i eth0 -h              # Hourly graph

# Detailed packet capture (for diagnosis, not continuous monitoring)
tcpdump -i eth0 -n port 80     # Capture HTTP traffic
tcpdump -i eth0 -n host 192.168.1.50   # Capture all traffic to/from a specific host
tcpdump -i eth0 -w capture.pcap         # Write to file for Wireshark analysis

# Network interface statistics
ip -s link show eth0
# Shows: bytes, packets, errors, drops for RX and TX
# Non-zero errors or drops indicate hardware or driver issues
```

---

## 8. Wireless & Mesh

### 8.1 WiFi Fundamentals

Wi-Fi (IEEE 802.11) is radio communication between a device and an access point (AP) using frequencies in the 2.4 GHz and 5 GHz bands (and now 6 GHz with Wi-Fi 6E). The physics is electromagnetic radiation — the same fundamental phenomenon as light, just at a lower frequency. [SRC-WIFI]

| Standard | Name | Frequencies | Max Speed (theoretical) | Range |
|----------|------|------------|------------------------|-------|
| 802.11n | Wi-Fi 4 | 2.4 + 5 GHz | 600 Mbps | Good |
| 802.11ac | Wi-Fi 5 | 5 GHz | 3.5 Gbps | Moderate |
| 802.11ax | Wi-Fi 6/6E | 2.4 + 5 + 6 GHz | 9.6 Gbps | Good |

**2.4 GHz vs 5 GHz:**

| Frequency | Range | Speed | Interference |
|-----------|-------|-------|-------------|
| 2.4 GHz | Longer (penetrates walls better) | Slower | More crowded (microwaves, Bluetooth, neighbors' routers all share this band) |
| 5 GHz | Shorter | Faster | Less crowded (more channels, shorter range means less overlap) |

### 8.2 Channels and Interference

Wi-Fi channels are specific frequency slices within the band. In 2.4 GHz, there are only three non-overlapping channels: 1, 6, and 11. Every other channel overlaps with its neighbors, causing interference. [SRC-WIFI]

```
2.4 GHz Band:
Channel: 1    2    3    4    5    6    7    8    9    10   11
         |=========|              |=========|              |=========|
         Ch 1 (22MHz)            Ch 6 (22MHz)             Ch 11 (22MHz)
              |===overlap===|===overlap===|
                   Using Ch 3 or Ch 4 interferes with BOTH Ch 1 AND Ch 6
```

**The practical rule:** In a 2.4 GHz environment, use only channels 1, 6, or 11. Any other choice creates co-channel interference with adjacent APs. In 5 GHz, there are many more non-overlapping channels (up to 25), so interference is less of a problem.

```bash
# Scan for nearby Wi-Fi networks and their channels
iwlist wlan0 scan | grep -E "(ESSID|Channel|Signal)"

# Or with iw:
iw dev wlan0 scan | grep -E "(SSID|freq|signal)"

# Show current connection details
iw dev wlan0 link

# Show interface capabilities
iw phy phy0 info
```

**Site survey basics:** Walk through the space with a Wi-Fi analyzer (free apps for phones work fine). Map signal strength and channel usage at each location. Place APs to minimize overlap on the same channel. Walls, metal objects, and water (including humans — we are 60% water) attenuate signal. A floor plan with AP placement and channel assignments is basic network documentation.

### 8.3 Mesh Networking

In a traditional Wi-Fi network, every device connects to a central access point. If the AP is unreachable, the device has no network. A mesh network eliminates this single point of failure — every node communicates with multiple other nodes, and the network routes around failures automatically. [SRC-MESH]

```
Traditional (hub-and-spoke):          Mesh:

        [AP]                     [Node A]----[Node B]
       / | \                       |    \    / |
      /  |  \                      |     \/    |
   [D1] [D2] [D3]               [Node C]----[Node D]
                                   |    /\     |
   If AP fails:                    |   /  \    |
   ALL devices lose network      [Node E]----[Node F]

                                 If Node B fails:
                                 A routes through C or D instead.
                                 Network degrades but doesn't die.
```

**Mesh networking principles:**
- **Every node is infrastructure.** You do not connect TO the network — you ARE the network. Each device that joins extends the coverage and adds redundancy.
- **Self-healing.** When a node goes down, the remaining nodes recalculate routes. The network adapts without human intervention.
- **Range extension.** A mesh of short-range radios can cover a much larger area than a single powerful transmitter. Each hop covers the distance between neighboring nodes.

### 8.4 Mesh Technologies

| Technology | Range | Throughput | Power | Use Case |
|-----------|-------|-----------|-------|----------|
| **Wi-Fi Mesh (802.11s)** | 30-100m per hop | High (hundreds of Mbps) | High | Home/office mesh, event networks |
| **Bluetooth Mesh** | 10-30m per hop | Low (1 Mbps) | Very low | IoT sensors, lighting control |
| **LoRa Mesh (Meshtastic)** | 1-10 km per hop | Very low (0.3-50 kbps) | Very low | Off-grid messaging, wilderness, disaster response |
| **802.11ah (Wi-Fi HaLow)** | Up to 1 km | Moderate | Low | IoT, smart agriculture |

### 8.5 Building a Mesh — The Playa Principle

The mesh networking model mirrors the principle that infrastructure is built by participation. In a traditional network, a single entity provides the connectivity — the ISP, the corporate IT department, the venue's Wi-Fi. In a mesh, every participant is also a provider. [SRC-MESH]

**A practical example: event mesh networking**

At a large outdoor event (a festival, a field day, a community gathering), traditional Wi-Fi fails because:
- The area is too large for a few access points
- Power infrastructure may not exist
- The number of users overwhelms centralized capacity
- There is no pre-existing network infrastructure

A mesh solves this:

```
Setup:
1. Place solar-powered mesh nodes at intervals across the area
   (every 50-100 meters for Wi-Fi mesh, every few km for LoRa)

2. Each node runs open-source mesh firmware:
   - OpenWrt + batman-adv for Wi-Fi mesh
   - Meshtastic for LoRa mesh

3. Participants' phones connect to the nearest node for local
   services, or run Meshtastic directly to join the LoRa mesh

4. Gateway nodes with satellite or cellular uplinks provide
   internet access that the mesh distributes

5. As more people arrive and activate their devices, the mesh
   gets denser and more resilient
```

**The key insight:** the network you build IS the infrastructure that connects everyone. You do not wait for someone to provide it. You bring a node, your neighbor brings a node, and between you there is a network. Scale that to hundreds of participants and you have robust coverage that no single point of failure can take down.

Cross-reference: [SHE Module 3](../../SHE/research/03-connectivity-protocols.md) covers MQTT and IoT communication protocols. [BPS](../../BPS/research/) covers sensor networks. [Access & Bandwidth](06-access-bandwidth.md) covers mesh trust and bandwidth allocation.

### 8.6 Mesh Security Considerations

Mesh networks inherit all the security concerns of wireless networking plus additional ones from the distributed trust model:

| Concern | Description | Mitigation |
|---------|-------------|-----------|
| **Eavesdropping** | Radio is broadcast — anyone in range can capture frames | WPA3 encryption, end-to-end encryption for application data |
| **Rogue nodes** | A malicious device joins the mesh and intercepts traffic | Node authentication (PSK, certificates), mesh key management |
| **Sybil attack** | One attacker creates many fake node identities to dominate routing | Identity binding (MAC, hardware attestation), reputation systems |
| **Wormhole attack** | Two colluding nodes create a tunnel that shortcuts the mesh, disrupting routing | Geographic validation, round-trip timing checks |
| **Bandwidth abuse** | One node consumes disproportionate mesh capacity | Per-node rate limiting, QoS, fair queuing |

The sysadmin's approach: encrypt at every layer (WPA3 for the link, TLS for the application). Authenticate nodes before they join the mesh. Monitor traffic patterns for anomalies. The mesh is powerful because it is distributed — and that same distribution means you cannot trust every node implicitly. Trust is earned, verified, and monitored.

---

## 9. Cross-Reference

| Topic | This Module | Related Module | Connection |
|-------|------------|----------------|------------|
| Server network config | Section 2 (IP/subnets) | [Server Foundations](01-server-foundations.md) | Interface configuration, `/etc/netplan`, `ip addr` |
| DNS logging and forensics | Section 3 (DNS) | [The Logs](03-the-logs.md) | DNS query logging, resolution failure diagnosis |
| Firewall log analysis | Section 6 (firewall rules) | [The Logs](03-the-logs.md) | Interpreting dropped packet logs, connection tracking |
| Network process forensics | Section 1.4 (ports) | [Process Forensics](04-process-forensics.md) | `ss`, `lsof -i`, identifying which process owns a connection |
| Bandwidth allocation | Section 7 (QoS) | [Access & Bandwidth](06-access-bandwidth.md) | Trust-based bandwidth allocation, rate limiting |
| Network security posture | Section 6 (firewalls) | [Security Operations](07-security-operations.md) | Defense in depth, network segmentation, IDS/IPS |
| IoT protocols | Section 8 (wireless) | [SHE Module 3](../../SHE/research/03-connectivity-protocols.md) | MQTT, CoAP, Zigbee, Z-Wave overlay on IP networks |
| Sensor networks | Section 8 (mesh) | [BPS](../../BPS/research/) | Distributed sensing, data backhaul, mesh telemetry |
| Mesh trust model | Section 8.6 (mesh security) | [Access & Bandwidth](06-access-bandwidth.md) | Trust levels, identity, bandwidth fairness |

---

## 10. Sources

| ID | Source | Description |
|----|--------|-------------|
| SRC-TCP | [RFC 793: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc793) | Original TCP specification — connection establishment, reliability, flow control. Updated by RFC 9293 (2022). |
| SRC-UDP | [RFC 768: User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768) | UDP specification — connectionless, best-effort datagram service. One of the shortest RFCs ever written. |
| SRC-IPv4 | [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) | IPv4 specification — addressing, fragmentation, routing, header format. |
| SRC-IPv6 | [RFC 8200: Internet Protocol, Version 6](https://www.rfc-editor.org/rfc/rfc8200) | IPv6 specification — 128-bit addressing, simplified header, extension headers. |
| SRC-CIDR | [RFC 4632: CIDR: The Internet Address Assignment and Aggregation Plan](https://www.rfc-editor.org/rfc/rfc4632) | Classless addressing — how the internet moved beyond Class A/B/C. |
| SRC-RFC1918 | [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) | Private address ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. |
| SRC-NAT | [RFC 3022: Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022) | NAT operation — address translation, port mapping, connection tracking. |
| SRC-DNS | [RFC 1035: Domain Names — Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) | DNS protocol — message format, record types, resolution process. |
| SRC-DNSSEC | [RFC 4033: DNS Security Introduction and Requirements](https://www.rfc-editor.org/rfc/rfc4033) | DNSSEC overview — authentication of DNS data, chain of trust. |
| SRC-DHCP | [RFC 2131: Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131) | DHCP operation — DORA process, lease management, options. |
| SRC-ROUTE | [ip-route(8) man page](https://man7.org/linux/man-pages/man8/ip-route.8.html) | Linux routing table management — route add/del/show, policy routing. |
| SRC-BGP | [RFC 4271: A Border Gateway Protocol 4](https://www.rfc-editor.org/rfc/rfc4271) | BGP specification — path attributes, route selection, peering, AS path. |
| SRC-NFT | [nftables wiki](https://wiki.nftables.org/) | nftables documentation — table/chain/rule structure, syntax, migration from iptables. |
| SRC-IPT | [iptables(8) man page](https://linux.die.net/man/8/iptables) | iptables documentation — chain operations, match extensions, target actions. |
| SRC-OSI | [ISO/IEC 7498-1: OSI Basic Reference Model](https://www.iso.org/standard/20269.html) | The seven-layer OSI model — reference framework for network architecture. |
| SRC-BW | [RFC 5136: Defining Network Capacity](https://www.rfc-editor.org/rfc/rfc5136) | Formal definitions of bandwidth, capacity, throughput, and their measurement. |
| SRC-QOS | [RFC 2474: Definition of the Differentiated Services Field](https://www.rfc-editor.org/rfc/rfc2474) | DiffServ — DSCP markings for QoS classification. Foundation of modern traffic prioritization. |
| SRC-WIFI | [IEEE 802.11-2020](https://standards.ieee.org/standard/802_11-2020.html) | Wi-Fi standard — PHY and MAC specifications for wireless LAN. |
| SRC-MESH | [RFC 6550: RPL: IPv6 Routing Protocol for Low-Power and Lossy Networks](https://www.rfc-editor.org/rfc/rfc6550) | Mesh routing protocol designed for constrained devices. Foundational for IoT mesh networking. |

---

## The Through-Line

The network is infrastructure. Cables, radios, switches, routers — they are as physical as pipes and wires. The IP address is the house number. The subnet is the neighborhood. The default gateway is the road out of the neighborhood. DNS is the phone book. The firewall is the door policy. The bandwidth is the width of the road.

Every one of these systems leaves a trail. DNS queries are logged. Firewall drops are logged. Packet captures reveal exactly what traveled the wire. The sysadmin reads these trails to understand what the network is actually doing — not what it was configured to do, but what it is doing right now.

The anti-waste principle applies at every layer. Do not accept traffic you did not ask for. Do not route packets you do not need to carry. Do not allocate bandwidth to services that have no purpose. The pipe is paid for, the addresses are allocated, the ports are bound. Every resource is finite. The admin decides what earns its place on the wire.

In a mesh, every node is infrastructure. You do not connect to the network — you are the network. The more participants, the more resilient the mesh. The cost of participation is carrying traffic for others. The benefit is a network that no single failure can kill. That is the utility model: infrastructure built by the people who use it, maintained by the people who care about it, available to everyone who participates.

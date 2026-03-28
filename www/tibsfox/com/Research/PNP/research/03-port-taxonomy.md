# Port Taxonomy

> **Domain:** Network Addressing
> **Module:** 3 -- IANA Port Ranges, RFC 6335, and the Addressing Layer
> **Through-line:** *The port number is the slot in the membrane between a process and the network. Port 80 carries HTTP. Port 443 carries HTTPS. Port 22 carries SSH. These numbers are not arbitrary. They are agreements, and agreements are what allow strangers to collaborate. The entire internet runs on 65,536 numbered doorways, and the rules governing who gets which number are as carefully maintained as any piece of critical infrastructure.*

---

## Table of Contents

1. [The Port as Addressing Layer](#1-the-port-as-addressing-layer)
2. [The Three IANA Ranges](#2-the-three-iana-ranges)
3. [RFC 6335: The Governing Document](#3-rfc-6335-the-governing-document)
4. [Port Assignment States](#4-port-assignment-states)
5. [Well-Known Ports (0-1023)](#5-well-known-ports-0-1023)
6. [Registered Ports (1024-49151)](#6-registered-ports-1024-49151)
7. [Ephemeral Ports and Kernel Configuration](#7-ephemeral-ports-and-kernel-configuration)
8. [TIME_WAIT and Port Reuse](#8-time_wait-and-port-reuse)
9. [Port Scanning and Service Discovery](#9-port-scanning-and-service-discovery)
10. [Firewall Rules by Port](#10-firewall-rules-by-port)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Port as Addressing Layer

An IP address identifies a host. A port number identifies a service on that host. Together, the (IP, port, protocol) tuple uniquely identifies a network endpoint. The port is a 16-bit unsigned integer, giving a total address space of 65,536 ports (0 through 65,535) for each transport protocol [1].

```
NETWORK ADDRESSING HIERARCHY
================================================================

  Layer 2 (Link):      MAC address       → identifies the NIC
  Layer 3 (Network):   IP address        → identifies the host
  Layer 4 (Transport): Port number       → identifies the service
  Layer 7 (App):       URL path / SNI    → identifies the resource

  The full address:  TCP://192.168.1.100:8080/api/v1
                     ^^^  ^^^^^^^^^^^^^^^^^^^  ^^^^^^
                     proto  IP:port             path

  Port is the LAST routing decision the kernel makes.
  After port selection, bytes are delivered to the process's socket buffer.
```

Port numbers exist because a single host typically runs multiple network services simultaneously. Without port numbers, the kernel would have no way to demultiplex incoming packets to the correct process. The port number is to the network stack what the file descriptor is to the process: a handle that routes data to the right consumer [1].

> **Related:** [BSD Socket API](04-bsd-socket-api.md) shows how processes bind to ports. [IPC Performance Spectrum](05-ipc-performance-spectrum.md) measures the overhead of TCP port-based communication vs. pipe-based IPC.

---

## 2. The Three IANA Ranges

The Internet Assigned Numbers Authority (IANA) divides the 16-bit port space into three ranges. This division was formalized in RFC 6335 (Cotton et al., August 2011) and applies equally to TCP, UDP, SCTP, and DCCP [2]:

| Range Name | Numbers | Count | Assignment Authority |
|-----------|---------|-------|---------------------|
| System / Well-Known | 0 -- 1,023 | 1,024 | IETF Review or IESG Approval required |
| User / Registered | 1,024 -- 49,151 | 48,128 | IETF Expert Review process |
| Dynamic / Private / Ephemeral | 49,152 -- 65,535 | 16,384 | Never assigned by IANA |

```
TCP/UDP PORT NUMBER SPACE (16-bit: 0 - 65535)
================================================================

 0         1023        49151                    65535
 |─────────|───────────|────────────────────────|
 System    Registered  Dynamic / Ephemeral
 Ports     Ports       Ports (never IANA-assigned)
 (1,024)   (48,128)    (16,384)

 IANA assignment procedures: RFC 6335 (BCP 165, August 2011)
 System:     IETF Review or IESG Approval required
 Registered: Expert Review process
 Dynamic:    No assignment; OS uses for client-side ephemeral ports

 Linux ephemeral range: /proc/sys/net/ipv4/ip_local_port_range
                        default: 32768 – 60999
```

Note that Linux's default ephemeral range (32,768--60,999) is wider than and partially overlaps the IANA dynamic range (49,152--65,535). This is intentional: Linux allocates more ephemeral ports to reduce port exhaustion under high connection rates [3].

---

## 3. RFC 6335: The Governing Document

RFC 6335 (BCP 165), published in August 2011 by Cotton, Eggert, Touch, Westerlund, and Cheshire, is the authoritative specification for port number management. Key provisions [2]:

**Assignment principles:**
- A port number is a protocol-independent resource: assigning port 80 to HTTP means port 80/tcp AND port 80/udp are both assigned, unless the applicant explicitly requests only one transport
- Service names and port numbers are maintained in a single IANA registry
- De-registration, re-use, and revocation procedures are defined for abandoned assignments
- Port 0 is reserved: it may not be used as a source or destination port in any protocol

**Assignment saturation at time of RFC:**
- System Ports: approximately 76% assigned
- Registered Ports: approximately 9% assigned
- Dynamic Ports: 0% assigned (by definition)

**Service Name requirements:**
- 1-15 characters from [a-z0-9-]
- Must begin and end with a letter or digit
- Must not contain consecutive hyphens
- Must be unique across all transport protocols

The assignment process for System Ports requires full IETF Review or explicit IESG Approval, making new assignments rare and carefully vetted. This is why most modern services use Registered Ports or Ephemeral Ports [2].

---

## 4. Port Assignment States

Each assignable port (0--49,151) exists in one of three states [2]:

| State | Meaning |
|-------|---------|
| Assigned | Currently assigned to the indicated service name and contact |
| Unassigned | Available for new assignment upon qualified request |
| Reserved | Held for a specific purpose without a full service assignment (e.g., protocol may later add transport support) |

The registry is publicly searchable at iana.org/assignments/service-names-port-numbers. As of March 2026, the registry contains over 10,000 entries across all three ranges and all four transport protocols [4].

---

## 5. Well-Known Ports (0-1023)

System Ports require privileged access on Unix systems. Historically, only root (UID 0) could bind to ports below 1024. Modern Linux provides finer-grained control through the CAP_NET_BIND_SERVICE capability, which can be granted to specific executables [5].

| Port | Service | Protocol | RFC / Standard | Relevance |
|------|---------|----------|---------------|-----------|
| 0 | Reserved | -- | RFC 6335 | Cannot be used; bind(port=0) requests OS-assigned ephemeral |
| 1 | TCPMUX | TCP | RFC 1078 | TCP port service multiplexer (historic) |
| 7 | Echo | TCP/UDP | RFC 862 | Echoes any data received; network debugging |
| 20 | FTP-data | TCP | RFC 959 | FTP data channel (active mode) |
| 21 | FTP | TCP | RFC 959 | FTP control channel |
| 22 | SSH | TCP | RFC 4253 | Secure Shell; remote system access; GSD remote execution |
| 23 | Telnet | TCP | RFC 854 | Unencrypted terminal; BBS educational reference |
| 25 | SMTP | TCP | RFC 5321 | Simple Mail Transfer Protocol |
| 53 | DNS | TCP/UDP | RFC 1035 | Domain Name System; TCP for zone transfers, UDP for queries |
| 67 | DHCP server | UDP | RFC 2131 | Dynamic Host Configuration Protocol (server) |
| 68 | DHCP client | UDP | RFC 2131 | Dynamic Host Configuration Protocol (client) |
| 70 | Gopher | TCP | RFC 1436 | Pre-web information protocol; BBS educational pack |
| 79 | Finger | TCP | RFC 1288 | User lookup protocol; BBS era |
| 80 | HTTP | TCP | RFC 9110 | Hypertext Transfer Protocol; MCP Streamable HTTP |
| 110 | POP3 | TCP | RFC 1939 | Post Office Protocol version 3 |
| 119 | NNTP | TCP | RFC 3977 | Usenet news transport; BBS educational pack |
| 123 | NTP | UDP | RFC 5905 | Network Time Protocol |
| 143 | IMAP | TCP | RFC 9051 | Internet Message Access Protocol |
| 161 | SNMP | UDP | RFC 3416 | Simple Network Management Protocol |
| 443 | HTTPS | TCP | RFC 9110 | HTTP over TLS; MCP Streamable HTTP production |
| 465 | SMTPS | TCP | RFC 8314 | SMTP over TLS (historically complex assignment history) |
| 514 | Syslog | UDP | RFC 5424 | BSD syslog protocol |
| 587 | Submission | TCP | RFC 6409 | SMTP mail submission |
| 993 | IMAPS | TCP | RFC 8314 | IMAP over TLS |

> **Related:** The DNS project covers port 53 in depth. The TCP project covers the transport layer. The SYS project covers sysadmin port management. The SSH project covers port 22 authentication.

---

## 6. Registered Ports (1024-49151)

Registered Ports are available through the IETF Expert Review process. Any entity can request assignment. Key registered ports relevant to infrastructure and GSD [4]:

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 1080 | SOCKS | TCP | SOCKS proxy protocol |
| 1433 | MSSQL | TCP | Microsoft SQL Server |
| 1521 | Oracle | TCP | Oracle database listener |
| 2049 | NFS | TCP/UDP | Network File System |
| 2375 | Docker | TCP | Docker REST API (unencrypted) |
| 2376 | Docker-TLS | TCP | Docker REST API (TLS) |
| 3306 | MySQL | TCP | MySQL/MariaDB database |
| 3389 | RDP | TCP | Remote Desktop Protocol |
| 5432 | PostgreSQL | TCP | PostgreSQL database |
| 5672 | AMQP | TCP | Advanced Message Queuing Protocol |
| 6379 | Redis | TCP | Redis in-memory data store |
| 6443 | K8s API | TCP | Kubernetes API server (default) |
| 8080 | HTTP-alt | TCP | Common HTTP alternate; conflict-prone |
| 8443 | HTTPS-alt | TCP | Common HTTPS alternate |
| 9090 | Prometheus | TCP | Prometheus metrics (common convention, not IANA-assigned) |
| 9200 | Elasticsearch | TCP | Elasticsearch HTTP API |
| 27017 | MongoDB | TCP | MongoDB database |
| 44818 | EtherNet/IP | TCP/UDP | Industrial Ethernet protocol |

Port 8080 deserves special caution: it is the most commonly used "alternate HTTP" port but has no formal IANA assignment. Dozens of unrelated services default to 8080, creating collision risk in environments running multiple services [6].

---

## 7. Ephemeral Ports and Kernel Configuration

When a client initiates a TCP or UDP connection without calling bind(), the operating system selects an ephemeral port from the dynamic range. The kernel configuration varies by operating system [3][7]:

| OS | Default Ephemeral Range | Configuration |
|----|------------------------|---------------|
| Linux | 32,768 -- 60,999 | /proc/sys/net/ipv4/ip_local_port_range |
| macOS | 49,152 -- 65,535 | sysctl net.inet.ip.portrange.first/last |
| FreeBSD | 49,152 -- 65,535 | sysctl net.inet.ip.portrange.first/last |
| Windows | 49,152 -- 65,535 | netsh int ipv4 show dynamicport tcp |
| IANA recommended | 49,152 -- 65,535 | RFC 6335 Section 6 |

Linux's wider range (28,232 ports vs. IANA's 16,384) provides more headroom for high-connection-rate services. A busy web server or load balancer making thousands of outbound connections per second can exhaust a narrow ephemeral range quickly [3].

```
EPHEMERAL PORT EXHAUSTION SCENARIO
================================================================

  Web server → upstream API:
    Each HTTP request = 1 TCP connection = 1 ephemeral port
    Default range: 28,232 ports (Linux)
    TIME_WAIT hold: ~60 seconds

    Sustainable rate = 28,232 / 60 ≈ 470 new connections/second
    (before factoring in TIME_WAIT recycling)

    At 1,000 conn/sec: exhaustion in ~28 seconds without recycling
    Solution: SO_REUSEADDR + connection pooling + wider range
```

**Checking and configuring the range:**
```
# View current range
cat /proc/sys/net/ipv4/ip_local_port_range
# Output: 32768	60999

# Widen the range (temporary, until reboot)
echo "1024 65535" > /proc/sys/net/ipv4/ip_local_port_range

# Persistent via sysctl.conf
echo "net.ipv4.ip_local_port_range = 1024 65535" >> /etc/sysctl.conf
sysctl -p
```

---

## 8. TIME_WAIT and Port Reuse

After a TCP connection closes, the local port enters the TIME_WAIT state for 2 x MSL (Maximum Segment Lifetime). The MSL is typically 60 seconds on Linux, making the TIME_WAIT duration approximately 60 seconds (Linux uses a fixed 60-second TIME_WAIT rather than strict 2xMSL) [8].

During TIME_WAIT, the port cannot be rebound by default. This prevents delayed packets from a previous connection being misdelivered to a new connection on the same port. The mechanism is essential for TCP correctness but can cause operational problems [8]:

| Problem | Symptom | Solution |
|---------|---------|---------|
| Server restart | bind() returns EADDRINUSE on the service port | SO_REUSEADDR before bind() |
| High connection rate | EADDRINUSE on ephemeral ports | SO_REUSEADDR + wider range |
| Load balancing | Multiple processes need same port | SO_REUSEPORT (Linux 3.9+) |
| Connection table full | Cannot open new connections | tcp_tw_reuse=1 (sysctl) |

```
SOCKET OPTIONS FOR PORT REUSE
================================================================

  SO_REUSEADDR (all Unix):
    Allows bind() to succeed on a TIME_WAIT port
    Does NOT allow two active sockets on the same port
    Set before bind(): setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(one))

  SO_REUSEPORT (Linux 3.9+):
    Allows multiple sockets to bind to the same port simultaneously
    Kernel distributes incoming connections across sockets
    Each socket must set SO_REUSEPORT, and all must have same effective UID
    Used for multi-process server architectures (nginx, envoy)

  tcp_tw_reuse (Linux sysctl):
    /proc/sys/net/ipv4/tcp_tw_reuse = 1
    Allows new outbound connections to reuse TIME_WAIT sockets
    Only affects outbound connections (client-side ephemeral ports)
```

> **SAFETY WARNING:** SO_REUSEPORT without careful access control can allow a malicious process to bind to a service port and steal connections. All processes sharing a port must have the same effective UID, but this is enforced only at bind() time.

---

## 9. Port Scanning and Service Discovery

Port scanning is the process of probing a host's ports to determine which services are running. It is a fundamental network reconnaissance technique used by both security auditors and network administrators [9].

**nmap scan types (methodology only):**

| Scan Type | Technique | Detection Level |
|-----------|----------|----------------|
| TCP Connect | Full TCP handshake (SYN-SYN/ACK-ACK) | Logged by target |
| SYN Scan | SYN only; RST if open; no full connection | Half-open; lower footprint |
| UDP Scan | UDP packet; ICMP Port Unreachable if closed | Slow; unreliable |
| Version | Banner grab on open ports | Identifies service software |

**netstat and ss -- Local service discovery:**

```
# Show all listening TCP ports with process names
ss -tlnp

# Show all established connections
ss -tnp

# Legacy: netstat (deprecated on modern Linux; use ss)
netstat -tlnp

# Show which process owns a specific port
ss -tlnp | grep :8080
# or: lsof -i :8080
```

The `ss` command (socket statistics) is the modern replacement for netstat on Linux. It reads directly from kernel data structures via netlink, making it faster and more reliable than netstat's /proc parsing approach [10].

> **SAFETY WARNING:** This section describes port scanning methodology for educational and administrative purposes. No working exploit code, CVE reproduction steps, or active exploitation guidance is provided. Port scanning without authorization may violate network policies or laws depending on jurisdiction.

---

## 10. Firewall Rules by Port

Firewalls filter network traffic by (source IP, source port, destination IP, destination port, protocol) tuples. Port-based rules are the most common firewall configuration [11]:

```
LINUX IPTABLES / NFTABLES EXAMPLES
================================================================

  # Allow SSH (port 22) from specific subnet
  iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT

  # Allow HTTP/HTTPS from anywhere
  iptables -A INPUT -p tcp --dport 80 -j ACCEPT
  iptables -A INPUT -p tcp --dport 443 -j ACCEPT

  # Allow GSD-OS local API (registered range)
  iptables -A INPUT -p tcp --dport 8432 -s 127.0.0.1 -j ACCEPT

  # Drop everything else to System Ports
  iptables -A INPUT -p tcp --dport 0:1023 -j DROP

  # nftables equivalent (modern)
  nft add rule inet filter input tcp dport 22 ip saddr 192.168.1.0/24 accept
  nft add rule inet filter input tcp dport {80, 443} accept
```

**Port-based security principle:** Expose the minimum number of ports required. Each open port is an attack surface. System Ports (0-1023) carry well-known services with known vulnerability profiles. Registered Ports carry application-specific services. Ephemeral Ports should never be exposed externally [11].

---

## 11. Port Exhaustion and Monitoring

Port exhaustion is a production failure mode where all ephemeral ports are consumed, preventing new outbound connections. It manifests as EADDRINUSE errors from connect() or bind(port=0) [3][8]:

### Symptoms

```
# Detecting port exhaustion
ss -s
# Output includes: TCP: XX (estab AA, closed BB, timewait CC, ...)
# High timewait count = ports stuck in TIME_WAIT

# Count connections by state
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
# Large TIME-WAIT count is the primary indicator

# Count ephemeral ports in use
ss -tan | awk '$4 ~ /:[3-6][0-9]{4}$/' | wc -l
```

### Mitigation Strategies

| Strategy | Configuration | Effect |
|----------|--------------|--------|
| Widen ephemeral range | ip_local_port_range = "1024 65535" | 4x more ephemeral ports |
| Enable TIME_WAIT reuse | tcp_tw_reuse = 1 | Allows outbound connections to reuse TIME_WAIT ports |
| Reduce TIME_WAIT duration | Not directly configurable on Linux | Linux uses fixed 60s; cannot reduce |
| Connection pooling | Application-level | Reuse connections; fewer ephemeral ports consumed |
| SO_REUSEADDR | setsockopt() before bind() | Allows binding to TIME_WAIT ports |
| HTTP keepalive | Connection: keep-alive | Single TCP connection for multiple requests |

### The 28-Second Rule

With the default Linux ephemeral range (32,768-60,999 = 28,232 ports) and a 60-second TIME_WAIT, the maximum sustainable new-connection rate without port reuse is:

```
28,232 ports / 60 seconds = ~470 connections/second

At 1,000 connections/second:
  28,232 / 1,000 = ~28 seconds to exhaust

At 10,000 connections/second (busy load balancer):
  28,232 / 10,000 = ~2.8 seconds to exhaust
```

This is why production load balancers always enable tcp_tw_reuse and use connection pooling. GSD's planning-bridge MCP server, when handling multiple concurrent session handoffs, should prefer Unix domain sockets for same-host traffic to avoid ephemeral port consumption entirely [3][8].

### Port Assignment Archaeology

Some well-known port assignments carry decades of history. Port 465 (SMTPS) was assigned to SMTP over SSL in 1997, then revoked when STARTTLS was preferred, then re-assigned in 2018 by RFC 8314. Port 1023 was historically the last port usable by rlogin/rsh for "trusted" host-to-host authentication (ports < 1024 implying root privilege). Port 6667 is the conventional IRC port but was never formally assigned by IANA -- it became standard through pure convention [4][12].

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| IANA port taxonomy | M3 (this module) | TCP, DNS, SYS, RFC |
| RFC 6335 procedures | M3 | RFC |
| Well-known port assignments | M3, M6 | TCP, DNS, SYS, K8S, SSH |
| Ephemeral port configuration | M3, M5 | SYS, K8S |
| TIME_WAIT / SO_REUSEADDR | M3, M4 | TCP, SYS |
| Port scanning / ss / netstat | M3, M6 | SYS, CMH, SAN |
| Firewall rules | M3 | SYS, K8S, CMH |
| bind() EADDRINUSE | M3, M4 | SYS, TCP |

---

## 12. Sources

1. Tanenbaum, A.S. and Wetherall, D.J. (2011). *Computer Networks*, 5th ed. Pearson. Chapter 6: The Transport Layer.
2. Cotton, M., Eggert, L., Touch, J., Westerlund, M., Cheshire, S. (2011). "Internet Assigned Numbers Authority (IANA) Procedures for the Management of the Service Name and Transport Protocol Port Number Registry." RFC 6335, BCP 165, IETF.
3. Linux man-pages project. ip(7) -- /proc/sys/net/ipv4/ip_local_port_range. man7.org. Accessed March 2026.
4. IANA. Service Name and Transport Protocol Port Number Registry. iana.org/assignments/service-names-port-numbers. Accessed March 2026.
5. Linux man-pages project. capabilities(7) -- CAP_NET_BIND_SERVICE. man7.org. Accessed March 2026.
6. IANA registry analysis. Port 8080 is listed as "http-alt" but shared by multiple services including Apache Tomcat, Jenkins, and numerous development tools.
7. Microsoft Learn. "Ephemeral Port Range." learn.microsoft.com. Accessed March 2026.
8. Stevens, W.R. (1994). *TCP/IP Illustrated, Volume 1*. Addison-Wesley. Chapter 18: TCP Connection Management -- TIME_WAIT state.
9. Lyon, G. (2009). *Nmap Network Scanning*. Insecure.Com LLC. Chapter 5: Port Scanning Techniques.
10. Linux man-pages project. ss(8) -- socket statistics. man7.org. Accessed March 2026.
11. Rash, M. (2007). *Linux Firewalls: Attack Detection and Response*. No Starch Press. Chapter 3: iptables/nftables rule construction.
12. RFC 793 (Postel, 1981). Transmission Control Protocol. IETF.
13. RFC 768 (Postel, 1980). User Datagram Protocol. IETF.
14. RFC 5905 (Mills et al., 2010). Network Time Protocol Version 4. IETF.
15. Baeldung on Linux. "Understanding TCP TIME_WAIT State." 2025.

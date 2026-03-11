# Glossary — Systems Administration

Comprehensive terminology for the SYS research atlas. Each term lists the modules where it appears. Every system leaves a trail — this glossary maps the vocabulary of reading that trail.

---

## Server & Operating System

| Term | Definition | Modules |
|------|-----------|---------|
| **Daemon** | A background process that runs without direct user interaction, typically started at boot and managed by an init system. Named from Maxwell's demon — a sorting agent that works unseen. | Server, Logs, Security |
| **systemd** | The default init system and service manager for most modern Linux distributions. Manages service lifecycle, dependencies, resource limits, logging (journald), and socket activation. | Server, Logs, Forensics |
| **init** | The first process started by the kernel (PID 1). Responsible for bootstrapping userspace. Historically SysVinit, now usually systemd. All other processes descend from init. | Server, Forensics |
| **Process** | An instance of a running program. Has a PID, memory space, file descriptors, and a lifecycle (created, running, sleeping, stopped, zombie). The kernel schedules and isolates processes. | Server, Forensics, Logs |
| **PID** | Process Identifier. A unique integer assigned by the kernel to each running process. PID 1 is init. PIDs are recycled after process termination. `/proc/<pid>/` exposes process state. | Server, Forensics, Logs |
| **Signal** | An asynchronous notification sent to a process. Common signals: SIGTERM (graceful shutdown), SIGKILL (forced kill), SIGHUP (reload config), SIGINT (interrupt from terminal). Signals cannot be caught for SIGKILL and SIGSTOP. | Server, Forensics |
| **Kernel** | The core of the operating system. Manages hardware, memory, process scheduling, and system calls. Runs in privileged mode (ring 0). Userspace programs interact with the kernel through syscalls. | Server, Forensics, Security |
| **Inode** | A data structure on a filesystem that stores metadata about a file — permissions, ownership, timestamps, block pointers. Does not store the filename; directory entries map names to inode numbers. | Server, Provenance |
| **Filesystem** | The structure that organizes data on storage media. ext4, XFS, Btrfs, ZFS each have different journal, snapshot, and integrity guarantees. Choice of filesystem affects provenance and recovery. | Server, Provenance, Security |
| **Mount point** | A directory where an additional filesystem is attached to the directory tree. `/etc/fstab` defines persistent mounts. `mount` and `umount` manage the attachment at runtime. | Server |
| **Symlink** | A symbolic link — a special file that points to another file or directory by path. Unlike hard links, symlinks can cross filesystem boundaries and can point to nonexistent targets (dangling). | Server, Provenance |
| **Permission bits** | The Unix file permission model: owner/group/other, each with read/write/execute. Represented as octal (755) or symbolic (rwxr-xr-x). The kernel enforces these on every file access. | Server, Security, Access |
| **ACL** | Access Control List. Extends basic Unix permissions with fine-grained per-user and per-group access rules. `setfacl`/`getfacl` manage ACLs. Supported on ext4, XFS, Btrfs. | Server, Security, Access |
| **cgroup** | Control group. A Linux kernel feature that limits, accounts for, and isolates resource usage (CPU, memory, I/O, network) of process groups. Foundation of container isolation. | Server, Forensics, Access |
| **Nice value** | A process scheduling priority hint ranging from -20 (highest priority) to 19 (lowest). Lower values get more CPU time. `nice` sets it at launch, `renice` adjusts it live. | Server, Forensics, Access |
| **Swap** | Disk space used as overflow when physical RAM is exhausted. The kernel's page replacement algorithm moves inactive pages to swap. Excessive swapping (thrashing) signals memory pressure. | Server, Forensics |
| **OOM Killer** | Out-Of-Memory Killer. The kernel's last resort when memory is exhausted — selects and terminates processes based on an oom_score to free memory. Logged in kernel ring buffer and journald. | Server, Forensics, Logs |
| **Zombie process** | A process that has finished execution but still has an entry in the process table because its parent hasn't read its exit status (via `wait()`). Shows as `Z` in `ps`. | Server, Forensics |

---

## Network & Transport

| Term | Definition | Modules |
|------|-----------|---------|
| **TCP/IP** | Transmission Control Protocol / Internet Protocol. The fundamental protocol suite of the internet. IP handles addressing and routing; TCP provides reliable, ordered, connection-oriented byte streams. | Network, Security, Logs |
| **UDP** | User Datagram Protocol. A connectionless transport protocol. No handshake, no guaranteed delivery, no ordering. Lower overhead than TCP. Used for DNS queries, NTP, streaming, gaming. | Network, Logs |
| **DNS** | Domain Name System. Translates human-readable domain names to IP addresses. Hierarchical and distributed — root servers, TLD servers, authoritative servers, recursive resolvers, local cache. | Network, Security, Provenance |
| **DHCP** | Dynamic Host Configuration Protocol. Automatically assigns IP addresses, subnet masks, default gateways, and DNS servers to clients on a network. Lease-based with configurable duration. | Network, Server |
| **NAT** | Network Address Translation. Maps private internal addresses to public addresses for outbound traffic. Allows multiple devices to share a single public IP. Stateful — the NAT table tracks connections. | Network, Security |
| **Routing table** | A data structure in the kernel (or router) that determines where to forward packets based on destination address. Static routes are manually configured; dynamic routes come from protocols (OSPF, BGP). | Network |
| **Firewall** | A system that filters network traffic based on rules. Inspects packet headers (and sometimes payloads) to allow, deny, or redirect traffic. The gatekeeper between trust zones. | Network, Security, Access |
| **iptables** | The legacy Linux userspace tool for configuring the kernel's netfilter packet filtering framework. Uses chains (INPUT, OUTPUT, FORWARD) and tables (filter, nat, mangle). Being replaced by nftables. | Network, Security |
| **nftables** | The modern replacement for iptables. Unified framework for packet filtering, NAT, and traffic classification. Cleaner syntax, better performance, single tool (`nft`) for all operations. | Network, Security |
| **VLAN** | Virtual LAN. Logically segments a physical network into isolated broadcast domains using 802.1Q tagging. Traffic between VLANs requires a router. Used to separate trust zones on shared hardware. | Network, Security, Access |
| **Subnet** | A logical subdivision of an IP network. Defined by a network address and subnet mask. Subnetting controls broadcast domain size and enables hierarchical address allocation. | Network |
| **CIDR** | Classless Inter-Domain Routing. A compact notation for IP addresses and their routing prefix — e.g., 192.168.1.0/24 means 256 addresses. Replaced the old Class A/B/C system. | Network |
| **Gateway** | A network node that serves as the access point to another network. The default gateway is the router that forwards packets destined for addresses outside the local subnet. | Network |
| **ARP** | Address Resolution Protocol. Maps IP addresses to MAC addresses on a local network. Broadcasts "who has this IP?" and caches responses. ARP spoofing is a common local-network attack. | Network, Security |
| **MAC address** | Media Access Control address. A 48-bit hardware identifier assigned to a network interface. Format: XX:XX:XX:XX:XX:XX. Used for layer-2 (data link) addressing within a local network. | Network, Security |
| **Bandwidth** | The maximum data transfer rate of a network link, measured in bits per second (Mbps, Gbps). Distinct from throughput (actual achieved rate) and latency (delay). | Network, Access |
| **Throughput** | The actual measured data transfer rate, always less than or equal to bandwidth. Affected by protocol overhead, congestion, packet loss, and application behavior. | Network, Access |
| **Latency** | The time delay between sending a request and receiving a response. Composed of propagation delay, processing delay, queuing delay, and serialization delay. Measured in milliseconds. | Network, Access |
| **QoS** | Quality of Service. Network mechanisms that prioritize certain traffic types over others. Implemented via traffic shaping, queuing disciplines, and DSCP markings. Stewardship of finite bandwidth. | Network, Access |
| **Rate limiting** | Controlling the number of requests or amount of traffic a client can generate in a given time window. Protects services from overload and abuse. Token bucket and leaky bucket are common algorithms. | Access, Security, Network |
| **Throttling** | Deliberately slowing down traffic or request processing when limits are approached. Differs from rate limiting (which drops excess) — throttling degrades gracefully instead of cutting off. | Access, Network |
| **Socket** | An endpoint for network communication. Defined by an IP address, port number, and protocol (TCP/UDP). Sockets are file descriptors — everything in Unix is a file, including network connections. | Network, Server |
| **Port** | A 16-bit number (0-65535) that identifies a specific service on a host. Well-known ports: 22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS). Ephemeral ports (49152-65535) for client-side connections. | Network, Security |

---

## Logs & Observability

| Term | Definition | Modules |
|------|-----------|---------|
| **syslog** | The standard logging protocol and system (RFC 5424). Defines message format (facility, severity, timestamp, hostname, message) and transport. The original Unix logging framework. | Logs, Server |
| **journald** | The systemd journal daemon. Binary structured logging with indexing, field-based filtering, and automatic rotation. `journalctl` queries the journal. Captures stdout/stderr of all systemd services. | Logs, Server, Forensics |
| **Log rotation** | The practice of archiving and eventually deleting old log files to prevent disk exhaustion. `logrotate` handles this — configurable by size, age, and count. Compressed archives preserve history. | Logs, Server |
| **Log aggregation** | Collecting logs from multiple sources into a central system for analysis. Tools: rsyslog forwarding, Elasticsearch/Logstash/Kibana (ELK), Loki/Grafana, Splunk. Essential for multi-server environments. | Logs, Network |
| **Log level** | Severity classification for log messages. Standard levels from most to least severe: EMERG, ALERT, CRIT, ERR, WARNING, NOTICE, INFO, DEBUG. Controls signal-to-noise ratio in log output. | Logs |
| **Structured logging** | Logging in machine-parseable formats (JSON, key-value pairs) rather than free-form text. Enables field-based querying, filtering, and aggregation. journald is structured by design. | Logs, Provenance |
| **Access log** | A record of every request served — typically by a web server (Apache, nginx) or proxy. Contains timestamp, client IP, requested resource, status code, bytes served, user agent. The canonical traffic record. | Logs, Access, Network |
| **Audit log** | A security-focused log recording who did what and when. Linux audit subsystem (`auditd`) tracks syscalls, file access, authentication events. Tamper-evident when properly configured. | Logs, Security, Provenance |

---

## Process Forensics & Monitoring

| Term | Definition | Modules |
|------|-----------|---------|
| **CPU load** | A measure of the number of processes in the run queue (running + waiting for CPU). Load average is reported over 1, 5, and 15 minutes. Load of 1.0 means one core is fully utilized. | Forensics, Server |
| **Memory pressure** | The state when the system is running low on available RAM. Indicated by increased swap usage, page faults, and OOM killer activation. Monitored via `/proc/meminfo` and `vmstat`. | Forensics, Server |
| **File descriptor** | An integer handle that the kernel assigns to an open file, socket, pipe, or device. Each process has a file descriptor table. Limits are per-process (`ulimit -n`) and system-wide (`/proc/sys/fs/file-max`). | Forensics, Server |
| **strace** | A diagnostic tool that traces system calls made by a process. Shows every interaction between a process and the kernel — file opens, reads, writes, network calls, signals. The sysadmin's magnifying glass. | Forensics |
| **lsof** | Lists open files for running processes. Since everything in Unix is a file (sockets, pipes, devices), `lsof` reveals what every process is connected to. Essential for finding port conflicts and leaked descriptors. | Forensics, Server |
| **top/htop** | Interactive process viewers showing real-time CPU, memory, and I/O usage per process. `htop` adds color, tree view, and mouse support. First tool for diagnosing resource contention. | Forensics |
| **vmstat** | Reports virtual memory statistics — processes, memory, paging, block I/O, traps, CPU. Running `vmstat 1` gives per-second snapshots. Reveals swap activity and context switch rates. | Forensics, Server |
| **iostat** | Reports CPU and I/O statistics for devices and partitions. Shows read/write rates, queue depth, and utilization. Identifies storage bottlenecks before they cascade to application timeouts. | Forensics |
| **Container** | An isolated process group using kernel namespaces (PID, network, mount, user) and cgroups (resource limits). Not a VM — shares the host kernel. Docker, Podman, LXC are common runtimes. | Forensics, Server, Security |

---

## Provenance & Time

| Term | Definition | Modules |
|------|-----------|---------|
| **Timestamp** | A recorded point in time. In logs, typically ISO 8601 (2026-03-09T14:30:00Z) or Unix epoch. Accuracy depends on clock source. Without reliable timestamps, log correlation is impossible. | Provenance, Logs |
| **Epoch** | Unix epoch: the number of seconds since 1970-01-01T00:00:00Z. A universal reference point. 32-bit epoch overflows in 2038 (Y2K38 problem). 64-bit systems use 64-bit time_t. | Provenance, Logs, Server |
| **NTP** | Network Time Protocol. Synchronizes system clocks across a network to within milliseconds of reference clocks. Hierarchical stratum model — stratum 0 is atomic clock, stratum 1 is directly connected server. | Provenance, Network |
| **Provenance** | The documented origin and chain of custody of data. Answers: where did this come from, who touched it, when, and what changed? Without provenance, data has no verifiable history. | Provenance, Logs, Security |
| **Chain of custody** | An unbroken documented record of who handled data and when. Critical for forensics, auditing, and legal compliance. Broken chains mean data cannot be trusted as evidence. | Provenance, Security |
| **Checksum** | A fixed-size value computed from data to detect corruption or tampering. MD5, SHA-256, SHA-512. Comparing checksums before and after transfer verifies integrity. Not encryption — verification. | Provenance, Security |
| **Hash** | A one-way function that maps arbitrary data to a fixed-size output. Cryptographic hashes (SHA-256) are collision-resistant. Used for file integrity, password storage, and digital signatures. | Provenance, Security |
| **Cache** | Stored copies of data kept closer to the consumer for faster retrieval. DNS cache, browser cache, CPU cache, proxy cache. Cache invalidation is one of the two hard problems in computer science. | Provenance, Network, Server |
| **mtime/ctime/atime** | File timestamps on Unix filesystems. mtime: last content modification. ctime: last metadata change (permissions, ownership). atime: last access. `stat` shows all three. `noatime` mount option improves performance. | Provenance, Server |

---

## Security & Trust

| Term | Definition | Modules |
|------|-----------|---------|
| **TLS** | Transport Layer Security. Cryptographic protocol that provides encrypted, authenticated communication over a network. Successor to SSL. Uses certificates, key exchange, and symmetric encryption. | Security, Network |
| **Certificate Authority (CA)** | A trusted entity that issues digital certificates binding public keys to identities. The CA verifies the identity before signing. Root CAs are pre-trusted by operating systems and browsers. | Security |
| **Public key** | The shareable half of an asymmetric key pair. Used to encrypt data that only the private key can decrypt, or to verify signatures made by the private key. Distributed via certificates. | Security |
| **Private key** | The secret half of an asymmetric key pair. Never shared, never transmitted. Used to decrypt data encrypted with the public key, or to create digital signatures. Compromise means replacing everything. | Security |
| **CSR** | Certificate Signing Request. A message sent to a CA containing the public key and identity information, signed with the private key. The CA validates the request and issues a signed certificate. | Security |
| **SSH** | Secure Shell. Encrypted protocol for remote command execution and file transfer. Uses public key authentication (preferred) or passwords. Port 22. `sshd` is the server daemon. | Security, Server, Network |
| **Authentication** | Proving identity — you are who you claim to be. Methods: passwords, public keys, tokens, certificates, multi-factor. The gate before authorization. | Security, Access |
| **Authorization** | Determining what an authenticated identity is allowed to do. Permissions, roles, policies, ACLs. Authentication asks "who are you?" — authorization asks "what can you do?" | Security, Access |
| **Intrusion detection** | Monitoring for unauthorized access or policy violations. Host-based (AIDE, OSSEC, auditd) watches file changes and syscalls. Network-based (Snort, Suricata) inspects traffic. Detect, alert, respond. | Security, Logs |
| **Hardening** | The process of reducing a system's attack surface. Disable unused services, remove unnecessary packages, restrict permissions, enable logging, configure firewalls, apply patches. Defense in layers. | Security, Server |
| **Principle of least privilege** | Every process and user should operate with the minimum permissions necessary to complete their task. Root only when required. Separate service accounts. Drop privileges after binding ports. | Security, Access, Server |
| **Trust level** | A classification of how much access and capability is granted to an entity. Higher trust requires stronger authentication and more auditing. Zero-trust architectures verify every request regardless of source. | Access, Security |

---

## Cross-Module Index

The following terms appear across three or more modules, forming the connective tissue of systems administration:

- **Process** — Server, Forensics, Logs
- **PID** — Server, Forensics, Logs
- **systemd** — Server, Logs, Forensics
- **Permission bits** — Server, Security, Access
- **Firewall** — Network, Security, Access
- **TCP/IP** — Network, Security, Logs
- **DNS** — Network, Security, Provenance
- **Timestamp** — Provenance, Logs, Server (implicit)
- **Provenance** — Provenance, Logs, Security
- **Authentication** — Security, Access, Server (implicit)
- **Audit log** — Logs, Security, Provenance
- **cgroup** — Server, Forensics, Access
- **Container** — Forensics, Server, Security
- **Hardening** — Security, Server, Logs (implicit)
- **Checksum/Hash** — Provenance, Security

---

## The Through-Line

Every term in this glossary connects to the same principle: *services exist for their purpose, not to feed each other's waste processing.* A daemon runs because it has a job. A firewall blocks because unsolicited traffic wastes everyone's resources — the carrier, the network, the server, the recycling. Logs record what actually happened so the sysadmin can separate signal from noise. Provenance proves where data came from. Security ensures only authorized work gets done.

The anti-waste principle runs through every layer: don't run services you don't need, don't accept traffic you didn't ask for, don't keep logs you won't read, don't grant access you can't audit. Every resource has a cost. Stewardship means knowing that cost and deciding it's worth paying.

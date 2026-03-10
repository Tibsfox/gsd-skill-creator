# Bibliography

> **Module ID:** SRV-BIB
> **Domain:** Reference
> **Scope:** Consolidated sources from all seven SYS research modules plus the proof of concept. Each source is assigned a reliability tier and a unique ID for cross-referencing.

---

## Source Reliability Tiers

| Tier | Label | Criteria | Examples |
|------|-------|----------|----------|
| **Gold** | Standards bodies, government agencies, peer-reviewed | Published by recognized standards organizations, government research agencies, or peer-reviewed journals. Formal review process. Versioned and maintained. | IETF RFCs, IEEE standards, NIST publications, POSIX, ISO standards, peer-reviewed journals |
| **Silver** | Official documentation, established publishers | Published by the project or organization that maintains the software/protocol. Technical accuracy maintained by the developers. Established book publishers with editorial review. | man pages, kernel.org docs, tool documentation, Addison-Wesley, O'Reilly, No Starch Press, Cambridge University Press |
| **Bronze** | Community resources, educational | Community-maintained wikis, educational sites, blog posts from recognized practitioners. Useful but not formally reviewed. | Project wikis, HOWTO guides, practitioner blogs, community network sites |

---

## Standards & RFCs (Gold)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| G1 | [RFC 793: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc793) | Network | Original TCP specification. Updated by RFC 9293 (2022). |
| G2 | [RFC 768: User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768) | Network | UDP specification. Connectionless, best-effort datagram service. |
| G3 | [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) | Network | IPv4 specification. Addressing, fragmentation, routing. |
| G4 | [RFC 8200: Internet Protocol, Version 6](https://www.rfc-editor.org/rfc/rfc8200) | Network | IPv6 specification. 128-bit addressing, simplified header. |
| G5 | [RFC 4632: CIDR](https://www.rfc-editor.org/rfc/rfc4632) | Network | Classless Inter-Domain Routing. Internet address aggregation. |
| G6 | [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) | Network | Private address ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. |
| G7 | [RFC 3022: Traditional IP NAT](https://www.rfc-editor.org/rfc/rfc3022) | Network | NAT operation: address translation, port mapping. |
| G8 | [RFC 1035: Domain Names](https://www.rfc-editor.org/rfc/rfc1035) | Network | DNS protocol: message format, record types, resolution. |
| G9 | [RFC 4033: DNSSEC](https://www.rfc-editor.org/rfc/rfc4033) | Network, Security | DNS Security: authentication of DNS data. |
| G10 | [RFC 2131: DHCP](https://www.rfc-editor.org/rfc/rfc2131) | Network | Dynamic Host Configuration Protocol: DORA process, leases. |
| G11 | [RFC 4271: BGP 4](https://www.rfc-editor.org/rfc/rfc4271) | Network | Border Gateway Protocol: path attributes, route selection. |
| G12 | [RFC 5136: Defining Network Capacity](https://www.rfc-editor.org/rfc/rfc5136) | Network | Formal definitions of bandwidth, capacity, throughput. |
| G13 | [RFC 2474: Differentiated Services](https://www.rfc-editor.org/rfc/rfc2474) | Network, Access | DiffServ DSCP markings for QoS classification. |
| G14 | [RFC 5424: The Syslog Protocol](https://datatracker.ietf.org/doc/html/rfc5424) | Logs, Provenance | Syslog message format, structured data, transport. |
| G15 | [RFC 5425: TLS Transport for Syslog](https://datatracker.ietf.org/doc/html/rfc5425) | Logs, Security | TLS-encrypted syslog transport on port 6514. |
| G16 | [RFC 3164: BSD Syslog Protocol](https://datatracker.ietf.org/doc/html/rfc3164) | Logs | Legacy syslog specification. Still widely implemented. |
| G17 | [RFC 5905: NTP Version 4](https://www.rfc-editor.org/rfc/rfc5905) | Provenance | Network Time Protocol: clock synchronization specification. |
| G18 | [RFC 8446: TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446) | Security | Transport Layer Security Protocol Version 1.3. |
| G19 | [RFC 6749: OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) | Security | The OAuth 2.0 Authorization Framework. |
| G20 | [RFC 2475: DiffServ Architecture](https://www.rfc-editor.org/rfc/rfc2475) | Access | Architecture for Differentiated Services. |
| G21 | [RFC 2697: Single Rate Three Color Marker](https://www.rfc-editor.org/rfc/rfc2697) | Access | Token bucket metering algorithm for traffic classification. |
| G22 | [RFC 2698: Two Rate Three Color Marker](https://www.rfc-editor.org/rfc/rfc2698) | Access | Dual-rate token bucket for HTB-style traffic shaping. |
| G23 | [RFC 6550: RPL](https://www.rfc-editor.org/rfc/rfc6550) | Network | IPv6 routing for low-power and lossy networks (mesh). |
| G24 | [RFC 8966: Babel Routing Protocol](https://www.rfc-editor.org/rfc/rfc8966) | Access | Distance-vector routing for heterogeneous mesh networks. |
| G25 | [IEEE 802.11-2020](https://standards.ieee.org/standard/802_11-2020.html) | Network | Wi-Fi standard: PHY and MAC specifications. |
| G26 | [IEEE 802.11s](https://standards.ieee.org/) | Access | IEEE mesh networking amendment to 802.11. |
| G27 | [ISO/IEC 7498-1: OSI Basic Reference Model](https://www.iso.org/standard/20269.html) | Network | Seven-layer OSI reference model. |
| G28 | [ISO 8601:2019](https://www.iso.org/standard/70907.html) | Provenance | International timestamp format standard. |
| G29 | [POSIX.1-2017 / IEEE Std 1003.1](https://pubs.opengroup.org/onlinepubs/9699919799/) | Server, Provenance | Portable Operating System Interface. Filesystem, timestamps, syscalls. |

---

## Government & Agency Publications (Gold)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| G30 | [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) | Security | Identify, Protect, Detect, Respond, Recover framework. |
| G31 | [NIST SP 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html) | Security | Authentication and Lifecycle Management. MFA guidance. |
| G32 | [NIST SP 800-86: Integrating Forensic Techniques](https://csrc.nist.gov/publications/detail/sp/800-86/final) | Provenance | Chain of custody requirements for digital evidence. |
| G33 | [NIST SP 800-88 Rev. 1: Media Sanitization](https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final) | Provenance | Secure data deletion guidelines across media types. |
| G34 | [NIST National Vulnerability Database](https://nvd.nist.gov/) | Server, Security | CVE tracking, vulnerability severity scoring. |
| G35 | [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) | Security | Hardening benchmarks for Linux, cloud, applications. |
| G36 | [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Security | Most critical web application security risks. |
| G37 | [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) | Security | Software composition analysis, dependency vulnerability scanning. |
| G38 | [CVE Program](https://www.cve.org/) | Security | Common Vulnerabilities and Exposures identification. |
| G39 | [GDPR (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | Provenance | Data subject rights: access, rectification, erasure, portability. |
| G40 | [CGPM Resolution 4 (2022)](https://www.bipm.org/en/cgpm-2022/resolution-4) | Provenance | Decision to eliminate leap seconds from UTC by 2035. |

---

## Books & Monographs (Silver)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| S1 | Brendan Gregg, *Systems Performance: Enterprise and the Cloud*, 2nd ed., Addison-Wesley, 2020 | Forensics, Logs | Definitive performance analysis reference. USE method, CPU/memory/disk/network analysis. |
| S2 | Brendan Gregg, *BPF Performance Tools*, Addison-Wesley, 2019 | Forensics | Advanced tracing with eBPF. bpftrace, BCC tools, dynamic tracing. |
| S3 | Michael Kerrisk, *The Linux Programming Interface*, No Starch Press, 2010 | Forensics, Server | Authoritative Linux syscall reference. Processes, memory, signals, IPC. |
| S4 | Tom Limoncelli, Christina Hogan, Strata Chalup, *The Practice of System and Network Administration*, 3rd ed., Addison-Wesley, 2016 | Logs | Industry standard for operational practices. Monitoring, logging architecture. |
| S5 | Susan Crawford, *Fiber: The Coming Tech Revolution*, Yale University Press, 2018 | Access | Broadband as utility infrastructure analysis. |
| S6 | Yochai Benkler, *The Wealth of Networks*, Yale University Press, 2006 | Access | Peer production and commons-based resource sharing framework. |
| S7 | Elinor Ostrom, *Governing the Commons*, Cambridge University Press, 1990 | Access | Nobel Prize-winning analysis of community-managed shared resources. |
| S8 | Simson L. Garfinkel, "Digital Forensics Research: The Next 10 Years," *Digital Investigation*, Vol. 7, 2010 | Provenance | Survey of forensic techniques including filesystem metadata and cache forensics. |
| S9 | Turner, J.S., "New Directions in Communications," *IEEE Communications Magazine*, Vol. 24, No. 10, 1986 | Access | Early articulation of the leaky bucket algorithm for traffic shaping. |
| S10 | Floyd, S. and Jacobson, V., "Random Early Detection Gateways," *IEEE/ACM Transactions on Networking*, Vol. 1, No. 4, 1993 | Access | Foundation of active queue management in traffic engineering. |
| S11 | Hasan, Samiul et al., "Community Networks: A Survey," *ACM Computing Surveys*, 2023 | Access | Comprehensive survey of community-owned network infrastructure. |
| S12 | De Filippi, P. and Treguer, F., "Wireless Community Networks," in *Net Neutrality Compendium*, Springer, 2016 | Access | Policy framework for community networks as commons. |
| S13 | IEA, "Data Centres and Data Transmission Networks," Energy Technology Perspectives, 2024 | Access, Provenance | Global data center energy consumption analysis. |

---

## Official Documentation (Silver)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| S14 | [Linux kernel documentation](https://www.kernel.org/doc/html/latest/) | Server | Process management, virtual filesystem, memory, syscalls. |
| S15 | [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html) | Server | Linux Foundation directory structure specification. |
| S16 | [proc(5) man page](https://man7.org/linux/man-pages/man5/proc.5.html) | Server, Forensics | /proc virtual filesystem documentation. |
| S17 | [systemd documentation](https://www.freedesktop.org/software/systemd/man/) | Server, Logs | systemctl, journalctl, unit files, service management. |
| S18 | [signal(7) man page](https://man7.org/linux/man-pages/man7/signal.7.html) | Server | POSIX signal types, default actions, handlers. |
| S19 | [passwd(5) man page](https://man7.org/linux/man-pages/man5/passwd.5.html) | Server | /etc/passwd, /etc/shadow, /etc/group format. |
| S20 | [chmod(1) man page](https://man7.org/linux/man-pages/man1/chmod.1.html) | Server | File permission modification. |
| S21 | [sudo(8) man page](https://www.sudo.ws/docs/man/sudo.man/) | Server, Security | Privilege escalation, sudoers configuration. |
| S22 | [filesystems(5) man page](https://man7.org/linux/man-pages/man5/filesystems.5.html) | Server | Linux filesystem types: ext4, XFS, Btrfs. |
| S23 | [LVM2 Documentation](https://sourceware.org/lvm2/) | Server | Logical Volume Manager: PV/VG/LV, resize, snapshots. |
| S24 | [smartmontools](https://www.smartmontools.org/) | Server, Forensics | SMART disk health monitoring. |
| S25 | [Debian APT Documentation](https://wiki.debian.org/Apt) | Server | APT package manager reference. |
| S26 | [DNF Documentation](https://dnf.readthedocs.io/) | Server | DNF package manager reference. |
| S27 | [ip-route(8) man page](https://man7.org/linux/man-pages/man8/ip-route.8.html) | Network | Linux routing table management. |
| S28 | [iptables(8) man page](https://linux.die.net/man/8/iptables) | Network, Security | iptables chain operations, match extensions, targets. |
| S29 | [rsyslog documentation](https://www.rsyslog.com/doc/) | Logs | Configuration, modules, rulebase engine, performance. |
| S30 | [syslog-ng documentation](https://www.syslog-ng.com/technical-documents/doc/syslog-ng-open-source-edition/) | Logs | Alternative syslog daemon with advanced filtering. |
| S31 | [journalctl(1) man page](https://www.freedesktop.org/software/systemd/man/journalctl.html) | Logs | Journal query tool: filtering, output formats. |
| S32 | [logrotate(8) man page](https://man7.org/linux/man-pages/man8/logrotate.8.html) | Logs | Log rotation configuration. |
| S33 | [cgroups v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html) | Forensics, Server | Control group hierarchy, resource controllers. |
| S34 | [namespaces(7) man page](https://man7.org/linux/man-pages/man7/namespaces.7.html) | Forensics, Server | PID, network, mount, user namespaces. |
| S35 | [Pressure Stall Information (PSI)](https://docs.kernel.org/accounting/psi.html) | Forensics | Memory, CPU, I/O pressure metrics. |
| S36 | [/proc filesystem documentation](https://docs.kernel.org/filesystems/proc.html) | Forensics | Per-process status, memory maps, descriptors. |
| S37 | [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) | Provenance | Content-addressable storage, commit objects, hash chains. |
| S38 | [Linux Audit Documentation](https://github.com/linux-audit/audit-documentation) | Provenance, Security | Kernel audit framework: auditd, ausearch, aureport. |
| S39 | [chrony Documentation](https://chrony-project.org/documentation.html) | Provenance | NTP implementation configuration and operation. |
| S40 | [OpenSSH Documentation](https://www.openssh.com/manual.html) | Security | SSH client and server configuration. |
| S41 | [Let's Encrypt Documentation](https://letsencrypt.org/docs/) | Security | Free, automated Certificate Authority. |
| S42 | [Linux-PAM Documentation](http://www.linux-pam.org/Linux-PAM-html/) | Security | Pluggable Authentication Modules. |
| S43 | [OpenLDAP Documentation](https://www.openldap.org/doc/) | Security | LDAP for centralized authentication. |

---

## Open Source Projects (Silver)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| S44 | [nftables wiki](https://wiki.nftables.org/) | Network, Security, Access | Modern Linux packet filtering framework. |
| S45 | [Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/) | Logs | Storage, indexing, query DSL for ELK stack. |
| S46 | [Logstash Reference](https://www.elastic.co/guide/en/logstash/current/) | Logs | Pipeline config, input/filter/output plugins. |
| S47 | [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/) | Logs | Dashboard creation, Discover, visualizations. |
| S48 | [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/) | Logs | Log aggregation, LogQL query language, Promtail. |
| S49 | [Grafana Documentation](https://grafana.com/docs/grafana/latest/) | Logs, Forensics | Dashboards, data sources, alerting, log panels. |
| S50 | [Prometheus Documentation](https://prometheus.io/docs/) | Forensics | Time-series database, PromQL, alerting rules. |
| S51 | [node_exporter](https://github.com/prometheus/node_exporter) | Forensics | Prometheus exporter for hardware/OS metrics. |
| S52 | [procps-ng](https://gitlab.com/procps-ng/procps) | Forensics | top, vmstat, free, ps, pgrep, pidof utilities. |
| S53 | [htop](https://htop.dev/) | Forensics | Interactive process viewer. |
| S54 | [sysstat](https://sysstat.github.io/) | Forensics | iostat, sar, mpstat, pidstat monitoring tools. |
| S55 | [strace](https://strace.io/) | Forensics | System call tracer. |
| S56 | [lsof](https://github.com/lsof-org/lsof) | Forensics | List open files utility. |
| S57 | [iotop(8)](https://man7.org/linux/man-pages/man8/iotop.8.html) | Forensics | Per-process disk I/O monitor. |
| S58 | [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html) | Forensics | Socket statistics (netstat replacement). |
| S59 | [Borg Backup](https://borgbackup.readthedocs.io/) | Provenance | Deduplicating, encrypting backup tool. |
| S60 | [Restic](https://restic.readthedocs.io/) | Provenance | Cross-platform backup with cloud storage support. |
| S61 | [SLSA Framework](https://slsa.dev/) | Provenance | Supply-chain integrity levels for software artifacts. |
| S62 | [Sigstore](https://www.sigstore.dev/) | Provenance | Keyless code signing and verification. |
| S63 | [CycloneDX](https://cyclonedx.org/) | Provenance | Software Bill of Materials (SBOM) standard. |
| S64 | [in-toto](https://in-toto.io/) | Provenance | Supply chain integrity through cryptographic attestations. |
| S65 | [AIDE](https://aide.github.io/) | Security | File integrity monitoring. |
| S66 | [OSSEC](https://www.ossec.net/docs/) | Security | Host-based IDS: integrity, log analysis, rootkit detection. |
| S67 | [Suricata](https://docs.suricata.io/) | Security | Network IDS/IPS: traffic analysis, threat detection. |
| S68 | [fail2ban](https://www.fail2ban.org/) | Security, Logs | Log-based intrusion prevention. |
| S69 | [nginx log module](https://nginx.org/en/docs/http/ngx_http_log_module.html) | Logs | Access log configuration, custom formats. |
| S70 | [Apache HTTP Server: Log Files](https://httpd.apache.org/docs/current/logs.html) | Logs | Common/combined log formats, conditional logging. |
| S71 | [nginx rate limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html) | Access | Request rate limiting with leaky bucket. |

---

## Community & Educational Resources (Bronze)

| ID | Source | Modules | Description |
|----|--------|---------|-------------|
| B1 | [Linux Advanced Routing & Traffic Control HOWTO](https://lartc.org/) | Access | Comprehensive tc, HTB, qdisc guide. |
| B2 | [HTB Manual](https://linux.die.net/man/8/tc-htb) | Access | Hierarchical Token Bucket configuration. |
| B3 | [Brendan Gregg, USE Method](https://www.brendangregg.com/usemethod.html) | Forensics | Utilization, Saturation, Errors methodology. |
| B4 | [Brendan Gregg, Linux Performance](https://www.brendangregg.com/linuxperf.html) | Forensics | Comprehensive Linux performance tools overview. |
| B5 | [Freifunk](https://freifunk.net/) | Access | German community mesh networking. Operational since 2003. |
| B6 | [NYC Mesh](https://www.nycmesh.net/) | Access | Community-owned mesh network in New York City. |
| B7 | [Guifi.net](https://guifi.net/) | Access | 35,000+ node community network in Catalonia, Spain. |
| B8 | [Meshtastic](https://meshtastic.org/) | Access | Open-source LoRa mesh for off-grid communication. |
| B9 | [batman-adv](https://www.open-mesh.org/projects/batman-adv/wiki) | Access | Layer 2 mesh protocol (Linux kernel module). |
| B10 | [Yggdrasil Network](https://yggdrasil-network.github.io/) | Access | Encrypted self-arranging mesh overlay. |
| B11 | [cjdns](https://github.com/cjdelisle/cjdns) | Access | Encrypted IPv6 mesh protocol. |
| B12 | [NVIDIA RTX 4060 Ti Specs](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/) | Access | GPU specifications and power consumption data. |

---

## Source Distribution

| Category | Count | Tier |
|----------|-------|------|
| Standards & RFCs | 29 | Gold |
| Government & Agency | 11 | Gold |
| Books & Monographs | 13 | Silver |
| Official Documentation | 30 | Silver |
| Open Source Projects | 28 | Silver |
| Community & Educational | 12 | Bronze |
| **Total unique sources** | **123** | |

### Module Coverage

| Module | Sources | Primary Categories |
|--------|---------|-------------------|
| Server Foundations (01) | 15 | Documentation, POSIX, kernel |
| The Network (02) | 19 | RFCs (dominant), IEEE |
| The Logs (03) | 19 | RFCs, documentation, aggregation tools |
| Process Forensics (04) | 20 | Books, tool documentation, kernel docs |
| Data Provenance (05) | 18 | NIST, standards, supply chain frameworks |
| Access & Bandwidth (06) | 25 | RFCs, community networks, books |
| Security Operations (07) | 17 | NIST, OWASP, CIS, tool documentation |

---

*Every source in this bibliography is attributable. Gold sources are standards and specifications maintained by recognized bodies. Silver sources are official documentation maintained by the projects they describe. Bronze sources are community resources from established practitioners. No anonymous sources, no unattributed claims, no broken links at time of compilation.*

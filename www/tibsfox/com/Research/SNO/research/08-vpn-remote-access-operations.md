# The Tunnel That Became the Target -- VPN & Remote Access Operations

## Every Connection Is a Promise

A VPN tunnel is a promise: that the traffic flowing through it is confidential, that the endpoints on either side are who they claim to be, that the path between them cannot be observed, intercepted, or tampered with. For decades, this promise was the foundation of remote connectivity. Branch offices connected to headquarters through IPsec tunnels. Remote workers dialed into SSL VPN portals. The tunnel was the perimeter, extended across hostile networks to wherever the organization needed to reach.

Then the tunnels themselves became targets. Ivanti Connect Secure, the successor to Pulse Secure, suffered a cascade of zero-day vulnerabilities in 2024 and 2025 that gave unauthenticated attackers remote code execution on VPN gateways -- the very devices organizations trusted to protect their networks. Fortinet's SSL VPN service, running on tens of thousands of FortiGate appliances worldwide, was exploited through a series of critical flaws, and attackers developed a symlink persistence technique that maintained access even after patches were applied. Cisco AnyConnect, the most widely deployed enterprise VPN client in the world, accumulated privilege escalation and denial-of-service vulnerabilities that eroded confidence in the client-side security model.

The promise did not break because the cryptography failed. AES-256 remains unbroken. IKEv2 handshakes still resist man-in-the-middle attacks. The promise broke because the software implementing it -- the VPN appliances, the client agents, the management planes -- carried the same vulnerability surface as any other complex network service, but with the additional consequence that compromising a VPN gateway compromises the trust boundary itself.

This module covers the operational reality of VPN and remote access in 2026: how to run IPsec and WireGuard tunnels reliably, how to scale remote access for thousands of concurrent users, how to make split-tunnel decisions that balance security and performance, how to migrate toward Zero Trust Network Access without abandoning the VPN infrastructure that still carries production traffic, and how to monitor, troubleshoot, and defend the tunnels that remain.

## Site-to-Site VPN -- IPsec IKEv2 in Production

### The Two Phases

IPsec site-to-site VPN operation is built on two negotiation phases that establish nested layers of security. Understanding these phases operationally -- not just theoretically -- is what separates a tunnel that stays up from one that drops at 2 AM and pages the on-call engineer.

**Phase 1 (IKE SA)** establishes a secure, authenticated channel between the two VPN peers. In IKEv2, this happens through the IKE_SA_INIT exchange (four messages that negotiate cryptographic parameters and perform a Diffie-Hellman key exchange) followed by the IKE_AUTH exchange (which authenticates both peers using pre-shared keys, certificates, or EAP). The result is an IKE Security Association -- an encrypted management channel that protects all subsequent negotiations. The IKE SA has a configurable lifetime, typically 24 hours (86,400 seconds), after which it renegotiates. Operational failures in Phase 1 are almost always mismatched parameters: the two sides proposing different encryption algorithms, different DH groups, different authentication methods, or mismatched identities.

**Phase 2 (IPsec SA / Child SA)** negotiates the actual tunnel that carries user traffic. The Child SA specifies the encryption and integrity algorithms for the data plane (ESP -- Encapsulating Security Payload), the traffic selectors that define which source and destination subnets the tunnel protects, and whether Perfect Forward Secrecy is enabled. The IPsec SA lifetime is shorter than the IKE SA -- typically 3,600 seconds (one hour) or measured in kilobytes of data transferred. When the IPsec SA expires, a new one is negotiated under the protection of the existing IKE SA, so rekeying is seamless if the IKE SA is healthy.

**Perfect Forward Secrecy (PFS)** performs a fresh Diffie-Hellman exchange during each Phase 2 negotiation, ensuring that compromise of one session's keys does not compromise past or future sessions. PFS adds computational overhead to each rekey event but is considered mandatory in any security-conscious deployment. Without PFS, an attacker who compromises the Phase 1 key material can decrypt all Phase 2 traffic retroactively.

### Cipher Suite Selection

Cipher suite selection is where policy meets operational reality. The suites must be strong enough to meet compliance requirements and resist current threats, but they must also be supported by both endpoints and performant enough for the traffic volume the tunnel carries.

| Component | Recommended (2026) | Acceptable | Deprecated |
|-----------|-------------------|------------|------------|
| Encryption | AES-256-GCM | AES-128-GCM | 3DES, DES, AES-CBC without GCM |
| Integrity | SHA-384, SHA-512 | SHA-256 | SHA-1, MD5 |
| DH Group | Group 20 (384-bit ECP), Group 21 (521-bit ECP) | Group 19 (256-bit ECP), Group 14 (2048-bit MODP) | Groups 1, 2, 5 (768/1024/1536-bit MODP) |
| PRF | PRF_HMAC_SHA2_384 | PRF_HMAC_SHA2_512 | PRF_HMAC_SHA1 |
| Authentication | ECDSA-384 certificates | RSA-3072+ certificates | PSK (acceptable for lab/low-risk), RSA-2048 |

The NSA's CNSA 2.0 suite, currently in IETF draft status, introduces post-quantum requirements for IPsec: the primary key exchange uses P-384 ECDH, with a mandatory additional key exchange using ML-KEM-1024 (the post-quantum KEM formerly known as CRYSTALS-Kyber) performed during IKE_INTERMEDIATE. Organizations processing national security information should track the CNSA 2.0 IPsec profile draft and begin evaluating IKEv2 implementations that support the additional key exchange mechanism. For commercial enterprises, the current recommendation is to deploy P-384 ECDH (Group 20) with AES-256-GCM, which provides the strongest classical security and positions the deployment for a smoother transition when post-quantum requirements become mandatory.

### Dead Peer Detection

Dead Peer Detection, described in RFC 3706, is the mechanism by which IPsec peers determine whether the other side of the tunnel is still alive. DPD works by sending R-U-THERE messages during idle periods -- if a peer has not received any IPsec traffic for a configurable interval (the "worry metric"), it sends an R-U-THERE and expects an R-U-THERE-ACK in response. If no acknowledgment arrives after a configurable number of retries, the peer declares the tunnel dead and tears down the Security Associations.

The operational subtlety of DPD is that its parameters are not negotiated between peers -- each side configures its own interval and retry count independently. A common misconfiguration is setting the DPD interval too aggressively (say, 10 seconds with 3 retries), which causes tunnels to flap on lossy WAN links where occasional packet drops are normal. The pragmatic configuration for most production deployments is a 30-second interval with 5 retries, giving 150 seconds of tolerance before declaring a peer dead. For tunnels over unreliable links (satellite, cellular backup), increase to 60 seconds with 5 retries.

On Palo Alto firewalls, tunnel monitoring augments DPD with ICMP probes to a specific destination IP behind the remote peer, providing application-layer liveness verification beyond the IKE-level DPD mechanism. On Cisco IOS/IOS-XE, DPD is configured with `crypto isakmp keepalive` and integrates with routing failover when multiple tunnels provide redundancy.

### Tunnel Monitoring Operations

Production IPsec tunnels require continuous monitoring beyond DPD. The operational monitoring checklist includes:

- **IKE SA state**: Is Phase 1 established? When does it expire? Has rekey succeeded?
- **IPsec SA state**: Are Child SAs active for all expected traffic selectors? What are the byte/packet counters? Are they incrementing (indicating traffic flow)?
- **Encapsulation counters**: ESP encrypt/decrypt counts, authentication failures (indicates tampering or misconfiguration), replay window drops (indicates packet reordering beyond the anti-replay window)
- **Rekey events**: Timestamp of last successful rekey, failures (often the first symptom of a developing problem)
- **MTU/fragmentation**: PMTUD failures, fragmentation reassembly errors (discussed in the troubleshooting section)

On FortiGate: `diagnose vpn ike gateway list` and `diagnose vpn tunnel list` provide the essential operational view. On Palo Alto: `show vpn ipsec-sa` and `show vpn ike-sa` with `show vpn flow`. On Cisco: `show crypto ikev2 sa detailed` and `show crypto ipsec sa`.

## WireGuard Operations

### Architecture and Simplicity

WireGuard operates on a fundamentally different philosophy from IPsec. Where IPsec is a framework of negotiable algorithms, configurable parameters, and complex state machines, WireGuard is an opinionated protocol with a fixed cryptographic suite: Curve25519 for key exchange, ChaCha20-Poly1305 for symmetric encryption, BLAKE2s for hashing, and SipHash for hashtable keys. There is nothing to negotiate, nothing to misconfigure, and no cipher suite mismatch to debug at 3 AM.

The operational model is peer-based. Each WireGuard interface has a private key and a list of peers, where each peer is identified by its public key and associated with a set of AllowedIPs -- the IP addresses and subnets that should be routed to that peer. This is the single most important concept in WireGuard operations: AllowedIPs serves simultaneously as a routing table and an access control mechanism. When a packet arrives from a peer, WireGuard checks that the source IP falls within that peer's AllowedIPs; if not, the packet is silently dropped. When the host wants to send a packet, WireGuard looks up the destination in the AllowedIPs of all configured peers to determine which peer should receive it.

This dual role of AllowedIPs is the source of most WireGuard misconfigurations. A common mistake in site-to-site setups is setting AllowedIPs to only the peer's tunnel IP (e.g., `10.0.0.2/32`) without including the remote site's LAN subnet (e.g., `192.168.100.0/24`). The tunnel comes up, pings between tunnel endpoints work, but traffic to the remote LAN never enters the tunnel because WireGuard has no AllowedIPs entry telling it where to route those packets. The fix is straightforward: AllowedIPs must include every subnet that should be reachable through that peer.

### Peer Management and Key Rotation

WireGuard peer management is stateless at the configuration level -- peers are defined in the configuration file or added dynamically via the `wg set` command. The `wg-quick` utility wraps the raw `wg` commands with convenience features: it brings up the interface, assigns addresses, configures routing (based on AllowedIPs), sets DNS, and executes pre/post scripts.

Key rotation in WireGuard requires deliberate operational procedure because the protocol itself has no built-in key rotation mechanism. Unlike IPsec, which renegotiates keys automatically based on SA lifetimes, WireGuard key pairs are static until manually replaced. The recommended rotation procedure:

1. Generate a new key pair on the peer: `wg genkey | tee private.key | wg pubkey > public.key`
2. Update the peer's local configuration with the new private key
3. Update the remote peer's configuration with the new public key
4. Bring the interface down and up (or use `wg set` for live updates)
5. Verify connectivity: `wg show` displays the latest handshake timestamp and transfer counters
6. Remove the old peer entry from the remote side

The critical operational detail is that existing sessions continue using the old keys until the next handshake attempt (WireGuard initiates a new handshake approximately every 2 minutes if traffic is flowing, or after 5 minutes of silence). Maximum disruption during rotation is typically 3-5 minutes. For zero-downtime rotation, add the new peer configuration before removing the old one, creating a brief window where both key pairs are valid.

A practical rotation schedule for most environments is 90 days for key pairs and monthly for any pre-shared keys used as an additional layer. Store keys in a secrets manager, not in plaintext configuration files on disk.

### Monitoring

WireGuard monitoring is minimalist by design. The `wg show` command provides the essential operational view: each peer's public key, endpoint address and port, allowed IPs, latest handshake timestamp, and transfer counters (bytes received and sent). A peer whose latest handshake is more than 5 minutes old and whose transfer counters are not incrementing is effectively disconnected.

For production monitoring, export `wg show` output to your monitoring system at regular intervals. The key metrics are: latest handshake age (alert if > 5 minutes for always-on peers), transfer rate (detect throughput anomalies), and peer count (detect unauthorized peer additions or missing peers after configuration changes). Prometheus exporters exist for WireGuard that scrape these metrics into standard time-series monitoring.

## Remote Access VPN at Scale

### SSL VPN Platforms

Remote access VPN for enterprise workforces is dominated by three platforms, each backed by a major firewall vendor and each carrying the operational characteristics -- and vulnerabilities -- of its parent ecosystem.

**Palo Alto GlobalProtect** operates as a tightly integrated extension of the Palo Alto NGFW platform. The GlobalProtect agent on the endpoint establishes an SSL or IPsec tunnel to a GlobalProtect gateway (which is a feature of the PAN-OS firewall, not a separate appliance). The portal component handles client configuration distribution, and HIP (Host Information Profile) checks enforce device posture requirements before granting access. GlobalProtect's always-on mode establishes the tunnel before user login (pre-logon / machine tunnel using certificate authentication), ensuring that domain-joined devices can reach Active Directory and receive Group Policy updates even before the user authenticates. The maximum concurrent user capacity depends on the firewall model: the PA-5450 supports up to 60,000 concurrent GlobalProtect users, while the PA-3400 series handles 5,000-10,000 depending on model.

**Cisco AnyConnect** (now Cisco Secure Client) is the most widely deployed enterprise VPN client in the world, running on the ASA (Adaptive Security Appliance) and Firepower Threat Defense platforms. AnyConnect supports SSL (TLS) and IKEv2/IPsec transport, with DTLS (Datagram TLS) for latency-sensitive traffic like voice and video that performs poorly over TCP-based SSL tunnels. The client supports per-app VPN, posture assessment via the ISE (Identity Services Engine) integration, and network visibility module for endpoint telemetry. Scaling is hardware-dependent: the ASA 5585-X supports up to 10,000 concurrent sessions, while the Firepower 4100/9300 series scales to 10,000-20,000. Cisco's transition from AnyConnect to Secure Client brought a renamed binary but the same core architecture, creating a confusing period where documentation references both names interchangeably.

**Fortinet FortiClient** connects to FortiGate firewalls over SSL VPN or IPsec and integrates with FortiClient EMS (Endpoint Management Server) for centralized deployment and compliance enforcement. FortiClient's strength is its integration with the broader Fortinet Security Fabric -- telemetry from the VPN client feeds into FortiAnalyzer for logging, FortiSIEM for correlation, and FortiEDR for endpoint detection. FortiGate scaling is aggressive for the price point: the FortiGate 600F supports 16,000 concurrent SSL VPN users, and the 3700F series reaches 30,000. However, the SSL VPN attack surface on FortiGate has been the target of repeated critical vulnerabilities, which any operations team must weigh against the capacity and integration benefits.

| Platform | Transport | Max Users (high-end) | Posture Check | Always-On | Vulnerability History |
|----------|-----------|---------------------|---------------|-----------|----------------------|
| GlobalProtect | SSL, IPsec | ~60,000 (PA-5450) | HIP profiles | Pre-logon + user tunnel | Moderate; fewer critical CVEs |
| Cisco Secure Client | SSL, DTLS, IKEv2 | ~20,000 (FP 9300) | ISE integration | Machine + user tunnel | Moderate; privilege escalation |
| FortiClient | SSL, IPsec | ~30,000 (FG 3700F) | EMS compliance | Certificate-based | Severe; repeated RCE in sslvpnd |

### Concurrent User Capacity Planning

Capacity planning for remote access VPN is not a simple matter of checking the vendor's maximum session count. The actual bottleneck is usually one of three resources, rarely advertised as prominently as the session count:

**Crypto throughput**: Every VPN session requires encryption and decryption of all traffic. A firewall that handles 10 Gbps of plaintext inspection may deliver only 3-5 Gbps of IPsec throughput, depending on cipher suite and hardware offload capabilities. SSL VPN throughput is typically lower than IPsec because TLS operates in the software stack rather than being offloaded to crypto ASICs.

**Memory**: Each concurrent VPN session consumes memory for session state, routing entries, and buffered packets. On Cisco ASA, each AnyConnect session uses approximately 1-2 MB of RAM. On FortiGate, SSL VPN sessions consume memory proportional to the configured tunnel MTU and buffer sizes. Running out of memory causes session drops, not graceful denial.

**CPU for authentication**: The authentication burst at 9 AM Monday morning -- when thousands of users establish VPN connections simultaneously -- can saturate the CPU even if steady-state throughput is well within capacity. Certificate-based authentication is more CPU-intensive than PSK (due to RSA/ECDSA operations), and SAML-based authentication adds round-trip latency to external IdPs. Pre-provision session tokens or use authentication offload to dedicated RADIUS/LDAP proxies to smooth the morning surge.

## Split Tunnel vs Full Tunnel

### The Decision Framework

Split tunneling routes only corporate-destined traffic through the VPN tunnel while allowing internet-bound traffic to flow directly from the user's local internet connection. Full tunneling routes all traffic through the VPN tunnel, regardless of destination. The decision between them is one of the most consequential choices in remote access architecture, and it is not purely technical -- it carries compliance, security, performance, and user experience implications that must be weighed together.

**Full tunnel advantages**: All traffic is visible to the corporate security stack (proxy, DLP, IDS/IPS, DNS filtering). Logging captures every user connection for audit and forensics. There is no possibility of the endpoint simultaneously communicating with the internet and the corporate network, eliminating a class of pivot attacks where a compromised endpoint bridges the two environments.

**Full tunnel costs**: Every byte of Netflix, YouTube, Teams video, and Windows Update traffic flows through the corporate WAN, consuming VPN concentrator capacity, internet egress bandwidth, and adding latency to every connection. During the COVID-19 remote work expansion, organizations running full-tunnel VPNs saw concentrator saturation within days as tens of thousands of users funneled all traffic through infrastructure designed for a fraction of the workforce.

**Split tunnel advantages**: Only corporate traffic traverses the tunnel, reducing VPN concentrator load by 60-80% in typical deployments. SaaS applications (Microsoft 365, Google Workspace, Salesforce, Zoom) reach the nearest cloud edge directly rather than hairpinning through corporate infrastructure, dramatically improving performance and reducing latency. Microsoft explicitly recommends split tunneling for Microsoft 365 traffic and publishes the IP ranges and URLs that should be excluded from the tunnel.

**Split tunnel risks**: Internet-bound traffic from the endpoint is not inspected by the corporate security stack. A compromised endpoint can exfiltrate data directly to the internet without passing through the DLP. DNS queries to non-corporate destinations are not logged. The endpoint operates in a dual-homed state that increases its attack surface.

### Compliance Implications

**PCI-DSS**: Organizations processing payment card data face the strongest compliance pressure toward full tunneling. PCI-DSS requires that all remote access to the Cardholder Data Environment (CDE) be logged, monitored, and controlled. While PCI-DSS does not explicitly mandate full tunneling by name, the logging and monitoring requirements in Requirement 10 effectively require that all VPN user activity be visible to the corporate security infrastructure. Split tunneling is possible under PCI-DSS only if the split is configured so that all CDE-destined traffic routes through the tunnel and is logged, and the compliance team accepts the risk that non-CDE traffic is not monitored. Most QSAs (Qualified Security Assessors) will push for full tunneling in PCI scope to avoid scope creep arguments.

**HIPAA**: Similar to PCI-DSS, HIPAA's security rule requires access controls and audit logging for all access to electronic protected health information (ePHI). Full tunneling simplifies compliance but is not explicitly required.

**SOC 2**: Split tunneling is generally acceptable for SOC 2 if the organization can demonstrate that corporate resources are adequately protected and monitored regardless of the tunnel mode.

### The Modern Compromise: Selective Split Tunneling

The pragmatic approach in 2026 is selective split tunneling -- sometimes called "include" or "exclude" mode split tunneling. Rather than choosing binary full or split, organizations define specific categories of traffic that bypass the tunnel:

- Microsoft 365 Optimize endpoints (per Microsoft's published list)
- Zoom/Teams/WebEx media traffic (UDP ranges)
- SaaS applications accessed through a CASB or SSE that provides independent logging
- Operating system update traffic (Windows Update, macOS Software Update)

Everything else routes through the tunnel. This preserves security visibility for corporate and unknown destinations while eliminating the bandwidth and latency penalty for high-volume, well-understood SaaS traffic. Palo Alto GlobalProtect, Cisco Secure Client, and FortiClient all support this selective model through configurable exclude routes.

## ZTNA Migration from Traditional VPN

### Why Organizations Are Migrating

The migration from traditional VPN to Zero Trust Network Access is not driven by a single event but by a convergence of pressures. VPN concentrators are single points of failure that must be exposed to the internet -- they have public IP addresses, they accept connections from any source, and they run complex codebases that have proven repeatedly vulnerable. VPN grants network-level access: once connected, the user can reach any resource permitted by their network segment, regardless of whether they need it. VPN performance degrades as user count scales, particularly for distributed workforces connecting to cloud-hosted applications through a centralized VPN gateway.

ZTNA replaces this model with per-application access. Instead of connecting to a network and then accessing applications, the user authenticates to a ZTNA broker, which evaluates identity, device posture, and context, and then brokers a connection to the specific application -- without granting the user any network-level access to the environment where the application runs. The application itself can be invisible to the internet, reachable only through the ZTNA broker.

### Major ZTNA Platforms

**Zscaler Private Access (ZPA)** routes user traffic through the Zscaler Zero Trust Exchange -- a global cloud platform with over 150 data centers. Application connectors deployed inside the customer's network establish outbound-only connections to the Zscaler cloud, meaning no inbound firewall rules, no public IP addresses, and no exposed attack surface for the applications. ZPA evaluates user identity (integrated with any SAML/OIDC IdP), device posture (via the Zscaler Client Connector agent), and application-specific policy before brokering the connection. Pricing runs approximately $8-15/user/month, scaling with module count. ZPA's strength is its maturity and integration with Zscaler Internet Access (ZIA) for a complete SSE stack.

**Cloudflare Access** uses Cloudflare's global network (310+ cities, 300+ data centers) to provide ZTNA for web applications, SSH, RDP, and arbitrary TCP/UDP protocols. The cloudflared tunnel agent, deployed alongside applications, creates outbound-only connections to Cloudflare's edge, and Access policies enforce identity and device posture checks before permitting connections. Cloudflare's architectural advantage is that the same network handles CDN, DDoS mitigation, DNS, and ZTNA, eliminating the need for separate infrastructure for each function. Pricing is approximately $7-12/user/month and competitive with Zscaler at enterprise scale.

**Palo Alto Prisma Access** extends the Palo Alto NGFW security stack into a cloud-delivered model. Prisma Access provides both ZTNA (replacing VPN for application access) and cloud-delivered SD-WAN (replacing MPLS for branch connectivity). The differentiator is that Prisma Access applies the same PAN-OS security policy -- App-ID, Threat Prevention, WildFire sandboxing -- to ZTNA traffic that a physical firewall applies to on-premises traffic, providing continuity for organizations deeply invested in the Palo Alto ecosystem. Prisma Access is the only vendor recognized as a Leader across all three relevant Gartner Magic Quadrants: SD-WAN, Single-Vendor SASE, and Security Service Edge.

**Tailscale and Headscale** occupy a different segment: mesh VPN with zero-trust principles, built on WireGuard. Tailscale creates a peer-to-peer encrypted mesh network using WireGuard tunnels, coordinated by a central control plane that handles key distribution, ACL policy, and NAT traversal. Headscale is the open-source, self-hosted implementation of the Tailscale control plane, providing the same mesh architecture without depending on Tailscale's SaaS service. The migration path from traditional VPN to Tailscale is operationally simpler than enterprise ZTNA platforms: install the Tailscale client, define ACLs in a version-controlled policy file, and users can reach tagged resources based on identity and group membership. The limitation is that Tailscale/Headscale provide network-level mesh connectivity rather than per-application brokered access -- it is a better VPN, not a replacement for VPN-as-a-concept.

| Platform | Architecture | Per-App Access | Network Footprint | Best For |
|----------|-------------|----------------|-------------------|----------|
| Zscaler ZPA | Cloud broker, outbound connectors | Yes | 150+ DCs | Large enterprise, regulated industries |
| Cloudflare Access | Edge-native, cloudflared tunnels | Yes | 310+ cities | Developer-friendly, web-app heavy |
| Prisma Access | Cloud-delivered NGFW | Yes | Palo Alto PoPs | Palo Alto ecosystem, SD-WAN convergence |
| Tailscale/Headscale | WireGuard mesh, peer-to-peer | No (network-level) | Self-hosted or SaaS | DevOps, small-to-mid orgs, overlay nets |

### Coexistence During Transition

No organization migrates from VPN to ZTNA in a single cutover. The transition period -- which typically spans 6-18 months -- requires both systems to coexist. The operational playbook for coexistence:

1. **Inventory applications by access method**: Categorize every application as VPN-only, ZTNA-ready, or already internet-facing. Web applications are the easiest to migrate; legacy client-server applications with custom protocols are the hardest.
2. **Deploy ZTNA connectors alongside VPN infrastructure**: ZTNA connectors (Zscaler App Connectors, cloudflared, Prisma Access agents) run inside the same network segments as the applications they protect. They do not interfere with existing VPN tunnels.
3. **Migrate by application, not by user**: Move one application at a time to ZTNA, test thoroughly, then move the next. Users will connect through both VPN (for unmigrated applications) and ZTNA (for migrated ones) simultaneously.
4. **Maintain VPN as fallback**: Keep VPN infrastructure operational until every application has been migrated and verified through ZTNA. Reduce VPN capacity as usage drops, but do not decommission until ZTNA covers 100% of access.
5. **Monitor both paths**: Log VPN connection attempts after an application has been migrated to ZTNA -- any remaining VPN traffic to that application indicates missed users, automation, or service accounts that were not part of the migration plan.

## VPN Monitoring and Troubleshooting

### MTU, MSS, and Fragmentation

The most common and most misunderstood VPN operational problem is MTU-related fragmentation. The standard Ethernet MTU is 1500 bytes. IPsec ESP adds overhead: 20 bytes for the outer IP header, 8 bytes for the UDP header (if NAT-T is enabled), 8 bytes for the ESP header, 2-16 bytes for ESP padding, 12-32 bytes for the ESP authentication trailer. The effective MTU inside the tunnel drops to approximately 1400-1420 bytes depending on the cipher and NAT traversal configuration.

When an application sends a 1500-byte packet into the tunnel, the VPN device must either fragment the packet (adding the overhead of fragmentation and reassembly, which can cause 20-30% throughput reduction) or drop it and rely on Path MTU Discovery (PMTUD) to signal the sender to reduce its packet size. PMTUD works by setting the Don't Fragment (DF) bit on packets -- when a router along the path cannot forward the packet without fragmentation, it sends an ICMP "Fragmentation Needed" message back to the sender.

The problem is that many firewalls, misconfigured ACLs, and security appliances along the path block ICMP, breaking PMTUD. The sender never learns that its packets are too large, keeps sending 1500-byte packets, and the tunnel silently drops them. The symptom is maddening: small packets (pings, DNS queries) work fine, but large transfers (file copies, web page loads with large payloads) hang or fail.

The operational fix is to clamp the TCP MSS (Maximum Segment Size) on the VPN device. MSS clamping rewrites the MSS value in TCP SYN packets as they enter the tunnel, telling the remote endpoint to use smaller segments that fit within the tunnel MTU without fragmentation. On Cisco: `ip tcp adjust-mss 1360`. On FortiGate: `set tcp-mss-sender 1360` and `set tcp-mss-receiver 1360` in the VPN phase2 configuration. On Palo Alto: set the MSS adjustment in the tunnel interface configuration. The typical safe value is 1360 bytes for IPsec with NAT-T, or 1380 bytes for IPsec without NAT-T.

### NAT Traversal

IPsec ESP (protocol 50) is not a TCP or UDP protocol -- it sits directly on IP, which means NAT devices that rewrite port numbers cannot process it. NAT Traversal (NAT-T, RFC 3947) solves this by encapsulating ESP packets inside UDP port 4500. IKEv2 detects NAT during the IKE_SA_INIT exchange by including NAT_DETECTION_SOURCE_IP and NAT_DETECTION_DESTINATION_IP notifications; if either side detects that NAT is present on the path, both sides automatically switch to UDP encapsulation.

The operational implications: ensure that UDP 500 (IKE) and UDP 4500 (NAT-T/ESP) are permitted through all firewalls and ACLs on the path. Do not assume that because IPsec uses "protocol 50" you need to permit IP protocol 50 -- if NAT-T is active (and it usually is, because most paths traverse at least one NAT device), the traffic will be UDP 4500 and protocol 50 will never appear on the wire.

### ESP vs UDP Encapsulation

When NAT-T is not needed, ESP runs directly on IP (protocol number 50), which is more efficient -- no UDP header overhead, no port number consumption, and some hardware platforms can offload raw ESP more efficiently than UDP-encapsulated ESP. The decision is not usually manual: IKEv2's NAT detection determines the encapsulation automatically. However, some environments force UDP encapsulation even without NAT, either for firewall traversal (some firewalls block non-TCP/UDP IP protocols) or to enable stateful firewall tracking (firewalls can track UDP sessions but cannot meaningfully track raw ESP).

## Key Rotation Operations

### IKE SA and IPsec SA Lifetimes

IKE SA lifetime (Phase 1) controls how often the management channel renegotiates. Standard production value: 86,400 seconds (24 hours). Shorter values increase security (limiting the window of key exposure) but increase CPU load from renegotiation.

IPsec SA lifetime (Phase 2) controls how often the data tunnel rekeys. Standard production value: 3,600 seconds (1 hour) or 100 MB, whichever comes first. With PFS enabled, each rekey performs a new DH exchange -- computationally expensive but cryptographically essential.

Both sides must agree on lifetime values, or more precisely, the SA will rekey at the shorter of the two configured lifetimes. A common source of tunnel flaps is asymmetric lifetimes: if one side is configured for 3,600 seconds and the other for 28,800 seconds, the short-lived side will attempt to rekey every hour while the long-lived side does not expect renegotiation for eight hours. The result depends on implementation: some platforms handle this gracefully, others experience brief outages during rekey as the SA states temporarily diverge.

### PSK Rotation Procedures

Pre-shared key rotation in IPsec requires coordination because the PSK must be changed on both sides simultaneously (or within the current IKE SA lifetime). The operational procedure:

1. Schedule a maintenance window (or accept that the tunnel will drop briefly)
2. Change the PSK on both peers
3. Clear the existing IKE SA on both sides to force renegotiation with the new PSK
4. Verify Phase 1 and Phase 2 establishment
5. Document the rotation in the change management system

For organizations with dozens or hundreds of site-to-site tunnels, PSK rotation becomes operationally untenable -- this is the primary driver toward certificate-based VPN authentication, where certificate renewal is automated through a PKI and does not require manual coordination between tunnel endpoints.

### Certificate-Based VPN Authentication

Certificate-based authentication replaces PSKs with X.509 certificates issued by the organization's PKI. Each VPN endpoint presents its certificate during IKE_AUTH, and the peer validates it against the trusted CA chain. Certificates carry advantages over PSKs: they can be individually revoked (through CRL or OCSP), they bind authentication to a specific identity (the certificate subject), and they can be automatically renewed before expiry.

The operational complexity shifts from PSK coordination to PKI management: ensuring the CA is available and properly secured, monitoring certificate expiry, configuring CRL distribution points or OCSP responders, and handling certificate enrollment for new devices (SCEP or EST protocols). A well-managed PKI makes VPN key rotation automatic and invisible; a poorly managed one turns certificate expiry into unplanned outages.

## Always-On VPN

### Device Tunnel vs User Tunnel

Always-on VPN architectures distinguish between the device tunnel -- established before user login, using machine certificates for authentication -- and the user tunnel -- established after login, using user credentials or certificates.

**Device tunnel** provides pre-logon connectivity that enables domain join, Group Policy processing, SCCM management, and password reset for domain accounts (the user cannot change their expired password if they cannot reach the domain controller). Device tunnel typically uses IKEv2 on Windows and profile-based configuration on macOS. Microsoft's Always On VPN implementation replaced the deprecated DirectAccess technology starting with Windows 10 and provides both device and user tunnel capabilities using native Windows VPN client capabilities, configured through MDM (Intune) or PowerShell.

**User tunnel** establishes after authentication and typically provides broader access than the device tunnel, which is usually restricted to management infrastructure. The user tunnel may use different authentication (e.g., SAML with MFA) and different routing (wider split tunnel or full tunnel).

GlobalProtect implements both modes: pre-logon (device tunnel equivalent using machine certificate) and user-logon (user tunnel with SAML, LDAP, or certificate authentication). The two tunnels can connect to different gateways with different security policies, providing management-plane connectivity through pre-logon and user-plane connectivity after authentication.

### Windows DirectAccess -- Legacy

Microsoft DirectAccess, introduced in Windows 7 Enterprise and Windows Server 2008 R2, provided always-on, certificate-based remote access using IPv6 transition technologies (6to4, Teredo, IP-HTTPS). DirectAccess was architecturally ahead of its time -- it provided seamless, policy-managed connectivity without user interaction -- but its dependency on IPv6, its requirement for Windows Enterprise edition, and its complex deployment (requiring either edge or behind-NAT topology with specific certificate requirements) limited adoption. Microsoft deprecated DirectAccess in favor of Always On VPN in Windows 10/11 and Windows Server 2016+. Organizations still running DirectAccess should plan migration to Always On VPN or a third-party ZTNA solution; DirectAccess receives security patches but no new features and will eventually leave support entirely.

## SD-WAN as VPN Replacement

### From Tunnel to Fabric

SD-WAN does not replace VPN so much as subsume it. A traditional site-to-site VPN connects two endpoints through a single encrypted tunnel over a single WAN link. SD-WAN creates an application-aware fabric across multiple WAN links (MPLS, broadband, LTE/5G, satellite), dynamically routing traffic based on application requirements, link performance, and policy.

The VPN functionality -- encrypting traffic between sites -- is a feature of SD-WAN, not its purpose. SD-WAN adds application identification (steering Zoom to the lowest-latency link while routing bulk backup to the cheapest link), real-time link quality monitoring (packet loss, latency, jitter measured per-link and per-application), automatic failover (shifting traffic from a degraded link in sub-second timeframes), and centralized orchestration (deploying routing and security policy across hundreds of sites from a single console).

For organizations with more than 10-15 branch sites still running MPLS + IPsec hub-and-spoke VPN, the economic case for SD-WAN is compelling: replace expensive MPLS circuits with commodity broadband (at 50-80% cost reduction), add cellular backup for resilience, and gain application-aware routing that MPLS and IPsec never provided. The Gartner Magic Quadrant for SD-WAN Infrastructure recognizes Fortinet, Palo Alto Networks (via Prisma SD-WAN), VMware (VeloCloud, now under Broadcom), and Cisco (Viptela/Catalyst SD-WAN) as Leaders.

### SASE Convergence

The trajectory of both SD-WAN and remote access VPN is convergence into Secure Access Service Edge (SASE), which combines SD-WAN networking with Security Service Edge (SSE) security functions: SWG (Secure Web Gateway), CASB (Cloud Access Security Broker), ZTNA, DLP, and FWaaS. SASE collapses the distinction between site-to-site VPN (SD-WAN replaces it), remote access VPN (ZTNA replaces it), and web security (SWG/CASB replaces the proxy). The operational implication is that organizations evaluating VPN refresh or expansion should consider whether a SASE architecture -- purchased from a single vendor or assembled from best-of-breed components -- provides a more sustainable path than investing further in traditional VPN infrastructure.

## Real Incidents: When VPN Became the Attack Vector

### Ivanti/Pulse Secure -- The Chain That Would Not End

The Ivanti Connect Secure (formerly Pulse Secure) vulnerability saga is a case study in cascading failure. The timeline:

- **December 2023**: Exploitation of CVE-2023-46805 (authentication bypass) and CVE-2024-21887 (command injection) begins. Volexity discovers the campaign and publishes findings on January 10, 2024.
- **January 2024**: CISA issues Emergency Directive 24-01, ordering all federal agencies to disconnect Ivanti Connect Secure appliances. Patches are delayed; mitigations prove bypassable.
- **February 2024**: Additional vulnerabilities CVE-2024-21888 (privilege escalation) and CVE-2024-21893 (SSRF) are disclosed. Ivanti releases patches on January 31 and February 1 for multiple versions.
- **Mid-December 2024**: Exploitation of CVE-2025-0282 (unauthenticated stack-based buffer overflow enabling remote code execution) begins before disclosure.
- **January 8, 2025**: Ivanti discloses CVE-2025-0282 and CVE-2025-0283.
- **February 11, 2025**: Ivanti Connect Secure 22.7R2.6 patches CVE-2025-22457.
- **April 3, 2025**: CVE-2025-22457 is disclosed as actively exploited in the wild by suspected China-nexus threat actors, affecting Connect Secure, Pulse Connect Secure, Policy Secure, and ZTA Gateways.

The operational lesson is not just "patch faster" -- it is that VPN appliances are high-value targets precisely because they sit at the trust boundary. An attacker who compromises the VPN gateway has bypassed the entire perimeter security model. Organizations running Ivanti/Pulse Secure should evaluate whether the cumulative risk profile justifies continued use, or whether migration to an alternative VPN platform or ZTNA architecture is warranted.

### Fortinet SSL VPN -- The Symlink That Survived Patching

Fortinet's SSL VPN service on FortiGate appliances suffered three major vulnerabilities: CVE-2022-42475, CVE-2023-27997, and CVE-2024-21762 (CVSS 9.6, out-of-bounds write in sslvpnd enabling unauthenticated remote code execution). Each was exploited in the wild. But the most operationally alarming development came in April 2025: Fortinet disclosed that attackers who had exploited these earlier vulnerabilities had created symbolic links inside the FortiOS user filesystem that connected to the root filesystem, placed in a directory used to serve SSL VPN language files. These symlinks survived patching -- when organizations applied the fix for the original vulnerability, the attacker's persistence mechanism remained in place, providing continued read-only access to the device's configuration files, including credentials.

By April 15, 2025, the Shadowserver Foundation reported 16,620 internet-exposed Fortinet devices compromised with the symlink backdoor: 7,886 in Asia, 3,766 in Europe, 3,217 in North America. CISA issued an advisory on April 11, 2025. Fortinet's remediation required upgrading to specific FortiOS versions (7.6.2, 7.4.7, 7.2.11, 7.0.17, or 6.4.16) that included detection and removal of the malicious symlink, and the company recommended disabling SSL VPN as a mitigation until the patch was applied.

The lesson is that patching a vulnerability does not guarantee removal of the attacker. Post-exploitation persistence -- through symlinks, web shells, modified binaries, scheduled tasks, or firmware implants -- can survive the patch that closes the original entry point. VPN appliance patching must be accompanied by integrity verification: factory reset and rebuild from known-good firmware when exploitation is suspected.

### Cisco AnyConnect -- Death by a Thousand Cuts

Cisco AnyConnect (Secure Client) has not suffered a single catastrophic zero-day on the scale of Ivanti or Fortinet's SSL VPN, but it has accumulated a steady stream of vulnerabilities that collectively erode operational confidence. CVE-2023-20178 provided privilege escalation to SYSTEM on Windows through a vulnerability exploitable by any authenticated local user. CVE-2023-20240 and CVE-2023-20241 allowed authenticated local denial of service through out-of-bounds memory reads. A vulnerability in IKEv2 processing allowed unauthenticated remote denial of service through crafted packets. CVE-2024-20502 affected the AnyConnect VPN server on Meraki MX appliances, allowing unauthenticated remote DoS through crafted HTTPS requests.

The pattern is not a single devastating flaw but a broad attack surface: the VPN client runs with high privileges on every endpoint, processing untrusted network input from the VPN gateway, parsing complex protocol messages, and managing cryptographic operations. Every one of those functions is a potential vulnerability surface.

## VPN Migration Checklist

### Phase 0: Assessment (Weeks 1-2)

- [ ] Inventory all VPN infrastructure: site-to-site tunnels, remote access gateways, client versions
- [ ] Document current user count, peak concurrent sessions, and growth trajectory
- [ ] Catalog all applications accessed through VPN, categorized by protocol and ZTNA readiness
- [ ] Assess current VPN vulnerability posture: patch levels, CVE exposure, Integrity Verification Tool results
- [ ] Define target architecture: VPN refresh, ZTNA migration, or hybrid coexistence

### Phase 1: Parallel Deployment (Weeks 3-8)

- [ ] Deploy ZTNA connectors alongside existing VPN infrastructure
- [ ] Migrate web applications first (lowest risk, fastest validation)
- [ ] Maintain VPN as primary access path; ZTNA as secondary/opt-in
- [ ] Establish monitoring for both paths: connection success rates, latency, user experience metrics

### Phase 2: Progressive Migration (Weeks 9-20)

- [ ] Migrate applications by category: web apps, then SSH/RDP, then client-server, then legacy protocols
- [ ] Shift user defaults from VPN-primary to ZTNA-primary for migrated applications
- [ ] Reduce VPN concentrator capacity as load decreases
- [ ] Monitor VPN traffic for unmigrated applications and service accounts

### Phase 3: VPN Decommission (Weeks 21-26)

- [ ] Verify zero VPN traffic to all migrated applications for 30 consecutive days
- [ ] Migrate remaining edge cases (legacy protocols, partner connections, automation)
- [ ] Decommission VPN concentrators or retain in cold standby for disaster recovery
- [ ] Update network diagrams, runbooks, and incident response procedures

## Looking Forward

The VPN is not dead. IPsec site-to-site tunnels will carry production traffic for years to come -- they are well-understood, standards-based, interoperable across vendors, and cryptographically sound. WireGuard is displacing IPsec in environments that value simplicity and performance over feature richness and compliance certifications. Remote access VPN is being replaced, not by a better VPN, but by a different architecture entirely -- one where the network grants no implicit trust, where access is brokered per-application rather than per-network, and where the attack surface of the access gateway is minimized by eliminating the gateway's exposure to the internet.

The operational discipline does not change: know what tunnels you have, monitor them continuously, rotate keys on schedule, patch the endpoints that terminate them, and verify that patching actually removed the attacker -- not just the vulnerability. The tunnel is a promise. Keep it.

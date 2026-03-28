# Implementation Guide

> **Domain:** Remote Access Protocols
> **Module:** 6 -- Protocol Selection & Deployment Patterns
> **Through-line:** *Choosing between SSH, RDP, VNC, and SPICE is not a feature checklist exercise. It is an architectural decision that determines your security posture, your bandwidth requirements, your latency tolerance, and your operational complexity for the life of the deployment. The right protocol depends on what you are actually doing.*

---

## Table of Contents

1. [Protocol Selection Matrix](#1-protocol-selection-matrix)
2. [Use Case Recommendations](#2-use-case-recommendations)
3. [Performance Characteristics](#3-performance-characteristics)
4. [Deployment Patterns](#4-deployment-patterns)
5. [SSH Tunneling Patterns](#5-ssh-tunneling-patterns)
6. [Mesh Network Integration](#6-mesh-network-integration)
7. [Monitoring and Observability](#7-monitoring-and-observability)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. Protocol Selection Matrix

| Criterion | SSH | RDP | VNC | SPICE |
|---|---|---|---|---|
| Server administration | Best | Good | Adequate | N/A |
| Windows desktop access | Tunneling only | Best | Good | Good (KVM) |
| Linux desktop access | X11/Waypipe | xrdp | Good | Best (KVM) |
| Headless server management | Best | Overkill | Overkill | N/A |
| File transfer | SCP/SFTP | Drive redir | External | WebDAV channel |
| Automation/scripting | Best | PowerShell Remoting | External | N/A |
| Low bandwidth (<1 Mbps) | Best | Good (GDI mode) | Good (Tight enc) | Poor |
| High latency (>200ms) | Good | Good (pipeline) | Poor | Poor |
| Security-critical | Best | Good (with NLA) | Poor (default) | Medium |
| VM console access | N/A | Hyper-V | libvirt VNC | libvirt SPICE |

---

## 2. Use Case Recommendations

### Server Administration
**Use SSH.** No contest. Text-based interaction over encrypted tunnel with public key authentication, agent forwarding for multi-hop, and SFTP for file transfer. For occasional GUI needs, use X11 forwarding or XPRA.

### Windows Desktop Access
**Use RDP with NLA.** RDP is purpose-built for Windows and provides the best graphical fidelity, audio redirection, device mapping, and multi-monitor support. Always enforce NLA and TLS.

### Linux VM Console (KVM/QEMU)
**Use SPICE.** SPICE's QXL device model provides GPU-accelerated rendering, clipboard sharing, and USB redirection through the hypervisor boundary. Fallback to VNC for basic console access.

### Cross-Platform Desktop Sharing
**Use VNC over SSH tunnel.** VNC's universal client/server compatibility makes it the lowest-common-denominator choice. Always tunnel through SSH for security.

### Automated Deployment / CI/CD
**Use SSH.** Public key authentication, no interactive session required, scriptable via `ssh user@host 'command'`, and connection multiplexing via ControlMaster for high-frequency operations.

---

## 3. Performance Characteristics

| Protocol | Typical Bandwidth | Latency Sensitivity | CPU Impact (server) | CPU Impact (client) |
|---|---|---|---|---|
| SSH (text) | 1-50 Kbps | Low | Minimal | Minimal |
| SSH (X11 fwd) | 0.1-5 Mbps | High | Low | Low |
| RDP (office) | 100-500 Kbps | Medium | Medium | Low |
| RDP (video) | 2-10 Mbps | Medium | High | Medium |
| VNC (Tight) | 0.5-5 Mbps | Medium | Medium | Low |
| VNC (Raw) | 5-50 Mbps | Low | Low | Low |
| SPICE | 1-20 Mbps | Medium | High (QXL) | Medium |

### Bandwidth Optimization Strategies

- **SSH:** Enable compression (`-C` flag) for high-latency links; use ControlMaster for connection reuse
- **RDP:** Use RDP 8+ with UDP transport for adaptive bitrate; enable bitmap caching
- **VNC:** Select Tight encoding for WAN; use CopyRect for scroll-heavy content
- **SPICE:** Enable QUIC/GLZ image compression; use video streaming for detected motion regions

---

## 4. Deployment Patterns

### Jump Host / Bastion

```
BASTION HOST PATTERN
================================================================
  Internet -> [Bastion Host] -> Internal Network
                  |
                  +-- SSH only (port 22)
                  +-- Public key auth required
                  +-- ProxyJump: ssh -J bastion internal-host
                  +-- No interactive shell on bastion itself
```

### VPN + Protocol

For environments requiring graphical access to multiple internal hosts:
1. VPN tunnel establishes network connectivity
2. RDP/VNC/SPICE over the VPN for graphical sessions
3. SSH for administration and automation

### Reverse Tunnel

For hosts behind NAT/firewall without inbound access:
```
Internal host -> SSH -R 2222:localhost:22 relay-server
External user -> SSH -p 2222 relay-server  (reaches internal host)
```

---

## 5. SSH Tunneling Patterns

### Local Port Forward
```
ssh -L 5901:vnc-server:5900 bastion
# Local port 5901 -> through bastion -> vnc-server:5900
# Connect VNC client to localhost:5901
```

### Dynamic SOCKS Proxy
```
ssh -D 1080 bastion
# Configure browser: SOCKS5 proxy at localhost:1080
# All traffic routes through bastion
```

### SSH over SSH (ProxyJump)
```
ssh -J bastion1,bastion2 target-host
# Chains through multiple jump hosts
# Each hop is independently encrypted
```

---

## 6. Mesh Network Integration

For GSD Mesh and Fox Infrastructure Group deployments:

- **SSH as mesh transport:** SSH channels carry DACP bundles between mesh agents; certificate-based auth scales without per-node key management
- **ControlMaster for mesh efficiency:** Single TCP connection per mesh peer, multiplexed channels for multiple agent conversations
- **SSH certificates for mesh trust:** CA-signed certificates with principal constraints enable role-based mesh access
- **SFTP for bundle delivery:** Large DACP bundles can be delivered via SFTP subsystem, leveraging SSH's built-in flow control and encryption
- **Port forwarding for service mesh:** SSH tunnels expose internal mesh services to authorized nodes without VPN infrastructure

---

## 7. Monitoring and Observability

| Protocol | Log Source | Key Metrics |
|---|---|---|
| SSH | /var/log/auth.log, sshd journal | Failed auths, session duration, bytes transferred |
| RDP | Windows Event Log (Security, TerminalServices) | Login events, session duration, disconnection reason |
| VNC | Server-specific logs | Connection attempts, encoding negotiation |
| SPICE | libvirt/QEMU logs | Channel connections, compression ratios |

---

## 8. Cross-References

> **Related:** [TCP/IP Protocol](../TCP/page.html?doc=01-ip-layer) -- transport layer beneath all remote access protocols. [DNS](../DNS/page.html?doc=01-dns-resolution) -- SSHFP records for host key verification. [DHCP](../DHP/page.html?doc=01-dhcp-protocol) -- network configuration enabling remote access.

---

## 9. Sources

1. OpenSSH Manual Pages -- man.openbsd.org/ssh, sshd, ssh_config
2. MS-RDPBCGR -- Microsoft Open Specifications
3. RFC 6143 -- The Remote Framebuffer Protocol
4. SPICE Documentation -- spice-space.org
5. NIST SP 800-123 -- Guide to General Server Security
6. CIS Benchmarks -- Center for Internet Security

# Security & Hardening

> **Domain:** Remote Access Protocols
> **Module:** 5 -- CVE Landscape, Cipher Guidance & Cross-Protocol Comparison
> **Through-line:** *Security is not a property you add to a protocol -- it is either present in the wire format or it is not. The CVE history of remote access protocols reads as a chronicle of what happens when that principle is violated: when authentication is optional, when encryption is negotiable downward, when pre-authentication attack surface is exposed.*

---

## Table of Contents

1. [Security Comparison Matrix](#1-security-comparison-matrix)
2. [SSH Security Posture](#2-ssh-security-posture)
3. [RDP Security Posture](#3-rdp-security-posture)
4. [VNC Security Posture](#4-vnc-security-posture)
5. [SPICE Security Posture](#5-spice-security-posture)
6. [CVE Landscape](#6-cve-landscape)
7. [Cipher Recommendations](#7-cipher-recommendations)
8. [Hardening Guidance](#8-hardening-guidance)
9. [Attack Surface Analysis](#9-attack-surface-analysis)
10. [Sources](#10-sources)

---

## 1. Security Comparison Matrix

| Dimension | SSH | RDP (NLA) | VNC (VeNCrypt) | SPICE (TLS) |
|---|---|---|---|---|
| Default encryption | AES-256-GCM / ChaCha20 | TLS 1.2+ | TLS 1.2+ | TLS 1.2+ |
| Pre-auth attack surface | Minimal (version + kex) | Minimal with NLA | Full handshake exposed | TLS before auth |
| Authentication | Public key, certificate | Kerberos, NTLM | Password, certificate | SASL, TLS client cert |
| Perfect forward secrecy | Yes (ephemeral DH/ECDH) | TLS cipher dependent | TLS cipher dependent | TLS cipher dependent |
| Known CVE count (critical) | ~15 (OpenSSH lifetime) | ~50+ (RDP stack) | ~20 (VNC implementations) | ~5 (SPICE) |
| Default security posture | Strong | Medium (if NLA enforced) | Weak (type 2 = DES) | Medium |

---

## 2. SSH Security Posture

SSH has the strongest default security posture of any remote access protocol. Key architectural strengths:

- **Encryption is mandatory** -- there is no "none" cipher in standard SSH2 (the spec allows it for debugging but all implementations reject it)
- **Key exchange provides PFS** -- every session uses ephemeral keys
- **Host key verification** -- TOFU model with SSHFP DNS records for out-of-band verification
- **Strict algorithm negotiation** -- RFC 9142 deprecates weak algorithms; modern OpenSSH refuses SHA-1 kex

### SSH-Specific Risks
- **Agent forwarding abuse** -- compromised server can use forwarded agent
- **Terrapin attack (CVE-2023-48795)** -- prefix truncation attack on SSH binary packet protocol; mitigated by "strict key exchange" extension
- **Username enumeration** -- timing side-channel in authentication responses
- **Brute force** -- password authentication without rate limiting

---

## 3. RDP Security Posture

RDP's security has improved dramatically from its weak origins but remains complex:

- **Standard RDP Security uses RC4** -- cryptographically broken; should never be used
- **NLA (Network Level Authentication)** -- CredSSP pre-authenticates before RDP session; dramatically reduces attack surface
- **Man-in-the-middle risk** -- without NLA, RDP is vulnerable to credential interception

### Key RDP Security Events
- **BlueKeep (CVE-2019-0708)** -- pre-authentication RCE in RDP services; CVSS 9.8; wormable; affected Windows XP through Server 2008 R2
- **DejaBlue (CVE-2019-1181/1182)** -- similar pre-auth RCE; affected Windows 7 through Server 2019
- **RDP Gateway bypass** -- multiple vulnerabilities in TS Gateway component

---

## 4. VNC Security Posture

VNC has the weakest default security of any major remote access protocol:

- **VNC Authentication (type 2) uses DES** -- 8-character maximum password, single DES encryption, trivially brutable
- **No encryption by default** -- base RFB protocol transmits pixel data in cleartext
- **No pre-auth protection** -- handshake exposes server information before authentication

VeNCrypt (type 19) wraps the connection in TLS and supports x509 certificate authentication, bringing VNC up to modern standards -- but it is not universally supported.

> **SAFETY: Never expose VNC directly to the internet without TLS or SSH tunnel.** The base protocol provides effectively no security. VNC brute-force attacks are a common vector for ransomware delivery.

---

## 5. SPICE Security Posture

SPICE has a moderate security posture:

- **Per-channel TLS** -- each channel can be independently encrypted
- **SASL authentication** -- integrates with Kerberos, LDAP, or local auth
- **Ticket-based auth** -- QEMU/libvirt generates one-time connection tickets
- **Limited attack surface** -- typically only accessible on hypervisor management network

---

## 6. CVE Landscape

### Critical SSH CVEs

| CVE | Year | Impact | CVSS |
|---|---|---|---|
| CVE-2023-48795 | 2023 | Terrapin: prefix truncation attack | 5.9 |
| CVE-2024-6387 | 2024 | regreSSHion: race condition in signal handler (OpenSSH) | 8.1 |
| CVE-2016-0777/0778 | 2016 | Roaming: client memory disclosure | 6.5 |
| CVE-2008-0166 | 2008 | Debian weak keys: predictable PRNG | 7.5 |

### Critical RDP CVEs

| CVE | Year | Impact | CVSS |
|---|---|---|---|
| CVE-2019-0708 | 2019 | BlueKeep: pre-auth RCE, wormable | 9.8 |
| CVE-2019-1181/1182 | 2019 | DejaBlue: pre-auth RCE | 9.8 |
| CVE-2019-0787 | 2019 | RDP client RCE via malicious server | 8.8 |
| CVE-2012-0002 | 2012 | MS12-020: pre-auth DoS/RCE | 9.3 |

### Critical VNC CVEs

| CVE | Year | Impact | CVSS |
|---|---|---|---|
| CVE-2019-15678-15681 | 2019 | Multiple heap overflow in TightVNC | 9.8 |
| CVE-2006-2369 | 2006 | RealVNC auth bypass | 7.5 |
| CVE-2019-8287 | 2019 | LibVNC: heap buffer overflow | 9.8 |

---

## 7. Cipher Recommendations

### SSH (per RFC 9142, 2022)

| Category | Recommended | Deprecated |
|---|---|---|
| Key exchange | curve25519-sha256, ecdh-sha2-nistp256 | diffie-hellman-group1-sha1, any SHA-1 kex |
| Host key | ssh-ed25519, rsa-sha2-512 | ssh-rsa (SHA-1), ssh-dss |
| Encryption | chacha20-poly1305, aes256-gcm | arcfour, blowfish-cbc, 3des-cbc |
| MAC | hmac-sha2-256-etm | hmac-sha1-96, hmac-md5 |

### RDP/VNC/SPICE

All should use TLS 1.2+ with:
- ECDHE key exchange (PFS)
- AES-256-GCM cipher
- SHA-256+ MAC
- Certificate verification enabled

---

## 8. Hardening Guidance

### SSH Hardening

- Disable password authentication; use public key or certificate only
- Set `PermitRootLogin no`
- Use `AllowUsers` or `AllowGroups` to restrict access
- Enable `MaxAuthTries 3` and `LoginGraceTime 30`
- Disable agent forwarding unless specifically needed
- Use `Match` blocks for per-user/per-host restrictions
- Enable `StrictHostKeyChecking yes` on clients
- Configure `KexAlgorithms`, `Ciphers`, `MACs` to exclude weak algorithms

### RDP Hardening

- Enforce NLA (Network Level Authentication) -- never allow Standard RDP Security
- Enable RDP over TLS with certificate pinning
- Use Remote Desktop Gateway for internet-facing access
- Implement network-level restrictions (firewall, VPN)
- Disable clipboard and drive redirection where not needed
- Enable account lockout policies

### VNC Hardening

- Always tunnel through SSH or use VeNCrypt/TLS
- Never expose port 5900+ directly to the internet
- Use strong passwords (VNC auth) or certificate auth (VeNCrypt)
- Restrict listener to localhost and use SSH tunnel for access
- Consider noVNC (HTML5) with TLS termination at reverse proxy

---

## 9. Attack Surface Analysis

```
ATTACK SURFACE BY PROTOCOL PHASE
================================================================

  Pre-Authentication:
    SSH:   Version string + KEXINIT (minimal)
    RDP:   X.224 + MCS + GCC (large, complex -- BlueKeep lived here)
    VNC:   Version + Security type list (exposed)
    SPICE: TLS handshake (if TLS enabled)

  Authentication:
    SSH:   Encrypted channel; key/password/interactive
    RDP:   CredSSP/NLA (encrypted) or cleartext (Standard)
    VNC:   DES challenge (type 2) or TLS (VeNCrypt)
    SPICE: SASL or ticket (over TLS)

  Post-Authentication:
    SSH:   Channel multiplexing; minimal attack surface
    RDP:   Complex PDU processing; large attack surface
    VNC:   Simple framebuffer updates; moderate surface
    SPICE: Multi-channel; moderate surface
```

The key insight: SSH's security comes from minimizing pre-authentication complexity. RDP's vulnerability history comes from maximizing it.

---

## 10. Sources

1. RFC 9142 -- Key Exchange Method Updates and Recommendations for SSH (Baushke, 2022)
2. NIST SP 800-57 Part 1 Rev. 5 -- Recommendation for Key Management (Barker, 2020)
3. CVE Database -- cve.mitre.org
4. MS-RDPBCGR Security Considerations -- Microsoft Open Specifications
5. RFC 6143 -- The Remote Framebuffer Protocol, Section 7 (Security Considerations)
6. CIS Benchmarks -- SSH, Windows Server (RDP configuration)

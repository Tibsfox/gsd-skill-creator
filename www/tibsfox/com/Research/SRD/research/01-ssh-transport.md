# SSH Core Transport

> **Domain:** Remote Access Protocols
> **Module:** 1 -- Binary Packet Format, Key Exchange & Ciphers
> **Through-line:** *The SSH transport layer is a masterwork of compositional design: three layers stacked cleanly, each doing exactly one thing. The binary packet format -- a 32-bit length, a padding byte, a payload, random padding, and a MAC -- is the atomic unit of all SSH communication. Every session, every command, every file transfer begins here.*

---

## Table of Contents

1. [Protocol Architecture](#1-protocol-architecture)
2. [Binary Packet Format](#2-binary-packet-format)
3. [Protocol Version Exchange](#3-protocol-version-exchange)
4. [Algorithm Negotiation](#4-algorithm-negotiation)
5. [Key Exchange Algorithms](#5-key-exchange-algorithms)
6. [Encryption Algorithms](#6-encryption-algorithms)
7. [MAC Algorithms](#7-mac-algorithms)
8. [Compression](#8-compression)
9. [Host Key Verification](#9-host-key-verification)
10. [Rekeying](#10-rekeying)
11. [Message Type Catalog](#11-message-type-catalog)
12. [Mesh Relevance](#12-mesh-relevance)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Protocol Architecture

The SSH protocol consists of three compositionally-stacked layers, each defined in a separate RFC, each running atop the one below, and each communicating through a clean interface [1]:

| Layer | RFC | Function |
|---|---|---|
| Connection Protocol | RFC 4254 | Multiplexed channels, shell/exec/subsystem/forwarding |
| Authentication Protocol | RFC 4252 | Client identity verification (publickey/password/etc.) |
| Transport Layer Protocol | RFC 4253 | Host authentication, encryption, integrity, compression |
| TCP/IP | -- | Reliable byte stream, default port 22 |

The transport layer provides the cryptographic tunnel. The authentication layer verifies the client's identity within that tunnel. The connection layer multiplexes logical channels over the single authenticated tunnel. This three-layer separation is the SSH protocol's core architectural strength.

```
SSH PROTOCOL STACK
================================================================

  +----------------------------------------------+
  |  SSH Connection Protocol (RFC 4254)          |
  |  Channels: session, direct-tcpip,            |
  |  forwarded-tcpip, x11                        |
  +----------------------------------------------+
  |  SSH Authentication Protocol (RFC 4252)      |
  |  Methods: publickey, password,               |
  |  keyboard-interactive, hostbased             |
  +----------------------------------------------+
  |  SSH Transport Layer Protocol (RFC 4253)     |
  |  Key exchange, encryption, MAC, compression  |
  +----------------------------------------------+
  |  TCP/IP (port 22)                            |
  +----------------------------------------------+
```

---

## 2. Binary Packet Format

After the protocol version exchange, all SSH communication uses the binary packet format defined in RFC 4253 Section 6. Each packet has five fields [2]:

| Field | Type / Size | Description |
|---|---|---|
| packet_length | uint32 (4 bytes) | Length of packet in bytes, NOT including MAC or itself. Encrypted when cipher is active. |
| padding_length | byte (1 byte) | Length of random_padding field. Must be at least 4. |
| payload | byte[n1] | Useful content. n1 = packet_length - padding_length - 1. Compressed if negotiated. |
| random_padding | byte[n2] | n2 = padding_length random bytes. Alignment padding. |
| mac | byte[m] | MAC or AEAD tag. m = mac_length (0 before key exchange). |

**Key constraint (RFC 4253 Section 6):** The total of packet_length + padding_length + payload + random_padding MUST be a multiple of the cipher block size or 8, whichever is larger. Minimum packet size is 16 bytes. Maximum uncompressed payload is 32,768 bytes; implementations must support total packet size of 35,000 bytes [2].

**MAC computation (RFC 4253 Section 6.4):**

```
mac = MAC(key, sequence_number || unencrypted_packet)
  where unencrypted_packet = packet_length || padding_length
                             || payload || random_padding
  sequence_number = implicit uint32, starts at 0,
                    increments per packet, NOT transmitted
```

> **SAFETY: The sequence number is never transmitted on the wire.** It is maintained independently by both sides. If sequence numbers desynchronize, the MAC check will fail and the connection must be terminated. This is a deliberate defense against replay attacks.

---

## 3. Protocol Version Exchange

Before any binary packets, both sides send a version string in text format [2]:

```
SSH-protoversion-softwareversion SP comments CR LF
  Example: SSH-2.0-OpenSSH_9.0<CR><LF>
  protoversion for SSH2: "2.0"
  Backward compat (SSH1+2): server may advertise "1.99"
  Max string length: 255 characters including CR LF
  Null character MUST NOT be sent
```

The version exchange is the only plaintext communication in an SSH session. Both version strings are included in the key exchange hash computation, binding the negotiation to the specific protocol versions in use.

---

## 4. Algorithm Negotiation

Both sides send SSH_MSG_KEXINIT (message type byte = 20) containing name-lists of supported algorithms in preference order. The first mutually-supported algorithm in each category is selected [3].

| Category | Current Recommended (RFC 9142, 2022) |
|---|---|
| kex_algorithms | curve25519-sha256 (MUST), ecdh-sha2-nistp256/384/521, diffie-hellman-group14-sha256 |
| server_host_key | ssh-ed25519, rsa-sha2-512, rsa-sha2-256, ecdsa-sha2-nistp256/384/521 |
| encryption | chacha20-poly1305@openssh.com, aes128-gcm@openssh.com, aes256-gcm@openssh.com, aes256-ctr |
| mac | hmac-sha2-256 (with CTR ciphers), hmac-sha2-512 |
| compression | none, zlib@openssh.com (delayed compression after auth) |

**Deprecated (MUST NOT use per RFC 9142):** diffie-hellman-group1-sha1, any kex using SHA-1 (except as last-resort fallback), arcfour, blowfish-cbc, 3des-cbc, hmac-sha1-96 [3].

---

## 5. Key Exchange Algorithms

### Curve25519-SHA256 (RFC 8731)

The recommended default key exchange. Uses Djb's Curve25519 elliptic curve with SHA-256 hash. Each side generates a 32-byte ephemeral public key, exchanges them, and computes a shared secret via scalar multiplication [4].

### ECDH-SHA2 (RFC 5656)

Elliptic Curve Diffie-Hellman over NIST curves. Three variants: nistp256 (SHA-256), nistp384 (SHA-384), nistp521 (SHA-512). Point format is uncompressed (0x04 prefix + x + y coordinates) [5].

### Diffie-Hellman Group14-SHA256

Classical DH over a 2048-bit MODP group (RFC 3526 Group 14). Used as fallback when ECDH is not available. Group-exchange (RFC 4419) allows server-specified group sizes [6].

### Six-Key Derivation

After key exchange produces the shared secret K and exchange hash H, six session keys are derived using HASH(K || H || letter || session_id) where letter cycles through A-F for: initial IV client-to-server, initial IV server-to-client, encryption key C2S, encryption key S2C, integrity key C2S, integrity key S2C [2].

---

## 6. Encryption Algorithms

| Algorithm | Key Size | Block/Nonce | Mode | Notes |
|---|---|---|---|---|
| chacha20-poly1305@openssh.com | 2x256-bit | 64-bit nonce | AEAD | OpenSSH extension; encrypts packet_length separately with second key |
| aes256-gcm@openssh.com | 256-bit | 12-byte nonce | AEAD | AES-GCM; implicit MAC, 16-byte auth tag |
| aes128-gcm@openssh.com | 128-bit | 12-byte nonce | AEAD | Same as above, shorter key |
| aes256-ctr | 256-bit | 16-byte IV | CTR stream | Requires separate MAC algorithm |
| aes128-ctr | 128-bit | 16-byte IV | CTR stream | Requires separate MAC algorithm |

**AEAD ciphers** (chacha20-poly1305, aes-gcm) integrate encryption and integrity into a single operation. When an AEAD cipher is negotiated, the MAC algorithm is effectively "none" -- the auth tag replaces the separate MAC field [7].

---

## 7. MAC Algorithms

When using CTR-mode ciphers (not AEAD), a separate MAC algorithm provides integrity:

| Algorithm | Hash | Output Length | Key Length |
|---|---|---|---|
| hmac-sha2-256 | SHA-256 | 32 bytes | 32 bytes |
| hmac-sha2-512 | SHA-512 | 64 bytes | 64 bytes |
| hmac-sha2-256-etm@openssh.com | SHA-256 | 32 bytes | 32 bytes (encrypt-then-MAC) |

The `etm@openssh.com` variants compute MAC over the ciphertext rather than plaintext, providing stronger security guarantees [3].

---

## 8. Compression

| Algorithm | Description |
|---|---|
| none | No compression (default) |
| zlib@openssh.com | Delayed zlib compression: activates only after authentication completes |
| zlib | Standard zlib; activates immediately (security risk: pre-auth compression oracle) |

The `zlib@openssh.com` extension delays compression activation until after user authentication, mitigating pre-authentication compression oracle attacks [2].

---

## 9. Host Key Verification

The server presents its host key during key exchange. The client must verify this key against a known-hosts database. Trust-on-first-use (TOFU) is the common model: accept the key on first connection, alert on changes [2].

Host key algorithms (RFC 9142 recommendations):
- **ssh-ed25519** -- Ed25519 signatures (256-bit, fast, constant-time)
- **rsa-sha2-512** -- RSA with SHA-512 (replaces ssh-rsa which used SHA-1)
- **ecdsa-sha2-nistp256/384/521** -- ECDSA over NIST curves

SSHFP DNS records (RFC 4255, RFC 6594) provide an out-of-band host key verification mechanism via DNSSEC-signed fingerprints.

---

## 10. Rekeying

Either side can initiate rekeying by sending a new SSH_MSG_KEXINIT at any time. OpenSSH defaults to rekeying after 1 GB of data transferred or 1 hour elapsed, whichever comes first. During rekeying, data transfer continues on the existing keys until the new keys are activated via SSH_MSG_NEWKEYS [2].

---

## 11. Message Type Catalog

SSH message types are assigned in RFC 4250. The first byte of every payload identifies the message type:

| Range | Assignment | Examples |
|---|---|---|
| 1-19 | Transport layer generic | SSH_MSG_DISCONNECT (1), SSH_MSG_IGNORE (2), SSH_MSG_DEBUG (4) |
| 20-29 | Key exchange | SSH_MSG_KEXINIT (20), SSH_MSG_NEWKEYS (21) |
| 30-49 | Key exchange method-specific | SSH_MSG_KEXDH_INIT (30), SSH_MSG_KEXDH_REPLY (31) |
| 50-59 | Authentication generic | SSH_MSG_USERAUTH_REQUEST (50), SSH_MSG_USERAUTH_SUCCESS (52) |
| 60-79 | Authentication method-specific | SSH_MSG_USERAUTH_PK_OK (60) |
| 80-89 | Connection protocol | SSH_MSG_CHANNEL_OPEN (90), SSH_MSG_CHANNEL_DATA (94) |
| 90-127 | Connection channel-related | SSH_MSG_CHANNEL_OPEN (90) through SSH_MSG_CHANNEL_FAILURE (100) |

---

## 12. Mesh Relevance

SSH transport provides the cryptographic tunnel for GSD mesh agent communication. Key considerations:

- **DACP over SSH:** Agent communication bundles can be transported via SSH channels, inheriting SSH's authentication and encryption
- **Port forwarding:** SSH's built-in port forwarding enables mesh node connectivity through NAT boundaries
- **Multiplexing:** SSH connection sharing (ControlMaster) reduces handshake overhead for frequently-communicating agents
- **Certificate-based auth:** SSH certificates (OpenSSH format) enable scalable mesh authentication without per-node key management

---

## 13. Cross-References

> **Related:** [TCP/IP Protocol](02-tcp-core.md) -- transport layer beneath SSH. [DNS](../DNS/research/01-dns-resolution.md) -- SSHFP records for host key verification. [Forward Error Correction](../FEC/research/01-theoretical-foundations.md) -- channel coding theory underlying SSH's integrity mechanisms.

---

## 14. Sources

1. RFC 4251 -- The Secure Shell (SSH) Protocol Architecture (Ylonen & Lonvick, 2006)
2. RFC 4253 -- The Secure Shell (SSH) Transport Layer Protocol (Ylonen & Lonvick, 2006)
3. RFC 9142 -- Key Exchange (KEX) Method Updates and Recommendations for SSH (Baushke, 2022)
4. RFC 8731 -- Curve25519 and Curve448 for SSH Key Agreement (Adamantiadis et al., 2020)
5. RFC 5656 -- Elliptic Curve Algorithm Integration in SSH Transport Layer (Stebila & Green, 2009)
6. RFC 4419 -- Diffie-Hellman Group Exchange for SSH (Friedl et al., 2006)
7. RFC 5647 -- AES Galois Counter Mode for SSH (Igoe & Solinas, 2009)
8. RFC 4250 -- The Secure Shell (SSH) Protocol Assigned Numbers (Lehtinen & Lonvick, 2006)

# SSH Application Layer

> **Domain:** Remote Access Protocols
> **Module:** 2 -- Authentication, Channels & SFTP
> **Through-line:** *The SSH connection protocol turns a single encrypted tunnel into a highway of multiplexed channels. Each channel -- session, direct-tcpip, forwarded-tcpip, x11 -- carries its own data stream with its own flow control. This multiplexing is what makes SSH more than a secure shell: it is a secure transport fabric.*

---

## Table of Contents

1. [Authentication Protocol](#1-authentication-protocol)
2. [Authentication Methods](#2-authentication-methods)
3. [Connection Protocol](#3-connection-protocol)
4. [Channel Lifecycle](#4-channel-lifecycle)
5. [Channel Types](#5-channel-types)
6. [Flow Control](#6-flow-control)
7. [Port Forwarding](#7-port-forwarding)
8. [X11 Forwarding](#8-x11-forwarding)
9. [SFTP Subsystem](#9-sftp-subsystem)
10. [Agent Forwarding](#10-agent-forwarding)
11. [Mesh Relevance](#11-mesh-relevance)
12. [Sources](#12-sources)

---

## 1. Authentication Protocol

The SSH Authentication Protocol (RFC 4252) runs over the transport layer and provides client identity verification. The server advertises which authentication methods it supports; the client attempts them in order of preference [1].

The authentication exchange follows a strict message pattern:

```
Client -> Server: SSH_MSG_USERAUTH_REQUEST (50)
  string    user name
  string    service name ("ssh-connection")
  string    method name

Server -> Client: SSH_MSG_USERAUTH_SUCCESS (52)
            or    SSH_MSG_USERAUTH_FAILURE (51)
            or    SSH_MSG_USERAUTH_BANNER (53)
```

The server may require multiple authentication methods (partial success). SSH_MSG_USERAUTH_FAILURE includes a name-list of methods that can continue and a boolean "partial success" flag [1].

---

## 2. Authentication Methods

### Public Key Authentication

The strongest standard method. The client proves possession of a private key by signing the session ID concatenated with the SSH_MSG_USERAUTH_REQUEST message [1].

| Step | Message | Direction |
|---|---|---|
| 1 | USERAUTH_REQUEST with method "publickey", FALSE flag, algorithm, public key | Client -> Server |
| 2 | USERAUTH_PK_OK (60) -- server confirms it will accept this key | Server -> Client |
| 3 | USERAUTH_REQUEST with method "publickey", TRUE flag, algorithm, public key, signature | Client -> Server |
| 4 | USERAUTH_SUCCESS or USERAUTH_FAILURE | Server -> Client |

### Password Authentication

Simple but less secure. The password is transmitted encrypted within the SSH tunnel. The server may request a password change via SSH_MSG_USERAUTH_PASSWD_CHANGEREQ (60) [1].

### Keyboard-Interactive (RFC 4256)

A generic challenge-response method supporting TOTP, RADIUS, PAM, and custom prompts. The server sends a series of prompts; the client responds to each [2].

### Certificate-Based Authentication

OpenSSH certificates (not X.509) bind a public key to an identity with an authority signature, valid-after/valid-before timestamps, and principal constraints. This scales authentication for large deployments without per-host authorized_keys management [3].

---

## 3. Connection Protocol

The SSH Connection Protocol (RFC 4254) provides multiplexed channels over the authenticated transport. All data flows through channels, each identified by a local and remote channel number [4].

---

## 4. Channel Lifecycle

| Phase | Message | Description |
|---|---|---|
| Open request | SSH_MSG_CHANNEL_OPEN (90) | Sender specifies channel type, sender channel number, initial window size, max packet size |
| Open confirmation | SSH_MSG_CHANNEL_OPEN_CONFIRMATION (91) | Recipient assigns its own channel number, window size, max packet size |
| Open failure | SSH_MSG_CHANNEL_OPEN_FAILURE (92) | Recipient rejects with reason code |
| Data transfer | SSH_MSG_CHANNEL_DATA (94) | Payload data within window budget |
| Extended data | SSH_MSG_CHANNEL_EXTENDED_DATA (95) | Typed data (e.g., type 1 = stderr) |
| Window adjust | SSH_MSG_CHANNEL_WINDOW_ADJUST (93) | Increase receive window by specified bytes |
| EOF | SSH_MSG_CHANNEL_EOF (96) | No more data from this direction |
| Close | SSH_MSG_CHANNEL_CLOSE (97) | Channel teardown; both sides must send close |

---

## 5. Channel Types

| Channel Type | RFC | Purpose |
|---|---|---|
| session | 4254 | Interactive shell, command execution, subsystem invocation |
| direct-tcpip | 4254 | Client-initiated TCP forwarding (local port forward) |
| forwarded-tcpip | 4254 | Server-initiated TCP forwarding (remote port forward) |
| x11 | 4254 | X11 display forwarding |

Session channels support three request types via SSH_MSG_CHANNEL_REQUEST: "shell" (interactive), "exec" (single command), and "subsystem" (named subsystem like SFTP) [4].

---

## 6. Flow Control

SSH implements per-channel sliding window flow control. Each side advertises a receive window size at channel open. The sender must not transmit more data than the receiver's window allows. The receiver sends SSH_MSG_CHANNEL_WINDOW_ADJUST to grant additional capacity [4].

```
FLOW CONTROL MECHANICS
================================================================
  Initial window size: advertised at CHANNEL_OPEN
  Sender tracks: bytes sent vs. receiver's window
  When window exhausted: sender MUST stop sending data
  Receiver: sends WINDOW_ADJUST when ready for more
  Default OpenSSH window: 2 MB (adjustable via MaxStartups)
```

> **SAFETY: Window size exhaustion is a legitimate flow control mechanism, not an error.** An implementation that does not properly track window sizes will either deadlock (never adjusting) or overflow (sending beyond the window), both of which will terminate the connection.

---

## 7. Port Forwarding

### Local Port Forwarding (-L)

Client listens on a local port and forwards connections through the SSH tunnel to a destination host/port accessible from the server. Uses "direct-tcpip" channel type [4].

### Remote Port Forwarding (-R)

Server listens on a remote port and forwards connections through the SSH tunnel to a destination host/port accessible from the client. Uses "forwarded-tcpip" channel type. Requires SSH_MSG_GLOBAL_REQUEST "tcpip-forward" [4].

### Dynamic Port Forwarding (-D)

Client acts as a SOCKS proxy. Applications connect to the local SOCKS port; the SSH client opens "direct-tcpip" channels to the requested destinations through the tunnel [4].

---

## 8. X11 Forwarding

X11 forwarding creates a proxy X display on the server. When a remote application opens an X11 connection, the server opens an "x11" channel to the client, which relays it to the local X server. SSH generates a proxy xauth cookie for authentication [4].

---

## 9. SFTP Subsystem

SFTP (SSH File Transfer Protocol) runs as a subsystem over an SSH session channel. It uses a request/response binary protocol with its own message types [5]:

| Message | Type ID | Direction | Purpose |
|---|---|---|---|
| SSH_FXP_INIT | 1 | Client | Initialize SFTP session, declare version |
| SSH_FXP_VERSION | 2 | Server | Confirm SFTP version, declare extensions |
| SSH_FXP_OPEN | 3 | Client | Open or create a file |
| SSH_FXP_CLOSE | 4 | Client | Close a file handle |
| SSH_FXP_READ | 5 | Client | Read data from file |
| SSH_FXP_WRITE | 6 | Client | Write data to file |
| SSH_FXP_STAT | 7 | Client | Get file attributes by path |
| SSH_FXP_OPENDIR | 11 | Client | Open a directory for reading |
| SSH_FXP_READDIR | 12 | Client | Read directory entries |
| SSH_FXP_MKDIR | 14 | Client | Create directory |
| SSH_FXP_RMDIR | 15 | Client | Remove directory |
| SSH_FXP_STATUS | 101 | Server | Result status code |
| SSH_FXP_HANDLE | 102 | Server | File or directory handle |
| SSH_FXP_DATA | 103 | Server | File data response |

---

## 10. Agent Forwarding

SSH agent forwarding allows a client's authentication agent to be used on the server for authenticating to further SSH connections. The client's private keys never leave the local machine -- only signing operations are forwarded [4].

> **SAFETY: Agent forwarding exposes the client's authentication capability to the server.** A compromised server can use the forwarded agent to authenticate as the client to other servers. Use `ssh-add -c` (confirm mode) or avoid agent forwarding to untrusted servers.

---

## 11. Mesh Relevance

- **DACP transport:** SSH channels provide authenticated, encrypted transport for DACP structured bundles between mesh agents
- **Subsystem model:** Custom SSH subsystems could implement DACP directly, bypassing shell overhead
- **Certificate auth:** OpenSSH certificates enable mesh-wide trust distribution without centralized key management
- **Connection sharing:** ControlMaster multiplexes multiple logical connections over a single TCP connection, reducing handshake latency for mesh traffic

---

## 12. Sources

1. RFC 4252 -- The Secure Shell (SSH) Authentication Protocol (Ylonen & Lonvick, 2006)
2. RFC 4256 -- Generic Message Exchange Authentication for SSH (Cusack & Forssen, 2006)
3. OpenSSH Certificate Authentication -- openssh.com/txt/cert-protocol.txt
4. RFC 4254 -- The Secure Shell (SSH) Connection Protocol (Ylonen & Lonvick, 2006)
5. draft-ietf-secsh-filexfer-13 -- SSH File Transfer Protocol (Galbraith & Saarenmaa, 2006)

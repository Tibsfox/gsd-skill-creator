---
name: network-and-firewall
description: Configure interfaces, routes, DNS, and firewalls (nftables/iptables/ufw/firewalld); diagnose with ss/ip/tcpdump.
---

# network-and-firewall

Own the host-level network plane. Configure interfaces and routes,
maintain the firewall ruleset, keep DNS working, and diagnose
connectivity from the inside out.

## Diagnosis ladder

1. `ip addr`, `ip route`, `ip -s link` — is the interface up and carrying packets?
2. `ss -tunlp` — is the port actually listening on the expected address?
3. `getent hosts <name>`, `dig @<resolver> <name>` — is DNS resolving?
4. `ping`, `traceroute`, `mtr` — can we reach the next hop?
5. `tcpdump -ni <iface> host <peer>` — are the packets actually leaving?

## Firewall rules

- Prefer nftables on modern distros; keep rule sets in a single file under version control
- `ufw` is fine for single-host boxes; `firewalld` for workloads with zones
- Every new open port is a `ChangeRecord` reviewed by `sysadmin-security-officer`

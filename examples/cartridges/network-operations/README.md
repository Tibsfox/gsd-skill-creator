# Network Operations

A full cartridge for network operations center (NOC) work — the fabric
between hosts. Where `systems-administration` configures a host's
network stack and `systems-operations` runs the services on top,
`network-operations` owns the routers, switches, transit, peering,
load balancers, DNS, and the edge.

## Shape

- **12 skills** across 12 domains (routing, bgp, firewall, loadbalancer,
  vpn, dns, ipam, telemetry, ddos, circuit, change, incident)
- **5 agents** in a router topology with `netops-architect` as capcom
- **5 teams** — change-window, incident, peering, ddos-response, capacity
- **8 grove record types** — NetworkIncident, RouteChange, PeeringSession,
  MaintenanceWindow, CircuitRecord, DDoSEvent, DNSChange,
  NetworkCapacitySnapshot

## Composition

Designed to compose with:

- `systems-administration` — host-level network config lives there
- `systems-operations` — runtime service operations on top of the fabric
- `security` — authz and compliance overlays for network devices
- `cloud-systems` — VPC/VNet constructs where infra meets the fabric

The grove namespace (`network-operations`) is distinct from the sysadmin
and sysops namespaces, so `NetworkIncident` and `IncidentReport` do not
collide — they live alongside each other and link via cross-references.

## Forge gates

```
skill-creator cartridge validate ./cartridge.yaml --json
skill-creator cartridge eval     ./cartridge.yaml
skill-creator cartridge dedup    ./cartridge.yaml
skill-creator cartridge metrics  ./cartridge.yaml
```

All four green is the ship bar.

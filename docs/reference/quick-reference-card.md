# OpenStack Quick Reference Card

> **Tier 1 -- Always Loaded** | Kolla-Ansible on CentOS Stream 9 | OpenStack 2024.2 (Dalmatian)

## Service Directory

| Service | Component | Default Port | API Version | Log Location |
|---------|-----------|-------------|-------------|--------------|
| Identity | Keystone | 5000 | v3 | /var/log/kolla/keystone/ |
| Compute | Nova | 8774 | v2.1 | /var/log/kolla/nova/ |
| Networking | Neutron | 9696 | v2.0 | /var/log/kolla/neutron/ |
| Block Storage | Cinder | 8776 | v3 | /var/log/kolla/cinder/ |
| Image | Glance | 9292 | v2 | /var/log/kolla/glance/ |
| Object Storage | Swift | 8080 | v1 | /var/log/kolla/swift/ |
| Orchestration | Heat | 8004 | v1 | /var/log/kolla/heat/ |
| Dashboard | Horizon | 80/443 | N/A | /var/log/kolla/horizon/ |

### Additional API Ports

| Service | Port | Purpose |
|---------|------|---------|
| Nova metadata | 8775 | Instance metadata service |
| Nova VNC proxy | 6080 | noVNC console proxy |
| Placement | 8778 | Resource inventory and allocation |
| Heat CloudFormation | 8000 | AWS CloudFormation compatibility |
| Heat waitcondition | 8003 | Stack wait condition callbacks |
| Keystone admin (legacy) | 35357 | Deprecated; unified on 5000 since Queens |

## Essential CLI Commands

### Keystone (Identity)

```bash
openstack token issue                              # Verify auth + get token
openstack service list                             # List registered services
openstack endpoint list                            # Show all service endpoints
openstack project list                             # List all projects
openstack role assignment list --user <user>       # Show user role assignments
```

### Nova (Compute)

```bash
openstack server list --all-projects               # List all instances
openstack server show <id>                         # Instance detail + fault info
openstack hypervisor list                          # List compute hosts + status
openstack compute service list                     # Service status per host
openstack server create --flavor <f> --image <i> --network <n> <name>  # Launch instance
```

### Neutron (Networking)

```bash
openstack network list                             # List all networks
openstack port list --server <id>                  # Ports attached to instance
openstack network agent list                       # Agent status per host
openstack router show <id>                         # Router detail + gateway
openstack floating ip list                         # All floating IPs + status
```

### Cinder (Block Storage)

```bash
openstack volume list --all-projects               # List all volumes
openstack volume show <id>                         # Volume detail + attachment
openstack volume service list                      # Backend service status
openstack volume create --size <GB> <name>         # Create new volume
openstack volume snapshot list                     # List all snapshots
```

### Glance (Image)

```bash
openstack image list                               # List available images
openstack image show <id>                          # Image detail + properties
openstack image create --file <path> --disk-format qcow2 --container-format bare <name>
openstack image set --property <key>=<val> <id>    # Set image metadata
openstack image delete <id>                        # Remove image
```

### Swift (Object Storage)

```bash
openstack container list                           # List Swift containers
openstack object list <container>                  # List objects in container
swift stat                                         # Account statistics
swift upload <container> <file>                    # Upload object
swift download <container> <object>                # Download object
```

### Heat (Orchestration)

```bash
openstack stack list                               # List all stacks
openstack stack show <name>                        # Stack detail + status
openstack stack create -t <template> <name>        # Create stack from template
openstack stack event list <name>                  # Stack event history
openstack stack resource list <name>               # Resources in stack
```

### Horizon (Dashboard)

```
URL: https://<controller-ip>/                      # Web dashboard access
Admin panel: Identity > Projects/Users/Roles       # User management
Credentials: /etc/kolla/admin-openrc.sh            # Admin credential source
```

## Common Configuration Files

All configuration files are mounted into containers by Kolla-Ansible from `/etc/kolla/`.

| Service | Config File | Container Path |
|---------|-------------|----------------|
| Keystone | /etc/kolla/keystone/keystone.conf | /etc/keystone/keystone.conf |
| Nova | /etc/kolla/nova-api/nova.conf | /etc/nova/nova.conf |
| Neutron | /etc/kolla/neutron-server/neutron.conf | /etc/neutron/neutron.conf |
| Cinder | /etc/kolla/cinder-volume/cinder.conf | /etc/cinder/cinder.conf |
| Glance | /etc/kolla/glance-api/glance-api.conf | /etc/glance/glance-api.conf |
| Swift | /etc/kolla/swift-proxy-server/proxy-server.conf | /etc/swift/proxy-server.conf |
| Heat | /etc/kolla/heat-api/heat.conf | /etc/heat/heat.conf |
| Horizon | /etc/kolla/horizon/local_settings | /etc/openstack-dashboard/local_settings |

### Kolla-Ansible Global Config

| File | Purpose |
|------|---------|
| /etc/kolla/globals.yml | Main deployment configuration |
| /etc/kolla/passwords.yml | Service passwords (auto-generated) |
| /etc/kolla/all-in-one | Single-node inventory |
| /etc/kolla/multinode | Multi-node inventory |

## Health Check Commands

Quick one-liner per service to verify it is running.

```bash
# All services at once
openstack service list && openstack endpoint list

# Keystone
openstack token issue

# Nova
openstack compute service list
docker ps --filter name=nova --format "{{.Names}}: {{.Status}}"

# Neutron
openstack network agent list
docker ps --filter name=neutron --format "{{.Names}}: {{.Status}}"

# Cinder
openstack volume service list
docker ps --filter name=cinder --format "{{.Names}}: {{.Status}}"

# Glance
openstack image list --limit 1
docker ps --filter name=glance --format "{{.Names}}: {{.Status}}"

# Swift
swift stat
docker ps --filter name=swift --format "{{.Names}}: {{.Status}}"

# Heat
openstack orchestration service list
docker ps --filter name=heat --format "{{.Names}}: {{.Status}}"

# Horizon
curl -sI https://localhost/ | head -1
docker ps --filter name=horizon --format "{{.Names}}: {{.Status}}"

# Infrastructure
docker ps --filter name=mariadb --format "{{.Names}}: {{.Status}}"
docker ps --filter name=rabbitmq --format "{{.Names}}: {{.Status}}"
docker ps --filter name=memcached --format "{{.Names}}: {{.Status}}"
```

## Emergency Reference

| Situation | Immediate Command |
|-----------|-------------------|
| Source admin credentials | `source /etc/kolla/admin-openrc.sh` |
| Restart a service | `docker restart <container_name>` |
| View container logs | `docker logs --tail 100 <container_name>` |
| Run Kolla reconfigure | `kolla-ansible -i /etc/kolla/all-in-one reconfigure` |
| Check all containers | `docker ps -a --format "table {{.Names}}\t{{.Status}}"` |
| Database access | `docker exec -it mariadb mysql -u root -p$(grep ^database_password /etc/kolla/passwords.yml \| awk '{print $2}')` |
| RabbitMQ status | `docker exec rabbitmq rabbitmqctl cluster_status` |

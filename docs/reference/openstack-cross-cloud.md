# OpenStack to AWS/GCP/Azure Translation Tables

> **Tier 2/3 -- Cross-Cloud Translation** | Verified against vendor documentation as of February 2026

This reference maps OpenStack services, concepts, and CLI operations to their equivalents on AWS, Google Cloud, and Microsoft Azure. Use it to translate cloud knowledge across platforms or evaluate multi-cloud strategies.

## Core Service Equivalents

| Concept | OpenStack | AWS | GCP | Azure |
|---------|-----------|-----|-----|-------|
| Identity and Access | Keystone | IAM | Cloud IAM | Microsoft Entra ID (formerly Azure AD) |
| Compute | Nova | EC2 | Compute Engine | Virtual Machines |
| SDN / Networking | Neutron | VPC | VPC | Virtual Network (VNet) |
| Block Storage | Cinder | EBS | Persistent Disk | Managed Disks |
| Image Registry | Glance | AMI (EC2 Images) | Machine Images | VM Images (Compute Gallery) |
| Object Storage | Swift | S3 | Cloud Storage | Blob Storage |
| Orchestration / IaC | Heat (HOT templates) | CloudFormation | Deployment Manager | ARM / Bicep Templates |
| Dashboard | Horizon | AWS Management Console | Google Cloud Console | Azure Portal |
| Load Balancing | Octavia | ELB / ALB / NLB | Cloud Load Balancing | Azure Load Balancer |
| DNS | Designate | Route 53 | Cloud DNS | Azure DNS |
| Key Management | Barbican | KMS | Cloud KMS | Azure Key Vault |
| Telemetry / Monitoring | Ceilometer / Gnocchi | CloudWatch | Cloud Monitoring | Azure Monitor |
| Container Orchestration | Magnum / Zun | EKS / ECS | GKE | AKS |
| Shared Filesystem | Manila | EFS | Filestore | Azure Files |
| Database as a Service | Trove | RDS | Cloud SQL | Azure SQL Database |
| Message Queue | Zaqar | SQS / SNS | Pub/Sub | Azure Service Bus |

## Concept-Level Mapping

### Compute

**What it is:** Virtual machine instances running on hypervisors with configurable CPU, memory, and disk resources.

| Aspect | OpenStack (Nova) | AWS (EC2) | GCP (Compute Engine) | Azure (VMs) |
|--------|-----------------|-----------|---------------------|-------------|
| Instance types | Flavors (user-defined) | Instance types (fixed) | Machine types (predefined + custom) | VM sizes (fixed series) |
| Image format | QCOW2, RAW, VMDK | AMI (proprietary) | Raw disk images | VHD / VHDX |
| Placement control | Host aggregates, AZs | Placement groups, AZs | Zones, sole-tenant nodes | Availability sets, zones |
| Live migration | Native (shared storage) | Not user-accessible | Live migration (managed) | Live migration (managed) |
| Metadata service | 169.254.169.254 | 169.254.169.254 (IMDSv2) | 169.254.169.254 | 169.254.169.254 (IMDS) |
| Console access | noVNC, SPICE | Serial console, Session Manager | Serial console, SSH-in-browser | Serial console, Bastion |
| Overcommit | Configurable (CPU, RAM) | Not supported | Not supported | Not supported |

### Networking

**What it is:** Software-defined networking providing virtual networks, subnets, routers, and security controls.

| Aspect | OpenStack (Neutron) | AWS (VPC) | GCP (VPC) | Azure (VNet) |
|--------|-------------------|-----------|-----------|--------------|
| Network model | Project-scoped networks | VPC per region | Global VPC | VNet per region |
| SDN backend | OVS, OVN, Linux Bridge | Proprietary | Andromeda | Proprietary |
| Subnets | Per-network, per-AZ | Per-AZ within VPC | Regional (auto-mode or custom) | Per-VNet |
| External access | Floating IPs | Elastic IPs | External IPs (static/ephemeral) | Public IPs |
| Security | Security Groups (port-level) | Security Groups (instance) + NACLs | Firewall rules (VPC-level) | NSGs (subnet/NIC) |
| Router | Virtual router (namespace) | Internet Gateway + Route Tables | Cloud Router | Virtual Network Gateway |
| VPN | VPNaaS (Neutron extension) | Site-to-Site VPN, Client VPN | Cloud VPN | VPN Gateway |
| Peering | Not native (routing) | VPC Peering | VPC Peering | VNet Peering |

### Storage

**What it is:** Persistent block and object storage decoupled from compute instance lifecycle.

| Aspect | OpenStack (Cinder/Swift) | AWS (EBS/S3) | GCP (PD/GCS) | Azure (Disks/Blob) |
|--------|------------------------|-------------|--------------|-------------------|
| Block attach model | iSCSI/NFS to hypervisor | NVMe attach to instance | SCSI attach to instance | SCSI attach to instance |
| Block storage types | Volume types (LVM, Ceph, etc.) | gp3, io2, st1, sc1 | pd-standard, pd-ssd, pd-balanced | Premium SSD, Standard SSD, Standard HDD |
| Snapshots | Cinder snapshots | EBS snapshots (to S3) | Disk snapshots | Disk snapshots |
| Object storage model | Account/Container/Object | Bucket/Object | Bucket/Object | Storage Account/Container/Blob |
| Object versioning | Swift versioning | S3 versioning | Object versioning | Blob versioning |
| Object lifecycle | Swift expiration headers | S3 Lifecycle rules | Object Lifecycle Management | Blob Lifecycle Management |
| Multipart upload | Swift SLO/DLO | S3 multipart | Resumable upload, parallel composite | Block blob upload |

### Identity

**What it is:** Authentication, authorization, and service catalog management for the entire platform.

| Aspect | OpenStack (Keystone) | AWS (IAM) | GCP (Cloud IAM) | Azure (Entra ID) |
|--------|---------------------|-----------|-----------------|-----------------|
| Auth model | Token-based (Fernet) | Signature-based (SigV4) | OAuth 2.0 tokens | OAuth 2.0 / OIDC tokens |
| Multi-tenancy | Projects (within domains) | Accounts (within Organizations) | Projects (within Organizations) | Subscriptions (within Tenants) |
| Role model | RBAC with policy files | IAM policies (JSON) | IAM roles (predefined + custom) | Azure RBAC (built-in + custom) |
| Federation | Keystone federation (SAML, OIDC) | SAML 2.0, OIDC | Workload Identity Federation | External identities, B2B |
| Service accounts | Service users + app credentials | IAM roles for services | Service accounts | Managed identities |
| Token rotation | Fernet key rotation | Automatic (STS) | Automatic | Automatic (certificate/secret rotation) |
| Service catalog | Keystone service catalog | Service endpoints (fixed) | API enablement per project | Resource providers |

## CLI Equivalents

### Instance Lifecycle

| Operation | OpenStack | AWS | GCP | Azure |
|-----------|-----------|-----|-----|-------|
| List instances | `openstack server list` | `aws ec2 describe-instances` | `gcloud compute instances list` | `az vm list` |
| Create instance | `openstack server create` | `aws ec2 run-instances` | `gcloud compute instances create` | `az vm create` |
| Delete instance | `openstack server delete <id>` | `aws ec2 terminate-instances` | `gcloud compute instances delete` | `az vm delete` |
| Stop instance | `openstack server stop <id>` | `aws ec2 stop-instances` | `gcloud compute instances stop` | `az vm stop` |
| Start instance | `openstack server start <id>` | `aws ec2 start-instances` | `gcloud compute instances start` | `az vm start` |
| SSH to instance | `openstack server ssh <id>` | `aws ssm start-session` | `gcloud compute ssh` | `az ssh vm` |

### Networking

| Operation | OpenStack | AWS | GCP | Azure |
|-----------|-----------|-----|-----|-------|
| List networks | `openstack network list` | `aws ec2 describe-vpcs` | `gcloud compute networks list` | `az network vnet list` |
| Create network | `openstack network create` | `aws ec2 create-vpc` | `gcloud compute networks create` | `az network vnet create` |
| List subnets | `openstack subnet list` | `aws ec2 describe-subnets` | `gcloud compute networks subnets list` | `az network vnet subnet list` |
| Create security group | `openstack security group create` | `aws ec2 create-security-group` | `gcloud compute firewall-rules create` | `az network nsg create` |
| Allocate floating IP | `openstack floating ip create` | `aws ec2 allocate-address` | `gcloud compute addresses create` | `az network public-ip create` |

### Storage

| Operation | OpenStack | AWS | GCP | Azure |
|-----------|-----------|-----|-----|-------|
| List volumes | `openstack volume list` | `aws ec2 describe-volumes` | `gcloud compute disks list` | `az disk list` |
| Create volume | `openstack volume create` | `aws ec2 create-volume` | `gcloud compute disks create` | `az disk create` |
| Attach volume | `openstack server add volume` | `aws ec2 attach-volume` | `gcloud compute instances attach-disk` | `az vm disk attach` |
| Upload object | `swift upload <c> <file>` | `aws s3 cp <file> s3://<b>/` | `gcloud storage cp <file> gs://<b>/` | `az storage blob upload` |
| List objects | `openstack object list <c>` | `aws s3 ls s3://<bucket>/` | `gcloud storage ls gs://<bucket>/` | `az storage blob list` |

### Identity

| Operation | OpenStack | AWS | GCP | Azure |
|-----------|-----------|-----|-----|-------|
| Authenticate | `openstack token issue` | `aws sts get-caller-identity` | `gcloud auth print-access-token` | `az account get-access-token` |
| List users | `openstack user list` | `aws iam list-users` | `gcloud iam service-accounts list` | `az ad user list` |
| Create project | `openstack project create` | `aws organizations create-account` | `gcloud projects create` | `az account create` (subscription) |

## Architecture Pattern Translation

### Basic Web Application Stack

| Component | OpenStack | AWS | GCP | Azure |
|-----------|-----------|-----|-----|-------|
| Load balancer | Octavia LB | ALB | HTTP(S) LB | Application Gateway |
| Web servers | Nova instances (2+) | EC2 instances | Compute Engine VMs | Azure VMs |
| Application network | Neutron private network | VPC private subnet | VPC subnet | VNet subnet |
| Database | Trove / Nova + manual DB | RDS | Cloud SQL | Azure SQL |
| Object storage | Swift container | S3 bucket | GCS bucket | Blob container |
| DNS | Designate zone | Route 53 hosted zone | Cloud DNS zone | Azure DNS zone |
| SSL/TLS | Barbican + HAProxy | ACM + ALB | Google-managed cert | App Gateway + Key Vault |

### Network Isolation Pattern

| Layer | OpenStack | AWS | GCP | Azure |
|-------|-----------|-----|-----|-------|
| Environment isolation | Separate projects | Separate VPCs | Separate projects | Separate subscriptions |
| Subnet segmentation | Neutron subnets | VPC subnets (per AZ) | Regional subnets | VNet subnets |
| Security boundary | Security groups + FWaaS | Security groups + NACLs | Firewall rules + policies | NSGs + Azure Firewall |
| External access | Floating IPs + router | EIPs + IGW | External IPs + Cloud NAT | Public IPs + NAT Gateway |
| Cross-env connectivity | Neutron router | VPC Peering / Transit Gateway | VPC Peering / Shared VPC | VNet Peering / Virtual WAN |

## Key Differences Summary

| Topic | OpenStack Advantage | Public Cloud Advantage |
|-------|--------------------|-----------------------|
| Control | Full infrastructure ownership, no vendor lock-in | Zero hardware management, global scale |
| Customization | Custom flavors, pluggable backends, open source | Managed services, serverless options |
| Cost model | CapEx (hardware) + OpEx (staff) | Pure OpEx (pay-as-you-go) |
| Networking | Full SDN control (OVS/OVN) | Managed SDN, no OVS troubleshooting |
| Storage | Backend choice (LVM, Ceph, NFS) | Managed storage, automatic replication |
| Scaling | Manual capacity planning | Auto-scaling, elastic capacity |
| Compliance | Data sovereignty (on-premises) | Compliance certifications (shared responsibility) |

## Version Reference

| Platform | Version / Date | Documentation Source |
|----------|---------------|---------------------|
| OpenStack | 2024.2 (Dalmatian), Oct 2024 | docs.openstack.org |
| AWS | Current as of Feb 2026 | docs.aws.amazon.com |
| GCP | Current as of Feb 2026 | cloud.google.com/docs |
| Azure | Current as of Feb 2026 | learn.microsoft.com/azure |

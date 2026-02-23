RUNBOOK: RB-GLANCE-003 -- Image Metadata and Visibility Management
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`) for visibility changes; project credentials sufficient for metadata changes on owned images
2. The target image ID or name is known
3. The desired metadata properties and/or visibility settings are determined

## PROCEDURE

Step 1: Check current image metadata and visibility

```bash
openstack image show <image-id>
openstack image show <image-id> -c properties -c visibility -c owner
```

Expected: Image properties, visibility (`public`, `private`, `shared`, or `community`), and owner project are displayed.
If not: Image not found -- verify the image ID and that the current credentials have access to it.

Step 2: Set or update image properties

```bash
# Set OS-related metadata
openstack image set \
  --property os_type=linux \
  --property os_distro=ubuntu \
  --property os_version=22.04 \
  <image-id>

# Set hardware properties for optimal guest performance
openstack image set \
  --property hw_disk_bus=virtio \
  --property hw_vif_model=virtio \
  --property hw_scsi_model=virtio-scsi \
  <image-id>

# Set minimum requirements
openstack image set --min-disk 20 --min-ram 2048 <image-id>
```

Expected: Properties are set. `openstack image show <image-id> -c properties` confirms the changes.
If not: 403 Forbidden -- check property protections and RBAC policy. Some properties (e.g., `os_*` prefixed) may require admin role.

Step 3: Remove unwanted properties

```bash
openstack image unset --property <property-name> <image-id>
```

Expected: Property is removed from the image.
If not: Property may be protected. Check property protection configuration: `docker exec glance_api cat /etc/glance/property-protections.conf 2>/dev/null`.

Step 4: Change image visibility

```bash
# Make image public (admin only)
openstack image set --public <image-id>

# Make image private (owner only)
openstack image set --private <image-id>

# Make image shared (visible to specific projects)
openstack image set --shared <image-id>

# Make image community (visible to all, no ownership transfer)
openstack image set --community <image-id>
```

Expected: Visibility changes take effect immediately.
If not: Only admin can set `public` visibility. Image owner can change between `private`, `shared`, and `community`.

Step 5: Manage image sharing with specific projects

```bash
# Share image with a target project
openstack image add project <image-id> <target-project-id>

# List image members (who it is shared with)
openstack image member list <image-id>

# Target project must accept the shared image
# (Run as target project user)
openstack image set --accept <image-id>

# Remove sharing
openstack image remove project <image-id> <target-project-id>
```

Expected: Image appears in the target project's image list after acceptance. `openstack image member list` shows `status: accepted`.
If not: Target project user must explicitly accept. If `status: pending`, the image is shared but not yet accepted.

Step 6: Verify property inheritance for instances

```bash
# Boot an instance from the image
openstack server create --image <image-id> --flavor m1.small \
  --network <network> test-metadata

# Check that image properties are applied to the instance
openstack server show test-metadata -c image -c properties
```

Expected: Instance inherits hardware properties (hw_disk_bus, hw_vif_model) from the image, affecting device configuration.
If not: Properties may not be recognized by Nova. Verify property names match Nova's expected image metadata keys.

Step 7: Restore previous metadata values if needed

```bash
# Re-set a property to its previous value
openstack image set --property <key>=<previous-value> <image-id>

# Restore visibility
openstack image set --<previous-visibility> <image-id>
```

Expected: Image returns to its previous state.
If not: If the previous values are unknown, check Glance API logs for the modification history or restore from image backup.

## VERIFICATION

1. Image metadata is correct: `openstack image show <image-id> -c properties` shows expected properties.
2. Visibility is as intended: `openstack image show <image-id> -c visibility` matches the target.
3. Shared projects can access: from target project credentials, `openstack image list --shared` includes the image.

## ROLLBACK

1. Restore previous property values: `openstack image set --property <key>=<old-value> <image-id>`.
2. Restore previous visibility: `openstack image set --<old-visibility> <image-id>`.
3. Remove accidental sharing: `openstack image remove project <image-id> <project-id>`.

## RELATED RUNBOOKS

- RB-GLANCE-001: Image Upload Failure Troubleshooting -- when metadata-related issues prevent upload
- RB-GLANCE-002: Image Format Conversion -- when format metadata does not match actual content
- RB-GLANCE-004: Glance Backend Storage Recovery -- when backend issues affect image accessibility
- RB-KEYSTONE-003: RBAC Policy Debugging -- when permission issues block metadata changes

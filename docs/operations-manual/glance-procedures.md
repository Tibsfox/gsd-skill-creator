# Glance Image Service -- Operations Procedures

**Service:** OpenStack Glance (Image Catalog and Delivery)
**SE Phase:** Phase E (Operations & Sustainment)
**NPR Reference:** NPR 7123.1 SS 3.2 Process 9 (Product Transition)
**Document Standard:** NASA-STD-3001 (adapted for cloud operations)

This document contains all operational procedures for the OpenStack Glance image service. Glance provides the image catalog and delivery system for OpenStack, storing, discovering, and serving virtual machine images that Nova uses to boot instances. It handles image metadata, format validation, access control, and backend storage abstraction. Each procedure follows NASA procedure format with verification commands that can be validated against the running system.

---

## Table of Contents

- [OPS-GLANCE-001: Service Health Check (Daily)](#ops-glance-001-service-health-check-daily)
- [OPS-GLANCE-002: Image Upload](#ops-glance-002-image-upload)
- [OPS-GLANCE-003: Image Format Conversion](#ops-glance-003-image-format-conversion)
- [OPS-GLANCE-004: Image Sharing Between Projects](#ops-glance-004-image-sharing-between-projects)
- [OPS-GLANCE-005: Metadata Management](#ops-glance-005-metadata-management)
- [OPS-GLANCE-006: Storage Monitoring](#ops-glance-006-storage-monitoring)
- [OPS-GLANCE-007: Backup and Restore](#ops-glance-007-backup-and-restore)
- [OPS-GLANCE-008: Image Import (Web-Download and Glance-Direct)](#ops-glance-008-image-import-web-download-and-glance-direct)
- [OPS-GLANCE-009: Cache Management](#ops-glance-009-cache-management)
- [OPS-GLANCE-010: Troubleshooting Common Failures](#ops-glance-010-troubleshooting-common-failures)

---

## OPS-GLANCE-001: Service Health Check (Daily)

```
PROCEDURE ID: OPS-GLANCE-001
TITLE: Glance Image Service Daily Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that the Glance image service is running, responsive, and free of errors. Execute daily or after any infrastructure change to confirm image services remain operational. A failing Glance service prevents instance creation from images and snapshot operations.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Docker daemon running on the controller node
4. Network connectivity to the Glance API endpoint (port 9292)
5. Keystone authentication working (verify with OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration or data
- Image listing and metadata queries do not affect running instances
- No service disruption expected from any step in this procedure

### PROCEDURE

Step 1: Verify the Glance container is running.

```bash
docker ps --filter "name=glance" --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
```

Expected result:
```
NAMES               STATUS          RUNNING FOR
glance_api          Up X hours      X hours
```

If unexpected: If the container is not listed or shows a non-Up status, restart with `docker restart glance_api`. If the container fails to start, check logs with `docker logs glance_api 2>&1 | tail -100`.

Step 2: Source admin credentials.

```bash
source /etc/kolla/admin-openrc.sh
```

Expected result: No output. The shell environment now contains `OS_AUTH_URL`, `OS_USERNAME`, `OS_PASSWORD`, and related variables.

If unexpected: If the file does not exist, regenerate with `kolla-ansible -i inventory post-deploy`.

Step 3: Verify the Glance service is registered in the Keystone catalog.

```bash
openstack service list | grep image
openstack endpoint list --service glance -f table
```

Expected result: The image service is listed with three endpoints (public, internal, admin) in RegionOne, all pointing to port 9292.

```
+------+--------+-----------+-----------+---------+-----------+----------------------------+
| ID   | Region | Service   | Service   | Enabled | Interface | URL                        |
|      | Name   | Name      | Type      |         |           |                            |
+------+--------+-----------+-----------+---------+-----------+----------------------------+
| ...  | Regio  | glance    | image     | True    | public    | http://controller:9292     |
| ...  | Regio  | glance    | image     | True    | internal  | http://controller:9292     |
| ...  | Regio  | glance    | image     | True    | admin     | http://controller:9292     |
+------+--------+-----------+-----------+---------+-----------+----------------------------+
```

If unexpected: If fewer than three endpoints appear, use OPS-KEYSTONE-009 to add missing endpoints for the image service.

Step 4: List images to confirm the API responds.

```bash
openstack image list -f table
```

Expected result: A table listing all images in the catalog with their ID, name, and status. At minimum, a CirrOS test image should be present after a standard deployment.

If unexpected: If the command returns an error or times out, check `docker logs glance_api 2>&1 | tail -50` for connection errors. Verify Keystone authentication is working with `openstack token issue`.

Step 5: Verify a specific image is accessible by showing its details.

```bash
openstack image list -f value -c ID | head -1 | xargs openstack image show
```

Expected result: Full image details including id, name, status (active), disk_format, container_format, size, and visibility.

If unexpected: If the image shows status "error" or "killed", the image data may be corrupted. Check backend storage availability (Step 6).

Step 6: Verify backend storage is accessible.

```bash
docker exec glance_api ls -la /var/lib/glance/images/ | head -10
```

Expected result: The images directory exists and contains files corresponding to uploaded image IDs. File sizes should be non-zero for active images.

If unexpected: If the directory is empty but images are listed in the API, the backend storage mount may have failed. Check `docker inspect glance_api | grep -A5 Mounts` to verify volume bindings.

Step 7: Check Glance API logs for errors.

```bash
docker logs glance_api --since 24h 2>&1 | grep -iE "ERROR|CRITICAL" | tail -20
```

Expected result: No output or only benign entries. Zero ERROR or CRITICAL messages in the last 24 hours.

If unexpected: If errors appear, record the error messages and proceed to OPS-GLANCE-010 for troubleshooting.

Step 8: Verify database connectivity.

```bash
docker exec glance_api grep "^connection" /etc/glance/glance-api.conf | head -1
```

Expected result: A `connection = mysql+pymysql://glance:...@<db-host>/glance` string pointing to the correct database host.

If unexpected: If the database host is incorrect, update Kolla-Ansible configuration and reconfigure with `kolla-ansible -i inventory reconfigure --tags glance`.

### VERIFICATION

1. Confirm `glance_api` container shows status "Up"
2. Confirm `openstack image list` returns without error
3. Confirm `openstack endpoint list --service glance` returns 3 enabled endpoints
4. Confirm zero ERROR or CRITICAL log entries in the last 24 hours
5. Confirm backend storage directory is accessible and contains image files

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication prerequisite)
- OPS-GLANCE-010: Troubleshooting Common Failures
- https://docs.openstack.org/glance/2024.2/admin/
- https://docs.openstack.org/glance/2024.2/admin/healthcheck.html
- SP-6105 SS 5.4 (Operations Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-002: Image Upload

```
PROCEDURE ID: OPS-GLANCE-002
TITLE: Image Upload to Glance
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Upload a virtual machine image to the Glance image catalog. Execute when deploying a new operating system image, importing a vendor-supplied appliance, or adding a custom image for tenant use. Supports qcow2, raw, vmdk, vhd, and iso formats.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Image file available on the local filesystem or accessible via URL
4. Sufficient backend storage space for the image (verify with OPS-GLANCE-006)
5. Glance service healthy (verify with OPS-GLANCE-001)
6. Image format known (qcow2, raw, vmdk, vhd, or iso)

### SAFETY CONSIDERATIONS

- Image upload consumes backend storage proportional to the image file size
- Public images are visible to all projects and tenants -- verify visibility setting before upload
- Large image uploads (>10 GB) may take significant time and consume network bandwidth
- If backend storage is nearly full, the upload will fail and may leave a partial image in "saving" state

### PROCEDURE

Step 1: Verify the image file exists and check its format.

```bash
ls -lh /path/to/image-file.qcow2
qemu-img info /path/to/image-file.qcow2
```

Expected result: File exists with non-zero size. `qemu-img info` reports the file format, virtual size, and disk size.

```
image: /path/to/image-file.qcow2
file format: qcow2
virtual size: 10 GiB (10737418240 bytes)
disk size: 1.2 GiB
```

If unexpected: If `qemu-img info` reports a different format than expected, use the detected format in the upload command. If the file is corrupted, run `qemu-img check /path/to/image-file.qcow2` to diagnose.

Step 2: Check available backend storage space.

```bash
df -h /var/lib/docker/volumes/glance/_data/images/
```

Expected result: Available space is at least 2x the image file size (to account for temporary copies during upload).

If unexpected: If space is insufficient, free space by removing unused images (Step 6 in OPS-GLANCE-006) or expand the storage volume.

Step 3: Upload the image to Glance.

```bash
openstack image create --file /path/to/image-file.qcow2 \
  --disk-format qcow2 --container-format bare \
  --min-disk 10 --min-ram 1024 \
  --public \
  "image-name"
```

Expected result: Image creation succeeds. Output shows the image details with status transitioning from "queued" to "saving" to "active".

```
+------------------+------------------------------------------------------+
| Field            | Value                                                |
+------------------+------------------------------------------------------+
| container_format | bare                                                 |
| disk_format      | qcow2                                                |
| id               | a1b2c3d4-e5f6-...                                    |
| min_disk         | 10                                                   |
| min_ram          | 1024                                                 |
| name             | image-name                                           |
| status           | active                                               |
| visibility       | public                                               |
+------------------+------------------------------------------------------+
```

If unexpected: If the upload hangs, check Glance logs with `docker logs glance_api 2>&1 | tail -50`. If the image is stuck in "saving" state, refer to OPS-GLANCE-010 Failure Mode 4. If a permission error occurs, verify the Glance data directory ownership.

Step 4: Verify the uploaded image.

```bash
openstack image show "image-name" -c status -c size -c disk_format -c visibility
```

Expected result: Status is "active", size matches the original file, disk_format matches the specified format, and visibility is as intended.

If unexpected: If status is "error", check `docker logs glance_api 2>&1 | grep <image-id>` for the specific error. Delete the failed image with `openstack image delete <image-id>` and retry.

Step 5: Set additional metadata on the image.

```bash
openstack image set \
  --property os_type=linux \
  --property os_distro=ubuntu \
  --property os_version=22.04 \
  --property hw_disk_bus=virtio \
  --property hw_vif_model=virtio \
  "image-name"
```

Expected result: No output on success. Properties are attached to the image metadata.

If unexpected: If a property is rejected, check property protections in `/etc/glance/property-protections.conf`.

### VERIFICATION

1. Confirm `openstack image show "image-name"` returns status "active"
2. Confirm image size matches the original file: `openstack image show "image-name" -c size -f value`
3. Confirm image appears in `openstack image list`
4. Confirm backend file exists: `docker exec glance_api ls -la /var/lib/glance/images/<image-id>`
5. Test boot from image (optional): `openstack server create --image "image-name" --flavor m1.small test-boot`

### ROLLBACK

1. Delete the uploaded image: `openstack image delete "image-name"`
2. Verify removal: `openstack image show "image-name"` should return "No Image found"
3. Confirm backend storage was reclaimed: check disk usage with `df -h`

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-005: Metadata Management (property configuration)
- OPS-GLANCE-006: Storage Monitoring (capacity verification)
- OPS-GLANCE-010: Troubleshooting Common Failures
- https://docs.openstack.org/glance/2024.2/admin/manage-images.html
- https://docs.openstack.org/python-openstackclient/latest/cli/command-objects/image.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-003: Image Format Conversion

```
PROCEDURE ID: OPS-GLANCE-003
TITLE: Image Format Conversion
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Convert virtual machine images between formats (qcow2, raw, vmdk, vhd, iso) for compatibility or performance optimization. Execute when importing images from other hypervisors (VMware vmdk, Hyper-V vhd), optimizing I/O performance (qcow2 to raw), or preparing images for specific backend storage requirements.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. `qemu-img` tool installed on the system (`qemu-utils` package)
3. Source image file available on the local filesystem
4. Sufficient disk space for both the source and converted image (at minimum 2x source image virtual size)
5. Admin credentials sourced from `/etc/kolla/admin-openrc.sh` (if uploading after conversion)

### SAFETY CONSIDERATIONS

- Format conversion creates a new file and does not modify the source image
- Converting qcow2 to raw expands the image to its full virtual size (e.g., a 2 GB qcow2 may become 20 GB raw)
- Large conversions are I/O-intensive and may affect other services sharing the same disk
- Verify source image integrity before conversion to avoid propagating corruption

### PROCEDURE

Step 1: Check the source image format and integrity.

```bash
qemu-img info /path/to/source-image
qemu-img check /path/to/source-image
```

Expected result: `qemu-img info` shows the detected format, virtual size, and disk size. `qemu-img check` reports "No errors were found on the image."

If unexpected: If errors are found, the source image is corrupted. Obtain a fresh copy of the image before proceeding.

Step 2: Estimate the converted image size.

```bash
qemu-img info /path/to/source-image -f qcow2 --output=json | python3 -c "
import json, sys
info = json.load(sys.stdin)
vsize = info['virtual-size']
dsize = info.get('actual-size', vsize)
print(f'Virtual size: {vsize / (1024**3):.2f} GB')
print(f'Actual size:  {dsize / (1024**3):.2f} GB')
print(f'Raw conversion will produce: {vsize / (1024**3):.2f} GB')
"
```

Expected result: Output shows the virtual and actual sizes, with an estimate of the converted file size.

If unexpected: If the image cannot be parsed, verify the source format is correct.

Step 3: Convert the image to the target format.

**qcow2 to raw (for better I/O performance):**
```bash
qemu-img convert -f qcow2 -O raw /path/to/source.qcow2 /path/to/output.raw
```

**vmdk to qcow2 (import from VMware):**
```bash
qemu-img convert -f vmdk -O qcow2 /path/to/source.vmdk /path/to/output.qcow2
```

**vhd to qcow2 (import from Hyper-V):**
```bash
qemu-img convert -f vpc -O qcow2 /path/to/source.vhd /path/to/output.qcow2
```

**raw to qcow2 (for thin provisioning and snapshot support):**
```bash
qemu-img convert -f raw -O qcow2 /path/to/source.raw /path/to/output.qcow2
```

Expected result: Conversion completes without errors. The output file is created at the specified path.

If unexpected: If conversion fails with "unsupported format," verify the source format with `qemu-img info`. If the source format is ambiguous, try specifying it explicitly with `-f`. For vmdk images from ESXi, ensure the descriptor file and flat extent files are both present.

Step 4: Verify the converted image.

```bash
qemu-img info /path/to/output-image
qemu-img check /path/to/output-image 2>/dev/null || echo "Check not supported for this format"
```

Expected result: Output shows the correct target format, expected virtual size, and no errors.

If unexpected: If the converted image has a different virtual size than the source, investigate. Size differences indicate potential data loss during conversion.

Step 5: Upload the converted image to Glance.

```bash
openstack image create --file /path/to/output-image \
  --disk-format <target-format> --container-format bare \
  --public "converted-image-name"
```

Expected result: Image uploads successfully and shows status "active".

If unexpected: Refer to OPS-GLANCE-002 for upload troubleshooting.

Step 6: Clean up temporary files.

```bash
rm -f /path/to/output-image
```

Expected result: Temporary converted file removed. The image data is now stored in the Glance backend.

If unexpected: If the file cannot be removed, check permissions. Non-critical -- proceed with verification.

### VERIFICATION

1. Confirm converted image format: `qemu-img info /path/to/output-image` shows the target format (before cleanup)
2. Confirm uploaded image is active: `openstack image show "converted-image-name" -c status`
3. Confirm disk format is correct: `openstack image show "converted-image-name" -c disk_format`
4. Test instance boot from converted image (optional): `openstack server create --image "converted-image-name" --flavor m1.small test-convert`

### ROLLBACK

1. Delete the converted image from Glance: `openstack image delete "converted-image-name"`
2. Remove any temporary files: `rm -f /path/to/output-image`
3. The source image is not modified and remains available for retry

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-002: Image Upload (upload procedure)
- OPS-GLANCE-010: Troubleshooting Common Failures (format conversion errors)
- https://docs.openstack.org/glance/2024.2/admin/manage-images.html
- https://docs.openstack.org/image-guide/convert-images.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-004: Image Sharing Between Projects

```
PROCEDURE ID: OPS-GLANCE-004
TITLE: Image Sharing Between Projects
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Share a private image from one project with another project without making it fully public. Execute when a specific team needs access to a custom image owned by another project. Image sharing uses a two-step process: the owner shares the image, and the target project member accepts it.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack CLI installed
2. Admin credentials or image owner credentials sourced
3. The source image exists and has status "active"
4. The target project ID is known
5. The image visibility is "private" or "shared" (public images are already visible to all)

### SAFETY CONSIDERATIONS

- Sharing an image grants read-only access to the target project -- they can boot instances from it but cannot modify or delete it
- Shared images appear in the target project's image list only after they accept the share
- Removing a share while instances are running from the shared image does not affect running instances but prevents new boots
- Image sharing does not copy the image data -- all projects reference the same backend data

### PROCEDURE

Step 1: Identify the image to share and its current visibility.

```bash
openstack image show <image-name-or-id> -c id -c name -c visibility -c owner
```

Expected result: Image details showing visibility as "private" and the owner project ID.

If unexpected: If visibility is "public," sharing is unnecessary -- the image is already visible to all projects. If the image does not exist, verify the image name or ID.

Step 2: Set image visibility to "shared" (required before adding members).

```bash
openstack image set --shared <image-id>
```

Expected result: No output on success. The image visibility changes from "private" to "shared."

If unexpected: If the command fails with "403 Forbidden," the credentials used do not own the image. Switch to the image owner's project credentials.

Step 3: Add the target project as a member of the image.

```bash
openstack image add project <image-id> <target-project-id>
```

Expected result: Output confirms the member was added with status "pending."

```
+------------+--------------------------------------+----------+
| Field      | Value                                |          |
+------------+--------------------------------------+----------+
| image_id   | a1b2c3d4-...                         |          |
| member_id  | e5f6a7b8-...                         |          |
| status     | pending                              |          |
+------------+--------------------------------------+----------+
```

If unexpected: If the target project ID is invalid, verify it with `openstack project show <project-name> -c id`.

Step 4: Accept the shared image (execute as the target project member).

```bash
# Switch to target project credentials or use --os-project-id
export OS_PROJECT_ID=<target-project-id>
openstack image set --accept <image-id>
```

Expected result: No output on success. The image status for this member changes from "pending" to "accepted."

If unexpected: If the command fails, verify the user has the `member` role in the target project.

Step 5: Verify the shared image is visible in the target project.

```bash
openstack image list --shared
openstack image show <image-id> -c name -c visibility -c status
```

Expected result: The shared image appears in the list with visibility "shared" and status "active."

If unexpected: If the image does not appear, verify the acceptance was successful with `openstack image member list <image-id>`.

**To remove sharing:**

Step 6: Remove the target project from the image members.

```bash
# Switch back to image owner credentials
openstack image remove project <image-id> <target-project-id>
```

Expected result: No output on success. The target project can no longer see or boot from the image.

If unexpected: If removal fails, check that the correct image ID and project ID are used.

### VERIFICATION

1. Confirm image visibility is "shared": `openstack image show <image-id> -c visibility`
2. Confirm member is listed: `openstack image member list <image-id>`
3. Confirm member status is "accepted": member list shows status "accepted" for the target project
4. Confirm image is visible in target project: switch to target credentials and run `openstack image list --shared`

### ROLLBACK

1. Remove the member from the image: `openstack image remove project <image-id> <target-project-id>`
2. Optionally revert visibility to private: `openstack image set --private <image-id>`
3. Verify sharing is removed: `openstack image member list <image-id>` returns empty

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-005: Metadata Management (image property management)
- https://docs.openstack.org/glance/2024.2/admin/manage-images.html#sharing-images
- https://docs.openstack.org/api-ref/image/v2/index.html#image-sharing
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-005: Metadata Management

```
PROCEDURE ID: OPS-GLANCE-005
TITLE: Image Metadata Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Manage image metadata properties to control hardware requirements, operating system identification, and custom attributes. Execute when setting up new images, updating hardware compatibility flags, or enforcing organizational metadata standards. Correct metadata ensures Nova selects appropriate hypervisor settings and operators can filter images effectively.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack CLI installed
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Target image exists and has status "active"
4. Understanding of the metadata properties to set (hardware, OS, custom)

### SAFETY CONSIDERATIONS

- Modifying metadata does not affect running instances booted from the image
- Incorrect hardware metadata (e.g., wrong `hw_disk_bus`) can cause boot failures for new instances
- Property protections may prevent non-admin users from setting certain properties
- Removing required metadata may break automated workflows that filter on those properties

### PROCEDURE

Step 1: View current metadata for the image.

```bash
openstack image show <image-name-or-id> --fit-width
```

Expected result: Full image details including all properties. Custom properties appear in the `properties` field.

If unexpected: If the image is not found, verify the name or ID with `openstack image list`.

Step 2: Set operating system identification properties.

```bash
openstack image set \
  --property os_type=linux \
  --property os_distro=ubuntu \
  --property os_version=22.04 \
  <image-id>
```

Expected result: No output on success. Properties are stored in the image metadata.

If unexpected: If a property is rejected with "403 Forbidden," check property protections: `docker exec glance_api cat /etc/glance/property-protections.conf`.

Step 3: Set hardware compatibility properties.

```bash
openstack image set \
  --property hw_disk_bus=virtio \
  --property hw_vif_model=virtio \
  --property hw_scsi_model=virtio-scsi \
  --property hw_video_model=virtio \
  --property hw_qemu_guest_agent=yes \
  <image-id>
```

Expected result: No output on success. Nova will use these properties to configure the virtual hardware when booting instances.

If unexpected: Unsupported property values cause Nova to fall back to defaults. Verify property names against the OpenStack image metadata catalog.

Step 4: Set minimum hardware requirements.

```bash
openstack image set --min-disk 20 --min-ram 2048 <image-id>
```

Expected result: No output on success. Nova will reject boot requests from flavors that do not meet these minimums.

If unexpected: If the values are set too high, no flavor may satisfy the requirements. Verify with `openstack flavor list` to ensure at least one flavor meets the minimums.

Step 5: Set custom organizational properties.

```bash
openstack image set \
  --property x_org_department=engineering \
  --property x_org_approved=true \
  --property x_org_expiry_date=2027-01-01 \
  <image-id>
```

Expected result: No output on success. Custom properties prefixed with `x_` are available for organizational tracking.

If unexpected: If property protections block custom properties, update the protections configuration or use an admin account.

Step 6: Remove a metadata property.

```bash
openstack image unset --property x_org_expiry_date <image-id>
```

Expected result: No output on success. The property is removed from the image metadata.

If unexpected: If the property cannot be removed, check whether it is a protected property.

Step 7: Verify the metadata changes.

```bash
openstack image show <image-id> -c properties
```

Expected result: The properties field contains all set properties and does not contain removed properties.

If unexpected: If properties are missing, the set operation may have failed silently. Retry with `--debug` flag for detailed output.

### VERIFICATION

1. Confirm OS properties: `openstack image show <image-id> -c properties` includes `os_type`, `os_distro`, `os_version`
2. Confirm hardware properties: properties include `hw_disk_bus`, `hw_vif_model`
3. Confirm minimum requirements: `openstack image show <image-id> -c min_disk -c min_ram` shows expected values
4. Confirm custom properties: properties include organizational prefixed values
5. Test instance boot (optional): `openstack server create --image <image-id> --flavor m1.small test-metadata` to verify hardware settings

### ROLLBACK

1. Remove incorrect properties: `openstack image unset --property <property-name> <image-id>`
2. Reset minimum requirements to defaults: `openstack image set --min-disk 0 --min-ram 0 <image-id>`
3. Restore previous values by re-setting the correct properties

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-002: Image Upload (initial metadata setting)
- https://docs.openstack.org/glance/2024.2/admin/useful-image-properties.html
- https://docs.openstack.org/glance/2024.2/admin/property-protections.html
- https://docs.openstack.org/image-guide/image-metadata.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-006: Storage Monitoring

```
PROCEDURE ID: OPS-GLANCE-006
TITLE: Glance Storage Monitoring
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Monitor Glance backend storage usage, identify storage trends, and clean up unused images to prevent storage exhaustion. Execute weekly or when storage alerts indicate high utilization. Storage exhaustion prevents new image uploads and can cause image operations to fail.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to the Glance backend storage filesystem
4. Glance service healthy (verify with OPS-GLANCE-001)

### SAFETY CONSIDERATIONS

- Storage monitoring is read-only and does not affect running services
- Image deletion is permanent -- verify an image is not in use before deleting
- Deleting an image that is the source for running instances does not affect those instances, but prevents new boots
- Soft-deleted images continue to consume storage until purged from the database

### PROCEDURE

Step 1: Check overall storage utilization on the Glance backend.

```bash
df -h /var/lib/docker/volumes/glance/_data/images/
```

Expected result: Filesystem usage below 80%. Values above 80% require attention; above 90% is critical.

If unexpected: If usage exceeds 90%, proceed immediately to Step 5 to identify and remove unused images.

Step 2: Calculate total image storage usage via the API.

```bash
openstack image list --long -f json | python3 -c "
import json, sys
images = json.load(sys.stdin)
total = sum(i.get('Size', 0) or 0 for i in images)
active = [i for i in images if i.get('Status') == 'active']
error = [i for i in images if i.get('Status') == 'error']
print(f'Total images: {len(images)}')
print(f'Active images: {len(active)}')
print(f'Error images: {len(error)}')
print(f'Total storage: {total / (1024**3):.2f} GB')
"
```

Expected result: A summary showing image counts by status and total storage consumed.

If unexpected: If the API returns an error, verify Glance service health with OPS-GLANCE-001.

Step 3: Identify the largest images consuming storage.

```bash
openstack image list --long --sort size:desc -f table -c Name -c Size -c Status -c Visibility | head -20
```

Expected result: A sorted list of images by size, showing the largest consumers.

If unexpected: If the sort flag is not supported, list all images and pipe through `sort`: `openstack image list --long -f value | sort -t' ' -k3 -rn | head -20`.

Step 4: Identify images in error or killed state.

```bash
openstack image list --status error -f table
openstack image list --status killed -f table 2>/dev/null
```

Expected result: Ideally no images in error or killed state. These images consume database entries and potentially partial storage.

If unexpected: Error images should be deleted: `openstack image delete <image-id>`.

Step 5: Identify unused images (not associated with any running instance).

```bash
# Get all image IDs used by running instances
USED_IMAGES=$(openstack server list --all-projects -f value -c Image | sort -u)

# Compare with all images
openstack image list -f value -c ID -c Name | while read id name; do
  if ! echo "$USED_IMAGES" | grep -q "$name"; then
    size=$(openstack image show "$id" -f value -c size 2>/dev/null)
    echo "Unused: $name ($id) - $(echo "scale=2; ${size:-0} / 1073741824" | bc) GB"
  fi
done
```

Expected result: A list of images not currently used by any running instance.

If unexpected: If the comparison takes too long, reduce the scope to a specific project.

Step 6: Delete unused images (after confirming they are no longer needed).

```bash
openstack image delete <image-id>
```

Expected result: No output on success. The image is removed from the catalog and backend storage.

If unexpected: If deletion fails with "image is in use," there may be volumes or snapshots referencing the image. Check with `openstack volume list --all-projects | grep <image-id>`.

Step 7: Purge soft-deleted images from the database.

```bash
docker exec glance_api glance-manage db purge --age_in_days 30 --max_rows 100
```

Expected result: Output indicates the number of rows purged from the database.

If unexpected: If the command fails, check database connectivity and permissions.

Step 8: Verify storage reclamation.

```bash
df -h /var/lib/docker/volumes/glance/_data/images/
```

Expected result: Storage utilization has decreased after image cleanup.

If unexpected: If storage did not decrease, the deleted image data may not have been fully removed from the filesystem. Check for orphaned files: `ls /var/lib/docker/volumes/glance/_data/images/ | wc -l` versus `openstack image list -f value -c ID | wc -l`.

### VERIFICATION

1. Confirm storage utilization below 80%: `df -h` shows acceptable usage
2. Confirm no images in error state: `openstack image list --status error` returns empty
3. Confirm database purge completed: `docker exec glance_api glance-manage db purge --age_in_days 30 --max_rows 0` reports zero rows to purge
4. Run OPS-GLANCE-001 to confirm overall service health

### ROLLBACK

Image deletion is permanent and cannot be undone. To recover a deleted image:
1. Re-upload the image from its original source using OPS-GLANCE-002
2. Restore from backup if the image was backed up (OPS-GLANCE-007)

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-002: Image Upload (re-upload if needed)
- OPS-GLANCE-007: Backup and Restore (recovery path)
- https://docs.openstack.org/glance/2024.2/admin/db.html
- https://docs.openstack.org/glance/2024.2/admin/manage-images.html
- SP-6105 SS 5.4 (Operations -- Storage Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-007: Backup and Restore

```
PROCEDURE ID: OPS-GLANCE-007
TITLE: Glance Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Glance image service including its database, configuration files, and optionally the image data files. Execute before upgrades, major configuration changes, or as part of a scheduled backup rotation. The restore procedure recovers Glance to the backed-up state.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Sufficient disk space at the backup target for the database dump, configuration, and optionally all image files
4. MariaDB root password available (stored in `/etc/kolla/passwords.yml` as `database_password`)
5. Glance service running (verify with OPS-GLANCE-001)

### SAFETY CONSIDERATIONS

- The backup procedure is non-destructive and does not affect running services
- Image data backup can be extremely large (hundreds of GB) -- ensure backup storage is adequate
- The restore procedure stops and restarts Glance, causing a brief image service outage
- During the restore window, Nova cannot boot new instances from images (running instances are not affected)
- Restoring the database without restoring image data files results in dangling references
- Schedule restore operations during a maintenance window

### PROCEDURE

**Part A: Backup**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/opt/backups/glance/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}"
```

Expected result: Directory created at `/opt/backups/glance/YYYYMMDD-HHMMSS/`.

If unexpected: If the parent directory does not exist or permissions are denied, create `/opt/backups/` with `sudo mkdir -p /opt/backups && sudo chown $(whoami) /opt/backups`.

Step 2: Backup the Glance database.

```bash
docker exec mariadb mysqldump -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" glance > "${BACKUP_DIR}/glance-db.sql"
```

Expected result: A SQL dump file at `${BACKUP_DIR}/glance-db.sql` containing all Glance tables (images, image_members, image_properties, image_locations, etc.).

If unexpected: If the command returns "Access denied," verify the MariaDB root password in `/etc/kolla/passwords.yml`.

Step 3: Backup Glance configuration files.

```bash
docker cp glance_api:/etc/glance/ "${BACKUP_DIR}/glance-config/"
```

Expected result: The entire `/etc/glance/` directory copied to the backup location, including `glance-api.conf`, `policy.yaml`, and `property-protections.conf`.

If unexpected: If the container is not running, the copy will fail. Start the container with `docker start glance_api` first.

Step 4: Backup image data files (optional, large).

```bash
# Full image data backup (can be very large)
rsync -av /var/lib/docker/volumes/glance/_data/images/ "${BACKUP_DIR}/images/"
```

Expected result: All image data files copied to the backup directory. Progress output shows each file being copied.

If unexpected: If the backup storage is insufficient, consider backing up only critical images by ID:
```bash
for id in <critical-image-id-1> <critical-image-id-2>; do
  cp /var/lib/docker/volumes/glance/_data/images/${id} "${BACKUP_DIR}/images/"
done
```

Step 5: Record backup metadata.

```bash
echo "Backup timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${BACKUP_DIR}/backup-metadata.txt"
echo "Glance image count: $(openstack image list -f value | wc -l)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Database size: $(wc -c < "${BACKUP_DIR}/glance-db.sql") bytes" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Image data size: $(du -sh "${BACKUP_DIR}/images/" 2>/dev/null | cut -f1 || echo 'not backed up')" >> "${BACKUP_DIR}/backup-metadata.txt"
```

Expected result: A `backup-metadata.txt` file recording the timestamp, image count, database size, and image data size.

If unexpected: Non-critical. Proceed if metadata recording fails.

**Part B: Restore**

Step 6: Stop the Glance container.

```bash
docker stop glance_api
```

Expected result: Container reports as stopped.

If unexpected: If the container does not stop within 30 seconds, force stop with `docker kill glance_api`.

Step 7: Restore the Glance database.

```bash
docker exec -i mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" glance < "${BACKUP_DIR}/glance-db.sql"
```

Expected result: No output on success. The database is restored to the backed-up state.

If unexpected: If the restore fails with a table conflict, drop and recreate the database first:
```bash
docker exec mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "DROP DATABASE glance; CREATE DATABASE glance;"
```
Then retry the restore command.

Step 8: Restore image data files (if backed up).

```bash
rsync -av "${BACKUP_DIR}/images/" /var/lib/docker/volumes/glance/_data/images/
```

Expected result: Image data files restored to the Glance data directory.

If unexpected: If file permissions are incorrect after restore, fix with `chown -R 42415:42415 /var/lib/docker/volumes/glance/_data/images/`.

Step 9: Restore configuration files.

```bash
docker cp "${BACKUP_DIR}/glance-config/" glance_api:/etc/glance/
```

Expected result: Configuration files restored in the container.

If unexpected: If the container filesystem is ephemeral, these files will be overwritten on next `kolla-ansible reconfigure`. Run reconfigure after restore to ensure consistency.

Step 10: Start the Glance container.

```bash
docker start glance_api
```

Expected result: Container starts and reaches "Up" status.

If unexpected: Check container logs with `docker logs glance_api 2>&1 | tail -50` for startup errors.

### VERIFICATION

1. Run `openstack image list` and confirm the image list matches the backed-up state
2. Run `openstack image show <known-image-id>` and confirm metadata is intact
3. Verify backend files exist: `docker exec glance_api ls /var/lib/glance/images/ | wc -l` matches expected count
4. Check `docker logs glance_api 2>&1 | tail -20` for any startup errors
5. Run OPS-GLANCE-001 to perform a full health check

### ROLLBACK

If the restore fails and leaves Glance in an inconsistent state:
1. Run `kolla-ansible -i inventory deploy --tags glance` to redeploy from Kolla-Ansible state
2. Run `kolla-ansible -i inventory post-deploy` to regenerate credentials
3. Re-upload critical images using OPS-GLANCE-002
4. Verify with OPS-GLANCE-001

### REFERENCES

- OPS-GLANCE-001: Service Health Check
- OPS-GLANCE-002: Image Upload (re-upload path)
- OPS-KEYSTONE-003: Keystone Backup and Restore (auth dependency)
- https://docs.openstack.org/glance/2024.2/admin/db.html
- https://docs.openstack.org/kolla-ansible/latest/reference/databases/mariadb-backup-and-restore.html
- SP-6105 SS 5.5 (Product Transition -- Backup and Recovery)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-008: Image Import (Web-Download and Glance-Direct)

```
PROCEDURE ID: OPS-GLANCE-008
TITLE: Image Import via Web-Download and Glance-Direct Methods
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Import images into Glance using the task-based import workflow instead of direct upload. The web-download method instructs Glance to fetch an image from a URL, avoiding the need to download the image to a local machine first. The glance-direct method stages image data on the Glance server before importing. Execute when importing images from remote URLs, vendor download portals, or when using the interoperable image import workflow.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack CLI installed
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Image import methods enabled in Glance configuration (`enabled_import_methods` includes `web-download` and/or `glance-direct`)
4. For web-download: the URL must be reachable from the Glance API server (not the client)
5. Sufficient backend storage for the image
6. Glance service healthy (verify with OPS-GLANCE-001)

### SAFETY CONSIDERATIONS

- Web-download: Glance fetches the image directly -- ensure the URL is trusted and the image source is verified
- Large images imported via web-download consume bandwidth on the Glance server network
- Import tasks run asynchronously -- the image is not immediately available after the command returns
- Failed imports leave images in "importing" state that must be cleaned up manually

### PROCEDURE

Step 1: Verify enabled import methods.

```bash
openstack image import info
```

Expected result: Output lists the enabled import methods:
```
+------------------+--------------------------------------+
| Field            | Value                                |
+------------------+--------------------------------------+
| import-methods   | glance-direct, web-download          |
+------------------+--------------------------------------+
```

If unexpected: If import methods are not enabled, update Glance configuration:
```bash
# Add to /etc/kolla/config/glance/glance-api.conf (Kolla override)
# [DEFAULT]
# enabled_import_methods = [glance-direct, web-download, copy-image]
# Then reconfigure: kolla-ansible -i inventory reconfigure --tags glance
```

**Method A: Web-Download Import**

Step 2a: Create a placeholder image record.

```bash
openstack image create --container-format bare --disk-format qcow2 "web-imported-image"
```

Expected result: Image created with status "queued."

If unexpected: If creation fails, check Glance service health with OPS-GLANCE-001.

Step 3a: Import the image from a URL.

```bash
openstack image import --import-method web-download \
  --uri https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img \
  <image-id>
```

Expected result: Import task initiated. The image status transitions from "queued" to "importing" to "active."

If unexpected: If the import fails immediately, check that the URL is reachable from the Glance server: `docker exec glance_api curl -sI <url>`.

Step 4a: Monitor the import progress.

```bash
watch -n 5 "openstack image show <image-id> -c status -c size"
```

Expected result: Status changes from "importing" to "active" once the download and processing completes. Size populates with the final image size.

If unexpected: If the image remains in "importing" state for an extended period, check Glance logs: `docker logs glance_api 2>&1 | grep <image-id> | tail -20`. If the download failed, the image status changes to "error."

**Method B: Glance-Direct Import**

Step 2b: Create a placeholder image record.

```bash
openstack image create --container-format bare --disk-format qcow2 "direct-imported-image"
```

Expected result: Image created with status "queued."

If unexpected: If creation fails, check Glance service health.

Step 3b: Stage the image data.

```bash
glance image-stage --file /path/to/local-image.qcow2 <image-id>
```

Expected result: Image data uploaded to the staging area. No output on success.

If unexpected: If staging fails with a storage error, check the staging directory: `docker exec glance_api ls -la /var/lib/glance/tasks_work_dir/`.

Step 4b: Import the staged image.

```bash
openstack image import --import-method glance-direct <image-id>
```

Expected result: Import task initiated. The image transitions from "uploading" to "importing" to "active."

If unexpected: Check logs for processing errors: `docker logs glance_api 2>&1 | grep <image-id>`.

Step 5: Verify the imported image.

```bash
openstack image show <image-id> -c status -c size -c disk_format
```

Expected result: Status is "active," size is non-zero, and disk_format matches the specified format.

If unexpected: If status is "error," check the import error message: `openstack image show <image-id> -c os_glance_failed_import`.

Step 6: Clean up failed imports (if any).

```bash
openstack image list --status error -f value -c ID | while read id; do
  echo "Cleaning up failed import: $id"
  openstack image delete "$id"
done
```

Expected result: All error-state images from failed imports are removed.

If unexpected: If deletion fails, the image may have a lock. Force delete from the database using `glance-manage`.

### VERIFICATION

1. Confirm imported image is active: `openstack image show <image-id> -c status` returns "active"
2. Confirm image size is correct: `openstack image show <image-id> -c size` shows expected file size
3. Confirm backend data exists: `docker exec glance_api ls -la /var/lib/glance/images/<image-id>`
4. Test instance boot (optional): `openstack server create --image <image-id> --flavor m1.small test-import`

### ROLLBACK

1. Delete the imported image: `openstack image delete <image-id>`
2. Clean up staging directory if using glance-direct: `docker exec glance_api rm -f /var/lib/glance/tasks_work_dir/<image-id>`
3. Verify removal: `openstack image show <image-id>` returns "No Image found"

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-002: Image Upload (alternative upload method)
- OPS-GLANCE-010: Troubleshooting Common Failures
- https://docs.openstack.org/glance/2024.2/admin/interoperable-image-import.html
- https://docs.openstack.org/glance/2024.2/user/interoperable-image-import.html
- https://docs.openstack.org/api-ref/image/v2/index.html#interoperable-image-import
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-009: Cache Management

```
PROCEDURE ID: OPS-GLANCE-009
TITLE: Glance Image Cache Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Manage the Glance image cache to optimize image delivery performance. The cache stores frequently requested images locally on the API node, reducing backend storage latency for repeated requests. Execute when cache disk usage is high, when troubleshooting slow image delivery, or as part of regular cache maintenance.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Image caching enabled in Glance configuration
4. Glance service running (verify with OPS-GLANCE-001)

### SAFETY CONSIDERATIONS

- Cache operations do not affect the authoritative image data in backend storage
- Clearing the cache may temporarily increase latency for subsequent image requests as images are re-fetched from the backend
- Cache directory disk usage is separate from image backend storage -- monitor both
- Do not manually delete files from the cache directory; use Glance cache management tools

### PROCEDURE

Step 1: Verify cache configuration.

```bash
docker exec glance_api grep -E "^image_cache_max_size|^image_cache_dir|^image_cache_stall_time" /etc/glance/glance-api.conf
```

Expected result: Cache settings are configured:
```
image_cache_max_size = 10737418240
image_cache_dir = /var/lib/glance/image-cache
image_cache_stall_time = 86400
```

If unexpected: If cache is not configured, add the settings via Kolla-Ansible config override at `/etc/kolla/config/glance/glance-api.conf` and reconfigure with `kolla-ansible -i inventory reconfigure --tags glance`.

Step 2: Check current cache utilization.

```bash
docker exec glance_api du -sh /var/lib/glance/image-cache/ 2>/dev/null || echo "Cache directory not found"
docker exec glance_api ls /var/lib/glance/image-cache/ 2>/dev/null | wc -l
```

Expected result: Cache directory size and the number of cached image files.

If unexpected: If the cache directory does not exist, caching may not be enabled or no images have been cached yet.

Step 3: List cached images.

```bash
docker exec glance_api glance-cache-manage list-cached 2>/dev/null || echo "Cache manager not available"
```

Expected result: A list of cached image IDs with their sizes and last-accessed timestamps.

If unexpected: If `glance-cache-manage` is not available, inspect the cache directory directly: `docker exec glance_api ls -la /var/lib/glance/image-cache/`.

Step 4: List images queued for caching.

```bash
docker exec glance_api glance-cache-manage list-queued 2>/dev/null || echo "No images queued"
```

Expected result: A list of image IDs queued for pre-caching, or empty if no images are queued.

If unexpected: If the queue is unexpectedly large, the cache prefetcher may be running slowly. Check disk I/O.

Step 5: Pre-cache a frequently used image.

```bash
docker exec glance_api glance-cache-manage queue-image <image-id>
```

Expected result: Image added to the cache queue. The cache prefetcher will download it from the backend.

If unexpected: If the command fails, verify the image ID exists: `openstack image show <image-id>`.

Step 6: Delete a specific cached image.

```bash
docker exec glance_api glance-cache-manage delete-cached-image <image-id>
```

Expected result: The specified image is removed from the cache. Backend data is unaffected.

If unexpected: If the image is not in the cache, the command reports an error. Verify with Step 3.

Step 7: Clear the entire cache (use during maintenance or when cache is corrupted).

```bash
docker exec glance_api glance-cache-manage delete-all-cached-images
```

Expected result: All cached images removed. The cache directory is empty.

If unexpected: If the command fails, manually clear the cache directory (last resort):
```bash
docker exec glance_api rm -rf /var/lib/glance/image-cache/*
```

Step 8: Verify cache state after operations.

```bash
docker exec glance_api du -sh /var/lib/glance/image-cache/
docker exec glance_api glance-cache-manage list-cached 2>/dev/null
```

Expected result: Cache size reflects the operations performed (reduced after deletions, increased after pre-caching).

If unexpected: If cache size has not changed, the operations may not have taken effect. Check Glance logs for errors.

### VERIFICATION

1. Confirm cache configuration is correct: cache settings present in glance-api.conf
2. Confirm cache utilization is within limits: cache size below `image_cache_max_size`
3. Confirm specific image is cached (after pre-caching): `glance-cache-manage list-cached` includes the image
4. Confirm cache cleared (after purge): `glance-cache-manage list-cached` returns empty list
5. Run OPS-GLANCE-001 to confirm overall service health

### ROLLBACK

Cache operations do not require rollback. If a needed image was removed from the cache, it will be re-cached automatically on the next request. To force pre-caching, use Step 5.

### REFERENCES

- OPS-GLANCE-001: Service Health Check (prerequisite)
- OPS-GLANCE-006: Storage Monitoring (storage capacity context)
- https://docs.openstack.org/glance/2024.2/admin/cache.html
- https://docs.openstack.org/glance/2024.2/cli/glancecachemanage.html
- SP-6105 SS 5.4 (Operations -- Performance Optimization)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-GLANCE-010: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-GLANCE-010
TITLE: Troubleshooting Common Glance Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Glance failure modes. Execute when image uploads fail, images are stuck in transitional states, backend storage is inaccessible, image downloads are slow, or metadata operations return errors.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to Docker for container log inspection
4. MariaDB credentials available for direct database queries
5. Basic health check completed to identify the failure mode (OPS-GLANCE-001)

### SAFETY CONSIDERATIONS

- Troubleshooting commands are primarily read-only unless explicitly noted
- Resetting image state (Step 8) modifies the database and should be used with caution
- Restarting the Glance container causes a brief API outage (typically 5-10 seconds)
- Enabling debug logging increases disk usage and may expose sensitive data in logs

### PROCEDURE

**Failure Mode 1: Image Upload Fails**

Step 1: Check Glance API logs for upload errors.

```bash
docker logs glance_api 2>&1 | tail -50
docker logs glance_api 2>&1 | grep -iE "ERROR|CRITICAL" | tail -20
```

Expected result: Log entries reveal the specific error (disk full, permission denied, size limit, database error).

If unexpected: If no errors are found in recent logs, the issue may be client-side. Check the client error message.

Step 2: Check backend storage space.

```bash
df -h /var/lib/docker/volumes/glance/_data/images/
```

Expected result: Filesystem usage below 90%.

If unexpected: If storage is full, free space by removing unused images (OPS-GLANCE-006) or expand the storage volume.

Step 3: Check backend storage permissions.

```bash
ls -la /var/lib/docker/volumes/glance/_data/images/
docker exec glance_api ls -la /var/lib/glance/images/
```

Expected result: The images directory is owned by the glance user (UID 42415) and is writable.

If unexpected: Fix permissions:
```bash
chown -R 42415:42415 /var/lib/docker/volumes/glance/_data/images/
chmod 755 /var/lib/docker/volumes/glance/_data/images/
```

Step 4: Check image size limit.

```bash
docker exec glance_api grep image_size_cap /etc/glance/glance-api.conf
```

Expected result: `image_size_cap` is set to 0 (unlimited) or a value larger than the image being uploaded.

If unexpected: If the image exceeds the size cap, either increase the limit or reduce the image size. Update via Kolla-Ansible configuration override and reconfigure.

**Failure Mode 2: Image Stuck in "Saving" State**

Step 5: Check if the backend write is still in progress.

```bash
IMAGE_ID="<stuck-image-id>"
docker exec glance_api ls -la /var/lib/glance/images/${IMAGE_ID} 2>/dev/null
# Check file size changes over time
sleep 10
docker exec glance_api ls -la /var/lib/glance/images/${IMAGE_ID} 2>/dev/null
```

Expected result: If the file size is increasing between the two checks, the upload is still in progress. Wait for it to complete.

If unexpected: If the file size is unchanged, the upload process has stalled.

Step 6: Check for active upload connections.

```bash
docker logs glance_api 2>&1 | grep "${IMAGE_ID}" | tail -20
```

Expected result: Log entries show upload progress or completion messages.

If unexpected: If the last log entry shows an error or timeout, the upload has failed.

**Failure Mode 3: Image Download Slow or Times Out**

Step 7: Check image size and backend connectivity.

```bash
openstack image show <image-id> -c size -c disk_format
docker exec glance_api ls -la /var/lib/glance/images/<image-id>
```

Expected result: Image exists in backend storage with the correct size.

If unexpected: If the backend file is missing but the database record exists, the image data has been lost. Re-upload the image.

**Failure Mode 4: Resetting Stuck Images**

Step 8: Reset an image stuck in a transitional state.

```bash
# Set image status to error (allows deletion)
openstack image set --status error <image-id>
# Or set to active if the data upload actually completed
openstack image set --status active <image-id>
```

Expected result: Image status updated. The image can now be deleted or used normally.

If unexpected: If the status change is rejected, the image may be locked by an active process. Restart Glance to release locks:
```bash
docker restart glance_api
sleep 10
openstack image set --status error <image-id>
```

Step 9: Delete corrupted or stuck images.

```bash
openstack image delete <image-id>
```

Expected result: Image deleted. No output on success.

If unexpected: If deletion fails, the database record may be in an inconsistent state. Delete directly from the database:
```bash
docker exec mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "DELETE FROM glance.images WHERE id='<image-id>';"
# Also clean up the backend file
docker exec glance_api rm -f /var/lib/glance/images/<image-id>
```

**Failure Mode 5: Database Connection Errors**

Step 10: Check Glance logs for database errors.

```bash
docker logs glance_api 2>&1 | grep -iE "database|mysql|maria|operational" | tail -10
```

Expected result: No database error messages.

If unexpected: Test MariaDB connectivity directly:
```bash
docker exec mariadb mysql -u glance -p"$(grep ^glance_database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "USE glance; SELECT COUNT(*) FROM images;"
```

Step 11: Verify MariaDB is running and accepting connections.

```bash
docker ps --filter "name=mariadb" --format "{{.Names}}: {{.Status}}"
docker exec mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "SELECT 1;"
```

Expected result: MariaDB container is "Up" and the SELECT query returns `1`.

If unexpected: Restart MariaDB with `docker restart mariadb`. If it fails to start, check disk space with `df -h` and MariaDB logs with `docker logs mariadb 2>&1 | tail -50`.

**Failure Mode 6: Metadata Service Issues**

Step 12: Check property protections configuration.

```bash
docker exec glance_api cat /etc/glance/property-protections.conf 2>/dev/null || echo "No custom property protections"
```

Expected result: Property protections file exists with expected rules, or confirmation that defaults are in use.

If unexpected: If a property update is being rejected, verify the user's role has the required permissions in the protections configuration.

Step 13: Check RBAC policy.

```bash
docker exec glance_api cat /etc/glance/policy.yaml 2>/dev/null || echo "Using default policies"
```

Expected result: Policy file exists with expected rules, or confirmation that defaults are in use.

If unexpected: If policy rules are blocking legitimate operations, update the policy and restart Glance.

### VERIFICATION

1. Confirm `openstack image list` responds without error after resolving any failure mode
2. Confirm `openstack image show <image-id>` returns expected status for affected images
3. Confirm no ERROR entries in `docker logs glance_api --since 10m 2>&1`
4. Run OPS-GLANCE-001 for a complete health check

### ROLLBACK

Troubleshooting procedures do not have a single rollback path. Each failure mode has its own recovery steps documented inline. If troubleshooting causes additional issues:
1. Restore from backup using OPS-GLANCE-007 Part B
2. Redeploy with `kolla-ansible -i inventory deploy --tags glance`
3. Regenerate credentials with `kolla-ansible -i inventory post-deploy`

### REFERENCES

- OPS-GLANCE-001: Service Health Check
- OPS-GLANCE-002: Image Upload
- OPS-GLANCE-006: Storage Monitoring
- OPS-GLANCE-007: Backup and Restore
- https://docs.openstack.org/glance/2024.2/admin/troubleshooting.html
- https://docs.openstack.org/glance/2024.2/admin/db.html
- https://docs.openstack.org/glance/2024.2/admin/manage-images.html
- SP-6105 SS 5.4 (Operations -- Anomaly Resolution)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

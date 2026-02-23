RUNBOOK: RB-GLANCE-002 -- Image Format Conversion
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. `qemu-img` utility is installed on the workstation (`qemu-utils` package)
3. Sufficient disk space for both the source image and the converted output (2x image size)
4. The source image file is accessible locally

## PROCEDURE

Step 1: Identify the source image format

```bash
qemu-img info <source-image-file>
```

Expected: Output shows `file format:` as one of `qcow2`, `raw`, `vmdk`, `vhd`, `vhdx`, or `iso`. No errors or warnings.
If not: Unrecognized format or corrupted file. Re-download the source image and verify its checksum.

Step 2: Check source image integrity

```bash
qemu-img check <source-image-file>
```

Expected: `No errors were found on the image.` (For qcow2 files. Raw files cannot be checked.)
If not: Errors found -- the source image may be corrupted. Attempt repair: `qemu-img check -r all <source-image-file>`. If repair fails, re-download the source.

Step 3: Convert to the target format

```bash
# Convert qcow2 to raw (best I/O performance)
qemu-img convert -f qcow2 -O raw <source>.qcow2 <output>.raw

# Convert raw to qcow2 (smaller file size, thin provisioning)
qemu-img convert -f raw -O qcow2 <source>.raw <output>.qcow2

# Convert vmdk to qcow2 (import from VMware)
qemu-img convert -f vmdk -O qcow2 <source>.vmdk <output>.qcow2

# Convert vhd to qcow2 (import from Hyper-V)
qemu-img convert -f vpc -O qcow2 <source>.vhd <output>.qcow2
```

Expected: Conversion completes without errors. Output file is created at the expected size.
If not: Insufficient disk space -- free space and retry. Unsupported source format -- try converting through an intermediate format (e.g., vmdk -> raw -> qcow2).

Step 4: Verify the converted image

```bash
qemu-img info <output-image-file>
qemu-img check <output-image-file> 2>/dev/null
```

Expected: Format matches the target. Virtual size matches the source. No errors found.
If not: Conversion may have failed silently. Compare virtual sizes: source and output should match. If they differ, retry the conversion.

Step 5: Upload the converted image to Glance

```bash
openstack image create --file <output-image-file> \
  --disk-format <target-format> --container-format bare \
  --min-disk <minimum-disk-gb> --min-ram <minimum-ram-mb> \
  <image-name>

openstack image show <image-name> -c status -c size -c disk_format
```

Expected: Image status transitions to `active`. `disk_format` matches the target format. `size` matches the output file size.
If not: Upload failed -- see RB-GLANCE-001 (Image Upload Failure Troubleshooting).

Step 6: Set image properties for optimal performance

```bash
openstack image set \
  --property hw_disk_bus=virtio \
  --property hw_vif_model=virtio \
  --property os_type=linux \
  <image-name>
```

Expected: Properties are set successfully. These properties ensure optimal I/O performance when Nova boots instances from this image.
If not: Check RBAC policy: `docker exec glance_api cat /etc/glance/policy.yaml`.

Step 7: Verify the image boots correctly

```bash
openstack server create --image <image-name> --flavor m1.small \
  --network <network-name> test-boot-from-converted

# Wait for instance to become active
openstack server show test-boot-from-converted -c status

# Check console log for boot success
openstack console log show test-boot-from-converted | tail -20
```

Expected: Instance boots to `ACTIVE` status and shows login prompt in console log.
If not: Image may have conversion issues -- check that the correct disk bus and boot parameters are set. Try re-converting with different options.

## VERIFICATION

1. Converted image is `active` in Glance: `openstack image show <name> -c status`.
2. Format matches target: `openstack image show <name> -c disk_format`.
3. Instance boots from the image: test instance reaches `ACTIVE` state with accessible console.

## ROLLBACK

1. Retain the original source image -- do not delete it until the converted image is verified.
2. If the converted image is bad, delete it: `openstack image delete <image-name>`.
3. Re-upload the original format image if conversion is not needed: `openstack image create --file <original> --disk-format <original-format> --container-format bare <name>`.

## RELATED RUNBOOKS

- RB-GLANCE-001: Image Upload Failure Troubleshooting -- when upload of converted image fails
- RB-GLANCE-003: Image Metadata and Visibility Management -- when setting metadata after conversion
- RB-GLANCE-004: Glance Backend Storage Recovery -- when storage issues affect image availability

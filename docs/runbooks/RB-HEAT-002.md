RUNBOOK: RB-HEAT-002 -- Template Validation and Debugging
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`)
2. User credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Heat API service is running (`docker ps --filter name=heat_api`)
4. The HOT template file is available locally for validation

## PROCEDURE

Step 1: Validate template syntax
```bash
openstack orchestration template validate -t <template.yaml>
```
Expected: Output shows `Description:` and `Parameters:` sections, confirming valid template structure
If not: Error message indicates the syntax issue. Common errors below.

Step 2: Diagnose common syntax errors

**YAML indentation errors:**
```bash
# Validate YAML syntax independently of Heat
python3 -c "import yaml; yaml.safe_load(open('<template.yaml>'))"
```
Expected: No Python exception -- YAML parses successfully
If not: Python reports the line number and type of YAML error (tabs, bad indentation, missing quotes)

**Invalid heat_template_version:**
```bash
# Check the version string in the template
head -1 <template.yaml>
# Valid values: wallaby, xena, yoga, zed, 2023.1, 2023.2, 2024.1
# Or date format: 2021-04-16
```
Expected: Version matches a supported OpenStack release name or date
If not: Update to a supported version. Use the release name matching the deployed OpenStack version.

Step 3: Check for unsupported resource types
```bash
# List all available resource types
openstack orchestration resource type list

# Check if a specific resource type is available
openstack orchestration resource type list | grep <resource-type>
```
Expected: All resource types referenced in the template appear in the list
If not: The service providing the resource type may not be enabled. Check `openstack service list`. Enable the service in globals.yml and deploy.

Step 4: Validate resource type properties
```bash
# Show the schema for a resource type (required/optional properties)
openstack orchestration resource type show <resource-type>
```
Expected: Schema lists required and optional properties with types and constraints
If not: If the resource type is not found, the corresponding service is not registered

Step 5: Validate parameter constraints
```bash
# Review parameter definitions in the template
# Each parameter should have: type, description, and optional constraints
# Constraints include: length, range, allowed_values, allowed_pattern

# Test with specific parameter values
openstack orchestration template validate -t <template.yaml> \
  --parameter "image_id=cirros" \
  --parameter "flavor=m1.tiny"
```
Expected: Validation passes with the provided parameter values
If not: Error indicates which parameter constraint is violated

Step 6: Validate environment file compatibility
```bash
openstack orchestration template validate -t <template.yaml> -e <env.yaml>
```
Expected: Validation passes with environment parameters applied
If not: Check that environment parameter names match template parameter names exactly

Step 7: Check for intrinsic function errors
```bash
# Common intrinsic function errors:
# - get_resource referencing non-existent resource name
# - get_attr using invalid attribute for the resource type
# - get_param referencing undefined parameter
# - str_replace with mismatched template variables and params

# Review the template for resource name consistency
grep -n "get_resource\|get_attr\|get_param" <template.yaml>
```
Expected: All references resolve to defined resources, attributes, and parameters
If not: Fix references to match defined names (case-sensitive)

Step 8: Dry-run template creation (validate runtime constraints)
```bash
openstack stack create --dry-run -t <template.yaml> -e <env.yaml> <test-stack-name>
```
Expected: Dry-run shows the resources that would be created without actually creating them
If not: Runtime errors indicate issues that syntax validation cannot catch (missing images, flavors, networks)

## VERIFICATION

1. `openstack orchestration template validate -t <template.yaml>` succeeds without errors
2. All resource types in the template are available: `openstack orchestration resource type list` includes each type
3. Parameter constraints are met by the intended deployment values
4. N/A -- this is a pre-deployment validation procedure; no system changes to verify

## ROLLBACK

N/A -- Template validation is a pre-deployment procedure. No system state is modified during validation. If validation reveals issues, fix the template and re-validate.

## RELATED RUNBOOKS

- RB-HEAT-001: Stack Creation Failure Diagnosis -- when a validated template still fails at runtime
- RB-HEAT-003: Resource Dependency Resolution -- when validation passes but dependencies cause runtime failures
- RB-HEAT-004: Stack Update and Rollback Procedure -- for validating update templates

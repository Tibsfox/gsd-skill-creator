# Infrastructure Review Team

Multi-dimensional infrastructure audit with specialized reviewers that analyze cloud infrastructure from four distinct angles: IaC best practices, configuration drift, cost optimization, and regulatory compliance. A coordinator synthesizes all findings into a prioritized infrastructure health report.

## When to Use This Team

- Infrastructure audit before a compliance review or external audit
- Cloud migration review to validate IaC quality and resource configuration
- Cost optimization sprint to identify waste and rightsizing opportunities
- Pre-production readiness check for infrastructure standards compliance

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| infra-coordinator | Leader | Synthesizes findings, coordinates audit scope, prioritizes remediation | Read, Glob, Grep, Bash | sonnet |
| infrastructure-auditor | Worker | IaC best practices, security misconfigurations, resource naming | Read, Glob, Grep, Bash | sonnet |
| drift-detector | Worker | Configuration drift, environment parity, state consistency | Read, Glob, Grep, Bash | sonnet |
| cost-optimizer | Worker | Cloud waste, rightsizing, reserved instances, orphaned resources | Read, Glob, Grep, Bash | sonnet |
| compliance-auditor | Worker | Regulatory frameworks, CIS benchmarks, control gap analysis | Read, Glob, Grep | sonnet |

## Safety Properties

This team is designed for analysis with controlled execution:

- **Analysis-focused.** Bash is used for running `terraform plan`, `terraform validate`, and read-only cloud CLI queries, never `terraform apply` or destructive operations.
- **No infrastructure changes.** No member creates, modifies, or destroys cloud resources. The team produces findings as output text only.
- **Parallel-safe.** All four workers can analyze the same infrastructure codebase simultaneously without conflict.
- **Deterministic scope.** Workers audit only what the coordinator assigns; they cannot expand scope autonomously.

## How It Works

1. The **infra-coordinator** receives the audit request (IaC directory, environment scope, or compliance framework target).
2. The coordinator delegates specific modules, environments, or compliance domains to each worker.
3. Workers analyze their assigned scope and report findings with severity ratings and remediation guidance.
4. The coordinator collects all findings, cross-references overlapping concerns (e.g., a drift issue that is also a compliance gap), and produces a unified health report.
5. The final output is a prioritized remediation plan grouped by severity and business impact.

## Example Usage Scenario

**Input:** "Review our AWS infrastructure before the compliance audit"

**Flow:**
- infrastructure-auditor reviews Terraform modules for best practices, security group rules, IAM policies, and naming conventions
- drift-detector checks Terraform state consistency, compares environments for parity, identifies manual changes
- cost-optimizer identifies unused Elastic IPs, oversized RDS instances, unattached EBS volumes, and missing reserved capacity
- compliance-auditor maps infrastructure configurations to SOC2 controls, flags missing encryption-at-rest, insufficient logging
- infra-coordinator produces a single report: 4 critical (compliance gaps), 6 moderate (drift + cost), 8 minor (naming + best practices)

## Integration Notes

- This team pairs well with a pre-audit pipeline that generates `terraform plan` output for drift-detector to analyze
- Bash access enables running `terraform validate` and `terraform plan` for accurate analysis, but is scoped to read-only operations
- compliance-auditor intentionally lacks Bash to ensure purely analytical compliance mapping without accidental command execution
- For teams that need the audit findings to also apply fixes, consider pairing this team's output with a separate infrastructure remediation agent

# Security Audit Team

Comprehensive security audit with specialized scanners that analyze codebases from four distinct angles: OWASP vulnerability detection, vulnerability triage, compliance control mapping, and dependency health. A security coordinator correlates all findings into a prioritized security report with actionable remediation guidance.

## When to Use This Team

- Pre-audit security review before SOC2, HIPAA, or PCI-DSS certification
- Comprehensive vulnerability assessment of an application or service
- Supply chain security audit of dependencies and third-party packages
- Compliance gap analysis against specific regulatory frameworks

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| security-coordinator | Leader | Correlates findings, prioritizes remediation, produces security report | Read, Glob, Grep | opus |
| security-reviewer | Worker | OWASP Top 10, code-level vulnerability detection | Read, Glob, Grep | opus |
| vulnerability-triager | Worker | Exploitability triage, false positive filtering, risk ranking | Read, Glob, Grep | opus |
| compliance-auditor | Worker | SOC2/HIPAA/PCI-DSS control mapping and gap analysis | Read, Glob, Grep | opus |
| dependency-health-checker | Worker | Dependency vulnerabilities, license compliance, supply chain risks | Read, Glob, Grep, Bash | sonnet |

## Safety Properties

This team is designed with the strictest safety constraints of any team topology:

- **Entirely read-only team.** No member has Write or Edit tools. The team cannot modify any files in the codebase.
- **Secrets are always masked.** Any secrets, tokens, or credentials discovered during scanning are masked in all reports and findings. The team never outputs raw secret values.
- **No destructive commands.** Only the dependency-health-checker has Bash access, limited to running package audit commands (e.g., `npm audit`, `pip audit`).
- **Opus for security reasoning.** The coordinator, reviewer, triager, and compliance auditor all use opus for the deep reasoning required to accurately assess security vulnerabilities and compliance gaps.
- **Parallel-safe.** All workers can analyze the same codebase simultaneously without conflict.

## How It Works

1. The **security-coordinator** receives the audit request (codebase scope, compliance framework, focus areas).
2. The coordinator delegates specific analysis areas to each worker based on the audit scope.
3. **security-reviewer** scans the codebase for OWASP Top 10 patterns, injection vulnerabilities, authentication flaws, and insecure data handling.
4. **vulnerability-triager** receives the raw findings and triages each by exploitability, reachability from public endpoints, and real-world attack feasibility. Filters false positives.
5. **compliance-auditor** maps codebase practices to the target compliance framework, identifying which controls are met, partially met, or missing.
6. **dependency-health-checker** audits all dependencies for known vulnerabilities, license compatibility, and supply chain risks.
7. The coordinator correlates findings across all workers, eliminates duplicates, prioritizes by combined severity and exploitability, and produces a unified security report with remediation guidance.

## Example Usage Scenario

**Input:** "Security audit before SOC2 certification"

**Flow:**
- security-reviewer scans for OWASP vulnerabilities, identifies SQL injection in a legacy query builder, missing CSRF tokens on state-changing endpoints, and an insecure direct object reference in the file download handler
- vulnerability-triager assesses findings: SQL injection is critical (reachable from public API), CSRF is high (requires authenticated session), IDOR is critical (exposes customer data)
- compliance-auditor maps SOC2 controls, finds gaps in access logging (CC6.1), encryption at rest (CC6.7), and change management documentation (CC8.1)
- dependency-health-checker reviews 347 dependencies, identifies 3 with critical CVEs, 2 with incompatible GPL licenses, and 12 unmaintained packages with no updates in 2+ years
- security-coordinator produces unified report: 2 critical (SQLi, IDOR), 1 high (CSRF), 3 compliance gaps, 3 critical dependency vulnerabilities, with prioritized remediation plan and estimated effort

## Integration Notes

- This team is most effective when given the full codebase, dependency manifests, and target compliance framework
- The read-only constraint means it can safely audit production codebases without any risk of modification
- For teams that need vulnerabilities fixed, pair this team's report with a separate remediation agent
- Four opus workers make this the most expensive team topology; use it for high-stakes audits where accuracy justifies cost
- dependency-health-checker uses sonnet since package audit tasks are more structured and less ambiguous

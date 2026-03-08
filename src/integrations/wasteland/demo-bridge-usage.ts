/**
 * Demo: Using the Skill-Creator → Wasteland Bridge
 *
 * This demonstrates how to use the agent role converter and submission workflow
 * to bridge skill-creator agents to the wasteland federation.
 */

import { convertToWastelandRole, serializeWastelandRole } from './agent-role-converter.js';
import { AgentSubmissionWorkflow } from './agent-submission-workflow.js';
import type { GeneratedAgent } from '../../services/agents/agent-generator.js';

// Example: A skill-creator agent ready for wasteland submission
const exampleSkillCreatorAgent: GeneratedAgent = {
  name: 'api-testing-specialist',
  description: 'Specialized agent for API design, testing, and documentation',
  skills: ['api-design', 'test-generator', 'typescript-patterns'],
  filePath: '.claude/agents/api-testing-specialist.md',
  content: `---
name: api-testing-specialist
description: Specialized agent for API design, testing, and documentation
tools: Read, Write, Bash, Edit
model: sonnet
skills:
  - api-design
  - test-generator
  - typescript-patterns
---

You are a specialized agent combining expertise from API design, testing, and TypeScript patterns.
`
};

/**
 * Demo 1: Format Conversion
 */
export function demoFormatConversion(): void {
  console.log('🔄 Converting skill-creator agent to wasteland role format...\n');

  // Convert to wasteland format
  const wastelandRole = convertToWastelandRole(exampleSkillCreatorAgent);

  console.log('✅ Conversion complete!');
  console.log('📝 Wasteland Role File:');
  console.log('─'.repeat(80));
  console.log(serializeWastelandRole(wastelandRole));
  console.log('─'.repeat(80));

  // Show the differences
  console.log('\n🔍 Key Format Changes:');
  console.log('• tools: "Read, Write, Bash" → tools: ["Read", "Write", "Bash"]');
  console.log('• Added required wasteland sections (Position, Voice, Protocol, etc.)');
  console.log('• Generated vocabulary from skill names');
  console.log('• Selected voice profile based on skill count (specialist vs generalist)');
  console.log('• Preserved original skills in background section');
}

/**
 * Demo 2: Submission Workflow (Mock)
 */
export async function demoSubmissionWorkflow(): Promise<void> {
  console.log('\n🚀 Demonstrating submission workflow...\n');

  // Create workflow instance
  const workflow = new AgentSubmissionWorkflow({
    rolesDir: '.wasteland/roles',
    trustLevel: 'newcomer',
    requireApproval: false // For demo, skip approval
  });

  try {
    console.log('📤 Submitting agent to wasteland federation...');

    // In a real scenario, this would create actual files
    const result = await workflow.submit(exampleSkillCreatorAgent, 'demo-user');

    if (result.success) {
      console.log('✅ Submission successful!');
      console.log(`📁 Role file path: ${result.roleFilePath}`);
      console.log(`🆔 Registration ID: ${result.registrationId}`);
      console.log(`🛡️ Trust level: ${result.trustLevel}`);

      if (result.warnings.length > 0) {
        console.log(`⚠️ Warnings: ${result.warnings.join(', ')}`);
      }
    } else {
      console.log('❌ Submission failed:');
      result.errors.forEach(error => console.log(`  • ${error}`));
    }

  } catch (error) {
    console.log(`💥 Demo error (expected in test environment): ${error}`);
    console.log('   In real usage, ensure .wasteland/roles directory exists');
  }
}

/**
 * Demo 3: Approval Workflow
 */
export async function demoApprovalWorkflow(): Promise<void> {
  console.log('\n📋 Demonstrating approval workflow...\n');

  const workflow = new AgentSubmissionWorkflow({
    rolesDir: '.wasteland/roles',
    trustLevel: 'newcomer',
    requireApproval: true // Enable approval requirement
  });

  try {
    // Submit for approval
    console.log('1. 📤 Submitting agent for approval...');
    const submitResult = await workflow.submit(exampleSkillCreatorAgent, 'contributor');

    if (submitResult.success && submitResult.requiresApproval) {
      console.log('✅ Agent submitted and pending approval');
      console.log(`🆔 Pending submission ID: ${submitResult.registrationId}`);

      // List pending submissions
      console.log('\n2. 📋 Checking pending submissions...');
      const pending = await workflow.listPendingSubmissions();
      console.log(`Found ${pending.length} pending submission(s)`);

      // Approve the submission (in a real scenario)
      if (submitResult.registrationId) {
        console.log('\n3. ✅ Approving submission...');
        const approvalResult = await workflow.approveSubmission(
          submitResult.registrationId,
          'maintainer'
        );

        if (approvalResult.success) {
          console.log('🎉 Agent approved and registered to federation!');
          console.log(`📁 Final role path: ${approvalResult.roleFilePath}`);
        }
      }
    }

  } catch (error) {
    console.log(`💥 Demo error (expected): ${error}`);
    console.log('   This demo shows the workflow structure');
  }
}

/**
 * Run all demos
 */
export async function runAllDemos(): Promise<void> {
  console.log('🌉 Skill-Creator → Wasteland Bridge Demo');
  console.log('═'.repeat(50));

  demoFormatConversion();
  await demoSubmissionWorkflow();
  await demoApprovalWorkflow();

  console.log('\n🎯 Bridge Integration Complete!');
  console.log('The missing link between skill-creator and wasteland federation is now working.');
  console.log('Users can now seamlessly submit skill-creator agents to the federation.');
}

// Uncomment to run demos
// runAllDemos().catch(console.error);

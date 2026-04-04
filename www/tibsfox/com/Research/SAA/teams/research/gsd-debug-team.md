# gsd-debug-team

## Team Configuration

```json
{
  "name": "gsd-debug-team",
  "description": "Leader/worker team with 3 workers",
  "leadAgentId": "gsd-debug-team-lead",
  "createdAt": "2026-02-07T10:40:43.707Z",
  "members": [
    {
      "agentId": "gsd-debug-team-lead",
      "name": "Lead",
      "agentType": "coordinator",
      "tools": [
        "Read",
        "Write",
        "Bash",
        "Glob",
        "Grep",
        "TaskCreate",
        "TaskList",
        "TaskGet",
        "TaskUpdate",
        "SendMessage",
        "TeammateTool"
      ]
    },
    {
      "agentId": "gsd-debug-team-worker-1",
      "name": "Worker 1",
      "agentType": "worker",
      "tools": [
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
        "WebFetch",
        "WebSearch",
        "TaskGet",
        "TaskUpdate",
        "SendMessage"
      ]
    },
    {
      "agentId": "gsd-debug-team-worker-2",
      "name": "Worker 2",
      "agentType": "worker",
      "tools": [
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
        "WebFetch",
        "WebSearch",
        "TaskGet",
        "TaskUpdate",
        "SendMessage"
      ]
    },
    {
      "agentId": "gsd-debug-team-worker-3",
      "name": "Worker 3",
      "agentType": "worker",
      "tools": [
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
        "WebFetch",
        "WebSearch",
        "TaskGet",
        "TaskUpdate",
        "SendMessage"
      ]
    }
  ],
  "version": 1,
  "topology": "leader-worker"
}
```

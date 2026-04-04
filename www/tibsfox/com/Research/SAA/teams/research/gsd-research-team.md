# gsd-research-team

## Team Configuration

```json
{
  "name": "gsd-research-team",
  "description": "Leader/worker team with 4 workers",
  "leadAgentId": "gsd-research-team-lead",
  "createdAt": "2026-02-07T10:35:18.164Z",
  "members": [
    {
      "agentId": "gsd-research-team-lead",
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
      "agentId": "gsd-research-team-worker-1",
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
      "agentId": "gsd-research-team-worker-2",
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
      "agentId": "gsd-research-team-worker-3",
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
    },
    {
      "agentId": "gsd-research-team-worker-4",
      "name": "Worker 4",
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

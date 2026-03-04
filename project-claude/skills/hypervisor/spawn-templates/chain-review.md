# Chain Review Agent

**Branch:** {branch}
**Milestone:** {milestone} — chain {chain_position}/50, reviewing {version}

## Shift Register
```
{shift_register}
```

## Files to Read
- {prior_chain_link_path} (previous chain link)
- {load_data_path} (load data for this version)
- {plan_path} (execution plan)

## Instructions

Execute all phases in the plan. For each phase:
1. Read the plan, execute tasks
2. Commit with: `{commit_convention}`
3. Push with: `{push_command}`

On completion: mark task #{task_ids} complete, check TaskList for next.

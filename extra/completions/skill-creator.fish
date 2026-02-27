# Fish completion for skill-creator (sc)
# Install: copy to ~/.config/fish/completions/ or /usr/share/fish/vendor_completions.d/

# Disable file completions for base command
complete -c sc -f
complete -c skill-creator -f

# Top-level commands
complete -c sc -n '__fish_use_subcommand' -a project -d 'Manage skill-creator projects'
complete -c sc -n '__fish_use_subcommand' -a pack -d 'Manage educational and skill packs'
complete -c sc -n '__fish_use_subcommand' -a contrib -d 'Contribution workflow management'
complete -c sc -n '__fish_use_subcommand' -a www -d 'Website staging and deployment'
complete -c sc -n '__fish_use_subcommand' -a learn -d 'Adaptive learning'
complete -c sc -n '__fish_use_subcommand' -a unlearn -d 'Remove learned material'
complete -c sc -n '__fish_use_subcommand' -a orchestrator -d 'GSD orchestrator commands'

# Global flags
complete -c sc -l version -d 'Print version and exit'
complete -c sc -l help -d 'Show help message'
complete -c sc -l verbose -d 'Enable verbose output'

# project subcommands
complete -c sc -n '__fish_seen_subcommand_from project' -a init -d 'Initialize a new project'
complete -c sc -n '__fish_seen_subcommand_from project' -a list -d 'List projects'
complete -c sc -n '__fish_seen_subcommand_from project' -a status -d 'Show project status'

# pack subcommands
complete -c sc -n '__fish_seen_subcommand_from pack' -a list -d 'List available packs'
complete -c sc -n '__fish_seen_subcommand_from pack' -a info -d 'Show pack details'

# contrib subcommands
complete -c sc -n '__fish_seen_subcommand_from contrib' -a status -d 'Show contribution status'
complete -c sc -n '__fish_seen_subcommand_from contrib' -a list -d 'List contributions'

# www subcommands
complete -c sc -n '__fish_seen_subcommand_from www' -a status -d 'Show website status'

# orchestrator subcommands
complete -c sc -n '__fish_seen_subcommand_from orchestrator' -a discover -d 'Discover commands'
complete -c sc -n '__fish_seen_subcommand_from orchestrator' -a classify -d 'Classify intent'
complete -c sc -n '__fish_seen_subcommand_from orchestrator' -a lifecycle -d 'Query lifecycle'

# Mirror all completions for skill-creator command name
complete -c skill-creator -n '__fish_use_subcommand' -a project -d 'Manage skill-creator projects'
complete -c skill-creator -n '__fish_use_subcommand' -a pack -d 'Manage educational and skill packs'
complete -c skill-creator -n '__fish_use_subcommand' -a contrib -d 'Contribution workflow management'
complete -c skill-creator -n '__fish_use_subcommand' -a www -d 'Website staging and deployment'
complete -c skill-creator -n '__fish_use_subcommand' -a learn -d 'Adaptive learning'
complete -c skill-creator -n '__fish_use_subcommand' -a unlearn -d 'Remove learned material'
complete -c skill-creator -n '__fish_use_subcommand' -a orchestrator -d 'GSD orchestrator commands'
complete -c skill-creator -l version -d 'Print version and exit'
complete -c skill-creator -l help -d 'Show help message'
complete -c skill-creator -l verbose -d 'Enable verbose output'

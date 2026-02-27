# Bash completion for skill-creator (sc)
# Install: source this file or copy to /usr/share/bash-completion/completions/

_skill_creator() {
    local cur prev commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    commands="project pack contrib www learn unlearn orchestrator"

    case "${prev}" in
        sc|skill-creator)
            COMPREPLY=($(compgen -W "${commands} --version --help --verbose" -- "${cur}"))
            return 0
            ;;
        project)
            COMPREPLY=($(compgen -W "init list status" -- "${cur}"))
            return 0
            ;;
        pack)
            COMPREPLY=($(compgen -W "list info" -- "${cur}"))
            return 0
            ;;
        contrib)
            COMPREPLY=($(compgen -W "status list" -- "${cur}"))
            return 0
            ;;
        www)
            COMPREPLY=($(compgen -W "status" -- "${cur}"))
            return 0
            ;;
        orchestrator)
            COMPREPLY=($(compgen -W "discover classify lifecycle" -- "${cur}"))
            return 0
            ;;
    esac
}
complete -F _skill_creator sc
complete -F _skill_creator skill-creator

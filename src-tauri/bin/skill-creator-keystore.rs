//! `skill-creator-keystore` — standalone keystore CLI.
//!
//! Operator-pinned hybrid CLI architecture (2026-05-11): this binary is one
//! of two surfaces sharing the same Rust keystore lib at
//! `src-tauri/src/security/`. The other surface is the Node CLI wrapper at
//! `src/cli/commands/keystore.ts` which shells out to this binary via
//! `child_process.spawn`.
//!
//! Subcommands:
//! - `migrate` — detect on-disk state, migrate v1 plaintext to Path 1 or
//!   Path 2 (prompts passphrase from stdin if Path 2)
//! - `set <account>` — store a credential (reads value from stdin)
//! - `status` — print current keystore state (Path 1 / Path 2 / v1 /
//!   empty + orphan note)
//! - `migrate --to-keyring` — M3 stub; errors with v1.49.6XX cluster #3
//!   deferral message

use clap::{Args, Parser, Subcommand};
use gsd_os_lib::security::keyring_backend::{os_store, KeyringStore};
use gsd_os_lib::security::keystore::{keystore_paths, Keystore};
use gsd_os_lib::security::migration::DiscoveredState;
use std::io::{self, BufRead, Write};
use std::process::ExitCode;

#[derive(Parser, Debug)]
#[command(name = "skill-creator-keystore")]
#[command(version)]
#[command(about = "Standalone keystore CLI for gsd-skill-creator (v1.49.650+)")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Detect on-disk state and migrate v1 plaintext to v2 storage.
    Migrate(MigrateArgs),
    /// Store or update a credential under the given account.
    Set(SetArgs),
    /// Print the current keystore state.
    Status,
}

#[derive(Args, Debug)]
struct MigrateArgs {
    /// Upgrade Path-2 (age-encrypted file) → Path-1 (OS keyring) when the
    /// OS keyring later becomes available. NOT IMPLEMENTED at v1.49.650.
    #[arg(long = "to-keyring")]
    to_keyring: bool,
}

#[derive(Args, Debug)]
struct SetArgs {
    /// The keyring account name (e.g. `anthropic-api-key`).
    account: String,
}

fn main() -> ExitCode {
    match Cli::parse().command {
        Command::Status => cmd_status(),
        Command::Migrate(args) => cmd_migrate(args),
        Command::Set(args) => cmd_set(args),
    }
}

fn cmd_status() -> ExitCode {
    let (v1, path2) = match keystore_paths() {
        Some(p) => p,
        None => {
            eprintln!("error: cannot resolve config directory");
            return ExitCode::from(2);
        }
    };
    let kr = os_store();
    let state = Keystore::discover(&kr, &path2, &v1);
    match state {
        DiscoveredState::Path1 => {
            println!("Storage: Path 1 (OS keyring)");
            println!("Service: gsd-skill-creator");
            println!("Account: anthropic-api-key");
        }
        DiscoveredState::Path2 => {
            println!("Storage: Path 2 (age-encrypted file)");
            println!("Location: {}", path2.display());
            // M3 status messaging: if keyring is available on a Path-2 host,
            // surface the upgrade availability.
            if kr.is_available() {
                println!("Note: This host has OS keyring available but credentials are in Path 2 storage.");
                println!("      See `skill-creator-keystore migrate --to-keyring` for upgrade options.");
            }
        }
        DiscoveredState::Path1WithPath2Orphan => {
            println!("Storage: Path 1 (OS keyring) — Path 2 file present as orphan");
            println!("Service: gsd-skill-creator");
            println!("Account: anthropic-api-key");
            println!("Orphan: {} — Path 1 wins; consider `rm {}` to clean up.",
                path2.display(), path2.display());
        }
        DiscoveredState::V1Plaintext => {
            println!("Storage: v1 plaintext (legacy)");
            println!("Location: {}", v1.display());
            println!("Action: run `skill-creator-keystore migrate` to upgrade to v2.");
        }
        DiscoveredState::Empty => {
            println!("Storage: empty");
            println!("Action: run `skill-creator-keystore set anthropic-api-key` to store a credential.");
        }
    }
    ExitCode::SUCCESS
}

fn cmd_migrate(args: MigrateArgs) -> ExitCode {
    if args.to_keyring {
        eprintln!(
            "Path-2 → Path-1 upgrade not implemented at v1.49.650.\n\
             Your credentials are currently stored in the Path-2 file\n\
             (passphrase-encrypted). Tracked at v1.49.6XX cluster #3.\n\
             Workaround: export ANTHROPIC_API_KEY from your shell, or\n\
             delete the credentials.age file and re-run\n\
             `skill-creator-keystore set` to store the credential in the OS\n\
             keyring."
        );
        return ExitCode::from(3);
    }

    let (v1, path2) = match keystore_paths() {
        Some(p) => p,
        None => {
            eprintln!("error: cannot resolve config directory");
            return ExitCode::from(2);
        }
    };
    let kr = os_store();
    let state = Keystore::discover(&kr, &path2, &v1);
    match state {
        DiscoveredState::Empty => {
            eprintln!("no v1 plaintext file detected at {}; nothing to migrate.", v1.display());
            return ExitCode::SUCCESS;
        }
        DiscoveredState::Path1 | DiscoveredState::Path2 | DiscoveredState::Path1WithPath2Orphan => {
            eprintln!("keystore is already at v2 storage; nothing to migrate.");
            return ExitCode::SUCCESS;
        }
        DiscoveredState::V1Plaintext => { /* fallthrough */ }
    }

    let passphrase = if !kr.is_available() {
        match prompt_passphrase("Enter passphrase for Path 2 storage: ") {
            Ok(p) => Some(p),
            Err(e) => {
                eprintln!("error: {}", e);
                return ExitCode::from(2);
            }
        }
    } else {
        None
    };
    let passphrase_ref = passphrase.as_deref();

    match Keystore::migrate_v1_to_v2(&kr, &v1, &path2, passphrase_ref) {
        Ok(n) => {
            println!("Migrated {} credential(s) to v2 storage.", n);
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("migration failed: {}", e);
            ExitCode::from(1)
        }
    }
}

fn cmd_set(args: SetArgs) -> ExitCode {
    let (_v1, path2) = match keystore_paths() {
        Some(p) => p,
        None => {
            eprintln!("error: cannot resolve config directory");
            return ExitCode::from(2);
        }
    };
    let kr = os_store();

    // Read credential value from stdin (one line, trimmed).
    let stdin = io::stdin();
    let mut line = String::new();
    match stdin.lock().read_line(&mut line) {
        Ok(0) => {
            eprintln!("error: no value provided on stdin");
            return ExitCode::from(2);
        }
        Ok(_) => {}
        Err(e) => {
            eprintln!("error reading stdin: {}", e);
            return ExitCode::from(2);
        }
    }
    let value = line.trim_end_matches('\n').trim_end_matches('\r');

    let passphrase = if !kr.is_available() {
        match prompt_passphrase("Enter passphrase to encrypt: ") {
            Ok(p) => Some(p),
            Err(e) => {
                eprintln!("error: {}", e);
                return ExitCode::from(2);
            }
        }
    } else {
        None
    };
    let passphrase_ref = passphrase.as_deref();

    match Keystore::save_with_backend(&kr, &path2, &args.account, value, passphrase_ref) {
        Ok(backend) => {
            println!("Stored to backend: {:?}", backend);
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("save failed: {}", e);
            ExitCode::from(1)
        }
    }
}

/// Prompt for a passphrase from stdin. No terminal echo suppression in the
/// CLI version — operators using TTY input should set up `read -s` or similar
/// on the shell side. The Node wrapper has access to richer terminal control.
fn prompt_passphrase(prompt: &str) -> Result<String, String> {
    eprint!("{}", prompt);
    io::stderr().flush().map_err(|e| e.to_string())?;
    let stdin = io::stdin();
    let mut line = String::new();
    stdin.lock().read_line(&mut line).map_err(|e| e.to_string())?;
    let trimmed = line.trim_end_matches('\n').trim_end_matches('\r').to_string();
    if trimmed.is_empty() {
        return Err("empty passphrase".to_string());
    }
    Ok(trimmed)
}

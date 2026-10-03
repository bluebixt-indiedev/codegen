use std::path::Path;
use std::process::{Command, Stdio};
use std::io;

/// Allowed git commands over SSH — prevents RCE
const ALLOWED_COMMANDS: &[&str] = &["git-upload-pack", "git-receive-pack", "git-upload-archive"];

/// Handle an SSH git request
/// `command` is what comes from SSH: e.g. "git-upload-pack" or "git-receive-pack"
/// `repo_path` is the bare repo path from storage::get_repo_path()
pub fn ssh_handle<P: AsRef<Path>>(repo_path: P, command: &str) -> io::Result<()> {
    let repo_path = repo_path.as_ref();

    // SECURITY: Only allow real git commands. Never run arbitrary input.
    // SSH original command looks like: "git-upload-pack '/owner/repo.git'"
    // We extract just the command name.
    let cmd_name = command.split_whitespace().next().unwrap_or("").trim_matches('\'');
    
    if !ALLOWED_COMMANDS.contains(&cmd_name) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            format!("Forbidden command: {}", cmd_name),
        ));
    }

    if !repo_path.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Repo not found: {}", repo_path.display()),
        ));
    }

    // Equivalent of Go's:
    // cmd.Dir = repoPath
    // cmd.Stdin = os.Stdin etc.
    let mut child = Command::new("git")
        .arg(cmd_name)
        .arg(repo_path)
        .current_dir(repo_path)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()?;

    let status = child.wait()?;
    
    if status.success() {
        Ok(())
    } else {
        Err(io::Error::new(
            io::ErrorKind::Other,
            format!("git {} failed: {}", cmd_name, status),
        ))
    }
}

/// Async version for when you use russh + tokio (for real SSH server)
///
/// Enable with: tokio = { version = "1", features = ["full"] }
#[cfg(feature = "tokio")]
pub mod async_handle {
    use super::*;
    use tokio::process::Command as TokioCommand;

    pub async fn ssh_handle_async<P: AsRef<Path>>(repo_path: P, command: &str) -> io::Result<()> {
        let repo_path = repo_path.as_ref();
        let cmd_name = command.split_whitespace().next().unwrap_or("");

        if !ALLOWED_COMMANDS.contains(&cmd_name) {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                format!("Forbidden: {}", cmd_name),
            ));
        }

        let mut child = TokioCommand::new("git")
            .arg(cmd_name)
            .arg(repo_path)
            .current_dir(repo_path)
            .stdin(Stdio::inherit())
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .spawn()?;

        let status = child.wait().await?;
        if status.success() { Ok(()) } else { Err(io::Error::new(io::ErrorKind::Other, "git failed")) }
    }
}
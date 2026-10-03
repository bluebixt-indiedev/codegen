use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;

/// Root directory where all bare repos are stored
pub const REPOS_ROOT: &str = "forgejo/data/data/repos";

/// Ensure the repos root exists
pub fn init() -> std::io::Result<()> {
    fs::create_dir_all(REPOS_ROOT)
}

/// Create a bare repo at data/repos/{owner}/{name}.git
/// Returns the path. If it already exists, returns it without error.
pub fn create_bare_repo(owner: &str, name: &str) -> std::io::Result<PathBuf> {
    let path = get_repo_path(owner, name);
    
    // Ensure parent dir exists: data/repos/{owner}/
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    if path.exists() {
        return Ok(path); // already exists
    }

    // git init --bare {path}
    let status = Command::new("git")
        .args(["init", "--bare", &path.to_string_lossy()])
        .status()?;

    if status.success() {
        Ok(path)
    } else {
        Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("git init --bare failed with status: {}", status),
        ))
    }
}

/// Check if repo exists
pub fn repo_exists(owner: &str, name: &str) -> bool {
    get_repo_path(owner, name).exists()
}

/// Get full path to repo
pub fn get_repo_path(owner: &str, name: &str) -> PathBuf {
    Path::new(REPOS_ROOT).join(owner).join(format!("{}.git", name))
}

/// Check if a request path looks like a git request
/// ex: /rogge/myapp.git/info/refs
pub fn is_git_request(path: &str) -> bool {
    path.len() > 4 && path.contains(".git")
}
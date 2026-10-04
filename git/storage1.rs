use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const REPOS_ROOT: &str = "forgejo/data/data/repos";

pub fn init() -> std::io::Result<()> {
    fs::create_dir_all(REPOS_ROOT)?;
    fs::create_dir_all("forgejo/data/data/worktrees")?;
    Ok(())
}

pub fn create_bare_repo(owner: &str, name: &str) -> std::io::Result<PathBuf> {
    let path = get_repo_path(owner, name);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    if path.exists() {
        return Ok(path);
    }

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

pub fn repo_exists(owner: &str, name: &str) -> bool {
    get_repo_path(owner, name).exists()
}

pub fn get_repo_path(owner: &str, name: &str) -> PathBuf {
    Path::new(REPOS_ROOT).join(owner).join(format!("{}.git", name))
}

pub fn is_git_request(path: &str) -> bool {
    path.len() > 4 && path.contains(".git")
}
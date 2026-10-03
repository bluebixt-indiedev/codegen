pub mod storage;
pub mod ssh;
pub mod protocol;
// Re-export everything from storage so old code using `git::RepoExists` still works
// This is the Rust equivalent of "repo.go is alias for storage"
pub use storage::{
    init, create_bare_repo, repo_exists, get_repo_path, is_git_request, REPOS_ROOT
};

// Optional: type alias if you had a Repo struct in other files
// pub use storage::Repo;
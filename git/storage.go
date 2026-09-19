package git

import (
	"os"
	"os/exec"
	"path/filepath"
)

var ReposRoot = "./data/repos"

func Init() {
	os.MkdirAll(ReposRoot, 0755)
}

func CreateBareRepo(owner, name string) (string, error) {
	path := filepath.Join(ReposRoot, owner, name+".git")
	os.MkdirAll(filepath.Dir(path), 0755)
	if _, err := os.Stat(path); err == nil {
		return path, nil // already exists
	}
	cmd := exec.Command("git", "init", "--bare", path)
	return path, cmd.Run()
}

func RepoExists(owner, name string) bool {
	path := filepath.Join(ReposRoot, owner, name+".git")
	_, err := os.Stat(path)
	return err == nil
}

func GetRepoPath(owner, name string) string {
	return filepath.Join(ReposRoot, owner, name+".git")
}

func IsGitRequest(path string) bool {
	return len(path) > 4 && (contains(path, ".git/") || contains(path, ".git"))
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
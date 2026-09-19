package git

import (
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strings"
)

func Protocol(w http.ResponseWriter, r *http.Request, repoPath string) error {
	urlPath := r.URL.Path

	// Step 1: info/refs?service=git-upload-pack
	if strings.HasSuffix(urlPath, "/info/refs") {
		service := r.URL.Query().Get("service")
		if service!= "git-upload-pack" && service!= "git-receive-pack" {
			http.Error(w, "invalid service", 400)
			return fmt.Errorf("invalid service")
		}
		w.Header().Set("Content-Type", fmt.Sprintf("application/x-%s-advertisement", service))
		w.Header().Set("Cache-Control", "no-cache")

		cmd := exec.Command("git", service[4:], "--stateless-rpc", "--advertise-refs", repoPath)
		cmd.Stdout = w
		return cmd.Run()
	}

	// Step 2: git-upload-pack or git-receive-pack
	var service string
	if strings.HasSuffix(urlPath, "/git-upload-pack") {
		service = "upload-pack"
		w.Header().Set("Content-Type", "application/x-git-upload-pack-result")
	} else if strings.HasSuffix(urlPath, "/git-receive-pack") {
		service = "receive-pack"
		w.Header().Set("Content-Type", "application/x-git-receive-pack-result")
	} else {
		http.Error(w, "invalid endpoint", 400)
		return fmt.Errorf("invalid endpoint")
	}

	cmd := exec.Command("git", service, "--stateless-rpc", repoPath)
	cmd.Stdin = r.Body
	cmd.Stdout = w
	cmd.Stderr = io.Discard
	return cmd.Run()
}

func ParseAndHandle(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		http.Error(w, "repo not found", 404)
		return
	}
	owner := parts[0]
	repo := strings.TrimSuffix(parts[1], ".git")
	if!RepoExists(owner, repo) {
		http.Error(w, "repo not found", 404)
		return
	}
	repoPath := GetRepoPath(owner, repo)
	Protocol(w, r, repoPath)
}
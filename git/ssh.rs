// Converted from Go: ./git/ssh.go
use std::collections::HashMap;

package git

import (
	"os"
	"os/exec"
)

fn SSHHandle(repoPath string, command string) -> error {
	// command = git-upload-pack or git-receive-pack from SSH
	cmd := exec.Command("git", command)
	cmd.Dir = repoPath
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
/* ORIGINAL GO:
package git

import (
	"os"
	"os/exec"
)

func SSHHandle(repoPath string, command string) error {
	// command = git-upload-pack or git-receive-pack from SSH
	cmd := exec.Command("git", command)
	cmd.Dir = repoPath
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
*/
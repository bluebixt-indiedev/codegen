// Converted from Go: ./main.go
use std::collections::HashMap;

package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"codeberg.org/BlueBix/codegen/git"
)

fn main() -> () {
	git.Init()

	// 1. Git clone
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if git.IsGitRequest(r.URL.Path) {
			git.HTTPHandler(w, r)
			return
		}

		// 2. Homepage - List repos
		if r.URL.Path == "/" {
			repos, _ := os.ReadDir("./data/repos")
			w.Write([]byte("<h1>BlueBix Codegen</h1><a href='/create'>+ New Repo</a><ul>"))
			for _, f := range repos {
				w.Write([]byte("<li>" + f.Name() + "</li>"))
			}
			w.Write([]byte("</ul>"))
			return
		}

		// 3. Create repo page
		if r.URL.Path == "/create" {
			if r.Method == "POST" {
				owner := r.FormValue("owner")
				name := r.FormValue("name")
				git.CreateBareRepo(owner, name)
				http.Redirect(w, r, "/"+owner+"/"+name, 302)
				return
			}
			w.Write([]byte(`
				<h1>Create Repo</h1>
				<form method="POST">
				Owner: <input name="owner" placeholder="BlueBix"><br>
				Name: <input name="name" placeholder="myrepo"><br>
				<button>Create</button>
				</form>
			`))
			return
		}

		fmt.Fprintf(w, "Repo page: %s", r.URL.Path)
	})

	log.Println("Codegen running on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
/* ORIGINAL GO:
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"codeberg.org/BlueBix/codegen/git"
)

func main() {
	git.Init()

	// 1. Git clone
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if git.IsGitRequest(r.URL.Path) {
			git.HTTPHandler(w, r)
			return
		}

		// 2. Homepage - List repos
		if r.URL.Path == "/" {
			repos, _ := os.ReadDir("./data/repos")
			w.Write([]byte("<h1>BlueBix Codegen</h1><a href='/create'>+ New Repo</a><ul>"))
			for _, f := range repos {
				w.Write([]byte("<li>" + f.Name() + "</li>"))
			}
			w.Write([]byte("</ul>"))
			return
		}

		// 3. Create repo page
		if r.URL.Path == "/create" {
			if r.Method == "POST" {
				owner := r.FormValue("owner")
				name := r.FormValue("name")
				git.CreateBareRepo(owner, name)
				http.Redirect(w, r, "/"+owner+"/"+name, 302)
				return
			}
			w.Write([]byte(`
				<h1>Create Repo</h1>
				<form method="POST">
				Owner: <input name="owner" placeholder="BlueBix"><br>
				Name: <input name="name" placeholder="myrepo"><br>
				<button>Create</button>
				</form>
			`))
			return
		}

		fmt.Fprintf(w, "Repo page: %s", r.URL.Path)
	})

	log.Println("Codegen running on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
*/
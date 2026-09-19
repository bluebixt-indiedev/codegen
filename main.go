package main

import (
	"log"
	"net/http"
	"codeberg.org/BlueBix/codegen/git"
)

func main() {
	git.Init()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if git.IsGitRequest(r.URL.Path) {
			git.HTTPHandler(w, r)
			return
		}
		w.Write([]byte("Codegen by BlueBix - Git Engine"))
	})

	log.Fatal(http.ListenAndServe(":3000", nil))
}
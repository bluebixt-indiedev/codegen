package git

import "net/http"

func HTTPHandler(w http.ResponseWriter, r *http.Request) {
	ParseAndHandle(w, r)
}
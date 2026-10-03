// Converted from Go: ./git/http.go
use std::collections::HashMap;

package git

import "net/http"

fn HTTPHandler(w http.ResponseWriter, r *http.Request) -> () {
	ParseAndHandle(w, r)
}
/* ORIGINAL GO:
package git

import "net/http"

func HTTPHandler(w http.ResponseWriter, r *http.Request) {
	ParseAndHandle(w, r)
}
*/
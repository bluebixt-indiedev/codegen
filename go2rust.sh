#!/bin/bash
# Usage: ./go2rust.sh ./your-go-project
# Creates .rs files next to .go files

ROOT=${1:-.}

find "$ROOT" -type f -name "*.go" ! -path "*/vendor/*" | while read gofile; do
  rsfile="${gofile%.go}.rs"
  echo "-> $gofile => $rsfile"

  {
    echo "// AUTO-CONVERTED from $gofile"
    echo "// Original Go code is preserved below as comment for reference"
    echo ""
    # --- Very basic syntax mapping ---
    # This doesn't make perfect Rust, but gives you a starting skeleton
    cat "$gofile" | \
      sed -E 's/^package .*/\/\/ package -> mod (manual)/' | \
      sed -E 's/^import \(/\/\/ imports -> use (check Cargo.toml)/' | \
      sed -E 's/func \(([a-zA-Z0-9_]+) \*?([A-Za-z0-9_]+)\) ([A-Za-z0-9_]+)\(/\/\/ method \3 for \2\nfn \3(\&self, /' | \
      sed -E 's/^func ([A-Za-z0-9_]+)\(/fn \1(/' | \
      sed -E 's/:=/let /g' | \
      sed -E 's/var /let mut /g' | \
      sed -E 's/fmt\.Println/print!\(/g'
    
    echo ""
    echo "/*"
    echo "ORIGINAL GO CODE:"
    cat "$gofile"
    echo "*/"

  } > "$rsfile"
done

echo "Done. Now you have .rs files next to every .go"
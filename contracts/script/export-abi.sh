#!/usr/bin/env bash
# Exports ABI-only JSON for every contract compiled from src/ into ../shared/abi/<Contract>.json.
#
# Foundry has no post-build hook, so `forge build` alone does NOT refresh shared/abi. Run:
#   forge build && ./script/export-abi.sh
#
# The ABI files are the interface the frontend (wagmi generate) and backend (event DTOs) build against;
# a stale one means they generate against a lie. `--check` diffs instead of writing, for CI.
set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="out"
DEST_DIR="../shared/abi"
MODE="write"

case "${1:-}" in
  "") ;;
  --check) MODE="check" ;;
  *) echo "usage: $0 [--check]" >&2; exit 2 ;;
esac

command -v jq >/dev/null 2>&1 || { echo "export-abi: jq is required (brew install jq)" >&2; exit 1; }
[ -d "$OUT_DIR" ] || { echo "export-abi: $OUT_DIR/ not found — run 'forge build' first" >&2; exit 1; }

GEN_DIR="$(mktemp -d)"
trap 'rm -rf "$GEN_DIR"' EXIT

# The source path and contract name come from the artifact's own metadata, so this ignores anything not
# compiled from src/ (lib/, script/, test/) and is immune to the out/<File>.sol/<Name>.<ver>.json renaming
# Foundry does when two contracts share a name.
while IFS= read -r -d '' artifact; do
  target="$(jq -r '.metadata.settings.compilationTarget // {} | to_entries[0] | select(. != null) | "\(.key)\t\(.value)"' "$artifact")"
  [ -n "$target" ] || continue
  source_path="${target%%$'\t'*}"
  name="${target#*$'\t'}"
  case "$source_path" in src/*) ;; *) continue ;; esac

  if [ -e "$GEN_DIR/$name.json" ]; then
    echo "export-abi: two contracts named '$name' under src/ — ABI file names would collide" >&2
    exit 1
  fi
  # -S sorts object keys so a solc upgrade does not reorder every diff.
  jq -S '.abi' "$artifact" > "$GEN_DIR/$name.json"
done < <(find "$OUT_DIR" -mindepth 2 -maxdepth 2 -name '*.json' -print0)

if [ "$MODE" = "check" ]; then
  mkdir -p "$DEST_DIR"
  if diff -r -x .gitkeep "$GEN_DIR" "$DEST_DIR" >/dev/null; then
    echo "export-abi: shared/abi is up to date"
    exit 0
  fi
  echo "export-abi: shared/abi is stale — run 'forge build && ./script/export-abi.sh' and commit the result:" >&2
  diff -r -x .gitkeep -q "$GEN_DIR" "$DEST_DIR" | sed "s#$GEN_DIR#<generated>#g; s#$DEST_DIR#shared/abi#g" >&2 || true
  exit 1
fi

mkdir -p "$DEST_DIR"
# Remove ABIs of contracts that no longer exist.
for existing in "$DEST_DIR"/*.json; do
  [ -e "$existing" ] || continue
  [ -e "$GEN_DIR/$(basename "$existing")" ] || { rm "$existing"; echo "removed  $(basename "$existing")"; }
done
count=0
for generated in "$GEN_DIR"/*.json; do
  [ -e "$generated" ] || continue
  cp "$generated" "$DEST_DIR/$(basename "$generated")"
  count=$((count + 1))
done
echo "export-abi: wrote $count ABI file(s) to shared/abi"

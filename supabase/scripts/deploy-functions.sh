#!/usr/bin/env sh
set -euo pipefail

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set" >&2
  exit 1
fi
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "Error: SUPABASE_PROJECT_REF is not set" >&2
  exit 1
fi

# Ensure we are at the supabase/ folder (where functions/ exists)
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "${SCRIPT_DIR}/.."

PROJECT_REF="${SUPABASE_PROJECT_REF}"

echo "Deploying Supabase Edge Functions to project ${PROJECT_REF}..."

# Iterate over function directories and deploy (skip _shared)
for fn in functions/*; do
  name="$(basename "$fn")"
  if [ -d "$fn" ] && [ "$name" != "_shared" ]; then
    echo "--- Deploying $name ---"
    supabase functions deploy "$name" --project-ref "$PROJECT_REF"
  fi
done

echo "All functions deployed successfully."
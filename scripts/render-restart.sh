#!/usr/bin/env bash
# Restart Render services from the CLI instead of clicking through the dashboard.
#
#   export RENDER_API_KEY=rnd_xxxxxxxx        # Dashboard → Account Settings → API Keys
#   ./scripts/render-restart.sh               # restart all banchan-* services
#   ./scripts/render-restart.sh banchan-menu  # restart just one
#
# Note: a restart only helps when a service is wedged (stuck process, stale DB
# connection, env var change not picked up). It does NOT redeploy new code —
# use "Clear build cache & deploy" in the dashboard for that.

set -euo pipefail

: "${RENDER_API_KEY:?Set RENDER_API_KEY first (Dashboard → Account Settings → API Keys)}"

API="https://api.render.com/v1"
AUTH=(-H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json")

# The API returns services wrapped as [{"service": {...}, "cursor": "..."}], so
# reach through .service to get at id/name.
services_json=$(curl -sS "${AUTH[@]}" "$API/services?limit=100")

filter='.[].service | select(.name | startswith("banchan")) | "\(.id)\t\(.name)"'
if [ $# -gt 0 ]; then
  filter=".[].service | select(.name == \"$1\") | \"\(.id)\t\(.name)\""
fi

mapfile -t targets < <(echo "$services_json" | jq -r "$filter")

if [ ${#targets[@]} -eq 0 ]; then
  echo "No matching services found. Services on this account:"
  echo "$services_json" | jq -r '.[].service.name'
  exit 1
fi

for row in "${targets[@]}"; do
  id=${row%%$'\t'*}
  name=${row##*$'\t'}
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${AUTH[@]}" "$API/services/$id/restart")
  if [ "$code" = "200" ] || [ "$code" = "202" ]; then
    echo "restarting $name ($id)"
  else
    echo "FAILED $name ($id) — HTTP $code" >&2
  fi
done

echo
echo "Restarts queued. Each takes ~30-60s. Watch progress in the dashboard logs."

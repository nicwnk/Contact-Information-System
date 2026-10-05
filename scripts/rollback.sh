#!/usr/bin/env bash
# Roll the app back to the last known-good image tag.
#
# Usage:
#   scripts/rollback.sh          # use the tag saved in the state file
#   scripts/rollback.sh 41       # roll back to a specific tag
#
# Environment overrides (all optional):
#   STATE_FILE    file holding the last good tag (default: $JENKINS_HOME/last_good_tag, or ./last_good_tag)
#   ENV_FILE      env file passed to docker compose (default: .env)
#   COMPOSE_FILE  compose file to use (default: docker-compose.yml)
#
# The Jenkinsfile should save the tag after a successful smoke test:
#   echo "$TAG" > "${JENKINS_HOME:-.}/last_good_tag"

set -euo pipefail

cd "$(dirname "$0")/.."

STATE_FILE="${STATE_FILE:-${JENKINS_HOME:-.}/last_good_tag}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# 1. Work out which tag to restore.
TAG_TO_RESTORE="${1:-}"
if [ -z "$TAG_TO_RESTORE" ] && [ -f "$STATE_FILE" ]; then
  TAG_TO_RESTORE="$(tr -d '[:space:]' < "$STATE_FILE")"
fi

if [ -z "$TAG_TO_RESTORE" ]; then
  echo "ERROR: no tag given and no saved tag found in $STATE_FILE." >&2
  echo "Usage: scripts/rollback.sh [TAG]" >&2
  exit 1
fi

echo "Rolling back to tag: $TAG_TO_RESTORE"

# 2. Build the compose arguments.
COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [ -f "$ENV_FILE" ]; then
  COMPOSE+=(--env-file "$ENV_FILE")
else
  echo "WARNING: env file '$ENV_FILE' not found, continuing without it." >&2
fi

export TAG="$TAG_TO_RESTORE"

# 3. Make sure our own images for that tag still exist locally.
while read -r image; do
  case "$image" in
    myapp/*)
      if ! docker image inspect "$image" >/dev/null 2>&1; then
        echo "ERROR: image $image is not available locally, cannot roll back." >&2
        exit 1
      fi
      ;;
  esac
done < <("${COMPOSE[@]}" config --images)

# 4. Redeploy with the old tag. --no-build means we only reuse existing images.
"${COMPOSE[@]}" up -d --no-build --remove-orphans

# 5. Check that the rolled-back app is healthy.
if [ -f scripts/smoke-test.sh ]; then
  echo "Running smoke test..."
  bash scripts/smoke-test.sh
fi

echo "Rollback to $TAG_TO_RESTORE complete."

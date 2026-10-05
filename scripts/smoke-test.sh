#!/bin/sh
# Checks the app through the proxy. Retries each path up to 12 times (5 s apart).
for path in / /api/contacts/health /api/validate/health; do
  ok=0
  for i in $(seq 1 12); do
    if docker compose exec -T proxy wget -qO- "http://localhost$path" >/dev/null 2>&1; then
      ok=1; break
    fi
    sleep 5
  done
  if [ "$ok" -ne 1 ]; then echo "SMOKE TEST FAILED: $path"; exit 1; fi
  echo "OK $path"
done
echo "Smoke test passed"

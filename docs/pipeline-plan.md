# Pipeline Plan

| Item | Choice |
|---|---|
| CI server | Jenkins LTS (JDK 17) in Docker, port 8081, separate compose file in infra/jenkins/ |
| Job type | Pipeline, "Pipeline script from SCM", Script Path `Jenkinsfile` |
| Trigger | GitHub webhook via ngrok (`/github-webhook/`) |
| Git host | GitHub (nicwnk/Contact-Information-System) |
| Credentials | Secret file `myapp-env` (real .env), Git token if the repo is private |
| Image tagging | `TAG = BUILD_NUMBER` |

## Planned stages
1. **Checkout**: `checkout scm`
2. **Test**: `docker build --target test` for each service with tests
3. **Build Images**: `docker compose build`
4. **Deploy**: copy the secret .env, then `docker compose up -d --no-build --remove-orphans`
5. **Smoke Test**: `scripts/smoke-test.sh` checks /, /api/items/health, /api/orders/health

## post
- success: print the deployed build number
- failure: print a failure message (old containers keep running if the failure is before Deploy)
- always: `rm -f .env`

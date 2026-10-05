# Jenkins Setup

Jenkins runs in Docker on the M2 machine and builds, tests, deploys, and rolls back the app.

## Files

| File | Purpose |
|---|---|
| `infra/jenkins/Dockerfile` | Jenkins LTS (JDK 17) with the Docker CLI and Compose plugin |
| `infra/jenkins/docker-compose.yml` | Runs Jenkins on port 8081 and mounts the Docker socket |
| `scripts/rollback.sh` | Redeploys the last known-good image tag |
| `Jenkinsfile` | The pipeline (added in Phase 5) |

## Requirements

- Docker Desktop running
- Ports 8081 and 50000 free (port 8080 is used by the app's proxy)

## Start Jenkins

```powershell
cd infra\jenkins
docker compose up -d --build
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open http://localhost:8081 and paste the password.

## First-time setup

1. Choose **Install suggested plugins** and wait for it to finish.
2. Create the admin user.
3. Keep the Jenkins URL as `http://localhost:8081/` and finish.
4. Open **Manage Jenkins** (gear icon, top right), then **Plugins**, and make sure **Docker Pipeline** is installed.

## The `myapp-env` credential

The pipeline needs the app's `.env` file, which is never committed to git.

1. Copy `.env.example` to `.env` and fill in the values.
2. In Jenkins: **Manage Jenkins**, **Credentials**, **System**, **Global credentials (unrestricted)**, **Add Credentials**.
3. Set **Kind** to **Secret file**, choose the `.env` file, and set **ID** to exactly `myapp-env`.

If `.env` changes, update this credential too.

## Rollback

`scripts/rollback.sh` redeploys an earlier image tag and runs `scripts/smoke-test.sh`.

```bash
scripts/rollback.sh        # uses the tag saved after the last good deploy
scripts/rollback.sh 41     # rolls back to tag 41
```

How it works:

- After a deploy passes the smoke test, the pipeline saves the tag to `$JENKINS_HOME/last_good_tag`:
  `echo "$TAG" > "$JENKINS_HOME/last_good_tag"`
- If a later deploy fails, the pipeline calls `scripts/rollback.sh`.
- The script checks that the old `myapp/*` images still exist locally, then runs `docker compose up -d --no-build` with `TAG` set to the old tag.

Optional overrides: `STATE_FILE`, `ENV_FILE`, `COMPOSE_FILE`.

## Services with tests

The pipeline runs `docker build --target test` for each of these:

- service-a
- service-b

The frontend and proxy have no tests. M2 keeps this list up to date.

## Troubleshooting

| Problem | Fix |
|---|---|
| `localhost:8080` doesn't open Jenkins | Jenkins is on **8081**. Port 8080 belongs to the app |
| `bad interpreter` or `\r` errors in `rollback.sh` | The file has Windows line endings. Add `*.sh text eol=lf` to `.gitattributes` and re-checkout the file |
| `docker: command not found` inside a pipeline | Rebuild the Jenkins image: `docker compose up -d --build` in `infra/jenkins` |
| Pipeline can't find `myapp-env` | Check the credential ID is exactly `myapp-env` |
| Java 17 end-of-life warning | Change `lts-jdk17` to `lts-jdk21` in `infra/jenkins/Dockerfile` and rebuild. Data stays in the `jenkins_home` volume |

## Security notes

- Jenkins has access to the Docker socket, so it effectively controls Docker on the host. Use it on a local machine only.
- Never commit `.env`. It is listed in `.gitignore`.

Phase 6 automatic trigger test.

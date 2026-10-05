# Contact-Information-System

A contact manager split into three containerized modules behind one reverse proxy.

| Container | Role | Stack |
|---|---|---|
| `proxy` | Only entry point, port 8080 | nginx |
| `frontend` | Contact list, add/edit form, build label | React + Vite, served by nginx |
| `service-a` | Contacts API (reads/writes the database) | Node.js, Express |
| `service-b` | Validation service (phone/email) | Node.js, Express |
| `db` | Storage (named volume `db-data`) | MySQL 8 |

Routes: `/` frontend, `/api/contacts/` service-a, `/api/validate/` service-b.

## Run

```
cp .env.example .env      # then edit the passwords
docker compose up -d --build
```

Open http://localhost:8080. Check everything with `sh scripts/smoke-test.sh`.

## Tests

Each service has tests that need no database. Run them the way Jenkins does:

```
docker build --target test -t myapp/service-a:test ./service-a
docker build --target test -t myapp/service-b:test ./service-b
```

## Team and meeting schedule

(TODO: fill in members, roles and meeting times.)

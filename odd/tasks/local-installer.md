# Local installer

Objective: one-line `curl | bash` installer that runs the whole system locally with a demo user. Branch `feat/local-installer` (from origin/main 1b2c6fd); delivery `ask-on-risk`.
Runners: backend pytest in a scratch venv; frontend `npx vitest run`, lint `eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 130`, build; end-to-end with local `docker compose`.

## Specs

- S1: "crear un instalador para que cualquier persona pueda usar este sistema en local. Para ello me gustaria usar que la instalacion corra asi curl -fsSL https://raw.githubusercontent.com y que se instale el sistema completo en local"
- S2: "con un usuario y contraseña por defecto para demo"
- S3: password login exists "solo en locales": it is enabled only by an env flag the installer sets (`LOCAL_AUTH_ENABLED`). Without it the endpoint answers 404 and production keeps Google-only login.
- S4 (derived from S1): on an empty Postgres the backend creates the schema and the demo user on first boot, and later boots stay idempotent. This happens only when local auth is enabled.
- Assumption: the demo credentials are `demo@example.com` (the `.local` TLD fails email validation) / `demo1234`, printed by the installer and overridable by env. The app is served on `http://localhost:8080`.

## Tasks

- [ ] T1 S2-S3: backend `POST /auth/local/login` and `GET /auth/local/status`, gated by `LOCAL_AUTH_ENABLED`. Route inline. Risk: item 2 (auth).
- [ ] T2 S4: bootstrap script (create_all + alembic stamp + demo user) run by the entrypoint when local auth is on. Route inline.
- [ ] T3 S2: frontend login form shown only when `/auth/local/status` says enabled. Route inline.
- [ ] T4 S1: `install.sh`, `deploy/local/docker-compose.yml` and Caddyfile, plus an end-to-end run. Route inline.
- [ ] T5 S1: README install section. Route inline.

## Log

- L1 (2026-11-16) user: "ya lo veo, funciona bien, ahora me gustaria crear un instalador para que cualquier persona pueda usar este sistema en local. Para ello me gustaria usar que la instalacion corra asi curl -fsSL https://raw.githubusercontent.com y que se instale el sistema completo en local con un usuario y contraseña por defecto para demo"
- L2 user, on where password login lives: "solo en locales"
- L3 map:
  - Auth is Google-only. The JWT `sub` is the email, and `get_current_user` (`backend/app/core/dependencies.py`) looks the user up by email.
  - Alembic migrations assume an existing schema, so an empty DB fails `upgrade heads`.
  - The ghcr images are public and tagged `latest`. The frontend uses a relative `/api/v1`, so it needs a same-origin proxy.
  - MinIO is optional at boot. Docker is available locally for the end-to-end run.
  - Writer route: none of the units has a writer reason, so all run inline.

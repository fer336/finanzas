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

- [x] T1 S2-S3: backend `POST /auth/local/login` and `GET /auth/local/status`, gated by `LOCAL_AUTH_ENABLED`. Route inline. Risk: item 2 (auth). Commit 6b763c2.
- [x] T2 S4: bootstrap script (create_all + alembic stamp + demo user) run by the entrypoint when local auth is on. Route inline. Commits 0815163, c6a0fd7; receipts bucket added in a4f1cb6.
- [x] T3 S2: frontend login form shown only when `/auth/local/status` says enabled. Route inline. Commit 01ac6cc.
- [x] T4 S1: `install.sh`, `deploy/local/docker-compose.yml` and Caddyfile, plus an end-to-end run. Route inline. Commits 7e8970a (receipt URL guard, item 2) and a4f1cb6.
- [x] T5 S1: README install section. Route inline. Commit 31a4a9c.

## Log

- L1 (2026-11-16) user: "ya lo veo, funciona bien, ahora me gustaria crear un instalador para que cualquier persona pueda usar este sistema en local. Para ello me gustaria usar que la instalacion corra asi curl -fsSL https://raw.githubusercontent.com y que se instale el sistema completo en local con un usuario y contraseña por defecto para demo"
- L2 user, on where password login lives: "solo en locales"
- L3 map:
  - Auth is Google-only. The JWT `sub` is the email, and `get_current_user` (`backend/app/core/dependencies.py`) looks the user up by email.
  - Alembic migrations assume an existing schema, so an empty DB fails `upgrade heads`.
  - The ghcr images are public and tagged `latest`. The frontend uses a relative `/api/v1`, so it needs a same-origin proxy.
  - MinIO is optional at boot. Docker is available locally for the end-to-end run.
  - Writer route: none of the units has a writer reason, so all run inline.
- L4 T1: RED was a missing module (11 errors). GREEN: backend 37 passed. The app's error envelope uses `message`, not `detail`.
- L5 T2: on a throwaway Postgres, RED was `alembic upgrade heads` failing on an empty DB. GREEN: the bootstrap created 15 tables, stamped heads and created the demo user; the second run was a no-op, `upgrade heads` then passed, and an empty password exits 1. Alembic's fileConfig disabled the script's logger, so it now uses print.
- L6 T3: RED was a missing module. GREEN: 5 gate/form tests; frontend 212 passed, lint 75 warnings (same as base), build OK.
- L7 T4:
  - MinIO no longer publishes images on Docker Hub or quay. Switched to `cgr.dev/chainguard/minio:latest` (distroless), and the bucket plus its anonymous-read policy are created by the bootstrap.
  - Production builds rejected `http:` receipt URLs. A local install page on http://localhost now accepts same-origin http receipts (RED 1 failing, GREEN 214).
  - `yfinanceService` now falls back to the same origin instead of `:8000`.
  - End-to-end through the installer with locally built images:
    - Bootstrap logs show the schema, demo account and bucket were created.
    - The home page returns 200 without CSP/HSTS. Bad login returns 401; good login returns a token.
    - 18/19 list GETs return 200; `/estadisticas` returns 422 because it requires params.
    - Creating a pago, uploading a PDF, fetching it anonymously (200 application/pdf) and patching the receipt all work.
    - Re-running the installer keeps `.env` and the port, and the bootstrap is a no-op.
  - Headless UI: the form replaces the Google button, the wrong-password alert shows, login reaches the dashboard, Vencimientos lists the pago, and the eye opens the receipt dialog. shellcheck is clean.
- L8 independent verifier: PASS on S1-S4 and the assumption, no blockers.
  - Fixed advisories: entrypoint now matches the flag case-insensitively, and the installer refuses a directory containing `.git` (d118bf1, shellcheck clean).
  - Advisories deferred: unquoted special characters in `DEMO_PASSWORD` within `.env`; no login rate limit (bound to 127.0.0.1); `chainguard/minio:latest` is unpinned and runs as root; a partial schema without `usuarios` would be masked by create_all and stamp; the yfinance fallback is same-origin on other hosts.
- L9 native review: assessed high (item 2 escalated); the user declined this candidate ("Omitir esta vez"), declined_this_candidate.
- L10 the installer pulls `:latest` images, so it only works after a release publishes images that contain this branch.

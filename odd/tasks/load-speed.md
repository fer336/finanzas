# Load speed

Objective: make the app load and respond fast, fixing measured causes first. Branch `perf/load-speed` (from origin/main a4d3709); delivery `ask-on-risk`.
Runners: frontend `npx vitest run`, plus lint `eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 130` and build. Backend: pytest in a scratch venv; CI only checks import and deps.

## Specs

- S1: "ahora me gustaria que revises porque va tan lento, podrias quitar las imagenes de kanagawa para que el sistema vaya mas rapido, o primero analiza el porque van lento y mejoralo"
- S2 (measured cause): the backend never blocks its single uvicorn worker inside a request. Handlers that do sync DB or HTTP work run in the threadpool (`def`), so the dashboard's parallel requests are served concurrently.
- S3 (measured cause): opening the app does not call the Yahoo CEDEARs endpoint. CEDEAR data loads only on the views that use it.
- S4 (measured cause): no 307 redirect round trips for `/presupuestos/active`, `/objetivos/active` and `/balance-inicial/neto` as the frontend calls them, with a trailing slash.
- S5 (measured cause): dark-mode cards do not blur the fixed background on every frame. `backdrop-filter` is removed from cards, and the leftover violet card gradient follows the palette.
- S6 (measured cause): the dashboard's derived data is memoized, so a re-render does not rescan every transaction.
- S7: `.webp` assets get the same long cache as other static assets.
- Assumption: the Kanagawa images stay. They weigh about 150 KB per view and are cached; their render cost came from the blur (S5).

## Tasks

- [x] T1 S2: CEDEARs/yfinance handlers become `def`. Route inline. Commit bf45ab1.
- [x] T2 S2: every `async def` router handler that never awaits becomes `def` (AST-checked). Route inline. Risk item 4, so it gets an independent verifier.
- [x] T3 S4: add trailing-slash aliases for the three routes. Route inline.
- [x] T4 S3: load CEDEARs lazily by view. Route inline.
- [x] T5 S5-S7: drop the card blur and fix the gradient, memoize the dashboard hook, add `.webp` to the nginx cache rule. Route inline.

## Log

- L1 (2026-11-14) user: "ahora me gustaria que revises porque va tan lento, podrias quitar las imagenes de kanagawa para que el sistema vaya mas rapido, o primero analiza el porque van lento y mejoralo"
- L2 measurements:
  - Startup JS is about 215 KB gzip, and heic2any (333 KB gz) and cuota-alimentaria (162 KB gz) are already lazy. Kanagawa images are about 315 KB in total, and about 150 KB load per view.
  - Uvicorn runs with `--workers 1` (`scripts/entrypoint.sh:33`), and most handlers are `async def` doing sync DB work.
  - `get_cedears` is `async def` and makes up to 30 sequential `requests.get` calls (10 s timeout) plus `time.sleep(1.5)` (`yfinance_router.py:152,373`). The frontend calls it on mount (`ModernMissionControl.jsx:281`).
  - The dark `.kanagawa-card` uses `backdrop-filter: blur(12px)` over a `position: fixed` background.
- L3 deferred (not in scope unless asked):
  - Transactions load with `limit=1000`.
  - Dollar quotes poll every 60 s.
  - Every view's hooks are fetched up front.
  - Objetivos and presupuestos have N+1 queries.
- L4: backend tests in a scratch venv.
  - RED: `/health` waited 1.10 s behind a simulated CEDEARs download. The structural guard found 83 non-awaiting async handlers, and the 3 slash paths returned 307.
  - Converted 83 handlers. 9 stay async because they really await (OAuth, upload, `to_thread`). Converted handlers that call `UserRepositoryPG` async methods: none.
  - GREEN: backend 25 passed, `import main` OK. Commit bf45ab1.
- L5: frontend.
  - `useCedearsForView` loads only on the cedears and inversiones views (RED: import missing; GREEN: 5 tests).
  - `useDashboardHomeData` is wrapped in `useMemo` (RED: a new object on every render; GREEN).
  - The dark card has no backdrop blur and uses palette gradients. Only `.dark` rules changed.
  - nginx now caches `.webp`.
  - Suite 201/201. Lint shows the same 75 warnings as the base (0 errors). Build OK.

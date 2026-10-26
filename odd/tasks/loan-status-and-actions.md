# Loan Status and Row Actions

Repository locator: `odd/tasks/loan-status-and-actions.md`

## Objective

Make receipt/document actions visually stable across Pending Payments and Loans, and hide paid loans by default while keeping them searchable through explicit status filters.

## Problem

Pending Payment rows shift their edit/delete actions when a document icon is present, actions rely too heavily on hover, and Loans do not expose their stored receipt at all. Loans also fetch every status by default, so paid loans remain in the main working list. Loan search only checks `nombre_fuente` and is limited to the currently loaded client dataset.

## Why

Users need predictable row actions and a focused active-loan list. Paid loans remain useful as history, but should not compete with current obligations.

## Scope

- Unify document, edit, delete, and mark-paid action layout across Pending Payments and Loans.
- Add safe receipt preview support to Loans using the existing document URL policy and preview modal.
- Provide responsive Loan cards equivalent to the Pending Payments mobile pattern.
- Add Loan status filters: Pending, Paid, All; default to Pending.
- Search Loans by source name and notes.
- Apply status and search filtering server-side so results remain complete beyond one client page.
- Add focused frontend and backend regression tests.

## Non-goals

- Redesign the full Vencimientos page or its KPI hierarchy.
- Add receipt download/delete operations beyond the existing preview modal behavior.
- Change payment registration business rules.
- Add new loan states or migrate legacy state values.
- Push, open a pull request, or merge.

## Constraints

- Preserve the Kanagawa Violet design system and semantic tokens from `DESIGN.md`.
- Document URLs must continue through `normalizeDocumentPreviewUrl` before rendering.
- Actions must remain usable with mouse, keyboard, and touch; no hover-only controls.
- Paid loans must never show “Marcar pagado”.
- Technical artifacts and code remain in English; existing Spanish UI copy stays consistent with the product.
- No commit is authorized yet; implementation may proceed on `feat/loan-status-and-actions`, but commits require explicit user authorization.

## Delivery

- Branch: `feat/loan-status-and-actions`
- Strategy: `auto-chain`
- Chain strategy: `feature-branch-chain` (explicitly selected by the user).
- Forecast: 420–560 authored changed lines, mostly tests and responsive UI.
- Planned review slices:
  1. Shared stable row actions and Loan receipt preview.
  2. Server-backed Loan status/search filters and final feature evidence.
- Commit authorization: granted by the user on 2026-10-26.
- Push, pull request creation, and merge remain unauthorized.

## Tasks

### T1 — Unify row actions and receipt preview

Status: done
Route: delegated writer; multi-file UI and tests trigger.

- Add failing frontend tests for stable action slots, visible keyboard/touch actions, Loan receipt preview, invalid receipt URLs, and paid-row behavior.
- Extract the smallest shared row-action/document affordance that keeps fixed document/edit/delete slots.
- Use fixed-size icon buttons and reserve the document slot when no valid document exists.
- Keep “Marcar pagado” visually separate as the primary row action.
- Add Loan mobile cards and reuse `DocumentPreviewModal` plus the existing URL normalizer.
- Replace touched hardcoded action colors with existing semantic tokens.

Acceptance:

- Edit and delete controls stay aligned whether or not a document exists.
- Pending Payments and Loans share the same action order: document, edit, delete.
- Controls are visible and operable without hover.
- Loan receipts open only when the normalized URL is valid.
- Paid rows omit “Marcar pagado”.
- Desktop and mobile layouts remain readable without horizontal action overflow.

Checks:

- Focused Vitest tests for Pending Payments, Loans, shared action component, and document preview.
- Structural accessibility assertions for labels and focusable controls.
- Frontend build after GREEN/refactor.

Evidence:

- RED observed: focused Vitest run failed for the missing shared action component, Loan action labels/slots, and mobile cards.
- GREEN observed: `npm test -- ModernPendingPaymentsView.test.jsx ModernPrestamosSection.test.jsx PaymentRowActions.test.jsx` passed 13 tests.
- Independent verification repeated the same 13 tests and `npm run build`; both passed.
- Parent spot check: `npm test -- PaymentRowActions.test.jsx` passed 2 tests.
- Existing warnings only: deprecated Vite CJS API, stale browser mapping data, and large production chunks.
- Manual browser viewport verification remains assigned to T4.
- Native ASSESS was unavailable because the package-local binary was missing, so independent verification was required and completed.

Commit: pending explicit authorization.

### T2 — Add server-backed Loan filters and search

Status: done
Route: delegated writer; frontend/backend multi-file behavior and tests trigger.

- Add failing backend tests for `estado`, source-name search, notes search, combined filters, user isolation, and page totals.
- Add failing frontend tests for default Pending, Paid, All, search behavior, query-key isolation, and post-payment disappearance.
- Extend the Loan repository/router with normalized status and search parameters over `nombre_fuente` and `notas`.
- Extend `prestamosApi.getAll` and `usePrestamos` to accept filter inputs and include them in the React Query key.
- Preserve `pageInfo` rather than discarding it.
- Add the status selector beside Loan search; default to Pending.
- Reset the visible page/result window when status or search changes.
- Keep KPIs based on pending loans only.

Acceptance:

- Initial Loan view requests and displays Pending loans only.
- Paid and All filters return the correct server-filtered records.
- Search matches source names and notes case-insensitively.
- Combining search and status produces correct totals and rows.
- Marking a loan paid invalidates queries and removes it from Pending while retaining it in Paid/All.
- User isolation remains enforced.

Checks:

- Focused backend tests for Loan listing filters.
- Focused frontend Vitest tests for API, hook, and Loan section behavior.
- Frontend build and relevant backend suite after GREEN/refactor.

Evidence:

- Frontend RED observed for the missing options API, discarded metadata, and array-only Loan data handling.
- Backend RED could not initially start because the repository does not declare or provide pytest.
- GREEN: `npm test -- ModernPrestamosSection.test.jsx api.prestamos.test.js useFinancialData.prestamos.test.jsx` passed 7 tests.
- GREEN: `npm run build` passed with the existing Vite/browser-data/large-chunk warnings.
- Independent backend verification used an isolated temporary environment and `pytest -q tests/test_prestamo_repository_pg.py` passed 3 tests.
- Parent spot check repeated the backend test: 3 passed with existing Pydantic, SQLAlchemy, and Passlib deprecation warnings.
- `git diff --check` passed.
- Native ASSESS remained unavailable because the package-local binary was missing; independent verification was completed.
- Temporary verification environment `/tmp/finanzas-pytest-verify` was removed after full backend regression.

Commit: pending explicit authorization.

### T3 — Run automated regression and structural responsive verification

Status: done
Route: delegated verifier; command-running verification trigger.

- Run the focused frontend test files and backend Loan tests.
- Run frontend lint/build within repository policy.
- Run the applicable broader backend test target.
- Verify desktop and mobile action alignment, empty states, light/dark themes, keyboard focus, invalid documents, and each Loan filter.
- Record every failed, skipped, or unavailable check.

Acceptance:

- All applicable automated checks pass.
- No known regression in Pending Payment filters, pagination, payment registration, or document preview.
- Manual/browser verification covers the screenshot’s action-column alignment concern.

Checks:

- Full frontend Vitest suite.
- Frontend lint and production build.
- Full backend test suite in an isolated temporary environment.
- `git diff --check` and structural accessibility/responsive inspection.

Evidence:

- `npm test`: 14 files and 110 tests passed.
- `npm run lint`: passed with 0 errors and 77 existing warnings.
- `npm run build`: passed with existing Vite/browser-data/large-chunk warnings.
- Full backend suite: 20 tests passed after installing repository-declared test runtime dependencies only in `/tmp`.
- `git diff --check`: passed.
- Structural inspection confirmed fixed action slots, visible keyboard/touch actions, invalid-document handling, paid-row behavior, filters, search states, pagination, and semantic tokens.
- No feature-related regression was observed.
- Temporary verification environment was removed.

Commit: not applicable unless verification requires a source correction.

### T4 — Run authenticated browser viewport verification

Status: done
Route: delegated verifier after user authorized a temporary Playwright/Chromium install.

- Verify actual desktop and mobile action alignment against the supplied screenshot.
- Verify light/dark themes, keyboard focus, filter transitions, empty states, and receipt modal behavior with authenticated data.

Acceptance:

- No action-column shift with or without receipts at desktop and mobile widths.
- No clipping or horizontal overflow in Loan cards/table actions.
- Focus and filter state remain visually clear in both themes.

Checks:

- Temporary Playwright/Chromium run at desktop `1440×1000` and mobile `390×844`.
- Deterministic mocked backend, dollar-rate, and S3 requests; no real credentials or authenticated external services.
- DOM geometry assertions for action alignment and page overflow.
- Functional assertions for filters, search, receipt preview, invalid receipts, and paid-row actions.

Evidence:

- Both desktop and mobile passed all assertions.
- No page-level horizontal overflow was observed.
- Desktop edit X positions were `1153, 1153, 1153`; delete X positions were `1189, 1189, 1189`.
- Mobile edit X positions were `67, 67, 67`; delete X positions were `103, 103, 103`.
- Alignment spread was `0px` with and without receipts.
- Pending was the default; Paid and All filters returned expected rows.
- Source/notes search, empty state, valid receipt preview, invalid receipt suppression, and paid-row behavior passed.
- Parent visually inspected the desktop and mobile screenshots; actions remained aligned and unclipped.
- Temporary Playwright workspace was removed. Existing shared Playwright browser caches were left untouched.

### T5 — Package reviewable work-unit commits

Status: done
Route: parent-owned Git staging and commit operation after explicit user authorization.

- Split the implementation into two coherent Conventional Commits without including `.codegraph/`.
- Keep tests with the behavior each commit introduces.
- Record commit identities and exact slice boundaries.
- Do not push or create pull requests.

Acceptance:

- Each commit is independently understandable and reviewable.
- No unrelated untracked files are staged.
- Working tree retains only intentionally uncommitted artifacts, if any.

Evidence:

- First work unit reconstructed on a clean worktree and independently verified with 14 focused tests, production build, `git diff --check`, and a parent spot check.
- First commit: `e37f288` (`feat(loans): add stable actions and receipt previews`).
- First commit authored diff: 287 additions and 189 deletions across five frontend files.
- Second work unit committed the verified filters/search/backend behavior, final integration refinements, tests, and feature evidence.
- Second commit identity is reported in the delivery response rather than embedded here because a commit cannot contain its own final hash.

## Progress

- 2026-10-25: User confirmed the design plan and authorized implementation.
- 2026-10-25: Created feature branch `feat/loan-status-and-actions`.
- 2026-10-25: T1 completed with RED/GREEN evidence, independent verification, and parent spot check.
- 2026-10-25: T2 completed with 7 focused frontend tests, 3 backend tests, build verification, and parent backend spot check.
- 2026-10-25: T3 completed with 110 frontend tests, lint, build, 20 backend tests, diff checks, and structural responsive/accessibility inspection.
- 2026-10-25: T4 completed with mocked authenticated Playwright checks at desktop and mobile viewports; geometry alignment spread was 0px.
- User selected `feature-branch-chain` for future delivery and explicitly authorized preparing two commits.
- First work-unit commit created: `e37f288`.
- Second work-unit commit created and amended with final task evidence.
- All implementation, verification, browser, and commit-packaging tasks are complete.

## Next Step

Remove the temporary split worktree, report both commit identities, and leave push/PR creation untouched.

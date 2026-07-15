# Coding Standards — Athlete Travel Tracking System

**Stack:** React + Tailwind CSS (frontend) · Node.js/Express (backend) · MySQL · JWT auth · WebSockets (real-time sync)

---

## 1. Guiding Principles

1. **Consistency over cleverness.** Anyone on the team should be able to read any file without guessing conventions.
2. **Fail loud, fail early.** Validate input at the boundary (API layer), not deep in business logic.
3. **No silent data loss.** This app drives visa/travel decisions — a swallowed error or a missed status update is a real-world problem, not just a bug.
4. **Every write is auditable.** Given the Activity Log requirement, mutations should be traceable to a user, action, and timestamp by construction, not bolted on later.
5. **Real-time means race-aware.** Multiple staff can edit the same athlete record concurrently — design for that, don't assume single-user access.

---

## 2. Project Structure

```
/client                     # React app
  /src
    /components              # Reusable, presentational (Button, ProgressBar, StatusBadge)
    /features                # Feature-scoped: /features/athletes, /features/dashboard, /features/reports
      /athletes
        AthleteList.jsx
        AthleteDetail.jsx
        athleteApi.js         # API calls for this feature
        athleteSlice.js        # State (if using Redux/Zustand)
    /hooks                   # Shared custom hooks (useAuth, useSocket, useDebounce)
    /lib                     # Utilities, formatters, constants
    /pages                   # Route-level components
    /context                 # React Context providers (Auth, Theme)

/server
  /src
    /modules                 # Feature-scoped: /modules/athletes, /modules/requirements, /modules/reports
      /athletes
        athlete.controller.js
        athlete.service.js     # Business logic
        athlete.repository.js  # DB queries
        athlete.routes.js
        athlete.validation.js  # Joi/Zod schemas
    /middleware               # auth, error handler, request logger, rate limiter
    /db
      /migrations
      /seeds
      pool.js                 # MySQL connection pool
    /sockets                  # WebSocket event handlers
    /jobs                     # Scheduled tasks (visa reminders, notification digest)
    /utils
    app.js
    server.js
```

**Rule:** organize by *feature*, not by *type*, at the top level (`/athletes` not scattering athlete code across generic `/controllers`, `/services`). Within a feature, split by type (controller/service/repository) so business logic never touches SQL directly.

---

## 3. Naming Conventions

| What | Convention | Example |
|---|---|---|
| Files (React components) | PascalCase | `AthleteDetail.jsx` |
| Files (everything else — services, utils, hooks) | camelCase | `athleteService.js`, `useAuth.js` |
| Variables & functions | camelCase | `getAthleteProgress()` |
| React components & classes | PascalCase | `ProgressBar` |
| Constants (true constants, not config) | UPPER_SNAKE_CASE | `MAX_PRIORITY_LEVEL` |
| Database tables | snake_case, plural | `athletes`, `travel_requirements` |
| Database columns | snake_case | `passport_number`, `departure_date` |
| REST routes | kebab-case, plural nouns | `/api/athletes/:id/requirements` |
| Env vars | UPPER_SNAKE_CASE | `DB_HOST`, `JWT_SECRET` |
| Boolean vars/props | `is`/`has`/`can` prefix | `isReadyForTravel`, `hasVisaAppointment` |

No abbreviations that aren't obvious (`athleteId` not `athId`; `requirement` not `req` — reserve `req`/`res` for Express handler params only).

---

## 4. JavaScript/Node Style

- **ES Modules** (`import`/`export`) throughout, both client and server — no mixing with `require`.
- **`async/await` only** — no raw `.then()` chains, no callback-style APIs in new code.
- **Always `try/catch` at the boundary.** Every controller wraps its logic; unhandled promise rejections are not acceptable.
- Prefer **named exports**; use default exports only for React components and route/module entry points.
- No `var`. `const` by default, `let` only when reassignment is required.
- Destructure request data at the top of handlers: `const { fullName, passportNumber } = req.body;`
- **Enforce with tooling, not code review memory:** ESLint (`eslint:recommended` + `airbnb-base` or `standard`) + Prettier, run via a pre-commit hook (Husky + lint-staged). If the linter allows it, the reviewer shouldn't have to say it.

### Error handling pattern
```js
// server/src/modules/athletes/athlete.controller.js
export async function updateRequirement(req, res, next) {
  try {
    const { athleteId, requirementId } = req.params;
    const result = await athleteService.updateRequirement(
      athleteId, requirementId, req.body, req.user
    );
    res.json(result);
  } catch (err) {
    next(err); // centralized error middleware — never send raw error objects to the client
  }
}
```
A single `errorHandler` middleware maps known error types (validation, not-found, forbidden) to correct status codes, and logs unexpected errors with stack traces server-side only.

---

## 5. API Design

- RESTful resource routes: `GET /api/athletes`, `POST /api/athletes`, `PATCH /api/athletes/:id`, `DELETE /api/athletes/:id`.
- Sub-resources nest: `PATCH /api/athletes/:id/requirements/:requirementId`.
- **Every request is validated against a schema** (Joi or Zod) before it reaches business logic — reject with `400` and a field-level error list on failure.
- **Every mutating route requires auth** (`JWT` middleware) and a role check (`Administrator` vs `Staff`) — deny by default, allow explicitly.
- Consistent response envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {...} } }
```
- Pagination on all list endpoints: `?page=1&limit=25`, response includes `total`, `page`, `pageCount`.
- Never trust `role` or `userId` from the request body — always derive from the verified JWT.

---

## 6. Database (MySQL)

- **Migrations only** — no manual schema edits against shared databases. Every schema change is a versioned migration file, checked into git.
- Every table: `id` (auto-increment PK), `created_at`, `updated_at` (both `DATETIME`, defaulted/managed by the app or `ON UPDATE CURRENT_TIMESTAMP`).
- Foreign keys are explicit and indexed: `athlete_id INT, FOREIGN KEY (athlete_id) REFERENCES athletes(id)`.
- **Never build SQL by string concatenation.** Always parameterized queries (`?` placeholders) via `mysql2`, or a query builder (Knex) — this is a hard rule, not a preference, given this handles passport numbers and personal data.
- Wrap multi-table writes (e.g., updating a requirement *and* writing to the activity log) in a transaction, so a partial failure never leaves inconsistent state.
- Use a connection pool (`mysql2/promise` `createPool`), never a single long-lived connection.
- Soft-delete for athlete records (`deleted_at` column) rather than hard delete, so historical reports and activity logs stay intact.

---

## 7. Frontend (React + Tailwind)

- **Function components + hooks only.** No class components in new code.
- Keep components small and presentational; push data-fetching and business logic into hooks (`useAthletes()`, `useRequirements(athleteId)`) or a service layer, not inline in JSX.
- Co-locate feature state near the feature (`/features/athletes`), not in one giant global store, unless it's genuinely cross-cutting (auth, theme, socket connection — those go in Context or a lightweight global store like Zustand).
- **Tailwind:** use it directly in JSX; avoid `@apply`-heavy custom CSS files except for truly global/base styles. Extract a component (`<StatusBadge status={status} />`) instead of repeating long className strings — repetition is the signal to extract, not to `@apply`.
- Derive status/progress from data, don't store it redundantly in component state where it can drift from the source of truth (e.g., compute `progressPercent` from `requirements`, don't set it manually).
- Loading, empty, and error states are required for every data-fetching component — not just the happy path (this is a dashboard people check before a flight; a silent blank screen is a real failure mode).
- Accessibility: semantic HTML, labeled form fields, sufficient color contrast for status colors (don't rely on color alone to convey "missing requirement" — pair with an icon/text).

---

## 8. Real-Time Sync (WebSockets)

- Namespace socket events by resource: `athlete:updated`, `requirement:updated`, `notification:sent`.
- Server is the source of truth: clients don't apply optimistic updates that skip server confirmation for anything that affects the audit trail — update UI optimistically for snappiness, but reconcile with the server event, don't trust the local guess.
- Every socket-emitted mutation also goes through the same service/validation layer as the REST endpoint — no separate, unvalidated write path via sockets.
- Reconnect logic: on reconnect, re-sync current view's data via a REST fetch rather than assuming no events were missed.

---

## 9. Security

- Passwords: hashed with bcrypt (cost factor ≥ 10), never logged, never returned in any API response.
- JWT: short-lived access token + refresh token pattern; secrets in environment variables, never committed.
- All input sanitized/validated server-side regardless of client-side validation (client-side is UX only, never trust it as the security boundary).
- Rate-limit auth endpoints (`express-rate-limit`) to blunt brute-force attempts.
- CORS configured explicitly for known origins — no `*` in production.
- `.env` files are gitignored; a `.env.example` documents required vars without real values.
- Passport numbers and personal data: no logging of full field values in application logs (log the athlete ID, not the passport number).

---

## 10. Activity Log & Audit Trail

Since every action must be recorded (user, date, time, action):

- Implement as a service-layer concern, not scattered `INSERT` calls: `activityLogService.record({ userId, action, entityType, entityId, details })`, called from within the same transaction as the mutation it's logging.
- Standardize action strings: `requirement.completed`, `requirement.updated`, `athlete.created`, `notification.sent`, `status.changed` — not free-text descriptions, so reports/filters stay reliable.
- Activity log entries are immutable — no update/delete endpoints for this table.

---

## 11. Git Workflow

- **Branches:** `feature/athlete-detail-page`, `fix/progress-calculation-rounding`, `chore/eslint-setup`.
- **Commits:** imperative mood, scoped — `feat(athletes): add requirement checklist component`, `fix(api): correct progress percent rounding`. Follow Conventional Commits (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`) so a changelog can be generated later.
- **PRs required for `main`** — no direct pushes, even solo. At minimum: description of what/why, linked issue if applicable, screenshot for UI changes.
- Squash-merge to keep history readable.

---

## 12. Testing

- Unit tests for business logic (progress calculation, status derivation) — these have exact spec'd thresholds (0%, 1–40%, 41–80%, 81–99%, 100%), so they're easy to test and easy to silently break; cover the boundary values explicitly.
- Integration tests for API endpoints covering auth (rejected without token), validation (rejected on bad input), and the happy path.
- Don't aim for 100% coverage from day one — prioritize the progress/status calculator, requirement CRUD, and auth middleware first, since those are the highest-consequence pieces.

---

## 13. Documentation

- Every module gets a short `README.md` if its purpose isn't obvious from the file names.
- API endpoints documented (OpenAPI/Swagger comment blocks or a Postman collection checked into the repo) — this matters more here than usual since three different users (admin/staff) hit overlapping endpoints with different permissions.
- Non-obvious business rules get a one-line comment at the point of implementation (e.g., *why* progress rounds down vs up), not just in a wiki someone won't find.

---

## 14. Code Review Checklist

- [ ] Input validated server-side (not just client-side)
- [ ] Mutating endpoint checks role/permission, not just "is logged in"
- [ ] SQL is parameterized — no string-built queries
- [ ] Multi-step writes wrapped in a DB transaction
- [ ] Activity log entry written for any create/update/delete of tracked data
- [ ] Loading/empty/error states handled in any new UI component
- [ ] No secrets, passport numbers, or full personal data in logs
- [ ] Lint/format passes cleanly (should be enforced by pre-commit, but verify)
- [ ] Tests added/updated for changed business logic

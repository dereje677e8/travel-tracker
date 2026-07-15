# Athlete Travel Tracking System

Full-stack app for tracking travel-readiness of athletes, coaches, and officials
heading to international competitions. Tracking only — no documents are
uploaded or stored, just completion status per requirement.

**Stack:** React + Tailwind (client) · Node.js/Express (server) · MySQL · JWT auth
· Socket.io (real-time) · ExcelJS/PDFKit (reports) · Nodemailer + WhatsApp Business API (notifications)

This was built and smoke-tested end-to-end against a real MySQL instance in the
build environment (migrations, seed data, auth, CRUD, requirement updates,
role checks, Excel/PDF export all verified working) — see "What's been tested"
below for exactly what that covered.

## 1. Prerequisites

- Node.js 18+
- MySQL 8.0+ (local install, Docker, or a managed instance)

## 2. Backend setup

```bash
cd server
cp .env.example .env
```

Edit `.env` — at minimum set `DB_USER` / `DB_PASSWORD` to match your MySQL setup,
and change `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to random strings.

Create the database and a user matching your `.env` (adjust as needed):

```sql
CREATE DATABASE athlete_travel_tracker;
CREATE USER 'attp_user'@'127.0.0.1' IDENTIFIED BY 'attp_dev_password';
GRANT ALL PRIVILEGES ON athlete_travel_tracker.* TO 'attp_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Then:

```bash
npm install
npm run migrate   # creates all tables
npm run seed      # creates admin/staff1/staff2 + 3 demo athletes
npm run dev       # starts on http://localhost:4000
```

Seeded logins (from `.env` `SEED_ADMIN_*` + hardcoded staff in the seed script):
- **Admin:** `admin@attp.local` / `ChangeMe123!`
- **Staff 1:** `staff1@attp.local` / `ChangeMe123!`
- **Staff 2:** `staff2@attp.local` / `ChangeMe123!`

Change these passwords (via the Users page as admin, or directly) before any
real use.

## 3. Frontend setup

```bash
cd client
cp .env.example .env   # VITE_API_URL=http://localhost:4000 by default
npm install
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173 and log in with the admin credentials above.

## 4. Notifications (optional — work without these, just logged instead of sent)

- **Email:** fill in `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` /
  `SMTP_FROM` in `server/.env`. Without these, the app logs the email content
  instead of sending it (useful for local dev) rather than failing.
- **WhatsApp:** fill in `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
  from a Meta Business/WhatsApp Cloud API app. Same fallback behavior without them.

## 5. What's been tested (in this build environment)

Verified against a real, freshly-installed MySQL 8.0 instance, not just
syntax-checked:
- Migrations run cleanly (`npm run migrate`) and are idempotent (safe to re-run)
- Seed script creates admin/staff/demo data correctly
- Login → JWT issuance → authenticated request round-trip, through the actual
  Vite dev proxy (i.e. exactly the path the browser takes)
- Athlete creation, requirement status updates, and progress/status
  auto-recalculation (spot-checked against the spec's thresholds)
- Zod validation rejects bad input (e.g. return date before departure date)
  with field-level errors
- Role enforcement (staff correctly blocked from deleting an athlete)
- Excel and PDF report generation (both produce valid, correctly-typed files)
- Full frontend production build (`npm run build`) completes without errors

**Not exercised end-to-end** (would need real external credentials/browser):
- Actual email/WhatsApp delivery (code path is complete; falls back to logging
  without configured credentials — see section 4)
- Live browser rendering/interaction — the UI was built and reviewed
  carefully against the spec, and the API layer it depends on is fully
  verified, but click-through QA in an actual browser is worth doing before
  relying on it for a real trip.

## 6. Project structure

See `CODING_STANDARDS.md` for the full conventions this codebase follows —
folder structure, naming, error handling, the audit-log pattern, etc.

```
server/   Express API — see server/src/modules/* for each feature
client/   React app — see client/src/{pages,features,components}
```

## 7. Known gaps / next steps

- No automated test suite yet (unit tests for the progress/status calculator
  and integration tests for auth + CRUD are the highest-value first additions
  — see CODING_STANDARDS.md section 12).
- No production deployment config (Docker/CI) — this is a local-dev-ready
  codebase, not yet a deploy-ready one.
- Password reset flow isn't implemented (admin can currently only create
  users, not reset a forgotten password without DB access).
- The visa reminder cron job (`server/src/jobs/visaReminder.job.js`) currently
  only logs; wire it into `notifications.service.js` if you want automatic
  (not just admin-triggered) reminders.

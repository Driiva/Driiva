# Migration Guide: Neon PostgreSQL

This guide explains how to run the Driiva schema against a Neon PostgreSQL instance and remove SQLite from the stack.

## Architecture (after migration)

- **Firestore**: Real-time telematics (trips, GPS points, driving scores). Keep for live trip tracking.
- **PostgreSQL (Neon)**: Structured data: users, onboarding status, policies, trip summaries, community pool. Single source of truth for profiles and API-facing data.

## 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Create a database (e.g. `driiva`) and note the connection string.
3. Copy the connection string; it looks like:
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

## 2. Run the schema

From the project root:

```bash
# Option A: psql (if installed)
psql "$DATABASE_URL" -f migrations/schema.sql

# Option B: Neon SQL Editor
# Paste the contents of migrations/schema.sql into the Neon dashboard SQL Editor and run.
```

Or set `DATABASE_URL` in `.env` and run:

```bash
export DATABASE_URL="postgresql://..."
psql "$DATABASE_URL" -f migrations/schema.sql
```

## 3. Configure the app server

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Neon connection string (no `file:./dev.db`).
3. (Optional) For Firebase ID token verification (e.g. `/api/profile/me`), set one of:
   - `GOOGLE_APPLICATION_CREDENTIALS` to the path of your Firebase service account JSON, or
   - `FIREBASE_SERVICE_ACCOUNT_KEY` to the JSON string of the service account.

## 4. Configure Cloud Functions

Sync triggers need access to the same Neon database:

```bash
cd functions
# Set Neon URL in Firebase config (for deployed functions)
firebase functions:config:set db.url="postgresql://user:password@host/db?sslmode=require"
```

For local emulator, set `DATABASE_URL` in `functions/.env` (or in the shell before running).

Redeploy functions after adding the new triggers:

```bash
npm run build
firebase deploy --only functions
```

## 5. Verify

- **Signup**: New Firebase Auth user → `syncUserOnSignup` creates a row in `users` (or use GET `/api/profile/me` to create on first load).
- **Onboarding**: Quick onboarding calls PATCH `/api/profile/me` with `onboardingComplete: true`; AuthContext reads onboarding from GET `/api/profile/me` (PostgreSQL).
- **Trip completion**: When a trip in Firestore becomes `completed`, `syncTripOnComplete` writes a row to `trips_summary`.

## 6. No SQLite

- `DATABASE_URL` must be a PostgreSQL URL. The server rejects `file:` and `dev.db`.
- Remove any local `dev.db` file; it is no longer used.

## Schema overview

- **users**: `firebase_uid`, `email`, `display_name`, `onboarding_complete`, plus legacy fields.
- **trips_summary**: Synced from Firestore on trip completion; used by API.
- **policies**: Optional; for structured policy data.
- **community_pool**: Pool ledger.
- Other tables (e.g. driving_profiles, trips, leaderboard) remain for existing API behavior.

# Setup: Neon + Server + Cloud Functions

Quick checklist after the database-architecture changes. Do these in order.

---

## 1. Neon

1. **Create project & DB** at [neon.tech](https://neon.tech).
2. **Copy connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. **Run schema** (from project root):
   ```bash
   export DATABASE_URL="postgresql://..."   # your Neon URL
   psql "$DATABASE_URL" -f migrations/schema.sql
   ```
   Or paste `migrations/schema.sql` into Neon’s SQL Editor and run.

---

## 2. Server (.env)

1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Set in `.env`:
   - `DATABASE_URL` = your Neon connection string (no `file:./dev.db`).
3. (Optional) For `/api/profile/me` token verification, set one of:
   - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json`
   - `FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'`

Dependencies are already installed (`npm install` done). Start server:

```bash
npm run dev
```

---

## 3. Cloud Functions

1. **Config** (use your Neon URL):
   ```bash
   cd functions
   firebase functions:config:set db.url="postgresql://user:pass@host/db?sslmode=require"
   ```
2. **Build & deploy**:
   ```bash
   npm run build
   firebase deploy --only functions
   ```

Dependencies are already installed (`npm install` in `functions/` done).

---

## 4. Verify

Run through the six checks in **[VERIFY_FLOWS.md](./VERIFY_FLOWS.md)**:

1. Server rejects SQLite  
2. Sign up → see user in `users` (or run `npm run verify:db`)  
3. Complete onboarding → `onboarding_complete = true` in Neon  
4. Sign in again → routing by onboarding status  
5. (Optional) Complete trip → row in `trips_summary`  
6. (Optional) GET `/api/profile/me` with token  

For full schema and architecture details, see [MIGRATION_NEON.md](./MIGRATION_NEON.md).

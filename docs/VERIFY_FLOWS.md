# End-to-end verification: Neon + Firebase flows

Use this after setting **Neon**, **.env**, and **Functions config** to confirm each flow works.

---

## (1) Server rejects SQLite

```bash
DATABASE_URL="file:./dev.db" npm run dev
```

**Expected:** Process exits with error:  
`DATABASE_URL must be a PostgreSQL connection string... SQLite is not supported.`

Then set a real Neon URL in `.env` and run `npm run dev` — server should start.

---

## (2) Sign up and see the user in `users`

1. Start server: `npm run dev` (with `DATABASE_URL` set to Neon in `.env`).
2. In the app, **sign up** a new user (email + password).
3. Check Neon:
   - **Option A – Neon SQL Editor:** Run:
     ```sql
     SELECT id, firebase_uid, email, display_name, onboarding_complete, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT 5;
     ```
   - **Option B – CLI script (from repo root):**
     ```bash
     npx tsx scripts/verify-db.ts
     ```
     You should see `users: 1` (or higher) after signup.

**Expected:** A row for the new user with `onboarding_complete = false`.

---

## (3) Complete onboarding and see `onboarding_complete = true`

1. With the same user, go through **quick onboarding** and finish it.
2. In Neon SQL Editor:
   ```sql
   SELECT id, email, onboarding_complete FROM users WHERE email = 'your@email.com';
   ```
   Or run `npx tsx scripts/verify-db.ts` again (counts only; to see the flag use SQL).

**Expected:** `onboarding_complete = true` for that user.

---

## (4) Sign in again and confirm routing by onboarding status

1. **Sign out**, then **sign in** with a user who **has** completed onboarding.  
   **Expected:** You land on the **dashboard** (or main app), not onboarding.
2. **Sign in** with a user who **has not** completed onboarding.  
   **Expected:** You are sent to **quick onboarding**.

This confirms the app uses **GET `/api/profile/me`** (PostgreSQL) for onboarding status.

---

## (5) Optional: complete a trip and see a row in `trips_summary`

Only if you have the flow that records trips and sets Firestore trip status to `completed`:

1. Record and complete a trip so the Firestore document has `status === 'completed'`.
2. Ensure **Cloud Functions** are deployed with `db.url` set to the same Neon DB.
3. In Neon SQL Editor:
   ```sql
   SELECT id, user_id, firestore_trip_id, started_at, ended_at, score
   FROM trips_summary
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   Or run `npx tsx scripts/verify-db.ts` and check the `trips_summary` count.

**Expected:** A new row for that trip.

---

## (6) Optional: call GET `/api/profile/me` with a token

1. Sign in in the app.
2. In the browser **DevTools → Console**, get the ID token and call the API (adjust if your auth API differs):
   ```js
   // If you have Firebase in scope, e.g. in your app's console:
   const token = await firebase.auth().currentUser.getIdToken();
   const r = await fetch('/api/profile/me', {
     headers: { Authorization: `Bearer ${token}` },
     credentials: 'include'
   });
   const data = await r.json();
   console.log(data);
   ```
   Or with curl (replace `YOUR_ID_TOKEN`):
   ```bash
   curl -s -H "Authorization: Bearer YOUR_ID_TOKEN" http://localhost:3001/api/profile/me
   ```

**Expected:** `200` and JSON with `email`, `name`, `onboardingComplete`, etc. (from PostgreSQL).

---

## Quick reference: setup order

| Step | Action |
|------|--------|
| Neon | Create project → run `migrations/schema.sql` → copy connection string |
| .env | `cp .env.example .env` → set `DATABASE_URL` to Neon URL |
| Server | `npm run dev` (rejects SQLite; starts with Postgres) |
| Functions | `cd functions` → `firebase functions:config:set db.url="postgresql://..."` → `npm run build` → `firebase deploy --only functions` |
| Verify | (1) SQLite reject, (2) signup → user in `users`, (3) onboarding → flag true, (4) sign-in routing, (5) trip → `trips_summary`, (6) GET `/api/profile/me` with token |

**DB check script:** From repo root, `npx tsx scripts/verify-db.ts` (requires `DATABASE_URL` in `.env`).

# Neon + Firebase setup (no CLI required)

Use this after you’ve created your Neon project and Firebase project (Driiva).

---

## Is Neon done correctly?

**Yes, if:**

- You have a Neon project (e.g. **Driiva**) in an **EU region** (e.g. **AWS Europe West 2 (London)** — good for GDPR).
- In the dashboard you see **“Connect to your database”** (or **Connection details**).
- You can copy a **connection string** that looks like:
  `postgresql://neondb_owner:****@ep-xxxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`

**You do not need:**

- **neonctl** or **Homebrew**. Ignore `brew install neonctl` and any auth timeout — the dashboard is enough.

**What to do:**

1. In Neon dashboard, open **“Connect to your database”** (or **Connection details**).
2. Click **“Show password”** and copy the **full connection string** (with the real password).
3. In your **repo root** `.env`, set:
   ```bash
   DATABASE_URL="postgresql://neondb_owner:YOUR_REAL_PASSWORD@ep-xxxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
   ```
4. Run the schema once: in Neon open **SQL Editor**, paste the contents of **`migrations/schema.sql`**, and run it.
5. For Cloud Functions: use the **same** URL:
   ```bash
   cd functions && firebase functions:config:set db.url="postgresql://..."
   ```

---

## Firebase Auth and Firestore — “everything linked”

**1. Where to get the keys (exact locations)**

| What you need | Where in Firebase Console |
|---------------|----------------------------|
| **API Key, App ID, Project ID** | **Project settings** (gear) → **General** → scroll to **“Your apps”** → select your **Web** app (or add one). Copy **API Key**, **App ID**. **Project ID** is at the top of the same page. |
| **Sender ID** (optional, for FCM) | **Project settings** → **Cloud Messaging** → **Firebase Cloud Messaging API (V1)** → **Sender ID** (e.g. `894211619782`). |

**2. Create the Firestore database (required for app)**

- In the left menu go to **Build** → **Firestore Database**.
- If you see **“Create database”**, click it and create the database (choose a region, then start in **production** or **test** mode as you prefer). The app expects Firestore to exist for real-time trips and user docs.

**3. Root `.env` — paste your values**

In the **repo root** `.env` (copy from `.env.example` if needed), set:

```bash
# Neon (from Neon “Connect to your database” → Show password → copy full URL)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-....neon.tech/neondb?sslmode=require"

# Firebase (from Project settings → General → Your apps → Web app)
VITE_FIREBASE_API_KEY="AIza..."
VITE_FIREBASE_PROJECT_ID="driiva"
VITE_FIREBASE_APP_ID="1:894211619782:web:..."

# Optional: Project settings → Cloud Messaging → Sender ID
VITE_FIREBASE_MESSAGING_SENDER_ID="894211619782"
```

**4. Server token verification (recommended)**

So the server can verify Firebase tokens (`/api/profile/me`, protected routes):

- **Project settings** → **Service accounts** → **Generate new private key**.
- Either set **`GOOGLE_APPLICATION_CREDENTIALS`** to the path of that JSON file, or put the JSON string in **`FIREBASE_SERVICE_ACCOUNT_KEY`** in `.env`.

**5. Check everything is linked**

- Start server: `npm run dev`. It should start (no SQLite error).
- Open the app, sign up / sign in. You should not see “Firebase not configured.”
- After login, the app should load profile from the API (no 401 on `/api/profile/me` if you set the service account).

Full list of env vars: **docs/ENV_AND_CREDENTIALS.md**.

# Firebase API Key Restrictions for Production

This guide configures **domain restrictions** for the Firebase/Google API key used by the Driiva web app, so only your production and development origins can use it.

---

## Important: Where to Configure

API key restrictions are managed in **Google Cloud Console**, not in the Firebase Console. Firebase and Google Cloud share the same project, so the API key you see in Firebase Project Settings is the same key listed under Google Cloud Credentials.

**From Firebase Console:** Project settings (gear) → General → Your apps → copy the **API key** → then open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) (same project) to restrict that key.

---

## Step-by-step: Restrict the API key

### 1. Open Google Cloud Console

- Go to **[Google Cloud Console](https://console.cloud.google.com/)**
- Select the **same project** as your Firebase app (e.g. `driiva`).  
  You can switch project via the top bar dropdown.

### 2. Open Credentials

- In the left sidebar: **APIs & Services** → **Credentials**
- Or use: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 3. Find your browser API key

- Under **API Keys**, find the key that matches the value you use in the client as `VITE_FIREBASE_API_KEY` (from Firebase: Project settings → General → Your apps → Web app config).
- Click the **pencil (Edit)** icon on that key’s row.

### 4. Set application restrictions

- **Application restrictions**
  - Select **“HTTP referrers (web sites)”**.
- **Website restrictions**
  - Click **“ADD AN ITEM”** and add one referrer per line. Use the exact patterns below.

**Production:**

```text
https://driiva.com/*
https://*.driiva.com/*
```

**Development (local):**

```text
http://localhost:3001/*
http://127.0.0.1:3001/*
```

If your dev server runs on another port (e.g. Vite’s default 5173), add that too:

```text
http://localhost:5173/*
http://127.0.0.1:5173/*
```

- **Important**
  - No trailing path after the `*` in the pattern (e.g. `https://driiva.com/*` is correct).
  - `*` in the host is only for subdomains: `https://*.driiva.com/*` matches `https://app.driiva.com/anything`.
  - Do **not** add a wildcard like `https://*.driiva.com*` (missing slash); referrer format must be `origin/*`.

### 5. (Optional) Restrict API usage

- In the same key edit screen, under **API restrictions**:
  - Choose **“Restrict key”**.
  - Select only the APIs your client actually uses, for example:
    - **Firebase Authentication API**
    - **Cloud Firestore API**
    - **Firebase Installations API** (if you use FCM or App Check)
- This limits the key to Firebase services only.

### 6. Save

- Click **Save**. Restrictions can take a few minutes to apply.

---

## Verify

- **Production:** Open your app at `https://driiva.com` (or your real domain); auth and Firestore should work.
- **Local:** Open `http://localhost:3001` (or your dev port); same behavior.
- **Blocked:** Open the app from a non-listed origin (e.g. another domain or `file://`); you should see API errors (e.g. 403 or “referer not allowed”) for Firebase calls.

---

## If you use multiple environments

- **Option A (recommended):** One key, multiple referrers: add all allowed origins (prod + staging + local) to the same key as above.
- **Option B:** Separate keys per environment (e.g. one “Browser key” for prod with only prod referrers, another for dev with only localhost). Use different `.env` / build envs so each build uses the right key.

---

## Difference: Browser API key vs Admin SDK (Cloud Functions)

| Aspect | Browser / client (restricted key) | Cloud Functions (Admin SDK) |
|--------|------------------------------------|-----------------------------|
| **Where** | Web app config in client (e.g. `VITE_FIREBASE_API_KEY`) | No API key in code; uses project’s service account |
| **Restriction** | **Restrict this key** in Google Cloud (HTTP referrers + optional API restrictions) so only your domains can use it | Not applicable; key is not used. Identity is the default compute service account or the project’s Firebase Admin SDK credentials |
| **Secret?** | **Not secret** – it’s in the browser. Security comes from domain + API restrictions | **Service account key** (if ever downloaded) **is secret** – never in client or in git. Cloud Functions usually use Application Default Credentials (no key file). |
| **Purpose** | Identifies the app to Google/Firebase and is checked against referrer and (optionally) API list | Full server-side access (Firestore, Auth, etc.); bypasses Firestore security rules |

**Summary:**  
- **Browser:** Use one Firebase web API key, restrict it by HTTP referrer (and optionally by API). Safe to ship in client code.  
- **Cloud Functions:** Do **not** put the browser API key in Functions. Use `firebase-admin` (Admin SDK); it uses the project’s credentials and is not restricted by API key restrictions.

---

## Related files

- **Client config:** `client/src/lib/firebase.ts` (reads `VITE_FIREBASE_*` from env).
- **Env template:** `.env.example` – which values are public vs secret.

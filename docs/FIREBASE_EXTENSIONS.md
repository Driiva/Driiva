# Firebase Extensions and Driiva MVP

**What are Firebase Extensions?**  
Pre-built, one-click add-ons that run in your Firebase project (often as Cloud Functions + config). You install them from the Firebase Console; they don’t live in your repo. “Integration” = install + configure in Console, and optionally call their APIs or rely on their triggers.

**Why they weren’t “integrated” in the codebase**  
Extensions are **installed and configured in the Firebase Console**, not by code in this repo. The repo already has custom Cloud Functions (sync user to Postgres, sync trip on complete, etc.). Adding an extension doesn’t require new code unless you want to call it explicitly — many just react to Auth or Firestore events.

---

## Which extensions make sense for Driiva MVP?

| Extension | Use for Driiva? | Complexity | Notes |
|-----------|------------------|------------|--------|
| **Delete User Data** (Firebase) | ✅ **Yes — recommend** | Low | When a user deletes their Firebase account, it deletes their data from Firestore, Realtime DB, or Storage (you choose). Fits GDPR “right to erasure” with no custom code. Stable, official. |
| **Run Payments with Stripe** (Stripe) | ⏳ Later | Medium | Ties Stripe payments to Firebase Auth (e.g. premium access). Useful when you add paid tiers; not required for MVP if you’re not charging yet. |
| **Send Invoices using Stripe** (Stripe) | ⏳ Later | Low | Invoicing; add when you need it. |
| **Manage Marketing with Mailchimp** (Mailchimp) | ❌ Skip for MVP | Low | Email marketing; only add if you’re doing campaigns. |
| **Enable In-App Purchases with RevenueCat** | ❌ Skip for MVP | Medium | Mobile IAP; relevant for native apps / subscriptions later. |
| **Authenticate with Stream Chat** (Stream) | ❌ Skip for MVP | Medium | Chat; add only if you add in-app chat. |

**Summary for MVP:**  
- **Install now:** **Delete User Data** — stable, no app code change, helps with GDPR.  
- **Email campaigns:** **Manage Marketing with Mailchimp** — syncs users to Mailchimp; you run campaigns from Mailchimp (see below).  
- **Consider later:** Stripe payments/invoices when you add paid features.  
- **Skip for now:** RevenueCat, Stream unless you need them.

---

## Email campaigns (Mailchimp extension)

**How Firebase/Mailchimp deals with it:**  
Firebase doesn’t send email campaigns itself. The **Manage Marketing with Mailchimp** extension:

1. **Syncs** – When users are created or updated in Firebase Auth (or a Firestore collection you choose), the extension syncs their data (e.g. email, display name, UID) to a **Mailchimp audience**. You configure the mapping in the extension (which fields go to which Mailchimp merge tags).
2. **Blasts** – You create and send campaigns (newsletters, promos, etc.) **from Mailchimp’s dashboard or API**. The extension only keeps the audience in sync; it doesn’t send emails.

**How it shows in-app:**  
- The extension itself doesn’t render anything in your app.  
- **In-app you typically add:**  
  - **Preferences:** e.g. “Email me tips and offers” (save to Firestore or a user profile; you can sync that to Mailchimp as a tag/segment so you only email opted-in users).  
  - **Unsubscribe:** Link to Mailchimp’s unsubscribe page or your own page that calls Mailchimp API to update the contact.  
  - **Optional:** A “Recent emails” or “Campaigns” section that lists sent campaigns (you’d call Mailchimp’s API from your backend and show titles/links in the app).

**Install:**  
Firebase Console → Build → Extensions → **Manage Marketing with Mailchimp** → Install → connect your Mailchimp account and choose the Auth (or Firestore) source and audience.

---

## Recommended: Delete User Data (GDPR, no extra complexity)

**What it does**  
When a user is **deleted from Firebase Authentication**, the extension automatically deletes documents/keyed data you configure (e.g. Firestore `users/{uid}`, `trips` where `userId == uid`, etc.). You choose the collections and the key field (usually `userId` or document path).

**Why it’s good for Driiva**  
- **GDPR:** Supports “right to erasure” for data stored in Firestore (trips, user docs, etc.).  
- **Stable:** Official Firebase extension, widely used.  
- **No code change:** Install and configure in Console; no changes needed in this repo.  
- **Caveat:** It only cleans **Firebase** (Firestore, Storage). Your **Neon PostgreSQL** data (users, trips_summary) must still be deleted by your own flow (e.g. Cloud Function on Auth user delete, or admin process). You can add a small function later that deletes from Neon when Firebase user is deleted, or use the extension only for Firestore and document that Postgres deletion is handled separately.

**How to install**  
1. Firebase Console → **Build** → **Extensions** (or Authentication → Extensions).  
2. **Explore Extensions Hub** → search **“Delete User Data”** (by Firebase).  
3. **Install** → choose your Firestore (and optionally Storage) and configure which collections to delete and the key field (e.g. `userId` or path segment `{userId}`).  
4. Finish the wizard. The extension will create a trigger that runs when an Auth user is deleted.

No changes are required in the Driiva codebase for this extension to work.

---

## Do you need to “integrate” extensions in the codebase?

**Usually no.**  
- **Delete User Data:** Runs on Auth user delete; no API calls from your app.  
- **Stripe payments:** When you add it, you might call Stripe from your client or Cloud Functions; that’s when you’d add env vars (e.g. Stripe keys) and possibly a small amount of code.  

So for MVP, “integrate” = **install and configure in the Firebase Console**. The only “link” in the repo is documenting which extensions you use and where (this doc and, if you add Stripe later, env vars in `docs/ENV_AND_CREDENTIALS.md`).

---

## Quick checklist for MVP

- [ ] **Firestore:** Create database (Build → Firestore Database → Create database) if not done.  
- [ ] **Neon:** Connection string in `.env`; schema run; Functions `db.url` set.  
- [ ] **Firebase:** API Key, Project ID, App ID (and optional Sender ID) in `.env`; service account for server.  
- [ ] **Extension (optional but recommended):** Install **Delete User Data** and configure Firestore collections to delete by `userId` (or path).  
- [ ] **Later:** Stripe or other extensions when you add payments or chat.

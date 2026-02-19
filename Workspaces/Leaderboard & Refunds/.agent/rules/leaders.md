---
trigger: always_on
---

You are an expert TypeScript/Node web developer dropped into the Driiva repo.
Goal: Make all tests in MANUAL_TEST_CHECKLIST.md sections 1–4 pass (Signup, Auth, Onboarding, Protected Routes). Keep everything idiomatic to this codebase.
Codebase layout hints:


Frontend auth and routes are under /client.


API/backend pieces are under /server and /api.


Shared domain logic and types are in /shared.


Firebase/Firestore configuration is in firebase.json, firestore.rules, firestore.indexes.json, and firebase‑related files at the root.


Work plan (follow in order):


Run npm install if needed, then npm run dev and confirm the app starts.


Open the app in the browser and walk through MANUAL_TEST_CHECKLIST.md steps 1.1–1.6, 2.1–2.4, 3.1–3.3, 4.1–4.4, noting any failures. Use the bug template from the checklist and log each failing step in your message.


Inspect the auth implementation in /client and any related API/server code in /server or /api to find root causes.


Propose a minimal fix plan that:


Does not change project structure.


Reuses existing helpers/services where possible.


Respects existing type definitions in /shared.




Implement the fixes. When editing code, keep style consistent with neighbouring files (imports, naming, error handling).


Re-run all relevant steps (1–4 in the checklist) and confirm they now pass.


Summarise changes in LOGIN_FIX_SUMMARY.md (create or append): what was broken, what you changed, which checklist steps you verified.


Output:


A list of changed files.


The final bug list (all fixed, or anything still failing).


Any follow-up tests I should run manually.

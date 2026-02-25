# Agents

## Cursor Cloud specific instructions

### Overview

Driiva is a usage-based auto insurance telematics platform (React 18 + Express + Firebase + Neon PostgreSQL). A single `npm run dev` command starts both the Express API server and Vite-powered React frontend on port 3001.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| Main app (Express + Vite) | `npm run dev` (port 3001) | Serves both API and frontend. Requires `DATABASE_URL` in `.env`. |
| Cloud Functions | `cd functions && npm run build` | Separate TypeScript project under `functions/`. |

### Key development notes

- **Node.js 20** is required (`functions/package.json` engines field). Use `nvm use 20`.
- **npm** is the package manager (lockfile: `package-lock.json`). Root and `functions/` each have their own `node_modules`.
- A `.env` file at the project root is required. Copy from `.env.example`. The server throws at startup if `DATABASE_URL` is missing. With a placeholder PostgreSQL URL, the server starts and serves the frontend; API routes that query the DB will fail at query time (pool connects lazily).
- Firebase Auth uses placeholder config in dev. Sign-up/sign-in will fail, but **demo mode** works without credentials (accessible via "Try demo mode" on the sign-in page at `/signin`).
- **Tests**: `npm test` (root, 180 tests via vitest) and `cd functions && npm test` (89 tests). All tests are self-contained mocks and pass without any external services.
- **Type check**: `npx tsc --noEmit` — has 3 pre-existing errors (test type mismatches and a legacy `@supabase/supabase-js` import in `server/lib/auth-handler.ts`). These do not affect runtime.
- **Build (functions)**: `cd functions && npm run build` compiles TypeScript to `functions/lib/`.
- For full end-to-end functionality, the following secrets are needed: `DATABASE_URL` (Neon PostgreSQL), `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. See `.env.example` for the complete list.
- No Docker or containers are required.

# Driiva - AI-Powered Telematics Insurance MVP

## Overview

Driiva is a mobile-first telematics insurance application that leverages AI to assess driving behavior, reward safe drivers, and foster a community-pooled insurance model. Its core purpose is to calculate and distribute premium refunds based on individual safety scores and collective community performance. The project aims to disrupt traditional insurance by offering transparent, data-driven pricing and fostering safer driving habits through gamification.

## User Preferences

Preferred communication style: Simple, everyday language.
Visual preferences:
- iOS-native design with enhanced glassmorphism effects
- Muted gradient color scheme (darker orange/brown tones to dark blue)
- Clean white Driiva logo with capital D, no outline box, italic Inter font
- Fully legible text for iOS accessibility standards

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom glass morphism design system, Radix UI primitives, shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with TypeScript and React plugins
- **Mobile-First Design**: Full PWA support, iOS-specific meta tags, safe area handling, Framer Motion for 120Hz animations, and parallax effects.

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless hosting, Drizzle ORM
- **API Design**: RESTful API
- **Real-time Features**: Achieved through query refresh intervals.

### Key Components
- **Data Collection**: Browser-based GPS, accelerometer, and gyroscope data collection with client-side processing and AES-256-GCM encryption.
- **Scoring Engine**: Multi-factor scoring (harsh braking, acceleration, speed adherence, night driving, cornering, consistency), community pooling for dynamic risk assessment, and up to 15% annual premium refunds. An AI Insights Engine provides predictive analytics.
- **Gamification**: Achievement system with unlockable badges, weekly/monthly leaderboards, and visual progress tracking.

### Data Flow
Mobile sensors collect encrypted trip data, which is processed client-side for safety metrics and then synchronized with the backend. The server aggregates this data for community analysis and determines refund amounts, with real-time UI updates via TanStack Query.

### Navigation Flow (3-Button Entry)
The landing page (/) has THREE clearly separated entry points:

1. **"Get Started"** → `/signup` → Firebase account creation → `/home` (driver dashboard)
   - Creates a real Firebase Auth account
   - Stores user profile in Firestore
   - Navigates to authenticated dashboard on success

2. **"Test Driiva" / "Try Demo"** → `/demo` → `/dashboard` (demo mode)
   - NEVER calls Firebase Auth
   - Uses localStorage for demo state only
   - Full mock data: score 82, trips, community pool £105k
   - Completely isolated from real accounts

3. **"I Already Have an Account"** → `/signin` → Firebase sign-in → `/home` (driver dashboard)
   - Uses Firebase `signInWithEmailAndPassword`
   - NO demo accounts - real credentials only
   - Navigates to same dashboard as signup on success

### Route Summary
| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing page with 3 entry buttons |
| `/signup` | Public | Firebase account creation |
| `/signin` | Public | Firebase email/password login |
| `/demo` | Public | Demo mode entry (sets localStorage, goes to /dashboard) |
| `/home` | Protected | Driver dashboard (real users) |
| `/dashboard` | Protected | Dashboard (supports both real and demo users) |

### Auth State
- **Real users**: Firebase Auth state + Firestore profile
- **Demo users**: `localStorage.getItem('driiva-demo-mode') === 'true'`
- **Logout**: Clears both Firebase session AND demo localStorage flags

## Firebase Configuration

### Required Environment Variables
Set these in Replit Secrets OR in a `.env.local` file for local development:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSyC...` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `driiva` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |

### Local Development Setup
```bash
# 1. Clone and install
git clone <repo-url>
cd driiva/client
npm install

# 2. Create environment file
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_PROJECT_ID=driiva
VITE_FIREBASE_APP_ID=your-app-id-here
EOF

# 3. Start dev server
npm run dev
```

### Firebase Health Checklist
- [ ] All three VITE_FIREBASE_* variables are set
- [ ] Console shows: `✓ Firebase initialized with projectId=driiva`
- [ ] No "auth/configuration-not-found" errors
- [ ] No "api-key-not-valid" errors
- [ ] Signup creates account and navigates to dashboard
- [ ] Signin works with existing credentials
- [ ] Demo mode works WITHOUT Firebase (via /demo route)

### Firebase Config Location
- **Single source of truth**: `client/src/lib/firebase.ts`
- **authDomain**: Hardcoded to `driiva.firebaseapp.com` (do not change)
- **All imports**: Must come from this single file

## Manual Smoke Test Checklist

Run through this checklist after any changes to auth/routing:

### 1. Landing Page Tests (/)
- [ ] Page loads with three visible buttons
- [ ] "Get Started" button is visible
- [ ] "Test Driiva" button is visible  
- [ ] "I Already Have an Account" button is visible

### 2. Signup Flow ("Get Started")
- [ ] Clicking "Get Started" navigates to `/signup`
- [ ] Signup page shows form with: Full Name, Email, Password, Confirm Password
- [ ] Submitting valid data creates Firebase account
- [ ] After successful signup, navigates to `/home` (driver dashboard)
- [ ] User is shown in dashboard with correct name
- [ ] NO demo mode indicators shown (user is real)

### 3. Demo Flow ("Test Driiva")
- [ ] Clicking "Test Driiva" navigates to `/demo`
- [ ] Demo page shows feature cards and "Enter Demo Mode" button
- [ ] Clicking "Enter Demo Mode" sets demo localStorage flags
- [ ] After entering demo, navigates to `/dashboard`
- [ ] Dashboard shows "Demo Mode" indicator
- [ ] Dashboard shows mock data (score 82, trips, pool £105k)
- [ ] Console has NO Firebase auth errors (demo never calls Firebase)

### 4. Login Flow ("I Already Have an Account")
- [ ] Clicking "I Already Have an Account" navigates to `/signin`
- [ ] Sign-in page shows Email and Password fields only
- [ ] NO demo account hints or prefilled credentials
- [ ] Invalid credentials show error message
- [ ] Valid Firebase credentials work
- [ ] After successful login, navigates to `/home`
- [ ] User dashboard shows real data, NOT demo data

### 5. Cross-Flow Isolation
- [ ] Create new account via signup → logout → signin works with same credentials
- [ ] Enter demo mode → logout → signin does NOT auto-login to demo
- [ ] Demo mode localStorage is cleared on logout
- [ ] Real Firebase user never sees demo mode badge unless they go to /demo

### 6. Protected Routes
- [ ] Visiting `/home` when not logged in redirects to `/signin`
- [ ] Visiting `/dashboard` when not logged in redirects to `/signin`
- [ ] Visiting `/signin` when logged in redirects to `/home`
- [ ] Visiting `/signup` when logged in redirects to `/home`

### 7. Logout
- [ ] Logout button visible in dashboard dropdown
- [ ] Clicking logout clears Firebase session
- [ ] Clicking logout clears demo localStorage
- [ ] After logout, user lands on `/` or `/signin`

## External Dependencies

### Core Infrastructure
- **Firebase Auth**: User authentication with email/password and session management.
- **Firestore**: NoSQL database for user profiles (/users/{uid}), daily scores, and rolling averages.
- **Neon Database**: Serverless PostgreSQL hosting for backend data.
- **Stripe Integration**: Planned for payment processing and subscription management.
- **WebSocket Support**: For real-time data streaming.
- **Python FastAPI**: For refund calculation, pool statistics, and driver management.

### Development Tools
- **Drizzle Kit**: Database migrations and schema management.
- **TypeScript**: For full type safety.
- **ESBuild**: For fast production builds.

### UI/UX Libraries
- **Radix UI**: Accessible component primitives.
- **Lucide Icons**: Consistent iconography.
- **Framer Motion**: Animation library.

### Risk Scoring Service
- **Mock Risk Scoring Service (XGBoost Simulation)**: A Python-based service for processing and scoring individual trips using a rule-based approximation of XGBoost, storing daily scores and calculating 30-day rolling averages in Firestore.
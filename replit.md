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

### Navigation Flow
- **Homepage (/)**: Welcome page with three CTAs:
  - "Get Started" → /signup → /quick-onboarding → /dashboard
  - "Test Driiva" → /dashboard (demo mode with full mock data: score 82, trips, pool)
  - "I Already Have an Account" → /signin → /dashboard
- **Quick Onboarding (/quick-onboarding)**: 3-step flow with GPS permission, app install prompt, and tutorial. Skip sets onboarding_complete=true.
- **Unified Dashboard (/dashboard)**: Adapts based on user type:
  - Demo mode: Full mock data (score 82, trip cards, community pool £105k, achievements)
  - New user: Empty state with prompts to start driving
  - Returning user: Real Firestore data with trips, pool share, and achievements
- **Demo Accounts**: driiva1/driiva1 (score 82), alex/alex123 (score 92), sarah/sarah123 (score 78), james/james123 (score 88), test/test123 (score 72)

## Firebase Configuration

### Required Environment Variables (Replit Secrets)
The following secrets must be set in Replit Secrets (lock icon in sidebar):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSyC...` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `driiva` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |

### Firebase Health Checklist
1. ✓ All three VITE_FIREBASE_* secrets are set in Replit Secrets
2. ✓ Console shows: `✓ Firebase initialized with projectId=driiva`
3. ✓ No "auth/configuration-not-found" or "api-key-not-valid" errors
4. ✓ User can sign up with email/password
5. ✓ User can sign in with existing account
6. ✓ Demo accounts (driiva1/driiva1, etc.) work without Firebase

### Firebase Config Location
- **Single source of truth**: `client/src/lib/firebase.ts`
- Hard-coded authDomain: `driiva.firebaseapp.com`
- All auth components import from this single file

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
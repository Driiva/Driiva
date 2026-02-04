# Driiva - AI-Powered Telematics Insurance MVP

## Overview

Driiva is a mobile-first telematics insurance application that rewards safe driving through AI-powered risk assessment and community pooling. The system tracks driving behavior in real-time and calculates premium refunds based on safety scores and community performance.

## User Preferences

Preferred communication style: Simple, everyday language.
Visual preferences: 
- iOS-native design with enhanced glassmorphism effects
- Muted gradient color scheme (darker orange/brown tones to dark blue)
- Clean white Driiva logo with capital D, no outline box, italic Inter font
- Fully legible text for iOS accessibility standards

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom glass morphism design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Component Library**: Radix UI primitives with shadcn/ui components
- **Build Tool**: Vite with TypeScript and React plugins

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with Express routes
- **Real-time Features**: Built-in with query refresh intervals

### Mobile-First Design
- **PWA Support**: Full Progressive Web App with manifest, service worker ready
- **iOS Integration**: Apple-specific meta tags and safe area handling
- **Glass Morphism UI**: Premium design system with multi-layer blur effects and transparency
- **Motion Design**: Framer Motion for 120Hz animations and micro-interactions
- **Parallax Effects**: Dynamic background with GPU-accelerated animations

## Key Components

### Data Collection System
- **Telematics Collector**: Browser-based GPS, accelerometer, and gyroscope data collection
- **Real-time Processing**: Client-side driving metrics calculation
- **Privacy First**: AES-256-GCM encryption for sensitive data

### Scoring Engine
- **Multi-factor Scoring**: Hard braking (25%), acceleration (20%), speed adherence (20%), night driving (15%), cornering (10%), consistency (10%)
- **Community Pooling**: Dynamic risk assessment based on collective safety factors
- **Refund Calculation**: Up to 15% annual premium refunds for safe drivers
- **AI Insights Engine**: Predictive analytics for risk trends, refund forecasting, and behavioral recommendations

### Gamification Layer
- **Achievement System**: Unlockable badges for driving milestones
- **Leaderboards**: Weekly and monthly community rankings
- **Progress Tracking**: Visual progress rings and liquid gauge displays

## Data Flow

1. **Trip Collection**: Mobile sensors capture driving data during trips
2. **Real-time Scoring**: Client-side processing calculates safety metrics
3. **Server Sync**: Encrypted trip data sent to backend for storage
4. **Community Analysis**: Server aggregates data for pool safety factors
5. **Refund Calculation**: Personal and community scores determine refund amounts
6. **Dashboard Updates**: Real-time UI updates via TanStack Query

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Stripe Integration**: Payment processing and subscription management (ready for implementation)
- **WebSocket Support**: Real-time data streaming capabilities

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast production builds for server-side code

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Feather icon set for consistent iconography
- **Framer Motion**: Animation library for smooth transitions

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with fast refresh
- **Type Checking**: Real-time TypeScript validation
- **Database Sync**: Drizzle push for schema updates

### Production Build
- **Client Build**: Vite optimized bundle with tree shaking
- **Server Build**: ESBuild bundle with external packages
- **Static Assets**: PWA-ready with caching strategies

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Secrets**: Environment-based configuration for API keys
- **Scaling**: Serverless-ready architecture for horizontal scaling

### GDPR Compliance
- **Data Export**: Complete user data export functionality
- **Account Deletion**: Permanent data removal with confirmation
- **Privacy Controls**: Granular data collection permissions

## Development Notes

The application is structured as a monorepo with shared types and utilities. The database schema supports comprehensive trip tracking, user management, and community features. The design system prioritizes mobile usability with iOS-native feel and performance optimization.

Key architectural decisions favor real-time user experience, data privacy, and scalable community features that differentiate this insurance product through gamification and transparent safety scoring.

## Recent Changes

### January 30, 2025 - Stable Demo Version 2.0
- ✅ **AUTHENTICATION FIXED**: Separated AuthContext to dedicated file, resolved all hooks errors
- ✅ **ROUTING SIMPLIFIED**: Removed complex protected routes to ensure stability
- ✅ **APP RUNNING**: All pages accessible, signin functional with demo credentials
- 🔄 **PENDING FIXES**:
  - Refund simulator scroller visibility
  - Improvement display (negative numbers → 0)
  - Algorithm alignment with AI model documentation
  - Sign out functionality
  - Rename rewards → dashboard
  - Profile page UI centering
  - Coverage dropdown functionality
  - Notification dropdown
  - View details button
  - San Francisco font implementation
  - Refund bonus reduction per documentation

### July 28, 2025 - Final Version 2.1
- ✅ **REFUND SIMULATOR FIXES**: Fixed critical scoring and display issues
  - Reduced slider thumb size from 5x5 to 4x4 for better visibility
  - Fixed 70% eligibility threshold - scores 70+ now qualify for refunds
  - Corrected refund algorithm: 5% base + up to 10% additional (5%-15% total)
  - Fixed negative improvement display to show £0.00 instead
  - Updated projected refund calculations to match algorithm documentation
- ✅ **COMMUNITY LEADERBOARD ENHANCEMENTS**: Full GDPR-compliant leaderboard implementation
  - Created dedicated /leaderboard page with extended rankings
  - Changed display from first names to usernames for GDPR compliance
  - Added percentage change indicators (+/-) for weekly performance
  - Implemented "See All Driivas" button linking to full leaderboard
  - Removed individual refund scores from leaderboard for privacy
- ✅ **MONTHLY METRICS FORMAT**: All driving statistics now display monthly format
  - Updated MetricsGrid: "2 harsh events this month" (singular/plural handling)
  - Profile page statistics: "Miles This Month", "Speed Violations This Month"
  - Consistent "this month" labeling across all driving metrics
- ✅ **NOTIFICATION DROPDOWN**: Added functional notification system
  - Bell icon with empty state message: "You have no unread messages"
  - Glass morphism design with smooth animations
  - Placeholder for future notification features
- ✅ **DATA ACCURACY REVIEW**: Verified all numbers align with AI documentation
  - Test score set to 72 (above 70% threshold) for proper refund eligibility
  - Projected refund: £100.80 for score 72 (5.48% of £1,840 premium)
  - Community leaderboard scores: 70-72 range showing eligible drivers
  - Algorithm validation: Personal 80% + Community 20% weighting confirmed

### Technical Validation Results:
- **Refund Algorithm**: ✅ 70+ threshold working, 5%-15% scaling implemented correctly
- **GDPR Compliance**: ✅ Username display instead of personal names in leaderboard
- **Monthly Metrics**: ✅ All driving statistics formatted as monthly with proper labeling
- **UI Components**: ✅ Reduced slider size, notification dropdown, leaderboard navigation
- **Data Consistency**: ✅ All numbers verified against AI model documentation

### July 26, 2025
- ✅ Fixed N+1 query performance issue with trip pagination
- ✅ Removed trip recording functionality as requested
- ✅ Enhanced authentication flow and error handling
- ✅ Populated driiva1 user with comprehensive driving data:
  - 26 realistic trips with varied driving patterns
  - Updated driving profile with 89 overall score
  - 1,107.70 total miles driven
  - Unlocked 2 achievements (Long Distance, Consistent Driver)
  - Added to weekly leaderboard with rank #1
  - Calculated projected refund: £50.06 based on 89% performance score
- ✅ Implemented premium glassmorphism UI with enhanced blur effects
  - Primary glass containers: rgba(255,255,255,0.15) with 20px blur
  - Secondary glass elements: rgba(255,255,255,0.12) with 15px blur
  - Interactive hover states with smooth transitions
- ✅ Added parallax scrolling background with animated gradient layers
- ✅ Created AI-powered insights with predictive analytics:
  - Risk trend analysis based on recent driving patterns
  - Refund prediction with confidence scoring
  - Personalized driving recommendations
  - Sustainability scoring with CO2 impact tracking
  - Community comparison and leaderboard insights
  - Behavioral pattern analysis (best days/times)
- ✅ Reverted to stable dashboard design:
  - Removed complex trip loading and infinite scroll
  - Removed parallax background and AI insights from main view
  - Fixed all TypeScript and runtime errors
  - Simplified to core components: LiquidGauge, RefundSimulator, Gamification
  - Maintained glassmorphism UI design system
- ✅ Created Stable Demo Version 1 (July 26, 2025):
  - Completely removed page swipe animations and transitions
  - Eliminated PageTransition component and infinite scroll functionality
  - Simplified App.tsx to basic routing without complex animations
  - Converted dashboard to clean box-based layout with proper spacing
  - Removed haptic feedback and complex interactions
  - All components work in stable containers without scrolling issues
  - Zero TypeScript errors and runtime issues
  - API connectivity verified (200 OK responses)
  - Ready for demo presentation

### January 24, 2026 - Beta Ready Demo Accounts
- ✅ **DEMO ACCOUNTS SYSTEM**: Added 5 demo accounts for beta users (work without Supabase)
  - driiva1 / driiva1 - Demo Driver (Score: 85, Miles: 1,247, Refund: £150)
  - alex / alex123 - Alex Thompson (Score: 92, Miles: 2,340, Refund: £180)
  - sarah / sarah123 - Sarah Mitchell (Score: 78, Miles: 890, Refund: £126)
  - james / james123 - James Wilson (Score: 88, Miles: 1,650, Refund: £154)
  - test / test123 - Test User (Score: 72, Miles: 560, Refund: £100)
- ✅ **CONNECTION STATUS INDICATOR**: Added user-facing Supabase status on signin page
  - "Demo Mode Only" (amber badge) when Supabase unavailable
  - "Connected" (green badge) when Supabase connected
- ✅ **DASHBOARD IMPROVEMENTS**: Demo data fully wired
  - Total Miles displayed with progress bar
  - Projected Refund using demo account data
  - Driving Score with appropriate messaging
- ✅ **ERROR MESSAGING**: Updated to direct users to demo accounts when Supabase unreachable

### Beta Demo Accounts (Works Offline)
| Username | Password | Name | Score | Miles | Refund |
|----------|----------|------|-------|-------|--------|
| driiva1 | driiva1 | Demo Driver | 85 | 1,247 | £150 |
| alex | alex123 | Alex Thompson | 92 | 2,340 | £180 |
| sarah | sarah123 | Sarah Mitchell | 78 | 890 | £126 |
| james | james123 | James Wilson | 88 | 1,650 | £154 |
| test | test123 | Test User | 72 | 560 | £100 |

### February 4, 2026 - Python Refund Calculator API
- ✅ **FASTAPI REFUND CALCULATOR**: Created Python FastAPI API at `/api/main.py`
  - POST `/calculate-refund`: Single driver refund calculation
  - POST `/calculate-pool-refunds`: Batch refund calculation for multiple drivers
  - POST `/calculate-pool-refunds-from-firestore`: Calculate from stored Firestore data
  - GET `/pool-stats`: Real-time pool statistics
  - CRUD endpoints for driver management (`/drivers`)

#### Refund Algorithm Implementation:
```
refund_rate = min(0.15, ((0.7 * personal_score/100) + (0.3 * pool_safety_factor)) * surplus_ratio)
refund_amount = annual_premium * refund_rate
```

#### Business Rules:
- Eligibility: personal_score >= 70
- Maximum refund rate: 15% (0.15)
- pool_safety_factor: Percentage of drivers with score >= 80
- surplus_ratio: Capped at 1.0

#### API Endpoints:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/docs` | GET | Swagger UI documentation |
| `/redoc` | GET | ReDoc documentation |
| `/calculate-refund` | POST | Single driver refund |
| `/calculate-pool-refunds` | POST | Batch refund calculation |
| `/drivers` | GET, POST | List/create drivers |
| `/drivers/{id}` | GET, DELETE | Get/delete driver |
| `/pool-stats` | GET | Pool statistics |

#### Running the API:
```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 5000
```

#### Firestore Integration:
Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your Firebase service account JSON file.
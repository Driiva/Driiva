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
- **Glass Morphism UI**: Custom CSS with 60% blur, gradient borders, haptic feedback
- **Motion Design**: Framer Motion for 120Hz animations and micro-interactions

## Key Components

### Data Collection System
- **Telematics Collector**: Browser-based GPS, accelerometer, and gyroscope data collection
- **Real-time Processing**: Client-side driving metrics calculation
- **Privacy First**: AES-256-GCM encryption for sensitive data

### Scoring Engine
- **Multi-factor Scoring**: Hard braking (25%), acceleration (20%), speed adherence (20%), night driving (15%), cornering (10%), consistency (10%)
- **Community Pooling**: Dynamic risk assessment based on collective safety factors
- **Refund Calculation**: Up to 15% annual premium refunds for safe drivers

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
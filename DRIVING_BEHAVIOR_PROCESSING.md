# Driving Behavior Processing System

## Overview

This document describes the comprehensive driving behavior data processing system for insurance scoring, including trip parsing, metric calculation, scoring, aggregation, and anomaly detection.

## Features Implemented

### 1. Trip JSON Parsing
- **Location**: `server/lib/telematics.ts`
- **Function**: `parseTripJSON()`
- **Features**:
  - Parses trip JSON with ISO 8601 start/end times
  - Validates GPS coordinates and timestamps
  - Converts events to sensor data format
  - Extracts speed data from GPS points
  - Normalizes timestamps relative to trip start

### 2. Metric Calculation
- **Distance**: Calculated in kilometers using Haversine formula
- **Average Speed**: Calculated in km/h from speed data or GPS points
- **Harsh Braking Count**: Detected from accelerometer data
- **Additional Metrics**:
  - `distance_km`: Distance in kilometers
  - `avg_speed`: Average speed in km/h
  - `harsh_braking_count`: Count of harsh braking events
  - `max_speed`: Maximum speed in km/h
  - `duration`: Trip duration in minutes

### 3. Scoring System (0-100 scale)
- **Weighted Factors**:
  - Hard braking: 25%
  - Acceleration: 20%
  - Speed adherence: 20%
  - Night driving: 15%
  - Cornering: 10%
  - Consistency: 10%
- **Anomaly Penalty**: Score reduced by up to 30% based on anomaly detection
- **Deterministic**: All calculations are deterministic and auditable

### 4. Anomaly Detection
- **Impossible Speeds**: Flags speeds > 200 km/h (~124 mph)
- **GPS Jumps**: Detects jumps > 5km in < 1 minute
- **Duplicate Trips**: Identifies trips within 5 minutes with similar distance (< 500m)
- **Anomaly Score**: 0-100 scale indicating data quality
- **Details**: Returns specific anomaly details for debugging

### 5. Score Aggregation
- **Location**: `server/lib/scoreAggregation.ts`
- **Features**:
  - Weekly score aggregation per user
  - Monthly score aggregation per user
  - Time-series data (daily/weekly/monthly granularity)
  - Trend analysis (improving/declining/stable)
  - Historical scores (last N weeks/months)

### 6. Optimized Time-Series Queries
- **Location**: `server/storage.ts`
- **New Methods**:
  - `getTripsByDateRange()`: Optimized date range queries
  - `getTripsForDuplicateCheck()`: Efficient duplicate detection
- **Indexes**: See `migrations/add_timeseries_indexes.sql`
  - Index on `start_time` for time-range queries
  - Composite index on `(user_id, start_time)` for user-specific queries
  - Index on `(user_id, start_time, end_time, distance)` for duplicate detection

## API Endpoints

### Trip Processing
```
POST /api/trips
```
- Accepts both `TelematicsData` and `TripJSON` formats
- Returns metrics with anomaly information
- Validates and processes trip data

### Score Aggregation
```
GET /api/scores/weekly/:userId
GET /api/scores/monthly/:userId
GET /api/scores/timeseries/:userId
GET /api/scores/trend/:userId
```

### Trip Queries
```
GET /api/trips/:userId
GET /api/trips/:userId?startDate=...&endDate=...
```

## Data Formats

### TripJSON Format
```typescript
interface TripJSON {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  gpsPoints: GPSPoint[];
  events?: {
    braking?: Array<{ timestamp: number; intensity: number }>;
    acceleration?: Array<{ timestamp: number; intensity: number }>;
    cornering?: Array<{ timestamp: number; intensity: number }>;
  };
  accelerometerData?: AccelerometerReading[];
  gyroscopeData?: GyroscopeReading[];
  speedData?: SpeedReading[];
}
```

### DrivingMetrics Response
```typescript
interface DrivingMetrics {
  score: number; // 0-100
  hardBrakingEvents: number;
  harshBrakingCount: number;
  harshAccelerationEvents: number;
  speedViolations: number;
  nightDriving: boolean;
  sharpCorners: number;
  distance: number; // km
  distanceKm: number; // km
  duration: number; // minutes
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  ecoScore: number;
  anomalies: TripAnomalies;
}
```

## Database Optimization

### Indexes Created
1. `idx_trips_start_time`: For time-range queries
2. `idx_trips_user_start_time`: For user-specific time queries
3. `idx_trips_end_time`: For end-time range queries
4. `idx_trips_user_time_distance`: For duplicate detection
5. `idx_trips_user_score_time`: For score aggregation

### Query Performance
- Time-series queries: Optimized with composite indexes
- Aggregation queries: Use SQL aggregation functions
- Duplicate detection: Efficient with indexed queries

## Validation Rules

### Input Validation
- ISO 8601 timestamp format required
- End time must be after start time
- GPS coordinates must be valid (-90 to 90 lat, -180 to 180 lon)
- Numeric inputs validated (distance, speed, braking counts)

### Anomaly Thresholds
- **Max Speed**: 200 km/h
- **GPS Jump**: > 5km in < 1 minute
- **Duplicate Window**: 5 minutes, 500m distance tolerance

## Error Handling

- All errors logged with context
- Anomalies logged but don't block trip processing
- Validation errors return 400 status
- Processing errors return 500 status with message

## Audit Trail

- All trips include `created_at` timestamp
- Anomaly details stored in response
- Score calculations are deterministic and reproducible
- Historical data is never modified (immutable)

## Usage Examples

### Process a Trip
```typescript
const tripJSON = {
  startTime: "2026-01-23T10:00:00Z",
  endTime: "2026-01-23T10:30:00Z",
  gpsPoints: [...],
  events: {...}
};

const metrics = await telematicsProcessor.processTrip(tripJSON, userId);
```

### Get Weekly Score
```typescript
const weeklyScore = await scoreAggregation.getWeeklyScore(userId);
```

### Get Time-Series Data
```typescript
const timeSeries = await scoreAggregation.getTimeSeriesData(
  userId,
  startDate,
  endDate,
  'daily'
);
```

## Migration

Run the SQL migration to add indexes:
```bash
psql $DATABASE_URL < migrations/add_timeseries_indexes.sql
```

Or use Drizzle Kit to generate and apply migrations.

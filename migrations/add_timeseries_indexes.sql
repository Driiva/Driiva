-- Optimize time-series queries for driving behavior data
-- Run this migration to add indexes for improved query performance

-- Index on trips.start_time for time-range queries (most common)
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time DESC);

-- Composite index for user + time range queries (optimizes getTripsByDateRange)
CREATE INDEX IF NOT EXISTS idx_trips_user_start_time ON trips(user_id, start_time DESC);

-- Index on trips.end_time for end-time range queries
CREATE INDEX IF NOT EXISTS idx_trips_end_time ON trips(end_time DESC);

-- Composite index for duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_trips_user_time_distance ON trips(user_id, start_time, end_time, distance);

-- Index for score aggregation queries
CREATE INDEX IF NOT EXISTS idx_trips_user_score_time ON trips(user_id, score, start_time DESC);

-- Index for driving profile updates (if needed)
CREATE INDEX IF NOT EXISTS idx_driving_profiles_user_id ON driving_profiles(user_id);

-- Note: These indexes will improve query performance for:
-- 1. Time-series data retrieval (getTripsByDateRange)
-- 2. Score aggregation (weekly/monthly scores)
-- 3. Duplicate trip detection
-- 4. User trip history queries
--
-- Trade-off: Indexes use additional storage space and slightly slow down writes,
-- but significantly speed up reads for time-series queries.

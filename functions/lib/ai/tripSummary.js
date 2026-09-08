"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTripSummary = buildTripSummary;
const numeric_1 = require("./numeric");
// ---------------------------------------------------------------------------
// STEP 2: BUILD TRIP SUMMARY
// ---------------------------------------------------------------------------
function buildTripSummary(tripId, trip, points, profile, segmentation) {
    const MPS_TO_KMH = 3.6;
    // Speed stats from points
    const speeds = points
        .map(p => (p.spd / 100) * MPS_TO_KMH) // integer m/s*100 → km/h
        .filter(s => s >= 0 && s < 300)
        .sort((a, b) => a - b);
    const speedProfile = speeds.length >= 5
        ? {
            p10: (0, numeric_1.percentile)(speeds, 10),
            p25: (0, numeric_1.percentile)(speeds, 25),
            p50: (0, numeric_1.percentile)(speeds, 50),
            p75: (0, numeric_1.percentile)(speeds, 75),
            p90: (0, numeric_1.percentile)(speeds, 90),
        }
        : { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
    // Acceleration profile from consecutive points
    const accels = [];
    for (let i = 1; i < points.length; i++) {
        const dt = (points[i].t - points[i - 1].t) / 1000;
        if (dt > 0 && dt < 10) {
            const dv = (points[i].spd - points[i - 1].spd) / 100; // m/s
            accels.push(dv / dt);
        }
    }
    const accelerationProfile = accels.length > 0
        ? {
            maxDecelMps2: (0, numeric_1.round2)(Math.min(...accels)),
            maxAccelMps2: (0, numeric_1.round2)(Math.max(...accels)),
            avgAbsAccelMps2: (0, numeric_1.round2)(accels.reduce((s, a) => s + Math.abs(a), 0) / accels.length),
        }
        : { maxDecelMps2: 0, maxAccelMps2: 0, avgAbsAccelMps2: 0 };
    // Speed variance in km/h
    const avgKmh = speeds.length > 0
        ? speeds.reduce((s, v) => s + v, 0) / speeds.length
        : 0;
    const variance = speeds.length > 0
        ? Math.sqrt(speeds.reduce((s, v) => s + (v - avgKmh) ** 2, 0) / speeds.length)
        : 0;
    // Determine time context
    const tripDate = trip.startedAt.toDate();
    const hours = tripDate.getHours();
    const timeOfDay = hours < 6
        ? 'late_night'
        : hours < 12
            ? 'morning'
            : hours < 17
                ? 'afternoon'
                : hours < 21
                    ? 'evening'
                    : 'night';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Determine recent trend from profile
    const recentTrend = determineRecentTrend(profile);
    return {
        tripId,
        distanceKm: (0, numeric_1.round2)(trip.distanceMeters / 1000),
        durationMinutes: (0, numeric_1.round2)(trip.durationSeconds / 60),
        avgSpeedKmh: (0, numeric_1.round2)(avgKmh),
        maxSpeedKmh: (0, numeric_1.round2)(speeds.length > 0 ? speeds[speeds.length - 1] : 0),
        speedVarianceKmh: (0, numeric_1.round2)(variance),
        events: {
            hardBraking: trip.events.hardBrakingCount,
            hardAcceleration: trip.events.hardAccelerationCount,
            speedingSeconds: trip.events.speedingSeconds,
            sharpTurns: trip.events.sharpTurnCount,
            phonePickups: trip.events.phonePickupCount,
        },
        algorithmicScore: trip.score,
        scoreBreakdown: {
            speed: trip.scoreBreakdown.speedScore,
            braking: trip.scoreBreakdown.brakingScore,
            acceleration: trip.scoreBreakdown.accelerationScore,
            cornering: trip.scoreBreakdown.corneringScore,
            phoneUsage: trip.scoreBreakdown.phoneUsageScore,
        },
        context: {
            timeOfDay,
            dayOfWeek: days[tripDate.getDay()],
            isNightDriving: trip.context?.isNightDriving ?? false,
            isRushHour: trip.context?.isRushHour ?? false,
        },
        segmentation: segmentation
            ? {
                totalStops: segmentation.summary.totalStops,
                totalSegments: segmentation.summary.totalTrips,
            }
            : null,
        driverHistory: {
            totalTrips: profile.totalTrips,
            averageScore: (0, numeric_1.round2)(profile.currentScore),
            totalMiles: (0, numeric_1.round2)(profile.totalMiles),
            riskTier: profile.riskTier,
            streakDays: profile.streakDays,
            recentTrend,
        },
        speedProfile,
        accelerationProfile,
    };
}
function determineRecentTrend(profile) {
    // If fewer than 3 trips, not enough data to determine trend
    if (profile.totalTrips < 3)
        return 'stable';
    // Use streak as a proxy: positive streak = improving
    if (profile.streakDays >= 3)
        return 'improving';
    if (profile.streakDays === 0 && profile.totalTrips > 5)
        return 'declining';
    return 'stable';
}
//# sourceMappingURL=tripSummary.js.map
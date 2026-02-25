/**
 * TRIP DETAIL PAGE
 * ================
 * Shows a completed trip's driven route on a map plus score breakdown,
 * driving events, and AI insights (if available).
 */

import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Route as RouteIcon,
  Zap,
  Shield,
  AlertTriangle,
  Navigation,
  Loader2,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTrip, getTripPoints, fetchTripAIInsights } from '@/lib/firestore';
import type { TripDocument, TripPoint } from '../../../shared/firestore-types';
import type { TripAIInsight } from '@/lib/firestore';
import TripRouteMap from '@/components/TripRouteMap';
import { BottomNav } from '@/components/BottomNav';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)} m` : `${miles.toFixed(1)} mi`;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
  if (score >= 60) return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
  return 'from-red-500/20 to-red-600/10 border-red-500/30';
}

export default function TripDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/trips/:tripId');
  const { user } = useAuth();
  const tripId = params?.tripId;

  const [trip, setTrip] = useState<TripDocument | null>(null);
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [insights, setInsights] = useState<TripAIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    async function load() {
      try {
        const [tripData, tripPoints] = await Promise.all([
          getTrip(tripId!),
          getTripPoints(tripId!),
        ]);

        if (!tripData) {
          setError('Trip not found');
          setLoading(false);
          return;
        }

        setTrip(tripData);
        setPoints(tripPoints);

        // Attempt to load AI insights (non-blocking)
        try {
          const ai = await fetchTripAIInsights(tripId!);
          setInsights(ai);
        } catch {
          // AI insights are optional
        }
      } catch (err) {
        console.error('[TripDetail] Load error:', err);
        setError('Failed to load trip');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-white/70">{error ?? 'Trip not found'}</p>
        <button
          onClick={() => setLocation('/trips')}
          className="text-emerald-400 underline text-sm"
        >
          Back to trips
        </button>
      </div>
    );
  }

  const startDate = trip.startedAt?.toDate?.();
  const formattedDate = startDate
    ? startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';
  const formattedTime = startDate
    ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  const bd = trip.scoreBreakdown;
  const ev = trip.events;

  return (
    <div className="min-h-screen text-white safe-area pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a1a]/90 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => setLocation('/trips')} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Trip Detail</h1>
          <p className="text-xs text-white/50">{formattedDate} at {formattedTime}</p>
        </div>
        <div className={`text-2xl font-bold ${scoreColor(trip.score)}`}>{trip.score}</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Route map */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {points.length >= 2 ? (
            <TripRouteMap points={points} height="280px" />
          ) : (
            <div className="h-[200px] rounded-xl bg-[#1a1a2e]/50 flex items-center justify-center">
              <p className="text-white/40 text-sm">No GPS data available for this trip</p>
            </div>
          )}
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatCard icon={RouteIcon} label="Distance" value={formatDistance(trip.distanceMeters)} />
          <StatCard icon={Clock} label="Duration" value={formatDuration(trip.durationSeconds)} />
          <StatCard icon={MapPin} label="Points" value={String(trip.pointsCount)} />
        </motion.div>

        {/* Score breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`dashboard-glass-card bg-gradient-to-br ${scoreBg(trip.score)}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold">Score Breakdown</h2>
          </div>
          <div className="space-y-3">
            <ScoreRow label="Speed" score={bd.speedScore} weight="25%" />
            <ScoreRow label="Braking" score={bd.brakingScore} weight="25%" />
            <ScoreRow label="Acceleration" score={bd.accelerationScore} weight="20%" />
            <ScoreRow label="Cornering" score={bd.corneringScore} weight="20%" />
            <ScoreRow label="Phone Usage" score={bd.phoneUsageScore} weight="10%" />
          </div>
        </motion.div>

        {/* Driving events */}
        {(ev.hardBrakingCount > 0 || ev.hardAccelerationCount > 0 || ev.speedingSeconds > 0 || ev.sharpTurnCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="dashboard-glass-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold">Driving Events</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {ev.hardBrakingCount > 0 && <EventRow label="Hard Braking" value={String(ev.hardBrakingCount)} />}
              {ev.hardAccelerationCount > 0 && <EventRow label="Hard Accel" value={String(ev.hardAccelerationCount)} />}
              {ev.speedingSeconds > 0 && <EventRow label="Speeding" value={`${ev.speedingSeconds}s`} />}
              {ev.sharpTurnCount > 0 && <EventRow label="Sharp Turns" value={String(ev.sharpTurnCount)} />}
            </div>
          </motion.div>
        )}

        {/* AI insights */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="dashboard-glass-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold">AI Insights</h2>
            </div>
            <p className="text-sm text-white/70 mb-3">{insights.summary}</p>
            {insights.strengths.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-emerald-400 mb-1">Strengths</p>
                <ul className="text-xs text-white/60 space-y-0.5 pl-3 list-disc">
                  {insights.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {insights.improvements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-400 mb-1">Improvements</p>
                <ul className="text-xs text-white/60 space-y-0.5 pl-3 list-disc">
                  {insights.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Trip context */}
        {trip.context && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="dashboard-glass-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">Trip Context</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {trip.context.isNightDriving && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">Night Drive</span>
              )}
              {trip.context.isRushHour && (
                <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300">Rush Hour</span>
              )}
              {!trip.context.isNightDriving && !trip.context.isRushHour && (
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/60">Normal Conditions</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="dashboard-glass-card text-center py-3">
      <Icon className="w-4 h-4 text-white/40 mx-auto mb-1" />
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
    </div>
  );
}

function ScoreRow({ label, score, weight }: { label: string; score: number; weight: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/70 w-28 shrink-0">{label} <span className="text-white/30 text-xs">({weight})</span></span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-medium w-8 text-right ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

function EventRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

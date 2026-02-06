/**
 * TRIP AI INSIGHTS COMPONENT
 * ==========================
 * Displays Claude Sonnet 4-powered analysis for a specific trip.
 *
 * States:
 *   1. Loading — skeleton pulse
 *   2. No insights yet — CTA to request analysis
 *   3. Insights available — full breakdown
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  BarChart3,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripAIInsights } from '@/hooks/useTripAIInsights';
import type { TripAIInsight } from '@/lib/firestore';
import { useState } from 'react';

interface TripAIInsightsProps {
  tripId: string;
  tripStatus?: string;
  className?: string;
}

export default function TripAIInsights({
  tripId,
  tripStatus = 'completed',
  className = '',
}: TripAIInsightsProps) {
  const {
    insights,
    isLoading,
    isFetching,
    requestAnalysis,
    isAnalyzing,
  } = useTripAIInsights({
    tripId,
    enabled: tripStatus === 'completed',
  });

  const [expanded, setExpanded] = useState(false);

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card className={`glass-morphism border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-white">AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl skeleton-pulse" />
          <Skeleton className="h-12 w-full rounded-xl skeleton-pulse" />
          <Skeleton className="h-20 w-full rounded-xl skeleton-pulse" />
        </CardContent>
      </Card>
    );
  }

  // ── No insights — CTA to request ──
  if (!insights) {
    return (
      <Card className={`glass-morphism border-0 ${className}`}>
        <CardContent className="py-6">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">AI Trip Analysis</h3>
              <p className="text-gray-400 text-sm mt-1">
                Get detailed driving insights powered by Claude AI
              </p>
            </div>
            <button
              onClick={() => requestAnalysis()}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                bg-gradient-to-r from-purple-500 to-blue-500 text-white
                hover:from-purple-600 hover:to-blue-600 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Trip
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Insights available ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="glass-morphism border-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-white">AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level={insights.riskLevel} />
              {isFetching && (
                <RefreshCw className="w-3.5 h-3.5 text-gray-500 animate-spin" />
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-gray-200 text-sm leading-relaxed">
              {insights.summary}
            </p>
          </div>

          {/* Score Adjustment */}
          <ScoreAdjustmentCard adjustment={insights.scoreAdjustment} />

          {/* Patterns (top 2 always shown) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Driving Patterns
            </h4>
            <AnimatePresence initial={false}>
              {insights.patterns
                .slice(0, expanded ? undefined : 2)
                .map((pattern, i) => (
                  <PatternCard key={i} pattern={pattern} index={i} />
                ))}
            </AnimatePresence>
            {insights.patterns.length > 2 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors mx-auto"
              >
                {expanded ? 'Show less' : `+${insights.patterns.length - 2} more`}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Safety Tips */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Safety Tips
            </h4>
            {insights.safetyTips.map((tip, i) => (
              <SafetyTipCard key={i} tip={tip} index={i} />
            ))}
          </div>

          {/* Historical Comparison */}
          <HistoricalComparisonCard comparison={insights.historicalComparison} />

          {/* Context Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {insights.contextFactors.dayOfWeek} {insights.contextFactors.timeOfDay}
              {insights.contextFactors.isNightDriving && ' · Night'}
              {insights.contextFactors.isRushHour && ' · Rush hour'}
            </span>
            <span>
              {insights.contextFactors.estimatedRoadType} · {insights.model.replace('claude-', '').replace(/-\d+$/, '')}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Low Risk' },
    moderate: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Moderate' },
    elevated: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Elevated' },
    high: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'High Risk' },
  };
  const c = config[level] ?? config.moderate;

  return (
    <Badge variant="outline" className={`${c.bg} ${c.text} border-current/30 text-[10px] font-medium`}>
      {c.label}
    </Badge>
  );
}

function ScoreAdjustmentCard({
  adjustment,
}: {
  adjustment: TripAIInsight['scoreAdjustment'];
}) {
  const delta = adjustment.delta;
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <motion.div
      className="glass-card rounded-xl p-4"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          AI Score Assessment
        </h4>
        <span className="text-[10px] text-gray-500">
          {(adjustment.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-white">
          {adjustment.adjustedScore}
        </span>
        {!isNeutral && (
          <span
            className={`text-sm font-semibold flex items-center gap-0.5 ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {isPositive ? '+' : ''}{delta}
          </span>
        )}
        {isNeutral && (
          <span className="text-sm text-gray-500 flex items-center gap-0.5">
            <Minus className="w-3.5 h-3.5" />
            No change
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">{adjustment.reasoning}</p>
    </motion.div>
  );
}

function PatternCard({
  pattern,
  index,
}: {
  pattern: TripAIInsight['patterns'][number];
  index: number;
}) {
  const severityColor: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-500/10',
    moderate: 'text-yellow-400 bg-yellow-500/10',
    elevated: 'text-orange-400 bg-orange-500/10',
    high: 'text-red-400 bg-red-500/10',
  };
  const color = severityColor[pattern.severity] ?? severityColor.moderate;

  return (
    <motion.div
      className="glass-card rounded-lg p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white truncate">
              {pattern.title}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color}`}
            >
              {pattern.severity}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {pattern.description}
          </p>
        </div>
        {pattern.scoreImpact !== 0 && (
          <span
            className={`text-xs font-semibold whitespace-nowrap ${
              pattern.scoreImpact > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {pattern.scoreImpact > 0 ? '+' : ''}{pattern.scoreImpact}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SafetyTipCard({
  tip,
  index,
}: {
  tip: TripAIInsight['safetyTips'][number];
  index: number;
}) {
  const priorityIcon: Record<string, JSX.Element> = {
    high: <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />,
    medium: <Shield className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />,
    low: <Lightbulb className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />,
  };

  return (
    <motion.div
      className="glass-card rounded-lg p-3 flex items-start gap-2.5"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ x: 3 }}
    >
      {priorityIcon[tip.priority] ?? priorityIcon.medium}
      <p className="text-xs text-gray-200 leading-relaxed">{tip.tip}</p>
    </motion.div>
  );
}

function HistoricalComparisonCard({
  comparison,
}: {
  comparison: TripAIInsight['historicalComparison'];
}) {
  const trendIcon =
    comparison.trendDirection === 'improving' ? (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : comparison.trendDirection === 'declining' ? (
      <TrendingDown className="w-4 h-4 text-red-400" />
    ) : (
      <Minus className="w-4 h-4 text-gray-500" />
    );

  const trendColor =
    comparison.trendDirection === 'improving'
      ? 'text-emerald-400'
      : comparison.trendDirection === 'declining'
      ? 'text-red-400'
      : 'text-gray-400';

  const deltaText =
    comparison.vsAverageScore > 0
      ? `+${comparison.vsAverageScore} above`
      : comparison.vsAverageScore < 0
      ? `${comparison.vsAverageScore} below`
      : 'At';

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          vs Your Average
        </h4>
        <div className="flex items-center gap-1">
          {trendIcon}
          <span className={`text-xs font-medium capitalize ${trendColor}`}>
            {comparison.trendDirection}
          </span>
        </div>
      </div>
      <p className="text-sm text-white font-medium">
        {deltaText} your average
      </p>
      <p className="text-xs text-gray-400 mt-1">{comparison.consistencyNote}</p>
    </div>
  );
}

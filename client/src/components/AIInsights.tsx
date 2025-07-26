import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Brain, Leaf, Users, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { AIInsight } from "@shared/types/aiInsights";

interface AIInsightsProps {
  userId: number;
}

export default function AIInsights({ userId }: AIInsightsProps) {
  const { data: insights, isLoading } = useQuery<AIInsight>({
    queryKey: ['/api/insights', userId],
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="glass-morphism border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-[#A855F7]" />
            <span>AI-Powered Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg skeleton-pulse" />
            <Skeleton className="h-32 w-full rounded-lg skeleton-pulse" />
            <Skeleton className="h-24 w-full rounded-lg skeleton-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-[#10B981]" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-[#EF4444]" />;
      default:
        return <Minus className="w-4 h-4 text-[#6B7280]" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-[#10B981]';
      case 'decreasing':
        return 'text-[#EF4444]';
      default:
        return 'text-[#6B7280]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-morphism border-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-[#A855F7]" />
              <span>AI-Powered Insights</span>
            </div>
            <Badge variant="outline" className="glass-card border-[#A855F7] text-[#A855F7]">
              Live Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Trend */}
          <motion.div 
            className="glass-card rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Risk Trajectory</h3>
              {getTrendIcon(insights.riskTrend)}
            </div>
            <p className={`text-lg font-bold ${getTrendColor(insights.riskTrend)}`}>
              Risk {insights.riskTrend === 'increasing' ? 'Rising' : 
                    insights.riskTrend === 'decreasing' ? 'Improving' : 'Stable'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Based on your last 5 trips
            </p>
          </motion.div>

          {/* Refund Prediction */}
          <motion.div 
            className="glass-card rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Refund Forecast</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#10B981]">
                  £{insights.refundPrediction.amount}
                </div>
                <div className="text-xs text-gray-400">
                  {(insights.refundPrediction.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Projected in {insights.refundPrediction.timeline}</span>
              <Badge variant="outline" className="text-xs">
                {insights.riskTrend === 'increasing' ? 'At Risk' : 'On Track'}
              </Badge>
            </div>
          </motion.div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span>Personalized Recommendations</span>
            </h3>
            {insights.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                className="glass-card rounded-lg p-3 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <p className="text-gray-200">{rec}</p>
              </motion.div>
            ))}
          </div>

          {/* Sustainability Score */}
          <motion.div 
            className="glass-card rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#10B981] bg-opacity-20 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Eco Impact</h3>
                <p className="text-xs text-gray-400">
                  {insights.sustainabilityScore.co2Saved}kg CO₂ saved
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={`
                  ${insights.sustainabilityScore.monthlyTrend === 'improving' ? 'border-[#10B981] text-[#10B981]' :
                    insights.sustainabilityScore.monthlyTrend === 'declining' ? 'border-[#EF4444] text-[#EF4444]' :
                    'border-gray-400 text-gray-400'}
                `}
              >
                {insights.sustainabilityScore.monthlyTrend}
              </Badge>
            </div>
          </motion.div>

          {/* Community Comparison */}
          <motion.div 
            className="glass-card rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#06B6D4] bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Community Standing</h3>
                <p className="text-xs text-gray-400">
                  Better than {insights.communityComparison.betterThan}% of drivers
                </p>
              </div>
              {insights.communityComparison.topPercentile && (
                <Badge variant="outline" className="border-[#F59E0B] text-[#F59E0B]">
                  Top 15%
                </Badge>
              )}
            </div>
            {insights.communityComparison.potentialRefundBoost > 0 && (
              <p className="text-xs text-gray-400 mt-3">
                Match top performers to boost refund by £{insights.communityComparison.potentialRefundBoost}
              </p>
            )}
          </motion.div>

          {/* Behavior Patterns */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Driving Patterns</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Best Performance</p>
                <p className="text-sm font-medium">
                  {insights.behaviorPatterns.bestDays.join(', ')}
                </p>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Needs Attention</p>
                <p className="text-sm font-medium">
                  {insights.behaviorPatterns.riskiestTimes.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
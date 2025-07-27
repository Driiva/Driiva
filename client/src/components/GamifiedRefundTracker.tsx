import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Trophy, Target, ArrowRight, Star } from "lucide-react";
import { useState } from "react";

interface GamifiedRefundTrackerProps {
  currentScore: number;
  projectedRefund: number;
  premiumAmount: number;
  totalMiles: number;
  achievements: any[];
}

export default function GamifiedRefundTracker({ 
  currentScore, 
  projectedRefund, 
  premiumAmount,
  totalMiles,
  achievements 
}: GamifiedRefundTrackerProps) {
  const [selectedGoal, setSelectedGoal] = useState<'silver' | 'gold' | 'platinum'>('silver');

  const refundPercentage = (projectedRefund / premiumAmount) * 100;
  const scoreToRefundRatio = currentScore / 100;

  const goals = {
    silver: { score: 85, refund: premiumAmount * 0.12, label: "Silver Tier", color: "text-gray-400", bg: "bg-gray-400/20" },
    gold: { score: 90, refund: premiumAmount * 0.15, label: "Gold Tier", color: "text-yellow-400", bg: "bg-yellow-400/20" },
    platinum: { score: 95, refund: premiumAmount * 0.18, label: "Platinum Tier", color: "text-purple-400", bg: "bg-purple-400/20" }
  };

  const currentGoal = goals[selectedGoal];
  const progressToGoal = Math.min((currentScore / currentGoal.score) * 100, 100);
  const remainingScore = Math.max(currentGoal.score - currentScore, 0);

  return (
    <Card className="glass-morphism border-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Refund Challenge</span>
          </div>
          <Badge variant="outline" className="glass-card border-yellow-400 text-yellow-400">
            Game Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <motion.div 
          className="glass-card rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">Current Progress</h3>
              <p className="text-sm text-gray-400">Your driving performance</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">£{projectedRefund.toFixed(2)}</div>
              <div className="text-sm text-gray-400">{refundPercentage.toFixed(1)}% refund</div>
            </div>
          </div>
          
          <Progress value={scoreToRefundRatio * 100} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Score: {currentScore}/100</span>
            <span>{totalMiles.toLocaleString()} miles driven</span>
          </div>
        </motion.div>

        {/* Goal Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Choose Your Challenge</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(goals).map(([tier, goal]) => (
              <motion.button
                key={tier}
                onClick={() => setSelectedGoal(tier as 'silver' | 'gold' | 'platinum')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedGoal === tier 
                    ? `border-current ${goal.bg} ${goal.color}` 
                    : 'border-gray-600 glass-card hover:border-gray-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <Trophy className={`w-4 h-4 mx-auto mb-1 ${selectedGoal === tier ? goal.color : 'text-gray-400'}`} />
                  <div className={`text-xs font-medium ${selectedGoal === tier ? goal.color : 'text-gray-400'}`}>
                    {goal.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    £{goal.refund.toFixed(0)}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected Goal Progress */}
        <motion.div 
          className="glass-card rounded-xl p-4"
          key={selectedGoal}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${currentGoal.color}`}>{currentGoal.label} Challenge</h3>
              <p className="text-xs text-gray-400">
                {remainingScore > 0 
                  ? `${remainingScore} points to unlock` 
                  : 'Challenge completed! 🎉'
                }
              </p>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${currentGoal.color}`}>
                £{currentGoal.refund.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                +£{(currentGoal.refund - projectedRefund).toFixed(2)} more
              </div>
            </div>
          </div>

          <Progress value={progressToGoal} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentScore}/{currentGoal.score} points</span>
            <span>{progressToGoal.toFixed(1)}% complete</span>
          </div>
        </motion.div>

        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              Recent Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 3).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="glass-card border-yellow-400 text-yellow-400 text-xs">
                    {achievement.name}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            View Challenge Details
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full glass-card border-gray-600 hover:border-gray-500"
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Track Progress History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
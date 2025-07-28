import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { drivingScorer } from "@/lib/scoring";

interface RefundSimulatorProps {
  currentScore: number;
  premiumAmount: number;
  poolSafetyFactor: number;
}

export default function RefundSimulator({ 
  currentScore, 
  premiumAmount, 
  poolSafetyFactor 
}: RefundSimulatorProps) {
  const [simulatedScore, setSimulatedScore] = useState(currentScore);

  const calculateRefund = (score: number): string => {
    return drivingScorer.calculateRefundProjection(
      score,
      poolSafetyFactor || 0.85,
      premiumAmount || 1840
    ).toString();
  };

  const currentRefund = calculateRefund(currentScore);
  const simulatedRefund = calculateRefund(simulatedScore);
  const improvement = Number(simulatedRefund) - Number(currentRefund);

  const getEligibilityMessage = (score: number): string => {
    if (score < 70) {
      return "Need 70+ score to qualify for refunds";
    }
    const percentile = Math.round(((score - 70) / 30) * 100);
    return `Eligible for refunds (${percentile}% towards max)`;
  };

  const getScoreColor = (score: number): string => {
    if (score < 70) return "text-red-400";
    if (score < 80) return "text-yellow-400";
    if (score < 90) return "text-[#06B6D4]";
    return "text-[#10B981]";
  };

  return (
    <section className="mb-3 sm:mb-4">
      <div className="glass-morphism-subtle rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold">Refund Simulator</h3>
          <div className="text-xs text-gray-400">
            Premium: £{premiumAmount || 1840}
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          See how improvements could boost your refund
        </p>

        <div className="space-y-4">
          {/* Current Score Display */}
          <div className="p-3 glass-card rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-400">Current Score</div>
                <div className={`text-lg font-bold ${getScoreColor(currentScore)}`}>
                  {currentScore}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Current Refund</div>
                <div className="text-lg font-bold text-[#10B981]">
                  £{currentRefund}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {getEligibilityMessage(currentScore)}
            </div>
          </div>

          {/* Score Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Simulate Score</label>
              <span className={`text-sm font-semibold ${getScoreColor(simulatedScore)}`}>
                {simulatedScore}
              </span>
            </div>
            <Slider
              value={[simulatedScore]}
              onValueChange={(value) => setSimulatedScore(value[0])}
              max={100}
              min={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50</span>
              <span className="text-yellow-400">70 (Min for refund)</span>
              <span>100</span>
            </div>
          </div>

          {/* Simulation Results */}
          <div className="p-4 glass-card rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">Potential Refund</div>
                <div className="text-xl font-bold text-[#10B981]">
                  £{simulatedRefund}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Improvement</div>
                <div className={`text-lg font-semibold ${
                  improvement > 0 ? 'text-[#10B981]' : 
                  improvement < 0 ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  {improvement > 0 ? `+£${improvement.toFixed(2)}` : 
                   improvement < 0 ? `-£${Math.abs(improvement).toFixed(2)}` :
                   '£0.00'}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              {simulatedScore < 70 ? 
                "Score must be 70+ to qualify for refunds" :
                `Refund rate: ${(((simulatedScore - 70) / 30) * 10 + 5).toFixed(1)}% of premium`
              }
            </div>
          </div>

          {/* Improvement Tips */}
          {improvement > 0 && (
            <div className="p-3 glass-card rounded-xl border border-[#10B981]/20">
              <div className="text-xs text-[#10B981] font-medium mb-1">
                💡 How to achieve this score:
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                {simulatedScore > currentScore + 10 && (
                  <div>• Reduce hard braking events by 50%</div>
                )}
                {simulatedScore > currentScore + 5 && (
                  <div>• Maintain consistent speeds</div>
                )}
                <div>• Avoid night driving when possible</div>
                <div>• Take smoother corners</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
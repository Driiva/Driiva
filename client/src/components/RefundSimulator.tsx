import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface RefundSimulatorProps {
  currentScore: number;
  premiumAmount: number;
  poolSafetyFactor: number;
}

export default function RefundSimulator({ currentScore, premiumAmount, poolSafetyFactor }: RefundSimulatorProps) {
  const [simulatedScore, setSimulatedScore] = useState(currentScore);

  const calculateRefund = (score: number) => {
    // Only drivers with personal score >= 70 are eligible for refunds (per documentation)
    if (score < 70) {
      return "0.00";
    }

    // Community average score is 75 as per document
    const communityScore = 75;

    // Weighting: 80% personal, 20% community (per documentation)
    const weightedScore = (score * 0.8) + (communityScore * 0.2);

    // Base refund starts at 5% for 70+ score, scales to 15% at 100 score
    const baseRefundRate = 0.05;
    const maxRefundRate = 0.15;
    const scoreRange = 100 - 70; // 30 point range
    const scoreAboveMin = Math.max(0, score - 70);

    // Linear scaling from 5% to 15% based on score above 70
    const refundRate = baseRefundRate + ((maxRefundRate - baseRefundRate) * (scoreAboveMin / scoreRange));
    const refundAmount = Number(premiumAmount || 1840) * Math.min(refundRate, maxRefundRate);

    return Math.max(0, refundAmount).toFixed(2);
  };

  const currentRefund = calculateRefund(currentScore);
  const simulatedRefund = calculateRefund(simulatedScore);
  const improvement = Number(simulatedRefund) - Number(currentRefund);

  return (
    <section className="mb-3 sm:mb-4">
      <div className="glass-morphism-subtle rounded-xl p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold mb-2">Refund Simulator</h3>
        <p className="text-xs text-gray-400 mb-3">See how improvements could boost your refund</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Personal Score</label>
              <span className="text-sm text-[#06B6D4]">{simulatedScore}</span>
            </div>
            <Slider
              value={[simulatedScore]}
              onValueChange={(value) => setSimulatedScore(value[0])}
              max={100}
              min={60}
              step={1}
              className="w-full"
            />
          </div>

          <div className="p-4 glass-card rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">Potential Refund</div>
                <div className="text-xl font-bold text-[#10B981]">£{simulatedRefund}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Improvement</div>
                <div className={`text-lg font-semibold ${improvement >= 0 ? 'text-[#10B981]' : 'text-gray-400'}`}>
                  {improvement >= 0 ? `+£${improvement.toFixed(2)}` : 'Need 70+ score'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
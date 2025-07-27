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
    // Only drivers with personal score >= 80 are eligible for refunds
    if (score < 80) {
      return "0.00";
    }
    
    // Community average score is 75 as per document
    const communityScore = 75;
    
    // Weighting: 80% personal, 20% community
    const weightedScore = (score * 0.8) + (communityScore * 0.2);
    
    // For eligible drivers, refund is capped at 15% of premium
    const refundAmount = Number(premiumAmount || 1840) * 0.15;
    
    return refundAmount.toFixed(2);
  };

  const currentRefund = calculateRefund(currentScore);
  const simulatedRefund = calculateRefund(simulatedScore);
  const improvement = Number(simulatedRefund) - Number(currentRefund);

  return (
    <section className="mb-3">
      <div className="glass-morphism-subtle rounded-xl p-3">
        <h3 className="text-base font-semibold mb-2">Refund Simulator</h3>
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
                <div className={`text-lg font-semibold ${improvement >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {improvement >= 0 ? '+' : ''}£{improvement.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

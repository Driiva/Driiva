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
    const maxRefund = Number(premiumAmount) * 0.15;
    const weightedScore = (score * 0.8) + (poolSafetyFactor * 100 * 0.2);
    const refundPercentage = weightedScore / 100;
    return (maxRefund * refundPercentage).toFixed(2);
  };

  const currentRefund = calculateRefund(currentScore);
  const simulatedRefund = calculateRefund(simulatedScore);
  const improvement = Number(simulatedRefund) - Number(currentRefund);

  return (
    <section className="mb-6">
      <div className="glass-morphism rounded-3xl p-6">
        <h3 className="text-lg font-semibold mb-4">Refund Simulator</h3>
        <p className="text-sm text-gray-400 mb-6">See how improvements could boost your refund</p>

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

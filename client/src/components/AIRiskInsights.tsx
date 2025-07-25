
import { RiskProfile, RiskFactor } from '@/lib/scoring';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Brain, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIRiskInsightsProps {
  riskProfile: RiskProfile;
  className?: string;
}

export default function AIRiskInsights({ riskProfile, className = '' }: AIRiskInsightsProps) {
  // Handle missing or invalid risk profile
  if (!riskProfile) {
    return (
      <section className={`${className}`}>
        <div className="glass-morphism rounded-3xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Risk Analysis</h3>
              <p className="text-sm text-gray-400">Processing trip data...</p>
            </div>
          </div>
          <div className="text-center py-8">
            <div className="animate-pulse bg-white/10 rounded-xl h-24 mb-4"></div>
            <p className="text-gray-400">AI models are analyzing your driving data</p>
          </div>
        </div>
      </section>
    );
  }
  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRiskFactorIcon = (factor: string) => {
    switch (factor) {
      case 'Aggressive Driving': return <TrendingUp className="w-4 h-4" />;
      case 'Night Driving': return <AlertTriangle className="w-4 h-4" />;
      case 'Speed Violations': return <Target className="w-4 h-4" />;
      default: return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <section className={`${className}`}>
      <div className="glass-morphism rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Risk Analysis</h3>
            <p className="text-sm text-gray-400">Machine learning insights</p>
          </div>
        </div>

        {/* Risk Score Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Risk Score</span>
              <Shield className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {(riskProfile.riskScore * 100).toFixed(1)}
            </div>
            <Badge className={`mt-2 ${getRiskCategoryColor(riskProfile.riskCategory)}`}>
              {riskProfile.riskCategory}
            </Badge>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Claim Probability</span>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskProfile.predictedClaimProbability.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Confidence: {(riskProfile.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {riskProfile.riskFactors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Risk Factors</h4>
            <div className="space-y-3">
              {riskProfile.riskFactors.slice(0, 3).map((factor, index) => (
                <div key={index} className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getRiskFactorIcon(factor.factor)}
                      <span className="text-sm font-medium text-white">{factor.factor}</span>
                    </div>
                    <Badge className={`text-xs ${getSeverityColor(factor.severity)}`}>
                      {factor.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{factor.description}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Impact</span>
                      <span className="text-gray-300">{(factor.impact * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          factor.severity === 'HIGH' ? 'bg-red-500' :
                          factor.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${factor.impact * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {riskProfile.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">AI Recommendations</h4>
            <div className="space-y-2">
              {riskProfile.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by ensemble ML models</span>
            <span>Updated in real-time</span>
          </div>
        </div>
      </div>
    </section>
  );
}

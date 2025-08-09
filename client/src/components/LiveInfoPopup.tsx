import React, { useState } from 'react';
import { X, Activity, Users, TrendingUp, Shield, Clock } from 'lucide-react';

interface LiveInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  poolData?: {
    poolAmount: number;
    safetyFactor: number;
    participantCount: number;
    safeDriverCount: number;
  };
}

export default function LiveInfoPopup({ isOpen, onClose, poolData }: LiveInfoPopupProps) {
  if (!isOpen) return null;

  const safetyPercentage = poolData ? (Number(poolData.safetyFactor) * 100).toFixed(0) : '80';
  const poolAmount = poolData ? Number(poolData.poolAmount).toFixed(0) : '105,000';
  const participantCount = poolData?.participantCount || 1000;
  const safeDriverCount = poolData?.safeDriverCount || 800;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-[#0A0F1C] rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 15, 28, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse shadow-lg" 
                 style={{ boxShadow: '0 0 10px #10B981' }}></div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#10B981]" />
              Live Community Pool
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="popup-close-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Real-Time Explanation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#10B981] font-semibold">
              <Clock className="w-4 h-4" />
              <span>Real-Time Data Updates</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your community pool data updates every 5 minutes with live driving data from all Driiva members. 
              This ensures your refund calculations are always based on the most current community safety performance.
            </p>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-morphism-subtle rounded-lg p-4" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Pool</span>
              </div>
              <div className="text-lg font-bold text-white">£{poolAmount}</div>
            </div>

            <div className="glass-morphism-subtle rounded-lg p-4" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs text-gray-400">Safety Factor</span>
              </div>
              <div className="text-lg font-bold text-[#10B981]">{safetyPercentage}%</div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Community Performance</span>
            </div>
            
            <div className="glass-morphism-subtle rounded-lg p-4" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Active Members</span>
                <span className="text-sm font-semibold text-white">{participantCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">Safe Drivers</span>
                <span className="text-sm font-semibold text-[#10B981]">{safeDriverCount.toLocaleString()}</span>
              </div>
              
              {/* Safety Progress Bar */}
              <div className="w-full bg-gray-700/30 rounded-full h-2 relative">
                <div 
                  className="bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#7B1FA2] h-2 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${safetyPercentage}%`,
                    boxShadow: '0 0 8px rgba(139, 69, 19, 0.4), 0 0 16px rgba(184, 115, 51, 0.3)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">How Your Refund Is Calculated</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span><strong>80%</strong> Personal driving score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                <span><strong>20%</strong> Community safety factor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span><strong>70%+</strong> score needed to qualify</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span><strong>5-15%</strong> refund range based on performance</span>
              </div>
            </div>
          </div>

          {/* Update Frequency */}
          <div className="glass-morphism-subtle rounded-lg p-4" style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-semibold text-[#10B981]">Live Updates</span>
            </div>
            <p className="text-xs text-gray-300">
              Pool data refreshes every 5 minutes. Your personal dashboard updates in real-time as you drive.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#7B1FA2] text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
            data-testid="popup-close-footer-button"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
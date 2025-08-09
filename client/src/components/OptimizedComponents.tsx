import React from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import LiquidGauge from '@/components/LiquidGauge';
import MetricsGrid from '@/components/MetricsGrid';
import CommunityPool from '@/components/CommunityPool';
import RefundSimulator from '@/components/RefundSimulator';
import Gamification from '@/components/Gamification';
import BottomNavigation from '@/components/BottomNavigation';
import PolicyStatusWidget from '@/components/PolicyStatusWidget';

// Memoized components for performance optimization
export const MemoizedDashboardHeader = React.memo(DashboardHeader);
export const MemoizedLiquidGauge = React.memo(LiquidGauge);
export const MemoizedMetricsGrid = React.memo(MetricsGrid);
export const MemoizedCommunityPool = React.memo(CommunityPool);
export const MemoizedRefundSimulator = React.memo(RefundSimulator);
export const MemoizedGamification = React.memo(Gamification);
export const MemoizedBottomNavigation = React.memo(BottomNavigation);
export const MemoizedPolicyStatusWidget = React.memo(PolicyStatusWidget);

// Loading skeleton components
export const DashboardSkeleton = () => (
  <div className="min-h-screen animate-pulse">
    <div className="h-16 bg-gray-700/50 mb-4" />
    <div className="px-4 space-y-4">
      <div className="h-64 bg-gray-700/50 rounded-2xl" />
      <div className="h-32 bg-gray-700/50 rounded-2xl" />
      <div className="h-48 bg-gray-700/50 rounded-2xl" />
      <div className="h-40 bg-gray-700/50 rounded-2xl" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen animate-pulse">
    <div className="h-16 bg-gray-700/50 mb-4" />
    <div className="px-4 space-y-4">
      <div className="h-32 bg-gray-700/50 rounded-2xl" />
      <div className="h-24 bg-gray-700/50 rounded-2xl" />
      <div className="h-64 bg-gray-700/50 rounded-2xl" />
    </div>
  </div>
);
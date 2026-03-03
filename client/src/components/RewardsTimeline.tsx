/**
 * REWARDS TIMELINE
 * ================
 * 5-tier milestone-based rewards programme with FCA-compliant framing.
 *
 * Layout:
 *   - Vertical timeline on mobile (<768px)
 *   - Horizontal timeline on desktop (≥768px)
 *
 * States per reward:
 *   - locked   — 40% opacity, blur overlay, "X days to go" counter
 *   - unlocked — full opacity, emerald glow, "Redeem Now" CTA
 *   - claimed  — purple "Claimed ✓" badge, no CTA
 *
 * FCA compliance:
 *   - Every reward is framed as community/behaviour recognition
 *   - No guaranteed financial benefit tied to insurance outcomes
 *   - No countdown urgency timers, no fake scarcity
 */

import { motion } from 'framer-motion';
import { Lock, Gift, Check, Share2, ExternalLink } from 'lucide-react';
import { container, item, timing, microInteractions } from '@/lib/animations';
import type { RewardStatus } from '../../../shared/firestore-types';

// ============================================================================
// REWARD DEFINITIONS
// ============================================================================

interface RewardTier {
  id: string;
  milestone: string;
  tag: string;
  title: string;
  description: string;
  copy: string;
  unlockDay: number;
  unlockCriteria: string;
  rewardValue: string;
  hashtag: string;
  icon: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    id: 'day5',
    milestone: '#Day5',
    tag: 'First Miles',
    title: '"First Miles" Badge + £5 Tesco Clubcard Voucher',
    description: 'Complete 5 days as a Driiva driver with avg score ≥ 60',
    copy: "Five days in. You're already saving. First treat's on us.",
    unlockDay: 5,
    unlockCriteria: '5 active days, avg score ≥ 60',
    rewardValue: '£5 Tesco Clubcard',
    hashtag: '#DriveBetter',
    icon: '🏅',
  },
  {
    id: 'day10',
    milestone: '#Day10',
    tag: 'Smooth Operator',
    title: '"Smooth Operator" + Free RAC Roadside Rescue Trial',
    description: '10 consecutive active driving days, avg score ≥ 65',
    copy: "Ten days of clean driving. We've got your back on the road too.",
    unlockDay: 10,
    unlockCriteria: '10 consecutive days, avg score ≥ 65',
    rewardValue: 'RAC 30-day trial',
    hashtag: '#TeamDriiva',
    icon: '🛡️',
  },
  {
    id: 'team_driiva',
    milestone: '#TeamDriiva',
    tag: 'Community Booster',
    title: '"Community Booster" + £10 Halfords Motoring Club Credit',
    description: 'Refer 1 friend (5 active days) OR reach Day 30 in top 40% pool',
    copy: 'Your driving lifts the whole pool. The community rewards that.',
    unlockDay: 30,
    unlockCriteria: '1 referral OR Day 30 top 40%',
    rewardValue: '£10 Halfords',
    hashtag: '#TeamDriiva',
    icon: '👥',
  },
  {
    id: 'month3',
    milestone: '#Month3',
    tag: 'Eco Driver',
    title: '"Eco Driver" Badge + 500 Nectar Points',
    description: '90-day rolling EcoScore ≥ 70 (smooth throttle, low harsh accel)',
    copy: "Three months of clean miles. Sainsbury's says thank you.",
    unlockDay: 90,
    unlockCriteria: '90-day EcoScore ≥ 70',
    rewardValue: '500 Nectar pts (~£2.50)',
    hashtag: '#DriveBetter',
    icon: '🌱',
  },
  {
    id: 'anniversary',
    milestone: '#Anniversary',
    tag: 'Driiva OG',
    title: '"Driiva OG" Status + £25 Amazon Gift Card + Pool Priority',
    description: '12-month active member, avg annual score ≥ 70',
    copy: "One year. You didn't just drive safer — you made everyone safer. OG status: unlocked.",
    unlockDay: 365,
    unlockCriteria: '12 months active, avg score ≥ 70',
    rewardValue: '£25 Amazon + Pool Priority',
    hashtag: '#TeamDriiva',
    icon: '⭐',
  },
];

// ============================================================================
// TYPES
// ============================================================================

export interface RewardState {
  rewardId: string;
  status: RewardStatus;
  redemptionCode?: string | null;
}

interface RewardsTimelineProps {
  daysActive: number;
  rewardStates: RewardState[];
  onRedeem?: (rewardId: string) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

async function shareHashtag(hashtag: string, title: string): Promise<void> {
  if (!canShare()) return;
  try {
    await navigator.share({
      title: `Driiva ${title}`,
      text: `Just unlocked ${title} on Driiva! ${hashtag} 🚗`,
      url: 'https://app.driiva.co.uk',
    });
  } catch {
    // User cancelled or share failed — silently ignore
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ProgressBar({ daysActive }: { daysActive: number }) {
  const maxDay = 365;
  const percent = Math.min((daysActive / maxDay) * 100, 100);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-white/70">
          You are <span className="text-emerald-400 font-semibold">{daysActive} day{daysActive !== 1 ? 's' : ''}</span> into your Driiva journey
        </p>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
        <span>Day 1</span>
        <span>Day 5</span>
        <span>Day 10</span>
        <span>Day 30</span>
        <span>3 Mo</span>
        <span>1 Year</span>
      </div>
    </div>
  );
}

function RewardNode({
  tier,
  state,
  daysActive,
  onRedeem,
}: {
  tier: RewardTier;
  state: RewardState | undefined;
  daysActive: number;
  onRedeem?: (rewardId: string) => void;
}) {
  const status: RewardStatus = state?.status ?? 'locked';
  const daysToGo = Math.max(0, tier.unlockDay - daysActive);

  const isLocked = status === 'locked';
  const isUnlocked = status === 'unlocked';
  const isClaimed = status === 'claimed';

  const cardClass = [
    'dashboard-glass-card relative',
    isLocked && 'opacity-40',
    isUnlocked && 'reward-glow-unlocked',
    isClaimed && 'reward-glow-claimed',
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      variants={item}
      whileHover={!isLocked ? microInteractions.hoverSubtle : undefined}
      className={`${cardClass} w-full md:w-[220px] md:flex-shrink-0`}
    >
      {/* Locked blur overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-[var(--radius-2xl)] backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-5 h-5 text-white/40" />
            <span className="text-xs text-white/50 font-medium">{daysToGo} day{daysToGo !== 1 ? 's' : ''} to go</span>
          </div>
        </div>
      )}

      {/* Milestone label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          {tier.milestone}
        </span>
        {isClaimed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
            <Check className="w-3 h-3" />
            Claimed
          </span>
        )}
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl flex-shrink-0" role="img" aria-label={tier.tag}>
          {tier.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white leading-snug">{tier.tag}</h4>
          <p className="text-xs text-white/50 mt-0.5">{tier.rewardValue}</p>
        </div>
      </div>

      {/* Copy */}
      <p className="text-xs text-white/70 leading-relaxed mb-3 italic">
        "{tier.copy}"
      </p>

      {/* Unlock criteria */}
      <p className="text-[10px] text-white/40 mb-3">
        {tier.unlockCriteria}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isUnlocked && onRedeem && (
          <button
            onClick={() => onRedeem(tier.id)}
            className="flex-1 py-2 rounded-xl text-sm font-medium
              bg-emerald-500/20 border border-emerald-500/30 text-emerald-300
              hover:bg-emerald-500/30 transition-all
              flex items-center justify-center gap-2 min-h-[44px]"
            aria-label={`Redeem ${tier.tag} reward`}
          >
            <Gift className="w-4 h-4" />
            Redeem Now
          </button>
        )}

        {isClaimed && state?.redemptionCode && (
          <div className="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/40">Code</p>
            <p className="text-xs font-mono text-white/80 select-all">{state.redemptionCode}</p>
          </div>
        )}

        {/* Hashtag share pill */}
        {!isLocked && (
          <button
            onClick={() => shareHashtag(tier.hashtag, tier.tag)}
            className="p-2 rounded-xl bg-white/5 border border-white/10
              hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px]
              flex items-center justify-center"
            aria-label={`Share ${tier.hashtag}`}
            title={canShare() ? `Share ${tier.hashtag}` : 'Share not available'}
          >
            {canShare() ? (
              <Share2 className="w-4 h-4 text-white/50" />
            ) : (
              <ExternalLink className="w-4 h-4 text-white/50" />
            )}
          </button>
        )}
      </div>

      {/* Hashtag pill */}
      {!isLocked && (
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {tier.hashtag}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RewardsTimeline({
  daysActive,
  rewardStates,
  onRedeem,
  className = '',
}: RewardsTimelineProps) {
  const stateMap = new Map(rewardStates.map(s => [s.rewardId, s]));

  return (
    <div className={className}>
      {/* Progress bar */}
      <ProgressBar daysActive={daysActive} />

      {/* Timeline — vertical on mobile, horizontal scroll on desktop */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="
          flex flex-col gap-4
          md:flex-row md:overflow-x-auto md:pb-4 md:scrollbar-hide md:gap-4
        "
      >
        {REWARD_TIERS.map((tier, idx) => (
          <div key={tier.id} className="relative">
            {/* Timeline connector line */}
            {idx < REWARD_TIERS.length - 1 && (
              <>
                {/* Vertical line (mobile) */}
                <div
                  className="hidden max-md:block absolute left-5 top-full w-0.5 h-4 bg-white/10 z-0"
                  aria-hidden="true"
                />
                {/* Horizontal line (desktop) */}
                <div
                  className="hidden md:block absolute top-1/2 -right-4 w-4 h-0.5 bg-white/10 z-0"
                  aria-hidden="true"
                />
              </>
            )}

            <RewardNode
              tier={tier}
              state={stateMap.get(tier.id)}
              daysActive={daysActive}
              onRedeem={onRedeem}
            />
          </div>
        ))}
      </motion.div>

      {/* FCA disclosure */}
      <p className="mt-4 text-[10px] text-white/30 text-center leading-relaxed max-w-md mx-auto">
        Rewards are community recognition milestones, not insurance benefits.
        Pool Priority means earlier refund calculation notification, not a guaranteed higher refund.
        Voucher partners are independent third parties.
      </p>
    </div>
  );
}

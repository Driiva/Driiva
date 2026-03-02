/**
 * FCA-compliant financial promotion disclaimer.
 * Append to any UI surface that mentions refund percentages.
 */

interface FinancialPromotionDisclaimerProps {
  className?: string;
}

export function FinancialPromotionDisclaimer({ className = '' }: FinancialPromotionDisclaimerProps) {
  return (
    <p className={`text-white/40 text-[10px] leading-relaxed ${className}`}>
      Refund projections are illustrative. Actual amounts depend on pool
      performance, claims experience, and underwriting criteria.
    </p>
  );
}

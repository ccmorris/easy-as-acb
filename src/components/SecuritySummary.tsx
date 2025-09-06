import { formatCurrency } from "../utils/currency";

interface SecuritySummaryProps {
  summary: {
    totalShares: number;
    totalACBCents: number;
    acbPerShareCents: number;
  };
  currency: string;
}

export function SecuritySummary({ summary, currency }: SecuritySummaryProps) {
  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Security Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Shares:</span>
          <span className="font-mono">{summary.totalShares.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total ACB:</span>
          <span className="font-mono">
            {formatCurrency(summary.totalACBCents, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>ACB per Share:</span>
          <span className="font-mono">
            {formatCurrency(summary.acbPerShareCents, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

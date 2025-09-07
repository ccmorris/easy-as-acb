import { formatCurrency } from "../utils/currency";
import { Card } from "./ui";

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
    <Card className="p-0">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        Security Summary
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-900">Total Shares:</span>
          <span className="font-mono text-gray-900">
            {summary.totalShares.toFixed(6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-900">Total ACB:</span>
          <span className="font-mono text-gray-900">
            {formatCurrency(summary.totalACBCents, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-900">ACB per Share:</span>
          <span className="font-mono text-gray-900">
            {formatCurrency(summary.acbPerShareCents, currency)}
          </span>
        </div>
      </div>
    </Card>
  );
}

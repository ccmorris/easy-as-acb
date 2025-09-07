import { formatCurrency } from "../utils/currency";
import { Card } from "./ui";

interface CapitalGainsReportProps {
  capitalGains: Array<{
    transactionId: string;
    date: string;
    numShares: number;
    sellPricePerShareCents: number;
    acbPerShareCents: number;
    capitalGainLossCents: number;
    currency: string;
  }>;
}

export function CapitalGainsReport({ capitalGains }: CapitalGainsReportProps) {
  if (capitalGains.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          Capital Gains/Losses
        </h3>
        <p className="text-gray-600">No sell transactions found.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        Capital Gains/Losses
      </h3>
      <div className="space-y-3">
        {capitalGains.map((cg) => (
          <div
            key={cg.transactionId}
            className="bg-gray-50 p-3 rounded border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">
                  {new Date(cg.date).toISOString().split("T")[0]}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.abs(cg.numShares)} shares sold
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-lg font-semibold ${
                    cg.capitalGainLossCents >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {formatCurrency(cg.capitalGainLossCents)}
                </div>
                <div className="text-xs text-gray-500">
                  {cg.capitalGainLossCents >= 0 ? "Gain" : "Loss"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Sell Price</div>
                <div className="font-mono">
                  {formatCurrency(cg.sellPricePerShareCents)} per share
                </div>
              </div>
              <div>
                <div className="text-gray-600">ACB</div>
                <div className="font-mono">
                  {formatCurrency(cg.acbPerShareCents)} per share
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

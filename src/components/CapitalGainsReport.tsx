import { formatCurrency } from "../utils/currency";

interface CapitalGainsReportProps {
  capitalGains: Array<{
    transactionId: string;
    date: number;
    numShares: number;
    totalPriceCents: number;
    capitalGainLossCents: number;
  }>;
}

export function CapitalGainsReport({ capitalGains }: CapitalGainsReportProps) {
  const totalGainLoss = capitalGains.reduce(
    (sum: number, cg: any) => sum + cg.capitalGainLossCents,
    0,
  );

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Capital Gains/Losses</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Gain/Loss:</span>
          <span
            className={`font-mono ${
              totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(totalGainLoss)}
          </span>
        </div>
        {capitalGains.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Sell Transactions:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {capitalGains.map((cg: any) => (
                <div key={cg.transactionId} className="text-xs">
                  <div className="flex justify-between">
                    <span>{new Date(cg.date).toLocaleDateString()}</span>
                    <span
                      className={
                        cg.capitalGainLossCents >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(cg.capitalGainLossCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

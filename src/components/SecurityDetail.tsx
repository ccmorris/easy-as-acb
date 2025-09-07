import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useParams, useNavigate } from "react-router-dom";
import { TransactionList } from "./TransactionList";
import { SecuritySummary } from "./SecuritySummary";

export const SecurityDetail = function SecurityDetail() {
  const { portfolioId, securityId } = useParams<{
    portfolioId: string;
    securityId: string;
  }>();

  const data = useQuery(api.calculations.getSecurityDetailData, {
    portfolioId: portfolioId as Id<"portfolios">,
    securityId: securityId as Id<"securities">,
  });

  // Show loading state only if data is undefined
  if (data === undefined) {
    return null;
  }

  // Handle not found cases
  if (!data.portfolio || !data.security) {
    return <div>Security not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {data.security.name} ({data.security.ticker})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          {data.summary && (
            <SecuritySummary
              summary={data.summary}
              currency={data.security.currency}
            />
          )}
        </div>

        <div>
          <TransactionList
            securityId={securityId as Id<"securities">}
            transactions={data.transactions}
            currentShares={data.summary?.totalShares}
          />
        </div>
      </div>
    </div>
  );
};

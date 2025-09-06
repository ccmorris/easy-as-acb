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
  const navigate = useNavigate();

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
        <button
          onClick={() => navigate(`/portfolio/${portfolioId}`)}
          className="text-blue-500 hover:text-blue-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded cursor-pointer"
        >
          ← Back to {data.portfolio.name}
        </button>
        <h2 className="text-2xl font-bold">
          {data.security.name} ({data.security.ticker})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Summary */}
        <div>
          {data.summary ? (
            <SecuritySummary
              summary={data.summary}
              currency={data.security.currency}
            />
          ) : (
            <div className="p-4 border rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div>
          <TransactionList
            securityId={securityId as Id<"securities">}
            transactions={data.transactions}
          />
        </div>
      </div>
    </div>
  );
};

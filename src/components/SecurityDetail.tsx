import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useParams, useNavigate } from "react-router-dom";
import { TransactionList } from "./TransactionList";
import { SecuritySummary } from "./SecuritySummary";

export function SecurityDetail() {
  const { portfolioId, securityId } = useParams<{
    portfolioId: string;
    securityId: string;
  }>();
  const navigate = useNavigate();
  const portfolio = useQuery(api.portfolios.getPortfolio, {
    portfolioId: portfolioId as Id<"portfolios">,
  });
  const security = useQuery(api.securities.getSecurity, {
    securityId: securityId as Id<"securities">,
  });
  const summary = useQuery(api.calculations.getSecuritySummary, {
    securityId: securityId as Id<"securities">,
  });
  const transactions = useQuery(api.transactions.listTransactionsBySecurity, {
    securityId: securityId as Id<"securities">,
  });
  const capitalGains = useQuery(api.calculations.getCapitalGainsLosses, {
    securityId: securityId as Id<"securities">,
  });

  if (
    portfolio === undefined ||
    security === undefined ||
    summary === undefined ||
    transactions === undefined ||
    capitalGains === undefined
  ) {
    return <div>Loading...</div>;
  }

  if (!portfolio || !security) {
    return <div>Security not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(`/portfolio/${portfolioId}`)}
          className="text-blue-500 hover:text-blue-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded cursor-pointer"
        >
          ← Back to {portfolio.name}
        </button>
        <h2 className="text-2xl font-bold">
          {security.name} ({security.ticker})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Summary */}
        <div>
          <SecuritySummary summary={summary} currency={security.currency} />
        </div>

        {/* Transactions */}
        <div>
          <TransactionList
            securityId={securityId as Id<"securities">}
            transactions={transactions}
            capitalGains={capitalGains}
          />
        </div>
      </div>
    </div>
  );
}

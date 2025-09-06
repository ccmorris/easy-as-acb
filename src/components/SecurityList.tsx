import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../utils/currency";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrefetchSecurityDetail } from "../hooks/usePrefetch";

export function SecurityList() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const { prefetchSecurityDetail } = usePrefetchSecurityDetail();
  const portfolio = useQuery(api.portfolios.getPortfolio, {
    portfolioId: portfolioId as Id<"portfolios">,
  });
  const securities = useQuery(api.securities.listSecuritiesByPortfolio, {
    portfolioId: portfolioId as Id<"portfolios">,
  });
  const portfolioSummary = useQuery(api.calculations.getPortfolioSummary, {
    portfolioId: portfolioId as Id<"portfolios">,
  });
  const createSecurity = useMutation(api.securities.createSecurity);
  const deleteSecurity = useMutation(api.securities.deleteSecurity);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    currency: "CAD",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.ticker.trim()) {
      await createSecurity({
        portfolioId: portfolioId as Id<"portfolios">,
        name: formData.name.trim(),
        ticker: formData.ticker.trim().toUpperCase(),
        currency: formData.currency,
      });
      setFormData({ name: "", ticker: "", currency: "CAD" });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: Id<"securities">) => {
    if (confirm("Are you sure you want to delete this security?")) {
      await deleteSecurity({ securityId: id });
    }
  };

  if (
    portfolio === undefined ||
    securities === undefined ||
    portfolioSummary === undefined
  ) {
    return <div>Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-blue-500 hover:text-blue-700 mb-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded cursor-pointer"
        >
          ← Back to Portfolios
        </button>
        <h2 className="text-2xl font-bold">{portfolio.name}</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Securities</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "New Security"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-3"
        >
          <div>
            <label
              htmlFor="security-name"
              className="block text-sm font-medium mb-1"
            >
              Security Name
            </label>
            <input
              id="security-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter security name"
              enterKeyHint="next"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>
          <div>
            <label
              htmlFor="ticker-symbol"
              className="block text-sm font-medium mb-1"
            >
              Ticker Symbol
            </label>
            <input
              id="ticker-symbol"
              type="text"
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value })
              }
              placeholder="Enter ticker symbol"
              enterKeyHint="next"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium mb-1"
            >
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
          >
            Create Security
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {securities.map((security) => {
          const summary = portfolioSummary.find(
            (s) => s.securityId === security._id,
          );
          return (
            <div
              key={security._id}
              className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() =>
                navigate(`/portfolio/${portfolioId}/security/${security._id}`)
              }
              onMouseEnter={() =>
                prefetchSecurityDetail(
                  portfolioId as Id<"portfolios">,
                  security._id,
                )
              }
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(
                    `/portfolio/${portfolioId}/security/${security._id}`,
                  );
                }
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{security.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {security.ticker} ({security.currency})
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(security._id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded cursor-pointer"
                >
                  Delete
                </button>
              </div>
              {summary && (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Shares:</span>
                    <span className="font-mono">
                      {summary.totalShares.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ACB:</span>
                    <span className="font-mono">
                      {formatCurrency(summary.totalACBCents, summary.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per Share:</span>
                    <span className="font-mono">
                      {formatCurrency(
                        summary.acbPerShareCents,
                        summary.currency,
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

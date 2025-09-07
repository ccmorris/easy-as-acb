import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../utils/currency";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrefetchSecurityDetail } from "../hooks/usePrefetch";
import { Plus, Trash2, X, ArrowLeft } from "lucide-react";
import { Button, Input, Card, Select, IconButton } from "./ui";

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
          className="text-primary hover:text-primary-hover mb-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded cursor-pointer flex items-center gap-2"
          title="Back to Portfolios"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Portfolios</span>
        </button>
        <h2 className="text-2xl font-bold text-text">{portfolio.name}</h2>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text">Securities</h3>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="security-name"
              label="Security Name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter security name"
              enterKeyHint="next"
              autoFocus
              required
            />
            <Input
              id="ticker-symbol"
              label="Ticker Symbol"
              type="text"
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value })
              }
              placeholder="Enter ticker symbol"
              enterKeyHint="next"
              required
            />
            <Select
              id="currency"
              label="Currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              options={[
                { value: "CAD", label: "CAD" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="success"
                size="sm"
                title="Create Security"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Security</span>
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="secondary"
                size="sm"
                title="Cancel"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securities.map((security) => {
            const summary = portfolioSummary.find(
              (s) => s.securityId === security._id,
            );
            return (
              <Card
                key={security._id}
                interactive
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
                    <h4 className="font-semibold text-lg text-text">
                      {security.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {security.ticker} ({security.currency})
                    </p>
                  </div>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(security._id);
                    }}
                    variant="danger"
                    size="md"
                    title="Delete Security"
                  >
                    <Trash2 className="w-5 h-5" />
                  </IconButton>
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
                        {formatCurrency(
                          summary.totalACBCents,
                          summary.currency,
                        )}
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
              </Card>
            );
          })}

          {/* Create New Security Card */}
          <Card
            interactive
            onClick={() => setShowForm(!showForm)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowForm(!showForm);
              }
            }}
            className="border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors"
          >
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-gray-500 hover:text-primary-600 transition-colors">
              <Plus className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Create New Security</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

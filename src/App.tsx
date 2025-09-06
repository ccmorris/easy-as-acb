"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { formatCurrency } from "./utils/currency";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Canadian ACB Tracker</h1>
          <SignOutButton />
        </div>
      </header>
      <main className="p-8 flex flex-col gap-16">
        <Authenticated>
          <Routes>
            <Route path="/" element={<PortfolioList />} />
            <Route path="/portfolio/:portfolioId" element={<SecurityList />} />
            <Route
              path="/portfolio/:portfolioId/security/:securityId"
              element={<SecurityDetail />}
            />
          </Routes>
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </BrowserRouter>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-dark dark:text-light rounded-md px-2 py-1"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the numbers</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <button onClick={() => void signIn("github")}>
          Sign in with GitHub
        </button>

        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <span
            className="text-dark dark:text-light underline hover:no-underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">
              Error signing in: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function PortfolioList() {
  const navigate = useNavigate();
  const portfolios = useQuery(api.portfolios.listPortfolios);
  const createPortfolio = useMutation(api.portfolios.createPortfolio);
  const deletePortfolio = useMutation(api.portfolios.deletePortfolio);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  if (portfolios === undefined) {
    return <div>Loading portfolios...</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await createPortfolio({ name: newName.trim() });
      setNewName("");
      setShowForm(false);
    }
  };

  const handleDelete = async (id: Id<"portfolios">) => {
    if (
      confirm(
        "Are you sure you want to delete this portfolio and all its data?",
      )
    ) {
      await deletePortfolio({ portfolioId: id });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Portfolios</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "New Portfolio"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Portfolio name"
            className="w-full p-3 border rounded mb-3"
            autoFocus
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Portfolio
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <div
            key={portfolio._id}
            className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
            onClick={() => navigate(`/portfolio/${portfolio._id}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{portfolio.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created{" "}
                  {new Date(portfolio._creationTime).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(portfolio._id);
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityList() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.ticker.trim()) {
      await createSecurity({
        portfolioId: portfolioId as Id<"portfolios">,
        name: formData.name.trim(),
        ticker: formData.ticker.trim(),
        currency: formData.currency.trim(),
      });
      setFormData({ name: "", ticker: "", currency: "CAD" });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: Id<"securities">) => {
    if (
      confirm(
        "Are you sure you want to delete this security and all its transactions?",
      )
    ) {
      await deleteSecurity({ securityId: id });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to Portfolios
        </button>
        <h2 className="text-2xl font-bold">{portfolio.name}</h2>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Securities</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "New Security"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-3"
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Security name"
            className="w-full p-3 border rounded"
          />
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) =>
              setFormData({ ...formData, ticker: e.target.value })
            }
            placeholder="Ticker symbol"
            className="w-full p-3 border rounded"
          />
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="w-full p-3 border rounded"
          >
            <option value="CAD">CAD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
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
              className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
              onClick={() =>
                navigate(`/portfolio/${portfolioId}/security/${security._id}`)
              }
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
                  className="text-red-500 hover:text-red-700 text-sm"
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

function SecurityDetail() {
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/portfolio/${portfolioId}`)}
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to {portfolio.name}
        </button>
        <h2 className="text-2xl font-bold">{security.name}</h2>
        <span className="text-lg text-gray-600 dark:text-gray-400">
          ({security.ticker})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACB Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">ACB Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Shares:</span>
                <span className="font-mono">
                  {summary.totalShares.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total ACB:</span>
                <span className="font-mono">
                  {formatCurrency(summary.totalACBCents, summary.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ACB per Share:</span>
                <span className="font-mono">
                  {formatCurrency(summary.acbPerShareCents, summary.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2">
          <TransactionList
            securityId={securityId as Id<"securities">}
            transactions={transactions}
          />
        </div>
      </div>

      {/* Capital Gains Report */}
      {capitalGains.length > 0 && (
        <div className="mt-6">
          <CapitalGainsReport capitalGains={capitalGains} />
        </div>
      )}
    </div>
  );
}

function TransactionList({
  securityId,
  transactions,
}: {
  securityId: Id<"securities">;
  transactions: any[];
}) {
  const createTransaction = useMutation(api.transactions.createTransaction);
  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"transactions"> | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    numShares: "",
    totalPrice: "",
    commissionFee: "0",
    transactionType: "buy" as const,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numShares = parseFloat(formData.numShares);
    const totalPriceCents = Math.round(parseFloat(formData.totalPrice) * 100);
    const commissionFeeCents = formData.commissionFee
      ? Math.round(parseFloat(formData.commissionFee) * 100)
      : undefined;
    const date = new Date(formData.date).getTime();

    if (numShares && totalPriceCents >= 0) {
      await createTransaction({
        securityId,
        date,
        numShares,
        totalPriceCents,
        commissionFeeCents,
        transactionType: formData.transactionType,
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        numShares: "",
        totalPrice: "",
        commissionFee: "0",
        transactionType: "buy",
      });
      setShowForm(false);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingId(transaction._id);
    setFormData({
      date: new Date(transaction.date).toISOString().split("T")[0],
      numShares: transaction.numShares.toString(),
      totalPrice: (transaction.totalPriceCents / 100).toString(),
      commissionFee: transaction.commissionFeeCents
        ? (transaction.commissionFeeCents / 100).toString()
        : "0",
      transactionType: transaction.transactionType,
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const numShares = parseFloat(formData.numShares);
    const totalPriceCents = Math.round(parseFloat(formData.totalPrice) * 100);
    const commissionFeeCents = formData.commissionFee
      ? Math.round(parseFloat(formData.commissionFee) * 100)
      : undefined;
    const date = new Date(formData.date).getTime();

    if (numShares && totalPriceCents >= 0) {
      await updateTransaction({
        transactionId: editingId,
        date,
        numShares,
        totalPriceCents,
        commissionFeeCents,
        transactionType: formData.transactionType,
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        numShares: "",
        totalPrice: "",
        commissionFee: "0",
        transactionType: "buy",
      });
      setShowForm(false);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      numShares: "",
      totalPrice: "",
      commissionFee: "0",
      transactionType: "buy",
    });
  };

  const handleDelete = async (id: Id<"transactions">) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await deleteTransaction({ transactionId: id });
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          {showForm ? "Cancel" : "New Transaction"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="mb-4 space-y-2"
        >
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <select
            value={formData.transactionType}
            onChange={(e) =>
              setFormData({
                ...formData,
                transactionType: e.target.value as any,
              })
            }
            className="w-full p-2 border rounded"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="return_of_capital">Return of Capital</option>
            <option value="reinvested_dividend">Reinvested Dividend</option>
            <option value="reinvested_capital_gains_distribution">
              Reinvested Capital Gains
            </option>
          </select>
          <input
            type="number"
            step="0.000001"
            value={formData.numShares}
            onChange={(e) =>
              setFormData({ ...formData, numShares: e.target.value })
            }
            placeholder="Number of shares"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            step="0.01"
            value={formData.totalPrice}
            onChange={(e) =>
              setFormData({ ...formData, totalPrice: e.target.value })
            }
            placeholder="Total price"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            step="0.01"
            value={formData.commissionFee}
            onChange={(e) =>
              setFormData({ ...formData, commissionFee: e.target.value })
            }
            placeholder="Commission fee (optional)"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.map((transaction) => (
          <div key={transaction._id} className="p-2 border rounded text-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {new Date(transaction.date).toLocaleDateString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {transaction.transactionType.replace(/_/g, " ").toUpperCase()}
                </div>
                <div>
                  {transaction.numShares} shares @{" "}
                  {formatCurrency(
                    (transaction.totalPriceCents -
                      (transaction.commissionFeeCents || 0)) /
                      transaction.numShares,
                  )}{" "}
                  per share
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatCurrency(transaction.totalPriceCents)}
                  {transaction.commissionFeeCents &&
                    transaction.commissionFeeCents > 0 && (
                      <span>
                        {" "}
                        (Fee: {formatCurrency(transaction.commissionFeeCents)})
                      </span>
                    )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(transaction)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(transaction._id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapitalGainsReport({ capitalGains }: { capitalGains: any[] }) {
  if (capitalGains.length === 0) {
    return null;
  }

  const totalGainLoss = capitalGains.reduce(
    (sum: number, cg: any) => sum + cg.capitalGainLossCents,
    0,
  );

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Capital Gains/Losses</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {capitalGains.map((cg: any) => (
          <div key={cg.transactionId} className="p-2 border rounded text-sm">
            <div className="flex justify-between">
              <span>{new Date(cg.date).toLocaleDateString()}</span>
              <span
                className={`font-mono ${cg.capitalGainLossCents >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(cg.capitalGainLossCents, cg.currency)}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {cg.numShares} shares @{" "}
              {formatCurrency(cg.sellPricePerShareCents, cg.currency)}
              (ACB: {formatCurrency(cg.acbPerShareCents, cg.currency)})
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t">
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span
            className={`font-mono ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(totalGainLoss, capitalGains[0]?.currency || "CAD")}
          </span>
        </div>
      </div>
    </div>
  );
}

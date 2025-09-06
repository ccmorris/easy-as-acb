import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../utils/currency";
import { useState } from "react";
import { CurrencyInput } from "./CurrencyInput";

interface TransactionListProps {
  securityId: Id<"securities">;
  transactions: Array<{
    _id: Id<"transactions">;
    date: string;
    numShares: number;
    totalPriceCents: number;
    commissionFeeCents?: number;
    transactionType: string;
    capitalGains?: {
      sellPricePerShareCents: number;
      acbPerShareCents: number;
      capitalGainLossCents: number;
    };
  }>;
}

export function TransactionList({
  securityId,
  transactions,
}: TransactionListProps) {
  const createTransaction = useMutation(api.transactions.createTransaction);
  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"transactions"> | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    numShares: "",
    totalPriceCents: "0",
    commissionFeeCents: "0",
    transactionType: "buy" as const,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numShares = parseFloat(formData.numShares);
    const totalPriceCents = parseInt(formData.totalPriceCents, 10);
    const commissionFeeCents = formData.commissionFeeCents
      ? parseInt(formData.commissionFeeCents, 10)
      : undefined;
    // Store date as ISO8601 string in UTC
    const date = new Date(formData.date + "T00:00:00.000Z").toISOString();

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
        totalPriceCents: "0",
        commissionFeeCents: "0",
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
      totalPriceCents: transaction.totalPriceCents.toString(),
      commissionFeeCents: transaction.commissionFeeCents
        ? transaction.commissionFeeCents.toString()
        : "0",
      transactionType: transaction.transactionType,
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const numShares = parseFloat(formData.numShares);
    const totalPriceCents = parseInt(formData.totalPriceCents, 10);
    const commissionFeeCents = formData.commissionFeeCents
      ? parseInt(formData.commissionFeeCents, 10)
      : undefined;
    // Store date as ISO8601 string in UTC
    const date = new Date(formData.date + "T00:00:00.000Z").toISOString();

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
        totalPriceCents: "0",
        commissionFeeCents: "0",
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
      totalPriceCents: "0",
      commissionFeeCents: "0",
      transactionType: "buy",
    });
  };

  const handleDelete = async (id: Id<"transactions">) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await deleteTransaction({ transactionId: id });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "New Transaction"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="mb-4 space-y-3"
        >
          <div>
            <label
              htmlFor="transaction-date"
              className="block text-sm font-medium mb-1"
            >
              Transaction Date
            </label>
            <input
              id="transaction-date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label
              htmlFor="num-shares"
              className="block text-sm font-medium mb-1"
            >
              Number of Shares
            </label>
            <input
              id="num-shares"
              type="number"
              step="0.000001"
              value={formData.numShares}
              onChange={(e) =>
                setFormData({ ...formData, numShares: e.target.value })
              }
              placeholder="Enter number of shares"
              inputMode="decimal"
              enterKeyHint="next"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <CurrencyInput
            id="total-price"
            label="Total Price"
            value={formData.totalPriceCents}
            onChange={(value) =>
              setFormData({ ...formData, totalPriceCents: value })
            }
            placeholder="0.00"
            enterKeyHint="next"
            required
          />
          <CurrencyInput
            id="commission-fee"
            label="Commission Fee (Optional)"
            value={formData.commissionFeeCents}
            onChange={(value) =>
              setFormData({ ...formData, commissionFeeCents: value })
            }
            placeholder="0.00"
            enterKeyHint="next"
          />
          <div>
            <label
              htmlFor="transaction-type"
              className="block text-sm font-medium mb-1"
            >
              Transaction Type
            </label>
            <select
              id="transaction-type"
              value={formData.transactionType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transactionType: e.target.value as any,
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="return_of_capital">Return of Capital</option>
              <option value="reinvested_dividend">Reinvested Dividend</option>
              <option value="reinvested_capital_gains_distribution">
                Reinvested Capital Gains Distribution
              </option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors cursor-pointer"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-2">
        {transactions.map((transaction) => {
          const isSellTransaction = transaction.transactionType === "sell";

          return (
            <div key={transaction._id} className="p-3 border rounded text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(transaction.date).toISOString().split("T")[0]}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {transaction.transactionType
                      .replace(/_/g, " ")
                      .toUpperCase()}
                  </div>
                  <div>
                    {Math.abs(transaction.numShares)} shares @{" "}
                    {formatCurrency(
                      (transaction.totalPriceCents -
                        (transaction.commissionFeeCents || 0)) /
                        Math.abs(transaction.numShares),
                    )}{" "}
                    per share
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: {formatCurrency(transaction.totalPriceCents)}
                    {transaction.commissionFeeCents &&
                      transaction.commissionFeeCents > 0 && (
                        <span>
                          {" "}
                          (Fee: {formatCurrency(transaction.commissionFeeCents)}
                          )
                        </span>
                      )}
                  </div>

                  {/* Show capital gains/losses for sell transactions */}
                  {isSellTransaction && transaction.capitalGains && (
                    <>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.capitalGains.capitalGainLossCents >= 0
                          ? "Capital Gain:"
                          : "Capital Loss:"}{" "}
                        <span
                          className={`font-mono ${
                            transaction.capitalGains.capitalGainLossCents >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(
                              transaction.capitalGains.capitalGainLossCents,
                            ),
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="text-blue-500 hover:text-blue-700 text-xs focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(transaction._id)}
                    className="text-red-500 hover:text-red-700 text-xs focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

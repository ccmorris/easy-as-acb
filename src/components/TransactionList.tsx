import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { formatCurrency } from "../utils/currency";
import { useState } from "react";
import { CurrencyInput } from "./CurrencyInput";
import { Plus, Trash2, X, Edit, Save } from "lucide-react";
import {
  Button,
  Input,
  Select,
  IconButton,
  DecimalInput,
  AddNewCard,
} from "./ui";

interface TransactionListProps {
  securityId: Id<"securities">;
  transactions: Array<{
    _id: Id<"transactions">;
    date: string;
    numShares?: number;
    totalPriceCents: number;
    amountPerShare?: number;
    commissionFeeCents?: number;
    transactionType: string;
    capitalGains?: {
      sellPricePerShareCents: number;
      acbPerShareCents: number;
      capitalGainLossCents: number;
    };
  }>;
  currentShares?: number;
}

export function TransactionList({
  securityId,
  transactions,
  currentShares,
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
    amountPerShare: "0.000000",
    commissionFeeCents: "0",
    transactionType: "buy" as
      | "buy"
      | "sell"
      | "return_of_capital"
      | "reinvested_dividend"
      | "reinvested_capital_gains_distribution",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPerShareCents = parseInt(formData.totalPriceCents, 10);
    const commissionFeeCents = formData.commissionFeeCents
      ? parseInt(formData.commissionFeeCents, 10)
      : undefined;
    // Store date as ISO8601 string in UTC
    const date = new Date(formData.date + "T00:00:00.000Z").toISOString();

    let numShares: number | undefined;
    let totalPriceCents: number;
    let amountPerShare: number | undefined;

    if (formData.transactionType === "return_of_capital") {
      // For return of capital, don't store numShares - it will be calculated dynamically
      if (!currentShares || currentShares <= 0) {
        alert(
          "Cannot create return of capital transaction: no shares currently held",
        );
        return;
      }
      numShares = undefined; // Don't store numShares for return of capital
      totalPriceCents = 0; // Not used for return of capital
      amountPerShare = parseFloat(formData.amountPerShare);
    } else {
      // For other transaction types, use entered number of shares
      numShares = parseFloat(formData.numShares);
      totalPriceCents = amountPerShareCents;
      amountPerShare = undefined;
    }

    if (
      (numShares !== undefined ||
        formData.transactionType === "return_of_capital") &&
      amountPerShareCents >= 0
    ) {
      await createTransaction({
        securityId,
        date,
        numShares,
        totalPriceCents,
        amountPerShare,
        commissionFeeCents,
        transactionType: formData.transactionType,
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        numShares: "",
        totalPriceCents: "0",
        amountPerShare: "0.000000",
        commissionFeeCents: "0",
        transactionType: "buy",
      });
      setShowForm(false);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingId(transaction._id);

    // For return of capital, totalPriceCents is already the amount per share
    // For other transaction types, use the total amount directly
    const amountToDisplay = transaction.totalPriceCents.toString();

    setFormData({
      date: new Date(transaction.date).toISOString().split("T")[0],
      numShares: transaction.numShares ? transaction.numShares.toString() : "",
      totalPriceCents: amountToDisplay,
      amountPerShare:
        transaction.transactionType === "return_of_capital"
          ? (transaction.amountPerShare || 0).toString()
          : "0.000000",
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

    const amountPerShareCents = parseInt(formData.totalPriceCents, 10);
    const commissionFeeCents = formData.commissionFeeCents
      ? parseInt(formData.commissionFeeCents, 10)
      : undefined;
    // Store date as ISO8601 string in UTC
    const date = new Date(formData.date + "T00:00:00.000Z").toISOString();

    let numShares: number | undefined;
    let totalPriceCents: number;
    let amountPerShare: number | undefined;

    if (formData.transactionType === "return_of_capital") {
      // For return of capital, don't store numShares - it will be calculated dynamically
      if (!currentShares || currentShares <= 0) {
        alert(
          "Cannot update return of capital transaction: no shares currently held",
        );
        return;
      }
      numShares = undefined; // Don't store numShares for return of capital
      totalPriceCents = 0; // Not used for return of capital
      amountPerShare = parseFloat(formData.amountPerShare);
    } else {
      // For other transaction types, use entered number of shares
      numShares = parseFloat(formData.numShares);
      totalPriceCents = amountPerShareCents;
      amountPerShare = undefined;
    }

    if (
      (numShares !== undefined ||
        formData.transactionType === "return_of_capital") &&
      amountPerShareCents >= 0
    ) {
      await updateTransaction({
        transactionId: editingId,
        date,
        numShares,
        totalPriceCents,
        amountPerShare,
        commissionFeeCents,
        transactionType: formData.transactionType,
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        numShares: "",
        totalPriceCents: "0",
        amountPerShare: "0.000000",
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
      amountPerShare: "0.000000",
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text">Transactions</h3>
      </div>

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="mb-4 space-y-3"
        >
          <Select
            id="transaction-type"
            label="Transaction Type"
            value={formData.transactionType}
            onChange={(e) =>
              setFormData({
                ...formData,
                transactionType: e.target.value as any,
              })
            }
            options={[
              { value: "buy", label: "Buy" },
              { value: "sell", label: "Sell" },
              { value: "return_of_capital", label: "Return of Capital" },
              { value: "reinvested_dividend", label: "Reinvested Dividend" },
              {
                value: "reinvested_capital_gains_distribution",
                label: "Reinvested Capital Gains Distribution",
              },
            ]}
          />
          <Input
            id="transaction-date"
            label="Transaction Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          {formData.transactionType !== "return_of_capital" && (
            <Input
              id="num-shares"
              label="Number of Shares"
              type="number"
              step="0.000001"
              value={formData.numShares}
              onChange={(e) =>
                setFormData({ ...formData, numShares: e.target.value })
              }
              placeholder="Enter number of shares"
              inputMode="decimal"
              enterKeyHint="next"
              required
            />
          )}
          {formData.transactionType === "return_of_capital" ? (
            <div>
              <DecimalInput
                id="amount-per-share"
                label="Amount Per Share"
                value={formData.amountPerShare}
                onChange={(value) =>
                  setFormData({ ...formData, amountPerShare: value })
                }
                placeholder="0.000000"
                enterKeyHint="next"
                required
              />
              {currentShares && currentShares > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Total amount will be calculated as:{" "}
                  {formData.amountPerShare
                    ? `$${(parseFloat(formData.amountPerShare) * currentShares).toFixed(2)}`
                    : "$0.00"}
                  ({currentShares.toFixed(6)} shares)
                </p>
              )}
            </div>
          ) : (
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
          )}
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
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="success"
              size="sm"
              title={editingId ? "Update Transaction" : "Create Transaction"}
            >
              {editingId ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {editingId ? "Update" : "Create"}
              </span>
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              size="sm"
              title="Cancel"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="space-y-2">
          {/* Create New Transaction Card */}
          <AddNewCard
            onClick={() => setShowForm(!showForm)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowForm(!showForm);
              }
            }}
            layout="horizontal"
            iconSize="sm"
            minHeight="64px"
            className="p-4"
          >
            Add New Transaction
          </AddNewCard>

          {transactions
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((transaction) => {
              const isSellTransaction = transaction.transactionType === "sell";

              return (
                <div
                  key={transaction._id}
                  className="p-3 border border-gray-200 rounded text-sm bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-gray-600">
                        {new Date(transaction.date).toISOString().split("T")[0]}
                      </div>
                      <div className="text-gray-600">
                        {transaction.transactionType
                          .replace(/_/g, " ")
                          .toUpperCase()}
                      </div>
                      <div>
                        {transaction.transactionType === "return_of_capital"
                          ? `${Math.abs(currentShares || 0)} shares @`
                          : `${Math.abs(transaction.numShares || 0)} shares @`}{" "}
                        {transaction.transactionType === "return_of_capital"
                          ? // For return of capital, show the full amount per share without rounding
                            `$${(transaction.amountPerShare || 0).toFixed(6)}`
                          : // For other transactions, calculate per share from total
                            formatCurrency(
                              (transaction.totalPriceCents -
                                (transaction.commissionFeeCents || 0)) /
                                Math.abs(transaction.numShares || 1),
                            )}{" "}
                        per share
                      </div>
                      <div className="text-sm text-gray-600">
                        Total:{" "}
                        {transaction.transactionType === "return_of_capital"
                          ? // For return of capital, calculate total from per-share amount (decimal) with 2 decimal places
                            `$${((transaction.amountPerShare || 0) * Math.abs(currentShares || 0)).toFixed(2)}`
                          : // For other transactions, use stored total
                            formatCurrency(transaction.totalPriceCents)}
                        {Boolean(
                          transaction.commissionFeeCents &&
                            transaction.commissionFeeCents > 0,
                        ) && (
                          <span>
                            {" "}
                            (Fee:{" "}
                            {formatCurrency(
                              transaction.commissionFeeCents || 0,
                            )}
                            )
                          </span>
                        )}
                      </div>

                      {/* Show capital gains/losses for sell transactions */}
                      {isSellTransaction && transaction.capitalGains && (
                        <>
                          <div className="text-sm text-gray-600">
                            {transaction.capitalGains.capitalGainLossCents >= 0
                              ? "Capital Gain:"
                              : "Capital Loss:"}{" "}
                            <span
                              className={`font-mono ${
                                transaction.capitalGains.capitalGainLossCents >=
                                0
                                  ? "text-success"
                                  : "text-danger"
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
                      <IconButton
                        onClick={() => handleEdit(transaction)}
                        variant="primary"
                        size="md"
                        title="Edit Transaction"
                      >
                        <Edit className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(transaction._id)}
                        variant="danger"
                        size="md"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

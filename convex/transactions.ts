import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new transaction for a security.
 */
export const createTransaction = mutation({
  args: {
    securityId: v.id("securities"),
    date: v.string(), // ISO8601 date string in UTC
    numShares: v.optional(v.number()),
    totalPriceCents: v.number(),
    amountPerShare: v.optional(v.number()),
    commissionFeeCents: v.optional(v.number()),
    transactionType: v.union(
      v.literal("buy"),
      v.literal("sell"),
      v.literal("return_of_capital"),
      v.literal("reinvested_dividend"),
      v.literal("reinvested_capital_gains_distribution"),
    ),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a transaction");
    }

    // Validate inputs
    if (args.numShares !== undefined && args.numShares === 0) {
      throw new Error("Number of shares cannot be zero");
    }
    if (
      args.transactionType !== "return_of_capital" &&
      args.numShares === undefined
    ) {
      throw new Error("Number of shares is required for this transaction type");
    }
    if (args.totalPriceCents < 0) {
      throw new Error("Total price cannot be negative");
    }
    if (args.commissionFeeCents !== undefined && args.commissionFeeCents < 0) {
      throw new Error("Commission fee cannot be negative");
    }
    if (
      args.transactionType === "return_of_capital" &&
      args.amountPerShare === undefined
    ) {
      throw new Error(
        "Return of capital per share is required for return of capital transactions",
      );
    }
    if (
      args.transactionType === "return_of_capital" &&
      args.amountPerShare !== undefined &&
      args.amountPerShare < 0
    ) {
      throw new Error("Return of capital per share cannot be negative");
    }

    // Verify security exists and user owns the portfolio
    const security = await ctx.db.get(args.securityId);
    if (!security) {
      throw new Error("Security not found");
    }

    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Security not found");
    }

    // Get the next sort order
    const existingTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .collect();

    const maxSortOrder = existingTransactions.reduce(
      (max, t) => Math.max(max, t.sortOrder),
      0,
    );

    return await ctx.db.insert("transactions", {
      securityId: args.securityId,
      date: args.date,
      numShares:
        args.transactionType === "return_of_capital"
          ? undefined
          : args.numShares,
      totalPriceCents:
        args.transactionType === "return_of_capital" ? 0 : args.totalPriceCents,
      amountPerShare:
        args.transactionType === "return_of_capital"
          ? args.amountPerShare
          : undefined,
      commissionFeeCents: args.commissionFeeCents || 0,
      transactionType: args.transactionType,
      sortOrder: maxSortOrder + 1,
    });
  },
});

/**
 * Get all transactions for a security, ordered by sort order.
 */
export const listTransactionsBySecurity = query({
  args: {
    securityId: v.id("securities"),
  },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      securityId: v.id("securities"),
      date: v.string(),
      numShares: v.optional(v.number()),
      totalPriceCents: v.number(),
      amountPerShare: v.optional(v.number()),
      commissionFeeCents: v.optional(v.number()),
      transactionType: v.union(
        v.literal("buy"),
        v.literal("sell"),
        v.literal("return_of_capital"),
        v.literal("reinvested_dividend"),
        v.literal("reinvested_capital_gains_distribution"),
      ),
      sortOrder: v.number(),
      capitalGains: v.optional(
        v.object({
          sellPricePerShareCents: v.number(),
          acbPerShareCents: v.number(),
          capitalGainLossCents: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const security = await ctx.db.get(args.securityId);
    if (!security) {
      return [];
    }

    // Verify user owns the portfolio that contains this security
    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return [];
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .order("asc")
      .collect();

    // Get capital gains data using the calculateACB helper
    const acbResult = await ctx.runQuery(api.calculations.calculateACB, {
      transactions,
      currency: security.currency,
    });

    // Create a map of transaction ID to capital gains data
    const capitalGainsMap = new Map();
    for (const cg of acbResult.capitalGainsLosses) {
      capitalGainsMap.set(cg.transactionId, {
        sellPricePerShareCents: cg.sellPricePerShareCents,
        acbPerShareCents: cg.acbPerShareCents,
        capitalGainLossCents: cg.capitalGainLossCents,
      });
    }

    // Add capital gains data to transactions
    return transactions.map((transaction) => ({
      ...transaction,
      capitalGains: capitalGainsMap.get(transaction._id) || undefined,
    }));
  },
});

/**
 * Get a single transaction by ID.
 */
export const getTransaction = query({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.union(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      securityId: v.id("securities"),
      date: v.string(),
      numShares: v.optional(v.number()),
      totalPriceCents: v.number(),
      amountPerShare: v.optional(v.number()),
      commissionFeeCents: v.optional(v.number()),
      transactionType: v.union(
        v.literal("buy"),
        v.literal("sell"),
        v.literal("return_of_capital"),
        v.literal("reinvested_dividend"),
        v.literal("reinvested_capital_gains_distribution"),
      ),
      sortOrder: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      return null;
    }

    // Verify user owns the portfolio that contains this transaction
    const security = await ctx.db.get(transaction.securityId);
    if (!security) {
      return null;
    }

    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return null;
    }

    return transaction;
  },
});

/**
 * Update a transaction's details.
 */
export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    date: v.string(), // ISO8601 date string in UTC
    numShares: v.optional(v.number()),
    totalPriceCents: v.number(),
    amountPerShare: v.optional(v.number()),
    commissionFeeCents: v.optional(v.number()),
    transactionType: v.union(
      v.literal("buy"),
      v.literal("sell"),
      v.literal("return_of_capital"),
      v.literal("reinvested_dividend"),
      v.literal("reinvested_capital_gains_distribution"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a transaction");
    }

    // Validate inputs
    if (args.numShares !== undefined && args.numShares === 0) {
      throw new Error("Number of shares cannot be zero");
    }
    if (
      args.transactionType !== "return_of_capital" &&
      args.numShares === undefined
    ) {
      throw new Error("Number of shares is required for this transaction type");
    }
    if (args.totalPriceCents < 0) {
      throw new Error("Total price cannot be negative");
    }
    if (args.commissionFeeCents !== undefined && args.commissionFeeCents < 0) {
      throw new Error("Commission fee cannot be negative");
    }
    if (
      args.transactionType === "return_of_capital" &&
      args.amountPerShare === undefined
    ) {
      throw new Error(
        "Return of capital per share is required for return of capital transactions",
      );
    }
    if (
      args.transactionType === "return_of_capital" &&
      args.amountPerShare !== undefined &&
      args.amountPerShare < 0
    ) {
      throw new Error("Return of capital per share cannot be negative");
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify user owns the portfolio that contains this transaction
    const security = await ctx.db.get(transaction.securityId);
    if (!security) {
      throw new Error("Transaction not found");
    }

    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Transaction not found");
    }

    await ctx.db.patch(args.transactionId, {
      date: args.date,
      numShares:
        args.transactionType === "return_of_capital"
          ? undefined
          : args.numShares,
      totalPriceCents:
        args.transactionType === "return_of_capital" ? 0 : args.totalPriceCents,
      amountPerShare:
        args.transactionType === "return_of_capital"
          ? args.amountPerShare
          : undefined,
      commissionFeeCents: args.commissionFeeCents || 0,
      transactionType: args.transactionType,
    });
    return null;
  },
});

/**
 * Delete a transaction.
 */
export const deleteTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a transaction");
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify user owns the portfolio that contains this transaction
    const security = await ctx.db.get(transaction.securityId);
    if (!security) {
      throw new Error("Transaction not found");
    }

    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Transaction not found");
    }

    await ctx.db.delete(args.transactionId);
    return null;
  },
});

/**
 * Reorder transactions by updating their sort order.
 */
export const reorderTransactions = mutation({
  args: {
    transactionIds: v.array(v.id("transactions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to reorder transactions");
    }

    for (let i = 0; i < args.transactionIds.length; i++) {
      const transactionId = args.transactionIds[i];
      const transaction = await ctx.db.get(transactionId);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      // Verify user owns the portfolio that contains this transaction
      const security = await ctx.db.get(transaction.securityId);
      if (!security) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      const portfolio = await ctx.db.get(security.portfolioId);
      if (!portfolio || portfolio.userId !== userId) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      await ctx.db.patch(transactionId, { sortOrder: i + 1 });
    }
    return null;
  },
});

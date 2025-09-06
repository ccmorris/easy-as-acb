import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Helper function to calculate ACB from an array of transactions.
 * Returns the final totals and all capital gains data for sell transactions.
 */
function calculateACBHelper(
  transactions: Array<{
    _id: any;
    date: string;
    numShares: number;
    totalPriceCents: number;
    commissionFeeCents?: number;
    transactionType: string;
  }>,
  currency: string,
) {
  let runningShares = 0;
  let runningACBCents = 0;
  const capitalGainsLosses: Array<{
    transactionId: any;
    date: string;
    numShares: number;
    sellPricePerShareCents: number;
    acbPerShareCents: number;
    capitalGainLossCents: number;
    currency: string;
  }> = [];

  for (const transaction of transactions) {
    const {
      numShares,
      totalPriceCents,
      commissionFeeCents = 0,
      transactionType,
    } = transaction;

    if (transactionType === "sell") {
      // Calculate ACB per share at time of sale
      const acbPerShareCents =
        runningShares > 0 ? runningACBCents / runningShares : 0;
      const sellPricePerShareCents =
        (totalPriceCents - commissionFeeCents) / numShares;
      const capitalGainLossCents =
        (sellPricePerShareCents - acbPerShareCents) * numShares;

      capitalGainsLosses.push({
        transactionId: transaction._id,
        date: transaction.date,
        numShares,
        sellPricePerShareCents,
        acbPerShareCents,
        capitalGainLossCents,
        currency,
      });
    }

    // Update running totals
    switch (transactionType) {
      case "buy":
      case "reinvested_dividend":
      case "reinvested_capital_gains_distribution":
        runningShares += numShares;
        runningACBCents += totalPriceCents + commissionFeeCents;
        break;

      case "sell":
        if (runningShares > 0) {
          const acbPerShare = runningACBCents / runningShares;
          const acbForSoldShares = acbPerShare * numShares;
          runningACBCents -= acbForSoldShares;
        }
        runningShares -= numShares;
        break;

      case "return_of_capital":
        if (runningShares > 0) {
          const acbPerShare = runningACBCents / runningShares;
          const acbReduction = Math.min(
            acbPerShare * numShares,
            runningACBCents,
          );
          runningACBCents -= acbReduction;
        }
        break;
    }
  }

  return {
    totalShares: runningShares,
    totalACBCents: runningACBCents,
    acbPerShareCents: runningShares > 0 ? runningACBCents / runningShares : 0,
    capitalGainsLosses,
  };
}

/**
 * Get security summary including total shares, total ACB, and ACB per share.
 */
export const getSecuritySummary = query({
  args: {
    securityId: v.id("securities"),
  },
  returns: v.object({
    totalShares: v.number(),
    totalACBCents: v.number(),
    acbPerShareCents: v.number(),
    currency: v.string(),
  }),
  handler: async (ctx, args) => {
    const security = await ctx.db.get(args.securityId);
    if (!security) {
      throw new Error("Security not found");
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .order("asc")
      .collect();

    const result = calculateACBHelper(transactions, security.currency);

    return {
      totalShares: result.totalShares,
      totalACBCents: result.totalACBCents,
      acbPerShareCents: result.acbPerShareCents,
      currency: security.currency,
    };
  },
});

/**
 * Get capital gains/losses for all sell transactions.
 */
export const getCapitalGainsLosses = query({
  args: {
    securityId: v.id("securities"),
  },
  returns: v.array(
    v.object({
      transactionId: v.id("transactions"),
      date: v.string(), // ISO8601 date string in UTC
      numShares: v.number(),
      sellPricePerShareCents: v.number(),
      acbPerShareCents: v.number(),
      capitalGainLossCents: v.number(),
      currency: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const security = await ctx.db.get(args.securityId);
    if (!security) {
      throw new Error("Security not found");
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .order("asc")
      .collect();

    const result = calculateACBHelper(transactions, security.currency);

    return result.capitalGainsLosses;
  },
});

/**
 * Calculate ACB from an array of transactions (internal helper query).
 */
export const calculateACB = query({
  args: {
    transactions: v.array(
      v.object({
        _id: v.id("transactions"),
        _creationTime: v.number(),
        securityId: v.id("securities"),
        date: v.string(),
        numShares: v.number(),
        totalPriceCents: v.number(),
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
    ),
    currency: v.string(),
  },
  returns: v.object({
    totalShares: v.number(),
    totalACBCents: v.number(),
    acbPerShareCents: v.number(),
    capitalGainsLosses: v.array(
      v.object({
        transactionId: v.id("transactions"),
        date: v.string(),
        numShares: v.number(),
        sellPricePerShareCents: v.number(),
        acbPerShareCents: v.number(),
        capitalGainLossCents: v.number(),
        currency: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    return calculateACBHelper(args.transactions, args.currency);
  },
});

/**
 * Get all data needed for security detail page in one query.
 */
export const getSecurityDetailData = query({
  args: {
    portfolioId: v.id("portfolios"),
    securityId: v.id("securities"),
  },
  returns: v.object({
    portfolio: v.union(
      v.object({
        _id: v.id("portfolios"),
        _creationTime: v.number(),
        name: v.string(),
        userId: v.id("users"),
      }),
      v.null(),
    ),
    security: v.union(
      v.object({
        _id: v.id("securities"),
        _creationTime: v.number(),
        portfolioId: v.id("portfolios"),
        name: v.string(),
        ticker: v.string(),
        currency: v.string(),
      }),
      v.null(),
    ),
    summary: v.union(
      v.object({
        totalShares: v.number(),
        totalACBCents: v.number(),
        acbPerShareCents: v.number(),
        currency: v.string(),
      }),
      v.null(),
    ),
    transactions: v.array(
      v.object({
        _id: v.id("transactions"),
        _creationTime: v.number(),
        securityId: v.id("securities"),
        date: v.string(),
        numShares: v.number(),
        totalPriceCents: v.number(),
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
  }),
  handler: async (ctx, args) => {
    // Get portfolio
    const portfolio = await ctx.db.get(args.portfolioId);

    // Get security
    const security = await ctx.db.get(args.securityId);
    if (!security) {
      return {
        portfolio,
        security: null,
        summary: null,
        transactions: [],
      };
    }

    // Get transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .order("asc")
      .collect();

    // Calculate ACB and get capital gains
    const acbResult: {
      totalShares: number;
      totalACBCents: number;
      acbPerShareCents: number;
      capitalGainsLosses: Array<{
        transactionId: any;
        date: string;
        numShares: number;
        sellPricePerShareCents: number;
        acbPerShareCents: number;
        capitalGainLossCents: number;
        currency: string;
      }>;
    } = await ctx.runQuery(api.calculations.calculateACB, {
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
    const transactionsWithCapitalGains = transactions.map((transaction) => ({
      ...transaction,
      capitalGains: capitalGainsMap.get(transaction._id) || undefined,
    }));

    return {
      portfolio,
      security,
      summary: {
        totalShares: acbResult.totalShares,
        totalACBCents: acbResult.totalACBCents,
        acbPerShareCents: acbResult.acbPerShareCents,
        currency: security.currency,
      },
      transactions: transactionsWithCapitalGains,
    };
  },
});

/**
 * Get portfolio summary for all securities.
 */
export const getPortfolioSummary = query({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.array(
    v.object({
      securityId: v.id("securities"),
      name: v.string(),
      ticker: v.string(),
      currency: v.string(),
      totalShares: v.number(),
      totalACBCents: v.number(),
      acbPerShareCents: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const securities = await ctx.db
      .query("securities")
      .withIndex("by_portfolio", (q) => q.eq("portfolioId", args.portfolioId))
      .collect();

    const summaries: Array<{
      securityId: any;
      name: string;
      ticker: string;
      currency: string;
      totalShares: number;
      totalACBCents: number;
      acbPerShareCents: number;
    }> = [];

    for (const security of securities) {
      const summary: {
        totalShares: number;
        totalACBCents: number;
        acbPerShareCents: number;
        currency: string;
      } = await ctx.runQuery(api.calculations.getSecuritySummary, {
        securityId: security._id,
      });

      summaries.push({
        securityId: security._id,
        name: security.name,
        ticker: security.ticker,
        currency: security.currency,
        totalShares: summary.totalShares,
        totalACBCents: summary.totalACBCents,
        acbPerShareCents: summary.acbPerShareCents,
      });
    }

    return summaries;
  },
});

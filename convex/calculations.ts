import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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

    let totalShares = 0;
    let totalACBCents = 0;

    for (const transaction of transactions) {
      const {
        numShares,
        totalPriceCents,
        commissionFeeCents = 0,
        transactionType,
      } = transaction;

      switch (transactionType) {
        case "buy":
        case "reinvested_dividend":
        case "reinvested_capital_gains_distribution":
          // Add to position and ACB
          totalShares += numShares;
          totalACBCents += totalPriceCents + commissionFeeCents;
          break;

        case "sell":
          // Reduce position proportionally
          if (totalShares > 0) {
            const acbPerShare = totalACBCents / totalShares;
            const acbForSoldShares = acbPerShare * numShares;
            totalACBCents -= acbForSoldShares;
          }
          totalShares -= numShares;
          break;

        case "return_of_capital":
          // Reduce ACB but not shares
          if (totalShares > 0) {
            const acbPerShare = totalACBCents / totalShares;
            const acbReduction = Math.min(
              acbPerShare * numShares,
              totalACBCents,
            );
            totalACBCents -= acbReduction;
          }
          break;
      }
    }

    const acbPerShareCents = totalShares > 0 ? totalACBCents / totalShares : 0;

    return {
      totalShares,
      totalACBCents,
      acbPerShareCents,
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

    const sellTransactions = transactions.filter(
      (t) => t.transactionType === "sell",
    );
    const capitalGainsLosses = [];

    let runningShares = 0;
    let runningACBCents = 0;

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
          currency: security.currency,
        });
      }

      // Update running totals for next transaction
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

    return capitalGainsLosses;
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

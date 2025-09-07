import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new security in a portfolio.
 */
export const createSecurity = mutation({
  args: {
    portfolioId: v.id("portfolios"),
    name: v.string(),
    ticker: v.string(),
    currency: v.string(),
  },
  returns: v.id("securities"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a security");
    }
    if (!args.name.trim()) {
      throw new Error("Security name cannot be empty");
    }
    if (!args.ticker.trim()) {
      throw new Error("Ticker symbol cannot be empty");
    }
    if (!args.currency.trim()) {
      throw new Error("Currency cannot be empty");
    }

    // Verify portfolio exists and user owns it
    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }
    if (portfolio.userId !== userId) {
      throw new Error("Portfolio not found");
    }

    return await ctx.db.insert("securities", {
      portfolioId: args.portfolioId,
      name: args.name.trim(),
      ticker: args.ticker.trim().toUpperCase(),
      currency: args.currency.trim().toUpperCase(),
    });
  },
});

/**
 * Get all securities in a portfolio.
 */
export const listSecuritiesByPortfolio = query({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("securities"),
      _creationTime: v.number(),
      portfolioId: v.id("portfolios"),
      name: v.string(),
      ticker: v.string(),
      currency: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify portfolio exists and user owns it
    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query("securities")
      .withIndex("by_portfolio", (q) => q.eq("portfolioId", args.portfolioId))
      .collect();
  },
});

/**
 * Get a single security by ID.
 */
export const getSecurity = query({
  args: {
    securityId: v.id("securities"),
  },
  returns: v.union(
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const security = await ctx.db.get(args.securityId);
    if (!security) {
      return null;
    }

    // Verify user owns the portfolio that contains this security
    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return null;
    }

    return security;
  },
});

/**
 * Update a security's details.
 */
export const updateSecurity = mutation({
  args: {
    securityId: v.id("securities"),
    name: v.string(),
    ticker: v.string(),
    currency: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a security");
    }
    if (!args.name.trim()) {
      throw new Error("Security name cannot be empty");
    }
    if (!args.ticker.trim()) {
      throw new Error("Ticker symbol cannot be empty");
    }
    if (!args.currency.trim()) {
      throw new Error("Currency cannot be empty");
    }

    const security = await ctx.db.get(args.securityId);
    if (!security) {
      throw new Error("Security not found");
    }

    // Verify user owns the portfolio that contains this security
    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Security not found");
    }

    await ctx.db.patch(args.securityId, {
      name: args.name.trim(),
      ticker: args.ticker.trim().toUpperCase(),
      currency: args.currency.trim().toUpperCase(),
    });
    return null;
  },
});

/**
 * Delete a security and all its transactions.
 */
export const deleteSecurity = mutation({
  args: {
    securityId: v.id("securities"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a security");
    }

    const security = await ctx.db.get(args.securityId);
    if (!security) {
      throw new Error("Security not found");
    }

    // Verify user owns the portfolio that contains this security
    const portfolio = await ctx.db.get(security.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Security not found");
    }

    // Delete all transactions for this security
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_security_and_sort", (q) =>
        q.eq("securityId", args.securityId),
      )
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Delete the security
    await ctx.db.delete(args.securityId);
    return null;
  },
});

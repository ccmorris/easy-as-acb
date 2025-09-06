import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new portfolio with a given name.
 */
export const createPortfolio = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("portfolios"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a portfolio");
    }
    if (!args.name.trim()) {
      throw new Error("Portfolio name cannot be empty");
    }
    return await ctx.db.insert("portfolios", {
      name: args.name.trim(),
      userId: userId,
    });
  },
});

/**
 * Get all portfolios.
 */
export const listPortfolios = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("portfolios"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("portfolios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get a single portfolio by ID.
 */
export const getPortfolio = query({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.union(
    v.object({
      _id: v.id("portfolios"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.id("users"),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return null;
    }
    return portfolio;
  },
});

/**
 * Update a portfolio's name.
 */
export const updatePortfolio = mutation({
  args: {
    portfolioId: v.id("portfolios"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a portfolio");
    }
    if (!args.name.trim()) {
      throw new Error("Portfolio name cannot be empty");
    }

    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found");
    }

    await ctx.db.patch(args.portfolioId, { name: args.name.trim() });
    return null;
  },
});

/**
 * Delete a portfolio and all its securities and transactions.
 */
export const deletePortfolio = mutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a portfolio");
    }
    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error("Portfolio not found");
    }

    // Delete all securities in this portfolio
    const securities = await ctx.db
      .query("securities")
      .withIndex("by_portfolio", (q) => q.eq("portfolioId", args.portfolioId))
      .collect();

    for (const security of securities) {
      // Delete all transactions for this security
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_security_and_sort", (q) =>
          q.eq("securityId", security._id),
        )
        .collect();

      for (const transaction of transactions) {
        await ctx.db.delete(transaction._id);
      }

      // Delete the security
      await ctx.db.delete(security._id);
    }

    // Delete the portfolio
    await ctx.db.delete(args.portfolioId);
    return null;
  },
});

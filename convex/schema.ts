import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,

  // Investment tracking tables
  portfolios: defineTable({
    name: v.string(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  securities: defineTable({
    portfolioId: v.id("portfolios"),
    name: v.string(),
    ticker: v.string(),
    currency: v.string(),
  }).index("by_portfolio", ["portfolioId"]),

  transactions: defineTable({
    securityId: v.id("securities"),
    date: v.string(), // ISO8601 date string in UTC
    numShares: v.optional(v.number()), // can be negative for sells, not stored for return_of_capital
    totalPriceCents: v.number(), // amount in cents for buy/sell transactions
    amountPerShare: v.optional(v.number()), // amount per share in dollars for eg. return_of_capital transactions
    commissionFeeCents: v.optional(v.number()), // amount in cents
    transactionType: v.union(
      v.literal("buy"),
      v.literal("sell"),
      v.literal("return_of_capital"),
      v.literal("reinvested_dividend"),
      v.literal("reinvested_capital_gains_distribution"),
    ),
    sortOrder: v.number(),
  }).index("by_security_and_sort", ["securityId", "sortOrder"]),
});

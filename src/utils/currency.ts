/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  cents: number,
  currency: string = "CAD",
): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency,
  }).format(dollars);
}

/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

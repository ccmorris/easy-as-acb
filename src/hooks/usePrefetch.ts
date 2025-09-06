import { useConvex } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Hook for prefetching security detail data when hovering over security links
 */
export function usePrefetchSecurityDetail() {
  const convex = useConvex();

  const prefetchSecurityDetail = useCallback(
    (portfolioId: Id<"portfolios">, securityId: Id<"securities">) => {
      // Prefetch all the data needed for the security detail page in one query
      convex
        .query(api.calculations.getSecurityDetailData, {
          portfolioId,
          securityId,
        })
        .catch((error) => {
          console.warn("Prefetch failed:", error);
        });
    },
    [convex],
  );

  return { prefetchSecurityDetail };
}

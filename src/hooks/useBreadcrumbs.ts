import { useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BreadcrumbItem } from "../components/ui/Breadcrumb";

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const pathname = location.pathname;

  // Extract parameters from pathname manually
  const pathParts = pathname.split("/").filter(Boolean);

  let portfolioId: string | undefined;
  let securityId: string | undefined;

  if (pathParts[0] === "portfolio" && pathParts[1]) {
    portfolioId = pathParts[1];
    if (pathParts[2] === "security" && pathParts[3]) {
      securityId = pathParts[3];
    }
  }

  // Get portfolio and security data if we're on those pages
  const portfolio = useQuery(
    api.portfolios.getPortfolio,
    portfolioId ? { portfolioId: portfolioId as any } : "skip",
  );

  const security = useQuery(
    api.securities.getSecurity,
    securityId ? { securityId: securityId as any } : "skip",
  );

  // Home page
  if (pathname === "/") {
    return [{ label: "Portfolios", current: true }];
  }

  // Portfolio page
  if (pathname.match(/^\/portfolio\/[^\/]+$/)) {
    return [
      { label: "Portfolios", href: "/" },
      { label: portfolio?.name || "", current: true },
    ];
  }

  // Security page
  if (pathname.match(/^\/portfolio\/[^\/]+\/security\/[^\/]+$/)) {
    return [
      { label: "Portfolios", href: "/" },
      {
        label: portfolio?.name || "",
        href: portfolioId ? `/portfolio/${portfolioId}` : "/",
      },
      { label: security?.name || "", current: true },
    ];
  }

  // Default fallback
  return [{ label: "Portfolios", current: true }];
}

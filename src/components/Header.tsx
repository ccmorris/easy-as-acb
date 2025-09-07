import { SignOutButton } from "./Auth";
import { Breadcrumb } from "./ui";
import { useBreadcrumbs } from "../hooks/useBreadcrumbs";
import { Authenticated } from "convex/react";
import { useLocation } from "react-router-dom";

export function Header() {
  const breadcrumbs = useBreadcrumbs();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header className="sticky top-0 z-10 gradient-subtle-bg border-b border-gray-200 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
              <img
                src="/favicon.png"
                alt="Easy as ACB"
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <span className="hidden md:inline">Easy as ACB</span>
            </h1>
            <div className="min-w-0 flex-1">
              <Breadcrumb
                items={breadcrumbs}
                className={isHomePage ? "hidden sm:flex" : ""}
              />
            </div>
          </div>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}

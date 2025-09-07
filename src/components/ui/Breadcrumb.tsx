import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // On mobile, show only the last 2 items to save space, but only if we have more than 3 items
  const displayItems = items.length > 3 ? items.slice(-2) : items;
  const showEllipsis = items.length > 3;

  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-xs sm:text-sm",
        className,
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 min-w-0">
        {showEllipsis && (
          <>
            <li className="flex items-center">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
              >
                <Home className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Portfolios</span>
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1" />
            <li className="flex items-center">
              <span className="text-gray-400">...</span>
            </li>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1" />
          </>
        )}
        {displayItems.map((item, index) => {
          const actualIndex = showEllipsis
            ? items.length - displayItems.length + index
            : index;
          return (
            <li key={actualIndex} className="flex items-center min-w-0">
              {!showEllipsis && actualIndex > 0 && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1" />
              )}
              {item.href && !item.current ? (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center min-w-0"
                >
                  {actualIndex === 0 && !showEllipsis && (
                    <Home className="w-4 h-4 mr-1" />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {actualIndex === 0 && !showEllipsis ? (
                      <span className="hidden md:inline">{item.label}</span>
                    ) : (
                      item.label
                    )}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center min-w-0",
                    item.current
                      ? "text-gray-900 font-medium"
                      : "text-gray-500",
                  )}
                >
                  {actualIndex === 0 && !showEllipsis && (
                    <Home className="w-4 h-4 mr-1" />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {actualIndex === 0 && !showEllipsis ? (
                      <span className="hidden md:inline">{item.label}</span>
                    ) : (
                      item.label
                    )}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

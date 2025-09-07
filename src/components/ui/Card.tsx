import React from "react";
import { cn } from "../../utils/cn.js";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export function Card({
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "card-clean p-6 transition-all duration-200",
        interactive &&
          "cursor-pointer hover:shadow-subtle-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

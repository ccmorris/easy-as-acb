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
        "bg-white border border-gray-200 rounded-xl p-6 transition-all",
        interactive &&
          "cursor-pointer hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

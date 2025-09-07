import React from "react";
import { cn } from "../../utils/cn.js";

export interface InteractiveCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export function InteractiveCard({
  interactive = false,
  className,
  children,
  ...props
}: InteractiveCardProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-6 transition-all duration-200 shadow-sm",
        interactive &&
          "cursor-pointer hover:shadow-lg hover:border-primary-300 hover:bg-gradient-to-br hover:from-white hover:to-blue-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

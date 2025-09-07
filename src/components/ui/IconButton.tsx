import React from "react";
import { cn } from "../../utils/cn.js";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const iconButtonVariants = {
  primary:
    "text-blue-600 hover:text-blue-700 border-blue-600/20 hover:border-blue-600/40",
  secondary:
    "text-gray-600 hover:text-gray-700 border-gray-600/20 hover:border-gray-600/40",
  success:
    "text-green-600 hover:text-green-700 border-green-600/20 hover:border-green-600/40",
  danger:
    "text-red-600 hover:text-red-700 border-red-600/20 hover:border-red-600/40",
  warning:
    "text-yellow-600 hover:text-yellow-700 border-yellow-600/20 hover:border-yellow-600/40",
};

const iconButtonSizes = {
  sm: "p-1",
  md: "p-2",
  lg: "p-3",
};

export function IconButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        iconButtonVariants[variant],
        iconButtonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

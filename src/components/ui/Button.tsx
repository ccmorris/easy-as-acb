import React from "react";
import { cn } from "../../utils/cn.js";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const buttonVariants = {
  primary:
    "gradient-button-primary text-white hover:shadow-subtle focus:ring-primary-500",
  secondary:
    "bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 border border-gray-300",
  success:
    "gradient-button-success text-white hover:shadow-subtle focus:ring-success-500",
  danger:
    "gradient-button-danger text-white hover:shadow-subtle focus:ring-danger-500",
  warning:
    "bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 border border-warning-600",
};

const buttonSizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

import React from "react";
import { Plus } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface AddNewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  iconSize?: "sm" | "md" | "lg";
  layout?: "vertical" | "horizontal";
}

export function AddNewCard({
  children,
  iconSize = "md",
  layout = "vertical",
  className,
  ...props
}: AddNewCardProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const iconSpacing = {
    vertical: "mb-2",
    horizontal: "mr-3",
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-white to-gray-50 border-2 border-dashed border-gray-300 rounded-lg shadow-sm transition-all duration-200 cursor-pointer p-6",
        "hover:border-primary-500 hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100 hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center text-gray-500 transition-colors duration-200",
          "hover:text-primary-600",
          layout === "vertical" ? "flex-col" : "flex-row",
        )}
      >
        <Plus className={cn(iconSizes[iconSize], iconSpacing[layout])} />
        <span className="text-sm font-medium">{children}</span>
      </div>
    </div>
  );
}

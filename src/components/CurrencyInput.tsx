import React, { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  required = false,
  disabled = false,
  className = "",
  id,
  label,
  enterKeyHint = "done",
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Convert cents to display format (dollars) with comma formatting
  const centsToDisplay = (cents: string): string => {
    if (!cents || cents === "0") return "";
    const numCents = parseInt(cents, 10);
    if (isNaN(numCents)) return "";
    const dollars = numCents / 100;
    return dollars.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Convert display format to cents
  const displayToCents = (display: string): string => {
    if (!display) return "0";
    // Remove any non-numeric characters except decimal point
    let cleanValue = display.replace(/[^\d.]/g, "");

    // Handle multiple decimal points by keeping only the first one
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Convert to number and then to cents
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return "0";

    return Math.round(numValue * 100).toString();
  };

  // Format display value with progressive formatting as user types
  const formatDisplayValue = (input: string): string => {
    if (!input) return "";

    // Remove any non-numeric characters except decimal point
    let cleanValue = input.replace(/[^\d.]/g, "");

    // Handle multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }

    // If there's a decimal point, limit to 2 decimal places
    if (cleanValue.includes(".")) {
      const [integer, decimal] = cleanValue.split(".");
      cleanValue = integer + "." + decimal.slice(0, 2);
    }

    // Convert to number for formatting
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return "";

    // Format with commas and proper decimal places
    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(centsToDisplay(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove all non-numeric characters to get raw digits
    const rawDigits = inputValue.replace(/[^\d]/g, "");

    // Convert raw digits to cents (treating as if user is typing from right to left)
    // e.g., "123456" becomes 123456 cents = $1,234.56
    const centsValue = rawDigits || "0";

    // Format for display
    const formattedValue = formatDisplayValue(
      (parseInt(centsValue, 10) / 100).toString(),
    );

    setDisplayValue(formattedValue);
    onChange(centsValue);
  };

  const handleBlur = () => {
    // The formatting is already handled in handleInputChange
    // No additional formatting needed on blur
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }
    // Only allow numeric input (0-9)
    if (
      (e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          $
        </span>
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "0.00"}
          required={required}
          disabled={disabled}
          enterKeyHint={enterKeyHint}
          inputMode="decimal"
          className={`pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
      </div>
    </div>
  );
}

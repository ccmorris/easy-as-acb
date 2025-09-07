import { Input } from "./Input";

interface DecimalInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  inputMode?: "decimal" | "numeric";
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
}

export function DecimalInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0.000000",
  required = false,
  step = "0.000001",
  inputMode = "decimal",
  enterKeyHint = "next",
}: DecimalInputProps) {
  return (
    <Input
      id={id}
      label={label}
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      enterKeyHint={enterKeyHint}
      required={required}
    />
  );
}

import { ChevronDown } from "lucide-react";

export const selectClass =
  "w-full px-4 py-3.5 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white appearance-none text-foreground";
export const inputClass =
  "w-full px-4 py-3.5 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-0 transition-colors bg-white text-foreground";
export const labelClass = "block text-sm font-medium text-foreground mb-1.5";

interface SelectFieldProps {
  label: string;
  name: string;
  options: string[];
  optional?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}

export const SelectField = ({
  label,
  name,
  options,
  optional,
  value,
  onChange,
  disabled = false,
}: SelectFieldProps) => (
  <div>
    {label && (
      <label className={labelClass}>
        {label}
        {optional && (
          <span className="text-muted-foreground"> (Optional)</span>
        )}
      </label>
    )}
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-disabled={disabled}
        className={`${selectClass} ${disabled ? "cursor-not-allowed bg-muted/50 text-muted-foreground opacity-90" : ""}`}
      >
        <option value="">Select {label || name}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

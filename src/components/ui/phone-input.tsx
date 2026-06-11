import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { digitsOnlyMobile } from "@/lib/phone";

export type PhoneInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

/** Fixed +91 prefix with 10-digit Indian mobile input. */
export function PhoneInput({ value, onChange, className, invalid, ...props }: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <div className="flex items-center px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0 h-10">
        +91
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile"
        value={value}
        onChange={(e) => onChange(digitsOnlyMobile(e.target.value))}
        className={cn(invalid && "border-destructive focus-visible:ring-destructive", className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    </div>
  );
}

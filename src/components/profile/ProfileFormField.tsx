import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ProfileFieldErrors = Partial<Record<string, string>>;

export function fieldError(
  errors: ProfileFieldErrors | undefined,
  key: string,
): string | undefined {
  return errors?.[key];
}

export function invalidInputClass(error?: string) {
  return error ? "border-destructive focus-visible:ring-destructive" : "";
}

export function invalidSelectClass(error?: string) {
  return error ? "border-destructive focus-visible:ring-destructive" : "";
}

interface ProfileFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

export default function ProfileFormField({
  label,
  required,
  error,
  className,
  children,
}: ProfileFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && " *"}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

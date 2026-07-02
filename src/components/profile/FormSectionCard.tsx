import type { ReactNode } from "react";

interface FormSectionCardProps {
  title: string;
  children: ReactNode;
}

export default function FormSectionCard({ title, children }: FormSectionCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

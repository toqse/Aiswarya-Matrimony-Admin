/** Inline placeholder while a heavy dashboard route chunk loads (no API calls). */
export default function DashboardSectionLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4"
      aria-busy="true"
      aria-label="Loading section"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

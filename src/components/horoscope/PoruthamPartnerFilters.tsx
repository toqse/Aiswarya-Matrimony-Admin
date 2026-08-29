import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCastes, fetchReligions } from "@/lib/admin-api/master";
import {
  EMPTY_PORUTHAM_PARTNER_FILTERS,
  type PoruthamPartnerFiltersState,
} from "@/lib/poruthamPartnerFilters";
import { NAKSHATRA_OPTIONS, RAJJU_OPTIONS, RASI_OPTIONS } from "@/lib/profileSearch";

type PoruthamPartnerFiltersProps = {
  value: PoruthamPartnerFiltersState;
  onChange: (next: PoruthamPartnerFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function PoruthamPartnerFilters({
  value,
  onChange,
  onApply,
  onReset,
}: PoruthamPartnerFiltersProps) {
  const patch = (partial: Partial<PoruthamPartnerFiltersState>) =>
    onChange({ ...value, ...partial });

  const religionsQuery = useQuery({
    queryKey: ["master", "religions", "porutham-partner"],
    queryFn: () => fetchReligions({ page_size: 200 }),
  });

  const castesQuery = useQuery({
    queryKey: ["master", "castes", "porutham-partner", value.religion_id],
    queryFn: () =>
      fetchCastes({
        religion_id: Number(value.religion_id),
        page_size: 500,
      }),
    enabled: !!value.religion_id,
  });

  const religions = religionsQuery.data?.results ?? [];
  const castes = castesQuery.data?.results ?? [];

  return (
    <form
      className="rounded-lg border bg-muted/20 p-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Partner search filters</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button type="submit" size="sm">
            <Search className="h-3.5 w-3.5 mr-1" /> Search
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Field label="Name / Matri ID">
          <Input
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder="Search…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onApply();
              }
            }}
          />
        </Field>
        <Field label="Religion">
          <Select
            value={value.religion_id || "all"}
            onValueChange={(v) =>
              patch({ religion_id: v === "all" ? "" : v, caste_id: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All religions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All religions</SelectItem>
              {religions.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Caste">
          <Select
            value={value.caste_id || "all"}
            onValueChange={(v) => patch({ caste_id: v === "all" ? "" : v })}
          >
            <SelectTrigger disabled={!value.religion_id}>
              <SelectValue placeholder={value.religion_id ? "All castes" : "Select religion first"} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All castes</SelectItem>
              {castes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Star (Nakshatra)">
          <Select
            value={value.pr_star || "all"}
            onValueChange={(v) => patch({ pr_star: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All stars" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All stars</SelectItem>
              {NAKSHATRA_OPTIONS.filter((s) => s.value).map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Rasi">
          <Select
            value={value.rasi_id || "all"}
            onValueChange={(v) => patch({ rasi_id: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All rasi" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All rasi</SelectItem>
              {RASI_OPTIONS.filter((r) => r.value).map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Rajju">
          <Select
            value={value.rajju || "all"}
            onValueChange={(v) => patch({ rajju: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All rajju" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rajju</SelectItem>
              {RAJJU_OPTIONS.filter((r) => r.value).map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </form>
  );
}

export { EMPTY_PORUTHAM_PARTNER_FILTERS };

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, RotateCcw, Search } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { fetchReligions } from "@/lib/admin-api/master";
import { fetchBranchList } from "@/lib/admin-api/branches";
import {
  EMPTY_HOROSCOPE_SEARCH,
  type HoroscopeSearchFiltersState,
} from "@/lib/horoscopeSearch";
import {
  HOROSCOPE_MATCH_OPTIONS,
  NAKSHATRA_OPTIONS,
  PLANET_FILTER_OPTIONS,
  PLANET_HOUSE_OPTIONS,
  RAJJU_MATCH_OPTIONS,
  RAJJU_OPTIONS,
  RASI_OPTIONS,
  YES_NO_ANY_OPTIONS,
} from "@/lib/profileSearch";
import type { UserRole } from "@/types/user-role";

type HoroscopeSearchFiltersProps = {
  value: HoroscopeSearchFiltersState;
  onChange: (next: HoroscopeSearchFiltersState) => void;
  onSearch: () => void;
  onReset: () => void;
  role: UserRole;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function HoroscopeSearchFilters({
  value,
  onChange,
  onSearch,
  onReset,
  role,
}: HoroscopeSearchFiltersProps) {
  const [open, setOpen] = useState(true);
  const [matchingOpen, setMatchingOpen] = useState(true);
  const isAdmin = role === "admin";

  const patch = (partial: Partial<HoroscopeSearchFiltersState>) =>
    onChange({ ...value, ...partial });

  const religionsQuery = useQuery({
    queryKey: ["master", "religions", "horoscope-search"],
    queryFn: () => fetchReligions({ page_size: 200 }),
  });

  const branchesQuery = useQuery({
    queryKey: ["admin", "branches", "horoscope-search"],
    queryFn: () => fetchBranchList({ page: 1, page_size: 100 }),
    enabled: isAdmin,
  });

  const religions = religionsQuery.data?.results ?? [];
  const branches = branchesQuery.data?.results ?? [];

  return (
    <Card className="shadow-elegant border-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold"
          onClick={() => setOpen((v) => !v)}
        >
          Search filters
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button type="button" size="sm" onClick={onSearch}>
            <Search className="h-3.5 w-3.5 mr-1" /> Search
          </Button>
        </div>
      </div>

      {open ? (
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <Field label="Quick search">
              <Input
                value={value.search}
                onChange={(e) => patch({ search: e.target.value })}
                placeholder="Profile, matri ID, rasi…"
              />
            </Field>

            <Field label="Matrimony ID">
              <Input
                value={value.matri_id}
                onChange={(e) => patch({ matri_id: e.target.value })}
                placeholder="AM100023"
              />
            </Field>

            <Field label="Name">
              <Input
                value={value.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Member name"
              />
            </Field>

            <Field label="Religion">
              <Select
                value={value.religion_id || "all"}
                onValueChange={(v) => patch({ religion_id: v === "all" ? "" : v })}
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

            {isAdmin ? (
              <Field label="Branch">
                <Select
                  value={value.branch_id || "all"}
                  onValueChange={(v) => patch({ branch_id: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>

          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold mb-3"
              onClick={() => setMatchingOpen((v) => !v)}
            >
              Horoscope &amp; Matching
              {matchingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {matchingOpen ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                      {NAKSHATRA_OPTIONS.map((s) => (
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
                      <SelectValue placeholder="All rasis" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="all">All rasis</SelectItem>
                      {RASI_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Planetary positions">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={value.planet || "any"}
                      onValueChange={(v) => patch({ planet: v === "any" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Planet" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANET_FILTER_OPTIONS.map((o) => (
                          <SelectItem key={o.value || "any"} value={o.value || "any"}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={value.planet_house || "any"}
                      onValueChange={(v) => patch({ planet_house: v === "any" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="House" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {PLANET_HOUSE_OPTIONS.map((o) => (
                          <SelectItem key={o.value || "any"} value={o.value || "any"}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field label="Check horoscope">
                  <Select
                    value={value.has_horoscope || "any"}
                    onValueChange={(v) => patch({ has_horoscope: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_ANY_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Rajju">
                  <Select
                    value={value.rajju || "any"}
                    onValueChange={(v) => patch({ rajju: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAJJU_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Dosham">
                  <Select
                    value={value.dosham || "any"}
                    onValueChange={(v) => patch({ dosham: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_ANY_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Match Matri ID">
                  <Input
                    value={value.match_matri_id}
                    onChange={(e) => patch({ match_matri_id: e.target.value })}
                    placeholder="Reference member ID"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Enter a member ID to filter list by porutham compatibility.
                  </p>
                </Field>

                <Field label="Minimum porutham count">
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={value.min_porutham_count}
                    onChange={(e) => patch({ min_porutham_count: e.target.value })}
                    placeholder="0–10"
                  />
                </Field>

                <Field label="Rajju match">
                  <Select
                    value={value.rajju_match || "any"}
                    onValueChange={(v) => patch({ rajju_match: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RAJJU_MATCH_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Horoscope matching">
                  <Select
                    value={value.horoscope_match || "any"}
                    onValueChange={(v) => patch({ horoscope_match: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOROSCOPE_MATCH_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Star matching">
                  <Select
                    value={value.star_match || "any"}
                    onValueChange={(v) => patch({ star_match: v === "any" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_ANY_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "any"} value={o.value || "any"}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : null}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export { EMPTY_HOROSCOPE_SEARCH };

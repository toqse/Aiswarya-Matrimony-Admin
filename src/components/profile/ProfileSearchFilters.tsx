import { useMemo, useState } from "react";
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
import LocationMasterCombobox from "@/components/profile/LocationMasterCombobox";
import {
  fetchCastes,
  fetchCountries,
  fetchEducations,
  fetchIncomeRanges,
  fetchMaritalStatuses,
  fetchOccupations,
  fetchReligions,
} from "@/lib/admin-api/master";
import { fetchPlans } from "@/lib/admin-api/plans";
import { fetchAdminStaffList, fetchBranchStaffList } from "@/lib/admin-api/staff";
import {
  EMPTY_PROFILE_SEARCH,
  HOROSCOPE_MATCH_OPTIONS,
  NAKSHATRA_OPTIONS,
  PHOTO_OPTIONS,
  PLANET_FILTER_OPTIONS,
  PLANET_HOUSE_OPTIONS,
  PROFILE_STATUS_OPTIONS,
  RAJJU_MATCH_OPTIONS,
  RAJJU_OPTIONS,
  RASI_OPTIONS,
  YES_NO_ANY_OPTIONS,
  type ProfileSearchFiltersState,
} from "@/lib/profileSearch";
import type { UserRole } from "@/types/user-role";

type ProfileSearchFiltersProps = {
  value: ProfileSearchFiltersState;
  onChange: (next: ProfileSearchFiltersState) => void;
  onSearch: () => void;
  onReset: () => void;
  role: UserRole;
  /** Show assigned-staff filter (admin + branch). */
  showAssignedStaff?: boolean;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ProfileSearchFilters({
  value,
  onChange,
  onSearch,
  onReset,
  role,
  showAssignedStaff = role === "admin" || role === "branch-manager",
}: ProfileSearchFiltersProps) {
  const [open, setOpen] = useState(true);
  const [horoscopeOpen, setHoroscopeOpen] = useState(false);

  const patch = (partial: Partial<ProfileSearchFiltersState>) =>
    onChange({ ...value, ...partial });

  const religionsQuery = useQuery({
    queryKey: ["master", "religions", "profile-search"],
    queryFn: () => fetchReligions({ page_size: 200 }),
  });

  const castesQuery = useQuery({
    queryKey: ["master", "castes", "profile-search", value.religion_id],
    queryFn: () =>
      fetchCastes({
        religion_id: Number(value.religion_id),
        page_size: 300,
      }),
    enabled: !!value.religion_id,
  });

  const countriesQuery = useQuery({
    queryKey: ["master", "countries", "profile-search"],
    queryFn: () => fetchCountries({ page_size: 50 }),
  });

  const indiaCountryId = useMemo(() => {
    const rows = countriesQuery.data?.results ?? [];
    const india = rows.find((c) => /india/i.test(c.name));
    return india?.id ? String(india.id) : "";
  }, [countriesQuery.data]);

  const educationsQuery = useQuery({
    queryKey: ["master", "educations", "profile-search"],
    queryFn: () => fetchEducations({ page_size: 200 }),
  });

  const occupationsQuery = useQuery({
    queryKey: ["master", "occupations", "profile-search"],
    queryFn: () => fetchOccupations({ page_size: 200 }),
  });

  const maritalQuery = useQuery({
    queryKey: ["master", "marital", "profile-search"],
    queryFn: () => fetchMaritalStatuses({ page_size: 50 }),
  });

  const incomeQuery = useQuery({
    queryKey: ["master", "income", "profile-search"],
    queryFn: () => fetchIncomeRanges({ page_size: 100 }),
  });

  const plansQuery = useQuery({
    queryKey: ["admin", "plans", "profile-search"],
    queryFn: fetchPlans,
  });

  const staffQuery = useQuery({
    queryKey: ["staff", "profile-search", role],
    queryFn: () =>
      role === "branch-manager"
        ? fetchBranchStaffList({ page_size: 200 })
        : fetchAdminStaffList({ status: "active", page_size: 200 }),
    enabled: showAssignedStaff,
  });

  const religions = religionsQuery.data?.results ?? [];
  const castes = castesQuery.data?.results ?? [];
  const educations = educationsQuery.data?.results ?? [];
  const occupations = occupationsQuery.data?.results ?? [];
  const maritalStatuses = maritalQuery.data?.results ?? [];
  const incomeRanges = incomeQuery.data?.results ?? [];
  const plans = plansQuery.data ?? [];
  const staffRows = staffQuery.data?.results ?? [];

  return (
    <Card className="border shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold"
          onClick={() => setOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
          Search profiles
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button type="submit" size="sm">
            Search
          </Button>
        </div>
      </div>

      {open ? (
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
            <Field label="Phone">
              <Input
                value={value.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="Mobile number"
              />
            </Field>
            <Field label="Age range">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={value.age_from}
                  onChange={(e) => patch({ age_from: e.target.value })}
                  placeholder="From"
                />
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={value.age_to}
                  onChange={(e) => patch({ age_to: e.target.value })}
                  placeholder="To"
                />
              </div>
            </Field>

            <Field label="Height from (cm)">
              <Input
                type="number"
                min={100}
                max={250}
                value={value.height_from_cm}
                onChange={(e) => patch({ height_from_cm: e.target.value })}
                placeholder="e.g. 150"
              />
            </Field>

            <Field label="Height to (cm)">
              <Input
                type="number"
                min={100}
                max={250}
                value={value.height_to_cm}
                onChange={(e) => patch({ height_to_cm: e.target.value })}
                placeholder="e.g. 180"
              />
            </Field>

            <Field label="Annual income">
              <Select
                value={value.income_id || "all"}
                onValueChange={(v) => patch({ income_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any income" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Any income</SelectItem>
                  {incomeRanges.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Registered from">
              <Input
                type="date"
                value={value.registered_from}
                onChange={(e) => patch({ registered_from: e.target.value })}
              />
            </Field>

            <Field label="Registered to">
              <Input
                type="date"
                value={value.registered_to}
                onChange={(e) => patch({ registered_to: e.target.value })}
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
                disabled={!value.religion_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={value.religion_id ? "All castes" : "Select religion first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All castes</SelectItem>
                  {castes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="State">
              <LocationMasterCombobox
                kind="state"
                value={value.state_id || "all"}
                parentId={indiaCountryId ? Number(indiaCountryId) : undefined}
                allowAll
                allLabel="All states"
                placeholder="All states"
                disabled={!indiaCountryId}
                onValueChange={(v) =>
                  patch({ state_id: v === "all" ? "" : v, district_id: "" })
                }
              />
            </Field>

            <Field label="District">
              <LocationMasterCombobox
                kind="district"
                value={value.district_id || "all"}
                parentId={value.state_id ? Number(value.state_id) : undefined}
                allowAll
                allLabel="All districts"
                placeholder={value.state_id ? "All districts" : "Select state first"}
                disabled={!value.state_id}
                onValueChange={(v) => patch({ district_id: v === "all" ? "" : v })}
              />
            </Field>

            <Field label="Education">
              <Select
                value={value.education_id || "all"}
                onValueChange={(v) => patch({ education_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All education" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All education</SelectItem>
                  {educations.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Occupation">
              <Select
                value={value.occupation_id || "all"}
                onValueChange={(v) => patch({ occupation_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All occupations" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All occupations</SelectItem>
                  {occupations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Marital status">
              <Select
                value={value.marital_status_id || "all"}
                onValueChange={(v) => patch({ marital_status_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {maritalStatuses.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Profile status">
              <Select
                value={value.profile_status || "all"}
                onValueChange={(v) => patch({ profile_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {showAssignedStaff ? (
              <Field label="Assigned staff">
                <Select
                  value={value.staff_id || "all"}
                  onValueChange={(v) => patch({ staff_id: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All staff" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all">All staff</SelectItem>
                    {staffRows.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}

            <Field label="Membership plan">
              <Select
                value={value.plan_id || "all"}
                onValueChange={(v) => patch({ plan_id: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Photo available">
              <Select
                value={value.has_photo || "any"}
                onValueChange={(v) => patch({ has_photo: v === "any" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_OPTIONS.map((o) => (
                    <SelectItem key={o.value || "any"} value={o.value || "any"}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold mb-3"
              onClick={() => setHoroscopeOpen((v) => !v)}
            >
              Horoscope &amp; Matching
              {horoscopeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {horoscopeOpen ? (
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
      </form>
    </Card>
  );
}

export { EMPTY_PROFILE_SEARCH };

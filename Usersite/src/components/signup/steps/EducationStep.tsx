import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { SelectField, inputClass, labelClass } from "../SignupFormFields";
import { toast } from "sonner";
import {
  getEducations,
  getEducationSubjects,
  getOccupations,
  getEmploymentStatuses,
  getIncomeRanges,
  type EducationMaster,
} from "@/lib/masterApi";

interface Props {
  formData: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

function SearchableEducationSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: Props["onChange"];
  options: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...options];
    if (!q) return list;
    return list.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const updatePosition = useCallback(() => {
    const btn = containerRef.current?.querySelector("button");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setSearch("");
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !overlayRef.current?.contains(t)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const select = (label: string) => {
    onChange({
      target: { name: "education", value: label },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setSearch("");
  };

  const display =
    value && value.trim() !== "" ? value : "Select Highest Education";
  const inList = (options as readonly string[]).includes(value);

  const dropdown =
    open &&
    position.width > 0 &&
    createPortal(
      <div
        ref={overlayRef}
        className="fixed z-[100] rounded-2xl border-2 border-primary/10 bg-white shadow-xl flex flex-col overflow-hidden max-h-[min(320px,70vh)]"
        style={{
          top: position.top,
          left: position.left,
          width: Math.max(position.width, 240),
          minWidth: 240,
        }}
      >
        <div className="p-2 border-b border-primary/10 bg-muted/30 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search qualification..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
        </div>
        <div className="overflow-y-auto p-1 flex-1 min-h-0 [scrollbar-width:thin]">
          {value && !inList && (
            <button
              type="button"
              onClick={() => select(value)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm bg-amber-50 text-amber-900 hover:bg-amber-100 mb-1"
            >
              Current: {value}
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No qualification matches your search</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  opt === value ? "bg-primary text-primary-foreground font-medium" : "hover:bg-primary/10 text-foreground"
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>Highest Education</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors bg-white text-left flex items-center justify-between gap-2 text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        <span className={value ? "" : "text-muted-foreground"}>{display}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

function SearchableSubjectSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: Props["onChange"];
  options: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...options];
    if (!q) return list;
    return list.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const updatePosition = useCallback(() => {
    const btn = containerRef.current?.querySelector("button");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setSearch("");
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !overlayRef.current?.contains(t)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const select = (label: string) => {
    onChange({
      target: { name: "educationSubject", value: label },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setSearch("");
  };

  const display = value && value.trim() !== "" ? value : "Select Subject";
  const inList = (options as readonly string[]).includes(value);

  const dropdown =
    open &&
    position.width > 0 &&
    createPortal(
      <div
        ref={overlayRef}
        className="fixed z-[100] rounded-2xl border-2 border-primary/10 bg-white shadow-xl flex flex-col overflow-hidden max-h-[min(320px,70vh)]"
        style={{
          top: position.top,
          left: position.left,
          width: Math.max(position.width, 240),
          minWidth: 240,
        }}
      >
        <div className="p-2 border-b border-primary/10 bg-muted/30 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
        </div>
        <div className="overflow-y-auto p-1 flex-1 min-h-0 [scrollbar-width:thin]">
          {value && !inList && (
            <button
              type="button"
              onClick={() => select(value)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm bg-amber-50 text-amber-900 hover:bg-amber-100 mb-1"
            >
              Current: {value}
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No subject matches your search</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  opt === value ? "bg-primary text-primary-foreground font-medium" : "hover:bg-primary/10 text-foreground"
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative">
      <label className={labelClass}>Subject</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 rounded-2xl border-2 border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors bg-white text-left flex items-center justify-between gap-2 text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        <span className={value ? "" : "text-muted-foreground"}>{display}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

const EducationStep = ({ formData, onChange }: Props) => {
  const [educations, setEducations] = useState<EducationMaster[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [occupations, setOccupations] = useState<string[]>([]);
  const [employmentStatuses, setEmploymentStatuses] = useState<string[]>([]);
  const [incomeRanges, setIncomeRanges] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [eduRes, occRes, empRes, incRes] = await Promise.all([
          getEducations(),
          getOccupations(),
          getEmploymentStatuses(),
          getIncomeRanges(),
        ]);
        if (!mounted) return;
        setEducations(eduRes);
        setOccupations(occRes.map((o) => o.name));
        setEmploymentStatuses(empRes.map((e) => e.name));
        setIncomeRanges(incRes.map((i) => i.name));
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : "Failed to load education master data",
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const selectedEducationId = educations.find(
      (e) => e.name === formData.education,
    )?.id;

    if (!selectedEducationId) {
      setSubjects([]);
      return;
    }

    setLoadingSubjects(true);
    (async () => {
      try {
        const subjectRes = await getEducationSubjects(selectedEducationId);
        if (!mounted) return;
        const names = subjectRes.map((s) => s.name);
        setSubjects(names);
        if (formData.educationSubject && !names.includes(formData.educationSubject)) {
          onChange({
            target: { name: "educationSubject", value: "" },
          } as React.ChangeEvent<HTMLSelectElement>);
        }
      } catch (e) {
        if (mounted) {
          toast.error(
            e instanceof Error
              ? e.message
              : "Failed to load education subjects",
          );
          setSubjects([]);
        }
      } finally {
        if (mounted) setLoadingSubjects(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [educations, formData.education, formData.educationSubject, onChange]);

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">Education & Occupation</h1>
        <p className="text-muted-foreground text-sm">Education, Subject, Employment, Occupation with search, Annual Income</p>
      </div>
      <div className="space-y-4">
        <SearchableEducationSelect
          value={formData.education}
          onChange={onChange}
          options={educations.map((e) => e.name)}
        />
        <SearchableSubjectSelect
          value={formData.educationSubject}
          onChange={onChange}
          options={subjects}
          disabled={!formData.education || loadingSubjects}
        />
        <SelectField
          label="Employment"
          name="employmentStatus"
          options={employmentStatuses}
          value={formData.employmentStatus}
          onChange={onChange}
        />
        <SelectField
          label="Occupation"
          name="occupation"
          options={occupations}
          value={formData.occupation}
          onChange={onChange}
        />
        <SelectField
          label="Annual Income"
          name="annualIncome"
          options={incomeRanges}
          value={formData.annualIncome || ""}
          onChange={onChange}
        />
      </div>
    </>
  );
};

export default EducationStep;

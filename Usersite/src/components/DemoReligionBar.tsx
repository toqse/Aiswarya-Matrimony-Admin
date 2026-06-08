import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const RELIGIONS = ["Hindu", "Christian", "Muslim"] as const;

export default function DemoReligionBar() {
  const { demoReligionOverride, user, setDemoReligion } = useAuthStore();

  const effectiveReligion = (demoReligionOverride?.trim() || user?.religion?.trim() || "").toLowerCase();

  return (
    <div className="sticky top-0 z-40 w-full bg-slate-800 text-white px-4 flex flex-wrap items-center gap-3 text-sm min-h-[44px]">
      <span className="font-semibold text-slate-200 flex items-center h-9">Demo — religion:</span>
      <div className="flex items-center gap-2 h-9">
        {RELIGIONS.map((r) => {
          const isSelected = effectiveReligion === r.toLowerCase();
          return (
            <button
              key={r}
              type="button"
              onClick={() => setDemoReligion(r)}
              className={cn(
                "px-3 h-8 rounded-full font-medium transition-all inline-flex items-center justify-center",
                isSelected
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              )}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}

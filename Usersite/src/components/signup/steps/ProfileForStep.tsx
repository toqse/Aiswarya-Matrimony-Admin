import { labelClass } from "../SignupFormFields";

const PROFILE_FOR_OPTIONS = [
  { value: "myself", label: "Myself" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "friend", label: "Friend" },
  { value: "relative", label: "Relative" },
] as const;

interface Props {
  profileFor: string;
  onChange: (value: string) => void;
}

const ProfileForStep = ({ profileFor, onChange }: Props) => (
  <>
    <div className="text-center mb-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
        Who are you registering for?
      </h1>
      <p className="text-muted-foreground text-sm">
        Select who you're registering the profile for
      </p>
    </div>
    <div className="space-y-2">
      <label className={labelClass}>Select</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {PROFILE_FOR_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition-all capitalize ${
              profileFor === value
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-soft"
                : "border-primary/10 hover:border-primary/30 text-foreground bg-card"
            }`}
          >
            <span className="text-sm md:text-base font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  </>
);

export default ProfileForStep;

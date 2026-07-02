import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Period = "AM" | "PM";

/** Parses a 24h "HH:mm" (seconds optional) into 12-hour parts. */
function parse24(value: string): { hour: string; minute: string; period: Period } {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || "");
  if (!m) return { hour: "", minute: "", period: "AM" };
  let h = Number(m[1]);
  const minute = m[2];
  const period: Period = h >= 12 ? "PM" : "AM";
  h %= 12;
  if (h === 0) h = 12;
  return { hour: String(h), minute, period };
}

/** Builds a 24h "HH:mm" string from 12-hour parts. */
function to24(hour: number, minute: string, period: Period): string {
  let h = hour % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export interface TimeOfBirthPickerProps {
  /** 24-hour "HH:mm" value (kept for backend compatibility). */
  value: string;
  /** Emits the 24-hour "HH:mm" value, or "" when incomplete. */
  onChange: (value: string) => void;
  id?: string;
}

/**
 * 12-hour time picker (Hour / Minute / AM-PM) that stores the value as a
 * 24-hour "HH:mm" string so the backend payload stays unchanged.
 */
export function TimeOfBirthPicker({ value, onChange, id }: TimeOfBirthPickerProps) {
  const { hour, minute, period } = parse24(value);

  const emit = (h: string, m: string, p: Period) => {
    if (!h || !m) {
      onChange("");
      return;
    }
    onChange(to24(Number(h), m, p));
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={hour} onValueChange={(h) => emit(h, minute || "00", period)}>
        <SelectTrigger className="w-[78px]" id={id} aria-label="Hour">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={minute} onValueChange={(m) => emit(hour || "12", m, period)}>
        <SelectTrigger className="w-[78px]" aria-label="Minute">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(p) => emit(hour || "12", minute || "00", p as Period)}>
        <SelectTrigger className="w-[78px]" aria-label="AM or PM">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

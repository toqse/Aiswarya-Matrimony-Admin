/** Maps "Who is this profile for?" to a fixed gender when relationship implies it. */
export function getGenderFromProfileFor(profileFor: string): {
  locked: boolean;
  gender: "Male" | "Female" | null;
} {
  const p = (profileFor || "").toLowerCase().trim();
  if (p === "son" || p === "brother") return { locked: true, gender: "Male" };
  if (p === "daughter" || p === "sister")
    return { locked: true, gender: "Female" };
  return { locked: false, gender: null };
}

/** Strip parentheses from occupation labels for dropdown display. */
export function displayOccupationName(name: string): string {
  return String(name ?? "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

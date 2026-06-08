import type { HoroscopePrimaryPanel } from "@/lib/astrologyApi";

/**
 * Resolves which API panel is bride vs groom. Match views show bride first, groom second.
 */
export function panelsBrideGroom(
  primary: HoroscopePrimaryPanel,
  partner: HoroscopePrimaryPanel,
  brideProfileId: number,
  groomProfileId: number,
): { bride: HoroscopePrimaryPanel; groom: HoroscopePrimaryPanel } {
  const pick = (id: number): HoroscopePrimaryPanel | null => {
    if (primary.profile_id === id) return primary;
    if (partner.profile_id === id) return partner;
    return null;
  };
  let bride = pick(brideProfileId);
  let groom = pick(groomProfileId);
  if (bride && groom) return { bride, groom };
  const r = (p: HoroscopePrimaryPanel) => (p.role ?? "").toLowerCase();
  if (!bride) {
    if (r(primary).includes("bride")) bride = primary;
    else if (r(partner).includes("bride")) bride = partner;
  }
  if (!groom) {
    if (r(primary).includes("groom")) groom = primary;
    else if (r(partner).includes("groom")) groom = partner;
  }
  return { bride: bride ?? primary, groom: groom ?? partner };
}

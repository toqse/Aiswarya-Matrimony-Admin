export const ADMIN_PROFILE_FOR_OPTIONS = [
  "Myself",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Friend",
  "Relative",
  "Staff",
] as const;

export type AdminProfileForOption = (typeof ADMIN_PROFILE_FOR_OPTIONS)[number];

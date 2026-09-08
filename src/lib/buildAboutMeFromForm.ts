/**
 * Client-side About Me templates matching Backend/profiles/utils.py
 * generate_about_me / generate_about_me_suggestions (for Add Profile before user exists).
 */

export interface AboutMeFormLabels {
  city?: string;
  state?: string;
  education?: string;
  occupation?: string;
  religion?: string;
  motherTongue?: string;
  maritalStatus?: string;
  height?: string;
}

const CLOSING =
  "I value honesty and strong family relationships and look forward to finding a caring life partner.";

const INCOMPLETE = "Complete your profile to generate About Me.";

function clean(value?: string): string {
  return String(value ?? "").trim();
}

export function buildAboutMeFromLabels(labels: AboutMeFormLabels): string {
  const city = clean(labels.city);
  const state = clean(labels.state);
  const education = clean(labels.education);
  const occupation = clean(labels.occupation);
  const religion = clean(labels.religion);
  const motherTongue = clean(labels.motherTongue);
  const maritalStatus = clean(labels.maritalStatus);
  const height = clean(labels.height);

  const parts: string[] = [];

  if (city && state) {
    parts.push(`I am a family-oriented person currently based in ${city}, ${state}.`);
  } else if (city) {
    parts.push(`I am a family-oriented person currently based in ${city}.`);
  } else if (state) {
    parts.push(`I am a family-oriented person currently based in ${state}.`);
  }

  if (education) parts.push(`I have completed my ${education}.`);
  if (occupation) parts.push(`I work as a ${occupation}.`);
  if (religion) parts.push(`I belong to a ${religion} family.`);
  if (motherTongue) parts.push(`My mother tongue is ${motherTongue}.`);
  if (maritalStatus) parts.push(`I am ${maritalStatus}.`);
  if (height) parts.push(`My height is ${height}.`);

  parts.push(CLOSING);
  return parts.length ? parts.join(" ") : INCOMPLETE;
}

export function buildAboutMeSuggestionsFromLabels(labels: AboutMeFormLabels): string[] {
  const city = clean(labels.city);
  const state = clean(labels.state);
  const education = clean(labels.education);
  const occupation = clean(labels.occupation);
  const religion = clean(labels.religion);
  const motherTongue = clean(labels.motherTongue);

  const main = buildAboutMeFromLabels(labels);
  const suggestions = [main];

  const parts2: string[] = [];
  if (education) parts2.push(`I have completed my ${education}.`);
  if (occupation) parts2.push(`I work as a ${occupation}.`);
  if (city && state) parts2.push(`I am currently based in ${city}, ${state}.`);
  else if (city) parts2.push(`I am currently based in ${city}.`);
  if (religion) parts2.push(`I belong to a ${religion} family.`);
  if (motherTongue) parts2.push(`My mother tongue is ${motherTongue}.`);
  parts2.push(CLOSING);
  if (parts2.length) suggestions.push(parts2.join(" "));

  const parts3: string[] = [];
  if (city && state) {
    parts3.push(`Based in ${city}, ${state}, I am a family-oriented person.`);
  }
  if (religion) parts3.push(`I belong to a ${religion} family.`);
  if (motherTongue) parts3.push(`My mother tongue is ${motherTongue}.`);
  if (education && occupation) {
    parts3.push(`I have completed my ${education} and work as a ${occupation}.`);
  } else if (education) {
    parts3.push(`I have completed my ${education}.`);
  } else if (occupation) {
    parts3.push(`I work as a ${occupation}.`);
  }
  parts3.push(CLOSING);
  if (parts3.length) suggestions.push(parts3.join(" "));

  return suggestions.slice(0, 3);
}

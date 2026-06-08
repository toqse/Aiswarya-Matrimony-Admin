/**
 * Education subjects (15 options from admin — matches API / subject master).
 */
export const EDUCATION_SUBJECT_OPTIONS = [
  "Arts",
  "Biology",
  "Business Administration",
  "Chemistry",
  "Civil",
  "Commerce",
  "Computer Science",
  "Electrical",
  "Electronics",
  "Information Technology",
  "Mathematics",
  "Mechanical",
  "Other",
  "Physics",
  "Science",
] as const;

export type EducationSubjectOption = (typeof EDUCATION_SUBJECT_OPTIONS)[number];

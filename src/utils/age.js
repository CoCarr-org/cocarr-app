// Age rules for onboarding. Mirrors the web app's src/lib/age.js — both must
// agree with the server, which enforces the same minimum.
//
// 18 is the legal minimum to hold a driving licence in India, so anyone younger
// cannot complete this flow regardless of what else they submit.

export const MIN_AGE = 18;
export const MAX_AGE = 100;

// Whole years by calendar, not by dividing milliseconds. The naive
// `(now - dob) / 365.25 days` version reports 17 for someone who turned 18 this
// morning — a rejection the user cannot understand or act on.
export function ageInYears(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

// LOCAL calendar fields, not toISOString(). The latter converts to UTC, which in
// IST rolls the date back a day before 05:30 — making the picker's bound
// disagree with the validator about the same boundary.
export const toLocalIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Latest DOB that is still 18 — the native picker's `maximumDate`.
export function maxDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
}

export function minDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE);
  return d;
}

// Returns an error string, or null when acceptable.
export function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return 'Date of birth is required';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 'Enter a valid date of birth';
  if (dob > new Date()) return 'Date of birth cannot be in the future';

  const age = ageInYears(dateOfBirth);
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} years old to use Cocarr`;
  if (age > MAX_AGE) return 'Enter a valid date of birth';
  return null;
}

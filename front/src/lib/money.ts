/**
 * Money is stored as integer minor units plus a currency code on the same row
 * (00-CONTEXT rule 8). `teacher_profiles.hourly_rate_minor` is centimes and
 * `teacher_profiles.currency` is a `char(3)` defaulting to `DZD`.
 *
 * The mocks print a hardcoded "MAD", which is Morocco. Never hardcode a
 * currency at a call site: read the one on the row so the open currency
 * question in 00-CONTEXT stays cheap to reverse.
 */

export type FormattedAmount = {
  /** The number alone, grouped for French display: "220", "1 500". */
  amount: string;
  /** The row's own currency code, e.g. "DZD". */
  currency: string;
};

const formatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 22000 centimes -> { amount: "220", currency: "DZD" }. Null stays null. */
export function formatMinorAmount(
  minor: number | null | undefined,
  currency: string | null | undefined,
): FormattedAmount | null {
  if (minor === null || minor === undefined) return null;
  return {
    amount: formatter.format(minor / 100),
    currency: (currency ?? "DZD").toUpperCase(),
  };
}

/** "220 DZD/h", or null when the teacher has not set a rate yet. */
export function formatHourlyRate(
  minor: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  const formatted = formatMinorAmount(minor, currency);
  return formatted ? `${formatted.amount} ${formatted.currency}/h` : null;
}

/**
 * Parse what the teacher typed into the hourly-rate field. The input is major
 * units ("220", "220,50"), the column is minor units. Returns null for empty,
 * which clears the rate.
 */
export function parseMajorToMinor(input: string): number | null | "invalid" {
  const trimmed = input.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "invalid";
  const major = Number.parseFloat(trimmed);
  if (!Number.isFinite(major)) return "invalid";
  return Math.round(major * 100);
}

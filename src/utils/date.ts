/**
 * Date utility functions for parsing, formatting, sorting,
 * and calculating Financial Years (FY).
 */

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try direct date parsing (e.g. ISO format "YYYY-MM-DD")
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime()) && dateStr.includes("-")) {
    return direct;
  }

  // Handle "DD MMM YYYY" e.g., "09 Oct 2025" or "06 Jul 2026"
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const year = parseInt(parts[2], 10);
    
    const months: { [key: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    if (!isNaN(day) && !isNaN(year) && months[monthStr] !== undefined) {
      return new Date(year, months[monthStr], day);
    }
  }

  return new Date(dateStr);
}

/**
 * Returns the Financial Year string (e.g., "2025-26") for a given date string.
 * Financial Year is defined from April 1 to March 31.
 */
export function getFinancialYear(dateStr: string): string {
  const date = parseDate(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr

  if (month >= 3) {
    // April to December: FY is Year to (Year + 1)
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year}-${nextYearShort}`;
  } else {
    // January to March: FY is (Year - 1) to Year
    const prevYear = year - 1;
    const yearShort = year.toString().slice(-2);
    return `${prevYear}-${yearShort}`;
  }
}

/**
 * Returns the current financial year based on today's date
 */
export function getCurrentFinancialYear(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Formats a JS Date object into "DD MMM YYYY" format
 */
export function formatDateToString(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Standard sorting of items with a .date property chronologically (oldest first)
 */
export function sortByDateAsc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });
}

/**
 * Standard sorting of items with a .date property chronologically (newest first)
 */
export function sortByDateDesc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    return parseDate(b.date).getTime() - parseDate(a.date).getTime();
  });
}

/**
 * Returns month indices (0 for April, 11 for March) for grouping by selected FY
 */
export function getFYMonthIndex(dateStr: string): number {
  const date = parseDate(dateStr);
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  
  // April is index 0 in FY
  // Jan is index 9, Feb is 10, Mar is 11
  const fyMonths = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];
  return fyMonths.indexOf(month);
}

export const FY_MONTH_LABELS = [
  "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
];

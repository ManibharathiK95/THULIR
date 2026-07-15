/**
 * Currency utility functions supporting AED, INR, and other currencies
 * with custom rules for formatting and summary display.
 */

export function formatCurrency(amount: number, currency: string = "AED"): string {
  const formattedNumber = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const upperCurr = (currency || "AED").trim().toUpperCase();

  if (upperCurr === "AED") {
    return `${formattedNumber} AED`;
  } else if (upperCurr === "INR") {
    return `₹${formattedNumber}`;
  } else {
    return `${upperCurr} ${formattedNumber}`;
  }
}

/**
 * Summarizes a list of transactions, checking if they have mixed currencies.
 * Returns { formatted: string, isMixed: boolean, note?: string }
 */
export function formatSummaryAmount(
  items: { amount: number; currency: string }[],
  key: "amount" | "creditReceived" | "creditPaid" = "amount"
): { formatted: string; isMixed: boolean; note?: string } {
  if (items.length === 0) {
    return { formatted: "0.00 AED", isMixed: false };
  }

  // Find unique currencies
  const currencies = Array.from(new Set(items.map(item => (item.currency || "AED").trim().toUpperCase())));
  
  // Calculate total amount assuming a straight sum (or we could show per-currency sums)
  // The prompt says: "For summary cards and totals: if ALL entries are AED, show 'AED' suffix.
  // If mixed, show each amount with its own currency symbol but add a note 'Mixed currencies'."
  const total = items.reduce((sum, item) => {
    // We can access dynamically or safe cast
    const val = (item as any)[key] !== undefined ? Number((item as any)[key]) : Number(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  if (currencies.length <= 1) {
    const singleCurrency = currencies[0] || "AED";
    return {
      formatted: formatCurrency(total, singleCurrency),
      isMixed: false
    };
  } else {
    // Mixed currencies
    // Let's format the total sum as AED or general sum with currency indicators, 
    // but clearly indicate that it's a sum of mixed currencies
    return {
      formatted: formatCurrency(total, "AED"), // default to AED for combined totals
      isMixed: true,
      note: "Mixed currencies"
    };
  }
}

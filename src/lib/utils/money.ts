/**
 * Financial & Currency Helpers for Integer Poisha System
 * 100 poisha = ৳1.00 BDT
 * 1500 basis points = 15% VAT
 */

/**
 * Converts integer poisha to BDT Taka decimal
 */
export function poishaToTaka(poisha: number): number {
  if (typeof poisha !== "number" || isNaN(poisha)) return 0;
  return poisha / 100;
}

/**
 * Converts BDT Taka to integer poisha
 */
export function takaToPoisha(taka: number): number {
  if (typeof taka !== "number" || isNaN(taka)) return 0;
  return Math.round(taka * 100);
}

/**
 * Formats integer poisha directly to formatted BDT currency string
 * e.g. 230500 -> "৳ 2,305.00"
 */
export function formatPoisha(poisha: number, includeDecimals = true): string {
  const taka = poishaToTaka(poisha);
  return `৳ ${taka.toLocaleString("en-BD", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formats integer VAT basis points to percentage
 * e.g. 1500 -> "15%"
 */
export function formatVatRate(basisPoints: number): string {
  if (!basisPoints) return "0%";
  return `${(basisPoints / 100).toFixed(basisPoints % 100 === 0 ? 0 : 2)}%`;
}

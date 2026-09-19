import { parseUnits } from "@/lib/money";

/** Demo-data helper: usdc("42.5") -> "42500000", the base-unit string the API would send. */
export function usdc(amount: string): string {
  return parseUnits(amount).toString();
}

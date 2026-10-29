import Decimal from "decimal.js"

export function formatEth(value: string): string {
  const d = new Decimal(value)
  return d.decimalPlaces() < 2 ? d.toFixed(2) : d.toFixed()
}
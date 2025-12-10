// Utility to format numbers as Vietnamese Dong (e.g. 15000 -> "15.000đ")
export default function formatVND(value) {
  if (value === null || value === undefined || value === "") return "N/A"
  const n = Number(value)
  if (!isFinite(n)) return "N/A"
  // Round to nearest integer (no decimals for VND display)
  const int = Math.round(n)
  // Insert dot as thousand separator
  const withSep = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withSep}đ`
}

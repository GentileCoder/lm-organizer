/**
 * Monthly-savings-plan compound growth — ported from extra/sparplan_rechner.html.
 * Nominal values, monthly compounding (annual rate / 12), contribution at month-end.
 * Does not account for inflation, taxes, or fees — not investment advice.
 */
export function computeSparplanSeries({ monthly, annualRate, years }) {
  const i = annualRate / 100 / 12
  const points = []
  for (let y = 0; y <= years; y++) {
    const k = y * 12
    const endCapital = Math.abs(i) < 1e-9 ? monthly * k : monthly * ((Math.pow(1 + i, k) - 1) / i)
    points.push({ year: y, endCapital, contributed: monthly * k })
  }
  return points
}

/** Rounds a chart's max value up to a "nice" step (1/2/5 × a power of 10) for gridlines. */
export function niceMax(v) {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const norm = v / mag
  let step
  if (norm <= 1) step = 1
  else if (norm <= 2) step = 2
  else if (norm <= 5) step = 5
  else step = 10
  return step * mag
}
